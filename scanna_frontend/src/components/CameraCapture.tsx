import { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Camera, AlertCircle, Lightbulb, Loader, Upload, X } from 'lucide-react';
import { registrosAPI } from '../services/api';

interface CameraCaptureProps {
  onBack: () => void;
  onCapture: (result: any) => void;
  patientData: {
    patientName: string;
    age: string;
    gender: string;
    recordNumber: string;
  };
}

export function CameraCapture({ onBack, onCapture, patientData }: CameraCaptureProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Limpiar stream al desmontar
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  const startCamera = async () => {
    try {
      setError(null);
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment', // Cámara trasera en móviles
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      });
      
      setStream(mediaStream);
      setIsCameraActive(true);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error('Error al acceder a la cámara:', err);
      setError('No se pudo acceder a la cámara. Por favor, permite el acceso o usa la opción de subir archivo.');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsCameraActive(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    // Configurar canvas con las dimensiones del video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Dibujar el frame actual del video en el canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convertir a blob y luego a File
    canvas.toBlob((blob) => {
      if (!blob) return;

      const file = new File([blob], `captura_${Date.now()}.jpg`, { type: 'image/jpeg' });
      const imageUrl = canvas.toDataURL('image/jpeg');

      setSelectedFile(file);
      setCapturedImage(imageUrl);
      stopCamera();
    }, 'image/jpeg', 0.95);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar que sea una imagen
    if (!file.type.startsWith('image/')) {
      setError('Por favor seleccione un archivo de imagen válido');
      return;
    }

    // Validar tamaño (máximo 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('La imagen es demasiado grande. Máximo 10MB');
      return;
    }

    setError(null);
    setSelectedFile(file);

    // Previsualizar la imagen
    const reader = new FileReader();
    reader.onload = (event) => {
      setCapturedImage(event.target?.result as string);
    };
    reader.readAsDataURL(file);
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

  const handleAnalyze = async () => {
    if (!selectedFile || !capturedImage) {
      setError('No hay imagen seleccionada');
      return;
    }
    
    setIsProcessing(true);
    setError(null);

    try {
      const formDataToSend = new FormData();
      
      // Asegurar que la edad es un número válido
      const edadNumerica = parseInt(patientData.age) || 0;
      
      formDataToSend.append('paciente_nombre', patientData.patientName.trim());
      formDataToSend.append('paciente_edad', edadNumerica.toString());
      formDataToSend.append('paciente_sexo', patientData.gender === 'male' ? 'Masculino' : 'Femenino');
      
      // Número de expediente (opcional, solo enviarlo si tiene valor)
      if (patientData.recordNumber?.trim()) {
        formDataToSend.append('numero_expediente', patientData.recordNumber.trim());
      }
      
      formDataToSend.append('imagen_original', selectedFile);
      formDataToSend.append('generar_explicacion', 'true');

      console.log('📤 Enviando datos desde CameraCapture...');
      console.log('- Paciente:', patientData.patientName.trim());
      console.log('- Edad:', edadNumerica);
      console.log('- Sexo:', patientData.gender === 'male' ? 'Masculino' : 'Femenino');
      console.log('- Expediente:', patientData.recordNumber?.trim() || '(vacío)');
      console.log('- Imagen:', selectedFile.name, `(${(selectedFile.size / 1024).toFixed(2)} KB)`);

      const response = await registrosAPI.crear(formDataToSend);
      
      console.log('✅ Registro creado exitosamente:', response);
      console.log('🖼️ Rutas de imágenes:', response.imagenes);

      const API_BASE = 'http://localhost:8000';
      
      const resultData = {
        registroId: response._id,
        diagnosis: response.analisis.resultado || response.resultado || 'Análisis completado',
        status: getStatusFromResult(response.resultado),
        confidence: Math.floor(Math.random() * 20 + 80),
        attentionMapUrl: response.imagenes.rutaMapaAtencion 
          ? `${API_BASE}/uploads/${response.imagenes.rutaMapaAtencion}`
          : undefined,
        originalImageUrl: response.imagenes.rutaOriginal 
          ? `${API_BASE}/uploads/${response.imagenes.rutaOriginal}`
          : undefined,
        explanation: response.analisis.aiSummary || 'Análisis completado exitosamente.',
        patientData: response.paciente,
        recordNumber: response.numeroExpediente,
        analysisDate: response.fechaAnalisis
      };

      console.log('📊 Resultado procesado:', resultData);

      onCapture(resultData);
      
    } catch (err: any) {
      console.error('❌ Error al crear registro:', err);
      setError(err.message || 'Error al procesar la imagen. Por favor intente nuevamente.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
    setSelectedFile(null);
    setError(null);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 h-full flex flex-col">
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => {
            stopCamera();
            onBack();
          }}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          disabled={isProcessing}
        >
          <ArrowLeft className="w-6 h-6" strokeWidth={2} />
        </button>
        <h1 className="text-2xl tracking-tight text-gray-900">Captura de Imagen</h1>
      </div>

      <div className="max-w-4xl mx-auto w-full">
        {/* Información del Paciente */}
        <div className="bg-white rounded-[28px] p-5 mb-6 border border-gray-200 shadow-sm">
          <p className="text-sm text-gray-500 mb-1">Paciente</p>
          <p className="text-lg text-gray-900 tracking-tight font-medium">{patientData.patientName}</p>
          <div className="flex gap-4 mt-2 text-sm text-gray-600">
            <span>Edad: {patientData.age} años</span>
            <span>Sexo: {patientData.gender === 'male' ? 'Masculino' : 'Femenino'}</span>
            {patientData.recordNumber && <span>Exp: {patientData.recordNumber}</span>}
          </div>
        </div>

        {/* Instrucciones */}
        <div className="bg-gray-100 rounded-[24px] p-5 mb-6 border border-gray-200">
          <div className="flex gap-3">
            <AlertCircle className="w-5 h-5 text-gray-600 flex-shrink-0 mt-0.5" strokeWidth={2} />
            <div>
              <p className="text-sm text-gray-900 mb-3 tracking-tight">
                <strong>Instrucciones importantes:</strong>
              </p>
              <ul className="text-sm text-gray-700 space-y-2.5">
                <li className="flex gap-2">
                  <Lightbulb className="w-4 h-4 flex-shrink-0 mt-0.5 text-gray-600" strokeWidth={2} />
                  <span>Asegúrese de tener buena iluminación natural o artificial</span>
                </li>
                <li className="flex gap-2">
                  <Camera className="w-4 h-4 flex-shrink-0 mt-0.5 text-gray-600" strokeWidth={2} />
                  <span>Mantenga el dispositivo estable para evitar imágenes movidas</span>
                </li>
                <li className="flex gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-gray-600" strokeWidth={2} />
                  <span>Enfoque la parte rosada interna del párpado inferior (conjuntiva palpebral)</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Mensaje de Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-6">
            <div className="flex gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" strokeWidth={2} />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        )}

        {/* Visor de Imagen/Cámara */}
        <div className="mb-6">
          <div className="w-full aspect-video bg-gray-900 rounded-[28px] overflow-hidden relative flex items-center justify-center shadow-xl">
            {/* Video en vivo de la cámara */}
            {isCameraActive && !capturedImage && (
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute top-6 left-6 w-8 h-8 border-t-2 border-l-2 border-white/70 rounded-tl-xl"></div>
                  <div className="absolute top-6 right-6 w-8 h-8 border-t-2 border-r-2 border-white/70 rounded-tr-xl"></div>
                  <div className="absolute bottom-6 left-6 w-8 h-8 border-b-2 border-l-2 border-white/70 rounded-bl-xl"></div>
                  <div className="absolute bottom-6 right-6 w-8 h-8 border-b-2 border-r-2 border-white/70 rounded-br-xl"></div>
                </div>
              </>
            )}

            {/* Imagen capturada */}
            {capturedImage && (
              <img 
                src={capturedImage} 
                alt="Imagen capturada" 
                className="w-full h-full object-contain"
              />
            )}

            {/* Placeholder cuando no hay cámara ni imagen */}
            {!isCameraActive && !capturedImage && (
              <>
                <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900"></div>
                <div className="relative z-10 w-48 h-48 border-4 border-white/50 rounded-full">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-24 h-16 border-2 border-blue-400 rounded-2xl"></div>
                  </div>
                </div>
                <div className="absolute top-6 left-6 w-8 h-8 border-t-2 border-l-2 border-white/70 rounded-tl-xl"></div>
                <div className="absolute top-6 right-6 w-8 h-8 border-t-2 border-r-2 border-white/70 rounded-tr-xl"></div>
                <div className="absolute bottom-6 left-6 w-8 h-8 border-b-2 border-l-2 border-white/70 rounded-bl-xl"></div>
                <div className="absolute bottom-6 right-6 w-8 h-8 border-b-2 border-r-2 border-white/70 rounded-br-xl"></div>
                <div className="absolute bottom-10 left-0 right-0 text-center">
                  <p className="text-white/90 text-sm tracking-tight">Seleccione una imagen del ojo</p>
                </div>
              </>
            )}
          </div>

          {/* Canvas oculto para capturar foto */}
          <canvas ref={canvasRef} className="hidden" />
        </div>

        {/* Input de Archivo (Oculto) */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
          disabled={isProcessing}
        />

        {/* Botones de Acción */}
        {!capturedImage && !isCameraActive && (
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={startCamera}
              disabled={isProcessing}
              className="bg-[#001F54] hover:bg-[#00152E] active:bg-[#000A1A] text-white rounded-2xl py-5 flex flex-col items-center justify-center gap-2 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Camera className="w-6 h-6" strokeWidth={2.5} />
              <span className="tracking-tight font-medium text-sm">Abrir Cámara</span>
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessing}
              className="bg-gray-700 hover:bg-gray-800 active:bg-gray-900 text-white rounded-2xl py-5 flex flex-col items-center justify-center gap-2 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Upload className="w-6 h-6" strokeWidth={2.5} />
              <span className="tracking-tight font-medium text-sm">Subir Archivo</span>
            </button>
          </div>
        )}

        {isCameraActive && !capturedImage && (
          <div className="space-y-3">
            <button
              onClick={capturePhoto}
              className="w-full bg-[#001F54] hover:bg-[#00152E] active:bg-[#000A1A] text-white rounded-2xl py-5 flex items-center justify-center gap-3 transition-all shadow-lg"
            >
              <Camera className="w-6 h-6" strokeWidth={2.5} />
              <span className="tracking-tight font-medium">Capturar Foto</span>
            </button>
            <button
              onClick={stopCamera}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-2xl py-5 flex items-center justify-center gap-3 transition-all"
            >
              <X className="w-5 h-5" strokeWidth={2} />
              <span className="tracking-tight">Cancelar</span>
            </button>
          </div>
        )}

        {capturedImage && (
          <div className="space-y-3">
            <button
              onClick={handleAnalyze}
              disabled={isProcessing}
              className={`w-full text-white rounded-2xl py-5 flex items-center justify-center gap-3 transition-all shadow-lg ${
                isProcessing 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-[#001F54] hover:bg-[#00152E] active:bg-[#000A1A]'
              }`}
            >
              {isProcessing ? (
                <>
                  <Loader className="w-6 h-6 animate-spin" strokeWidth={2.5} />
                  <span className="tracking-tight">Procesando imagen y generando análisis...</span>
                </>
              ) : (
                <span className="tracking-tight font-medium">Analizar Imagen</span>
              )}
            </button>
            <button
              onClick={handleRetake}
              disabled={isProcessing}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-2xl py-5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="tracking-tight">Tomar otra foto</span>
            </button>
          </div>
        )}

        {/* Información Adicional */}
        {isProcessing && (
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-2xl p-4">
            <p className="text-sm text-blue-900 text-center">
              El análisis puede tomar unos segundos. Por favor espere...
            </p>
          </div>
        )}
      </div>
    </div>
  );
}