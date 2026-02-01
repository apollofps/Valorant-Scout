import { useState, useMemo, useEffect } from 'react';
import type { KillPosition, MapBounds } from '../types';

interface MapHeatmapProps {
  mapName: string;
  kills: KillPosition[];
  bounds?: MapBounds;  // Official bounds from GRID API
  teamName?: string;
}

// Actual VALORANT minimap images from valorant-api.com
const MAP_IMAGES: Record<string, string> = {
  'ascent': 'https://media.valorant-api.com/maps/7eaecc1b-4337-bbf6-6ab9-04b8f06b3319/displayicon.png',
  'split': 'https://media.valorant-api.com/maps/d960549e-485c-e861-8d71-aa9d1aed12a2/displayicon.png',
  'haven': 'https://media.valorant-api.com/maps/2bee0dc9-4ffe-519b-1cbd-7fbe763a6047/displayicon.png',
  'bind': 'https://media.valorant-api.com/maps/2c9d57ec-4431-9c5e-2939-8f9ef6dd5cba/displayicon.png',
  'icebox': 'https://media.valorant-api.com/maps/e2ad5c54-4114-a870-9641-8ea21279579a/displayicon.png',
  'breeze': 'https://media.valorant-api.com/maps/2fb9a4fd-47b8-4e7d-a969-74b4046ebd53/displayicon.png',
  'fracture': 'https://media.valorant-api.com/maps/b529448b-4d60-346e-e89e-00a4c527a405/displayicon.png',
  'pearl': 'https://media.valorant-api.com/maps/fd267378-4d1d-484f-ff52-77821ed10dc2/displayicon.png',
  'lotus': 'https://media.valorant-api.com/maps/2fe4ed3a-450a-948b-6d6b-e89a78e680a9/displayicon.png',
  'sunset': 'https://media.valorant-api.com/maps/92584fbe-486a-b1b2-9faa-39b0f486b498/displayicon.png',
  'abyss': 'https://media.valorant-api.com/maps/224b0a95-48b9-f703-1bd8-67aca101a61f/displayicon.png',
  'corrode': 'https://media.valorant-api.com/maps/1c18ab1f-420d-0d8b-71d0-77ad3c439115/displayicon.png',
};

// Per-map calibration: how to transform game coordinates to match the minimap image
// rotation: degrees clockwise, flipX/flipY: mirror axes, offsetX/Y: shift, scaleX/Y: stretch
interface MapCalibration {
  rotation: number;      // 0, 90, 180, 270
  flipX: boolean;        // Mirror horizontally
  flipY: boolean;        // Mirror vertically  
  offsetX: number;       // Image X offset (%)
  offsetY: number;       // Image Y offset (%)
  scaleX: number;        // Image X scale (%)
  scaleY: number;        // Image Y scale (%)
}

// These calibrations transform GRID coordinates to match valorant-api.com minimaps
// Calibrated values provided by user testing
const MAP_CALIBRATIONS: Record<string, MapCalibration> = {
  'ascent':   { rotation: 90, flipX: false, flipY: false, offsetX: -6, offsetY: -6, scaleX: 111, scaleY: 118 },
  'split':    { rotation: 90, flipX: false, flipY: false, offsetX: -8, offsetY: -5, scaleX: 119, scaleY: 109 },
  'haven':    { rotation: 90, flipX: false, flipY: false, offsetX: -8, offsetY: -10, scaleX: 116, scaleY: 120 },
  'bind':     { rotation: 90, flipX: false, flipY: false, offsetX: -21, offsetY: -3, scaleX: 130, scaleY: 109 },
  'icebox':   { rotation: 90, flipX: false, flipY: false, offsetX: 0, offsetY: 0, scaleX: 100, scaleY: 100 },
  'breeze':   { rotation: 90, flipX: false, flipY: false, offsetX: 0, offsetY: 0, scaleX: 100, scaleY: 100 },
  'fracture': { rotation: 90, flipX: false, flipY: false, offsetX: 0, offsetY: 0, scaleX: 100, scaleY: 100 },
  'pearl':    { rotation: 90, flipX: false, flipY: false, offsetX: 0, offsetY: 0, scaleX: 100, scaleY: 100 },
  'lotus':    { rotation: 90, flipX: false, flipY: false, offsetX: -9, offsetY: -20, scaleX: 121, scaleY: 137 },
  'sunset':   { rotation: 90, flipX: false, flipY: false, offsetX: -5, offsetY: 0, scaleX: 108, scaleY: 100 },
  'abyss':    { rotation: 90, flipX: false, flipY: false, offsetX: 0, offsetY: 0, scaleX: 100, scaleY: 100 },
  'corrode':  { rotation: 90, flipX: false, flipY: false, offsetX: -6, offsetY: -7, scaleX: 112, scaleY: 115 },
};

