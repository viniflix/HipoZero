import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, Flame, Beef, Wheat, Droplet } from 'lucide-react';

/**
 * CircularProgress - Gráfico circular de progresso (donut chart)
 */
const CircularProgress = ({ percentage, size = 160, strokeWidth = 12 }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  // Cor baseada na porcentagem
  const getColor = () => {
    if (percentage >= 90) return '#22c55e'; // Verde
    if (percentage >= 50) return '#eab308'; // Amarelo
    return '#f97316'; // Laranja
  };

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Círculo de fundo */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          className="text-muted/20"
        />
        {/* Círculo de progresso */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={getColor()}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-500 ease-out"
        />
      </svg>
      {/* Texto no centro */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold text-foreground">
          {Math.round(percentage)}%
        </span>
        <span className="text-xs text-muted-foreground mt-1">do dia</span>
      </div>
    </div>
  );
};

/**
 * MacroMiniCard - Mini card para cada macro (Proteínas, Carboidratos, Gorduras)
 */
const MacroMiniCard = ({ icon: Icon, label, current, goal, unit, color }) => {
  const percentage = goal > 0 ? Math.min(Math.round((current / goal) * 100), 100) : 0;

  const getProgressColor = () => {
    if (percentage >= 90) return 'bg-green-500';
    if (percentage >= 50) return 'bg-yellow-500';
    return 'bg-orange-500';
  };

  return (
    <Card className="border-2 border-muted/30 hover:border-primary/30 transition-colors">
      <CardContent className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-lg ${color}`}>
              <Icon className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-medium text-muted-foreground">{label}</span>
          </div>
          <span className="text-xs text-muted-foreground font-semibold">
            {percentage}%
          </span>
        </div>

        {/* Valores */}
        <div className="space-y-1">
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold text-foreground">
              {Math.round(current)}
            </span>
            <span className="text-sm text-muted-foreground">
              / {Math.round(goal)} {unit}
            </span>
          </div>

          {/* Mini barra de progresso */}
          <Progress
            value={percentage}
            className="h-1.5"
            indicatorClassName={getProgressColor()}
          />
        </div>
      </CardContent>
    </Card>
  );
};

/**
 * DailyAdherenceCard - Card de Progresso de Macros Diário
 * Layout: Calorias em destaque (com gráfico) + 3 mini cards para outros macros
 */
export default function DailyAdherenceCard({ goal, current }) {
  // Se não houver metas ou progresso, não renderiza nada
  if (!goal || !current) {
    return null;
  }

  // Cálculo de porcentagem de calorias (macro principal)
  const caloriesPercentage = goal.calories > 0
    ? Math.min(Math.round((current.calories / goal.calories) * 100), 100)
    : 0;

  // Mensagem motivacional baseada no progresso
  const getMotivationalMessage = () => {
    if (caloriesPercentage >= 90) {
      return {
        icon: '🎉',
        text: 'Parabéns! Você está quase lá!',
        color: 'text-green-600'
      };
    } else if (caloriesPercentage >= 50) {
      return {
        icon: '💪',
        text: 'Continue assim! Você já está na metade do caminho.',
        color: 'text-yellow-600'
      };
    } else if (caloriesPercentage > 0) {
      return {
        icon: '🚀',
        text: 'Ótimo começo! Continue registrando suas refeições.',
        color: 'text-orange-600'
      };
    } else {
      return {
        icon: '📝',
        text: 'Comece registrando suas refeições para acompanhar seu progresso.',
        color: 'text-muted-foreground'
      };
    }
  };

  const motivation = getMotivationalMessage();

  return (
    <Card className="shadow-card-dark rounded-xl border-primary/20 bg-gradient-to-br from-primary/5 via-background to-primary/5">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            <CardTitle className="text-lg font-semibold text-primary">
              Progresso Diário
            </CardTitle>
          </div>
          <div className="px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-semibold">
            {caloriesPercentage}% completo
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* SEÇÃO DE CALORIAS (Destaque) */}
        <Card className="border-2 border-primary/30 bg-gradient-to-br from-orange-50/50 to-amber-50/50 dark:from-orange-950/20 dark:to-amber-950/20">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              {/* Gráfico Circular */}
              <div className="flex-shrink-0">
                <CircularProgress percentage={caloriesPercentage} size={160} strokeWidth={14} />
              </div>

              {/* Informações de Calorias */}
              <div className="flex-1 space-y-4 text-center md:text-left">
                <div className="flex items-center gap-3 justify-center md:justify-start">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-orange-500 to-red-500">
                    <Flame className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                      Calorias
                    </h3>
                    <p className="text-3xl font-bold text-foreground">
                      {Math.round(current.calories)}
                      <span className="text-lg text-muted-foreground font-normal">
                        {' '}/ {Math.round(goal.calories)} kcal
                      </span>
                    </p>
                  </div>
                </div>

                {/* Mensagem motivacional */}
                <div className={`flex items-center gap-2 justify-center md:justify-start ${motivation.color}`}>
                  <span className="text-lg">{motivation.icon}</span>
                  <p className="text-sm font-medium">{motivation.text}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* GRID DE MACROS SECUNDÁRIOS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Proteínas */}
          <MacroMiniCard
            icon={Beef}
            label="Proteínas"
            current={current.protein}
            goal={goal.protein}
            unit="g"
            color="bg-gradient-to-br from-red-500 to-red-600"
          />

          {/* Carboidratos */}
          <MacroMiniCard
            icon={Wheat}
            label="Carboidratos"
            current={current.carbs}
            goal={goal.carbs}
            unit="g"
            color="bg-gradient-to-br from-amber-500 to-amber-600"
          />

          {/* Gorduras */}
          <MacroMiniCard
            icon={Droplet}
            label="Gorduras"
            current={current.fat}
            goal={goal.fat}
            unit="g"
            color="bg-gradient-to-br from-yellow-500 to-yellow-600"
          />
        </div>
      </CardContent>
    </Card>
  );
}
