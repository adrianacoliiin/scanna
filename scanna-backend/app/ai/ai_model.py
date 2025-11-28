"""
Servicio de IA para detección de anemia
Utiliza Vision Transformer (ViT) para análisis de imágenes oculares
✅ INCLUYE FILTRO DE VALIDACIÓN OOD (Out of Distribution)
"""

import os
import io
import torch
import torch.nn.functional as F  # ✅ NUEVO: Para softmax y cálculo de energía
import numpy as np
import matplotlib.pyplot as plt
from PIL import Image
from torchvision import transforms
from transformers import ViTForImageClassification, AutoImageProcessor  # ✅ NUEVO: AutoImageProcessor
from typing import Tuple, Optional, Dict
import logging

logger = logging.getLogger(__name__)

# Configuración
CLASSES = ['ANEMIA', 'NO_ANEMIA']
MODEL_PATH = 'best_model_vit.pth'
DEVICE = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
VIT_NAME = "google/vit-base-patch16-224-in21k"

# ✅ NUEVO: Configuración del filtro OOD (igual que Scanna.py)
MSP_THRESHOLD = 0.75  # Umbral de confianza (75%)
ENERGY_T = 2  # Temperatura de energía

# Transformaciones para las imágenes
TRANSFORM = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
])


class ImageQualityError(Exception):
    """✅ NUEVO: Excepción personalizada para imágenes de baja calidad"""
    def __init__(self, message: str, confidence: float, threshold: float):
        self.message = message
        self.confidence = confidence
        self.threshold = threshold
        super().__init__(self.message)


