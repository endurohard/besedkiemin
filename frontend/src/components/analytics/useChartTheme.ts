import { useThemeStore } from '@/store/themeStore';

/**
 * Палитра для recharts. Фиксированные токены Figma — не пересчитываются
 * при смене темы, чтобы семантика цветов (этап / склад / доставка) оставалась
 * одинаковой. Меняются только оси/сетка/tooltip под светлую/тёмную.
 */
export const useChartTheme = () => {
  const { mode } = useThemeStore();
  const isDark = mode === 'dark';

  return {
    axis: isDark ? '#a0a0a0' : '#6b7280',
    grid: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(17, 24, 39, 0.06)',
    tooltipBg: isDark ? '#1c1d27' : '#ffffff',
    tooltipBorder: isDark ? '#2b2b36' : '#e5e7eb',
    tooltipText: isDark ? '#f2f2f2' : '#111827',

    // Семантика серий
    primary: '#a9dfd8',  // бирюза — нейтральный / основной
    accent: '#20aef3',   // синий — вторичный / информация
    warning: '#feb95a',  // янтарный — внимание / затор
    danger: '#f2786a',   // коралловый — брак / ошибки
    success: '#7cc576',  // зелёный — завершено
    purple: '#a88eff',   // фиолетовый — производство
    muted: isDark ? '#4a4b5b' : '#d1d5db',
  };
};

export type ChartTheme = ReturnType<typeof useChartTheme>;
