import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { useChartTheme } from './useChartTheme';

interface Props {
  data: Record<string, number>;
  labelFormatter: (stageCode: string) => string;
  durationFormatter: (hours: number) => string;
  height?: number;
}

/**
 * Среднее время по этапам — горизонтальный бар в часах.
 * Используется вместе с StageFunnelChart: один показывает количество,
 * второй — время. Вместе видно «где затор И где долго».
 */
export const StagesDurationChart = ({
  data,
  labelFormatter,
  durationFormatter,
  height = 320,
}: Props) => {
  const theme = useChartTheme();

  const entries = Object.entries(data)
    .filter(([, v]) => v > 0)
    .map(([stage, hours]) => ({
      stage,
      label: labelFormatter(stage),
      hours: Number(hours.toFixed(1)),
    }));

  if (entries.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-8">
        Недостаточно данных для расчёта времени по этапам
      </p>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        data={entries}
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
          formatter={(value: number) => [durationFormatter(value), 'Среднее время']}
          labelFormatter={(l) => String(l)}
        />
        <Bar
          dataKey="hours"
          fill={theme.purple}
          radius={[0, 6, 6, 0]}
          barSize={20}
        />
      </BarChart>
    </ResponsiveContainer>
  );
};
