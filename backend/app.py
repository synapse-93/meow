"""
CarbonSense AI Backend
Flask API wrapping predict_final.py ML pipeline.
"""

import os
import sys
import traceback
from flask import Flask, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

load_dotenv()

# Add predict_final.py directory to path
PREDICT_DIR = os.environ.get('PREDICT_DIR', os.path.dirname(os.path.abspath(__file__)))
if PREDICT_DIR not in sys.path:
    sys.path.insert(0, PREDICT_DIR)

app = Flask(__name__)

CORS(
    app,
    resources={
        r"/api/*": {
            "origins": [
                "http://localhost:5173",
                "https://meow-production-9b74.up.railway.app"
            ]
        }
    }
)

# Register routes
from routes.predict import predict_bp
from routes.forecast import forecast_bp
from routes.simulate import simulate_bp

app.register_blueprint(predict_bp, url_prefix='/api')
app.register_blueprint(forecast_bp, url_prefix='/api')
app.register_blueprint(simulate_bp, url_prefix='/api')


@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        'status': 'ok',
        'service': 'CarbonSense AI',
        'predict_dir': PREDICT_DIR,
    })


@app.errorhandler(404)
def not_found(e):
    return jsonify({'error': 'Endpoint not found', 'path': str(e)}), 404


@app.errorhandler(500)
def server_error(e):
    return jsonify({'error': 'Internal server error', 'detail': str(e)}), 500


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    debug = os.environ.get('FLASK_DEBUG', 'false').lower() == 'true'
    app.run(host='0.0.0.0', port=port, debug=debug)
