import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { CompletedCycle } from '@/types';
import { useChartTheme } from './useChartTheme';
import { ChartLegend } from './ChartLegend';

interface Props {
  cycles: CompletedCycle[];
  durationFormatter: (hours: number) => string;
  /** Сколько последних заказов показать. По умолчанию 10. */
  limit?: number;
  height?: number;
}

/**
 * Разбивка полного цикла доставленных заказов на производство / склад / доставка.
 * Stacked горизонтальный бар — длина = полный цикл, сегменты видно пропорционально.
 * Сразу видно, какой заказ медленный и из-за какого этапа.
 */
export const CycleBreakdownChart = ({
  cycles,
  durationFormatter,
  limit = 10,
  height,
}: Props) => {
  const theme = useChartTheme();

  if (!cycles || cycles.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-8">
        Нет доставленных заказов за период
      </p>
    );
  }

  // Берём последние N заказов и реверсим, чтобы свежие были сверху диаграммы
  const chartData = cycles
    .slice(0, limit)
    .map((c) => ({
      label: `${c.orderNumber} · ${c.customerName}`,
      Производство: Number(c.durations.productionHours.toFixed(1)),
      Склад: Number(c.durations.warehouseHours.toFixed(1)),
      Доставка: Number(c.durations.deliveryHours.toFixed(1)),
    }))
    .reverse();

  const chartHeight = height ?? Math.max(220, chartData.length * 36 + 60);

  return (
    <>
      <ChartLegend
        items={[
          { label: 'Производство', color: theme.purple },
          { label: 'Склад', color: theme.warning },
          { label: 'Доставка', color: theme.accent },
        ]}
      />
      <ResponsiveContainer width="100%" height={chartHeight}>
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
            tickFormatter={(v: number) => `${v} ч`}
          />
          <YAxis
            type="category"
            dataKey="label"
            stroke={theme.axis}
            tick={{ fontSize: 11, fill: theme.axis }}
            width={180}
          />
          <Tooltip
            contentStyle={{
              background: theme.tooltipBg,
              border: `1px solid ${theme.tooltipBorder}`,
              borderRadius: 6,
              color: theme.tooltipText,
            }}
            cursor={{ fill: theme.grid }}
            formatter={(value: number, name: string) => [
              durationFormatter(value),
              name,
            ]}
          />
          <Bar
            dataKey="Производство"
            stackId="c"
            fill={theme.purple}
            barSize={18}
          />
          <Bar
            dataKey="Склад"
            stackId="c"
            fill={theme.warning}
            barSize={18}
          />
          <Bar
            dataKey="Доставка"
            stackId="c"
            fill={theme.accent}
            radius={[0, 4, 4, 0]}
            barSize={18}
          />
        </BarChart>
      </ResponsiveContainer>
    </>
  );
};
