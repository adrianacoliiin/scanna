import { useState } from 'react';
import { Eye, EyeOff, Loader } from 'lucide-react';
import { authAPI } from '../services/api';

interface LoginProps {
  onLogin: () => void;
  onGoToRegister: () => void;
}

export function Login({ onLogin, onGoToRegister }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    // Validaciones básicas
    if (!email || !password) {
      setError('Por favor completa todos los campos');
      return;
    }

    if (!email.includes('@')) {
      setError('Por favor ingresa un email válido');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await authAPI.login({ email, password });
      console.log('Login exitoso:', response);
      
      // Llamar a onLogin para cambiar el estado de la app
      onLogin();
    } catch (err: any) {
      console.error('Error en login:', err);
      setError(err.message || 'Error al iniciar sesión. Verifica tus credenciales.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleLogin();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-[32px] shadow-2xl overflow-hidden border border-gray-100 p-10">
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-[#001F54] rounded-[24px] mx-auto mb-5 flex items-center justify-center shadow-lg">
            <svg width="40" height="40" viewBox="0 0 48 48" fill="none">
              <circle cx="24" cy="24" r="12" stroke="white" strokeWidth="3"/>
              <circle cx="24" cy="24" r="6" fill="white"/>
            </svg>
          </div>
          <h1 className="text-3xl tracking-tight text-gray-900 mb-2">Scanna</h1>
          <p className="text-gray-500">Detección de Anemia</p>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-2xl">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-600 mb-2 ml-1">
              Correo Electrónico
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError(null);
              }}
              onKeyPress={handleKeyPress}
              disabled={isLoading}
              className="w-full px-5 py-4 bg-gray-50 border-0 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#001F54] focus:bg-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              placeholder="tu@email.com"
              autoComplete="email"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-2 ml-1">
              Contraseña
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError(null);
                }}
                onKeyPress={handleKeyPress}
                disabled={isLoading}
                className="w-full px-5 py-4 bg-gray-50 border-0 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#001F54] focus:bg-white transition-all pr-12 disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="••••••••"
                autoComplete="current-password"
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
          </div>

          <button
            type="button"
            className="text-sm text-[#001F54] hover:text-[#00152E] ml-1"
            disabled={isLoading}
          >
            ¿Olvidaste tu contraseña?
          </button>

          <button
            onClick={handleLogin}
            disabled={isLoading}
            className="w-full bg-[#001F54] hover:bg-[#00152E] active:bg-[#000A1A] disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-2xl py-4 transition-all shadow-lg mt-6 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                <span>Iniciando sesión...</span>
              </>
            ) : (
              <span>Iniciar Sesión</span>
            )}
          </button>
        </div>

        <div className="mt-8 text-center">
          <p className="text-gray-600">
            ¿No tienes cuenta?{' '}
            <button 
              onClick={onGoToRegister}
              disabled={isLoading}
              className="text-[#001F54] hover:text-[#00152E] disabled:opacity-50"
            >
              Regístrate
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}