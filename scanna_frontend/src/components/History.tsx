import { useState, useEffect } from 'react';
import { Search, ChevronRight, Calendar, ArrowLeft, Activity, AlertCircle } from 'lucide-react';
import { perfilAPI, API_BASE_URL, type EspecialistaEstadisticas } from '../services/api';

interface Detection {
  id: string;
  patientName: string;
  age: number;
  gender: string;
  date: string;
  time: string;
  result: string;
  status: 'normal' | 'alert';
  recordNumber: string;
  confidence: string;
  imageUrl?: string;
  attentionMapUrl?: string;
  summary?: string;
}

export function History() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDetection, setSelectedDetection] = useState<Detection | null>(null);
  const [filter, setFilter] = useState<'all' | 'positive' | 'negative'>('all');
  const [allDetections, setAllDetections] = useState<Detection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data: EspecialistaEstadisticas = await perfilAPI.obtenerEstadisticas();
      
      const mappedDetections: Detection[] = data.ultimos_analisis.map((registro) => {
        const fechaAnalisis = new Date(registro.fechaAnalisis);
        const isPositive = registro.resultado.toLowerCase().includes('anemia') || 
                          registro.resultado.toLowerCase() === 'positivo';
        
        return {
          id: registro._id,
          patientName: registro.paciente.nombre,
          age: registro.paciente.edad,
          gender: registro.paciente.sexo,
          date: fechaAnalisis.toLocaleDateString('es-MX', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
          }),
          time: fechaAnalisis.toLocaleTimeString('es-MX', {
            hour: '2-digit',
            minute: '2-digit'
          }),
          result: registro.analisis?.resultado || registro.resultado || 'Sin resultado',
          status: isPositive ? 'alert' : 'normal',
          recordNumber: registro.numeroExpediente || '',
          imageUrl: registro.imagenes?.rutaOriginal,
          attentionMapUrl: registro.imagenes?.rutaMapaAtencion,
          summary: registro.analisis?.aiSummary,
          confidence: '95%'
        };
      });
      
      setAllDetections(mappedDetections);
    } catch (err) {
      console.error('Error fetching history:', err);
      setError(err instanceof Error ? err.message : 'Error al cargar historial');
    } finally {
      setLoading(false);
    }
  };

  const filteredDetections = allDetections.filter((detection) => {
    const matchesSearch = searchQuery === '' || 
      detection.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      detection.recordNumber.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (!matchesSearch) return false;
    
    if (filter === 'positive') return detection.status === 'alert';
    if (filter === 'negative') return detection.status === 'normal';
    return true;
  });

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="mb-8">
          <h1 className="text-2xl lg:text-3xl tracking-tight text-gray-900">Historial</h1>
          <p className="text-sm text-gray-500 mt-1">Gestiona y consulta detecciones anteriores</p>
        </div>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-[#001F54] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600 tracking-tight">Cargando historial...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="mb-8">
          <h1 className="text-2xl lg:text-3xl tracking-tight text-gray-900">Historial</h1>
          <p className="text-sm text-gray-500 mt-1">Gestiona y consulta detecciones anteriores</p>
        </div>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="bg-white rounded-[24px] lg:rounded-[28px] p-6 lg:p-8 border border-red-200 shadow-sm max-w-md">
            <div className="flex flex-col items-center text-center">
              <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mb-4">
                <AlertCircle className="w-7 h-7 text-red-600" strokeWidth={2} />
              </div>
              <h3 className="text-lg tracking-tight text-gray-900 mb-2">Error al cargar historial</h3>
              <p className="text-gray-600 mb-6">{error}</p>
              <button
                onClick={fetchHistory}
                className="px-6 py-3 bg-[#001F54] hover:bg-[#003580] text-white rounded-2xl transition-all tracking-tight"
              >
                Reintentar
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (selectedDetection) {
    const imageUrl = selectedDetection.imageUrl ? `${API_BASE_URL}/uploads/${selectedDetection.imageUrl}` : undefined;
    const attentionMapUrl = selectedDetection.attentionMapUrl ? `${API_BASE_URL}/uploads/${selectedDetection.attentionMapUrl}` : undefined;

    return (
      <div className="p-4 sm:p-6 lg:p-8 h-full overflow-auto">
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => setSelectedDetection(null)}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft className="w-6 h-6" strokeWidth={2} />
          </button>
          <h1 className="text-2xl tracking-tight text-gray-900">Detalle</h1>
        </div>

        <div className="max-w-4xl">
          <div className="bg-[#001F54] rounded-[28px] p-6 mb-6 shadow-lg">
            <p className="text-sm text-blue-200 mb-2">Paciente</p>
            <p className="text-xl text-white tracking-tight mb-4">{selectedDetection.patientName}</p>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-blue-100">Edad</p>
                <p className="text-white">{selectedDetection.age} años</p>
              </div>
              <div>
                <p className="text-blue-100">Género</p>
                <p className="text-white">{selectedDetection.gender}</p>
              </div>
              {selectedDetection.recordNumber && (
                <div className="col-span-2">
                  <p className="text-blue-100">Expediente</p>
                  <p className="text-white">{selectedDetection.recordNumber}</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-[28px] p-6 mb-6 border border-gray-200 shadow-sm">
            <div className="flex items-center gap-2 text-gray-500 mb-4">
              <Calendar className="w-4 h-4" strokeWidth={2} />
              <span className="text-sm">{selectedDetection.date} • {selectedDetection.time}</span>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Resultado</p>
                <p className="text-xl text-gray-900 tracking-tight">{selectedDetection.result}</p>
              </div>
              <span
                className={`px-4 py-2 rounded-full text-sm tracking-tight ${
                  selectedDetection.status === 'normal'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-red-100 text-red-700'
                }`}
              >
                {selectedDetection.status === 'normal' ? 'Normal' : 'Alerta'}
              </span>
            </div>
          </div>

          {attentionMapUrl && (
            <div className="mb-6">
              <h2 className="text-lg tracking-tight text-gray-900 mb-3 ml-1">Mapa de Atención</h2>
              <div className="relative rounded-[28px] overflow-hidden bg-gray-100 aspect-video shadow-sm border border-gray-200">
                <img 
                  src={attentionMapUrl}
                  alt="Mapa de atención" 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    if (imageUrl) {
                      e.currentTarget.src = imageUrl;
                    }
                  }}
                />
              </div>
            </div>
          )}

          {imageUrl && !attentionMapUrl && (
            <div className="mb-6">
              <h2 className="text-lg tracking-tight text-gray-900 mb-3 ml-1">Imagen Original</h2>
              <div className="relative rounded-[28px] overflow-hidden bg-gray-100 aspect-video shadow-sm border border-gray-200">
                <img 
                  src={imageUrl}
                  alt="Imagen original" 
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          )}

          {selectedDetection.summary && (
            <div className="bg-white rounded-[28px] p-6 mb-6 border border-gray-200 shadow-sm">
              <h2 className="text-lg tracking-tight text-gray-900 mb-3">Resumen del Análisis</h2>
              <p className="text-sm text-gray-600 leading-relaxed">{selectedDetection.summary}</p>
            </div>
          )}

          <button 
            className="w-full bg-[#001F54] hover:bg-[#00152E] active:bg-[#000A1A] text-white rounded-2xl py-5 transition-all shadow-lg mb-4"
            onClick={() => {
              alert('Función de generación de PDF próximamente');
            }}
          >
            <span className="tracking-tight">Generar Reporte PDF</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex justify-between items-center mb-6 lg:mb-8">
        <div>
          <h1 className="text-2xl lg:text-3xl tracking-tight text-gray-900">Historial</h1>
          <p className="text-sm text-gray-500 mt-1">Gestiona y consulta detecciones anteriores</p>
        </div>
      </div>

      <div className="relative mb-4 max-w-xl">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" strokeWidth={2} />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Buscar paciente o expediente..."
          className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border-0 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#001F54] focus:bg-white transition-all"
        />
      </div>

      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setFilter('all')}
          className={`px-5 py-2.5 rounded-full text-sm tracking-tight transition-all ${
            filter === 'all'
              ? 'bg-[#001F54] text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Todos
        </button>
        <button
          onClick={() => setFilter('positive')}
          className={`px-5 py-2.5 rounded-full text-sm tracking-tight transition-all ${
            filter === 'positive'
              ? 'bg-[#001F54] text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Positivos
        </button>
        <button
          onClick={() => setFilter('negative')}
          className={`px-5 py-2.5 rounded-full text-sm tracking-tight transition-all ${
            filter === 'negative'
              ? 'bg-[#001F54] text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Negativos
        </button>
      </div>

      <p className="text-sm text-gray-500 mb-4">{filteredDetections.length} resultados</p>

      {filteredDetections.length === 0 ? (
        <div className="text-center py-12">
          <Activity className="w-12 h-12 text-gray-300 mx-auto mb-3" strokeWidth={1.5} />
          <p className="text-gray-500">
            {searchQuery || filter !== 'all' 
              ? 'No se encontraron resultados' 
              : 'No hay detecciones registradas'}
          </p>
        </div>
      ) : (
        <div className="grid lg:grid-cols-2 xl:grid-cols-3 gap-3 lg:gap-4">
          {filteredDetections.map((detection) => (
            <button
              key={detection.id}
              onClick={() => setSelectedDetection(detection)}
              className="w-full bg-white rounded-[18px] lg:rounded-[20px] p-4 lg:p-5 border border-gray-200 shadow-sm hover:shadow-md transition-all text-left"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex-1">
                  <p className="text-gray-900 tracking-tight mb-1">{detection.patientName}</p>
                  <p className="text-sm text-gray-500">{detection.age} años • {detection.gender}</p>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" strokeWidth={2} />
              </div>

              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-1.5 text-xs text-gray-600">
                  <Calendar className="w-3.5 h-3.5" strokeWidth={2} />
                  <span>{detection.date}</span>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-gray-600">
                  <Activity className="w-3.5 h-3.5" strokeWidth={2} />
                  <span>{detection.confidence}</span>
                </div>

                <div className="ml-auto">
                  <span
                    className={`px-3 py-1.5 rounded-full text-xs tracking-tight ${
                      detection.status === 'normal'
                        ? 'bg-gray-500 text-white'
                        : 'bg-[#001F54] text-white'
                    }`}
                  >
                    {detection.status === 'normal' ? 'Negativo' : 'Positivo'}
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}