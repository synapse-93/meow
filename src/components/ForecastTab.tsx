import React, { useState } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from 'recharts';
import { TrendingUp, Clock, Zap, Activity } from 'lucide-react';
import { useStore } from '../store/useStore';
import { runForecast } from '../services/api';
import { getAqiColor, getAqiLabel } from '../utils/aqi';
import { LoadingSpinner } from './ui/LoadingSpinner';
import { ErrorBanner } from './ui/ErrorBanner';

function StatPill({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="flex flex-col items-center gap-1 px-4 py-2.5 rounded-xl" style={{ background: `${color}10`, border: `1px solid ${color}25` }}>
      <span className="text-[9px] uppercase tracking-widest text-slate-500 font-semibold">{label}</span>
      <span className="text-xl font-black" style={{ color }}>{value}</span>
    </div>
  );
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const aqi = payload.find((p: any) => p.dataKey === 'aqi')?.value;
  const carbon = payload.find((p: any) => p.dataKey === 'carbon_emission')?.value;
  return (
    <div className="glass-card border border-slate-700/50 rounded-xl p-3 text-xs shadow-2xl" style={{ minWidth: 140 }}>
      <p className="text-slate-400 font-semibold mb-2">{label}</p>
      {aqi !== undefined && (
        <div className="flex items-center justify-between gap-4 mb-1">
          <span className="text-slate-500">AQI</span>
          <span className="font-bold" style={{ color: getAqiColor(aqi ?? 0) }}>{(aqi ?? 0).toFixed(0)}</span>
        </div>
      )}
      {carbon !== undefined && (
        <div className="flex items-center justify-between gap-4">
          <span className="text-slate-500">CO₂</span>
          <span className="font-bold text-purple-400">{(carbon ?? 0).toFixed(1)} kg/hr</span>
        </div>
      )}
      {aqi !== undefined && (
        <p className="text-[9px] mt-2 pt-2 border-t border-slate-800" style={{ color: getAqiColor(aqi ?? 0) }}>
          {getAqiLabel(aqi ?? 0)}
        </p>
      )}
    </div>
  );
}

