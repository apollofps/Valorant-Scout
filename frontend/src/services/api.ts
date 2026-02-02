import type { Team, TeamSearchResponse, ReportStatusResponse, ScoutingReport } from '../types';

// Use VITE_API_URL in production when frontend and backend are on different hosts
const API_BASE = import.meta.env.VITE_API_URL?.replace(/\/$/, '') || '/api';

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
    throw new ApiError(response.status, error.detail || 'Request failed');
  }

  return response.json();
}

// Tournament type
export interface Tournament {
  id: string;
  name: string;
}

// Team endpoints
export async function getTournaments(): Promise<{ tournaments: Tournament[] }> {
  return fetchJson<{ tournaments: Tournament[] }>(`${API_BASE}/teams/tournaments`);
}

export async function searchTeams(query: string): Promise<TeamSearchResponse> {
  return fetchJson<TeamSearchResponse>(`${API_BASE}/teams/search?q=${encodeURIComponent(query)}`);
}

export async function getTeam(teamId: string): Promise<Team> {
  return fetchJson<Team>(`${API_BASE}/teams/${teamId}`);
}

export async function getTeamMatches(teamId: string, limit = 10, tournamentId?: string) {
  const params = new URLSearchParams({ limit: String(limit) });
  if (tournamentId) params.append('tournament_id', tournamentId);
  return fetchJson(`${API_BASE}/teams/${teamId}/matches?${params}`);
}

// Report endpoints
export interface GenerateReportRequest {
  team_id: string;
  n_matches?: number;
  maps?: string[];
  tournament_id?: string;
}

export async function generateReport(request: GenerateReportRequest): Promise<{ report_id: string; status: string }> {
  return fetchJson(`${API_BASE}/reports/generate`, {
    method: 'POST',
    body: JSON.stringify(request),
  });
}

export async function getReportStatus(reportId: string): Promise<ReportStatusResponse> {
  return fetchJson<ReportStatusResponse>(`${API_BASE}/reports/${reportId}`);
}

// Polling helper for report generation. Returns report and optional memory/timing profile.
export async function pollReportStatus(
  reportId: string,
  onProgress: (progress: number, stage?: string) => void,
  interval = 1000
): Promise<ScoutingReport> {
  return new Promise((resolve, reject) => {
    const poll = async () => {
      try {
        const status = await getReportStatus(reportId);
        onProgress(status.progress, status.stage);

        if (status.status === 'completed' && status.report) {
          resolve(status.report);
        } else if (status.status === 'failed') {
          reject(new Error(status.error || 'Report generation failed'));
        } else {
          setTimeout(poll, interval);
        }
      } catch (error) {
        reject(error);
      }
    };

    poll();
  });
}

// SSE streaming helper
export function streamReport(
  reportId: string,
  onProgress: (data: { status: string; progress: number }) => void,
  onComplete: (report: ScoutingReport) => void,
  onError: (error: string) => void
): () => void {
  const eventSource = new EventSource(`${API_BASE}/reports/${reportId}/stream`);

  eventSource.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      
      if (data.error) {
        onError(data.error);
        eventSource.close();
      } else if (data.report) {
        onComplete(data.report);
        eventSource.close();
      } else {
        onProgress({ status: data.status, progress: data.progress });
      }
    } catch {
      console.error('Failed to parse SSE data');
    }
  };

  eventSource.onerror = () => {
    onError('Connection lost');
    eventSource.close();
  };

  return () => eventSource.close();
}

// Refresh key insights with fresh LLM generation
export async function refreshInsights(reportId: string): Promise<{ insights: string[] }> {
  return fetchJson<{ insights: string[] }>(`${API_BASE}/reports/${reportId}/refresh-insights`, {
    method: 'POST',
  });
}
