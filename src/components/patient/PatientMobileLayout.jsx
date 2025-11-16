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
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Main Content Area */}
      <main className="flex-1 pb-20 overflow-y-auto">
        <Outlet />
      </main>

      {/* Bottom Navigation */}
      <footer className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 safe-area-inset-bottom z-50">
        <nav className="flex items-center justify-around h-16 max-w-screen-xl mx-auto px-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `flex flex-col items-center justify-center flex-1 h-full px-2 transition-colors relative ${
                    isActive
                      ? 'text-primary'
                      : 'text-gray-500 hover:text-gray-700'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <div className="relative">
                      <Icon
                        className="w-6 h-6"
                        strokeWidth={isActive ? 2.5 : 2}
                      />
                      {/* Badge de notificações não lidas */}
                      {item.badge > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                          {item.badge > 9 ? '9+' : item.badge}
                        </span>
                      )}
                    </div>
                    <span
                      className={`text-xs mt-1 font-medium ${
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
  );
}
