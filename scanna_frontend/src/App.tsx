import { useState, useEffect } from 'react';
import { Login } from './components/Login';
import { Register } from './components/Register';
import { Dashboard } from './components/Dashboard';
import { History } from './components/History';
import { Profile } from './components/Profile';
import { Sidebar } from './components/Sidebar';
import { MobileHeader } from './components/MobileHeader';
import { authAPI } from './services/api';

type TabType = 'dashboard' | 'history' | 'profile';
type AuthView = 'login' | 'register';

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [authView, setAuthView] = useState<AuthView>('login');
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');

  // Verificar si hay una sesión activa al cargar la app
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('access_token');
      
      if (!token) {
        setIsCheckingAuth(false);
        return;
      }

      try {
        // Verificar si el token es válido
        await authAPI.verifyToken();
        setIsLoggedIn(true);
      } catch (error) {
        console.error('Token inválido:', error);
        // Limpiar sesión si el token no es válido
        authAPI.logout();
        setIsLoggedIn(false);
      } finally {
        setIsCheckingAuth(false);
      }
    };

    checkAuth();
  }, []);

  const handleLogin = () => {
    setIsLoggedIn(true);
    setActiveTab('dashboard');
  };

  const handleLogout = () => {
    authAPI.logout();
    setIsLoggedIn(false);
    setAuthView('login');
    setActiveTab('dashboard');
  };

  // Mostrar loading mientras se verifica la autenticación
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-[#001F54] rounded-[20px] mx-auto mb-4 flex items-center justify-center shadow-lg animate-pulse">
            <svg width="32" height="32" viewBox="0 0 48 48" fill="none">
              <circle cx="24" cy="24" r="12" stroke="white" strokeWidth="3"/>
              <circle cx="24" cy="24" r="6" fill="white"/>
            </svg>
          </div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  // Mostrar pantallas de autenticación si no está logueado
  if (!isLoggedIn) {
    if (authView === 'register') {
      return (
        <Register 
          onRegister={handleLogin} 
          onBackToLogin={() => setAuthView('login')}
        />
      );
    }
    
    return (
      <Login 
        onLogin={handleLogin} 
        onGoToRegister={() => setAuthView('register')}
      />
    );
  }

  // Mostrar la aplicación principal si está logueado
  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block fixed left-0 top-0 h-full z-30">
        <Sidebar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onLogout={handleLogout}
        />
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        {/* Mobile Header */}
        <div className="lg:hidden sticky top-0 z-20">
          <MobileHeader
            activeTab={activeTab}
            onTabChange={setActiveTab}
            onLogout={handleLogout}
          />
        </div>

        {/* Content */}
        <main className="flex-1 overflow-auto">
          <div className="max-w-7xl mx-auto">
            {activeTab === 'dashboard' && <Dashboard />}
            {activeTab === 'history' && <History />}
            {activeTab === 'profile' && <Profile onLogout={handleLogout} />}
          </div>
        </main>
      </div>
    </div>
  );
}