"""Report generation endpoints."""
import uuid
from typing import Optional

from fastapi import APIRouter, HTTPException, BackgroundTasks
from fastapi.responses import StreamingResponse
from loguru import logger
from pydantic import BaseModel

from app.models.report import ScoutingReport, ReportStatus, ReportRequest
from app.services.grid_client import GridClient
from app.services.data_processor import DataProcessor
from app.services.report_generator import ReportGenerator

router = APIRouter()

# In-memory storage for reports (use Redis in production)
reports_store: dict[str, dict] = {}


class GenerateReportRequest(BaseModel):
    """Request body for report generation."""
    team_id: str
    n_matches: int = 10
    maps: Optional[list[str]] = None
    tournament_id: Optional[str] = None  # Filter to specific tournament


class ReportStatusResponse(BaseModel):
    """Response for report status check."""
    report_id: str
    status: ReportStatus
    progress: int = 0
    stage: str = ""  # Current stage description
    report: Optional[ScoutingReport] = None
    error: Optional[str] = None


@router.post("/generate")
async def generate_report(
    request: GenerateReportRequest,
    background_tasks: BackgroundTasks
):
    """
    Start generating a scouting report for a team.
    
    Returns immediately with a report_id. Poll the status endpoint
    or use the streaming endpoint for real-time updates.
    """
    report_id = str(uuid.uuid4())
    
    logger.info(f"Starting report generation {report_id} for team {request.team_id}")
    
    # Initialize report status
    reports_store[report_id] = {
        "status": ReportStatus.PROCESSING,
        "progress": 0,
        "stage": "Initializing...",
        "team_id": request.team_id,
        "n_matches": request.n_matches,
        "maps": request.maps,
        "tournament_id": request.tournament_id,
        "report": None,
        "error": None
    }
    
    # Start background processing
    background_tasks.add_task(
        process_report,
        report_id,
        request.team_id,
        request.n_matches,
        request.maps,
        request.tournament_id
    )
    
    return {"report_id": report_id, "status": "processing"}


def update_progress(report_id: str, progress: int, stage: str):
    """Helper to update progress and stage together."""
    reports_store[report_id]["progress"] = progress
    reports_store[report_id]["stage"] = stage
    logger.info(f"Report {report_id}: {progress}% - {stage}")


async def process_report(
    report_id: str,
    team_id: str,
    n_matches: int,
    maps: Optional[list[str]],
    tournament_id: Optional[str] = None
):
    """Background task to generate the report."""
    try:
        # Step 1: Fetch team data
        update_progress(report_id, 5, "Connecting to GRID API...")
        async with GridClient() as client:
            update_progress(report_id, 10, "Fetching team details...")
            team = await client.get_team_details(team_id)
            
            update_progress(report_id, 15, f"Loading match history for {team.name}...")
            matches = await client.get_team_matches(team_id, n_matches, tournament_id)
            
            tournament_name = None
            if tournament_id:
                tournaments = await client.get_available_tournaments()
                tournament_name = next(
                    (t["name"] for t in tournaments if t["id"] == tournament_id), 
                    None
                )
                logger.info(f"Filtering to tournament: {tournament_name}")
            
            update_progress(report_id, 20, f"Found {len(matches)} matches to analyze...")
            
            # Step 1.5: Fetch and PARSE detailed events from File Download API
            detailed_events = []
            file_download_available = 0
            total_matches = len(matches)
            
            for i, match in enumerate(matches):
                # Update progress for each match (20-40% range)
                match_progress = 20 + int((i / max(total_matches, 1)) * 20)
                update_progress(report_id, match_progress, f"Downloading match data ({i+1}/{total_matches})...")
                
                try:
                    events = await client.get_series_events(match.id)
                    if events:
                        file_download_available += 1
                        parsed = client.parse_site_tendencies_from_events(events, team_id)
                        detailed_events.append(parsed)
                        kill_count = len(parsed.get('kill_positions', []))
                        econ_count = len(parsed.get('economy_rounds', []))
                        logger.info(f"✓ Series {match.id}: {kill_count} kills, {econ_count} econ rounds")
                    else:
                        logger.warning(f"✗ Series {match.id}: File Download not available (403 or no files)")
                except Exception as e:
                    logger.warning(f"Failed to get events for match {match.id}: {e}")
            
            if detailed_events:
                logger.info(f"Successfully fetched File Download data for {file_download_available}/{len(matches)} matches")
            else:
                logger.warning(f"File Download not available for any of the {len(matches)} matches - position data unavailable")
        
        update_progress(report_id, 40, "Processing match data...")
        
        # Extract current roster with IDs for proper matching
        update_progress(report_id, 45, "Identifying current roster...")
        current_roster = {}
        if team.players:
            for p in team.players:
                current_roster[p.id] = {
                    "name": p.nickname,
                    "profile_image_url": p.profile_image_url
                }
        logger.info(f"Current roster for {team.name}: {[v['name'] for v in current_roster.values()]}")
        
        # Step 2: Process data and extract patterns
        update_progress(report_id, 50, "Analyzing player statistics...")
        processor = DataProcessor()
        analysis = processor.analyze_matches(
            matches, 
            team_id, 
            maps, 
            current_roster if current_roster else None,
            detailed_events if detailed_events else None
        )
        
        update_progress(report_id, 55, "Calculating map win rates...")
        update_progress(report_id, 60, "Processing agent compositions...")
        update_progress(report_id, 65, "Analyzing economy patterns...")
        
        # Step 3: Generate report with LLM (this is the slow part)
        update_progress(report_id, 70, "AI is generating tactical briefing...")
        generator = ReportGenerator()
        report = await generator.generate(team, analysis, tournament_name or "")
        
        update_progress(report_id, 85, "Validating AI insights...")
        
        # Ensure tactical briefing was generated with content
        if not report.tactical_briefing:
            logger.warning(f"Tactical briefing is None for report {report_id}, generating...")
            update_progress(report_id, 88, "Regenerating tactical analysis...")
            data_context = generator._prepare_context(team, analysis)
            report.tactical_briefing = await generator.generate_tactical_briefing(team, analysis, data_context, tournament_name or "")
        elif not report.tactical_briefing.team_identity:
            logger.warning(f"Tactical briefing has empty team_identity for report {report_id}, regenerating...")
            update_progress(report_id, 88, "Enhancing tactical analysis...")
            data_context = generator._prepare_context(team, analysis)
            report.tactical_briefing = await generator.generate_tactical_briefing(team, analysis, data_context, tournament_name or "")
        
        # Final check - if still empty, use minimal fallback
        if report.tactical_briefing and not report.tactical_briefing.team_identity:
            logger.error(f"Tactical briefing still empty after regeneration, using minimal fallback")
            from app.models.report import TacticalBriefing
            report.tactical_briefing.team_identity = f"Analysis for {team.name} based on {analysis.matches_analyzed} matches. Review the data sections below for detailed insights."
            report.tactical_briefing.playstyle_summary = report.tactical_briefing.team_identity

        update_progress(report_id, 95, "Preparing visualizations...")
        update_progress(report_id, 100, "Report complete!")
        reports_store[report_id]["status"] = ReportStatus.COMPLETED
        reports_store[report_id]["report"] = report
        
        logger.info(f"Report {report_id} completed successfully")
        
    except Exception as e:
        logger.error(f"Report {report_id} failed: {e}")
        reports_store[report_id]["status"] = ReportStatus.FAILED
        reports_store[report_id]["error"] = str(e)


