import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Zap, Activity, Leaf } from 'lucide-react';
import { useStore } from '../store/useStore';
import { generateSolutions } from '../services/solutions';
import { getPriorityColor, getCategoryIcon } from '../utils/aqi';
import type { Solution } from '../store/useStore';

function PriorityBadge({ priority }: { priority: string }) {
  const color = getPriorityColor(priority);
  return (
    <span
      className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest"
      style={{ background: `${color}18`, color }}
    >
      <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: color }} />
      {priority}
    </span>
  );
}

function SolutionCard({ s }: { s: Solution }) {
  const [expanded, setExpanded] = useState(false);
  const catColor = {
    'Transport': '#06b6d4',
    'Green Infrastructure': '#22c55e',
    'Heat Mitigation': '#ef4444',
    'Industrial': '#f97316',
    'Construction': '#eab308',
    'Public Health': '#818cf8',
    'Renewable Energy': '#fbbf24',
    'Waste Management': '#34d399',
  }[s.category] || '#64748b';

  return (
    <div
      className="glass-card rounded-[18px] overflow-hidden transition-all duration-300 hover:scale-[1.005]"
      style={{ border: `1px solid ${catColor}22` }}
    >
      {/* Top accent */}
      <div className="h-0.5 w-full" style={{ background: `linear-gradient(90deg, ${catColor}88, ${catColor}11)` }} />

      <div className="p-4">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-start gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0"
              style={{ background: `${catColor}14` }}
            >
              {getCategoryIcon(s.category)}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span
                  className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full"
                  style={{ background: `${catColor}14`, color: catColor }}
                >
                  {s.category}
                </span>
                <PriorityBadge priority={s.priority} />
              </div>
              <h3 className="text-sm font-bold text-white leading-tight">{s.title}</h3>
            </div>
          </div>
          <button
            onClick={() => setExpanded(v => !v)}
            className="shrink-0 p-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-800/50 transition-all"
          >
            {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          </button>
        </div>

        {/* Metrics row */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          <div className="text-center px-2 py-2 rounded-xl bg-green-950/20 border border-green-900/20">
            <p className="text-[8px] uppercase tracking-wider text-slate-600 font-semibold">AQI Reduction</p>
            <p className="text-base font-black text-green-400">
              {s.expected_aqi_reduction > 0 ? `-${s.expected_aqi_reduction}` : 'N/A'}
            </p>
          </div>
          <div className="text-center px-2 py-2 rounded-xl bg-purple-950/20 border border-purple-900/20">
            <p className="text-[8px] uppercase tracking-wider text-slate-600 font-semibold">CO₂ Reduction</p>
            <p className="text-base font-black text-purple-400">
              {s.expected_co2_reduction > 0 ? `-${s.expected_co2_reduction} kg/hr` : 'Indirect'}
            </p>
          </div>
          <div className="text-center px-2 py-2 rounded-xl bg-cyan-950/20 border border-cyan-900/20">
            <p className="text-[8px] uppercase tracking-wider text-slate-600 font-semibold">Timeframe</p>
            <p className="text-xs font-bold text-cyan-400">{s.timeframe}</p>
          </div>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {s.tags.map(tag => (
            <span key={tag} className="text-[9px] px-2 py-0.5 rounded-full text-slate-500 border border-slate-800/60">
              {tag}
            </span>
          ))}
        </div>

        {/* Expanded description */}
        {expanded && (
          <div className="mt-2 pt-3 border-t border-slate-800/40 animate-fade-in">
            <p className="text-xs text-slate-400 leading-relaxed">{s.description}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export const SolutionsTab: React.FC = () => {
  const { predictionResult, solutions, setSolutions, setActiveTab } = useStore();
  const [filter, setFilter] = useState<string>('All');

  const categories = ['All', ...Array.from(new Set(solutions.map(s => s.category)))];
  const filtered = filter === 'All' ? solutions : solutions.filter(s => s.category === filter);

  const handleGenerate = () => {
    if (predictionResult) {
      setSolutions(generateSolutions(predictionResult));
    }
  };

  if (!predictionResult) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, rgba(6,182,212,0.1), rgba(129,140,248,0.1))' }}>
          <Leaf size={28} className="text-cyan-500 opacity-50" />
        </div>
        <div className="text-center">
          <p className="text-slate-400 font-medium">No prediction data</p>
          <p className="text-slate-600 text-sm mt-1">Run a prediction to generate area-specific solutions</p>
        </div>
        <button onClick={() => setActiveTab('predict')} className="px-4 py-2 rounded-xl text-sm font-semibold text-white" style={{ background: 'linear-gradient(135deg, #06b6d4, #818cf8)' }}>
          Go to Predict
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">AI Urban Sustainability Planner</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Area-specific solutions for {predictionResult.location.name} · AQI {predictionResult.aqi.toFixed(0)} · {predictionResult.carbon_emission.toFixed(1)} kg CO₂/hr
          </p>
        </div>
        <button
          onClick={handleGenerate}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white"
          style={{ background: 'linear-gradient(135deg, #06b6d4, #818cf8)' }}
        >
          <Zap size={14} />
          Regenerate
        </button>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Total Solutions', value: solutions.length.toString(), color: '#06b6d4' },
          { label: 'Critical Priority', value: solutions.filter(s => s.priority === 'critical').length.toString(), color: '#ef4444' },
          { label: 'High Priority', value: solutions.filter(s => s.priority === 'high').length.toString(), color: '#f97316' },
          { label: 'Categories', value: categories.length - 1 + ' types', color: '#818cf8' },
        ].map(m => (
          <div key={m.label} className="glass-card rounded-2xl p-3 border border-slate-800/30 text-center" style={{ boxShadow: `0 0 15px ${m.color}08` }}>
            <p className="text-2xl font-black" style={{ color: m.color }}>{m.value}</p>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider mt-0.5">{m.label}</p>
          </div>
        ))}
      </div>

      {/* Category filters */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className="shrink-0 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
            style={filter === cat
              ? { background: 'linear-gradient(135deg, #06b6d4, #818cf8)', color: '#fff' }
              : { background: 'rgba(30,58,95,0.3)', color: '#64748b', border: '1px solid rgba(30,58,95,0.5)' }
            }
          >
            {cat === 'All' ? `All (${solutions.length})` : `${getCategoryIcon(cat)} ${cat}`}
          </button>
        ))}
      </div>

      {/* Solutions grid */}
      {solutions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 glass-card rounded-[18px] border border-slate-800/30 gap-4">
          <Activity size={28} className="text-slate-600" />
          <p className="text-slate-500 text-sm">No solutions generated yet</p>
          <button onClick={handleGenerate} className="px-4 py-2 rounded-xl text-sm font-semibold text-white" style={{ background: 'linear-gradient(135deg, #06b6d4, #818cf8)' }}>
            Generate Solutions
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {filtered.map((s) => (
            <SolutionCard key={s.id} s={s} />
          ))}
        </div>
      )}

      <p className="text-[10px] text-slate-700 text-center">
        Solutions generated by rule-based AI engine · Priority determined by AQI, CO₂, NDVI, NO₂, building density, and population density
      </p>
    </div>
  );
};
