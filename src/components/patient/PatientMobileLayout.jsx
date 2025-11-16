import { Outlet, NavLink } from 'react-router-dom';
import { Home, BookMarked, LineChart, MessagesSquare, User } from 'lucide-react';
import { useChat } from '@/contexts/ChatContext';

/**
 * PatientMobileLayout - Layout responsivo para Área do Paciente
 *
 * Desktop (md+): Sidebar fixa à esquerda
 * Mobile: BottomNav fixo inferior
 */
export default function PatientMobileLayout() {
  const { unreadSenders } = useChat();
  const unreadCount = unreadSenders?.size || 0;

  const navItems = [
    {
      to: '/patient',
      icon: Home,
      label: 'Início',
      end: true
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
    <div className="flex h-screen bg-slate-50">
      {/* SIDEBAR (Desktop apenas) */}
      <aside className="hidden md:flex md:flex-col md:w-64 bg-white border-r border-gray-200 fixed inset-y-0 left-0 z-30">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-xl font-bold text-primary">Área do Paciente</h1>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors relative ${
                    isActive
                      ? 'bg-primary text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 2} />
                    <span className={isActive ? 'font-semibold' : 'font-medium'}>
                      {item.label}
                    </span>
                    {item.badge > 0 && (
                      <span className="ml-auto bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                        {item.badge > 9 ? '9+' : item.badge}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 md:ml-64 overflow-y-auto">
        <div className="h-full pb-20 md:pb-0">
          <Outlet />
        </div>
      </main>

      {/* BOTTOM NAV (Mobile apenas) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-30 safe-area-inset-bottom">
        <div className="flex items-center justify-around h-16 px-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `flex flex-col items-center justify-center flex-1 h-full px-2 transition-colors ${
                    isActive ? 'text-primary' : 'text-gray-500'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <div className="relative">
                      <Icon className="w-6 h-6" strokeWidth={isActive ? 2.5 : 2} />
                      {item.badge > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-4 w-4 flex items-center justify-center">
                          {item.badge > 9 ? '9' : item.badge}
                        </span>
                      )}
                    </div>
                    <span className={`text-xs mt-1 ${isActive ? 'font-semibold' : 'font-normal'}`}>
                      {item.label}
                    </span>
                  </>
                )}
              </NavLink>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
