import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';

/**
 * AdminModeContext - Gerencia o modo de visualização para admins
 * 
 * Permite que admins alternem entre:
 * - 'admin': Painel administrativo
 * - 'nutritionist': Visualização como nutricionista
 * - 'patient': Visualização como paciente
 */
const AdminModeContext = createContext(null);

export const AdminModeProvider = ({ children }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isAdmin = user?.profile?.is_admin === true;
  
  // Determine view mode based on current route
  const getViewModeFromPath = (pathname) => {
    if (!isAdmin) return null;
    if (pathname.startsWith('/admin')) return 'admin';
    if (pathname.startsWith('/nutritionist')) return 'nutritionist';
    if (pathname.startsWith('/patient')) return 'patient';
    return 'admin'; // Default
  };
  
  const [viewMode, setViewMode] = useState(() => getViewModeFromPath(location.pathname));

  // Update view mode when route changes
  useEffect(() => {
    if (isAdmin) {
      const newMode = getViewModeFromPath(location.pathname);
      if (newMode !== viewMode) {
        setViewMode(newMode);
      }
    }
  }, [location.pathname, isAdmin]); // eslint-disable-line react-hooks/exhaustive-deps

  /**
   * Switch view mode and navigate to appropriate route
   */
  const switchView = useCallback((mode) => {
    if (!isAdmin) {
      console.warn('switchView called but user is not admin');
      return;
    }

    if (!['admin', 'nutritionist', 'patient'].includes(mode)) {
      console.error('Invalid view mode:', mode);
      return;
    }

    setViewMode(mode);

    // Navigate to appropriate route based on mode
    switch (mode) {
      case 'admin':
        navigate('/admin/dashboard', { replace: true });
        break;
      case 'nutritionist':
        navigate('/nutritionist', { replace: true });
        break;
      case 'patient':
        navigate('/patient', { replace: true });
        break;
      default:
        break;
    }
  }, [isAdmin, navigate]);

  /**
   * Get current view mode label
   */
  const getViewModeLabel = useCallback(() => {
    switch (viewMode) {
      case 'admin':
        return 'Admin';
      case 'nutritionist':
        return 'Nutricionista';
      case 'patient':
        return 'Paciente';
      default:
        return null;
    }
  }, [viewMode]);

  const value = {
    viewMode,
    switchView,
    getViewModeLabel,
    isAdmin,
  };

  return (
    <AdminModeContext.Provider value={value}>
      {children}
    </AdminModeContext.Provider>
  );
};

export const useAdminMode = () => {
  const context = useContext(AdminModeContext);
  if (!context) {
    // Return safe defaults if context is not available
    return {
      viewMode: null,
      switchView: () => {},
      getViewModeLabel: () => null,
      isAdmin: false,
    };
  }
  return context;
};

