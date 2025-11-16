import { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { ArrowLeft, Plus, Trash2, Search, Clock, MessageSquare, Save, X } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/hooks/use-toast';
import { translateMealType } from '@/utils/mealTranslations';
import { formatQuantityWithUnit } from '@/lib/utils/measureTranslations';
import { calculateNutrition } from '@/lib/supabase/meal-plan-queries';
import CascadeMeasureSelector from '@/components/meal-plan/CascadeMeasureSelector';

/**
 * AddMealPage - Nova página reformulada de registro de refeição
 *
 * Mostra alimentos recomendados do plano
 * Permite adicionar outros alimentos
 * Suporta medidas diretas e caseiras
 */
export default function AddMealPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  // Dados vindos da navegação
  const {
    mealType: initialMealType,
    mealTime,
    mealName,
    recommendedFoods = [],
    editMode = false,
    mealId = null
  } = location.state || {};

  // Estado da refeição
  const [mealType, setMealType] = useState(initialMealType);
  const [mealDateTime, setMealDateTime] = useState(mealTime || format(new Date(), 'HH:mm'));
  const [notes, setNotes] = useState('');
  const [addedFoods, setAddedFoods] = useState([]);
  const [loading, setLoading] = useState(false);

  // Estado de busca de alimentos
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  // Estado de medidas
  const [measureType, setMeasureType] = useState('direct'); // 'direct' ou 'household'
  const [householdMeasures, setHouseholdMeasures] = useState([]);

  // Estado de submit
  const [saving, setSaving] = useState(false);

  // Carregar medidas caseiras
  useEffect(() => {
    loadHouseholdMeasures();
  }, []);

  // Carregar dados da refeição existente se estiver em modo de edição
  useEffect(() => {
    if (editMode && mealId) {
      loadExistingMeal();
    }
  }, [editMode, mealId]);

  const loadHouseholdMeasures = async () => {
    const { data } = await supabase
      .from('household_measures')
      .select('*')
      .order('name');

    setHouseholdMeasures(data || []);
  };

  const loadExistingMeal = async () => {
    setLoading(true);
    try {
      // Buscar dados da refeição
      const { data: mealData, error: mealError } = await supabase
        .from('meals')
        .select('*')
        .eq('id', mealId)
        .single();

      if (mealError) throw mealError;

      // Buscar itens da refeição
      const { data: itemsData, error: itemsError } = await supabase
        .from('meal_items')
        .select('*')
        .eq('meal_id', mealId);

      if (itemsError) throw itemsError;

      // Preencher estados com dados existentes
      setMealType(mealData.meal_type);
      setMealDateTime(mealData.meal_time || format(new Date(), 'HH:mm'));
      setNotes(mealData.notes || '');

      // Buscar dados completos de cada alimento
      const foodsWithData = await Promise.all(
        itemsData.map(async (item, index) => {
          // Buscar dados originais do alimento
          const { data: foodData } = await supabase
            .from('foods')
            .select('*')
            .eq('id', item.food_id)
            .single();

          return {
            id: item.id || Date.now() + index,
            food_id: item.food_id,
            food_name: item.name,
            quantity: item.quantity,
            unit: item.unit || 'g', // Carregar unidade salva ou usar 'g' como fallback
            measure_type: 'direct',
            // Usar base_* do alimento original (per 100g)
            base_calories: foodData?.calories || 0,
            base_protein: foodData?.protein || 0,
            base_carbs: foodData?.carbs || 0,
            base_fat: foodData?.fat || 0,
            // Manter valores calculados que foram salvos
            calories: item.calories,
            protein: item.protein,
            carbs: item.carbs,
            fat: item.fat
          };
        })
      );

      setAddedFoods(foodsWithData);
    } catch (error) {
      console.error('Erro ao carregar refeição:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os dados da refeição',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  // Buscar alimentos
  const handleSearchFoods = useCallback(async () => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    const { data } = await supabase
      .from('foods')
      .select('*')
      .ilike('name', `%${searchTerm}%`)
      .limit(10);

    setSearchResults(data || []);
    setSearching(false);
  }, [searchTerm]);

  useEffect(() => {
    const timeoutId = setTimeout(handleSearchFoods, 300);
    return () => clearTimeout(timeoutId);
  }, [searchTerm, handleSearchFoods]);

  // Adicionar alimento recomendado
  const handleAddRecommended = async (recommendedFood) => {
    // Buscar dados completos do alimento
    const { data: foodData } = await supabase
      .from('foods')
      .select('*')
      .eq('id', recommendedFood.foods.id)
      .single();

    if (!foodData) {
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os dados do alimento',
        variant: 'destructive'
      });
      return;
    }

    const qty = parseFloat(recommendedFood.quantity) || 100;

    // Normalizar unidade para os valores aceitos pelo Select
    let unit = recommendedFood.unit || 'g';
    const unitLower = unit.toLowerCase().trim();

    // Mapear variações para valores padronizados
    if (unitLower.includes('gram') || unitLower === 'g') {
      unit = 'g';
    } else if (unitLower.includes('ml') || unitLower.includes('mililitr')) {
      unit = 'ml';
    } else if (unitLower.includes('unid')) {
      unit = 'unit';
    }

    // Calcular nutrientes baseado na quantidade e unidade do plano
    let multiplier;
    if (unit === 'unit') {
      multiplier = qty; // Para unidades, multiplicar diretamente
    } else {
      multiplier = qty / 100; // Para g/ml, base é per 100g
    }

    const newFood = {
      id: Date.now(),
      food_id: foodData.id,
      food_name: foodData.name,
      quantity: qty,
      unit: unit,
      measure_type: 'direct',
      // Valores base (per 100g da tabela foods)
      base_calories: foodData.calories || 0,
      base_protein: foodData.protein || 0,
      base_carbs: foodData.carbs || 0,
      base_fat: foodData.fat || 0,
      // Valores calculados para a quantidade recomendada
      calories: (foodData.calories || 0) * multiplier,
      protein: (foodData.protein || 0) * multiplier,
      carbs: (foodData.carbs || 0) * multiplier,
      fat: (foodData.fat || 0) * multiplier
    };
    setAddedFoods(prev => [...prev, newFood]);
  };

  // Adicionar alimento da busca
  const handleAddFood = async (food) => {
    // Buscar nutrientes completos do alimento
    const { data: foodData } = await supabase
      .from('foods')
      .select('*')
      .eq('id', food.id)
      .single();

    if (!foodData) {
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os dados do alimento',
        variant: 'destructive'
      });
      return;
    }

    // Calcular nutrientes para 100g (base)
    const baseQuantity = 100;
    const newFood = {
      id: Date.now(),
      food_id: foodData.id,
      food_name: foodData.name,
      quantity: baseQuantity,
      unit: 'g',
      measure_type: 'direct',
      // Nutrientes já vêm na base de 100g na tabela foods
      base_calories: foodData.calories || 0,
      base_protein: foodData.protein || 0,
      base_carbs: foodData.carbs || 0,
      base_fat: foodData.fat || 0,
      // Calculados para a quantidade
      calories: foodData.calories || 0,
      protein: foodData.protein || 0,
      carbs: foodData.carbs || 0,
      fat: foodData.fat || 0
    };
    setAddedFoods(prev => [...prev, newFood]);
    setSearchTerm('');
    setSearchResults([]);
  };

  // Atualizar quantidade/unidade
  const handleUpdateFood = (id, field, value) => {
    setAddedFoods(prev => prev.map(food => {
      if (food.id === id) {
        const updated = { ...food, [field]: value };

        // Recalcular nutrientes se mudou quantidade ou unidade
        const shouldRecalculate =
          (field === 'quantity' && value) ||
          (field === 'unit' && food.quantity);

        if (shouldRecalculate && food.base_calories !== undefined) {
          const currentQuantity = field === 'quantity' ? parseFloat(value) : parseFloat(food.quantity);
          const currentUnit = field === 'unit' ? value : food.unit;

          let multiplier;

          // Calcular multiplicador baseado na unidade
          if (currentUnit === 'unit') {
            // Para unidades, assumir que base é per unidade
            // Então 1 unidade = 1x os valores base
            multiplier = currentQuantity;
          } else {
            // Para g e ml, assumir que base é per 100g/ml
            multiplier = currentQuantity / 100;
          }

          updated.calories = food.base_calories * multiplier;
          updated.protein = food.base_protein * multiplier;
          updated.carbs = food.base_carbs * multiplier;
          updated.fat = food.base_fat * multiplier;
        }

        return updated;
      }
      return food;
    }));
  };

  // Remover alimento
  const handleRemoveFood = (id) => {
    setAddedFoods(prev => prev.filter(food => food.id !== id));
  };

  // Calcular totais
  const totals = addedFoods.reduce((acc, food) => ({
    calories: acc.calories + (parseFloat(food.calories) || 0),
    protein: acc.protein + (parseFloat(food.protein) || 0),
    carbs: acc.carbs + (parseFloat(food.carbs) || 0),
    fat: acc.fat + (parseFloat(food.fat) || 0)
  }), { calories: 0, protein: 0, carbs: 0, fat: 0 });

  // Salvar refeição
  const handleSave = async () => {
    if (addedFoods.length === 0) {
      toast({
        title: 'Erro',
        description: 'Adicione pelo menos um alimento',
        variant: 'destructive'
      });
      return;
    }

    setSaving(true);

    try {
      const today = format(new Date(), 'yyyy-MM-dd');

      if (editMode && mealId) {
        // MODO DE EDIÇÃO - Atualizar refeição existente

        // Atualizar dados da refeição
        const { error: mealError } = await supabase
          .from('meals')
          .update({
            meal_type: mealType,
            meal_time: mealDateTime,
            notes: notes,
            total_calories: totals.calories,
            total_protein: totals.protein,
            total_carbs: totals.carbs,
            total_fat: totals.fat
          })
          .eq('id', mealId);

        if (mealError) throw mealError;

        // Deletar itens antigos
        const { error: deleteError } = await supabase
          .from('meal_items')
          .delete()
          .eq('meal_id', mealId);

        if (deleteError) throw deleteError;

        // Inserir novos itens
        const mealItems = addedFoods.map(food => ({
          meal_id: mealId,
          food_id: food.food_id,
          name: food.food_name,
          quantity: parseFloat(food.quantity) || 0,
          unit: food.unit || 'g',
          calories: parseFloat(food.calories) || 0,
          protein: parseFloat(food.protein) || 0,
          carbs: parseFloat(food.carbs) || 0,
          fat: parseFloat(food.fat) || 0
        }));

        const { error: itemsError } = await supabase
          .from('meal_items')
          .insert(mealItems);

        if (itemsError) throw itemsError;

        toast({
          title: 'Sucesso!',
          description: 'Refeição atualizada com sucesso'
        });
      } else {
        // MODO DE CRIAÇÃO - Criar nova refeição

        const { data: meal, error: mealError } = await supabase
          .from('meals')
          .insert({
            patient_id: user.id,
            meal_type: mealType,
            meal_date: today,
            meal_time: mealDateTime,
            notes: notes,
            total_calories: totals.calories,
            total_protein: totals.protein,
            total_carbs: totals.carbs,
            total_fat: totals.fat
          })
          .select()
          .single();

        if (mealError) throw mealError;

        // Adicionar itens da refeição
        const mealItems = addedFoods.map(food => ({
          meal_id: meal.id,
          food_id: food.food_id,
          name: food.food_name,
          quantity: parseFloat(food.quantity) || 0,
          unit: food.unit || 'g',
          calories: parseFloat(food.calories) || 0,
          protein: parseFloat(food.protein) || 0,
          carbs: parseFloat(food.carbs) || 0,
          fat: parseFloat(food.fat) || 0
        }));

        const { error: itemsError } = await supabase
          .from('meal_items')
          .insert(mealItems);

        if (itemsError) throw itemsError;

        toast({
          title: 'Sucesso!',
          description: 'Refeição registrada com sucesso'
        });
      }

      navigate('/patient/diario');
    } catch (error) {
      console.error('Erro ao salvar:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível salvar a refeição',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  // Loading state para modo de edição
  if (editMode && loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-muted-foreground">Carregando dados da refeição...</p>
        </div>
      </div>
    );
  }

  // Validação de mealType
  if (!mealType && !editMode) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Tipo de refeição não especificado</p>
          <Button onClick={() => navigate('/patient/diario')}>
            Voltar ao Diário
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <div className="max-w-7xl mx-auto w-full px-4 md:px-8 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/patient/diario')}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              {editMode ? 'Editar' : 'Registrar'} {translateMealType(mealType)}
            </h1>
            <p className="text-muted-foreground mt-1">
              {editMode ? 'Atualize os alimentos da refeição' : 'Adicione os alimentos consumidos'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Coluna principal */}
          <div className="lg:col-span-2 space-y-6">
            {/* Alimentos Recomendados */}
            {recommendedFoods && recommendedFoods.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Alimentos Recomendados</CardTitle>
                  <CardDescription>
                    Seu nutricionista sugeriu estes alimentos
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {recommendedFoods.map((food, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg"
                    >
                      <div>
                        <p className="font-medium text-sm">{food.foods?.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {food.quantity} {translateUnit(food.unit)}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleAddRecommended(food)}
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Adicionar
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Buscar e Adicionar Alimentos */}
            <Card>
              <CardHeader>
                <CardTitle>Adicionar Alimentos</CardTitle>
                <CardDescription>
                  Busque e adicione outros alimentos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Campo de busca */}
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar alimento..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>

                  {/* Resultados da busca */}
                  {searchResults.length > 0 && (
                    <div className="border rounded-lg divide-y max-h-64 overflow-y-auto">
                      {searchResults.map(food => (
                        <div
                          key={food.id}
                          className="p-3 hover:bg-accent cursor-pointer flex items-center justify-between"
                          onClick={() => handleAddFood(food)}
                        >
                          <span className="text-sm">{food.name}</span>
                          <Plus className="w-4 h-4 text-primary" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Alimentos Adicionados */}
            <Card>
              <CardHeader>
                <CardTitle>Alimentos Adicionados</CardTitle>
                <CardDescription>
                  Configure as quantidades
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {addedFoods.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    Nenhum alimento adicionado ainda
                  </p>
                ) : (
                  addedFoods.map(food => (
                    <div key={food.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="font-medium">{food.food_name}</p>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveFood(food.id)}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>

                      {/* Tipo de medida */}
                      <RadioGroup
                        value={food.measure_type || 'direct'}
                        onValueChange={(value) => handleUpdateFood(food.id, 'measure_type', value)}
                      >
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="direct" id={`direct-${food.id}`} />
                            <Label htmlFor={`direct-${food.id}`}>Medida Direta</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="household" id={`household-${food.id}`} />
                            <Label htmlFor={`household-${food.id}`}>Medida Caseira</Label>
                          </div>
                        </div>
                      </RadioGroup>

                      {/* Inputs de quantidade */}
                      {food.measure_type === 'direct' ? (
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label>Quantidade</Label>
                            <Input
                              type="number"
                              value={food.quantity}
                              onChange={(e) => handleUpdateFood(food.id, 'quantity', e.target.value)}
                              step="0.1"
                            />
                          </div>
                          <div>
                            <Label>Unidade</Label>
                            <Select
                              value={food.unit || 'g'}
                              onValueChange={(value) => handleUpdateFood(food.id, 'unit', value)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione..." />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="g">Gramas (g)</SelectItem>
                                <SelectItem value="ml">Mililitros (ml)</SelectItem>
                                <SelectItem value="unit">Unidades</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label>Medida</Label>
                            <Select
                              value={food.unit}
                              onValueChange={(value) => handleUpdateFood(food.id, 'unit', value)}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {householdMeasures.map(measure => (
                                  <SelectItem key={measure.id} value={measure.name}>
                                    {measure.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label>Quantidade</Label>
                            <Input
                              type="number"
                              value={food.quantity}
                              onChange={(e) => handleUpdateFood(food.id, 'quantity', e.target.value)}
                              step="0.1"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          {/* Coluna lateral - Resumo */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle className="text-lg">Resumo da Refeição</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Horário */}
                <div>
                  <Label className="flex items-center gap-2 mb-2">
                    <Clock className="w-4 h-4" />
                    Horário
                  </Label>
                  <Input
                    type="time"
                    value={mealDateTime}
                    onChange={(e) => setMealDateTime(e.target.value)}
                  />
                </div>

                {/* Observações */}
                <div>
                  <Label className="flex items-center gap-2 mb-2">
                    <MessageSquare className="w-4 h-4" />
                    Observações
                  </Label>
                  <Textarea
                    placeholder="Adicione comentários sobre esta refeição..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                  />
                </div>

                {/* Totais Nutricionais */}
                <div className="space-y-2 pt-4 border-t">
                  <h4 className="font-semibold text-sm">Totais Nutricionais</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="text-center p-3 bg-primary/5 rounded-lg">
                      <p className="text-2xl font-bold text-primary">
                        {Math.round(totals.calories)}
                      </p>
                      <p className="text-xs text-muted-foreground">Calorias</p>
                    </div>
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <p className="text-lg font-bold text-blue-600">
                        {Math.round(totals.protein)}g
                      </p>
                      <p className="text-xs text-muted-foreground">Proteínas</p>
                    </div>
                    <div className="text-center p-3 bg-orange-50 rounded-lg">
                      <p className="text-lg font-bold text-orange-600">
                        {Math.round(totals.carbs)}g
                      </p>
                      <p className="text-xs text-muted-foreground">Carboidratos</p>
                    </div>
                    <div className="text-center p-3 bg-amber-50 rounded-lg">
                      <p className="text-lg font-bold text-amber-600">
                        {Math.round(totals.fat)}g
                      </p>
                      <p className="text-xs text-muted-foreground">Gorduras</p>
                    </div>
                  </div>
                </div>

                {/* Botão Salvar */}
                <Button
                  className="w-full"
                  onClick={handleSave}
                  disabled={saving || addedFoods.length === 0}
                >
                  {saving ? (
                    <>{editMode ? 'Atualizando...' : 'Salvando...'}</>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      {editMode ? 'Atualizar Refeição' : 'Salvar Refeição'}
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
