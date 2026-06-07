import { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';

interface Props {
  label: string;
  value: string | number;
  hint?: string;
  icon?: LucideIcon;
  tone?: 'default' | 'success' | 'warning' | 'danger' | 'accent';
}

/**
 * KPI-карточка нового образца: label → value → hint, опциональная иконка,
 * цветовой тон для акцентных показателей. Заменяет разнобой из старых Card
 * с `text-3xl font-bold` внутри AnalyticsPage.
 */
export const KpiCard = ({ label, value, hint, icon: Icon, tone = 'default' }: Props) => {
  const toneClass: Record<NonNullable<Props['tone']>, string> = {
    default: 'text-foreground',
    success: 'text-green-600',
    warning: 'text-yellow-600',
    danger: 'text-red-600',
    accent: 'text-primary',
  };

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            {label}
          </p>
          {Icon && <Icon size={16} className="text-muted-foreground shrink-0" />}
        </div>
        <p className={`text-3xl font-bold mt-2 ${toneClass[tone]}`}>{value}</p>
        {hint && <p className="text-xs text-muted-foreground mt-1">{hint}</p>}
      </CardContent>
    </Card>
  );
};
