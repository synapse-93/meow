export function getAqiColor(aqi: number): string {
  if (aqi <= 50) return '#22c55e';
  if (aqi <= 100) return '#eab308';
  if (aqi <= 150) return '#f97316';
  if (aqi <= 200) return '#ef4444';
  if (aqi <= 300) return '#a855f7';
  return '#7f1d1d';
}

export function getAqiGlow(aqi: number): string {
  if (aqi <= 50) return 'rgba(34,197,94,0.3)';
  if (aqi <= 100) return 'rgba(234,179,8,0.3)';
  if (aqi <= 150) return 'rgba(249,115,22,0.3)';
  if (aqi <= 200) return 'rgba(239,68,68,0.3)';
  if (aqi <= 300) return 'rgba(168,85,247,0.3)';
  return 'rgba(127,29,29,0.3)';
}

export function getAqiLabel(aqi: number): string {
  if (aqi <= 50) return 'Good';
  if (aqi <= 100) return 'Moderate';
  if (aqi <= 150) return 'Unhealthy (Sensitive)';
  if (aqi <= 200) return 'Unhealthy';
  if (aqi <= 300) return 'Very Unhealthy';
  return 'Hazardous';
}

export function getAqiBg(aqi: number): string {
  if (aqi <= 50) return 'rgba(34,197,94,0.1)';
  if (aqi <= 100) return 'rgba(234,179,8,0.1)';
  if (aqi <= 150) return 'rgba(249,115,22,0.1)';
  if (aqi <= 200) return 'rgba(239,68,68,0.1)';
  if (aqi <= 300) return 'rgba(168,85,247,0.1)';
  return 'rgba(127,29,29,0.1)';
}

export function getPriorityColor(p: string): string {
  switch (p) {
    case 'critical': return '#ef4444';
    case 'high': return '#f97316';
    case 'medium': return '#eab308';
    case 'low': return '#22c55e';
    default: return '#64748b';
  }
}

export function getCategoryIcon(cat: string): string {
  switch (cat) {
    case 'Transport': return '🚗';
    case 'Green Infrastructure': return '🌿';
    case 'Heat Mitigation': return '🌡️';
    case 'Industrial': return '🏭';
    case 'Construction': return '🏗️';
    case 'Public Health': return '🏥';
    case 'Renewable Energy': return '☀️';
    case 'Waste Management': return '♻️';
    default: return '📊';
  }
}
