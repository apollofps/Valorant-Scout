import { useState, useMemo, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Flame, MapPin } from 'lucide-react';
import type { ExploitablePatterns, KillPosition } from '../types';
import { MapHeatmap } from './MapHeatmap';

interface HeatmapSliderProps {
  patterns?: ExploitablePatterns;
}

export function HeatmapSlider({ patterns }: HeatmapSliderProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0); // -1 for left, 1 for right
  
  const killPositions = patterns?.kill_heatmap || [];
  const mapBounds = patterns?.map_bounds || {};
  
  // Group kills by map
  const killsByMap = useMemo(() => {
    return killPositions.reduce((acc, kp) => {
      const mapName = kp.map_name.toLowerCase();
      if (!acc[mapName]) acc[mapName] = [];
      acc[mapName].push(kp);
      return acc;
    }, {} as Record<string, KillPosition[]>);
  }, [killPositions]);
  
  const mapNames = Object.keys(killsByMap);
  const totalMaps = mapNames.length;
  
  const goNext = useCallback(() => {
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % totalMaps);
  }, [totalMaps]);
  
  const goPrev = useCallback(() => {
    setDirection(-1);
    setCurrentIndex((prev) => (prev - 1 + totalMaps) % totalMaps);
  }, [totalMaps]);
  
  const goToMap = (index: number) => {
    setDirection(index > currentIndex ? 1 : -1);
    setCurrentIndex(index);
  };
  
  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') goNext();
      if (e.key === 'ArrowLeft') goPrev();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goNext, goPrev]);
  
  if (totalMaps === 0) {
    return (
      <div className="glass rounded-xl p-12 text-center">
        <Flame className="w-16 h-16 mx-auto mb-4 text-valorant-gray opacity-50" />
        <h3 className="text-xl font-semibold text-valorant-cream mb-2">No Heatmap Data</h3>
        <p className="text-valorant-gray">
          Kill position data not available for this analysis.
        </p>
      </div>
    );
  }
  
  const currentMapName = mapNames[currentIndex];
  const currentKills = killsByMap[currentMapName];
  const currentBounds = mapBounds[currentMapName.toLowerCase()];
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-valorant-cream flex items-center gap-3">
            <Flame className="w-7 h-7 text-valorant-red" />
            Kill Heatmaps
          </h2>
          <p className="text-valorant-gray mt-1">
            Visualize engagement hotspots, default positions, and first blood locations
          </p>
        </div>
        <div className="text-sm text-valorant-gray">
          <span className="text-valorant-cream font-bold">{totalMaps}</span> maps analyzed
        </div>
      </div>
      
      {/* Main Slider */}
      <div className="relative">
        {/* Navigation Arrows */}
        <button
          onClick={goPrev}
          className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-20
                     w-12 h-12 rounded-full bg-black/80 backdrop-blur-sm
                     flex items-center justify-center
                     text-valorant-cream hover:bg-valorant-red transition-all
                     shadow-lg shadow-black/50"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        
        <button
          onClick={goNext}
          className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-20
                     w-12 h-12 rounded-full bg-black/80 backdrop-blur-sm
                     flex items-center justify-center
                     text-valorant-cream hover:bg-valorant-red transition-all
                     shadow-lg shadow-black/50"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
        
        {/* Heatmap Display */}
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={currentMapName}
            initial={{ opacity: 0, x: direction * 200 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction * -200 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="max-w-4xl mx-auto"
          >
            <MapHeatmap
              mapName={currentMapName}
              kills={currentKills}
              bounds={currentBounds}
            />
          </motion.div>
        </AnimatePresence>
      </div>
      
      {/* Map Selector Pills */}
      <div className="flex items-center justify-center gap-2 flex-wrap">
        {mapNames.map((mapName, idx) => (
          <button
            key={mapName}
            onClick={() => goToMap(idx)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${
              idx === currentIndex
                ? 'bg-valorant-red text-white shadow-lg shadow-valorant-red/30'
                : 'bg-surface-200 text-valorant-gray hover:bg-surface-100 hover:text-valorant-cream'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span className="capitalize">{mapName}</span>
            <span className={`text-xs ${idx === currentIndex ? 'text-white/70' : 'text-valorant-gray/70'}`}>
              ({killsByMap[mapName].length})
            </span>
          </button>
        ))}
      </div>
      
      {/* Progress Dots */}
      <div className="flex items-center justify-center gap-1.5">
        {mapNames.map((_, idx) => (
          <button
            key={idx}
            onClick={() => goToMap(idx)}
            className={`h-1.5 rounded-full transition-all ${
              idx === currentIndex
                ? 'w-8 bg-valorant-red'
                : 'w-1.5 bg-surface-100 hover:bg-surface-50'
            }`}
          />
        ))}
      </div>
      
      {/* Stats Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        <div className="glass rounded-xl p-4 text-center">
          <div className="text-3xl font-bold text-valorant-cream">
            {killPositions.length}
          </div>
          <div className="text-xs text-valorant-gray uppercase mt-1">Total Kills Tracked</div>
        </div>
        <div className="glass rounded-xl p-4 text-center">
          <div className="text-3xl font-bold text-valorant-cream">
            {totalMaps}
          </div>
          <div className="text-xs text-valorant-gray uppercase mt-1">Maps Analyzed</div>
        </div>
        <div className="glass rounded-xl p-4 text-center">
          <div className="text-3xl font-bold text-amber-400">
            {killPositions.filter(k => k.is_first_blood).length}
          </div>
          <div className="text-xs text-valorant-gray uppercase mt-1">First Bloods</div>
        </div>
        <div className="glass rounded-xl p-4 text-center">
          <div className="text-3xl font-bold text-valorant-cream capitalize">
            {mapNames.reduce((a, b) => 
              killsByMap[a].length > killsByMap[b].length ? a : b
            )}
          </div>
          <div className="text-xs text-valorant-gray uppercase mt-1">Most Active Map</div>
        </div>
      </motion.div>
      
      {/* Keyboard Hint */}
      <div className="text-center text-xs text-valorant-gray/50">
        Use ← → arrows to navigate between maps
      </div>
    </div>
  );
}
