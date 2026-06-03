# feature_extractor_live.py
# Robust GEE extractor for AQI project.

import ee
import os
import json
import numpy as np
from datetime import datetime, timedelta

GEE_PROJECT_ID = os.getenv("GEE_PROJECT_ID", "meow-491212")
SERVICE_ACCOUNT_JSON = os.getenv("GOOGLE_SERVICE_ACCOUNT_JSON")


def _safe_float(x, default=0.0):
    try:
        if x is None:
            return default
        if isinstance(x, float) and np.isnan(x):
            return default
        return float(x)
    except Exception:
        return default


class GEEFeatureExtractorLive:
    def __init__(self, buffer_size=1000, scale=500):
        self.buffer_size = buffer_size
        self.scale = scale

        try:
            # ===== Railway / Production =====
            if SERVICE_ACCOUNT_JSON:
                print("Initializing Earth Engine with Railway service account...")

                service_account_info = json.loads(SERVICE_ACCOUNT_JSON)

                credentials = ee.ServiceAccountCredentials(
                    service_account_info["client_email"],
                    key_data=SERVICE_ACCOUNT_JSON
                )

                ee.Initialize(credentials, project=GEE_PROJECT_ID)

                print("Earth Engine initialized successfully on Railway")

            # ===== Local Laptop =====
            else:
                print("Using local Earth Engine authentication...")
                ee.Initialize(project=GEE_PROJECT_ID)
                print("Earth Engine initialized locally")

        except Exception as e:
            print(f"GEE Initialization Failed: {e}")

    def _safe_date(self, date_str):
        today = datetime.utcnow()
        requested = datetime.strptime(date_str, "%Y-%m-%d")

        # GEE products delayed by ~10 days
        max_available = today - timedelta(days=10)

        if requested > max_available:
            return max_available.strftime("%Y-%m-%d"), True

        return requested.strftime("%Y-%m-%d"), False

    def extract_all_features(self, lat, lon, date_str, hour=12):
        safe_date_str, adjusted = self._safe_date(date_str)
        date_obj = datetime.strptime(safe_date_str, "%Y-%m-%d")

        start_date = (date_obj - timedelta(days=60)).strftime("%Y-%m-%d")
        end_date = safe_date_str

        point = ee.Geometry.Point([lon, lat])
        region = point.buffer(self.buffer_size)

        features = {
            "latitude": lat,
            "longitude": lon,
            "date_requested": date_str,
            "date_used": safe_date_str,
            "date_adjusted_for_availability": adjusted,
            "hour": hour,
        }

        print(
            f"\nExtracting GEE for ({lat:.4f}, {lon:.4f}) "
            f"requested={date_str}, used={safe_date_str}"
        )

        # ==========================
        # NDVI
        # ==========================
        try:
            ndvi_dict = (
                ee.ImageCollection("MODIS/061/MOD13A2")
                .filterDate(start_date, end_date)
                .select("NDVI")
                .mean()
                .reduceRegion(
                    reducer=ee.Reducer.mean(),
                    geometry=region,
                    scale=self.scale,
                    maxPixels=1e9
                )
                .getInfo()
            )

            ndvi = ndvi_dict.get("NDVI") if ndvi_dict else None
            features["NDVI"] = max(
                0, min(1, _safe_float(ndvi, 5000) / 10000.0)
            )

        except Exception as e:
            print(f"NDVI failed: {e}")
            features["NDVI"] = 0.35

        # ==========================
        # Land Surface Temperature
        # ==========================
        try:
            lst_dict = (
                ee.ImageCollection("MODIS/061/MOD11A1")
                .filterDate(start_date, end_date)
                .select("LST_Day_1km")
                .mean()
                .reduceRegion(
                    reducer=ee.Reducer.mean(),
                    geometry=region,
                    scale=1000,
                    maxPixels=1e9
                )
                .getInfo()
            )

            lst = (
                lst_dict.get("LST_Day_1km")
                if lst_dict else None
            )

            features["land_surface_temp"] = (
                _safe_float(lst, 14900) * 0.02
            ) - 273.15

        except Exception as e:
            print(f"LST failed: {e}")
            features["land_surface_temp"] = 28.0

        # ==========================
        # NO2
        # ==========================
        try:
            no2 = (
                ee.ImageCollection(
                    "COPERNICUS/S5P/OFFL/L3_NO2"
                )
                .filterDate(start_date, end_date)
                .select("NO2_column_number_density")
                .mean()
                .reduceRegion(
                    reducer=ee.Reducer.mean(),
                    geometry=region,
                    scale=1000,
                    maxPixels=1e9
                )
                .get("NO2_column_number_density")
                .getInfo()
            )

            features["no2_column"] = max(
                0,
                _safe_float(no2, 0.00008)
            )

        except Exception as e:
            print(f"NO2 failed: {e}")
            features["no2_column"] = 0.00008

        # ==========================
        # AOD
        # ==========================
        try:
            aod_dict = (
                ee.ImageCollection(
                    "MODIS/061/MCD19A2_GRANULES"
                )
                .filterDate(start_date, end_date)
                .select("Optical_Depth_047")
                .mean()
                .reduceRegion(
                    reducer=ee.Reducer.mean(),
                    geometry=region,
                    scale=1000,
                    maxPixels=1e9
                )
                .getInfo()
            )

            aod = (
                aod_dict.get("Optical_Depth_047")
                if aod_dict else None
            )

            features["aod"] = (
                abs(_safe_float(aod, 350)) / 1000.0
            )

        except Exception as e:
            print(f"AOD failed: {e}")
            features["aod"] = 0.35

        # ==========================
        # Population Density
        # ==========================
        try:
            pop = (
                ee.ImageCollection(
                    "WorldPop/GP/100m/pop"
                )
                .select("population")
                .mean()
                .reduceRegion(
                    reducer=ee.Reducer.sum(),
                    geometry=region,
                    scale=100,
                    maxPixels=1e9
                )
                .get("population")
                .getInfo()
            )

            area_km2 = (
                3.14159 *
                (self.buffer_size / 1000.0) ** 2
            )

            features["population_density"] = (
                _safe_float(pop, 8000)
                / area_km2
            )

        except Exception as e:
            print(f"Population failed: {e}")
            features["population_density"] = 8000.0

        # ==========================
        # Building Density
        # ==========================
        try:
            built = (
                ee.ImageCollection(
                    "JRC/GHSL/P2023A/GHS_BUILT_S"
                )
                .select("built_surface")
                .max()
                .reduceRegion(
                    reducer=ee.Reducer.mean(),
                    geometry=region,
                    scale=100,
                    maxPixels=1e9
                )
                .get("built_surface")
                .getInfo()
            )

            features["building_density"] = (
                _safe_float(built, 800.0)
            )

        except Exception as e:
            print(f"Building failed: {e}")
            features["building_density"] = 800.0

        # ==========================
        # Nightlight
        # ==========================
        try:
            nl = (
                ee.ImageCollection(
                    "NOAA/VIIRS/DNB/MONTHLY_V1/VCMSLCFG"
                )
                .filterDate(start_date, end_date)
                .select("avg_rad")
                .mean()
                .reduceRegion(
                    reducer=ee.Reducer.mean(),
                    geometry=region,
                    scale=500,
                    maxPixels=1e9
                )
                .get("avg_rad")
                .getInfo()
            )

            nl = max(0, _safe_float(nl, 25.0))

            features["nightlight"] = nl
            features["road_density_proxy"] = min(
                nl / 50.0,
                1.0
            )

        except Exception as e:
            print(f"Nightlight failed: {e}")
            features["nightlight"] = 25.0
            features["road_density_proxy"] = 0.5

        # ==========================
        # Tree Canopy
        # ==========================
        try:
            tree = (
                ee.Image(
                    "UMD/hansen/global_forest_change_2024_v1_12"
                )
                .select("treecover2000")
                .reduceRegion(
                    reducer=ee.Reducer.mean(),
                    geometry=region,
                    scale=30,
                    maxPixels=1e9
                )
                .get("treecover2000")
                .getInfo()
            )

            features["tree_canopy"] = (
                _safe_float(tree, 8.0) / 100.0
            )

        except Exception as e:
            print(f"Tree canopy failed: {e}")
            features["tree_canopy"] = 0.08

        # ==========================
        # Water proximity
        # ==========================
        try:
            water = (
                ee.Image("JRC/GSW1_4/GlobalSurfaceWater")
                .select("occurrence")
                .reduceRegion(
                    reducer=ee.Reducer.mean(),
                    geometry=region,
                    scale=30,
                    maxPixels=1e9
                )
                .get("occurrence")
                .getInfo()
            )

            features["water_proximity"] = (
                _safe_float(water, 2.0) / 100.0
            )

        except Exception as e:
            print(f"Water failed: {e}")
            features["water_proximity"] = 0.02

        # ==========================
        # Derived Indices
        # ==========================
        features["urbanization_index"] = (
            0.4 * min(
                features["building_density"] / 1000.0,
                1.0
            )
            + 0.3 * features["road_density_proxy"]
            + 0.3 * (1 - features["NDVI"])
        )

        features["green_index"] = (
            0.6 * features["NDVI"]
            + 0.4 * features["tree_canopy"]
        )

        features["pollution_index"] = (
            features["no2_column"] * 1e6
            + features["aod"] * 100
        )

        print("\n========== GEE Extracted ==========")
        print(f"NDVI: {features['NDVI']:.3f}")
        print(
            f"LST: "
            f"{features['land_surface_temp']:.2f}°C"
        )
        print(
            f"NO2: "
            f"{features['no2_column']:.6f}"
        )
        print(
            f"AOD: "
            f"{features['aod']:.3f}"
        )
        print(
            f"Population Density: "
            f"{features['population_density']:.0f}"
        )
        print(
            f"Pollution Index: "
            f"{features['pollution_index']:.2f}"
        )

        return features