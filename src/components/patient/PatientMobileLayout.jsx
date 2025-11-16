import { Outlet, NavLink } from 'react-router-dom';
import { Home, BookMarked, LineChart, MessagesSquare, User } from 'lucide-react';
import { useChat } from '@/contexts/ChatContext';

/**
 * PatientMobileLayout - Layout principal Mobile-First para a Área do Paciente
 *
 * Arquitetura:
 * - Main content area com <Outlet /> para renderizar páginas filhas
 * - BottomNav fixo com 5 abas principais
 * - Badge de notificações não lidas no ícone de Chat
 */
export default function PatientMobileLayout() {
  const { unreadSenders } = useChat();
  const unreadCount = unreadSenders?.size || 0;

  const navItems = [
    {
      to: '/patient',
      icon: Home,
      label: 'Início',
      end: true // exact match
    },
    {
      to: '/patient/diario',
      icon: BookMarked,
      label: 'Diário'
    },
    {
      to: '/patient/progresso',
      icon: LineChart,
      label: 'Progresso'
    },
    {
      to: '/patient/chat',
      icon: MessagesSquare,
      label: 'Chat',
      badge: unreadCount
    },
    {
      to: '/patient/perfil',
      icon: User,
      label: 'Perfil'
    }
  ];

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      {/* Wrapper para conter o layout em desktop (simula app mobile) */}
      <div className="flex-1 flex flex-col max-w-screen-lg mx-auto w-full bg-white md:shadow-lg">
        {/* Main Content Area */}
        <main className="flex-1 pb-20 overflow-y-auto">
          <Outlet />
        </main>

        {/* Bottom Navigation */}
        <footer className="fixed bottom-0 left-0 right-0 md:left-auto md:right-auto md:max-w-screen-lg md:mx-auto bg-white border-t border-gray-200 safe-area-inset-bottom z-50 shadow-lg">
          <nav className="flex items-center justify-around h-16 w-full px-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `flex flex-col items-center justify-center flex-1 h-full px-2 transition-all duration-200 relative ${
                      isActive
                        ? 'text-patient-primary'
                        : 'text-gray-400 hover:text-gray-600'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <div className="relative">
                        <Icon
                          className={`w-6 h-6 transition-all ${
                            isActive ? 'scale-110' : 'scale-100'
                          }`}
                          strokeWidth={isActive ? 2.5 : 2}
                        />
                        {/* Badge de notificações não lidas */}
                        {item.badge > 0 && (
                          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
                            {item.badge > 9 ? '9+' : item.badge}
                          </span>
                        )}
                        {/* Indicador visual de aba ativa */}
                        {isActive && (
                          <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-patient-primary rounded-full"></div>
                        )}
                      </div>
                      <span
                        className={`text-xs mt-1 transition-all ${
                          isActive ? 'font-semibold' : 'font-normal'
                        }`}
                      >
                        {item.label}
                      </span>
                    </>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </footer>
      </div>
    </div>
  );
}
