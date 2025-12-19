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
 * AdminControlBar - Premium Command Center com cores semânticas
 * 
 * Design profissional com glassmorphism e cores dinâmicas baseadas no modo ativo
 */
export default function AdminControlBar() {
  const { user } = useAuth();
  const { viewMode, switchView, getViewModeLabel, isAdmin, theme } = useAdminMode();
  const { toast } = useToast();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  // Only render if user is admin
  if (!isAdmin || !user) {
    return null;
  }

  const handleSwitchView = (mode) => {
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

  const getModeIcon = (mode) => {
    switch (mode) {
      case 'admin':
        return Shield;
      case 'nutritionist':
        return UserCheck;
      case 'patient':
        return User;
      default:
        return Settings;
    }
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
          className={`h-12 w-12 rounded-full backdrop-blur-xl bg-gradient-to-br ${theme.bgGradient} hover:opacity-90 shadow-2xl border ${theme.borderColor} transition-all`}
          size="icon"
        >
          <Settings className={`w-5 h-5 ${theme.iconColor}`} />
        </Button>
      </motion.div>
    );
  }

  const CurrentIcon = getModeIcon(viewMode);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] w-[90%] max-w-lg md:bottom-4 md:left-auto md:translate-x-0 md:right-4 md:w-auto md:max-w-none"
      >
        <motion.div
          key={viewMode} // Re-animate on mode change
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3 }}
          className={`backdrop-blur-xl bg-gradient-to-br ${theme.bgGradient} bg-slate-950/90 rounded-full md:rounded-2xl shadow-2xl border-t ${theme.borderColor} overflow-hidden`}
        >
          {/* Header - Collapsed State (Pill Shape) */}
          {!isExpanded && (
            <div className="flex items-center justify-between px-4 py-3 gap-3">
              {/* Left: Pulse Indicator + Icon + Label */}
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="relative flex-shrink-0">
                  <div className={`w-2 h-2 rounded-full ${theme.pulseColor} animate-pulse`} />
                  <div className={`absolute inset-0 w-2 h-2 rounded-full ${theme.pulseColor} animate-ping opacity-75`} />
                </div>
                <CurrentIcon className={`w-4 h-4 flex-shrink-0 ${theme.iconColor}`} />
                <span className={`text-xs font-semibold ${theme.textColor} uppercase tracking-wider truncate hidden sm:inline`}>
                  {theme.label}
                </span>
              </div>

              {/* Right: Mode Switcher Buttons */}
              <div className="flex items-center gap-1 flex-shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  className={`h-8 w-8 p-0 ${viewMode === 'admin' ? 'bg-indigo-500/30 text-indigo-300' : 'text-slate-400 hover:bg-white/10 hover:text-indigo-300'}`}
                  onClick={() => handleSwitchView('admin')}
                  title="Modo Admin"
                >
                  <Shield className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className={`h-8 w-8 p-0 ${viewMode === 'nutritionist' ? 'bg-emerald-500/30 text-emerald-300' : 'text-slate-400 hover:bg-white/10 hover:text-emerald-300'}`}
                  onClick={() => handleSwitchView('nutritionist')}
                  title="Modo Nutricionista"
                >
                  <UserCheck className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className={`h-8 w-8 p-0 ${viewMode === 'patient' ? 'bg-blue-500/30 text-blue-300' : 'text-slate-400 hover:bg-white/10 hover:text-blue-300'}`}
                  onClick={() => handleSwitchView('patient')}
                  title="Modo Paciente"
                >
                  <User className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-slate-400 hover:bg-white/10 hover:text-white"
                  onClick={() => setIsExpanded(true)}
                >
                  <ChevronUp className="w-3.5 h-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-slate-400 hover:bg-white/10 hover:text-white"
                  onClick={() => setIsMinimized(true)}
                >
                  <X className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          )}

          {/* Expanded Content */}
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              {/* Expanded Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className={`w-2 h-2 rounded-full ${theme.pulseColor} animate-pulse`} />
                    <div className={`absolute inset-0 w-2 h-2 rounded-full ${theme.pulseColor} animate-ping opacity-75`} />
                  </div>
                  <CurrentIcon className={`w-4 h-4 ${theme.iconColor}`} />
                  <span className={`text-xs font-semibold ${theme.textColor} uppercase tracking-wider`}>
                    {theme.label}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-slate-300 hover:bg-white/10 hover:text-white"
                    onClick={() => setIsExpanded(false)}
                  >
                    <ChevronDown className="w-3.5 h-3.5" />
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
                      className={`h-auto py-2.5 flex flex-col items-center gap-1.5 transition-all ${
                        viewMode === 'admin'
                          ? 'bg-indigo-500/30 hover:bg-indigo-500/40 text-indigo-300 border-indigo-400/50'
                          : 'bg-white/5 hover:bg-indigo-500/20 text-slate-300 border-white/10 hover:text-indigo-300'
                      }`}
                      onClick={() => handleSwitchView('admin')}
                    >
                      <Shield className="w-4 h-4" />
                      <span className="text-xs font-medium">Admin</span>
                    </Button>
                    <Button
                      variant={viewMode === 'nutritionist' ? 'default' : 'outline'}
                      size="sm"
                      className={`h-auto py-2.5 flex flex-col items-center gap-1.5 transition-all ${
                        viewMode === 'nutritionist'
                          ? 'bg-emerald-500/30 hover:bg-emerald-500/40 text-emerald-300 border-emerald-400/50'
                          : 'bg-white/5 hover:bg-emerald-500/20 text-slate-300 border-white/10 hover:text-emerald-300'
                      }`}
                      onClick={() => handleSwitchView('nutritionist')}
                    >
                      <UserCheck className="w-4 h-4" />
                      <span className="text-xs font-medium">Nutri</span>
                    </Button>
                    <Button
                      variant={viewMode === 'patient' ? 'default' : 'outline'}
                      size="sm"
                      className={`h-auto py-2.5 flex flex-col items-center gap-1.5 transition-all ${
                        viewMode === 'patient'
                          ? 'bg-blue-500/30 hover:bg-blue-500/40 text-blue-300 border-blue-400/50'
                          : 'bg-white/5 hover:bg-blue-500/20 text-slate-300 border-white/10 hover:text-blue-300'
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
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
