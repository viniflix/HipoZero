import { Toaster } from '@/components/ui/toaster';
import { useAdminMode } from '@/contexts/AdminModeContext';

/**
 * SmartToaster - Toaster com posicionamento inteligente baseado no estado admin
 * 
 * - Admins: top-center (não sobrepõe toolbar)
 * - Usuários regulares: bottom-right (padrão)
 */
export default function SmartToaster() {
  const { isAdmin } = useAdminMode();
  
  return <Toaster position={isAdmin ? "top-center" : "bottom-right"} />;
}

