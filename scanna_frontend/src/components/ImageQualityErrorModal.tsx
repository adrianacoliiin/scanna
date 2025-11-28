import { X, AlertCircle, Camera } from 'lucide-react';

interface ImageQualityErrorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRetry: () => void;
  errorData: {
    error: string;
    message: string;
    detalles: {
      confianza: number;
      umbral_requerido: number;
      motivo?: string;
    };
    recomendaciones?: string[];
  };
}

export function ImageQualityErrorModal({ 
  isOpen, 
  onClose, 
  onRetry, 
  errorData 
}: ImageQualityErrorModalProps) {
  if (!isOpen) return null;

  return (
    <>
      {/* Overlay con backdrop blur */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal Container */}
      <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 pointer-events-none">
        <div 
          className="bg-white rounded-[32px] shadow-2xl max-w-lg w-full max-h-[90vh] overflow-hidden pointer-events-auto transform transition-all"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header - Simplificado con gris */}
          <div className="bg-gray-100 border-b border-gray-200 px-6 py-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-gray-700" strokeWidth={2.5} />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900 tracking-tight">
                  Imagen Rechazada
                </h2>
                <p className="text-sm text-gray-600">
                  No cumple con los estándares de calidad
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-200 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-gray-700" strokeWidth={2} />
            </button>
          </div>

          {/* Content - Scrollable */}
          <div className="px-6 py-5 space-y-5 max-h-[calc(90vh-180px)] overflow-y-auto">
            {/* Mensaje Principal */}
            <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200">
              <p className="text-sm text-gray-900 leading-relaxed">
                {errorData.message || 'La imagen no cumple con los estándares de calidad mínimos para un análisis médico confiable.'}
              </p>
            </div>

            {/* Métricas de Calidad - Simplificado sin tantos colores */}
            <div className="bg-gray-50 rounded-2xl p-5 border border-gray-200">
              <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <div className="w-2 h-2 bg-[#001F54] rounded-full"></div>
                Métricas de Calidad
              </h3>
              <div className="grid grid-cols-2 gap-4">
                {/* Confianza Detectada */}
                <div className="bg-white rounded-xl p-4 border border-gray-200">
                  <p className="text-xs text-gray-600 mb-1">Confianza Detectada</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold text-gray-900">
                      {errorData.detalles.confianza}
                    </span>
                    <span className="text-lg text-gray-600">%</span>
                  </div>
                  <div className="mt-2 w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div 
                      className="bg-gray-400 h-full rounded-full transition-all"
                      style={{ width: `${errorData.detalles.confianza}%` }}
                    />
                  </div>
                </div>

                {/* Confianza Requerida */}
                <div className="bg-white rounded-xl p-4 border border-gray-200">
                  <p className="text-xs text-gray-600 mb-1">Confianza Requerida</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold text-[#001F54]">
                      {errorData.detalles.umbral_requerido}
                    </span>
                    <span className="text-lg text-[#001F54]">%</span>
                  </div>
                  <div className="mt-2 w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div 
                      className="bg-[#001F54] h-full rounded-full"
                      style={{ width: `${errorData.detalles.umbral_requerido}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Diferencia */}
              <div className="mt-4 bg-white rounded-xl p-3 border border-gray-200">
                <p className="text-xs text-gray-700 text-center">
                  Se requieren <span className="font-bold text-[#001F54]">
                    {errorData.detalles.umbral_requerido - errorData.detalles.confianza}%
                  </span> adicionales de confianza
                </p>
              </div>
            </div>

            {/* Motivo - Ahora en gris como las otras notas */}
            {errorData.detalles.motivo && (
              <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200">
                <h3 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-gray-600" strokeWidth={2} />
                  Motivo del Rechazo
                </h3>
                <p className="text-sm text-gray-700 leading-relaxed">
                  {errorData.detalles.motivo}
                </p>
              </div>
            )}

            {/* Recomendaciones - Azul marino (tu color principal) */}
            {errorData.recomendaciones && errorData.recomendaciones.length > 0 && (
              <div className="bg-[#001F54]/5 rounded-2xl p-5 border border-[#001F54]/10">
                <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <div className="w-5 h-5 bg-[#001F54] rounded-full flex items-center justify-center">
                    <span className="text-xs font-bold text-white">💡</span>
                  </div>
                  Recomendaciones para Mejorar
                </h3>
                <ul className="space-y-2.5">
                  {errorData.recomendaciones.map((rec, index) => (
                    <li key={index} className="flex gap-3 text-sm text-gray-800">
                      <span className="flex-shrink-0 w-6 h-6 bg-[#001F54] text-white rounded-full flex items-center justify-center text-xs font-bold">
                        {index + 1}
                      </span>
                      <span className="leading-relaxed pt-0.5">{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Nota Importante - Gris como las otras */}
            <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200">
              <p className="text-xs text-gray-700 leading-relaxed">
                <strong className="text-gray-900">⚠️ Nota Importante:</strong> Por seguridad del paciente y confiabilidad del diagnóstico, este análisis NO se guardará en el sistema. Por favor, capture una nueva imagen siguiendo las recomendaciones.
              </p>
            </div>
          </div>

          {/* Footer - Buttons */}
          <div className="px-6 py-5 bg-gray-50 border-t border-gray-200 space-y-3">
            <button
              onClick={onRetry}
              className="w-full bg-[#001F54] hover:bg-[#00152E] active:bg-[#000A1A] text-white rounded-2xl py-4 flex items-center justify-center gap-3 transition-all shadow-lg"
            >
              <Camera className="w-5 h-5" strokeWidth={2.5} />
              <span className="tracking-tight font-medium">Volver a Intentar</span>
            </button>
            <button
              onClick={onClose}
              className="w-full bg-white hover:bg-gray-50 text-gray-700 rounded-2xl py-4 transition-all border border-gray-300"
            >
              <span className="tracking-tight">Cancelar</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}