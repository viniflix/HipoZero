import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { LineChart, BookMarked, UtensilsCrossed, CalendarClock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import MealPlanView from '@/components/patient/MealPlanView';

/**
 * PatientHomePage - Aba 1: Início
 *
 * Visão do Dia do Paciente:
 * - Header de boas-vindas personalizado
 * - Card do Plano Alimentar de Hoje
 * - Cards de atalho para Progresso e Diário
 * - Lembrete de próxima consulta
 */
export default function PatientHomePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [prescription, setPrescription] = useState(null);
  const [nextAppointment, setNextAppointment] = useState(null);
  const [todayMealsCount, setTodayMealsCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    const today = new Date();
    const todayStr = format(today, 'yyyy-MM-dd');

    // 1. Buscar prescrição ativa com meal plan
    const { data: presData, error: presError } = await supabase
      .from('prescriptions')
      .select('*')
      .eq('patient_id', user.id)
      .lte('start_date', todayStr)
      .gte('end_date', todayStr)
      .maybeSingle();

    if (!presError && presData?.template_id) {
      // Buscar itens do template com alimentos
      const { data: itemsData } = await supabase
        .from('meal_plan_template_items')
        .select('*, foods(id, name)')
        .eq('template_id', presData.template_id);

      setPrescription({ ...presData, meal_plan_items: itemsData || [] });
    } else {
      setPrescription(presData);
    }

    // 2. Buscar próxima consulta
    const { data: apptData } = await supabase
      .from('appointments')
      .select('*')
      .eq('patient_id', user.id)
      .gte('appointment_time', today.toISOString())
      .order('appointment_time', { ascending: true })
      .limit(1)
      .maybeSingle();

    setNextAppointment(apptData);

    // 3. Contar refeições registradas hoje
    const { count } = await supabase
      .from('meals')
      .select('*', { count: 'exact', head: true })
      .eq('patient_id', user.id)
      .eq('meal_date', todayStr);

    setTodayMealsCount(count || 0);

    setLoading(false);
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const firstName = user?.profile?.name?.split(' ')[0] || 'Paciente';

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background">
      {/* Header com saudação */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white border-b sticky top-0 z-10"
      >
        <div className="px-4 py-6">
          <h1 className="text-2xl font-bold text-foreground">
            Olá, {firstName}! 👋
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {format(new Date(), "EEEE, dd 'de' MMMM", { locale: ptBR })}
          </p>
        </div>
      </motion.div>

      <div className="p-4 space-y-4">
        {/* Lembrete de Consulta */}
        {nextAppointment && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="bg-accent/10 border-accent/20">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <CalendarClock className="w-5 h-5 text-accent" />
                  <CardTitle className="text-lg text-accent">
                    Próxima Consulta
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm font-medium">
                  {format(
                    new Date(nextAppointment.appointment_time),
                    "dd 'de' MMMM 'às' HH:mm",
                    { locale: ptBR }
                  )}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Card Principal: Plano Alimentar do Dia */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <UtensilsCrossed className="w-5 h-5 text-primary" />
                  <CardTitle className="text-lg">Plano Alimentar de Hoje</CardTitle>
                </div>
              </div>
              <CardDescription>
                Veja as refeições prescritas para o dia
              </CardDescription>
            </CardHeader>
            <CardContent>
              {prescription?.meal_plan_items ? (
                <MealPlanView mealPlanItems={prescription.meal_plan_items} />
              ) : (
                <div className="text-center py-8">
                  <UtensilsCrossed className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
                  <p className="text-sm text-muted-foreground">
                    Nenhum plano alimentar ativo no momento.
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Entre em contato com seu nutricionista.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Cards de Atalho */}
        <div className="grid grid-cols-2 gap-4">
          {/* Atalho: Meu Progresso */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => navigate('/patient/progresso')}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <LineChart className="w-5 h-5 text-primary" />
                  <CardTitle className="text-base">Progresso</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">
                  Veja seus resultados e evolução
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-3 w-full"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate('/patient/progresso');
                  }}
                >
                  Ver gráficos
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* Atalho: Diário Alimentar */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => navigate('/patient/diario')}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <BookMarked className="w-5 h-5 text-primary" />
                  <CardTitle className="text-base">Diário</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground mb-1">
                  {todayMealsCount > 0
                    ? `${todayMealsCount} refeições registradas hoje`
                    : 'Nenhuma refeição registrada hoje'}
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-3 w-full"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate('/patient/diario');
                  }}
                >
                  Registrar refeição
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Espaço para a Bottom Navigation */}
        <div className="h-4"></div>
      </div>
    </div>
  );
}