@router.get("/{report_id}", response_model=ReportStatusResponse)
async def get_report_status(report_id: str):
    """
    Check the status of a report generation request.
    
    Returns the full report when complete.
    """
    if report_id not in reports_store:
        raise HTTPException(status_code=404, detail="Report not found")
    
    data = reports_store[report_id]
    return ReportStatusResponse(
        report_id=report_id,
        status=data["status"],
        progress=data["progress"],
        stage=data.get("stage", ""),
        report=data.get("report"),
        error=data.get("error")
    )


@router.get("/{report_id}/stream")
async def stream_report(report_id: str):
    """
    Stream report generation progress in real-time.
    
    Uses Server-Sent Events for live updates.
    """
    if report_id not in reports_store:
        raise HTTPException(status_code=404, detail="Report not found")
    
    async def event_generator():
        import asyncio
        import json
        
        while True:
            data = reports_store.get(report_id)
            if not data:
                yield f"data: {json.dumps({'error': 'Report not found'})}\n\n"
                break
            
            # Handle both enum and string status
            status_value = data['status'].value if hasattr(data['status'], 'value') else str(data['status'])
            yield f"data: {json.dumps({'status': status_value, 'progress': data['progress'], 'stage': data.get('stage', '')})}\n\n"
            
            if data["status"] in [ReportStatus.COMPLETED, ReportStatus.FAILED]:
                if data["status"] == ReportStatus.COMPLETED and data["report"]:
                    yield f"data: {json.dumps({'report': data['report'].model_dump()})}\n\n"
                elif data["error"]:
                    yield f"data: {json.dumps({'error': data['error']})}\n\n"
                break
            
            await asyncio.sleep(1)
    
    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream"
    )


class RefreshInsightsRequest(BaseModel):
    """Request to refresh key insights."""
    report_id: str


class RefreshInsightsResponse(BaseModel):
    """Response with new key insights."""
    insights: list[str]


@router.post("/{report_id}/refresh-insights", response_model=RefreshInsightsResponse)
async def refresh_key_insights(report_id: str):
    """
    Regenerate key insights using LLM for fresh, unique tactical advice.
    
    This calls the LLM again with high temperature and variation parameters
    to generate completely new insights based on the existing report data.
    """
    if report_id not in reports_store:
        raise HTTPException(status_code=404, detail="Report not found")
    
    data = reports_store[report_id]
    report = data.get("report")
    
    if not report:
        raise HTTPException(status_code=400, detail="Report not yet generated")
    
    try:
        # Prepare context from the existing report data
        context = {
            "team_name": report.team_name,
            "region": None,  # Not stored in report
            "matches_analyzed": report.matches_analyzed,
            "win_rate": f"{sum(s.get('map_win_rate', 0) for s in (report.site_tendencies or {}).values()) / max(len(report.site_tendencies or {}), 1) * 100:.1f}%",
            "map_win_rates": {k: f"{v.get('map_win_rate', 0) * 100:.1f}%" for k, v in (report.site_tendencies or {}).items()},
            "agent_tendencies": report.agent_tendencies.model_dump() if report.agent_tendencies else {},
            "site_tendencies": report.site_tendencies or {},
            "economy_patterns": report.economy_patterns.model_dump() if report.economy_patterns else {},
            "player_stats": report.player_tendencies or {},
            "exploitable_patterns": report.exploitable_patterns.model_dump() if report.exploitable_patterns else {}
        }
        
        # Generate fresh insights
        generator = ReportGenerator()
        new_insights = await generator._generate_key_insights(context)
        
        # Update the stored report
        report.key_insights = new_insights
        reports_store[report_id]["report"] = report
        
        logger.info(f"Regenerated {len(new_insights)} insights for report {report_id}")
        
        return RefreshInsightsResponse(insights=new_insights)
        
    except Exception as e:
        logger.error(f"Failed to refresh insights: {e}")
        raise HTTPException(status_code=500, detail=str(e))
