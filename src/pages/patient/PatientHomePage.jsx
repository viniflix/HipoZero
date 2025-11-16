import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { BookMarked, UtensilsCrossed, CalendarClock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import MealPlanView from '@/components/patient/MealPlanView';
import PatientMetricsWidget from '@/components/patient/PatientMetricsWidget';

/**
 * PatientHomePage - Aba 1: Início
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

    // 1. Buscar prescrição ativa com meal plan (CORRIGIDO)
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
    <div className="min-h-screen bg-slate-50">
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
            <Card className="bg-blue-50 border-blue-200">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <CalendarClock className="w-5 h-5 text-blue-600" />
                  <CardTitle className="text-lg text-blue-900">
                    Próxima Consulta
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm font-medium text-blue-900">
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
          <Card className="shadow-sm bg-white">
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

        {/* Widget de Métricas */}
        <PatientMetricsWidget />

        {/* Card de Atalho: Diário Alimentar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card
            className="cursor-pointer hover:shadow-md transition-all duration-200 bg-white"
            onClick={() => navigate('/patient/diario')}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BookMarked className="w-5 h-5 text-primary" />
                  <CardTitle className="text-base">Diário Alimentar</CardTitle>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  todayMealsCount > 0
                    ? 'bg-primary/10 text-primary'
                    : 'bg-gray-100 text-gray-500'
                }`}>
                  {todayMealsCount > 0
                    ? `${todayMealsCount} ${todayMealsCount === 1 ? 'refeição' : 'refeições'}`
                    : 'Vazio'}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">
                {todayMealsCount > 0
                  ? 'Continue registrando suas refeições'
                  : 'Comece registrando sua primeira refeição hoje'}
              </p>
              <Button
                size="sm"
                className="w-full"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate('/patient/diario');
                }}
              >
                <BookMarked className="w-4 h-4 mr-2" />
                {todayMealsCount > 0 ? 'Ver diário' : 'Registrar agora'}
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* Espaço para a Bottom Navigation */}
        <div className="h-4"></div>
      </div>
    </div>
  );
}
