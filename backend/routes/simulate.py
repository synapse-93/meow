"""
/api/simulate endpoint
Reruns predict_final.py with parameter overrides and computes baseline vs simulated delta.
"""

from flask import Blueprint, request, jsonify
from services.model_bridge import run_prediction, run_prediction_with_overrides
import traceback

simulate_bp = Blueprint('simulate', __name__)


@simulate_bp.route('/simulate', methods=['POST'])
def simulate():
    data = request.get_json(force=True, silent=True) or {}

    lat = data.get('latitude')
    lng = data.get('longitude')
    date_str = data.get('date')
    time_str = data.get('time')

    if lat is None or lng is None:
        return jsonify({'error': 'latitude and longitude are required'}), 400
    if not date_str or not time_str:
        return jsonify({'error': 'date and time are required'}), 400

    lat = float(lat)
    lng = float(lng)

    overrides = {}
    if 'ndvi_override' in data:
        overrides['ndvi_override'] = float(data['ndvi_override'])
    if 'temperature_override' in data:
        overrides['temperature_override'] = float(data['temperature_override'])
    if 'building_density_override' in data:
        overrides['building_density_override'] = float(data['building_density_override'])

    try:
        # Run baseline
        baseline = run_prediction(lat, lng, date_str, time_str)

        # Run simulated
        if overrides:
            simulated = run_prediction_with_overrides(lat, lng, date_str, time_str, overrides)
        else:
            simulated = baseline

        return jsonify({
            'baseline_aqi': baseline['aqi'],
            'simulated_aqi': simulated['aqi'],
            'baseline_carbon': baseline['carbon_emission'],
            'simulated_carbon': simulated['carbon_emission'],
            'aqi_delta': round(simulated['aqi'] - baseline['aqi'], 2),
            'carbon_delta': round(simulated['carbon_emission'] - baseline['carbon_emission'], 2),
            'parameters': {
                'ndvi': overrides.get('ndvi_override', baseline['satellite']['ndvi']),
                'temperature': overrides.get('temperature_override', baseline['weather']['temperature']),
                'building_density': overrides.get('building_density_override', baseline['satellite']['building_density']),
            },
            'baseline': baseline,
            'simulated': simulated,
        })

    except Exception as e:
        tb = traceback.format_exc()
        print(f"[simulate] Error: {e}\n{tb}")
        return jsonify({
            'error': str(e),
            'detail': 'Simulation failed',
            'traceback': tb.split('\n')[-3],
        }), 500
