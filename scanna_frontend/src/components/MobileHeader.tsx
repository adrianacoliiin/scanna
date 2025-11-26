import { Menu, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Home, FileText, User, LogOut } from 'lucide-react';

interface MobileHeaderProps {
  activeTab: string;
  onTabChange: (tab: 'dashboard' | 'history' | 'profile') => void;
  onLogout: () => void;
}

interface UserData {
  name: string;
  specialty: string;
  initials: string;
}

export function MobileHeader({ activeTab, onTabChange, onLogout }: MobileHeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [userData, setUserData] = useState<UserData>({
    name: '',
    specialty: '',
    initials: ''
  });

  useEffect(() => {
    // TODO: Cargar datos del usuario desde API
    // fetch('/api/user/profile')
    //   .then(res => res.json())
    //   .then(data => setUserData({
    //     name: data.name,
    //     specialty: data.specialty,
    //     initials: data.initials
    //   }));
  }, []);

  const menuItems = [
    { id: 'dashboard', icon: Home, label: 'Inicio' },
    { id: 'history', icon: FileText, label: 'Historial' },
    { id: 'profile', icon: User, label: 'Perfil' },
  ];

  const handleTabChange = (tab: 'dashboard' | 'history' | 'profile') => {
    onTabChange(tab);
    setIsMenuOpen(false);
  };

  return (
    <>
      <div className="bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-[#001F54] rounded-xl flex items-center justify-center shadow-sm">
            <svg width="20" height="20" viewBox="0 0 48 48" fill="none">
              <circle cx="24" cy="24" r="12" stroke="white" strokeWidth="3"/>
              <circle cx="24" cy="24" r="6" fill="white"/>
            </svg>
          </div>
          <span className="text-lg tracking-tight text-gray-900">Scanna</span>
        </div>

        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
        >
          {isMenuOpen ? (
            <X className="w-6 h-6 text-gray-900" strokeWidth={2} />
          ) : (
            <Menu className="w-6 h-6 text-gray-900" strokeWidth={2} />
          )}
        </button>
      </div>

      <AnimatePresence>
        {isMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMenuOpen(false)}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
            />

            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed top-0 right-0 h-full w-64 bg-white shadow-2xl z-50 flex flex-col"
            >
              <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                <span className="text-lg tracking-tight text-gray-900">Menú</span>
                <button
                  onClick={() => setIsMenuOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  <X className="w-5 h-5 text-gray-900" strokeWidth={2} />
                </button>
              </div>

              <nav className="flex-1 p-4">
                <div className="space-y-1">
                  {menuItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleTabChange(item.id as any)}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                          isActive
                            ? 'bg-[#001F54] text-white shadow-md'
                            : 'text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        <Icon className="w-5 h-5" strokeWidth={2} />
                        <span className="tracking-tight">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </nav>

              <div className="p-4 border-t border-gray-100">
                {userData.name && (
                  <div className="bg-gray-50 rounded-2xl p-4 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-[#001F54] rounded-full flex items-center justify-center">
                        <span className="text-white text-sm tracking-tight">{userData.initials}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900 tracking-tight truncate">{userData.name}</p>
                        <p className="text-xs text-gray-500">{userData.specialty}</p>
                      </div>
                    </div>
                  </div>
                )}
                
                <button
                  onClick={() => {
                    onLogout();
                    setIsMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 transition-all"
                >
                  <LogOut className="w-5 h-5" strokeWidth={2} />
                  <span className="tracking-tight">Cerrar Sesión</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}