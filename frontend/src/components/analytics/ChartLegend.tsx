interface LegendItem {
  label: string;
  color: string;
}

interface Props {
  items: LegendItem[];
  className?: string;
}

export const ChartLegend = ({ items, className = '' }: Props) => (
  <div className={`flex flex-wrap gap-4 text-xs text-muted-foreground mb-2 ${className}`}>
    {items.map((item) => (
      <span key={item.label} className="flex items-center gap-1.5">
        <span
          className="inline-block w-2.5 h-2.5 rounded-sm"
          style={{ background: item.color }}
        />
        {item.label}
      </span>
    ))}
  </div>
);
