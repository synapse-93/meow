import React, { useState, useEffect } from 'react';
import {
  ComposedChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, Legend,
} from 'recharts';
import { Sliders, TrendingDown, TrendingUp, Minus, Zap } from 'lucide-react';
import { useStore } from '../store/useStore';
import { runSimulation, formatDate, formatTime } from '../services/api';
import { getAqiColor } from '../utils/aqi';
import { LoadingSpinner } from './ui/LoadingSpinner';
import { ErrorBanner } from './ui/ErrorBanner';

function DeltaBadge({ delta, unit, inverse = false }: { delta: number; unit: string; inverse?: boolean }) {
  const isGood = inverse ? delta > 0 : delta < 0;
  const isNeutral = Math.abs(delta) < 0.5;
  const color = isNeutral ? '#64748b' : isGood ? '#22c55e' : '#ef4444';
  const Icon = isNeutral ? Minus : isGood ? TrendingDown : TrendingUp;
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold" style={{ background: `${color}18`, color }}>
      <Icon size={11} />
      {delta > 0 ? '+' : ''}{delta.toFixed(1)} {unit}
    </span>
  );
}

function SliderInput({
  label, value, min, max, step, unit, onChange, color, description,
}: {
  label: string; value: number; min: number; max: number;
  step: number; unit: string; onChange: (v: number) => void;
  color: string; description: string;
}) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div className="flex flex-col gap-3 p-4 rounded-2xl glass-card border border-slate-800/30">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-bold text-white">{label}</p>
          <p className="text-[10px] text-slate-600 mt-0.5">{description}</p>
        </div>
        <div className="text-right">
          <span className="text-xl font-black" style={{ color }}>{value.toFixed(step < 1 ? 3 : 1)}</span>
          <span className="text-xs text-slate-500 ml-1">{unit}</span>
        </div>
      </div>
      <div className="relative">
        <input
          type="range"
          min={min} max={max} step={step}
          value={value}
          onChange={e => onChange(parseFloat(e.target.value))}
          className="w-full"
          style={{
            background: `linear-gradient(to right, ${color} 0%, ${color} ${pct}%, #1e3a5f ${pct}%, #1e3a5f 100%)`,
          }}
        />
        <div className="flex justify-between mt-1">
          <span className="text-[9px] text-slate-700">{min}{unit}</span>
          <span className="text-[9px] text-slate-700">{max}{unit}</span>
        </div>
      </div>
    </div>
  );
}

function CompareCard({ label, baseline, simulated, unit, color }: {
  label: string; baseline: number; simulated: number; unit: string; color: string;
}) {
  const delta = simulated - baseline;
  const isGood = delta < 0;
  return (
    <div className="glass-card rounded-[18px] p-4 border border-slate-800/30 relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: `linear-gradient(90deg, ${color}88, transparent)` }} />
      <p className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold mb-3">{label}</p>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <p className="text-[9px] text-slate-600 uppercase tracking-wider">Baseline</p>
          <p className="text-2xl font-black text-slate-300">{baseline.toFixed(1)}</p>
          <p className="text-[10px] text-slate-500">{unit}</p>
        </div>
        <div className="flex flex-col gap-1">
          <p className="text-[9px] uppercase tracking-wider" style={{ color: isGood ? '#22c55e' : '#ef4444' }}>Simulated</p>
          <p className="text-2xl font-black" style={{ color: isGood ? '#22c55e' : '#ef4444' }}>{simulated.toFixed(1)}</p>
          <p className="text-[10px] text-slate-500">{unit}</p>
        </div>
      </div>
      <div className="mt-3 pt-3 border-t border-slate-800/40 flex items-center justify-between">
        <DeltaBadge delta={delta} unit={unit} />
        <span className="text-[10px] text-slate-600">{Math.abs((delta / baseline) * 100).toFixed(1)}% change</span>
      </div>
    </div>
  );
}

