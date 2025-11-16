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

    // 1. Buscar plano alimentar ativo do paciente
    const { data: mealPlanData, error: mealPlanError } = await supabase
      .from('meal_plans')
      .select(`
        *,
        meal_plan_meals (
          *,
          meal_plan_foods (
            *,
            foods (id, name)
          )
        )
      `)
      .eq('patient_id', user.id)
      .eq('is_active', true)
      .lte('start_date', todayStr)
      .or(`end_date.is.null,end_date.gte.${todayStr}`)
      .maybeSingle();

    console.log('Meal plan data:', mealPlanData); // Debug
    console.log('Meal plan error:', mealPlanError); // Debug

    setPrescription(mealPlanData);

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
    <div className="flex flex-col min-h-screen bg-background">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-7xl mx-auto w-full px-4 md:px-8 py-8"
      >
        {/* Header */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold font-heading uppercase tracking-wide text-primary">
            Olá, {firstName}! 👋
          </h2>
          <p className="text-neutral-600 mt-1">
            {format(new Date(), "EEEE, dd 'de' MMMM", { locale: ptBR })}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Coluna Principal */}
          <div className="lg:col-span-2 space-y-6">
            {/* Lembrete de Consulta */}
            {nextAppointment && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Card className="bg-blue-50 border-blue-200 shadow-card">
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

            {/* Card: Plano Alimentar do Dia */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="shadow-card-dark rounded-xl bg-card">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <UtensilsCrossed className="w-5 h-5 text-primary" />
                      <CardTitle className="text-lg font-semibold">Plano Alimentar de Hoje</CardTitle>
                    </div>
                  </div>
                  <CardDescription>
                    Veja as refeições prescritas para o dia
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {prescription?.meal_plan_meals && prescription.meal_plan_meals.length > 0 ? (
                    <MealPlanView mealPlanItems={prescription.meal_plan_meals} />
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

            {/* Card: Diário Alimentar */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card
                className="shadow-card-dark rounded-xl bg-card cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => navigate('/patient/diario')}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <BookMarked className="w-5 h-5 text-primary" />
                      <CardTitle className="text-base font-semibold">Diário Alimentar</CardTitle>
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
          </div>

          {/* Coluna Lateral */}
          <div className="lg:col-span-1 space-y-6">
            {/* Widget de Métricas */}
            <PatientMetricsWidget />
          </div>
        </div>
      </motion.div>
    </div>
  );
}
