import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
} from 'recharts';
import { useChartTheme } from './useChartTheme';

interface Props {
  data: Record<string, number>;
  labelFormatter: (stageCode: string) => string;
  /** Если задан — этот этап подсвечивается как финальный (зелёным). */
  finalStage?: string;
  height?: number;
}

/**
 * Воронка этапов производства — горизонтальный бар с количеством изделий
 * на каждом этапе. Этап с максимальным количеством подсвечивается янтарным
 * (сигнал затора), финальный этап — зелёным.
 */
export const StageFunnelChart = ({
  data,
  labelFormatter,
  finalStage = 'COMPLETED',
  height = 320,
}: Props) => {
  const theme = useChartTheme();

  const entries = Object.entries(data)
    .filter(([, v]) => v > 0)
    .map(([stage, count]) => ({ stage, label: labelFormatter(stage), count }));

  if (entries.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-8">
        Нет данных по этапам
      </p>
    );
  }

  const maxCount = Math.max(...entries.map((e) => e.count));

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
          allowDecimals={false}
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
          formatter={(value: number) => [`${value} шт`, 'Количество']}
          labelFormatter={(l) => String(l)}
        />
        <Bar dataKey="count" radius={[0, 6, 6, 0]} barSize={20}>
          {entries.map((e) => {
            let color = theme.primary;
            if (e.stage === finalStage) color = theme.success;
            else if (e.count === maxCount && entries.length > 1) color = theme.warning;
            return <Cell key={e.stage} fill={color} />;
          })}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
};