class AnemiaDetectionModel:
    """Modelo de detección de anemia usando Vision Transformer con filtro OOD"""
    
    def __init__(self):
        self.model = None
        self.processor = None  # ✅ NUEVO: Procesador para OOD
        self.device = DEVICE
        self.classes = CLASSES
        self.msp_threshold = MSP_THRESHOLD
        self.energy_t = ENERGY_T
        self._load_model()
    
    def _load_model(self):
        """Cargar modelo ViT con pesos entrenados y procesador"""
        try:
            logger.info(f"🔄 Cargando modelo desde {MODEL_PATH}...")
            logger.info(f"📍 Dispositivo: {self.device}")
            
            # ✅ NUEVO: Cargar procesador (para filtro OOD)
            try:
                self.processor = AutoImageProcessor.from_pretrained(VIT_NAME)
                logger.info("✅ Procesador de imagen cargado")
            except Exception as e:
                logger.error(f"❌ Error cargando procesador: {e}")
                raise
            
            # Verificar que existe el archivo
            if not os.path.exists(MODEL_PATH):
                raise FileNotFoundError(
                    f"❌ No se encuentra el archivo del modelo: {MODEL_PATH}\n"
                    f"Asegúrate de que 'best_model_vit.pth' esté en la raíz del proyecto"
                )
            
            # Definir arquitectura
            self.model = ViTForImageClassification.from_pretrained(
                VIT_NAME,
                num_labels=len(self.classes)
            )
            
            # Cargar pesos
            self.model.load_state_dict(
                torch.load(MODEL_PATH, map_location=self.device)
            )
            
            self.model.to(self.device)
            self.model.eval()
            
            # Configurar atención
            try:
                self.model.set_attn_implementation('eager')
            except AttributeError:
                logger.warning("⚠️ set_attn_implementation no disponible, continuando sin él")
            
            logger.info("✅ Modelo cargado exitosamente")
            
        except Exception as e:
            logger.error(f"❌ Error cargando modelo: {e}")
            raise
    
    def check_image_quality(self, image: Image.Image) -> Dict[str, any]:
        """
        ✅ NUEVO: Validar calidad de imagen (filtro OOD)
        
        Verifica si la imagen es clasificable o es OOD (Out of Distribution).
        Usa MSP (Maximum Softmax Probability) y Energy Score.
        
        Args:
            image: Imagen PIL en formato RGB
        
        Returns:
            dict con:
                - is_valid: bool (True si pasa el umbral)
                - confidence: float (confianza MSP 0-1)
                - energy: float (score de energía)
                - threshold: float (umbral usado)
        
        Raises:
            ImageQualityError: Si la imagen no pasa el filtro de calidad
        """
        try:
            # Preprocesar con el procesador
            inputs = self.processor(images=image, return_tensors="pt")
            inputs = {k: v.to(self.device) for k, v in inputs.items()}
            
            with torch.no_grad():
                outputs = self.model(**inputs)
                logits = outputs.logits
            
            # Cálculo MSP (Maximum Softmax Probability)
            probs = F.softmax(logits, dim=-1)[0]
            max_prob = float(probs.max().item())
            
            # Cálculo de Energía
            energy = float(-(self.energy_t * torch.logsumexp(logits / self.energy_t, dim=-1)).item())
            
            # Validación
            is_valid = max_prob >= self.msp_threshold
            
            result = {
                "is_valid": is_valid,
                "confidence": max_prob,
                "energy": energy,
                "threshold": self.msp_threshold
            }
            
            if is_valid:
                logger.info(
                    f"✅ Imagen VÁLIDA - Confianza: {max_prob*100:.1f}% "
                    f"(umbral: {self.msp_threshold*100:.0f}%)"
                )
            else:
                logger.warning(
                    f"⚠️ Imagen RECHAZADA - Confianza: {max_prob*100:.1f}% "
                    f"(umbral: {self.msp_threshold*100:.0f}%)"
                )
            
            return result
            
        except Exception as e:
            logger.error(f"❌ Error en validación OOD: {e}")
            raise
    
    def predict(
        self, 
        image: Image.Image,
        generate_heatmap: bool = True,
        validate_quality: bool = True  # ✅ NUEVO: Opción para activar/desactivar validación
    ) -> dict:
        """
        Realizar predicción sobre una imagen
        
        Args:
            image: Imagen PIL en formato RGB
            generate_heatmap: Si True, genera mapa de atención
            validate_quality: Si True, valida calidad antes de predecir
        
        Returns:
            dict con resultado, confianza, y opcionalmente heatmap
        
        Raises:
            ImageQualityError: Si validate_quality=True y la imagen no pasa el filtro
        """
        try:
            # ✅ NUEVO: VALIDACIÓN DE CALIDAD (PASO 1)
            if validate_quality:
                logger.info("🔍 Iniciando validación de calidad de imagen...")
                quality_check = self.check_image_quality(image)
                
                if not quality_check["is_valid"]:
                    # Lanzar excepción con información detallada
                    raise ImageQualityError(
                        message=(
                            f"Imagen rechazada por baja calidad. "
                            f"Confianza: {quality_check['confidence']*100:.1f}% "
                            f"(se requiere ≥ {quality_check['threshold']*100:.0f}%). "
                            f"Por favor, capture una nueva imagen clara y centrada de la conjuntiva ocular."
                        ),
                        confidence=quality_check['confidence'],
                        threshold=quality_check['threshold']
                    )
                
                logger.info("✅ Imagen aprobada. Procediendo con análisis...")
            
            # PASO 2: PREDICCIÓN REAL (solo si pasó validación)
            # Preprocesar imagen
            image_tensor = TRANSFORM(image).unsqueeze(0).to(self.device)
            
            # Predicción
            with torch.no_grad():
                outputs = self.model(image_tensor, output_attentions=True)
                logits = outputs.logits
                attention_maps = outputs.attentions
            
            # Obtener predicción
            probabilities = torch.softmax(logits, dim=1)
            predicted_idx = torch.argmax(probabilities, dim=1).item()
            predicted_class = self.classes[predicted_idx]
            confidence = probabilities[0][predicted_idx].item()
            
            result = {
                "resultado": "Anemia" if predicted_class == "ANEMIA" else "No Anemia",
                "confianza": round(confidence * 100, 2),
                "probabilidades": {
                    "anemia": round(probabilities[0][0].item() * 100, 2),
                    "no_anemia": round(probabilities[0][1].item() * 100, 2)
                }
            }
            
            # ✅ AGREGAR INFO DE VALIDACIÓN AL RESULTADO
            if validate_quality:
                quality_check = self.check_image_quality(image)
                result["validacion_calidad"] = {
                    "confianza_ood": round(quality_check['confidence'] * 100, 2),
                    "umbral": round(quality_check['threshold'] * 100, 2),
                    "energia": round(quality_check['energy'], 2)
                }
            
            # Generar heatmap si se solicita
            if generate_heatmap:
                heatmap_img = self._generate_heatmap(
                    attention_maps, 
                    image
                )
                result["heatmap"] = heatmap_img
            
            logger.info(f"✅ Predicción: {result['resultado']} ({result['confianza']}%)")
            
            return result
            
        except ImageQualityError:
            # Re-lanzar la excepción de calidad sin modificar
            raise
        except Exception as e:
            logger.error(f"❌ Error en predicción: {e}")
            raise
    
    def _generate_heatmap(
        self, 
        attention_maps: tuple, 
        original_image: Image.Image,
        grid_index: int = 90,
        layer_index: int = 3,
        alpha: float = 0.6
    ) -> Image.Image:
        """
        Generar mapa de calor de atención
        
        Args:
            attention_maps: Mapas de atención del modelo
            original_image: Imagen original
            grid_index: Índice del grid de atención
            layer_index: Capa de atención a usar
            alpha: Transparencia del overlay
        
        Returns:
            Imagen PIL con heatmap superpuesto
        """
        try:
            # Extraer mapa de atención
            att_map = attention_maps[layer_index][0, 0, 1:, 1:].cpu().detach().numpy()
            
            # Reshape a grid 14x14
            grid_size = (14, 14)
            mask = att_map[grid_index].reshape(grid_size[0], grid_size[1])
            
            # Redimensionar al tamaño de la imagen original
            mask = np.array(
                Image.fromarray(mask).resize(
                    original_image.size, 
                    resample=Image.BILINEAR
                )
            )
            
            # Normalizar
            mask = mask / np.max(mask) if np.max(mask) > 0 else mask
            
            # Crear heatmap con colormap rainbow
            heatmap = Image.fromarray(
                np.uint8(plt.cm.rainbow(mask) * 255)
            )
            
            # Combinar con imagen original
            heatmap_overlay = Image.blend(
                original_image.convert("RGBA"), 
                heatmap, 
                alpha=alpha
            )
            
            # Crear imagen combinada (original + heatmap lado a lado)
            combined = self._concat_images_horizontally(
                original_image, 
                heatmap_overlay
            )
            
            return combined
            
        except Exception as e:
            logger.error(f"❌ Error generando heatmap: {e}")
            # Retornar imagen original si falla
            return original_image
    
    def _concat_images_horizontally(
        self, 
        img1: Image.Image, 
        img2: Image.Image
    ) -> Image.Image:
        """Concatenar dos imágenes horizontalmente"""
        w1, h1 = img1.size
        w2, h2 = img2.size
        
        # Ajustar altura si es necesario
        if h1 != h2:
            img2 = img2.resize((int(w2 * h1 / h2), h1))
            w2, h2 = img2.size
        
        # Crear nueva imagen
        new_img = Image.new('RGB', (w1 + w2, h1))
        new_img.paste(img1, (0, 0))
        new_img.paste(img2, (w1, 0))
        
        return new_img


