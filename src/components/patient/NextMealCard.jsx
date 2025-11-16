import React, { useMemo } from 'react';
import { Clock, UtensilsCrossed, CheckCircle2 } from 'lucide-react';
import { translateMealType, translateUnit } from '@/utils/mealTranslations';
import { format, parse } from 'date-fns';

/**
 * NextMealCard - Exibe a próxima refeição baseada no horário atual
 *
 * Lógica:
 * - Calcula qual refeição está mais próxima do horário atual
 * - Se já registrou no diário, mostra a próxima
 * - Exibe horário da refeição
 */
const NextMealCard = ({ mealPlanMeals, registeredMeals = [] }) => {
  const nextMeal = useMemo(() => {
    if (!mealPlanMeals || mealPlanMeals.length === 0) return null;

    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    // Ordenar refeições por horário
    const mealsWithTime = mealPlanMeals
      .filter(meal => meal.meal_time) // Apenas refeições com horário definido
      .map(meal => {
        // Parse do horário (formato: "HH:mm:ss" ou "HH:mm")
        const timeParts = meal.meal_time.split(':');
        const mealMinutes = parseInt(timeParts[0]) * 60 + parseInt(timeParts[1]);

        return {
          ...meal,
          mealMinutes,
          timeStr: `${timeParts[0]}:${timeParts[1]}`
        };
      })
      .sort((a, b) => a.mealMinutes - b.mealMinutes);

    if (mealsWithTime.length === 0) return null;

    // Verificar quais refeições já foram registradas hoje
    const registeredTypes = new Set(registeredMeals.map(m => m.meal_type));

    // Encontrar a próxima refeição
    let selectedMeal = null;
    let alreadyRegistered = false;

    // Primeiro, tentar encontrar a refeição mais próxima
    for (let i = 0; i < mealsWithTime.length; i++) {
      const meal = mealsWithTime[i];
      const nextMeal = mealsWithTime[i + 1];

      // Se a refeição já foi registrada, pular
      if (registeredTypes.has(meal.meal_type)) {
        continue;
      }

      // Se ainda não passou do horário da refeição
      if (meal.mealMinutes > currentMinutes) {
        selectedMeal = meal;
        break;
      }

      // Se já passou do horário, calcular qual está mais perto
      if (nextMeal) {
        const timeSinceMeal = currentMinutes - meal.mealMinutes;
        const timeUntilNext = nextMeal.mealMinutes - currentMinutes;

        if (timeSinceMeal <= timeUntilNext) {
          selectedMeal = meal;
          break;
        }
      } else {
        // Última refeição do dia
        selectedMeal = meal;
        break;
      }
    }

    // Se não encontrou nenhuma não registrada, pegar a primeira não registrada
    if (!selectedMeal) {
      selectedMeal = mealsWithTime.find(m => !registeredTypes.has(m.meal_type));
    }

    // Se todas foram registradas, pegar a primeira de amanhã
    if (!selectedMeal) {
      selectedMeal = mealsWithTime[0];
      alreadyRegistered = true;
    }

    // Verificar se a refeição selecionada já foi registrada
    if (selectedMeal && registeredTypes.has(selectedMeal.meal_type)) {
      alreadyRegistered = true;
      // Pegar a próxima não registrada
      const currentIndex = mealsWithTime.findIndex(m => m.id === selectedMeal.id);
      for (let i = currentIndex + 1; i < mealsWithTime.length; i++) {
        if (!registeredTypes.has(mealsWithTime[i].meal_type)) {
          selectedMeal = mealsWithTime[i];
          alreadyRegistered = false;
          break;
        }
      }
      // Se não encontrou, pegar a primeira de amanhã
      if (alreadyRegistered && currentIndex < mealsWithTime.length - 1) {
        selectedMeal = mealsWithTime[0];
      }
    }

    return { meal: selectedMeal, alreadyRegistered };
  }, [mealPlanMeals, registeredMeals]);

  if (!nextMeal || !nextMeal.meal) {
    return (
      <div className="text-center py-8">
        <UtensilsCrossed className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
        <p className="text-sm text-muted-foreground">
          Nenhuma refeição com horário definido.
        </p>
      </div>
    );
  }

  const { meal, alreadyRegistered } = nextMeal;
  const previousMeal = useMemo(() => {
    if (!alreadyRegistered) return null;
    const registeredTypes = new Set(registeredMeals.map(m => m.meal_type));
    // Encontrar qual refeição foi registrada
    const registered = mealPlanMeals
      .filter(m => m.meal_time)
      .find(m => registeredTypes.has(m.meal_type));
    return registered;
  }, [alreadyRegistered, mealPlanMeals, registeredMeals]);

  return (
    <div className="space-y-3">
      {/* Header com status */}
      {alreadyRegistered && previousMeal && (
        <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
          <CheckCircle2 className="w-5 h-5 text-green-600" />
          <p className="text-sm text-green-800">
            Você já registrou seu <strong>{translateMealType(previousMeal.meal_type)}</strong>
          </p>
        </div>
      )}

      {/* Próxima refeição */}
      <div className="border-l-4 border-primary pl-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-semibold text-lg text-foreground">
            {translateMealType(meal.meal_type)}
          </h4>
          <div className="flex items-center gap-1 text-primary">
            <Clock className="w-4 h-4" />
            <span className="text-sm font-medium">{meal.timeStr}</span>
          </div>
        </div>

        {meal.name && (
          <p className="text-sm text-muted-foreground mb-3 italic">{meal.name}</p>
        )}

        {meal.meal_plan_foods && meal.meal_plan_foods.length > 0 ? (
          <ul className="space-y-2">
            {meal.meal_plan_foods.map((foodItem, index) => (
              <li key={index} className="flex justify-between items-center text-sm">
                <span className="text-foreground">
                  • {foodItem.foods?.name || 'Alimento sem nome'}
                </span>
                <span className="font-medium text-primary">
                  {foodItem.quantity} {translateUnit(foodItem.unit)}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-muted-foreground italic">Nenhum alimento cadastrado</p>
        )}
      </div>

      {/* Info adicional */}
      <p className="text-xs text-muted-foreground text-center pt-2">
        {alreadyRegistered ? 'Sua próxima refeição será:' : 'Próxima refeição'}
      </p>
    </div>
  );
};

export default NextMealCard;
