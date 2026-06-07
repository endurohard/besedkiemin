import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { useChartTheme } from './useChartTheme';

interface Props {
  approved: number;
  rejected: number;
  pending: number;
  approvalRate: string;
  height?: number;
}

/**
 * Donut-диаграмма по QC: одобрено / отклонено / на проверке.
 * В центре показывает % одобрения крупным числом.
 */
export const QualityDonutChart = ({
  approved,
  rejected,
  pending,
  approvalRate,
  height = 200,
}: Props) => {
  const theme = useChartTheme();
  const total = approved + rejected + pending;

  if (total === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-8">
        Нет проверок качества
      </p>
    );
  }

  const data = [
    { name: 'Одобрено', value: approved, color: theme.success },
    { name: 'Отклонено', value: rejected, color: theme.danger },
    { name: 'На проверке', value: pending, color: theme.warning },
  ].filter((d) => d.value > 0);

  return (
    <div className="relative" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius="62%"
            outerRadius="90%"
            paddingAngle={2}
            stroke="none"
          >
            {data.map((entry) => (
              <Cell key={entry.name} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              background: theme.tooltipBg,
              border: `1px solid ${theme.tooltipBorder}`,
              borderRadius: 6,
              color: theme.tooltipText,
            }}
            formatter={(value: number, name: string) => [`${value} шт`, name]}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span className="text-3xl font-bold text-foreground">{approvalRate}%</span>
        <span className="text-xs text-muted-foreground">одобрено</span>
      </div>
    </div>
  );
};
