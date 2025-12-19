import React from 'react';
import { Outlet } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Toaster } from '@/components/ui/toaster';
import { Shield } from 'lucide-react';
import GodToolbar from '@/components/admin/GodToolbar';

/**
 * AdminLayout - Layout dedicado para páginas administrativas
 * 
 * Layout limpo e profissional, sem navegação de paciente ou nutricionista
 */
const AdminLayout = () => {
  const { user, signOut } = useAuth();

  if (!user || !user.profile) {
    return null;
  }

  const isAdmin = user.profile.is_admin === true;

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      {/* Header Profissional */}
      <header className="sticky top-0 z-40 flex h-16 items-center justify-between gap-4 border-b bg-card px-4 md:px-8 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
            <Shield className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-foreground">Painel de Controle</h1>
            <p className="text-xs text-muted-foreground">Ambiente Administrativo</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground hidden md:inline">
            {user.profile.name || 'Administrador'}
          </span>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto w-full px-4 md:px-8 py-8">
          <Outlet />
        </div>
      </main>

      {/* Toaster para notificações */}
      <Toaster />

      {/* Control Bar (God Toolbar) */}
      <GodToolbar />
    </div>
  );
};

export default AdminLayout;

