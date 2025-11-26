import { useState, useRef } from 'react';
import { ArrowLeft, Camera, AlertCircle, Lightbulb, Loader } from 'lucide-react';

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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setCapturedImage(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleAnalyze = async () => {
    if (!capturedImage) return;
    
    setIsProcessing(true);

    // TODO: Enviar imagen al backend para análisis
    // const formData = new FormData();
    // formData.append('image', capturedImage);
    // formData.append('patientData', JSON.stringify(patientData));
    
    // const response = await fetch('/api/analyze', {
    //   method: 'POST',
    //   body: formData
    // });
    // const result = await response.json();
    
    // Simular respuesta del backend
    setTimeout(() => {
      setIsProcessing(false);
      onCapture({
        diagnosis: 'Resultado pendiente',
        status: 'normal',
        confidence: 0,
        attentionMapUrl: capturedImage,
        explanation: 'Análisis pendiente de procesamiento'
      });
    }, 2000);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 h-full flex flex-col">
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={onBack}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ArrowLeft className="w-6 h-6" strokeWidth={2} />
        </button>
        <h1 className="text-2xl tracking-tight text-gray-900">Captura de Imagen</h1>
      </div>

      <div className="max-w-4xl mx-auto w-full">
        <div className="bg-white rounded-[28px] p-5 mb-6 border border-gray-200 shadow-sm">
          <p className="text-sm text-gray-500 mb-1">Paciente</p>
          <p className="text-lg text-gray-900 tracking-tight">{patientData.patientName}</p>
        </div>

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
                  <span>Enfoque la parte rosada interna del párpado inferior</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <div className="w-full aspect-video bg-gray-900 rounded-[28px] overflow-hidden relative flex items-center justify-center shadow-xl">
            {capturedImage ? (
              <img src={capturedImage} alt="Captured" className="w-full h-full object-cover" />
            ) : (
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
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileSelect}
          className="hidden"
        />

        {!capturedImage ? (
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full bg-[#001F54] hover:bg-[#00152E] active:bg-[#000A1A] text-white rounded-2xl py-5 flex items-center justify-center gap-3 transition-all shadow-lg"
          >
            <Camera className="w-6 h-6" strokeWidth={2.5} />
            <span className="tracking-tight">Seleccionar Imagen</span>
          </button>
        ) : (
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
                  <span className="tracking-tight">Procesando imagen...</span>
                </>
              ) : (
                <span className="tracking-tight">Analizar Imagen</span>
              )}
            </button>
            <button
              onClick={() => setCapturedImage(null)}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-2xl py-5 transition-all"
            >
              <span className="tracking-tight">Tomar otra foto</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}