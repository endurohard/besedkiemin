import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { ProductTypeStats } from '@/types';
import { useChartTheme } from './useChartTheme';
import { ChartLegend } from './ChartLegend';

interface Props {
  data: ProductTypeStats[];
  height?: number;
}

/**
 * Stacked-бар по типам продуктов: завершено / в производстве / брак.
 * Длина бара = всего по типу, сегменты показывают структуру.
 */
export const ProductTypeStackedChart = ({ data, height = 320 }: Props) => {
  const theme = useChartTheme();

  if (!data || data.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-8">
        Нет данных по типам продуктов
      </p>
    );
  }

  // Сортируем по убыванию общего количества — самые большие типы наверху
  const chartData = [...data]
    .sort((a, b) => b.total - a.total)
    .map((d) => ({
      type: d.type,
      Завершено: d.completed,
      'В производстве': d.inProduction,
      Брак: d.rejected,
    }));

  return (
    <>
      <ChartLegend
        items={[
          { label: 'Завершено', color: theme.success },
          { label: 'В производстве', color: theme.primary },
          { label: 'Брак', color: theme.danger },
        ]}
      />
      <ResponsiveContainer width="100%" height={height}>
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 8, right: 32, bottom: 8, left: 8 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke={theme.grid} horizontal={false} />
          <XAxis
            type="number"
            stroke={theme.axis}
            tick={{ fontSize: 12, fill: theme.axis }}
            allowDecimals={false}
          />
          <YAxis
            type="category"
            dataKey="type"
            stroke={theme.axis}
            tick={{ fontSize: 12, fill: theme.axis }}
            width={140}
          />
          <Tooltip
            contentStyle={{
              background: theme.tooltipBg,
              border: `1px solid ${theme.tooltipBorder}`,
              borderRadius: 6,
              color: theme.tooltipText,
            }}
            cursor={{ fill: theme.grid }}
            formatter={(value: number, name: string) => [`${value} шт`, name]}
          />
          <Bar
            dataKey="Завершено"
            stackId="a"
            fill={theme.success}
            radius={[0, 0, 0, 0]}
            barSize={22}
          />
          <Bar
            dataKey="В производстве"
            stackId="a"
            fill={theme.primary}
            radius={[0, 0, 0, 0]}
            barSize={22}
          />
          <Bar
            dataKey="Брак"
            stackId="a"
            fill={theme.danger}
            radius={[0, 6, 6, 0]}
            barSize={22}
          />
        </BarChart>
      </ResponsiveContainer>
    </>
  );
};
