import type { PredictionResult, Solution } from '../store/useStore';

type Priority = 'critical' | 'high' | 'medium' | 'low';

function getPriority(score: number): Priority {
  if (score >= 0.85) return 'critical';
  if (score >= 0.65) return 'high';
  if (score >= 0.4) return 'medium';
  return 'low';
}

export function generateSolutions(prediction: PredictionResult): Solution[] {
  const { aqi, carbon_emission, satellite, weather } = prediction;
  const { ndvi, no2_column, building_density, population_density, land_surface_temperature } = satellite;

  const solutions: Solution[] = [];

  // === Traffic & Transport ===
  const trafficScore =
    (aqi / 500) * 0.4 +
    (no2_column / 200) * 0.35 +
    (building_density / 100) * 0.25;

  if (trafficScore > 0.3) {
    solutions.push({
      id: 'ev-corridor',
      title: 'EV Corridor Deployment',
      description:
        `High NO₂ levels (${no2_column.toFixed(1)} µmol/m²) indicate vehicular pollution dominance. Deploy dedicated EV lanes along key arterials with fast-charging hubs every 2km. Incentivize fleet conversion for auto-rickshaws and delivery vehicles.`,
      category: 'Transport',
      priority: getPriority(trafficScore),
      expected_aqi_reduction: Math.round(aqi * 0.12),
      expected_co2_reduction: Math.round(carbon_emission * 0.18),
      timeframe: '6–18 months',
      tags: ['EV', 'Transport', 'NO₂ Reduction'],
    });

    solutions.push({
      id: 'odd-even',
      title: 'Adaptive Traffic Demand Management',
      description:
        `Implement AI-driven odd-even vehicle restrictions during peak AQI hours (current AQI: ${aqi.toFixed(0)}). Integrate with real-time AQI sensors to trigger restrictions automatically when AQI exceeds 150. Partner with BMTC for surge bus services during restriction periods.`,
      category: 'Transport',
      priority: getPriority(trafficScore * 0.85),
      expected_aqi_reduction: Math.round(aqi * 0.08),
      expected_co2_reduction: Math.round(carbon_emission * 0.10),
      timeframe: '1–3 months',
      tags: ['Traffic', 'Policy', 'AQI Control'],
    });
  }

  // === Urban Forestry / NDVI ===
  const vegetationScore = ndvi < 0.3 ? 0.9 - ndvi * 2 : (0.5 - ndvi) > 0 ? (0.5 - ndvi) * 1.5 : 0.1;

  if (ndvi < 0.45) {
    solutions.push({
      id: 'urban-forest',
      title: 'Urban Forestry & Green Corridors',
      description:
        `NDVI of ${ndvi.toFixed(3)} indicates severe vegetation deficit. Plant native species (Peepal, Neem, Rain Tree) along major roads at 5m intervals. Target ${Math.round((0.4 - ndvi) * 100)}% NDVI improvement through systematic plantation drives covering ${Math.round(population_density / 500)} priority zones.`,
      category: 'Green Infrastructure',
      priority: getPriority(vegetationScore),
      expected_aqi_reduction: Math.round(aqi * 0.09),
      expected_co2_reduction: Math.round(carbon_emission * 0.14),
      timeframe: '3–24 months',
      tags: ['NDVI', 'Trees', 'Carbon Sequestration'],
    });

    solutions.push({
      id: 'green-roof',
      title: 'Mandatory Green Roof Policy',
      description:
        `Building density of ${building_density.toFixed(1)}% with low NDVI (${ndvi.toFixed(3)}) creates urban heat islands. Mandate green roofs on all new commercial buildings >2000 sqft. Offer 15% property tax rebate for retrofitting. Target 30% of rooftop area converted within 5 years.`,
      category: 'Green Infrastructure',
      priority: getPriority(vegetationScore * 0.8),
      expected_aqi_reduction: Math.round(aqi * 0.06),
      expected_co2_reduction: Math.round(carbon_emission * 0.08),
      timeframe: '12–36 months',
      tags: ['Green Roof', 'Heat Island', 'NDVI'],
    });
  }

  // === Heat Island ===
  const heatScore = (land_surface_temperature - 25) / 20;
  if (land_surface_temperature > 32) {
    solutions.push({
      id: 'cool-pavements',
      title: 'Cool Pavement & Reflective Surface Program',
      description:
        `Land surface temperature of ${land_surface_temperature.toFixed(1)}°C indicates active heat island effect. Apply high-albedo reflective coatings on roads and rooftops. Install urban water features and mist systems at key junctions. Reduce surface temperature by 3–5°C in target zones.`,
      category: 'Heat Mitigation',
      priority: getPriority(Math.min(heatScore, 1)),
      expected_aqi_reduction: Math.round(aqi * 0.05),
      expected_co2_reduction: Math.round(carbon_emission * 0.06),
      timeframe: '3–12 months',
      tags: ['Heat Island', 'LST', 'Urban Cooling'],
    });
  }

  // === Industrial Emissions ===
  const industrialScore = (carbon_emission / 100) * 0.5 + (aqi / 300) * 0.5;
  if (carbon_emission > 30 || aqi > 150) {
    solutions.push({
      id: 'industrial-control',
      title: 'Industrial Emission Compliance Enforcement',
      description:
        `Carbon emission rate of ${carbon_emission.toFixed(1)} kg/hr exceeds sustainable thresholds. Deploy continuous emission monitoring systems (CEMS) at all industrial units within 5km radius. Enforce 30% emission reduction mandates with penalty-based compliance. Transition to cleaner fuel alternatives.`,
      category: 'Industrial',
      priority: getPriority(industrialScore),
      expected_aqi_reduction: Math.round(aqi * 0.15),
      expected_co2_reduction: Math.round(carbon_emission * 0.25),
      timeframe: '6–24 months',
      tags: ['Industrial', 'Carbon', 'Compliance'],
    });
  }

  // === Construction Dust ===
  if (building_density > 45 || aqi > 150) {
    const dustScore = (building_density / 100) * 0.6 + (aqi / 300) * 0.4;
    solutions.push({
      id: 'construction-dust',
      title: 'Construction Dust Control Protocol',
      description:
        `Building density of ${building_density.toFixed(1)}% indicates active construction zones generating PM2.5 and PM10. Mandate water suppression systems, dust screens, and covered material transport. Ban dry concrete mixing. Deploy dust monitors at all active construction sites >1000 sqm.`,
      category: 'Construction',
      priority: getPriority(dustScore),
      expected_aqi_reduction: Math.round(aqi * 0.07),
      expected_co2_reduction: Math.round(carbon_emission * 0.04),
      timeframe: '1–6 months',
      tags: ['Dust', 'PM2.5', 'Construction'],
    });
  }

  // === Public AQI Systems ===
  if (aqi > 100 || population_density > 5000) {
    const publicScore = (population_density / 15000) * 0.5 + (aqi / 400) * 0.5;
    solutions.push({
      id: 'public-aqi',
      title: 'Real-Time Public AQI Display Network',
      description:
        `With population density of ${Math.round(population_density).toLocaleString()}/km² and AQI of ${aqi.toFixed(0)}, public health awareness is critical. Deploy solar-powered AQI display boards at 200m intervals on major roads. Integrate with BBMP app for hyperlocal air quality alerts and health advisories.`,
      category: 'Public Health',
      priority: getPriority(publicScore),
      expected_aqi_reduction: 0,
      expected_co2_reduction: 0,
      timeframe: '3–9 months',
      tags: ['Public Health', 'AQI Monitoring', 'Smart City'],
    });
  }

  // === Renewable Energy ===
  if (weather.solar_radiation > 200) {
    const solarScore = (carbon_emission / 100) * 0.4 + (weather.solar_radiation / 1000) * 0.6;
    solutions.push({
      id: 'solar-mandate',
      title: 'Solar Energy Integration Mandate',
      description:
        `Solar radiation of ${weather.solar_radiation.toFixed(0)} W/m² offers excellent renewable energy potential. Mandate rooftop solar installation on all commercial buildings. Launch community solar programs for residential areas. Target 40% of area's energy from solar within 3 years, reducing grid dependency and carbon footprint.`,
      category: 'Renewable Energy',
      priority: getPriority(solarScore * 0.7),
      expected_aqi_reduction: Math.round(aqi * 0.1),
      expected_co2_reduction: Math.round(carbon_emission * 0.2),
      timeframe: '12–48 months',
      tags: ['Solar', 'Renewable', 'Carbon Neutral'],
    });
  }

  // === Waste Management ===
  if (aqi > 120 || population_density > 8000) {
    solutions.push({
      id: 'waste-mgmt',
      title: 'Scientific Waste-to-Energy Processing',
      description:
        `High population density of ${Math.round(population_density).toLocaleString()}/km² generates significant waste-related emissions. Replace open waste burning (a major AQI contributor) with waste-to-energy plants. Implement AI-powered waste segregation at 500 collection points. Achieve zero open burning within 18 months.`,
      category: 'Waste Management',
      priority: getPriority(Math.min((population_density / 15000) * 0.6 + (aqi / 300) * 0.4, 1)),
      expected_aqi_reduction: Math.round(aqi * 0.06),
      expected_co2_reduction: Math.round(carbon_emission * 0.09),
      timeframe: '12–30 months',
      tags: ['Waste', 'Burning', 'PM2.5'],
    });
  }

  // Sort by priority
  const priorityOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
  solutions.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  return solutions.slice(0, 8);
}
