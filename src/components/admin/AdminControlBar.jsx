import { useState, useRef } from 'react';
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
 * AdminControlBar - Premium Command Center
 * 
 * Desktop: Beautiful glassmorphism pillbar at bottom
 * Mobile: Draggable FAB (Floating Action Button) that expands on click
 */
export default function AdminControlBar() {
  const { user } = useAuth();
  const { viewMode, switchView, getViewModeLabel, isAdmin, theme } = useAdminMode();
  const { toast } = useToast();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isMobileExpanded, setIsMobileExpanded] = useState(false);
  const constraintsRef = useRef(null);

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
      setIsMobileExpanded(false);
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
    setIsMobileExpanded(false);
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

  const CurrentIcon = getModeIcon(viewMode);

  // ========== DESKTOP VERSION (md:flex) ==========
  // Beautiful glassmorphism pillbar - keep current implementation
  const DesktopToolbar = () => {
    if (isMinimized) {
      return (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="hidden md:flex fixed bottom-4 right-4 z-[9999]"
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

    return (
      <div className="hidden md:flex fixed bottom-4 right-4 z-[9999]">
        <AnimatePresence>
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            key={viewMode}
            className={`backdrop-blur-xl bg-gradient-to-br ${theme.bgGradient} bg-slate-950/90 rounded-2xl shadow-2xl border-t ${theme.borderColor} overflow-hidden`}
          >
            {/* Header - Collapsed State */}
            {!isExpanded && (
              <div className="flex items-center justify-between px-4 py-3 gap-3">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="relative flex-shrink-0">
                    <div className={`w-2 h-2 rounded-full ${theme.pulseColor} animate-pulse`} />
                    <div className={`absolute inset-0 w-2 h-2 rounded-full ${theme.pulseColor} animate-ping opacity-75`} />
                  </div>
                  <CurrentIcon className={`w-4 h-4 flex-shrink-0 ${theme.iconColor}`} />
                  <span className={`text-xs font-semibold ${theme.textColor} uppercase tracking-wider`}>
                    {theme.label}
                  </span>
                </div>
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
        </AnimatePresence>
      </div>
    );
  };

  // ========== MOBILE VERSION (md:hidden) ==========
  // Draggable FAB that expands on click
  const MobileFAB = () => {
    return (
      <>
        <div ref={constraintsRef} className="fixed inset-0 pointer-events-none md:hidden" />
        <div className="flex md:hidden fixed bottom-6 right-6 z-[9999]">
          <AnimatePresence>
            {/* Draggable FAB Bubble */}
            <motion.div
              drag
              dragConstraints={constraintsRef}
              dragElastic={0.2}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              whileDrag={{ scale: 1.1 }}
              className="relative"
            >
              {/* FAB Button */}
              <motion.button
                onClick={() => setIsMobileExpanded(!isMobileExpanded)}
                className={`h-14 w-14 rounded-full backdrop-blur-xl bg-gradient-to-br ${theme.bgGradient} bg-slate-950/90 shadow-2xl border ${theme.borderColor} flex items-center justify-center transition-all active:scale-95`}
                whileTap={{ scale: 0.95 }}
              >
                <AnimatePresence mode="wait">
                  <motion.div
                    key={viewMode}
                    initial={{ rotate: -180, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 180, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <CurrentIcon className={`w-6 h-6 ${theme.iconColor}`} />
                  </motion.div>
                </AnimatePresence>
                {/* Pulse Indicator */}
                <div className="absolute -top-1 -right-1">
                  <div className={`w-3 h-3 rounded-full ${theme.pulseColor} animate-pulse`} />
                </div>
              </motion.button>

              {/* Expanded Menu */}
              {isMobileExpanded && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.8, y: 20 }}
                  className="absolute bottom-16 right-0 mb-2 backdrop-blur-xl bg-slate-950/95 rounded-2xl shadow-2xl border border-white/10 p-3 min-w-[200px]"
                >
                  {/* Current Mode Indicator */}
                  <div className="flex items-center gap-2 mb-3 pb-3 border-b border-white/10">
                    <div className="relative">
                      <div className={`w-2 h-2 rounded-full ${theme.pulseColor} animate-pulse`} />
                    </div>
                    <span className={`text-xs font-semibold ${theme.textColor} uppercase tracking-wider`}>
                      {theme.label}
                    </span>
                  </div>

                  {/* Mode Switcher Buttons */}
                  <div className="space-y-2">
                    <Button
                      variant={viewMode === 'admin' ? 'default' : 'outline'}
                      size="sm"
                      className={`w-full justify-start ${
                        viewMode === 'admin'
                          ? 'bg-indigo-500/30 hover:bg-indigo-500/40 text-indigo-300 border-indigo-400/50'
                          : 'bg-white/5 hover:bg-indigo-500/20 text-slate-300 border-white/10 hover:text-indigo-300'
                      }`}
                      onClick={() => handleSwitchView('admin')}
                    >
                      <Shield className="w-4 h-4 mr-2" />
                      <span className="text-xs">Admin</span>
                    </Button>
                    <Button
                      variant={viewMode === 'nutritionist' ? 'default' : 'outline'}
                      size="sm"
                      className={`w-full justify-start ${
                        viewMode === 'nutritionist'
                          ? 'bg-emerald-500/30 hover:bg-emerald-500/40 text-emerald-300 border-emerald-400/50'
                          : 'bg-white/5 hover:bg-emerald-500/20 text-slate-300 border-white/10 hover:text-emerald-300'
                      }`}
                      onClick={() => handleSwitchView('nutritionist')}
                    >
                      <UserCheck className="w-4 h-4 mr-2" />
                      <span className="text-xs">Nutricionista</span>
                    </Button>
                    <Button
                      variant={viewMode === 'patient' ? 'default' : 'outline'}
                      size="sm"
                      className={`w-full justify-start ${
                        viewMode === 'patient'
                          ? 'bg-blue-500/30 hover:bg-blue-500/40 text-blue-300 border-blue-400/50'
                          : 'bg-white/5 hover:bg-blue-500/20 text-slate-300 border-white/10 hover:text-blue-300'
                      }`}
                      onClick={() => handleSwitchView('patient')}
                    >
                      <User className="w-4 h-4 mr-2" />
                      <span className="text-xs">Paciente</span>
                    </Button>
                  </div>

                  {/* Close Button */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full mt-2 text-slate-400 hover:text-white hover:bg-white/10"
                    onClick={() => setIsMobileExpanded(false)}
                  >
                    <X className="w-4 h-4 mr-2" />
                    <span className="text-xs">Fechar</span>
                  </Button>
                </motion.div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </>
    );
  };

  return (
    <>
      <DesktopToolbar />
      <MobileFAB />
    </>
  );
}
