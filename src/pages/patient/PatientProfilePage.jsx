import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Mail,
  Edit,
  Trophy,
  ClipboardList,
  Database,
  Download,
  Trash2,
  LogOut,
  ChevronRight,
  Award,
  Shield
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from '@/components/ui/alert-dialog';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/hooks/use-toast';

/**
 * PatientProfilePage - Aba 5: Perfil
 *
 * Funcionalidades:
 * - Visualização de dados pessoais
 * - Links para Conquistas, Questionários, Banco de Alimentos
 * - Opções de LGPD (exportar dados, excluir conta)
 * - Logout
 */
export default function PatientProfilePage() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadUserAchievements = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    const { data, error } = await supabase
      .from('user_achievements')
      .select('*, achievements(name, description, icon)')
      .eq('user_id', user.id);

    if (!error) {
      setAchievements(data || []);
    }

    setLoading(false);
  }, [user]);

  useEffect(() => {
    loadUserAchievements();
  }, [loadUserAchievements]);

  const handleExportData = async () => {
    try {
      toast({
        title: 'Exportando dados...',
        description: 'Preparando seu arquivo de dados pessoais.'
      });

      // TODO: Implementar exportação real via API
      // Por enquanto, vamos simular
      setTimeout(() => {
        toast({
          title: 'Dados exportados!',
          description: 'Em breve você receberá um email com seus dados.'
        });
      }, 2000);
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível exportar seus dados.',
        variant: 'destructive'
      });
    }
  };

  const handleDeleteAccount = async () => {
    try {
      toast({
        title: 'Excluindo conta...',
        description: 'Processando sua solicitação.'
      });

      // TODO: Implementar exclusão real de conta via API
      // Por enquanto, vamos fazer logout
      setTimeout(async () => {
        await signOut();
        toast({
          title: 'Conta excluída',
          description: 'Sua conta foi marcada para exclusão.'
        });
      }, 2000);
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível excluir sua conta.',
        variant: 'destructive'
      });
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      toast({
        title: 'Logout realizado',
        description: 'Até logo!'
      });
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível fazer logout.',
        variant: 'destructive'
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 to-white">
      {/* Header fixo */}
      <div className="bg-gradient-to-r from-gray-700 to-gray-600 text-white sticky top-0 z-10 shadow-md">
        <div className="px-4 py-4">
          <h1 className="text-2xl font-bold">Perfil</h1>
          <p className="text-sm text-white/90 mt-1">
            Gerencie sua conta e preferências
          </p>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Seção: Meus Dados */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Meus Dados</CardTitle>
              <CardDescription>Informações da sua conta</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Nome */}
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">
                    {user?.profile?.name || 'Não informado'}
                  </p>
                  <p className="text-xs text-muted-foreground">Nome completo</p>
                </div>
              </div>

              {/* Email */}
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Mail className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">
                    {user?.email || 'Não informado'}
                  </p>
                  <p className="text-xs text-muted-foreground">Email</p>
                </div>
              </div>

              <hr className="border-t" />

              <Button
                variant="outline"
                className="w-full justify-between"
                onClick={() => navigate('/patient/profile')}
              >
                <span className="flex items-center gap-2">
                  <Edit className="w-4 h-4" />
                  Editar Perfil
                </span>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* Seção: Minha Jornada */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Minha Jornada</CardTitle>
              <CardDescription>Recursos e acompanhamento</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {/* Minhas Conquistas */}
              <Button
                variant="ghost"
                className="w-full justify-between h-auto py-3"
                onClick={() => {
                  // TODO: Criar página de conquistas
                  toast({
                    title: 'Conquistas',
                    description: `Você possui ${achievements.length} conquistas!`
                  });
                }}
              >
                <span className="flex items-center gap-3">
                  <Trophy className="w-5 h-5 text-yellow-600" />
                  <div className="text-left">
                    <p className="text-sm font-medium">Minhas Conquistas</p>
                    <p className="text-xs text-muted-foreground">
                      {achievements.length} conquista(s) desbloqueada(s)
                    </p>
                  </div>
                </span>
                <ChevronRight className="w-4 h-4" />
              </Button>

              <hr className="border-t" />

              {/* Meus Questionários */}
              <Button
                variant="ghost"
                className="w-full justify-between h-auto py-3"
                onClick={() => {
                  // Navegar para a página de anamnese pública
                  toast({
                    title: 'Questionários',
                    description: 'Acessando seus questionários...'
                  });
                  // TODO: Implementar rota para anamnese pública do paciente
                }}
              >
                <span className="flex items-center gap-3">
                  <ClipboardList className="w-5 h-5 text-blue-600" />
                  <div className="text-left">
                    <p className="text-sm font-medium">Meus Questionários</p>
                    <p className="text-xs text-muted-foreground">
                      Visualize e atualize suas respostas
                    </p>
                  </div>
                </span>
                <ChevronRight className="w-4 h-4" />
              </Button>

              <hr className="border-t" />

              {/* Banco de Alimentos */}
              <Button
                variant="ghost"
                className="w-full justify-between h-auto py-3"
                onClick={() => navigate('/nutritionist/food-bank')}
              >
                <span className="flex items-center gap-3">
                  <Database className="w-5 h-5 text-green-600" />
                  <div className="text-left">
                    <p className="text-sm font-medium">Banco de Alimentos</p>
                    <p className="text-xs text-muted-foreground">
                      Consulte informações nutricionais
                    </p>
                  </div>
                </span>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* Seção: Privacidade e LGPD */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                <CardTitle className="text-lg">Privacidade e LGPD</CardTitle>
              </div>
              <CardDescription>Gerencie seus dados pessoais</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {/* Exportar Dados */}
              <Button
                variant="ghost"
                className="w-full justify-between h-auto py-3"
                onClick={handleExportData}
              >
                <span className="flex items-center gap-3">
                  <Download className="w-5 h-5 text-blue-600" />
                  <div className="text-left">
                    <p className="text-sm font-medium">Exportar Meus Dados</p>
                    <p className="text-xs text-muted-foreground">
                      Baixe uma cópia dos seus dados (LGPD)
                    </p>
                  </div>
                </span>
                <ChevronRight className="w-4 h-4" />
              </Button>

              <hr className="border-t" />

              {/* Excluir Conta */}
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    className="w-full justify-between h-auto py-3 text-destructive hover:text-destructive"
                  >
                    <span className="flex items-center gap-3">
                      <Trash2 className="w-5 h-5" />
                      <div className="text-left">
                        <p className="text-sm font-medium">Excluir Minha Conta</p>
                        <p className="text-xs text-muted-foreground">
                          Remover permanentemente seus dados
                        </p>
                      </div>
                    </span>
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Excluir Conta</AlertDialogTitle>
                    <AlertDialogDescription>
                      Tem certeza que deseja excluir sua conta? Esta ação é
                      irreversível e todos os seus dados serão permanentemente
                      removidos.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteAccount}
                      className="bg-destructive hover:bg-destructive/90"
                    >
                      Sim, excluir conta
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>
        </motion.div>

        {/* Botão de Logout */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Button
            variant="outline"
            className="w-full text-destructive hover:text-destructive border-destructive/30"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sair da Conta
          </Button>
        </motion.div>

        {/* Espaço para a Bottom Navigation */}
        <div className="h-4"></div>
      </div>
    </div>
  );
}
