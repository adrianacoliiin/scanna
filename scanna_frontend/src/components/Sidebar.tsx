import { Home, FileText, User, LogOut } from 'lucide-react';
import { useState, useEffect } from 'react';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: 'dashboard' | 'history' | 'profile') => void;
  onLogout: () => void;
}

interface UserData {
  name: string;
  specialty: string;
  initials: string;
}

export function Sidebar({ activeTab, onTabChange, onLogout }: SidebarProps) {
  const [userData] = useState<UserData>({
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

  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col h-full">
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#001F54] rounded-2xl flex items-center justify-center shadow-sm">
            <svg width="24" height="24" viewBox="0 0 48 48" fill="none">
              <circle cx="24" cy="24" r="12" stroke="white" strokeWidth="3"/>
              <circle cx="24" cy="24" r="6" fill="white"/>
            </svg>
          </div>
          <span className="text-xl tracking-tight text-gray-900">Scanna</span>
        </div>
      </div>

      <nav className="flex-1 p-4">
        <div className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id as any)}
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
            <div className="flex items-center gap-3 mb-3">
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
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 transition-all"
        >
          <LogOut className="w-5 h-5" strokeWidth={2} />
          <span className="tracking-tight">Cerrar Sesión</span>
        </button>
      </div>
    </div>
  );
}