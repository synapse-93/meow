"""
/api/predict endpoint
"""

from flask import Blueprint, request, jsonify
from services.model_bridge import run_prediction
import traceback

predict_bp = Blueprint('predict', __name__)


@predict_bp.route('/predict', methods=['POST'])
def predict():
    data = request.get_json(force=True, silent=True) or {}

    lat = data.get('latitude')
    lng = data.get('longitude')
    date_str = data.get('date')
    time_str = data.get('time')

    if lat is None or lng is None:
        return jsonify({'error': 'latitude and longitude are required'}), 400
    if not date_str:
        return jsonify({'error': 'date is required (YYYY-MM-DD)'}), 400
    if not time_str:
        return jsonify({'error': 'time is required (HH:MM)'}), 400

    try:
        lat = float(lat)
        lng = float(lng)
    except (TypeError, ValueError):
        return jsonify({'error': 'latitude and longitude must be numbers'}), 400

    # Validate Bengaluru region
    if not (12.7 <= lat <= 13.3 and 77.3 <= lng <= 77.9):
        return jsonify({'error': 'Location must be within Bengaluru region (lat 12.7–13.3, lng 77.3–77.9)'}), 400

    try:
        result = run_prediction(lat, lng, date_str, time_str)
        return jsonify(result)
    except Exception as e:
        tb = traceback.format_exc()
        print(f"[predict] Error: {e}\n{tb}")
        return jsonify({
            'error': str(e),
            'detail': 'predict_final.py execution failed',
            'traceback': tb.split('\n')[-3],
        }), 500
