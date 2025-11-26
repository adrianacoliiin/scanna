import { useState, useEffect } from 'react';
import { Plus, Activity, CheckCircle, Users, TrendingUp, AlertCircle } from 'lucide-react';
import { NewDetection } from './NewDetection';
import { AgeDistributionChart } from './AgeDistributionChart';
import { dashboardAPI, type DashboardStats } from '../services/api';

export function Dashboard() {
  const [showNewDetection, setShowNewDetection] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    todayDetections: 0,
    positiveCases: 0,
    totalPatients: 0,
    weekDetections: 0,
    positivePercentage: 0,
    negativePercentage: 0,
    avgConfidence: 90
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const data: DashboardStats = await dashboardAPI.getEstadisticas();
        
        // Mapear los datos del backend
        const totalCases = data.resumen_detecciones.total_casos;
        const positiveCases = data.resumen_detecciones.positivos;
        const negativeCases = data.resumen_detecciones.negativos;
        
        setStats({
          todayDetections: data.detecciones_hoy,
          positiveCases: data.casos_positivos,
          totalPatients: data.total_pacientes,
          weekDetections: data.esta_semana,
          positivePercentage: totalCases > 0 ? Math.round((positiveCases / totalCases) * 100) : 0,
          negativePercentage: totalCases > 0 ? Math.round((negativeCases / totalCases) * 100) : 0,
          avgConfidence: Math.round(data.confianza_promedio)
        });
      } catch (err) {
        console.error('Error fetching stats:', err);
        setError(err instanceof Error ? err.message : 'Error al cargar estadísticas');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  // Función para recargar las estadísticas después de crear una nueva detección
  const handleDetectionCreated = () => {
    setShowNewDetection(false);
    // Recargar las estadísticas
    window.location.reload();
  };

  if (showNewDetection) {
    return <NewDetection onClose={handleDetectionCreated} />;
  }

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="mb-8 lg:mb-10">
          <p className="text-gray-500 text-sm mb-1">Bienvenido de nuevo</p>
          <h1 className="text-3xl lg:text-4xl tracking-tight text-gray-900">Dashboard</h1>
        </div>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-[#001F54] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600 tracking-tight">Cargando estadísticas...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="mb-8 lg:mb-10">
          <p className="text-gray-500 text-sm mb-1">Bienvenido de nuevo</p>
          <h1 className="text-3xl lg:text-4xl tracking-tight text-gray-900">Dashboard</h1>
        </div>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="bg-white rounded-[24px] lg:rounded-[28px] p-6 lg:p-8 border border-red-200 shadow-sm max-w-md">
            <div className="flex flex-col items-center text-center">
              <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mb-4">
                <AlertCircle className="w-7 h-7 text-red-600" strokeWidth={2} />
              </div>
              <h3 className="text-lg tracking-tight text-gray-900 mb-2">Error al cargar estadísticas</h3>
              <p className="text-gray-600 mb-6">{error}</p>
              <button
                onClick={() => window.location.reload()}
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

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-8 lg:mb-10">
        <p className="text-gray-500 text-sm mb-1">Bienvenido de nuevo</p>
        <h1 className="text-3xl lg:text-4xl tracking-tight text-gray-900">Dashboard</h1>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-6 lg:mb-8">
        <div className="bg-[#001F54] rounded-[24px] lg:rounded-[28px] p-5 lg:p-6 shadow-lg">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="w-4 h-4 text-blue-200" strokeWidth={2} />
            <p className="text-blue-200 text-xs lg:text-sm">Detecciones Hoy</p>
          </div>
          <p className="text-3xl lg:text-4xl text-white tracking-tight">{stats.todayDetections}</p>
        </div>
        <div className="bg-white rounded-[24px] lg:rounded-[28px] p-5 lg:p-6 shadow-sm border border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-4 h-4 text-gray-500" strokeWidth={2} />
            <p className="text-gray-500 text-xs lg:text-sm">Casos Positivos</p>
          </div>
          <p className="text-3xl lg:text-4xl text-gray-900 tracking-tight">{stats.positiveCases}</p>
        </div>
        <div className="bg-white rounded-[24px] lg:rounded-[28px] p-5 lg:p-6 shadow-sm border border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-4 h-4 text-gray-500" strokeWidth={2} />
            <p className="text-gray-500 text-xs lg:text-sm">Total Pacientes</p>
          </div>
          <p className="text-3xl lg:text-4xl text-gray-900 tracking-tight">{stats.totalPatients}</p>
        </div>
        <div className="bg-white rounded-[24px] lg:rounded-[28px] p-5 lg:p-6 shadow-sm border border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-gray-500" strokeWidth={2} />
            <p className="text-gray-500 text-xs lg:text-sm">Esta Semana</p>
          </div>
          <p className="text-3xl lg:text-4xl text-gray-900 tracking-tight">{stats.weekDetections}</p>
        </div>
      </div>

      <button
        onClick={() => setShowNewDetection(true)}
        className="w-full lg:max-w-md bg-[#001F54] hover:bg-[#00152E] active:bg-[#000A1A] text-white rounded-[20px] py-4 lg:py-5 px-6 flex items-center justify-center gap-3 transition-all mb-6 shadow-lg"
      >
        <Plus className="w-5 h-5 lg:w-6 lg:h-6" strokeWidth={2.5} />
        <span className="tracking-tight">Nueva Detección</span>
      </button>

      {/* Age Distribution Chart */}
      <div className="mb-8 lg:mb-10">
        <AgeDistributionChart />
      </div>

      <div>
        <h2 className="text-xl lg:text-2xl tracking-tight text-gray-900 mb-5 ml-1">Resumen de Detecciones</h2>
        
        <div className="grid lg:grid-cols-2 gap-4">
          <div className="bg-white rounded-[20px] lg:rounded-[24px] p-5 lg:p-6 border border-gray-200 shadow-sm">
            <h3 className="text-sm text-gray-500 mb-5">Visión General</h3>
            
            <div className="flex items-center justify-between mb-5 pb-5 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <div>
                  <p className="text-gray-900 tracking-tight">Casos Positivos</p>
                  <p className="text-xs text-gray-500">
                    {stats.positiveCases} paciente{stats.positiveCases !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
              <p className="text-2xl text-gray-900 tracking-tight">{stats.positivePercentage}%</p>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
                <div>
                  <p className="text-gray-900 tracking-tight">Casos Negativos</p>
                  <p className="text-xs text-gray-500">
                    {stats.totalPatients - stats.positiveCases} paciente{(stats.totalPatients - stats.positiveCases) !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
              <p className="text-2xl text-gray-900 tracking-tight">{stats.negativePercentage}%</p>
            </div>
          </div>

          <div className="bg-white rounded-[20px] lg:rounded-[24px] p-5 lg:p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm text-gray-500">Confianza Promedio</h3>
              <p className="text-2xl text-gray-900 tracking-tight">{stats.avgConfidence}%</p>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2 mb-4">
              <div className="bg-[#001F54] h-2 rounded-full" style={{ width: `${stats.avgConfidence}%` }}></div>
            </div>
            <p className="text-xs text-gray-500">Basado en las últimas 100 detecciones</p>
          </div>
        </div>
      </div>
    </div>
  );
}