import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, Flame, Beef, Wheat, Droplet } from 'lucide-react';

/**
 * DailyAdherenceCard - Card de Progresso de Macros Diário
 * Mostra o progresso do paciente em relação às metas diárias definidas pelo nutricionista
 *
 * @param {Object} goal - Metas de macros (calories, protein, carbs, fat)
 * @param {Object} current - Progresso atual (calories, protein, carbs, fat)
 */
export default function DailyAdherenceCard({ goal, current }) {
  // Se não houver metas ou progresso, não renderiza nada
  if (!goal || !current) {
    return null;
  }

  /**
   * Calcula a porcentagem de progresso
   * @param {number} currentValue - Valor atual consumido
   * @param {number} goalValue - Meta a ser atingida
   * @returns {number} - Porcentagem (0-100)
   */
  const calculatePercentage = (currentValue, goalValue) => {
    if (!goalValue || goalValue === 0) return 0;
    const percentage = (currentValue / goalValue) * 100;
    return Math.min(Math.round(percentage), 100); // Limita a 100%
  };

  /**
   * Determina a cor da barra de progresso baseada na porcentagem
   * @param {number} percentage - Porcentagem de progresso
   * @returns {string} - Classe CSS de cor
   */
  const getProgressColor = (percentage) => {
    if (percentage >= 90) return 'bg-primary'; // Verde (meta quase atingida)
    if (percentage >= 50) return 'bg-yellow-500'; // Amarelo (em progresso)
    return 'bg-orange-500'; // Laranja (ainda falta)
  };

  // Configuração de cada macro
  const macros = [
    {
      key: 'calories',
      label: 'Calorias',
      icon: Flame,
      iconColor: 'text-orange-600',
      unit: 'kcal',
      current: current.calories,
      goal: goal.calories
    },
    {
      key: 'protein',
      label: 'Proteínas',
      icon: Beef,
      iconColor: 'text-red-600',
      unit: 'g',
      current: current.protein,
      goal: goal.protein
    },
    {
      key: 'carbs',
      label: 'Carboidratos',
      icon: Wheat,
      iconColor: 'text-amber-600',
      unit: 'g',
      current: current.carbs,
      goal: goal.carbs
    },
    {
      key: 'fat',
      label: 'Gorduras',
      icon: Droplet,
      iconColor: 'text-yellow-600',
      unit: 'g',
      current: current.fat,
      goal: goal.fat
    }
  ];

  // Calcular progresso geral (baseado em calorias)
  const overallPercentage = calculatePercentage(current.calories, goal.calories);

  return (
    <Card className="shadow-card-dark rounded-xl bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            <CardTitle className="text-lg font-semibold text-primary">
              Progresso Diário
            </CardTitle>
          </div>
          <div className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
            {overallPercentage}% do dia
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {macros.map((macro) => {
          const Icon = macro.icon;
          const percentage = calculatePercentage(macro.current, macro.goal);
          const progressColor = getProgressColor(percentage);

          return (
            <div key={macro.key} className="space-y-2">
              {/* Header: Ícone, Label e Valores */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon className={`w-4 h-4 ${macro.iconColor}`} />
                  <span className="text-sm font-medium text-foreground">
                    {macro.label}
                  </span>
                </div>
                <span className="text-sm font-semibold text-foreground">
                  <span className={percentage >= 90 ? 'text-primary' : 'text-muted-foreground'}>
                    {Math.round(macro.current)}
                  </span>
                  <span className="text-muted-foreground text-xs">
                    {' / '}
                    {Math.round(macro.goal)} {macro.unit}
                  </span>
                </span>
              </div>

              {/* Barra de Progresso */}
              <div className="relative">
                <Progress
                  value={percentage}
                  className="h-2"
                  indicatorClassName={progressColor}
                />
                {/* Indicador de porcentagem (opcional, se quiser mostrar) */}
                {percentage > 0 && (
                  <span className="absolute right-0 -top-5 text-xs text-muted-foreground">
                    {percentage}%
                  </span>
                )}
              </div>
            </div>
          );
        })}

        {/* Mensagem motivacional */}
        <div className="mt-4 pt-4 border-t border-primary/20">
          {overallPercentage >= 90 ? (
            <p className="text-sm text-primary font-medium text-center">
              🎉 Parabéns! Você está quase lá!
            </p>
          ) : overallPercentage >= 50 ? (
            <p className="text-sm text-muted-foreground text-center">
              Continue assim! Você já está na metade do caminho.
            </p>
          ) : (
            <p className="text-sm text-muted-foreground text-center">
              Comece registrando suas refeições para acompanhar seu progresso.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
