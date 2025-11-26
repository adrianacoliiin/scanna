import { useState, useEffect } from 'react';
import { Mail, Phone, MapPin, Building, Calendar, LogOut, Shield, AlertCircle } from 'lucide-react';
import { perfilAPI, type Especialista } from '../services/api';

interface ProfileProps {
  onLogout: () => void;
}

interface DoctorInfo {
  name: string;
  specialty: string;
  email: string;
  phone: string;
  license: string;
  hospital: string;
  location: string;
  joinDate: string;
  initials: string;
}

export function Profile({ onLogout }: ProfileProps) {
  const [doctorInfo, setDoctorInfo] = useState<DoctorInfo>({
    name: '',
    specialty: '',
    email: '',
    phone: '',
    license: '',
    hospital: '',
    location: '',
    joinDate: '',
    initials: ''
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const data: Especialista = await perfilAPI.obtenerPerfil();
        
        // Mapear los datos del backend a la estructura del componente
        const mappedData: DoctorInfo = {
          name: `${data.nombre} ${data.apellido}`.trim(),
          specialty: data.area || 'No especificada',
          email: data.email || '',
          phone: data.telefono || 'No especificado',
          license: data.cedula_profesional || 'No especificada',
          hospital: data.hospital || 'No especificado',
          location: data.hospital || 'No especificada', // Puedes ajustar esto si tienes un campo de ubicación separado
          joinDate: data.fechaRegistro 
            ? new Date(data.fechaRegistro).toLocaleDateString('es-MX', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })
            : 'No disponible',
          initials: getInitials(`${data.nombre} ${data.apellido}`)
        };

        setDoctorInfo(mappedData);
      } catch (err) {
        console.error('Error fetching profile:', err);
        const errorMessage = err instanceof Error ? err.message : 'Error al cargar el perfil';
        
        // Si el error es de sesión expirada, redirigir al login
        if (errorMessage.includes('Sesión expirada') || errorMessage.includes('Token')) {
          setError('Tu sesión ha expirado. Serás redirigido al login...');
          setTimeout(() => {
            onLogout();
          }, 2000);
        } else {
          setError(errorMessage);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [onLogout]);

  const getInitials = (name: string): string => {
    if (!name) return '';
    const parts = name.trim().split(' ').filter(p => p.length > 0);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return parts[0]?.substring(0, 2).toUpperCase() || '';
  };

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="mb-8 lg:mb-10">
          <h1 className="text-2xl lg:text-3xl tracking-tight text-gray-900 mb-1">Perfil</h1>
          <p className="text-sm text-gray-500">Información personal y configuración</p>
        </div>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-[#001F54] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600 tracking-tight">Cargando perfil...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="mb-8 lg:mb-10">
          <h1 className="text-2xl lg:text-3xl tracking-tight text-gray-900 mb-1">Perfil</h1>
          <p className="text-sm text-gray-500">Información personal y configuración</p>
        </div>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="bg-white rounded-[24px] lg:rounded-[28px] p-6 lg:p-8 border border-red-200 shadow-sm max-w-md">
            <div className="flex flex-col items-center text-center">
              <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mb-4">
                <AlertCircle className="w-7 h-7 text-red-600" strokeWidth={2} />
              </div>
              <h3 className="text-lg tracking-tight text-gray-900 mb-2">Error al cargar perfil</h3>
              <p className="text-gray-600 mb-6">{error}</p>
              {!error.includes('expirado') && (
                <button
                  onClick={() => window.location.reload()}
                  className="px-6 py-3 bg-[#001F54] hover:bg-[#003580] text-white rounded-2xl transition-all tracking-tight"
                >
                  Reintentar
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-8 lg:mb-10">
        <h1 className="text-2xl lg:text-3xl tracking-tight text-gray-900 mb-1">Perfil</h1>
        <p className="text-sm text-gray-500">Información personal y configuración</p>
      </div>

      <div className="bg-white rounded-[24px] lg:rounded-[28px] p-6 lg:p-8 mb-6 border border-gray-200 shadow-sm max-w-2xl">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 mb-6">
          <div className="w-20 h-20 bg-[#001F54] rounded-full flex items-center justify-center shadow-md">
            <span className="text-2xl text-white tracking-tight">{doctorInfo.initials}</span>
          </div>
          <div className="flex-1 text-center sm:text-left">
            <h2 className="text-xl lg:text-2xl text-gray-900 tracking-tight mb-1">{doctorInfo.name}</h2>
            <p className="text-gray-600 mb-2">{doctorInfo.specialty}</p>
            <p className="text-sm text-gray-500">Cédula Profesional: {doctorInfo.license}</p>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 max-w-4xl">
        <div>
          <h2 className="text-lg tracking-tight text-gray-900 mb-3 ml-1">Información de Contacto</h2>
          <div className="space-y-2">
            <div className="bg-white rounded-[18px] lg:rounded-[20px] p-4 lg:p-5 flex items-center gap-4 border border-gray-200 shadow-sm">
              <div className="w-11 h-11 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Mail className="w-5 h-5 text-gray-600" strokeWidth={2} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-500 mb-0.5">Email</p>
                <p className="text-gray-900 tracking-tight truncate">{doctorInfo.email}</p>
              </div>
            </div>

            <div className="bg-white rounded-[18px] lg:rounded-[20px] p-4 lg:p-5 flex items-center gap-4 border border-gray-200 shadow-sm">
              <div className="w-11 h-11 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Phone className="w-5 h-5 text-gray-600" strokeWidth={2} />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-500 mb-0.5">Teléfono</p>
                <p className="text-gray-900 tracking-tight">{doctorInfo.phone}</p>
              </div>
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-lg tracking-tight text-gray-900 mb-3 ml-1">Información Laboral</h2>
          <div className="space-y-2">
            <div className="bg-white rounded-[18px] lg:rounded-[20px] p-4 lg:p-5 flex items-center gap-4 border border-gray-200 shadow-sm">
              <div className="w-11 h-11 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Building className="w-5 h-5 text-gray-600" strokeWidth={2} />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-500 mb-0.5">Hospital</p>
                <p className="text-gray-900 tracking-tight">{doctorInfo.hospital}</p>
              </div>
            </div>

            <div className="bg-white rounded-[18px] lg:rounded-[20px] p-4 lg:p-5 flex items-center gap-4 border border-gray-200 shadow-sm">
              <div className="w-11 h-11 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                <MapPin className="w-5 h-5 text-gray-600" strokeWidth={2} />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-500 mb-0.5">Ubicación</p>
                <p className="text-gray-900 tracking-tight">{doctorInfo.location}</p>
              </div>
            </div>

            <div className="bg-white rounded-[18px] lg:rounded-[20px] p-4 lg:p-5 flex items-center gap-4 border border-gray-200 shadow-sm">
              <div className="w-11 h-11 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Calendar className="w-5 h-5 text-gray-600" strokeWidth={2} />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-500 mb-0.5">Fecha de Registro</p>
                <p className="text-gray-900 tracking-tight">{doctorInfo.joinDate}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 max-w-4xl">
        <h2 className="text-lg tracking-tight text-gray-900 mb-3 ml-1">Configuración</h2>
        <div className="space-y-2">
          <button className="w-full bg-white rounded-[18px] lg:rounded-[20px] p-4 lg:p-5 flex items-center gap-4 hover:bg-gray-50 transition-colors text-left border border-gray-200 shadow-sm">
            <div className="w-11 h-11 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
              <Shield className="w-5 h-5 text-gray-600" strokeWidth={2} />
            </div>
            <div className="flex-1">
              <p className="text-gray-900 tracking-tight">Privacidad y Seguridad</p>
            </div>
          </button>
        </div>
      </div>

      <div className="mt-8 max-w-4xl hidden lg:block">
        <button
          onClick={onLogout}
          className="w-full lg:w-auto px-8 py-4 bg-red-50 hover:bg-red-100 text-red-600 rounded-2xl transition-all flex items-center justify-center gap-2"
        >
          <LogOut className="w-5 h-5" strokeWidth={2} />
          <span className="tracking-tight">Cerrar Sesión</span>
        </button>
      </div>
    </div>
  );
}