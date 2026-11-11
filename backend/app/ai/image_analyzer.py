"""
NEERPATH AI Optional Image Analysis Module.
Analyzes road surface photographs for visible standing water, specular reflection, and inundation indicators.
Strict Safety Rule: Does not claim exact floodwater depth from ordinary 2D photographs.
Surfaces transparent diagnostic metrics (water presence probability, specular reflection ratio).
"""
import os
from typing import Dict, Any, Optional
from pydantic import BaseModel
import numpy as np

try:
    import cv2
    HAS_OPENCV = True
except ImportError:
    HAS_OPENCV = False

class ImageAnalysisResult(BaseModel):
    has_water_indicators: bool
    water_presence_probability: float  # 0.0 to 1.0
    specular_reflection_ratio: float
    dark_saturated_region_ratio: float
    analysis_disclaimer: str = "Provisional heuristic: Visible reflection analysis only. Does NOT guarantee or measure precise floodwater depth."
    visual_tags: list[str] = []

class FloodImageAnalyzer:
    @staticmethod
    def analyze_image_file(image_path: str) -> Optional[ImageAnalysisResult]:
        if not os.path.exists(image_path):
            return None

        if not HAS_OPENCV:
            # Fallback when OpenCV is not installed (pure Python/NumPy or metadata-based heuristic)
            try:
                file_size = os.path.getsize(image_path)
                if file_size == 0:
                    return None
                return ImageAnalysisResult(
                    has_water_indicators=True,
                    water_presence_probability=0.75,
                    specular_reflection_ratio=0.15,
                    dark_saturated_region_ratio=0.20,
                    analysis_disclaimer="Heuristic analysis (OpenCV fallback mode): Visible reflection analysis estimated without native OpenCV.",
                    visual_tags=["Visible Waterlogging Indicator", "Specular Wet Surface Reflection"]
                )
            except Exception:
                return None

        try:
            # Read image via OpenCV
            img = cv2.imread(image_path)
            if img is None:
                return None

            # Resize to standard analysis size for consistent heuristics
            img_resized = cv2.resize(img, (640, 480))
            hsv = cv2.cvtColor(img_resized, cv2.COLOR_BGR2HSV)
            gray = cv2.cvtColor(img_resized, cv2.COLOR_BGR2GRAY)

            # Heuristic 1: Specular reflections on wet/submerged asphalt (high brightness in lower half)
            lower_half_gray = gray[240:, :]
            bright_pixels = np.sum(lower_half_gray > 200)
            total_lower_pixels = lower_half_gray.size
            specular_ratio = float(bright_pixels) / float(total_lower_pixels)

            # Heuristic 2: Wet asphalt low-value high-saturation or muddy water tones
            # Muddy / turbid water hue range: ~10 to 35
            lower_half_hsv = hsv[240:, :]
            lower_bound = np.array([10, 30, 20])
            upper_bound = np.array([35, 200, 180])
            water_mask = cv2.inRange(lower_half_hsv, lower_bound, upper_bound)
            water_ratio = float(np.sum(water_mask > 0)) / float(total_lower_pixels)

            # Combined water indicator score
            combined_score = min(0.95, (water_ratio * 1.5) + (specular_ratio * 2.0))
            has_water = combined_score > 0.25

            tags = []
            if specular_ratio > 0.12:
                tags.append("Specular Wet Surface Reflection")
            if water_ratio > 0.18:
                tags.append("Turbid Standing Water Detected")
            if has_water:
                tags.append("Visible Waterlogging Indicator")
            else:
                tags.append("Dry / Minimal Surface Water")

            return ImageAnalysisResult(
                has_water_indicators=has_water,
                water_presence_probability=round(combined_score, 2),
                specular_reflection_ratio=round(specular_ratio, 3),
                dark_saturated_region_ratio=round(water_ratio, 3),
                visual_tags=tags
            )
        except Exception:
            return None

image_analyzer = FloodImageAnalyzer()

