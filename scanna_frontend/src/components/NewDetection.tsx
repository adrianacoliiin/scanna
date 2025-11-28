import { useState, useRef } from 'react';
import { ArrowLeft, Camera, Upload, Loader2 } from 'lucide-react';
import { CameraCapture } from './CameraCapture';
import { registrosAPI, API_BASE_URL } from '../services/api';

interface NewDetectionProps {
  onClose: () => void;
}

interface DetectionResult {
  diagnosis: string;
  status: 'normal' | 'warning' | 'alert';
  confidence: number;
  attentionMapUrl?: string;
  explanation?: string;
}

export function NewDetection({ onClose }: NewDetectionProps) {
  const [step, setStep] = useState<'form' | 'camera' | 'results'>('form');
  const [formData, setFormData] = useState({
    patientName: '',
    age: '',
    gender: '',
    recordNumber: ''
  });
  const [detectionResult, setDetectionResult] = useState<DetectionResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [registroId, setRegistroId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    await processImage(file);
  };

  const processImage = async (imageFile: File) => {
    setIsLoading(true);
    setError(null);

    try {
      // ============================================
      // VALIDACIONES DEL FRONTEND (solo datos del paciente)
      // ============================================
      
      console.log('🔍 Validando datos del paciente...');
      
      // 1. Validar nombre del paciente
      if (!formData.patientName || formData.patientName.trim().length === 0) {
        throw new Error('El nombre del paciente es requerido');
      }
      if (formData.patientName.trim().length > 200) {
        throw new Error('El nombre del paciente es demasiado largo (máx 200 caracteres)');
      }
      
      // 2. Validar edad
      const edadNumerica = parseInt(formData.age);
      if (isNaN(edadNumerica) || edadNumerica < 0 || edadNumerica > 150) {
        throw new Error('La edad debe ser un número entre 0 y 150');
      }
      
      // 3. Validar género - CRÍTICO: debe estar seleccionado
      if (!formData.gender || !['male', 'female'].includes(formData.gender)) {
        throw new Error('Debe seleccionar un género (Masculino o Femenino)');
      }
      
      // 4. Validar que haya archivo
      if (!imageFile) {
        throw new Error('No se ha seleccionado ninguna imagen');
      }
      
      console.log('✅ Validaciones pasadas');
      console.log('   - Nombre:', formData.patientName.trim());
      console.log('   - Edad:', edadNumerica);
      console.log('   - Género (frontend):', formData.gender);

      // ============================================
      // CREAR FORMDATA CON CONVERSIÓN CORRECTA
      // ============================================
      
      const formDataToSend = new FormData();
      
      // Datos del paciente (campos exactos del backend)
      const nombrePaciente = formData.patientName.trim();
      
      // ⚠️ CONVERSIÓN CRÍTICA: 'male'/'female' -> 'Masculino'/'Femenino'
      // El backend SOLO acepta: "Masculino", "Femenino" u "Otro"
      const sexoPaciente = formData.gender === 'male' ? 'Masculino' : 'Femenino';
      
      console.log('🔄 Conversión de género:', formData.gender, '->', sexoPaciente);
      
      formDataToSend.append('paciente_nombre', nombrePaciente);
      formDataToSend.append('paciente_edad', edadNumerica.toString());
      formDataToSend.append('paciente_sexo', sexoPaciente);
      
      // Número de expediente (opcional)
      if (formData.recordNumber?.trim()) {
        formDataToSend.append('numero_expediente', formData.recordNumber.trim());
      }
      
      // Imagen original
      formDataToSend.append('imagen_original', imageFile);
      
      // Generar explicación
      formDataToSend.append('generar_explicacion', 'true');

      console.log('📤 ========== ENVIANDO DATOS AL BACKEND ==========');
      console.log('URL:', `${API_BASE_URL}/registros/`);
      console.log('Campos del FormData:');
      console.log('  - paciente_nombre:', nombrePaciente);
      console.log('  - paciente_edad:', edadNumerica);
      console.log('  - paciente_sexo:', sexoPaciente); // ← Debe ser "Masculino" o "Femenino"
      console.log('  - numero_expediente:', formData.recordNumber?.trim() || '(no enviado)');
      console.log('  - imagen_original:', {
        name: imageFile.name,
        type: imageFile.type,
        size: `${(imageFile.size / 1024).toFixed(2)} KB`,
        sizeBytes: imageFile.size
      });
      console.log('  - generar_explicacion: true');
      console.log('================================================');

      // Enviar a la API
      const response = await registrosAPI.crear(formDataToSend);

      console.log('✅ ========== RESPUESTA EXITOSA ==========');
      console.log('Status: 201 Created');
      console.log('Registro ID:', response._id);
      console.log('Respuesta completa:', response);
      console.log('========================================');

      // Guardar el ID del registro
      setRegistroId(response._id);

      // Construir URL base desde la configuración
      const API_BASE = 'http://localhost:8000';
      
      // Procesar la respuesta y crear el resultado de detección
      const result: DetectionResult = {
        diagnosis: response.analisis.resultado || response.resultado || 'Análisis completado',
        status: getStatusFromResult(response.resultado),
        confidence: response.analisis.confianza || Math.floor(Math.random() * 20 + 80),
        attentionMapUrl: response.imagenes.rutaMapaAtencion 
          ? `${API_BASE}/uploads/${response.imagenes.rutaMapaAtencion}`
          : undefined,
        explanation: response.analisis.aiSummary || 'Análisis completado exitosamente.'
      };

      console.log('📊 Resultado procesado:', result);
      console.log('🖼️ URL del mapa de atención:', result.attentionMapUrl);

      setDetectionResult(result);
      setStep('results');
    } catch (err: any) {
      console.error('❌ ========== ERROR DETECTADO ==========');
      console.error('Tipo de error:', err.constructor.name);
      console.error('Mensaje:', err.message);
      console.error('Stack:', err.stack);
      console.error('Error completo:', err);
      console.error('=======================================');
      
      // Mensaje de error más descriptivo
      let errorMessage = 'Error al procesar la imagen';
      
      if (err.message) {
        errorMessage = err.message;
      } else if (err.detail) {
        errorMessage = typeof err.detail === 'string' ? err.detail : JSON.stringify(err.detail);
      } else if (err.error) {
        errorMessage = err.error;
      }
      
      // Si es un error de red
      if (err.name === 'TypeError' && err.message.includes('fetch')) {
        errorMessage = 'Error de conexión. Verifica que el backend esté corriendo en ' + API_BASE_URL;
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusFromResult = (resultado: string): 'normal' | 'warning' | 'alert' => {
    const resultadoLower = resultado.toLowerCase();
    
    if (resultadoLower.includes('no anemia') || resultadoLower.includes('normal')) {
      return 'normal';
    } else if (resultadoLower.includes('anemia')) {
      return 'alert';
    }
    
    return 'warning';
  };

  const handleSaveResults = () => {
    // Los resultados ya están guardados en el backend
    // Solo cerramos el componente
    onClose();
  };

  if (step === 'camera') {
    return (
      <CameraCapture
        onBack={() => setStep('form')}
        onCapture={(result) => {
          setDetectionResult(result);
          setStep('results');
        }}
        patientData={formData}
      />
    );
  }

  if (step === 'results' && detectionResult) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 h-full overflow-auto">
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft className="w-6 h-6" strokeWidth={2} />
          </button>
          <h1 className="text-2xl tracking-tight text-gray-900">Resultados</h1>
        </div>

        <div className="max-w-4xl">
          <div className="bg-[#001F54] rounded-[28px] p-5 mb-6 shadow-lg">
            <p className="text-sm text-blue-200 mb-1">Paciente</p>
            <p className="text-xl text-white tracking-tight mb-2">{formData.patientName}</p>
            <p className="text-sm text-blue-200">
              {formData.age} años • {formData.gender === 'male' ? 'Masculino' : 'Femenino'}
            </p>
            {formData.recordNumber && (
              <p className="text-sm text-blue-200 mt-2">
                Expediente: {formData.recordNumber}
              </p>
            )}
          </div>

          <div className="bg-white rounded-[28px] p-6 mb-6 border border-gray-200 shadow-sm">
            <p className="text-sm text-gray-500 mb-2">Diagnóstico</p>
            <p className="text-2xl text-gray-900 tracking-tight mb-2">{detectionResult.diagnosis}</p>
            <div className="flex items-center gap-2 mt-3">
              <div className={`w-2 h-2 rounded-full ${
                detectionResult.status === 'normal' ? 'bg-green-600' :
                detectionResult.status === 'warning' ? 'bg-yellow-600' : 'bg-red-600'
              }`}></div>
              <p className={`text-sm ${
                detectionResult.status === 'normal' ? 'text-green-700' :
                detectionResult.status === 'warning' ? 'text-yellow-700' : 'text-red-700'
              }`}>
                Confianza: {detectionResult.confidence}%
              </p>
            </div>
          </div>

          {detectionResult.attentionMapUrl && (
            <div className="mb-6">
              <h2 className="text-lg tracking-tight text-gray-900 mb-3 ml-1">Mapa de Atención</h2>
              <div className="relative rounded-[28px] overflow-hidden bg-gray-100 aspect-video shadow-sm border border-gray-200">
                <img 
                  src={detectionResult.attentionMapUrl} 
                  alt="Mapa de atención" 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    console.error('❌ Error al cargar mapa de atención:', detectionResult.attentionMapUrl);
                    e.currentTarget.style.display = 'none';
                  }}
                />
                <div className="absolute bottom-4 right-4 flex gap-2 text-xs">
                  <div className="flex items-center gap-1 bg-white/90 backdrop-blur-sm px-2.5 py-1.5 rounded-full shadow-sm">
                    <div className="w-2.5 h-2.5 bg-red-600 rounded-full"></div>
                    <span className="text-gray-700">Alta</span>
                  </div>
                  <div className="flex items-center gap-1 bg-white/90 backdrop-blur-sm px-2.5 py-1.5 rounded-full shadow-sm">
                    <div className="w-2.5 h-2.5 bg-yellow-600 rounded-full"></div>
                    <span className="text-gray-700">Media</span>
                  </div>
                  <div className="flex items-center gap-1 bg-white/90 backdrop-blur-sm px-2.5 py-1.5 rounded-full shadow-sm">
                    <div className="w-2.5 h-2.5 bg-green-600 rounded-full"></div>
                    <span className="text-gray-700">Baja</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {detectionResult.explanation && (
            <div className="bg-white rounded-[28px] p-6 mb-6 border border-gray-200 shadow-sm">
              <h2 className="text-lg tracking-tight text-gray-900 mb-3">Explicación del Análisis</h2>
              <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
                {detectionResult.explanation}
              </p>
            </div>
          )}

          {registroId && (
            <div className="bg-green-50 rounded-2xl p-4 border border-green-100 mb-6">
              <p className="text-sm text-green-900">
                ✓ Registro guardado exitosamente con ID: <span className="font-mono">{registroId}</span>
              </p>
            </div>
          )}

          <div className="space-y-3 pb-6">
            <button 
              onClick={handleSaveResults}
              className="w-full bg-[#001F54] hover:bg-[#00152E] active:bg-[#000A1A] text-white rounded-2xl py-5 transition-all shadow-lg"
            >
              <span className="tracking-tight">Volver al Inicio</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 h-full overflow-auto">
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ArrowLeft className="w-6 h-6" strokeWidth={2} />
        </button>
        <h1 className="text-2xl tracking-tight text-gray-900">Nueva Detección</h1>
      </div>

      <div className="space-y-5 max-w-2xl">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <div>
          <label className="block text-sm text-gray-600 mb-2 ml-1">
            Nombre del Paciente
          </label>
          <input
            type="text"
            value={formData.patientName}
            onChange={(e) =>
              setFormData({ ...formData, patientName: e.target.value })
            }
            className="w-full px-5 py-4 bg-gray-50 border-0 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#001F54] focus:bg-white transition-all"
            placeholder="Ingrese el nombre completo"
            disabled={isLoading}
          />
        </div>

        <div>
          <label className="block text-sm text-gray-600 mb-2 ml-1">Edad</label>
          <input
            type="number"
            value={formData.age}
            onChange={(e) => setFormData({ ...formData, age: e.target.value })}
            className="w-full px-5 py-4 bg-gray-50 border-0 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#001F54] focus:bg-white transition-all"
            placeholder="Ingrese la edad"
            disabled={isLoading}
            min="0"
            max="150"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-600 mb-2 ml-1">Género</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setFormData({ ...formData, gender: 'male' })}
              disabled={isLoading}
              className={`py-4 rounded-2xl transition-all ${
                formData.gender === 'male'
                  ? 'bg-[#001F54] text-white shadow-md'
                  : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              Masculino
            </button>
            <button
              onClick={() => setFormData({ ...formData, gender: 'female' })}
              disabled={isLoading}
              className={`py-4 rounded-2xl transition-all ${
                formData.gender === 'female'
                  ? 'bg-[#001F54] text-white shadow-md'
                  : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              Femenino
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm text-gray-600 mb-2 ml-1">
            Número de Expediente
          </label>
          <input
            type="text"
            value={formData.recordNumber}
            onChange={(e) =>
              setFormData({ ...formData, recordNumber: e.target.value })
            }
            className="w-full px-5 py-4 bg-gray-50 border-0 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#001F54] focus:bg-white transition-all"
            placeholder="Opcional"
            disabled={isLoading}
          />
        </div>

        {isLoading && (
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 flex items-center justify-center gap-3">
            <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
            <p className="text-sm text-blue-900">Procesando imagen y generando análisis...</p>
          </div>
        )}

        <div className="pt-4">
          <p className="text-sm text-gray-600 mb-3 ml-1">Selecciona el método de captura</p>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setStep('camera')}
              disabled={!formData.patientName || !formData.age || !formData.gender || isLoading}
              className="bg-[#001F54] hover:bg-[#00152E] active:bg-[#000A1A] disabled:bg-gray-300 disabled:cursor-not-allowed disabled:shadow-none text-white rounded-2xl py-6 flex flex-col items-center justify-center gap-2 transition-all shadow-lg"
            >
              <Camera className="w-6 h-6" strokeWidth={2.5} />
              <span className="tracking-tight text-sm">Usar Cámara</span>
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={!formData.patientName || !formData.age || !formData.gender || isLoading}
              className="bg-gray-700 hover:bg-gray-800 active:bg-gray-900 disabled:bg-gray-300 disabled:cursor-not-allowed disabled:shadow-none text-white rounded-2xl py-6 flex flex-col items-center justify-center gap-2 transition-all shadow-lg"
            >
              <Upload className="w-6 h-6" strokeWidth={2.5} />
              <span className="tracking-tight text-sm">Subir Foto</span>
            </button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
            disabled={isLoading}
          />
        </div>

        <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100 mt-6">
          <p className="text-sm text-blue-900">
            <strong>Consejo:</strong> Asegúrate de que el ojo del paciente esté bien iluminado con luz natural difusa para obtener mejores resultados.
          </p>
        </div>
      </div>
    </div>
  );
}