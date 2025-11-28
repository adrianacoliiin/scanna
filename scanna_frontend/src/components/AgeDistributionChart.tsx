import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Users, AlertCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { dashboardAPI, type DashboardStats } from '../services/api';

interface AgeDataPoint {
  ageRange: string;
  total: number;
  positive: number;
  negative: number;
}

export function AgeDistributionChart() {
  const [chartData, setChartData] = useState<AgeDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCases, setTotalCases] = useState(0);
  const [totalPositive, setTotalPositive] = useState(0);
  const [highestAgeGroup, setHighestAgeGroup] = useState('');

  useEffect(() => {
    const fetchAgeDistribution = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const data: DashboardStats = await dashboardAPI.getEstadisticas();
        
        // Procesar datos de distribución de edad que vienen del backend
        if (data.distribucion_edad && data.distribucion_edad.datos_grafico) {
          const processedData: AgeDataPoint[] = data.distribucion_edad.datos_grafico.map(item => ({
            ageRange: item.rango,
            total: item.total,
            positive: item.positivos,
            negative: item.negativos
          }));

          setChartData(processedData);
          setTotalCases(data.distribucion_edad.total_casos);
          setTotalPositive(data.distribucion_edad.positivos);
          setHighestAgeGroup(data.distribucion_edad.mayor_grupo);
        }
      } catch (err) {
        console.error('Error fetching age distribution:', err);
        setError(err instanceof Error ? err.message : 'Error al cargar distribución');
      } finally {
        setLoading(false);
      }
    };

    fetchAgeDistribution();
  }, []);

  const getBarColor = (index: number) => {
    const colors = [
      '#001F54',
      '#002868',
      '#003380',
      '#003D99',
      '#0047B3',
      '#0052CC',
      '#005CE6',
    ];
    return colors[index % colors.length];
  };

  const getBarRadius = (): [number, number, number, number] => {
    if (typeof window !== 'undefined') {
      const width = window.innerWidth;
      if (width < 640) return [12, 12, 0, 0];
      if (width < 1024) return [16, 16, 0, 0];
      return [20, 20, 0, 0];
    }
    return [12, 12, 0, 0];
  };

  const [barRadius, setBarRadius] = useState<[number, number, number, number]>(getBarRadius());

  useEffect(() => {
    const handleResize = () => {
      setBarRadius(getBarRadius());
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white rounded-2xl p-4 shadow-xl border border-gray-200">
          <p className="text-sm text-gray-900 tracking-tight mb-3">{data.ageRange} años</p>
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-6">
              <span className="text-xs text-gray-600">Total:</span>
              <span className="text-sm text-gray-900 font-medium">{data.total}</span>
            </div>
            <div className="flex items-center justify-between gap-6">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <span className="text-xs text-gray-600">Positivos:</span>
              </div>
              <span className="text-sm text-gray-900 font-medium">{data.positive}</span>
            </div>
            <div className="flex items-center justify-between gap-6">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-xs text-gray-600">Negativos:</span>
              </div>
              <span className="text-sm text-gray-900 font-medium">{data.negative}</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-[24px] lg:rounded-[28px] p-5 lg:p-6 border border-gray-200 shadow-sm">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-[#001F54] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-sm text-gray-600">Cargando distribución...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-[24px] lg:rounded-[28px] p-5 lg:p-6 border border-red-200 shadow-sm">
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mb-3">
            <AlertCircle className="w-6 h-6 text-red-600" strokeWidth={2} />
          </div>
          <h3 className="text-sm tracking-tight text-gray-900 mb-2">Error al cargar datos</h3>
          <p className="text-xs text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-[#001F54] hover:bg-[#003580] text-white rounded-xl text-sm transition-all"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-[24px] lg:rounded-[28px] p-5 lg:p-6 border border-gray-200 shadow-sm">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-5 h-5 text-[#001F54]" strokeWidth={2} />
            <h3 className="text-lg tracking-tight text-gray-900">Distribución por Edad</h3>
          </div>
          <p className="text-sm text-gray-500">Casos detectados por rango de edad</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-gray-50 rounded-2xl p-4">
          <p className="text-xs text-gray-500 mb-1">Total Casos</p>
          <p className="text-2xl text-gray-900 tracking-tight">{totalCases}</p>
        </div>
        <div className="bg-gray-50 rounded-2xl p-4">
          <p className="text-xs text-gray-500 mb-1">Positivos</p>
          <p className="text-2xl text-gray-900 tracking-tight">{totalPositive}</p>
        </div>
        <div className="bg-gray-50 rounded-2xl p-4">
          <p className="text-xs text-gray-500 mb-1">Mayor Grupo</p>
          <p className="text-lg text-gray-900 tracking-tight">{highestAgeGroup || '-'}</p>
        </div>
      </div>

      {/* Chart */}
      {totalCases > 0 && chartData.length > 0 ? (
        <>
          <div className="w-full h-48 sm:h-56 lg:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={chartData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <defs>
                  {chartData.map((_, index) => (
                    <linearGradient key={index} id={`colorBar${index}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={getBarColor(index)} stopOpacity={1}/>
                      <stop offset="95%" stopColor={getBarColor(index)} stopOpacity={0.6}/>
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid 
                  strokeDasharray="3 3" 
                  stroke="#f3f4f6" 
                  vertical={false}
                />
                <XAxis 
                  dataKey="ageRange" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#9ca3af', fontSize: 12 }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#9ca3af', fontSize: 12 }}
                  dx={-10}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0, 31, 84, 0.05)' }} />
                <Bar 
                  dataKey="total" 
                  radius={barRadius}
                  maxBarSize={60}
                >
                  {chartData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={`url(#colorBar${index})`} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Bottom Info */}
          <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-[#001F54] rounded"></div>
                <span className="text-xs text-gray-600">Total casos</span>
              </div>
            </div>
            <p className="text-xs text-gray-500">
              Tasa de detección: {totalCases > 0 ? ((totalPositive / totalCases) * 100).toFixed(1) : 0}%
            </p>
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <Users className="w-12 h-12 text-gray-300 mb-3" strokeWidth={1.5} />
          <p className="text-gray-500">No hay datos disponibles para este período</p>
        </div>
      )}
    </div>
  );
}