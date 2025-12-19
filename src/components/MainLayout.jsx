import React from 'react';
import { Outlet } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import DashboardHeader from '@/components/DashboardHeader';
import { Toaster } from '@/components/ui/toaster';
import AdminControlBar from '@/components/admin/AdminControlBar';

const MainLayout = () => {
  const { user, signOut } = useAuth();

  if (!user || !user.profile) {
    return null;
  }

  return (
    <div className="flex min-h-screen w-full flex-col">
      {/* 1. Apenas o Header (que agora tem a navegação) */}
      <DashboardHeader
        user={user}
        logout={signOut}
      />

      {/* 2. O conteúdo principal da página */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* 3. Toaster para notificações */}
      <Toaster />

      {/* 4. Admin Control Bar (apenas para admins) */}
      <AdminControlBar />
    </div>
  );
};

export default MainLayout;
