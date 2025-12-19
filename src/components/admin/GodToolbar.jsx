import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { 
  Shield, 
  User, 
  UserCheck, 
  Sparkles, 
  ChevronUp,
  ChevronDown,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAdminMode } from '@/contexts/AdminModeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * GodToolbar - Toolbar flutuante para admins
 * 
 * Permite alternar entre modos de visualização e executar ações de demo
 */
export default function GodToolbar() {
  const { user } = useAuth();
  const { viewMode, switchView, getViewModeLabel, isAdmin } = useAdminMode();
  const { toast } = useToast();
  const location = useLocation();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  // Only render if user is admin
  if (!isAdmin || !user) {
    return null;
  }

  const handleSwitchView = (mode) => {
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
  };

  const handleDemoAction = (action) => {
    toast({
      title: 'Ação de Demo',
      description: `Funcionalidade "${action}" será implementada em breve.`,
    });
    setIsExpanded(false);
  };

  const getViewIcon = (mode) => {
    switch (mode) {
      case 'admin':
        return Shield;
      case 'nutritionist':
        return UserCheck;
      case 'patient':
        return User;
      default:
        return Shield;
    }
  };

  const getViewColor = (mode) => {
    switch (mode) {
      case 'admin':
        return 'text-amber-500';
      case 'nutritionist':
        return 'text-blue-500';
      case 'patient':
        return 'text-green-500';
      default:
        return 'text-gray-500';
    }
  };

  if (isMinimized) {
    return (
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="fixed bottom-4 right-4 z-[9999]"
      >
        <Button
          onClick={() => setIsMinimized(false)}
          className="h-12 w-12 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 shadow-2xl border-2 border-amber-300 hover:scale-110 transition-transform"
          size="icon"
        >
          <Sparkles className="w-6 h-6 text-white" />
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
        className="fixed bottom-4 right-4 z-[9999]"
      >
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl shadow-2xl border-2 border-amber-400/50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-amber-500/20 border-b border-amber-400/30">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              <span className="text-sm font-bold text-white">God Mode</span>
              {viewMode && (
                <span className={`text-xs px-2 py-1 rounded-full bg-slate-700 ${getViewColor(viewMode)}`}>
                  {getViewModeLabel()}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-white hover:bg-amber-500/20"
                onClick={() => setIsExpanded(!isExpanded)}
              >
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronUp className="w-4 h-4" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-white hover:bg-amber-500/20"
                onClick={() => setIsMinimized(true)}
              >
                <X className="w-4 h-4" />
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
              <div className="p-4 space-y-3 min-w-[280px]">
                {/* View Mode Switcher */}
                <div>
                  <p className="text-xs font-semibold text-amber-400/80 mb-2 uppercase tracking-wider">
                    Modo de Visualização
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    <Button
                      variant={viewMode === 'admin' ? 'default' : 'outline'}
                      size="sm"
                      className={`h-auto py-2 flex flex-col items-center gap-1 ${
                        viewMode === 'admin'
                          ? 'bg-amber-500 hover:bg-amber-600 text-white'
                          : 'bg-slate-700 hover:bg-slate-600 text-white border-slate-600'
                      }`}
                      onClick={() => handleSwitchView('admin')}
                    >
                      <Shield className="w-4 h-4" />
                      <span className="text-xs">Admin</span>
                    </Button>
                    <Button
                      variant={viewMode === 'nutritionist' ? 'default' : 'outline'}
                      size="sm"
                      className={`h-auto py-2 flex flex-col items-center gap-1 ${
                        viewMode === 'nutritionist'
                          ? 'bg-blue-500 hover:bg-blue-600 text-white'
                          : 'bg-slate-700 hover:bg-slate-600 text-white border-slate-600'
                      }`}
                      onClick={() => handleSwitchView('nutritionist')}
                    >
                      <UserCheck className="w-4 h-4" />
                      <span className="text-xs">Nutri</span>
                    </Button>
                    <Button
                      variant={viewMode === 'patient' ? 'default' : 'outline'}
                      size="sm"
                      className={`h-auto py-2 flex flex-col items-center gap-1 ${
                        viewMode === 'patient'
                          ? 'bg-green-500 hover:bg-green-600 text-white'
                          : 'bg-slate-700 hover:bg-slate-600 text-white border-slate-600'
                      }`}
                      onClick={() => handleSwitchView('patient')}
                    >
                      <User className="w-4 h-4" />
                      <span className="text-xs">Paciente</span>
                    </Button>
                  </div>
                </div>

                {/* Demo Actions */}
                <div>
                  <p className="text-xs font-semibold text-amber-400/80 mb-2 uppercase tracking-wider">
                    Ações de Demo
                  </p>
                  <div className="space-y-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-start bg-slate-700 hover:bg-slate-600 text-white border-slate-600"
                      onClick={() => handleDemoAction('Adicionar Paciente Fantasma')}
                    >
                      <Sparkles className="w-4 h-4 mr-2" />
                      Adicionar Paciente Fantasma
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-start bg-slate-700 hover:bg-slate-600 text-white border-slate-600"
                      onClick={() => handleDemoAction('Preencher Diário')}
                    >
                      <Sparkles className="w-4 h-4 mr-2" />
                      Preencher Diário
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-start bg-slate-700 hover:bg-slate-600 text-white border-slate-600"
                      onClick={() => handleDemoAction('Gerar Dados Aleatórios')}
                    >
                      <Sparkles className="w-4 h-4 mr-2" />
                      Gerar Dados Aleatórios
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Collapsed Quick Actions */}
          {!isExpanded && (
            <div className="p-3 flex items-center justify-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:bg-amber-500/20"
                onClick={() => handleSwitchView('admin')}
              >
                <Shield className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:bg-amber-500/20"
                onClick={() => handleSwitchView('nutritionist')}
              >
                <UserCheck className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:bg-amber-500/20"
                onClick={() => handleSwitchView('patient')}
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

