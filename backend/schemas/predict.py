"""
Request/response schemas for validation.
"""

PREDICT_REQUEST_SCHEMA = {
    'latitude': {'type': float, 'required': True},
    'longitude': {'type': float, 'required': True},
    'date': {'type': str, 'required': True, 'format': 'YYYY-MM-DD'},
    'time': {'type': str, 'required': True, 'format': 'HH:MM'},
}

SIMULATE_REQUEST_SCHEMA = {
    'latitude': {'type': float, 'required': True},
    'longitude': {'type': float, 'required': True},
    'date': {'type': str, 'required': True},
    'time': {'type': str, 'required': True},
    'ndvi_override': {'type': float, 'required': False, 'range': (0.0, 1.0)},
    'temperature_override': {'type': float, 'required': False, 'range': (0.0, 60.0)},
    'building_density_override': {'type': float, 'required': False, 'range': (0.0, 100.0)},
}

FORECAST_REQUEST_SCHEMA = {
    'latitude': {'type': float, 'required': True},
    'longitude': {'type': float, 'required': True},
    'date': {'type': str, 'required': True},
    'hours': {'type': int, 'required': False, 'range': (1, 24)},
}
