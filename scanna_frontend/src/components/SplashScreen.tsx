import { useState, useEffect } from 'react';

interface SplashScreenProps {
  onComplete?: () => void;
  duration?: number;
}

export function SplashScreen({ onComplete, duration = 2500 }: SplashScreenProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      if (onComplete) {
        onComplete();
      }
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onComplete]);

  if (!isVisible) {
    return null;
  }

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center z-50 overflow-hidden bg-[#0A4A8F]">
      {/* Background con gradiente radial sutil */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0A4A8F] via-[#0D3B6F] to-[#0A4A8F]">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-white rounded-full blur-3xl opacity-10" />
        </div>
      </div>

      {/* Logo Container */}
      <div className="relative z-10 flex flex-col items-center animate-fade-in">
        {/* Ícono del ojo */}
        <div className="w-24 h-24 bg-white rounded-3xl flex items-center justify-center shadow-2xl mb-6">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" className="text-[#0A4A8F]">
            <path 
              d="M12 5C7 5 2.73 8.11 1 12.5C2.73 16.89 7 20 12 20C17 20 21.27 16.89 23 12.5C21.27 8.11 17 5 12 5Z" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            />
            <circle 
              cx="12" 
              cy="12.5" 
              r="3.5" 
              stroke="currentColor" 
              strokeWidth="2"
            />
            <circle 
              cx="12" 
              cy="12.5" 
              r="1.5" 
              fill="currentColor"
            />
          </svg>
        </div>

        {/* Texto Scanna */}
        <h1 className="text-5xl font-bold text-white tracking-tight mb-3">
          Scanna
        </h1>

        {/* Subtítulo */}
        <p className="text-white/80 text-lg font-light tracking-wide">
          Detección Inteligente de Anemia
        </p>
      </div>

      {/* Loading Dots */}
      <div className="relative z-10 flex gap-2 mt-16">
        <div className="w-2.5 h-2.5 bg-white/90 rounded-full animate-bounce [animation-delay:-0.3s]" />
        <div className="w-2.5 h-2.5 bg-white/90 rounded-full animate-bounce [animation-delay:-0.15s]" />
        <div className="w-2.5 h-2.5 bg-white/90 rounded-full animate-bounce" />
      </div>

      <style>{`
        @keyframes fadeIn {
          0% {
            opacity: 0;
            transform: translateY(-20px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fadeIn 0.8s ease-out;
        }

        @keyframes bounce {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-8px);
          }
        }

        .animate-bounce {
          animation: bounce 1s infinite ease-in-out;
        }
      `}</style>
    </div>
  );
}