# Instancia global del modelo (singleton)
_model_instance: Optional[AnemiaDetectionModel] = None


def get_model() -> AnemiaDetectionModel:
    """
    Obtener instancia del modelo (Singleton)
    Se carga una sola vez y se reutiliza
    """
    global _model_instance
    
    if _model_instance is None:
        _model_instance = AnemiaDetectionModel()
    
    return _model_instance


def analyze_image(
    image_path: str, 
    generate_heatmap: bool = True,
    validate_quality: bool = True  # ✅ NUEVO
) -> dict:
    """
    Función helper para analizar una imagen desde ruta
    
    Args:
        image_path: Ruta a la imagen
        generate_heatmap: Si generar mapa de calor
        validate_quality: Si validar calidad de imagen
    
    Returns:
        dict con resultados del análisis
    
    Raises:
        ImageQualityError: Si la imagen no pasa el filtro de calidad
    """
    try:
        # Cargar imagen
        image = Image.open(image_path).convert("RGB")
        
        # Obtener modelo y predecir
        model = get_model()
        result = model.predict(
            image, 
            generate_heatmap=generate_heatmap,
            validate_quality=validate_quality
        )
        
        return result
        
    except ImageQualityError:
        # Re-lanzar error de calidad
        raise
    except Exception as e:
        logger.error(f"❌ Error analizando imagen: {e}")
        raise