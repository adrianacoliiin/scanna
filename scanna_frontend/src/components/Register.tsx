import { useState } from 'react';
import { Eye, EyeOff, ArrowLeft, Loader } from 'lucide-react';
import { authAPI } from '../services/api';

interface RegisterProps {
  onRegister: () => void;
  onBackToLogin: () => void;
}

export function Register({ onRegister, onBackToLogin }: RegisterProps) {
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    email: '',
    password: '',
    confirmPassword: '',
    area: 'Medicina General',
    cedula_profesional: '',
    hospital: '',
    telefono: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const areaOptions = [
    "Medicina General",
    "Hematología",
    "Medicina Interna",
    "Pediatría",
    "Ginecología",
    "Otro"
  ];

  const validateForm = (): string | null => {
    if (!formData.nombre || !formData.apellido || !formData.email || !formData.password) {
      return 'Por favor completa todos los campos obligatorios';
    }

    if (!formData.email.includes('@')) {
      return 'Por favor ingresa un email válido';
    }

    if (formData.password.length < 8) {
      return 'La contraseña debe tener al menos 8 caracteres';
    }

    if (formData.password !== formData.confirmPassword) {
      return 'Las contraseñas no coinciden';
    }

    return null;
  };

  const handleRegister = async () => {
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // IMPORTANTE: Enviar strings vacíos en lugar de omitir campos
      // El backend inserta None si no recibe el campo, y MongoDB lo rechaza
      const registerData: any = {
        nombre: formData.nombre.trim(),
        apellido: formData.apellido.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        area: formData.area,
        cedula_profesional: formData.cedula_profesional.trim() || '',
        hospital: formData.hospital.trim() || '',
        telefono: formData.telefono.trim() || '',
      };

      console.log('Datos a enviar:', registerData);
      await authAPI.register(registerData);
      
      setSuccess(true);
      
      setTimeout(async () => {
        try {
          await authAPI.login({
            email: registerData.email,
            password: registerData.password,
          });
          onRegister();
        } catch (err) {
          onBackToLogin();
        }
      }, 2000);
    } catch (err: any) {
      console.error('Error en registro:', err);
      setError(err.message || 'Error al registrarse. Intenta nuevamente.');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-[32px] shadow-2xl overflow-hidden border border-gray-100 p-10 text-center">
          <div className="w-20 h-20 bg-green-500 rounded-full mx-auto mb-5 flex items-center justify-center shadow-lg">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl tracking-tight text-gray-900 mb-3">¡Registro Exitoso!</h2>
          <p className="text-gray-600 mb-4">Tu cuenta ha sido creada correctamente.</p>
          <div className="flex items-center justify-center gap-2 text-gray-500">
            <Loader className="w-4 h-4 animate-spin" />
            <span className="text-sm">Iniciando sesión...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white rounded-[32px] shadow-2xl overflow-hidden border border-gray-100 p-10">
        <button
          onClick={onBackToLogin}
          disabled={isLoading}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors disabled:opacity-50"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Volver</span>
        </button>

        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-[#001F54] rounded-[24px] mx-auto mb-5 flex items-center justify-center shadow-lg">
            <svg width="40" height="40" viewBox="0 0 48 48" fill="none">
              <circle cx="24" cy="24" r="12" stroke="white" strokeWidth="3"/>
              <circle cx="24" cy="24" r="6" fill="white"/>
            </svg>
          </div>
          <h1 className="text-3xl tracking-tight text-gray-900 mb-2">Crear Cuenta</h1>
          <p className="text-gray-500">Únete a Scanna</p>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-2xl">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-2 ml-1">
                Nombre <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.nombre}
                onChange={(e) => {
                  setFormData({...formData, nombre: e.target.value});
                  setError(null);
                }}
                disabled={isLoading}
                className="w-full px-4 py-4 bg-gray-50 border-0 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#001F54] focus:bg-white transition-all disabled:opacity-50"
                placeholder="Juan"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-2 ml-1">
                Apellido <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.apellido}
                onChange={(e) => {
                  setFormData({...formData, apellido: e.target.value});
                  setError(null);
                }}
                disabled={isLoading}
                className="w-full px-4 py-4 bg-gray-50 border-0 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#001F54] focus:bg-white transition-all disabled:opacity-50"
                placeholder="Pérez"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-2 ml-1">
              Correo Electrónico <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => {
                setFormData({...formData, email: e.target.value});
                setError(null);
              }}
              disabled={isLoading}
              className="w-full px-5 py-4 bg-gray-50 border-0 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#001F54] focus:bg-white transition-all disabled:opacity-50"
              placeholder="tu@email.com"
              autoComplete="email"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-2 ml-1">
              Área de Especialidad <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.area}
              onChange={(e) => {
                setFormData({...formData, area: e.target.value});
                setError(null);
              }}
              disabled={isLoading}
              className="w-full px-4 py-4 bg-gray-50 border-0 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#001F54] focus:bg-white transition-all disabled:opacity-50"
            >
              {areaOptions.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-2 ml-1">
                Cédula Profesional
              </label>
              <input
                type="text"
                value={formData.cedula_profesional}
                onChange={(e) => {
                  setFormData({...formData, cedula_profesional: e.target.value});
                  setError(null);
                }}
                disabled={isLoading}
                className="w-full px-4 py-4 bg-gray-50 border-0 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#001F54] focus:bg-white transition-all disabled:opacity-50"
                placeholder="7654321"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-2 ml-1">
                Hospital
              </label>
              <input
                type="text"
                value={formData.hospital}
                onChange={(e) => {
                  setFormData({...formData, hospital: e.target.value});
                  setError(null);
                }}
                disabled={isLoading}
                className="w-full px-4 py-4 bg-gray-50 border-0 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#001F54] focus:bg-white transition-all disabled:opacity-50"
                placeholder="Hospital General"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-2 ml-1">
              Teléfono
            </label>
            <input
              type="tel"
              value={formData.telefono}
              onChange={(e) => {
                setFormData({...formData, telefono: e.target.value});
                setError(null);
              }}
              disabled={isLoading}
              className="w-full px-4 py-4 bg-gray-50 border-0 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#001F54] focus:bg-white transition-all disabled:opacity-50"
              placeholder="1234567890"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-2 ml-1">
                Contraseña <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => {
                    setFormData({...formData, password: e.target.value});
                    setError(null);
                  }}
                  disabled={isLoading}
                  className="w-full px-5 py-4 bg-gray-50 border-0 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#001F54] focus:bg-white transition-all pr-12 disabled:opacity-50"
                  placeholder="••••••••"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1 ml-1">Mínimo 8 caracteres</p>
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-2 ml-1">
                Confirmar Contraseña <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={(e) => {
                    setFormData({...formData, confirmPassword: e.target.value});
                    setError(null);
                  }}
                  disabled={isLoading}
                  className="w-full px-5 py-4 bg-gray-50 border-0 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#001F54] focus:bg-white transition-all pr-12 disabled:opacity-50"
                  placeholder="••••••••"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  disabled={isLoading}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
          </div>

          <button
            onClick={handleRegister}
            disabled={isLoading}
            className="w-full bg-[#001F54] hover:bg-[#00152E] active:bg-[#000A1A] disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-2xl py-4 transition-all shadow-lg mt-6 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                <span>Registrando...</span>
              </>
            ) : (
              <span>Registrarse</span>
            )}
          </button>
        </div>

        <div className="mt-8 text-center">
          <p className="text-gray-600">
            ¿Ya tienes cuenta?{' '}
            <button 
              onClick={onBackToLogin}
              disabled={isLoading}
              className="text-[#001F54] hover:text-[#00152E] disabled:opacity-50"
            >
              Inicia Sesión
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}