export const ForecastTab: React.FC = () => {
  const { selectedLocation, forecastData, setForecastData, forecastLoading,
    setForecastLoading, forecastError, setForecastError, predictionResult,
    setActiveTab } = useStore();
  const [hours, setHours] = useState(12);

  const handleForecast = async () => {
    if (!selectedLocation) return;
    setForecastLoading(true);
    setForecastError(null);
    try {
      const data = await runForecast(selectedLocation, hours);
      setForecastData(data);
    } catch (err: any) {
      setForecastError(err?.response?.data?.error || err?.message || 'Forecast failed. Ensure backend is running.');
    } finally {
      setForecastLoading(false);
    }
  };

  const aqiValues = forecastData.map(d => d.aqi).filter(Boolean);
  const peakAqi = aqiValues.length ? Math.max(...aqiValues) : null;
  const minAqi = aqiValues.length ? Math.min(...aqiValues) : null;
  const avgAqi = aqiValues.length ? aqiValues.reduce((a, b) => a + b, 0) / aqiValues.length : null;
  const carbonValues = forecastData.map(d => d.carbon_emission).filter(Boolean);
  const peakCarbon = carbonValues.length ? Math.max(...carbonValues) : null;

  const chartData = forecastData.map(d => ({
    ...d,
    hour_label: d.hour_label || d.hour,
  }));

  if (!selectedLocation && !predictionResult) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, rgba(6,182,212,0.1), rgba(129,140,248,0.1))' }}>
          <TrendingUp size={28} className="text-cyan-500 opacity-50" />
        </div>
        <div className="text-center">
          <p className="text-slate-400 font-medium">No location selected</p>
          <p className="text-slate-600 text-sm mt-1">Select a location from the Map tab</p>
        </div>
        <button onClick={() => setActiveTab('map')} className="px-4 py-2 rounded-xl text-sm font-semibold text-white" style={{ background: 'linear-gradient(135deg, #06b6d4, #818cf8)' }}>
          Go to Map
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 animate-fade-in">
      {/* Header & Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">AQI & Carbon Forecast</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Next {hours} hours · {selectedLocation?.name || 'Bengaluru'} · Model reruns at each interval
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 glass-card rounded-xl px-3 py-2 border border-slate-800/30">
            <Clock size={13} className="text-slate-500" />
            <span className="text-xs text-slate-500">Hours:</span>
            {[6, 9, 12].map(h => (
              <button
                key={h}
                onClick={() => setHours(h)}
                className={`text-xs font-bold px-2 py-0.5 rounded-lg transition-all ${hours === h ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}
                style={hours === h ? { background: 'linear-gradient(135deg, #06b6d4, #818cf8)' } : {}}
              >
                {h}h
              </button>
            ))}
          </div>
          <button
            onClick={handleForecast}
            disabled={forecastLoading || !selectedLocation}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-40"
            style={{ background: 'linear-gradient(135deg, #06b6d4, #818cf8)' }}
          >
            {forecastLoading ? (
              <><div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />Forecasting...</>
            ) : (
              <><Zap size={14} />Generate Forecast</>
            )}
          </button>
        </div>
      </div>

      {forecastError && <ErrorBanner message={forecastError} onDismiss={() => setForecastError(null)} />}

      {forecastLoading && (
        <div className="flex items-center justify-center py-20">
          <LoadingSpinner size="lg" label={`Running ML model for ${hours} time intervals...`} />
        </div>
      )}

      {!forecastLoading && forecastData.length > 0 && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-5 gap-3">
            <StatPill
              label="Peak AQI"
              value={(peakAqi ?? 0).toFixed(0)}
              color={getAqiColor(peakAqi ?? 0)}
            />

            <StatPill
              label="Min AQI"
              value={(minAqi ?? 0).toFixed(0)}
              color={getAqiColor(minAqi ?? 0)}
            />

            <StatPill
              label="Avg AQI"
              value={(avgAqi ?? 0).toFixed(0)}
              color={getAqiColor(avgAqi ?? 0)}
            />

            <StatPill
              label="Peak CO₂"
              value={`${(peakCarbon ?? 0).toFixed(1)}`}
              color="#818cf8"
            />
            <StatPill label="Intervals" value={`${forecastData.length}`} color="#06b6d4" />
          </div>

          {/* AQI Chart */}
          <div className="glass-card rounded-[18px] p-5 border border-slate-800/30">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs font-bold text-white">AQI Forecast</p>
                <p className="text-[10px] text-slate-600 mt-0.5">Hourly prediction · ML model reruns at each point</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5"><div className="w-3 h-0.5 rounded" style={{ background: 'linear-gradient(90deg, #06b6d4, #818cf8)' }} /><span className="text-[10px] text-slate-500">AQI</span></div>
                {avgAqi && <div className="flex items-center gap-1.5"><div className="w-3 h-0.5 rounded border-t border-dashed border-slate-600" /><span className="text-[10px] text-slate-500">Average</span></div>}
              </div>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="aqiGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f33" />
                <XAxis dataKey="hour_label" tick={{ fill: '#64748b', fontSize: 10 }} />
                <YAxis tick={{ fill: '#64748b', fontSize: 10 }} domain={['auto', 'auto']} />
                <Tooltip content={<CustomTooltip />} />
                {avgAqi && <ReferenceLine y={avgAqi} stroke="#64748b" strokeDasharray="4 4" strokeWidth={1} />}
                {peakAqi && <ReferenceLine y={peakAqi} stroke={getAqiColor(peakAqi)} strokeDasharray="4 4" strokeWidth={1} opacity={0.5} />}
                <Area
                  type="monotone"
                  dataKey="aqi"
                  stroke="#06b6d4"
                  strokeWidth={2.5}
                  fill="url(#aqiGrad)"
                  dot={{ fill: '#06b6d4', r: 3, strokeWidth: 0 }}
                  activeDot={{ r: 5, fill: '#06b6d4', strokeWidth: 0 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Carbon Chart */}
          <div className="glass-card rounded-[18px] p-5 border border-slate-800/30">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs font-bold text-white">Carbon Emission Forecast</p>
                <p className="text-[10px] text-slate-600 mt-0.5">kg CO₂/hr · Predicted emission rate</p>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="carbonGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#818cf8" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#818cf8" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f33" />
                <XAxis dataKey="hour_label" tick={{ fill: '#64748b', fontSize: 10 }} />
                <YAxis tick={{ fill: '#64748b', fontSize: 10 }} domain={['auto', 'auto']} />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="carbon_emission"
                  stroke="#818cf8"
                  strokeWidth={2.5}
                  fill="url(#carbonGrad)"
                  dot={{ fill: '#818cf8', r: 3, strokeWidth: 0 }}
                  activeDot={{ r: 5, fill: '#818cf8', strokeWidth: 0 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Hourly table */}
          <div className="glass-card rounded-[18px] p-4 border border-slate-800/30">
            <p className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold mb-3">Hourly Breakdown</p>
            <div className="grid grid-cols-6 gap-2">
              {forecastData.slice(0, 12).map((d, i) => (
                <div
                  key={i}
                  className="flex flex-col items-center gap-1.5 py-2.5 px-1 rounded-xl transition-all"
                  style={{ background: `${getAqiColor(d.aqi)}0c`, border: `1px solid ${getAqiColor(d.aqi)}22` }}
                >
                  <span className="text-[9px] text-slate-600 font-semibold">{d.hour_label}</span>
                  <span className="text-base font-black" style={{ color: getAqiColor(d.aqi) }}>{(d.aqi ?? 0).toFixed(0)}</span>
                  <span className="text-[8px] text-slate-600">AQI</span>
                  <span className="text-[9px] text-purple-400 font-semibold">{(d.carbon_emission ?? 0).toFixed(1)}</span>
                  <span className="text-[8px] text-slate-700">kg/hr</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {!forecastLoading && forecastData.length === 0 && !forecastError && (
        <div className="flex flex-col items-center justify-center py-20 glass-card rounded-[18px] border border-slate-800/30 gap-4">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, rgba(6,182,212,0.1), rgba(129,140,248,0.1))' }}>
            <Activity size={22} className="text-cyan-500 opacity-50" />
          </div>
          <p className="text-slate-500 text-sm">Click Generate Forecast to begin</p>
          <p className="text-slate-700 text-xs text-center max-w-56">The ML model runs {hours} times — once per hour — producing actual predictions</p>
        </div>
      )}
    </div>
  );
};
