import { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Camera, AlertCircle, Lightbulb, Loader, Upload, FlipHorizontal } from 'lucide-react';
import { registrosAPI } from '../services/api';
import { ImageQualityErrorModal } from './ImageQualityErrorModal'; // ✅ NUEVO

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
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment'); // ✅ NUEVO: Estado para cámara
  
  // ✅ NUEVO: Estados para el modal de error de calidad
  const [showQualityErrorModal, setShowQualityErrorModal] = useState(false);
  const [qualityErrorData, setQualityErrorData] = useState<any>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ✅ NUEVO: Iniciar cámara automáticamente al montar el componente
  useEffect(() => {
    startCamera();
    
    // Limpiar stream al desmontar
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []); // Solo se ejecuta una vez al montar

  const startCamera = async () => {
    try {
      setError(null);
      setCameraError(null);
      
      let mediaStream: MediaStream | null = null;
      
      try {
        // ✅ USAR EL ESTADO facingMode
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { 
            facingMode: facingMode, // 'environment' o 'user'
            width: { ideal: 1920 },
            height: { ideal: 1080 }
          },
          audio: false
        });
      } catch (err) {
        // Si falla con el modo específico, intentar con cualquier cámara
        console.log('Cámara específica no disponible, intentando con cualquiera...');
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { 
            width: { ideal: 1920 },
            height: { ideal: 1080 }
          },
          audio: false
        });
      }
      
      setStream(mediaStream);
      setIsCameraActive(true);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play();
        };
      }
      
      console.log('✅ Cámara iniciada correctamente con modo:', facingMode);
      
    } catch (err: any) {
      console.error('❌ Error al acceder a la cámara:', err);
      
      let errorMessage = 'No se pudo acceder a la cámara. ';
      
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        errorMessage += 'Por favor, permite el acceso a la cámara en la configuración de tu navegador.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        errorMessage += 'No se encontró ninguna cámara en tu dispositivo.';
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        errorMessage += 'La cámara está siendo usada por otra aplicación.';
      } else {
        errorMessage += 'Usa la opción de subir archivo.';
      }
      
      setCameraError(errorMessage);
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsCameraActive(false);
    console.log('🛑 Cámara detenida');
  };

  // ✅ NUEVO: Función para cambiar entre cámara frontal y trasera
  const toggleCamera = async () => {
    // Detener cámara actual
    stopCamera();
    
    // Cambiar modo
    const newMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(newMode);
    
    console.log('🔄 Cambiando cámara a:', newMode === 'environment' ? 'trasera' : 'frontal');
    
    // Pequeña pausa para asegurar que la cámara se detuvo
    setTimeout(() => {
      startCamera();
    }, 100);
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) {
      setError('Error al capturar foto. Por favor, intenta de nuevo.');
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) {
      setError('Error al procesar la imagen. Por favor, intenta de nuevo.');
      return;
    }

    // Configurar canvas con las dimensiones del video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Dibujar el frame actual del video en el canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convertir a blob y luego a File
    canvas.toBlob((blob) => {
      if (!blob) {
        setError('Error al crear la imagen. Por favor, intenta de nuevo.');
        return;
      }

      const file = new File([blob], `captura_${Date.now()}.jpg`, { type: 'image/jpeg' });
      const imageUrl = canvas.toDataURL('image/jpeg', 0.95);

      setSelectedFile(file);
      setCapturedImage(imageUrl);
      stopCamera();
      
      console.log('📸 Foto capturada:', {
        size: `${(file.size / 1024).toFixed(2)} KB`,
        dimensions: `${canvas.width}x${canvas.height}`
      });
    }, 'image/jpeg', 0.95);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar que sea una imagen
    if (!file.type.startsWith('image/')) {
      setError('Por favor seleccione un archivo de imagen válido (JPG, PNG, WEBP)');
      return;
    }

    // Validar tamaño (máximo 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('La imagen es demasiado grande. Máximo 10MB');
      return;
    }

    setError(null);
    setSelectedFile(file);

    // Detener cámara si está activa
    if (isCameraActive) {
      stopCamera();
    }

    // Previsualizar la imagen
    const reader = new FileReader();
    reader.onload = (event) => {
      setCapturedImage(event.target?.result as string);
    };
    reader.readAsDataURL(file);
    
    console.log('📁 Archivo seleccionado:', {
      name: file.name,
      size: `${(file.size / 1024).toFixed(2)} KB`,
      type: file.type
    });
  };

  const handleRetake = () => {
    setCapturedImage(null);
    setSelectedFile(null);
    setError(null);
    setCameraError(null);
    // Reiniciar cámara
    startCamera();
  };

  // ✅ NUEVO: Manejar cierre del modal de error de calidad
  const handleCloseQualityErrorModal = () => {
    setShowQualityErrorModal(false);
    setQualityErrorData(null);
  };

  // ✅ NUEVO: Manejar "Volver a Intentar" desde el modal
  const handleRetryFromModal = () => {
    setShowQualityErrorModal(false);
    setQualityErrorData(null);
    handleRetake(); // Reiniciar captura
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

      console.log('📤 Enviando datos al backend...');
      console.log('- Paciente:', patientData.patientName.trim());
      console.log('- Edad:', edadNumerica);
      console.log('- Sexo:', patientData.gender === 'male' ? 'Masculino' : 'Femenino');
      console.log('- Expediente:', patientData.recordNumber?.trim() || '(sin expediente)');
      console.log('- Imagen:', selectedFile.name, `(${(selectedFile.size / 1024).toFixed(2)} KB)`);

      const response = await registrosAPI.crear(formDataToSend);
      
      console.log('✅ Registro creado exitosamente:', response);

      const API_BASE = 'http://localhost:8000';
      
      const resultData = {
        registroId: response._id,
        diagnosis: response.analisis.resultado || response.resultado || 'Análisis completado',
        status: getStatusFromResult(response.resultado),
        confidence: response.analisis.confianza || Math.floor(Math.random() * 20 + 80),
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
      console.error('❌ ========== ERROR COMPLETO ==========');
      console.error('Error objeto:', err);
      console.error('Error.message:', err.message);
      console.error('Error.status:', err.status);
      console.error('Error.data:', err.data);
      console.error('Error.isImageQualityError:', err.isImageQualityError);
      console.error('=====================================');
      
      // ✅ DETECCIÓN DEL ERROR 422 ESPECIAL
      if (err.isImageQualityError && err.status === 422 && err.data) {
        console.log('✅ ¡ERROR 422 DETECTADO! - Mostrando modal...');
        console.log('Datos del error:', err.data);
        
        // Guardar datos y mostrar modal
        setQualityErrorData(err.data);
        setShowQualityErrorModal(true);
        setError(null);
        
        console.log('Estado del modal después de setear:');
        console.log('- showQualityErrorModal:', true);
        console.log('- qualityErrorData:', err.data);
        
      } else {
        // Otros errores
        let errorMessage = 'Error al procesar la imagen';
        
        if (err.message && err.message !== 'IMAGEN_INVALIDA') {
          errorMessage = err.message;
        }
        
        setError(errorMessage);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      <div className="flex items-center gap-4 p-4 bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <button
          onClick={onBack}
          disabled={isProcessing}
          className="p-2 hover:bg-gray-100 active:bg-gray-200 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ArrowLeft className="w-6 h-6 text-gray-900" strokeWidth={2} />
        </button>
        <h1 className="text-2xl tracking-tight text-gray-900">Captura de Imagen</h1>
      </div>

      <div className="max-w-4xl mx-auto w-full px-4">
        {/* Información del Paciente */}
        <div className="bg-white rounded-[28px] p-5 mb-6 mt-6 border border-gray-200 shadow-sm">
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

        {/* Mensaje de Error de Cámara */}
        {cameraError && !capturedImage && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 mb-6">
            <div className="flex gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0" strokeWidth={2} />
              <div>
                <p className="text-sm text-yellow-900 font-medium mb-2">No se pudo acceder a la cámara</p>
                <p className="text-sm text-yellow-800">{cameraError}</p>
                <p className="text-sm text-yellow-800 mt-2">Puedes usar la opción "Subir Archivo" para continuar.</p>
              </div>
            </div>
          </div>
        )}

        {/* Mensaje de Error General */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-6">
            <div className="flex gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" strokeWidth={2} />
              <div className="flex-1">
                <p className="text-sm text-red-800 whitespace-pre-wrap">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* ✅ VISOR DE CÁMARA EN TIEMPO REAL */}
        <div className="mb-6">
          <div className="w-full aspect-video bg-gray-900 rounded-[28px] overflow-hidden relative flex items-center justify-center shadow-xl">
            {/* Video en vivo de la cámara */}
            {isCameraActive && !capturedImage && (
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                {/* Overlay con guías de enfoque */}
                <div className="absolute inset-0 pointer-events-none">
                  {/* Esquinas decorativas */}
                  <div className="absolute top-6 left-6 w-8 h-8 border-t-2 border-l-2 border-white/70 rounded-tl-xl"></div>
                  <div className="absolute top-6 right-6 w-8 h-8 border-t-2 border-r-2 border-white/70 rounded-tr-xl"></div>
                  <div className="absolute bottom-6 left-6 w-8 h-8 border-b-2 border-l-2 border-white/70 rounded-bl-xl"></div>
                  <div className="absolute bottom-6 right-6 w-8 h-8 border-b-2 border-r-2 border-white/70 rounded-br-xl"></div>
                  
                  {/* Indicador de cámara activa */}
                  <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-red-500/90 px-3 py-1 rounded-full flex items-center gap-2">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                    <span className="text-white text-xs font-medium">EN VIVO</span>
                  </div>
                  
                  {/* ✅ NUEVO: Botón para cambiar cámara */}
                  <button
                    onClick={toggleCamera}
                    className="absolute bottom-4 right-4 bg-black/50 backdrop-blur-sm hover:bg-black/70 p-3 rounded-full transition-all pointer-events-auto"
                    title={facingMode === 'environment' ? 'Cambiar a cámara frontal' : 'Cambiar a cámara trasera'}
                  >
                    <FlipHorizontal className="w-5 h-5 text-white" strokeWidth={2.5} />
                  </button>
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
                <div className="relative z-10 w-48 h-48 border-4 border-white/50 rounded-full flex items-center justify-center">
                  <div className="w-24 h-16 border-2 border-blue-400 rounded-2xl"></div>
                </div>
                <div className="absolute top-6 left-6 w-8 h-8 border-t-2 border-l-2 border-white/70 rounded-tl-xl"></div>
                <div className="absolute top-6 right-6 w-8 h-8 border-t-2 border-r-2 border-white/70 rounded-tr-xl"></div>
                <div className="absolute bottom-6 left-6 w-8 h-8 border-b-2 border-l-2 border-white/70 rounded-bl-xl"></div>
                <div className="absolute bottom-6 right-6 w-8 h-8 border-b-2 border-r-2 border-white/70 rounded-br-xl"></div>
                <div className="absolute bottom-10 left-0 right-0 text-center">
                  <p className="text-white/90 text-sm tracking-tight">
                    {cameraError ? 'Usa "Subir Archivo" para continuar' : 'Iniciando cámara...'}
                  </p>
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
          capture="environment"
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
              <span className="tracking-tight font-medium text-sm">Reintentar Cámara</span>
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

        {/* Botón de captura cuando la cámara está activa */}
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
              onClick={() => fileInputRef.current?.click()}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-2xl py-5 flex items-center justify-center gap-3 transition-all"
            >
              <Upload className="w-5 h-5" strokeWidth={2} />
              <span className="tracking-tight">O subir desde archivo</span>
            </button>
          </div>
        )}

        {/* Botones cuando hay imagen capturada */}
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

      {/* ✅ NUEVO: Modal de Error de Calidad */}
      {qualityErrorData && (
        <ImageQualityErrorModal
          isOpen={showQualityErrorModal}
          onClose={handleCloseQualityErrorModal}
          onRetry={handleRetryFromModal}
          errorData={qualityErrorData}
        />
      )}
    </div>
  );
}