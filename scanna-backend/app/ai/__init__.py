"""
Módulo de Inteligencia Artificial para SCANNA
Detección de anemia mediante análisis de imágenes oculares
"""

from .ai_model import (
    AnemiaDetectionModel,
    get_model,
    analyze_image,
    ImageQualityError
)

from .ai_explainer import (
    GeminiExplainer,
    get_explainer,
    generate_medical_explanation
)

__all__ = [
    "AnemiaDetectionModel",
    "get_model",
    "analyze_image",
    "ImageQualityError", 
    "GeminiExplainer",
    "get_explainer",
    "generate_medical_explanation"
]