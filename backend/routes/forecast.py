"""
/api/forecast endpoint
Reruns predict_final.py for each future hour.
"""

from flask import Blueprint, request, jsonify
from services.model_bridge import run_prediction
from datetime import datetime, timedelta
import traceback

forecast_bp = Blueprint('forecast', __name__)


@forecast_bp.route('/forecast', methods=['POST'])
def forecast():
    data = request.get_json(force=True, silent=True) or {}

    lat = data.get('latitude')
    lng = data.get('longitude')
    date_str = data.get('date')
    hours = int(data.get('hours', 12))

    if lat is None or lng is None:
        return jsonify({'error': 'latitude and longitude are required'}), 400
    if not date_str:
        return jsonify({'error': 'date is required'}), 400

    lat = float(lat)
    lng = float(lng)
    hours = max(1, min(hours, 24))  # cap at 24

    # Start from current time
    now = datetime.now()
    forecast_points = []
    errors = []

    for i in range(1, hours + 1):
        future = now + timedelta(hours=i)
        future_date = future.strftime('%Y-%m-%d')
        future_time = future.strftime('%H:%M')
        hour_label = future.strftime('%I%p').lstrip('0')  # e.g. "3PM"

        try:
            result = run_prediction(lat, lng, future_date, future_time)
            forecast_points.append({
                'hour': future_time,
                'hour_label': hour_label,
                'aqi': result['aqi'],
                'carbon_emission': result['carbon_emission'],
                'aqi_category': result['aqi_category'],
                'timestamp': future.isoformat(),
            })
        except Exception as e:
            errors.append({'hour': future_time, 'error': str(e)})
            # Continue forecasting even if one hour fails

    if not forecast_points:
        tb = '\n'.join([e.get('error', '') for e in errors])
        return jsonify({
            'error': 'All forecast predictions failed',
            'detail': tb,
        }), 500

    return jsonify({
        'forecast': forecast_points,
        'location': {'lat': lat, 'lng': lng},
        'generated_at': now.isoformat(),
        'hours_requested': hours,
        'hours_returned': len(forecast_points),
        'errors': errors if errors else None,
    })
