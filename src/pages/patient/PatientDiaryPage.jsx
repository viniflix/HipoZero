import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarDays, Plus, Utensils, Trash2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/hooks/use-toast';

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
  const [loading, setLoading] = useState(true);

  const mealTypes = [
    'Café da Manhã',
    'Lanche da Manhã',
    'Almoço',
    'Lanche da Tarde',
    'Jantar',
    'Ceia'
  ];

  const loadMeals = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    const dateStr = format(selectedDate, 'yyyy-MM-dd');

    // Buscar refeições do dia com itens e alimentos
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

  // Agrupar refeições por tipo
  const mealsByType = mealTypes.reduce((acc, type) => {
    acc[type] = meals.filter((meal) => meal.meal_type === type);
    return acc;
  }, {});

  const handleDeleteMeal = async (mealId) => {
    if (!confirm('Deseja realmente excluir esta refeição?')) return;

    const { error } = await supabase.from('meals').delete().eq('id', mealId);

    if (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível excluir a refeição.',
        variant: 'destructive'
      });
    } else {
      toast({
        title: 'Sucesso',
        description: 'Refeição excluída com sucesso.'
      });
      loadMeals();
    }
  };

  const handleAddFood = (mealType) => {
    // Criar nova refeição ou editar existente
    const existingMeal = mealsByType[mealType]?.[0];
    if (existingMeal) {
      navigate(`/patient/add-food/${existingMeal.id}`);
    } else {
      navigate('/patient/add-food', {
        state: {
          mealType,
          mealDate: format(selectedDate, 'yyyy-MM-dd')
        }
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-patient-secondary/5 to-white">
      {/* Header fixo */}
      <div className="bg-gradient-to-r from-patient-secondary to-patient-secondary/80 text-white sticky top-0 z-10 shadow-md">
        <div className="px-4 py-4">
          <h1 className="text-2xl font-bold">Diário Alimentar</h1>
          <p className="text-sm text-white/90 mt-1">
            Registre suas refeições do dia
          </p>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Seletor de Data */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card>
            <CardContent className="pt-6">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarDays className="mr-2 h-4 w-4" />
                    {format(selectedDate, "EEEE, dd 'de' MMMM", { locale: ptBR })}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => date && setSelectedDate(date)}
                    initialFocus
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>
            </CardContent>
          </Card>
        </motion.div>

        {/* Resumo de Macros */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Resumo do Dia</CardTitle>
              <CardDescription>Total de nutrientes consumidos</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-primary/5 rounded-lg">
                  <p className="text-2xl font-bold text-primary">
                    {Math.round(dailyTotals.calories)}
                  </p>
                  <p className="text-xs text-muted-foreground">Calorias</p>
                </div>
                <div className="text-center p-3 bg-primary/5 rounded-lg">
                  <p className="text-2xl font-bold text-primary">
                    {Math.round(dailyTotals.protein)}g
                  </p>
                  <p className="text-xs text-muted-foreground">Proteínas</p>
                </div>
                <div className="text-center p-3 bg-primary/5 rounded-lg">
                  <p className="text-2xl font-bold text-primary">
                    {Math.round(dailyTotals.carbs)}g
                  </p>
                  <p className="text-xs text-muted-foreground">Carboidratos</p>
                </div>
                <div className="text-center p-3 bg-primary/5 rounded-lg">
                  <p className="text-2xl font-bold text-primary">
                    {Math.round(dailyTotals.fat)}g
                  </p>
                  <p className="text-xs text-muted-foreground">Gorduras</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Lista de Refeições por Tipo */}
        <div className="space-y-4">
          {mealTypes.map((mealType, index) => {
            const mealsOfType = mealsByType[mealType] || [];
            const hasMeals = mealsOfType.length > 0;

            return (
              <motion.div
                key={mealType}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + index * 0.05 }}
              >
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Utensils className="w-5 h-5 text-primary" />
                        <CardTitle className="text-base">{mealType}</CardTitle>
                      </div>
                      <Button
                        size="sm"
                        className={hasMeals ? '' : 'bg-patient-secondary hover:bg-patient-secondary/90'}
                        variant={hasMeals ? 'outline' : 'default'}
                        onClick={() => handleAddFood(mealType)}
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        {hasMeals ? 'Adicionar mais' : 'Adicionar'}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {hasMeals ? (
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
                                onClick={() => handleDeleteMeal(meal.id)}
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>

                            {/* Lista de alimentos */}
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
                              onClick={() => navigate(`/patient/add-food/${meal.id}`)}
                            >
                              Editar refeição
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        Nenhum alimento registrado
                      </p>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Espaço para a Bottom Navigation */}
        <div className="h-4"></div>
      </div>

      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      )}
    </div>
  );
}
