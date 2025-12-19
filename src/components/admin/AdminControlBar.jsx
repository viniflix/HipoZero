import { useState } from 'react';
import { 
  Shield, 
  User, 
  UserCheck, 
  Settings,
  ChevronUp,
  ChevronDown,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAdminMode } from '@/contexts/AdminModeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * AdminControlBar - Barra de controle profissional com glassmorphism
 * 
 * Design profissional para apresentações a investidores
 * Estilo: Glassmorphism com backdrop blur
 */
export default function AdminControlBar() {
  const { user } = useAuth();
  const { viewMode, switchView, getViewModeLabel, isAdmin } = useAdminMode();
  const { toast } = useToast();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  // Only render if user is admin
  if (!isAdmin || !user) {
    return null;
  }

  const handleSwitchView = (mode) => {
    console.log('[AdminControlBar] handleSwitchView called with mode:', mode);
    
    if (!isAdmin) {
      console.warn('[AdminControlBar] Attempted to switch view but user is not admin');
      return;
    }

    try {
      switchView(mode);
      setIsExpanded(false);
      const modeLabels = {
        'admin': 'Admin',
        'nutritionist': 'Nutricionista',
        'patient': 'Paciente'
      };
      toast({
        title: 'Modo alterado',
        description: `Visualizando como ${modeLabels[mode] || mode}`,
      });
    } catch (error) {
      console.error('[AdminControlBar] Error switching view:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível alterar o modo de visualização.',
        variant: 'destructive'
      });
    }
  };

  const handleDemoAction = (action) => {
    toast({
      title: 'Ação de Demo',
      description: `Funcionalidade "${action}" será implementada em breve.`,
    });
    setIsExpanded(false);
  };

  if (isMinimized) {
    return (
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] md:bottom-4 md:left-auto md:translate-x-0 md:right-4"
      >
        <Button
          onClick={() => setIsMinimized(false)}
          className="h-12 w-12 rounded-full backdrop-blur-xl bg-slate-950/90 hover:bg-slate-900/95 shadow-2xl border border-white/10 transition-all"
          size="icon"
        >
          <Settings className="w-5 h-5 text-white" />
        </Button>
      </motion.div>
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] w-[90%] max-w-md md:bottom-4 md:left-auto md:translate-x-0 md:right-4 md:w-auto md:max-w-none"
      >
        <div className="backdrop-blur-xl bg-slate-950/90 rounded-full md:rounded-2xl shadow-2xl border-t border-white/10 overflow-hidden">
          {/* Header - Mobile: Pill shape, Desktop: Rounded rectangle */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 md:px-4 md:py-2.5">
            <div className="flex items-center gap-2">
              <Settings className="w-4 h-4 text-slate-300" />
              <span className="text-xs font-semibold text-white uppercase tracking-wider">
                Ambiente de Controle
              </span>
              {viewMode && (
                <span className="text-xs px-2 py-0.5 rounded-md bg-white/10 text-slate-300 font-medium">
                  {getViewModeLabel()}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-slate-300 hover:bg-white/10 hover:text-white"
                onClick={() => setIsExpanded(!isExpanded)}
              >
                {isExpanded ? (
                  <ChevronDown className="w-3.5 h-3.5" />
                ) : (
                  <ChevronUp className="w-3.5 h-3.5" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-slate-300 hover:bg-white/10 hover:text-white"
                onClick={() => setIsMinimized(true)}
              >
                <X className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>

          {/* Expanded Content */}
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="p-4 space-y-4">
                {/* View Mode Switcher */}
                <div>
                  <p className="text-xs font-semibold text-slate-400 mb-3 uppercase tracking-wider">
                    Modo de Visualização
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    <Button
                      variant={viewMode === 'admin' ? 'default' : 'outline'}
                      size="sm"
                      className={`h-auto py-2.5 flex flex-col items-center gap-1.5 ${
                        viewMode === 'admin'
                          ? 'bg-white/20 hover:bg-white/25 text-white border-white/20'
                          : 'bg-white/5 hover:bg-white/10 text-slate-300 border-white/10'
                      }`}
                      onClick={() => handleSwitchView('admin')}
                    >
                      <Shield className="w-4 h-4" />
                      <span className="text-xs font-medium">Admin</span>
                    </Button>
                    <Button
                      variant={viewMode === 'nutritionist' ? 'default' : 'outline'}
                      size="sm"
                      className={`h-auto py-2.5 flex flex-col items-center gap-1.5 ${
                        viewMode === 'nutritionist'
                          ? 'bg-white/20 hover:bg-white/25 text-white border-white/20'
                          : 'bg-white/5 hover:bg-white/10 text-slate-300 border-white/10'
                      }`}
                      onClick={() => handleSwitchView('nutritionist')}
                    >
                      <UserCheck className="w-4 h-4" />
                      <span className="text-xs font-medium">Nutri</span>
                    </Button>
                    <Button
                      variant={viewMode === 'patient' ? 'default' : 'outline'}
                      size="sm"
                      className={`h-auto py-2.5 flex flex-col items-center gap-1.5 ${
                        viewMode === 'patient'
                          ? 'bg-white/20 hover:bg-white/25 text-white border-white/20'
                          : 'bg-white/5 hover:bg-white/10 text-slate-300 border-white/10'
                      }`}
                      onClick={() => handleSwitchView('patient')}
                    >
                      <User className="w-4 h-4" />
                      <span className="text-xs font-medium">Paciente</span>
                    </Button>
                  </div>
                </div>

                {/* Demo Actions */}
                <div>
                  <p className="text-xs font-semibold text-slate-400 mb-3 uppercase tracking-wider">
                    Ações de Demo
                  </p>
                  <div className="space-y-1.5">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-start bg-white/5 hover:bg-white/10 text-slate-300 border-white/10"
                      onClick={() => handleDemoAction('Adicionar Paciente Fantasma')}
                    >
                      <User className="w-3.5 h-3.5 mr-2" />
                      <span className="text-xs">Adicionar Paciente Fantasma</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-start bg-white/5 hover:bg-white/10 text-slate-300 border-white/10"
                      onClick={() => handleDemoAction('Preencher Diário')}
                    >
                      <UserCheck className="w-3.5 h-3.5 mr-2" />
                      <span className="text-xs">Preencher Diário</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-start bg-white/5 hover:bg-white/10 text-slate-300 border-white/10"
                      onClick={() => handleDemoAction('Gerar Dados Aleatórios')}
                    >
                      <Settings className="w-3.5 h-3.5 mr-2" />
                      <span className="text-xs">Gerar Dados Aleatórios</span>
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Collapsed Quick Actions */}
          {!isExpanded && (
            <div className="p-2.5 flex items-center justify-center gap-1.5">
              <Button
                variant="ghost"
                size="sm"
                className={`h-8 w-8 p-0 ${viewMode === 'admin' ? 'bg-white/20 text-white' : 'text-slate-300 hover:bg-white/10 hover:text-white'}`}
                onClick={() => handleSwitchView('admin')}
                title="Modo Admin"
              >
                <Shield className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className={`h-8 w-8 p-0 ${viewMode === 'nutritionist' ? 'bg-white/20 text-white' : 'text-slate-300 hover:bg-white/10 hover:text-white'}`}
                onClick={() => handleSwitchView('nutritionist')}
                title="Modo Nutricionista"
              >
                <UserCheck className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className={`h-8 w-8 p-0 ${viewMode === 'patient' ? 'bg-white/20 text-white' : 'text-slate-300 hover:bg-white/10 hover:text-white'}`}
                onClick={() => handleSwitchView('patient')}
                title="Modo Paciente"
              >
                <User className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

