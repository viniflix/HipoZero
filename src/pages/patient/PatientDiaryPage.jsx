import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { format, addDays, subDays, isToday, isYesterday, isTomorrow, startOfDay, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarDays, Plus, Utensils, Trash2, MoreHorizontal, ChevronLeft, ChevronRight, FileText, Eye, Bell, CheckCircle2, Clock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/hooks/use-toast';
import { translateMealType } from '@/utils/mealTranslations';
import MealPlanViewDialog from '@/components/patient/MealPlanViewDialog';
import NotificationsPanel from '@/components/NotificationsPanel';
import { useNotifications } from '@/hooks/useNotifications';
import DailyAdherenceCard from '@/components/patient/DailyAdherenceCard';
import { formatQuantityWithUnit } from '@/lib/utils/measureTranslations';

/**
 * PatientDiaryPage - Aba 2: Diário
 *
 * Funcionalidades:
 * - Seletor de data para navegar entre dias
 * - Resumo de macros do dia (Calorias, P/C/G)
 * - Lista de refeições por tipo (Café da manhã, Almoço, etc.)
 * - Botão para adicionar alimentos
 * - Opção de deletar refeições
 */
export default function PatientDiaryPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [meals, setMeals] = useState([]);
  const [mealPlan, setMealPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [mealToDelete, setMealToDelete] = useState(null);
  const [planDialogOpen, setPlanDialogOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const { unreadCount } = useNotifications();
  const [prescriptionGoal, setPrescriptionGoal] = useState(null);
  const [activeView, setActiveView] = useState('plan'); // 'plan' or 'history'

  // Todos os tipos possíveis (para modal)
  const ALL_MEAL_TYPES = [
    { key: 'breakfast', label: 'Café da Manhã' },
    { key: 'morning_snack', label: 'Lanche da Manhã' },
    { key: 'lunch', label: 'Almoço' },
    { key: 'afternoon_snack', label: 'Lanche da Tarde' },
    { key: 'dinner', label: 'Jantar' },
    { key: 'supper', label: 'Ceia' }
  ];

  // Tipos filtrados pelo plano do paciente
  const planMealTypes = mealPlan?.meal_plan_meals?.map(m => m.meal_type) || [];

  const loadMealPlan = useCallback(async () => {
    if (!user) return;

    const todayStr = format(new Date(), 'yyyy-MM-dd');

    const { data: mealPlanData } = await supabase
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

    setMealPlan(mealPlanData);

    // Load prescription goals for daily summary
    const { data: prescriptionData } = await supabase
      .from('prescriptions')
      .select('calories, protein, carbs, fat, start_date, end_date')
      .eq('patient_id', user.id)
      .lte('start_date', todayStr)
      .or(`end_date.is.null,end_date.gte.${todayStr}`)
      .maybeSingle();

    if (prescriptionData) {
      setPrescriptionGoal({
        calories: prescriptionData.calories || 0,
        protein: prescriptionData.protein || 0,
        carbs: prescriptionData.carbs || 0,
        fat: prescriptionData.fat || 0
      });
    }
  }, [user]);

  const loadMeals = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    const dateStr = format(selectedDate, 'yyyy-MM-dd');

    // Buscar refeições do dia com itens e alimentos
    // Filtrar apenas refeições NÃO deletadas (deleted_at IS NULL)
    const { data: mealsData, error } = await supabase
      .from('meals')
      .select(`
        *,
        meal_items (
          *,
          foods (
            id,
            name
          )
        )
      `)
      .eq('patient_id', user.id)
      .eq('meal_date', dateStr)
      .is('deleted_at', null)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Erro ao carregar refeições:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar as refeições.',
        variant: 'destructive'
      });
    } else {
      setMeals(mealsData || []);
    }

    setLoading(false);
  }, [user, selectedDate, toast]);

  useEffect(() => {
    loadMealPlan();
  }, [loadMealPlan]);

  useEffect(() => {
    loadMeals();
  }, [loadMeals]);

  // Calcular totais do dia
  const dailyTotals = meals.reduce(
    (acc, meal) => ({
      calories: acc.calories + (meal.total_calories || 0),
      protein: acc.protein + (meal.total_protein || 0),
      carbs: acc.carbs + (meal.total_carbs || 0),
      fat: acc.fat + (meal.total_fat || 0)
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  // Agrupar refeições por tipo (apenas as do plano + outras registradas)
  const registeredMealTypes = [...new Set(meals.map(m => m.meal_type))];
  const displayMealTypes = [...new Set([...planMealTypes, ...registeredMealTypes])];

  const mealsByType = displayMealTypes.reduce((acc, type) => {
    acc[type] = meals.filter((meal) => meal.meal_type === type);
    return acc;
  }, {});

  // Navegação de datas
  const goToPreviousDay = () => {
    setSelectedDate(prev => subDays(prev, 1));
  };

  const goToNextDay = () => {
    setSelectedDate(prev => addDays(prev, 1));
  };

  const goToToday = () => {
    setSelectedDate(new Date());
  };

  // Formatar label da data
  const getDateLabel = (date) => {
    if (isToday(date)) {
      return 'HOJE';
    } else if (isYesterday(date)) {
      return 'ONTEM';
    } else if (isTomorrow(date)) {
      return 'AMANHÃ';
    } else {
      // Formato: "12 de Janeiro"
      return format(date, "dd 'de' MMMM", { locale: ptBR });
    }
  };

  const getDateSubtitle = (date) => {
    // Sempre mostra a data completa como subtítulo
    return format(date, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  };

  const handleDeleteMeal = async () => {
    if (!mealToDelete) return;

    // Buscar dados COMPLETOS da refeição antes de deletar (para auditoria)
    const meal = meals.find(m => m.id === mealToDelete);

    // =====================================================
    // SOFT DELETE: Marca como deletada ao invés de remover
    // =====================================================
    // IMPORTANTE: Soft delete permite auditoria completa
    // O nutricionista poderá ver o histórico completo de ações
    const { error } = await supabase
      .from('meals')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', mealToDelete);

    if (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível excluir a refeição.',
        variant: 'destructive'
      });
    } else {
      // =====================================================
      // AUDITORIA: Registrar ação de DELETE com TODOS os detalhes
      // =====================================================
      // IMPORTANTE PARA MÓDULO FUTURO:
      // Este log será usado no Hub do Paciente para:
      // - Feed de atividades do paciente
      // - Timeline de ações no módulo "Diário do Paciente"
      // - Histórico de alterações com diff de dados (mostrar exatamente o que foi deletado)
      // - Notificações para o nutricionista
      // - Detectar tentativas de manipulação (deletar e recriar com dados diferentes)
      if (meal) {
        await supabase.rpc('log_meal_action', {
          p_patient_id: user.id,
          p_meal_id: mealToDelete,
          p_action: 'delete',
          p_meal_type: meal.meal_type,
          p_meal_date: meal.meal_date,
          p_meal_time: meal.meal_time,
          p_details: {
            total_calories: meal.total_calories,
            total_protein: meal.total_protein,
            total_carbs: meal.total_carbs,
            total_fat: meal.total_fat,
            // Salvar TODOS os alimentos que foram deletados
            items: (meal.meal_items || []).map(item => ({
              food_id: item.food_id,
              name: item.name,
              quantity: item.quantity,
              unit: item.unit,
              calories: item.calories,
              protein: item.protein,
              carbs: item.carbs,
              fat: item.fat
            })),
            deleted_at: new Date().toISOString()
          }
        });
      }

      toast({
        title: 'Sucesso',
        description: 'Refeição excluída com sucesso.'
      });
      loadMeals();
    }
    setMealToDelete(null);
  };

  const handleAddMeal = (mealType) => {
    // Buscar dados da refeição do plano (se existir)
    const planMeal = mealPlan?.meal_plan_meals?.find(m => m.meal_type === mealType);

    navigate('/patient/add-meal', {
      state: {
        mealType,
        mealTime: planMeal?.meal_time || format(new Date(), 'HH:mm'),
        mealName: planMeal?.name || '',
        recommendedFoods: planMeal?.meal_plan_foods || []
      }
    });
    setModalOpen(false);
  };

  // Calculate current progress for daily summary
  const currentProgress = {
    calories: dailyTotals.calories,
    protein: dailyTotals.protein,
    carbs: dailyTotals.carbs,
    fat: dailyTotals.fat
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <div className="max-w-7xl mx-auto w-full px-4 md:px-8 py-6 space-y-6">
        {/* Header */}
        <div className="mb-2 flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Plano Alimentar</h1>
            <p className="text-muted-foreground mt-1">
              Acompanhe seu progresso diário
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowNotifications(true)}
            className="relative -mt-1"
          >
            <Bell className="w-6 h-6 text-gray-700" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
            )}
          </Button>
        </div>

        {/* Daily Summary - Sticky/Prominent at Top */}
        {prescriptionGoal && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm pb-4"
          >
            <DailyAdherenceCard
              goal={prescriptionGoal}
              current={currentProgress}
            />
          </motion.div>
        )}

        {/* Tabs: Plan and History */}
        <Tabs value={activeView} onValueChange={setActiveView} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="plan">
              <Utensils className="w-4 h-4 mr-2" />
              O Plano
            </TabsTrigger>
            <TabsTrigger value="history">
              <CalendarDays className="w-4 h-4 mr-2" />
              Histórico
            </TabsTrigger>
          </TabsList>

          {/* Tab: The Plan */}
          <TabsContent value="plan" className="space-y-4">
            {/* Date Navigation - Simplified */}
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-primary">
                      {getDateLabel(selectedDate)}
                    </h2>
                    <p className="text-sm text-muted-foreground capitalize">
                      {getDateSubtitle(selectedDate)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={goToPreviousDay}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" size="icon">
                          <CalendarDays className="h-4 w-4" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="end">
                        <Calendar
                          mode="single"
                          selected={selectedDate}
                          onSelect={(date) => date && setSelectedDate(date)}
                          initialFocus
                          locale={ptBR}
                        />
                      </PopoverContent>
                    </Popover>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={goToNextDay}
                      disabled={isSameDay(selectedDate, new Date())}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Meal Plan Cards - Clean List */}
            {mealPlan?.meal_plan_meals && mealPlan.meal_plan_meals.length > 0 ? (
              <div className="space-y-4">
                {mealPlan.meal_plan_meals
                  .sort((a, b) => {
                    // Sort by meal_time if available
                    if (a.meal_time && b.meal_time) {
                      return a.meal_time.localeCompare(b.meal_time);
                    }
                    return 0;
                  })
                  .map((planMeal, index) => {
                    const registeredMeal = meals.find(m => m.meal_type === planMeal.meal_type);
                    const isRegistered = !!registeredMeal;

                    return (
                      <motion.div
                        key={planMeal.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <Card className="shadow-sm hover:shadow-md transition-shadow">
                          <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${isRegistered ? 'bg-green-100 text-green-700' : 'bg-primary/10 text-primary'}`}>
                                  {isRegistered ? (
                                    <CheckCircle2 className="w-5 h-5" />
                                  ) : (
                                    <Utensils className="w-5 h-5" />
                                  )}
                                </div>
                                <div>
                                  <CardTitle className="text-lg">
                                    {planMeal.name || translateMealType(planMeal.meal_type)}
                                  </CardTitle>
                                  {planMeal.meal_time && (
                                    <CardDescription className="flex items-center gap-1 mt-1">
                                      <Clock className="w-3 h-3" />
                                      {planMeal.meal_time}
                                    </CardDescription>
                                  )}
                                </div>
                              </div>
                              <Button
                                size="sm"
                                onClick={() => handleAddMeal(planMeal.meal_type)}
                                className={isRegistered ? 'bg-green-600 hover:bg-green-700' : ''}
                              >
                                {isRegistered ? (
                                  <>
                                    <CheckCircle2 className="w-4 h-4 mr-2" />
                                    Ver Registro
                                  </>
                                ) : (
                                  <>
                                    <Plus className="w-4 h-4 mr-2" />
                                    Registrar
                                  </>
                                )}
                              </Button>
                            </div>
                          </CardHeader>
                          <CardContent>
                            {/* Planned Foods - Read-only */}
                            {planMeal.meal_plan_foods && planMeal.meal_plan_foods.length > 0 ? (
                              <div className="space-y-2">
                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                                  Alimentos Planejados
                                </p>
                                {planMeal.meal_plan_foods.map((food, idx) => (
                                  <div
                                    key={idx}
                                    className="flex items-center justify-between p-2 bg-muted/50 rounded-lg text-sm"
                                  >
                                    <span className="text-foreground">
                                      {food.foods?.name || 'Alimento'}
                                    </span>
                                    <span className="text-muted-foreground text-xs">
                                      {formatQuantityWithUnit(food.quantity, food.unit, food.measure)}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-sm text-muted-foreground text-center py-4">
                                Nenhum alimento planejado para esta refeição
                              </p>
                            )}

                            {/* Show registered meal info if exists */}
                            {isRegistered && registeredMeal && (
                              <div className="mt-4 pt-4 border-t">
                                <p className="text-xs font-semibold text-green-700 uppercase tracking-wide mb-2">
                                  Registrado
                                </p>
                                <div className="flex items-center gap-2 text-sm">
                                  <span className="font-medium text-green-700">
                                    {Math.round(registeredMeal.total_calories)} kcal
                                  </span>
                                  <span className="text-muted-foreground">
                                    • P: {Math.round(registeredMeal.total_protein)}g
                                    • C: {Math.round(registeredMeal.total_carbs)}g
                                    • G: {Math.round(registeredMeal.total_fat)}g
                                  </span>
                                </div>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })}
              </div>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <Utensils className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
                  <p className="text-sm text-muted-foreground">
                    Nenhum plano alimentar ativo no momento.
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Entre em contato com seu nutricionista.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Tab: History */}
          <TabsContent value="history" className="space-y-4">
            {/* Date Navigation */}
            <Card>
              <CardContent className="pt-6 space-y-3">
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-primary">
                    {getDateLabel(selectedDate)}
                  </h2>
                  <p className="text-sm text-muted-foreground capitalize">
                    {getDateSubtitle(selectedDate)}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={goToPreviousDay}
                    className="flex-shrink-0"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>

                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="flex-1 justify-center"
                      >
                        <CalendarDays className="mr-2 h-4 w-4" />
                        Selecionar Data
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="center">
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={(date) => date && setSelectedDate(date)}
                        initialFocus
                        locale={ptBR}
                      />
                    </PopoverContent>
                  </Popover>

                  <Button
                    variant="outline"
                    size="icon"
                    onClick={goToNextDay}
                    className="flex-shrink-0"
                    disabled={isSameDay(selectedDate, new Date())}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>

                {!isToday(selectedDate) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={goToToday}
                    className="w-full text-primary"
                  >
                    Ir para Hoje
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Registered Meals History */}
            <div className="space-y-4">
              {displayMealTypes.map((mealType, index) => {
                const mealsOfType = mealsByType[mealType] || [];
                const hasMeals = mealsOfType.length > 0;

                if (!hasMeals) return null;

                return (
                  <motion.div
                    key={mealType}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card>
                      <CardHeader className="pb-3">
                        <div className="flex items-center gap-2">
                          <Utensils className="w-5 h-5 text-primary" />
                          <CardTitle className="text-base">{translateMealType(mealType)}</CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {mealsOfType.map((meal) => (
                            <div
                              key={meal.id}
                              className="border rounded-lg p-3 bg-background"
                            >
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex-1">
                                  <p className="text-sm font-medium">
                                    {meal.total_calories?.toFixed(0)} kcal
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    P: {meal.total_protein?.toFixed(1)}g | C:{' '}
                                    {meal.total_carbs?.toFixed(1)}g | G:{' '}
                                    {meal.total_fat?.toFixed(1)}g
                                  </p>
                                </div>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => setMealToDelete(meal.id)}
                                  className="text-destructive hover:text-destructive"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>

                              {meal.meal_items?.length > 0 && (
                                <div className="space-y-1 mt-2 pl-2 border-l-2 border-primary/20">
                                  {meal.meal_items.map((item, idx) => (
                                    <div
                                      key={idx}
                                      className="flex justify-between text-xs"
                                    >
                                      <span className="text-muted-foreground">
                                        {item.foods?.name || 'Alimento desconhecido'}
                                      </span>
                                      <span className="font-medium">
                                        {item.quantity} {item.measure}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              )}

                              <Button
                                size="sm"
                                variant="ghost"
                                className="w-full mt-2"
                                onClick={() => navigate('/patient/add-meal', {
                                  state: {
                                    editMode: true,
                                    mealId: meal.id
                                  }
                                })}
                              >
                                Editar refeição
                              </Button>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}

              {meals.length === 0 && (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Utensils className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
                    <p className="text-sm text-muted-foreground">
                      Nenhuma refeição registrada neste dia
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>

      </div>

      {/* Dialog: Ver Plano Alimentar Completo */}
      <MealPlanViewDialog
        open={planDialogOpen}
        onOpenChange={setPlanDialogOpen}
        mealPlan={mealPlan}
        patientName={user?.profile?.name}
      />

      {/* Painel de Notificações */}
      <NotificationsPanel isOpen={showNotifications} setIsOpen={setShowNotifications} />

      {/* AlertDialog de Confirmação de Exclusão */}
      <AlertDialog open={!!mealToDelete} onOpenChange={() => setMealToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Refeição</AlertDialogTitle>
            <AlertDialogDescription>
              Deseja realmente excluir esta refeição? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteMeal} className="bg-destructive hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      )}
    </div>
  );
}
