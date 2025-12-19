import { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

/**
 * CompositionCharts - Gráfico de Composição Corporal
 * 
 * Visualiza a evolução de Peso, Massa Magra e Massa Gorda ao longo do tempo
 * @param {array} data - Array de registros antropométricos com results calculados
 */
export default function CompositionCharts({ data = [] }) {
  // Processar dados para o gráfico
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];

    return data
      .filter(record => record.weight && record.record_date)
      .map(record => {
        const date = new Date(record.record_date);
        const weight = parseFloat(record.weight) || 0;
        
        // Extrair resultados calculados (se existirem)
        const results = record.results || {};
        const bodyFatPercent = results.body_fat_percent || null;
        const leanMass = results.lean_mass_kg || null;
        const fatMass = results.fat_mass_kg || null;

        // Se não houver resultados calculados, tentar calcular a partir de bioimpedância
        let calculatedLeanMass = leanMass;
        let calculatedFatMass = fatMass;
        
        if (!leanMass && bodyFatPercent) {
          calculatedFatMass = (weight * bodyFatPercent) / 100;
          calculatedLeanMass = weight - calculatedFatMass;
        } else if (!leanMass && record.bioimpedance?.percent_gordura) {
          const bfPercent = parseFloat(record.bioimpedance.percent_gordura);
          calculatedFatMass = (weight * bfPercent) / 100;
          calculatedLeanMass = weight - calculatedFatMass;
        }

        return {
          date: format(date, 'dd/MM/yyyy', { locale: ptBR }),
          dateValue: date,
          weight: weight.toFixed(1),
          leanMass: calculatedLeanMass ? calculatedLeanMass.toFixed(1) : null,
          fatMass: calculatedFatMass ? calculatedFatMass.toFixed(1) : null
        };
      })
      .sort((a, b) => a.dateValue - b.dateValue); // Ordenar por data
  }, [data]);

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Composição Corporal</CardTitle>
          <CardDescription>
            Evolução de peso, massa magra e massa gorda
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[300px] text-muted-foreground">
            <p>Nenhum dado disponível para exibir</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Verificar se temos dados de composição
  const hasCompositionData = chartData.some(d => d.leanMass !== null || d.fatMass !== null);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Composição Corporal</CardTitle>
        <CardDescription>
          Evolução de peso, massa magra e massa gorda ao longo do tempo
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="date"
              className="text-xs"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis
              className="text-xs"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
              label={{ value: 'Peso (kg)', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--popover))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px'
              }}
              formatter={(value, name) => {
                if (value === null || value === 'null') return ['N/A', name];
                return [`${value} kg`, name];
              }}
            />
            <Legend
              formatter={(value) => {
                const labels = {
                  weight: 'Peso Total',
                  leanMass: 'Massa Magra',
                  fatMass: 'Massa Gorda'
                };
                return labels[value] || value;
              }}
            />
            <Line
              type="monotone"
              dataKey="weight"
              stroke="#ffffff"
              strokeWidth={2}
              dot={{ fill: '#ffffff', r: 4 }}
              name="weight"
            />
            {hasCompositionData && (
              <>
                <Line
                  type="monotone"
                  dataKey="leanMass"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={{ fill: '#10b981', r: 4 }}
                  strokeDasharray="5 5"
                  name="leanMass"
                />
                <Line
                  type="monotone"
                  dataKey="fatMass"
                  stroke="#ef4444"
                  strokeWidth={2}
                  dot={{ fill: '#ef4444', r: 4 }}
                  strokeDasharray="5 5"
                  name="fatMass"
                />
              </>
            )}
          </LineChart>
        </ResponsiveContainer>
        {!hasCompositionData && (
          <div className="mt-4 text-center text-sm text-muted-foreground">
            <p>Preencha dados de composição corporal (dobras cutâneas ou bioimpedância) para visualizar massa magra e massa gorda.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

