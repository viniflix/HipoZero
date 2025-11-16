import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UtensilsCrossed } from 'lucide-react';

/**
 * MealPlanView - Visualização do plano alimentar
 *
 * Estrutura esperada:
 * meal_plan_meals: [
 *   {
 *     id, name, meal_type, meal_time,
 *     meal_plan_foods: [
 *       { quantity, unit, foods: { name } }
 *     ]
 *   }
 * ]
 */
const MealPlanView = ({ mealPlanItems }) => {
  // mealPlanItems agora é meal_plan_meals
  console.log('MealPlanView received:', mealPlanItems); // Debug

  if (!mealPlanItems || mealPlanItems.length === 0) {
    return (
      <div className="text-center py-10">
        <UtensilsCrossed className="mx-auto h-12 w-12 text-muted-foreground" />
        <p className="mt-4 text-muted-foreground">Nenhuma refeição foi adicionada a este plano alimentar.</p>
      </div>
    );
  }

  const mealOrder = ['cafe_da_manha', 'lanche_da_manha', 'almoco', 'lanche_da_tarde', 'jantar', 'ceia'];
  const mealTypeLabels = {
    'cafe_da_manha': 'Café da Manhã',
    'lanche_da_manha': 'Lanche da Manhã',
    'almoco': 'Almoço',
    'lanche_da_tarde': 'Lanche da Tarde',
    'jantar': 'Jantar',
    'ceia': 'Ceia'
  };

  // Agrupar por tipo de refeição
  const mealsByType = mealPlanItems.reduce((acc, meal) => {
    const mealType = meal.meal_type;
    if (!acc[mealType]) {
      acc[mealType] = [];
    }
    acc[mealType].push(meal);
    return acc;
  }, {});

  // Ordenar pelos tipos conhecidos
  const sortedMealTypes = Object.keys(mealsByType).sort(
    (a, b) => mealOrder.indexOf(a) - mealOrder.indexOf(b)
  );

  return (
    <div className="space-y-4">
      {sortedMealTypes.map((mealType) => (
        <div key={mealType} className="border-l-4 border-primary/30 pl-4 py-2">
          <h4 className="font-semibold text-lg mb-3 text-foreground">
            {mealTypeLabels[mealType] || mealType}
          </h4>

          {mealsByType[mealType].map((meal) => (
            <div key={meal.id} className="mb-4">
              {meal.name && (
                <p className="text-sm text-muted-foreground mb-2 italic">{meal.name}</p>
              )}

              {meal.meal_plan_foods && meal.meal_plan_foods.length > 0 ? (
                <ul className="space-y-1.5">
                  {meal.meal_plan_foods.map((foodItem, index) => (
                    <li key={index} className="flex justify-between items-center text-sm">
                      <span className="text-foreground">
                        {foodItem.foods?.name || 'Alimento sem nome'}
                      </span>
                      <span className="font-medium text-primary">
                        {foodItem.quantity} {foodItem.unit}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-muted-foreground italic">Nenhum alimento cadastrado</p>
              )}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

export default MealPlanView;