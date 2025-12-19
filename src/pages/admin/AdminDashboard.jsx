import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Users, UserCheck, Database, ShieldAlert, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/customSupabaseClient';

/**
 * AdminDashboard - Painel Administrativo
 * 
 * Exibe métricas principais do SaaS e ações rápidas para gerenciamento
 */
export default function AdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    totalPatients: 0,
    totalNutritionists: 0,
    totalFoods: 0
  });

  // Security check: Only admins can access
  const isAdmin = user?.profile?.is_admin === true;

  useEffect(() => {
    if (user && !isAdmin) {
      toast({
        title: 'Acesso Negado',
        description: 'Esta página é restrita a administradores.',
        variant: 'destructive'
      });
      navigate('/nutritionist', { replace: true });
      return;
    }

    if (isAdmin) {
      loadMetrics();
    }
  }, [user, isAdmin, navigate, toast]);

  const loadMetrics = async () => {
    setLoading(true);
    try {
      // Fetch all metrics in parallel
      const [patientsResult, nutritionistsResult, foodsResult] = await Promise.all([
        // Total de Pacientes
        supabase
          .from('user_profiles')
          .select('*', { count: 'exact', head: true })
          .eq('user_type', 'patient'),
        
        // Total de Nutricionistas
        supabase
          .from('user_profiles')
          .select('*', { count: 'exact', head: true })
          .eq('user_type', 'nutritionist'),
        
        // Total de Alimentos
        supabase
          .from('foods')
          .select('*', { count: 'exact', head: true })
          .eq('is_active', true)
      ]);

      setMetrics({
        totalPatients: patientsResult.count || 0,
        totalNutritionists: nutritionistsResult.count || 0,
        totalFoods: foodsResult.count || 0
      });
    } catch (error) {
      console.error('Erro ao carregar métricas:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar as métricas.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  // Don't render if not admin
  if (!user || !isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center space-y-4">
              <ShieldAlert className="w-12 h-12 text-destructive" />
              <div>
                <h2 className="text-xl font-semibold">Acesso Negado</h2>
                <p className="text-sm text-muted-foreground mt-2">
                  Esta página é restrita a administradores.
                </p>
              </div>
              <Button onClick={() => navigate('/nutritionist')}>
                Voltar ao Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <div className="max-w-7xl mx-auto w-full px-4 md:px-8 py-8 space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="flex items-center gap-3 mb-2">
            <ShieldAlert className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold text-foreground">Painel Administrativo</h1>
              <span className="inline-flex items-center px-2 py-1 rounded-md bg-primary/10 text-primary text-xs font-medium mt-1">
                Administrador
              </span>
            </div>
          </div>
          <p className="text-muted-foreground mt-2">
            Visão geral da plataforma e ferramentas de gerenciamento
          </p>
        </motion.div>

        {/* Metrics Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Total de Pacientes */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total de Pacientes
                </CardTitle>
                <Users className="h-5 w-5 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                    <span className="text-2xl font-bold">...</span>
                  </div>
                ) : (
                  <div className="text-2xl font-bold">{metrics.totalPatients}</div>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  Usuários cadastrados como pacientes
                </p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Total de Nutricionistas */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total de Nutricionistas
                </CardTitle>
                <UserCheck className="h-5 w-5 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                    <span className="text-2xl font-bold">...</span>
                  </div>
                ) : (
                  <div className="text-2xl font-bold">{metrics.totalNutritionists}</div>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  Profissionais cadastrados
                </p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Alimentos Cadastrados */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Alimentos Cadastrados
                </CardTitle>
                <Database className="h-5 w-5 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                    <span className="text-2xl font-bold">...</span>
                  </div>
                ) : (
                  <div className="text-2xl font-bold">{metrics.totalFoods}</div>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  Itens ativos no banco de dados
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Ações Rápidas</CardTitle>
              <CardDescription>
                Ferramentas de gerenciamento da plataforma
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Gerenciar Alimentos */}
                <Button
                  variant="outline"
                  size="lg"
                  className="h-auto p-6 flex flex-col items-start justify-start hover:bg-primary/5 hover:border-primary transition-colors"
                  onClick={() => navigate('/nutritionist/foods')}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <Database className="w-6 h-6 text-primary" />
                    <span className="text-lg font-semibold">Gerenciar Alimentos</span>
                  </div>
                  <p className="text-sm text-muted-foreground text-left">
                    Adicionar e editar medidas caseiras dos alimentos
                  </p>
                </Button>

                {/* Gerenciar Usuários (Placeholder) */}
                <Button
                  variant="outline"
                  size="lg"
                  className="h-auto p-6 flex flex-col items-start justify-start hover:bg-primary/5 hover:border-primary transition-colors"
                  onClick={() => {
                    toast({
                      title: 'Em breve',
                      description: 'A funcionalidade de gerenciamento de usuários estará disponível em breve.',
                    });
                  }}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <Users className="w-6 h-6 text-primary" />
                    <span className="text-lg font-semibold">Gerenciar Usuários</span>
                  </div>
                  <p className="text-sm text-muted-foreground text-left">
                    Visualizar e gerenciar contas de usuários
                  </p>
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}