export const SimulateTab: React.FC = () => {
  const { selectedLocation, predictionResult, simulationResult, setSimulationResult,
    simulationLoading, setSimulationLoading, simulationError, setSimulationError,
    setActiveTab } = useStore();

  const baseline = predictionResult;

  const [ndvi, setNdvi] = useState(baseline?.satellite.ndvi ?? 0.3);
  const [temperature, setTemperature] = useState(baseline?.weather.temperature ?? 28);
  const [buildingDensity, setBuildingDensity] = useState(50);

  useEffect(() => {
    if (!baseline) return;

    setNdvi(baseline.satellite.ndvi);
    setTemperature(baseline.weather.temperature);

    // middle = predicted baseline
    setBuildingDensity(50);
  }, [baseline?.timestamp]);

  const handleSimulate = async () => {
    if (!selectedLocation || !baseline) return;
    setSimulationLoading(true);
    setSimulationError(null);
    try {
      const result = await runSimulation({
        latitude: selectedLocation.lat,
        longitude: selectedLocation.lng,
        date: formatDate(new Date(baseline.timestamp || Date.now())),
        time: formatTime(new Date(baseline.timestamp || Date.now())),

        ndvi_override: ndvi,
        temperature_override: temperature,

        building_density_override:
          baseline?.satellite.building_density
            ? baseline.satellite.building_density *
              (buildingDensity / 50)
            : buildingDensity,
      });
      setSimulationResult(result);
    } catch (err: any) {
      setSimulationError(err?.response?.data?.error || err?.message || 'Simulation failed.');
    } finally {
      setSimulationLoading(false);
    }
  };

  const resetToBaseline = () => {
    if (baseline) {
      setNdvi(baseline.satellite.ndvi);
      setTemperature(baseline.weather.temperature);

      // middle = predicted baseline
      setBuildingDensity(50);

      setSimulationResult(null);
    }
  };

  if (!baseline) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, rgba(6,182,212,0.1), rgba(129,140,248,0.1))' }}>
          <Sliders size={28} className="text-cyan-500 opacity-50" />
        </div>
        <div className="text-center">
          <p className="text-slate-400 font-medium">Prediction required</p>
          <p className="text-slate-600 text-sm mt-1">Run a prediction first to enable simulation</p>
        </div>
        <button onClick={() => setActiveTab('predict')} className="px-4 py-2 rounded-xl text-sm font-semibold text-white" style={{ background: 'linear-gradient(135deg, #06b6d4, #818cf8)' }}>
          Go to Predict
        </button>
      </div>
    );
  }

  const chartData = simulationResult ? [
    {
      name: 'AQI',
      Baseline: simulationResult.baseline_aqi,
      Simulated: simulationResult.simulated_aqi,
    },
    {
      name: 'Carbon (kg/hr)',
      Baseline: simulationResult.baseline_carbon,
      Simulated: simulationResult.simulated_carbon,
    },
  ] : [];

  const ndviDelta = ndvi - (baseline?.satellite.ndvi ?? ndvi);
  const tempDelta = temperature - (baseline?.weather.temperature ?? temperature);
  const buildingDelta = buildingDensity - (baseline?.satellite.building_density ?? buildingDensity);

  return (
    <div className="flex flex-col gap-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Scenario Simulation</h2>
          <p className="text-sm text-slate-500 mt-0.5">Modify environmental parameters and rerun the ML model</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={resetToBaseline} className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-400 border border-slate-700/50 hover:border-slate-600 transition-colors">
            Reset
          </button>
          <button
            onClick={handleSimulate}
            disabled={simulationLoading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-40"
            style={{ background: 'linear-gradient(135deg, #06b6d4, #818cf8)' }}
          >
            {simulationLoading ? (
              <><div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />Simulating...</>
            ) : (
              <><Zap size={14} />Run Simulation</>
            )}
          </button>
        </div>
      </div>

      {simulationError && <ErrorBanner message={simulationError} onDismiss={() => setSimulationError(null)} />}

      <div className="grid grid-cols-3 gap-4">
        {/* Sliders */}
        <div className="flex flex-col gap-3">
          <p className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold">Simulation Parameters</p>

          <SliderInput
            label="NDVI (Vegetation)"
            value={ndvi}
            min={0.0} max={0.9} step={0.001}
            unit=""
            color="#22c55e"
            description="0 = bare urban · 0.9 = dense forest"
            onChange={setNdvi}
          />
          <div className="flex items-center justify-between px-2">
            <span className="text-[10px] text-slate-600">vs Baseline: {baseline.satellite.ndvi.toFixed(3)}</span>
            <DeltaBadge delta={ndviDelta} unit="" inverse />
          </div>

          <SliderInput
            label="Temperature"
            value={temperature}
            min={15} max={50} step={0.1}
            unit="°C"
            color="#f97316"
            description="Ambient air temperature"
            onChange={setTemperature}
          />
          <div className="flex items-center justify-between px-2">
            <span className="text-[10px] text-slate-600">vs Baseline: {baseline.weather.temperature.toFixed(1)}°C</span>
            <DeltaBadge delta={tempDelta} unit="°C" />
          </div>

          <SliderInput
            label="Building Density"
            value={buildingDensity}
            min={5} max={95} step={0.5}
            unit="%"
            color="#818cf8"
            description="% of land covered by structures"
            onChange={setBuildingDensity}
          />
          <div className="flex items-center justify-between px-2">
            <span className="text-[10px] text-slate-600">vs Baseline: {baseline.satellite.building_density.toFixed(1)}%</span>
            <DeltaBadge delta={buildingDelta} unit="%" />
          </div>
        </div>

        {/* Results */}
        <div className="col-span-2 flex flex-col gap-4">
          {simulationLoading ? (
            <div className="flex items-center justify-center h-full">
              <LoadingSpinner size="lg" label="Running simulation with modified parameters..." />
            </div>
          ) : simulationResult ? (
            <>
              <div className="grid grid-cols-2 gap-3">
                <CompareCard
                  label="AQI Impact"
                  baseline={simulationResult.baseline_aqi}
                  simulated={simulationResult.simulated_aqi}
                  unit="AQI"
                  color={getAqiColor(simulationResult.simulated_aqi)}
                />
                <CompareCard
                  label="Carbon Emission Impact"
                  baseline={simulationResult.baseline_carbon}
                  simulated={simulationResult.simulated_carbon}
                  unit="kg/hr"
                  color="#818cf8"
                />
              </div>

              <div className="glass-card rounded-[18px] p-4 border border-slate-800/30">
                <p className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold mb-4">Baseline vs Simulated Comparison</p>
                <ResponsiveContainer width="100%" height={220}>
                  <ComposedChart data={chartData} barCategoryGap="40%">
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f33" />
                    <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} />
                    <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{ background: '#0d1526', border: '1px solid #1e3a5f', borderRadius: 10, fontSize: 11 }}
                    />
                    <Legend wrapperStyle={{ fontSize: 11, color: '#64748b' }} />
                    <Bar dataKey="Baseline" fill="#1e3a5f" fillOpacity={0.8} radius={[6, 6, 0, 0]} />
                    <Bar dataKey="Simulated" radius={[6, 6, 0, 0]}>
                      {chartData.map((entry, i) => (
                        <Cell
                          key={i}
                          fill={entry.Simulated < entry.Baseline ? '#22c55e' : '#ef4444'}
                          fillOpacity={0.85}
                        />
                      ))}
                    </Bar>
                  </ComposedChart>
                </ResponsiveContainer>
              </div>

              <div className="glass-card rounded-[18px] p-4 border border-slate-800/30">
                <p className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold mb-3">Simulation Parameters Applied</p>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: 'NDVI Override', value: simulationResult.parameters.ndvi.toFixed(3), color: '#22c55e' },
                    { label: 'Temperature', value: `${simulationResult.parameters.temperature.toFixed(1)}°C`, color: '#f97316' },
                    { label: 'Building Density', value: `${simulationResult.parameters.building_density.toFixed(1)}%`, color: '#818cf8' },
                  ].map(p => (
                    <div key={p.label} className="text-center px-3 py-2 rounded-xl" style={{ background: `${p.color}08`, border: `1px solid ${p.color}22` }}>
                      <p className="text-[9px] text-slate-600 uppercase tracking-wider mb-1">{p.label}</p>
                      <p className="text-base font-black" style={{ color: p.color }}>{p.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full glass-card rounded-[18px] border border-slate-800/30 py-16 gap-4">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, rgba(6,182,212,0.1), rgba(129,140,248,0.1))' }}>
                <Sliders size={22} className="text-cyan-500 opacity-50" />
              </div>
              <p className="text-slate-500 text-sm">Adjust parameters and run simulation</p>
              <p className="text-slate-700 text-xs text-center max-w-48">The ML model will rerun with your modified environmental parameters</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