const DEFAULT_CALIBRATION: MapCalibration = { 
  rotation: 0, flipX: false, flipY: false, offsetX: 0, offsetY: 0, scaleX: 100, scaleY: 100 
};

export function MapHeatmap({ mapName, kills, bounds, teamName }: MapHeatmapProps) {
  const [showFirstBloods, setShowFirstBloods] = useState(false);
  const [heatmapOpacity, setHeatmapOpacity] = useState(0.8);
  const [showCalibration, setShowCalibration] = useState(false);
  
  const mapKey = mapName.toLowerCase();
  const preset = MAP_CALIBRATIONS[mapKey] || DEFAULT_CALIBRATION;
  
  // Calibration controls - initialize from presets
  const [rotation, setRotation] = useState(preset.rotation);
  const [flipX, setFlipX] = useState(preset.flipX);
  const [flipY, setFlipY] = useState(preset.flipY);
  const [imgOffsetX, setImgOffsetX] = useState(preset.offsetX);
  const [imgOffsetY, setImgOffsetY] = useState(preset.offsetY);
  const [imgScaleX, setImgScaleX] = useState(preset.scaleX);
  const [imgScaleY, setImgScaleY] = useState(preset.scaleY);
  
  // Reset calibration when map changes
  useEffect(() => {
    const newPreset = MAP_CALIBRATIONS[mapKey] || DEFAULT_CALIBRATION;
    setRotation(newPreset.rotation);
    setFlipX(newPreset.flipX);
    setFlipY(newPreset.flipY);
    setImgOffsetX(newPreset.offsetX);
    setImgOffsetY(newPreset.offsetY);
    setImgScaleX(newPreset.scaleX);
    setImgScaleY(newPreset.scaleY);
  }, [mapKey]);
  
  const mapImage = MAP_IMAGES[mapKey];

  // Filter kills
  const filteredKills = useMemo(() => {
    return showFirstBloods ? kills.filter(k => k.is_first_blood) : kills;
  }, [kills, showFirstBloods]);

  // Use official bounds from GRID API, or calculate from data
  const effectiveBounds = useMemo(() => {
    if (bounds && bounds.minX !== undefined) {
      return bounds;
    }
    
    // Fallback: calculate from data
    if (filteredKills.length === 0) return null;
    
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    filteredKills.forEach(k => {
      if (k.x !== undefined && k.y !== undefined) {
        minX = Math.min(minX, k.x);
        maxX = Math.max(maxX, k.x);
        minY = Math.min(minY, k.y);
        maxY = Math.max(maxY, k.y);
      }
    });
    
    if (minX === Infinity) return null;
    
    // Add padding
    const padX = (maxX - minX) * 0.1;
    const padY = (maxY - minY) * 0.1;
    
    return { minX: minX - padX, maxX: maxX + padX, minY: minY - padY, maxY: maxY + padY };
  }, [bounds, filteredKills]);

  // Normalize positions using official bounds with rotation and flip
  const normalizedKills = useMemo(() => {
    if (!effectiveBounds) return [];
    
    const rangeX = effectiveBounds.maxX - effectiveBounds.minX;
    const rangeY = effectiveBounds.maxY - effectiveBounds.minY;
    
    return filteredKills.map(kill => {
      // First normalize to 0-100 range
      let rawX = ((kill.x - effectiveBounds.minX) / rangeX) * 100;
      let rawY = ((kill.y - effectiveBounds.minY) / rangeY) * 100;
      
      // Apply flip (before rotation)
      if (flipX) rawX = 100 - rawX;
      if (flipY) rawY = 100 - rawY;
      
      // Apply rotation to match minimap orientation
      let normX: number, normY: number;
      switch (rotation) {
        case 90:  // 90° clockwise
          normX = rawY;
          normY = 100 - rawX;
          break;
        case 180:  // 180°
          normX = 100 - rawX;
          normY = 100 - rawY;
          break;
        case 270:  // 270° clockwise (90° counter-clockwise)
          normX = 100 - rawY;
          normY = rawX;
          break;
        default:  // 0° - no rotation
          normX = rawX;
          normY = 100 - rawY;  // Flip Y for image coords (game Y is up, image Y is down)
      }
      
      return { 
        ...kill, 
        normX: Math.max(0, Math.min(100, normX)),
        normY: Math.max(0, Math.min(100, normY))
      };
    });
  }, [filteredKills, effectiveBounds, rotation, flipX, flipY]);

  // Create heatmap grid
  const heatmapGrid = useMemo(() => {
    const gridSize = 25;
    const grid: number[][] = Array(gridSize).fill(null).map(() => Array(gridSize).fill(0));
    let maxCount = 1;

    normalizedKills.forEach(kill => {
      const gridX = Math.min(gridSize - 1, Math.max(0, Math.floor(kill.normX / (100 / gridSize))));
      const gridY = Math.min(gridSize - 1, Math.max(0, Math.floor(kill.normY / (100 / gridSize))));
      grid[gridY][gridX]++;
      maxCount = Math.max(maxCount, grid[gridY][gridX]);
    });

    return { grid, maxCount, gridSize };
  }, [normalizedKills]);

  // Find hotspots
  const hotspots = useMemo(() => {
    const { grid, gridSize, maxCount } = heatmapGrid;
    const spots: { x: number; y: number; count: number; intensity: number }[] = [];
    
    for (let y = 0; y < gridSize; y++) {
      for (let x = 0; x < gridSize; x++) {
        if (grid[y][x] >= 2) {
          spots.push({
            x: ((x + 0.5) / gridSize) * 100,
            y: ((y + 0.5) / gridSize) * 100,
            count: grid[y][x],
            intensity: grid[y][x] / maxCount
          });
        }
      }
    }
    
    return spots.sort((a, b) => b.count - a.count).slice(0, 5);
  }, [heatmapGrid]);

  const firstBloodCount = kills.filter(k => k.is_first_blood).length;

  return (
    <div className="glass rounded-xl">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/5">
        <div>
          <h3 className="text-xl font-semibold text-valorant-cream capitalize">{mapName}</h3>
          <p className="text-sm text-valorant-gray">
            {filteredKills.length} {showFirstBloods ? 'first blood' : 'kill'} positions
            {bounds && <span className="text-green-400 ml-2">✓ Calibrated</span>}
          </p>
        </div>
        <button
          onClick={() => setShowFirstBloods(!showFirstBloods)}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
            showFirstBloods 
              ? 'bg-valorant-red text-white shadow-lg shadow-valorant-red/30' 
              : 'bg-surface-200 text-valorant-gray hover:text-valorant-cream hover:bg-surface-100'
          }`}
        >
          {showFirstBloods ? '🎯 First Bloods' : 'All Kills'}
        </button>
      </div>

      {/* Map Container - sized to fit calibrated maps (up to ~140% scale with offsets) */}
      <div className="relative bg-surface-400" style={{ paddingBottom: '115%' }}>
        <div 
          className="absolute"
          style={{ 
            top: '10%',
            left: '12%', 
            right: '5%',
            bottom: '5%',
            border: showCalibration ? '2px dashed rgba(255,70,85,0.5)' : 'none'
          }}
        >
        {/* Map Background - adjustable via calibration, CAN overflow container */}
        {mapImage && (
          <img 
            src={mapImage} 
            alt={`${mapName} map`}
            className="absolute pointer-events-none"
            crossOrigin="anonymous"
            style={{
              width: '100%',
              height: '100%',
              left: `${imgOffsetX}%`,
              top: `${imgOffsetY}%`,
              transform: `scale(${imgScaleX / 100}, ${imgScaleY / 100})`,
              transformOrigin: 'top left',
            }}
          />
        )}

        {/* Simple Kill Dots Overlay - fixed position, heatmap stays put */}
        <svg 
          className="absolute inset-0 w-full h-full pointer-events-none" 
          viewBox="0 0 100 100" 
          preserveAspectRatio="none"
          style={{ opacity: heatmapOpacity }}
        >
          <defs>
            <filter id={`glow-${mapKey}`}>
              <feGaussianBlur stdDeviation="1.5" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          
          {/* Kill dots with glow effect */}
          {normalizedKills.slice(0, 300).map((kill, idx) => (
            <g key={idx}>
              {/* Glow behind */}
              <circle
                cx={kill.normX}
                cy={kill.normY}
                r={kill.is_first_blood ? 2.5 : 1.8}
                fill={kill.is_first_blood ? '#FFD700' : '#FF4655'}
                opacity={0.4}
                filter={`url(#glow-${mapKey})`}
              />
              {/* Main dot */}
              <circle
                cx={kill.normX}
                cy={kill.normY}
                r={kill.is_first_blood ? 1.3 : 0.9}
                fill={kill.is_first_blood ? '#FFD700' : '#FF4655'}
                stroke={kill.is_first_blood ? '#FFF' : 'rgba(255,255,255,0.5)'}
                strokeWidth="0.3"
              />
            </g>
          ))}
          
          {/* Hotspot indicators - circles around high-density areas */}
          {hotspots.slice(0, 3).map((spot, idx) => (
            <g key={`hotspot-${idx}`}>
              <circle
                cx={spot.x}
                cy={spot.y}
                r={3 + spot.intensity * 3}
                fill="none"
                stroke="rgba(255,255,255,0.6)"
                strokeWidth="0.3"
                strokeDasharray="1,1"
              />
              <text
                x={spot.x}
                y={spot.y - 4}
                textAnchor="middle"
                fill="white"
                fontSize="3"
                fontWeight="bold"
                style={{ textShadow: '0 0 3px black' }}
              >
                {spot.count}
              </text>
            </g>
          ))}
        </svg>

        {/* Stats Overlay */}
        <div className="absolute top-3 left-3 bg-black/80 backdrop-blur-sm rounded-lg p-2">
          <div className="text-xl font-bold text-valorant-cream">{filteredKills.length}</div>
          <div className="text-[10px] text-valorant-gray uppercase">{showFirstBloods ? 'First Bloods' : 'Kills'}</div>
        </div>

        {firstBloodCount > 0 && !showFirstBloods && (
          <div className="absolute top-3 right-3 bg-amber-500/90 backdrop-blur-sm rounded-lg px-2 py-1">
            <div className="text-lg font-bold text-black">{firstBloodCount}</div>
            <div className="text-[10px] text-black/70 uppercase">First Bloods</div>
          </div>
        )}

        {/* Controls */}
        <div className="absolute bottom-3 left-3 right-3 flex items-center gap-3 bg-black/80 backdrop-blur-sm rounded-lg px-3 py-2">
          {/* Opacity */}
          <span className="text-[9px] text-valorant-gray uppercase">Opacity</span>
          <input
            type="range"
            min="0"
            max="100"
            value={heatmapOpacity * 100}
            onChange={(e) => setHeatmapOpacity(Number(e.target.value) / 100)}
            className="w-16 h-1 bg-surface-200 rounded-lg appearance-none cursor-pointer accent-valorant-red"
          />
          
          {/* Current config display */}
          <span className="text-[8px] text-valorant-gray font-mono">
            {rotation}° {flipX ? 'fX' : ''} {flipY ? 'fY' : ''}
          </span>
          
          {/* Calibration toggle */}
          <button
            onClick={() => setShowCalibration(!showCalibration)}
            className={`ml-auto px-3 py-1 rounded text-[9px] font-medium transition-all ${
              showCalibration 
                ? 'bg-amber-500 text-black' 
                : 'bg-surface-200 text-valorant-gray hover:bg-surface-100'
            }`}
          >
            {showCalibration ? '✓ Calibrating' : '⚙️ Calibrate'}
          </button>
        </div>
        
        {/* Calibration Panel - Adjust MAP IMAGE position/size */}
        {showCalibration && (
          <div className="absolute top-3 right-3 bg-black/95 backdrop-blur-sm rounded-lg p-3 w-56 space-y-2 z-10 max-h-[90%] overflow-y-auto">
            <div className="text-[10px] text-amber-400 font-medium uppercase">🎯 Calibrate for {mapName}</div>
            
            {/* Bounds Info */}
            {effectiveBounds && (
              <div className="text-[8px] text-valorant-gray bg-surface-400 p-1.5 rounded">
                <div className="font-medium text-valorant-cream mb-1">GRID Bounds:</div>
                <div>X: {effectiveBounds.minX?.toFixed(0)} → {effectiveBounds.maxX?.toFixed(0)}</div>
                <div>Y: {effectiveBounds.minY?.toFixed(0)} → {effectiveBounds.maxY?.toFixed(0)}</div>
              </div>
            )}
            
            {/* Flip Controls */}
            <div className="flex gap-2">
              <button
                onClick={() => setFlipX(!flipX)}
                className={`flex-1 py-1.5 text-[9px] font-medium rounded ${
                  flipX ? 'bg-amber-500 text-black' : 'bg-surface-200 text-valorant-gray'
                }`}
              >
                Flip X {flipX ? '✓' : ''}
              </button>
              <button
                onClick={() => setFlipY(!flipY)}
                className={`flex-1 py-1.5 text-[9px] font-medium rounded ${
                  flipY ? 'bg-amber-500 text-black' : 'bg-surface-200 text-valorant-gray'
                }`}
              >
                Flip Y {flipY ? '✓' : ''}
              </button>
            </div>
            
            {/* Rotation */}
            <div>
              <div className="text-[9px] text-valorant-gray mb-1">Rotation</div>
              <div className="flex gap-1">
                {[0, 90, 180, 270].map((deg) => (
                  <button
                    key={deg}
                    onClick={() => setRotation(deg)}
                    className={`flex-1 py-1 text-[9px] font-medium rounded ${
                      rotation === deg 
                        ? 'bg-amber-500 text-black' 
                        : 'bg-surface-200 text-valorant-gray hover:bg-surface-100'
                    }`}
                  >
                    {deg}°
                  </button>
                ))}
              </div>
            </div>
            
            {/* Offset X */}
            <div>
              <div className="flex justify-between text-[9px] text-valorant-gray mb-1">
                <span>Image X</span>
                <span className="font-mono text-valorant-cream">{imgOffsetX}%</span>
              </div>
              <input
                type="range"
                min="-100"
                max="100"
                value={imgOffsetX}
                onChange={(e) => setImgOffsetX(Number(e.target.value))}
                className="w-full h-1 bg-surface-200 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
            </div>
            
            {/* Offset Y */}
            <div>
              <div className="flex justify-between text-[9px] text-valorant-gray mb-1">
                <span>Image Y</span>
                <span className="font-mono text-valorant-cream">{imgOffsetY}%</span>
              </div>
              <input
                type="range"
                min="-100"
                max="100"
                value={imgOffsetY}
                onChange={(e) => setImgOffsetY(Number(e.target.value))}
                className="w-full h-1 bg-surface-200 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
            </div>
            
            {/* Scale X */}
            <div>
              <div className="flex justify-between text-[9px] text-valorant-gray mb-1">
                <span>Width</span>
                <span className="font-mono text-valorant-cream">{imgScaleX}%</span>
              </div>
              <input
                type="range"
                min="20"
                max="400"
                value={imgScaleX}
                onChange={(e) => setImgScaleX(Number(e.target.value))}
                className="w-full h-1 bg-surface-200 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
            </div>
            
            {/* Scale Y */}
            <div>
              <div className="flex justify-between text-[9px] text-valorant-gray mb-1">
                <span>Height</span>
                <span className="font-mono text-valorant-cream">{imgScaleY}%</span>
              </div>
              <input
                type="range"
                min="20"
                max="400"
                value={imgScaleY}
                onChange={(e) => setImgScaleY(Number(e.target.value))}
                className="w-full h-1 bg-surface-200 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
            </div>
            
            {/* Reset button */}
            <button
              onClick={() => {
                const p = MAP_CALIBRATIONS[mapKey] || DEFAULT_CALIBRATION;
                setRotation(p.rotation);
                setFlipX(p.flipX);
                setFlipY(p.flipY);
                setImgOffsetX(p.offsetX);
                setImgOffsetY(p.offsetY);
                setImgScaleX(p.scaleX);
                setImgScaleY(p.scaleY);
              }}
              className="w-full py-1.5 bg-surface-200 text-valorant-gray text-[9px] rounded hover:bg-surface-100"
            >
              Reset to Preset
            </button>
            
            {/* Export values */}
            <div className="pt-2 border-t border-white/10">
              <div className="text-[8px] text-valorant-gray mb-1">📋 Copy this config:</div>
              <code className="block text-[8px] text-green-400 bg-surface-400 p-2 rounded font-mono break-all select-all">
                '{mapKey}': {"{"} rotation: {rotation}, flipX: {flipX.toString()}, flipY: {flipY.toString()}, offsetX: {imgOffsetX}, offsetY: {imgOffsetY}, scaleX: {imgScaleX}, scaleY: {imgScaleY} {"}"},
              </code>
            </div>
          </div>
        )}
        </div>
      </div>

      {/* Legend & Hotspots */}
      {hotspots.length > 0 && (
        <div className="p-4 border-t border-white/5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-valorant-gray flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-valorant-red animate-pulse" />
              {hotspots.length} High Activity Zones
            </p>
            <div className="flex items-center gap-3 text-[10px]">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-white"></span>
                Kill
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                First Blood
              </span>
            </div>
          </div>
          <div className="grid grid-cols-5 gap-2">
            {hotspots.map((spot, idx) => (
              <div key={idx} className="text-center p-2 bg-surface-200 rounded-lg">
                <div className="text-lg font-bold text-valorant-red">{spot.count}</div>
                <div className="text-[9px] text-valorant-gray uppercase">kills</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
