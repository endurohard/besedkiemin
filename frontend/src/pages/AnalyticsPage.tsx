import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { analyticsApi } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { ProductionStage } from '@/types';
import {
  BarChart3,
  Users,
  CheckCircle2,
  Package,
  TrendingUp,
  Clock,
  Zap,
  Timer,
  FileText,
  ChevronDown,
  ChevronRight,
  Activity,
  Truck,
  Factory,
} from 'lucide-react';
import {
  KpiCard,
  StageFunnelChart,
  StagesDurationChart,
  ProductTypeStackedChart,
  CycleBreakdownChart,
  QualityDonutChart,
} from '@/components/analytics';

type PeriodPreset = '7d' | '30d' | '90d' | '365d' | 'custom';

const PRESET_LABELS: Record<PeriodPreset, string> = {
  '7d': '7 дней',
  '30d': '30 дней',
  '90d': 'Квартал',
  '365d': 'Год',
  custom: 'Свой период',
};

const PRESET_DAYS: Record<Exclude<PeriodPreset, 'custom'>, number> = {
  '7d': 7,
  '30d': 30,
  '90d': 90,
  '365d': 365,
};

const toISODate = (d: Date) => d.toISOString().slice(0, 10);

const computePresetRange = (
  preset: Exclude<PeriodPreset, 'custom'>,
): { startDate: string; endDate: string } => {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - PRESET_DAYS[preset]);
  return { startDate: toISODate(start), endDate: toISODate(end) };
};

export const AnalyticsPage = () => {
  const [preset, setPreset] = useState<PeriodPreset>('30d');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  const range =
    preset === 'custom'
      ? { startDate: customStart, endDate: customEnd }
      : computePresetRange(preset);

  const startDate = range.startDate;
  const endDate = range.endDate;

  // Получение всех аналитических данных
  const { data: productionOverview } = useQuery({
    queryKey: ['analytics', 'production-overview'],
    queryFn: analyticsApi.getProductionOverview,
  });

  const { data: userPerformance = [] } = useQuery({
    queryKey: ['analytics', 'user-performance'],
    queryFn: analyticsApi.getUserPerformance,
  });

  const { data: qualityStats } = useQuery({
    queryKey: ['analytics', 'quality-stats'],
    queryFn: analyticsApi.getQualityStats,
  });

  const { data: productTypeStats = [] } = useQuery({
    queryKey: ['analytics', 'product-type-stats'],
    queryFn: analyticsApi.getProductTypeStats,
  });

  const { data: performanceSummary } = useQuery({
    queryKey: ['analytics', 'performance-summary', startDate, endDate],
    queryFn: () => analyticsApi.getPerformanceSummary({ startDate, endDate }),
  });

  const { data: fullCycleAnalytics } = useQuery({
    queryKey: ['analytics', 'full-cycle', startDate, endDate],
    queryFn: () => analyticsApi.getFullCycleAnalytics({ startDate, endDate }),
  });

  const { data: orderReport = [] } = useQuery({
    queryKey: ['analytics', 'order-production-report', startDate, endDate],
    queryFn: () => analyticsApi.getOrderProductionReport({ startDate, endDate }),
  });

  const { data: managerReport = [] } = useQuery({
    queryKey: ['analytics', 'manager-report', startDate, endDate],
    queryFn: () => analyticsApi.getManagerReport({ startDate, endDate }),
  });

  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());
  const toggleOrder = (id: string) => {
    setExpandedOrders((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const getStageLabel = (stage: ProductionStage | string): string => {
    const labels: Record<string, string> = {
      [ProductionStage.PENDING]: 'Ожидание',
      [ProductionStage.DESIGN]: 'Проектирование',
      [ProductionStage.PREPARATION]: 'Заготовка',
      [ProductionStage.PAINTING]: 'Покраска',
      [ProductionStage.SEWING]: 'Пошив',
      [ProductionStage.ASSEMBLY]: 'Сборка',
      [ProductionStage.QUALITY_CHECK]: 'Проверка качества',
      [ProductionStage.COMPLETED]: 'Завершено',
      [ProductionStage.REJECTED]: 'Брак',
    };
    return labels[stage] || String(stage);
  };

  const formatDuration = (hours: number): string => {
    if (hours < 24) {
      return `${hours.toFixed(1)} ч`;
    }
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    if (remainingHours < 1) {
      return `${days} д`;
    }
    return `${days} д ${remainingHours.toFixed(0)} ч`;
  };

  const formatRange = () => {
    if (!startDate || !endDate) return 'все данные';
    const s = new Date(startDate).toLocaleDateString('ru-RU');
    const e = new Date(endDate).toLocaleDateString('ru-RU');
    return `${s} — ${e}`;
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Шапка страницы с фильтром периода */}
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Activity size={28} className="text-primary" />
            Аналитика производства
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Данные за период: <span className="font-medium">{formatRange()}</span>
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap gap-1 bg-muted/50 p-1 rounded-lg">
            {(Object.keys(PRESET_LABELS) as PeriodPreset[]).map((p) => (
              <button
                key={p}
                onClick={() => setPreset(p)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  preset === p
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {PRESET_LABELS[p]}
              </button>
            ))}
          </div>
          {preset === 'custom' && (
            <div className="flex gap-2">
              <Input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="text-xs"
              />
              <Input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="text-xs"
              />
            </div>
          )}
        </div>
      </div>

      {/* Главные KPI */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Всего заказов"
          value={productionOverview?.orders.total ?? 0}
          hint={`завершено ${productionOverview?.orders.completionRate ?? 0}%`}
          icon={BarChart3}
        />
        <KpiCard
          label="Активных заказов"
          value={productionOverview?.orders.active ?? 0}
          hint="в работе сейчас"
          icon={Factory}
          tone="accent"
        />
        <KpiCard
          label="Средний цикл"
          value={
            fullCycleAnalytics?.summary.avgFullCycleHours
              ? formatDuration(fullCycleAnalytics.summary.avgFullCycleHours)
              : '—'
          }
          hint="от заказа до доставки"
          icon={Timer}
        />
        <KpiCard
          label="% одобрения QC"
          value={`${qualityStats?.approvalRate ?? 0}%`}
          hint={`${qualityStats?.approved ?? 0} из ${qualityStats?.total ?? 0}`}
          icon={CheckCircle2}
          tone="success"
        />
      </div>

      {/* Этапы: воронка + время */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 size={18} className="text-primary" />
              Распределение изделий по этапам
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              сколько изделий сейчас на каждом этапе — видно, где затор
            </p>
          </CardHeader>
          <CardContent>
            <StageFunnelChart
              data={productionOverview?.stageDistribution || {}}
              labelFormatter={getStageLabel}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Clock size={18} className="text-primary" />
              Среднее время по этапам
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              сколько в среднем изделие проводит на каждом этапе
            </p>
          </CardHeader>
          <CardContent>
            <StagesDurationChart
              data={fullCycleAnalytics?.summary.avgStageHours || {}}
              labelFormatter={getStageLabel}
              durationFormatter={formatDuration}
            />
          </CardContent>
        </Card>
      </div>

      {/* Качество + типы продуктов */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <CheckCircle2 size={18} className="text-primary" />
              Контроль качества
            </CardTitle>
          </CardHeader>
          <CardContent>
            <QualityDonutChart
              approved={qualityStats?.approved ?? 0}
              rejected={qualityStats?.rejected ?? 0}
              pending={qualityStats?.pending ?? 0}
              approvalRate={qualityStats?.approvalRate ?? '0'}
            />
            <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t text-center">
              <div>
                <p className="text-lg font-bold text-green-600">
                  {qualityStats?.approved ?? 0}
                </p>
                <p className="text-xs text-muted-foreground">Одобрено</p>
              </div>
              <div>
                <p className="text-lg font-bold text-red-600">
                  {qualityStats?.rejected ?? 0}
                </p>
                <p className="text-xs text-muted-foreground">Отклонено</p>
              </div>
              <div>
                <p className="text-lg font-bold text-yellow-600">
                  {qualityStats?.pending ?? 0}
                </p>
                <p className="text-xs text-muted-foreground">На проверке</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Package size={18} className="text-primary" />
              Типы продуктов
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              структура по типам: завершено / в производстве / брак
            </p>
          </CardHeader>
          <CardContent>
            <ProductTypeStackedChart data={productTypeStats} />
          </CardContent>
        </Card>
      </div>

      {/* Последние браки — таблица */}
      {qualityStats && qualityStats.recentRejections.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Последние браки</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2 font-medium text-muted-foreground">
                      Продукт
                    </th>
                    <th className="text-left p-2 font-medium text-muted-foreground">
                      Заказ
                    </th>
                    <th className="text-left p-2 font-medium text-muted-foreground">
                      Клиент
                    </th>
                    <th className="text-left p-2 font-medium text-muted-foreground">
                      Причина
                    </th>
                    <th className="text-left p-2 font-medium text-muted-foreground">
                      Проверил
                    </th>
                    <th className="text-left p-2 font-medium text-muted-foreground">
                      Дата
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {qualityStats.recentRejections.map((rejection) => (
                    <tr key={rejection.id} className="border-b hover:bg-muted/50">
                      <td className="p-2">{rejection.productName}</td>
                      <td className="p-2">{rejection.orderNumber}</td>
                      <td className="p-2">{rejection.customerName}</td>
                      <td className="p-2">{rejection.reason || 'Не указана'}</td>
                      <td className="p-2">{rejection.checkedBy}</td>
                      <td className="p-2 text-muted-foreground">
                        {rejection.checkedAt
                          ? new Date(rejection.checkedAt).toLocaleDateString()
                          : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Отчёт по работе менеджеров */}
      <div>
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Users size={22} className="text-primary" />
          Работа менеджеров
        </h2>
        <Card>
          <CardContent className="p-0 overflow-x-auto">
            {managerReport.length === 0 ? (
              <p className="text-sm text-muted-foreground p-6 text-center">Нет данных за период</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs text-muted-foreground">
                    <th className="p-3 font-medium">Менеджер</th>
                    <th className="p-3 font-medium text-center">Всего</th>
                    <th className="p-3 font-medium text-center">В работе</th>
                    <th className="p-3 font-medium text-center">Выполнено</th>
                    <th className="p-3 font-medium text-center">Отменено</th>
                    <th className="p-3 font-medium text-right">Выручка (выполн.)</th>
                  </tr>
                </thead>
                <tbody>
                  {managerReport.map((m) => (
                    <tr key={m.managerId} className="border-b last:border-0 hover:bg-muted/40">
                      <td className="p-3">
                        <div className="font-medium">{m.managerName}</div>
                        {m.role && <div className="text-[11px] text-muted-foreground">{m.role}</div>}
                      </td>
                      <td className="p-3 text-center font-medium">{m.total}</td>
                      <td className="p-3 text-center">
                        <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-xs font-medium">{m.inWork}</span>
                      </td>
                      <td className="p-3 text-center">
                        <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-800 text-xs font-medium">{m.completed}</span>
                      </td>
                      <td className="p-3 text-center">
                        <span className="px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-xs font-medium">{m.cancelled}</span>
                      </td>
                      <td className="p-3 text-right font-medium">{m.revenue.toLocaleString('ru-RU')} ₽</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Полный цикл: KPI + разбивка по заказам */}
      <div>
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Zap size={22} className="text-primary" />
          Полный цикл: производство → склад → доставка
        </h2>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <KpiCard
            label="Полный цикл"
            value={
              fullCycleAnalytics?.summary.avgFullCycleHours
                ? formatDuration(fullCycleAnalytics.summary.avgFullCycleHours)
                : '—'
            }
            hint="от заказа до клиента"
            tone="accent"
          />
          <KpiCard
            label="Производство"
            value={
              fullCycleAnalytics?.summary.avgProductionHours
                ? formatDuration(fullCycleAnalytics.summary.avgProductionHours)
                : '—'
            }
            hint="все этапы производства"
            icon={Factory}
          />
          <KpiCard
            label="На складе"
            value={
              fullCycleAnalytics?.summary.avgWarehouseHours
                ? formatDuration(fullCycleAnalytics.summary.avgWarehouseHours)
                : '—'
            }
            hint="до отгрузки"
            icon={Package}
            tone="warning"
          />
          <KpiCard
            label="Доставка"
            value={
              fullCycleAnalytics?.summary.avgDeliveryHours
                ? formatDuration(fullCycleAnalytics.summary.avgDeliveryHours)
                : '—'
            }
            hint="до клиента"
            icon={Truck}
            tone="success"
          />
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Разбивка цикла по последним заказам
              {fullCycleAnalytics?.summary.totalDelivered
                ? ` (всего доставлено: ${fullCycleAnalytics.summary.totalDelivered})`
                : ''}
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              длина бара = полный цикл, сегменты показывают, где заказ провёл время
            </p>
          </CardHeader>
          <CardContent>
            {fullCycleAnalytics && fullCycleAnalytics.completedCycles.length > 0 ? (
              <CycleBreakdownChart
                cycles={fullCycleAnalytics.completedCycles}
                durationFormatter={formatDuration}
                limit={10}
              />
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                Нет доставленных заказов за период.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Заказы в работе — таблица */}
        {fullCycleAnalytics && fullCycleAnalytics.ordersInProgress.length > 0 && (
          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="text-base">
                Заказы в работе ({fullCycleAnalytics.ordersInProgress.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2 font-medium text-muted-foreground">
                        Заказ
                      </th>
                      <th className="text-left p-2 font-medium text-muted-foreground">
                        Клиент
                      </th>
                      <th className="text-center p-2 font-medium text-muted-foreground">
                        Текущее время
                      </th>
                      <th className="text-center p-2 font-medium text-muted-foreground">
                        Прогресс
                      </th>
                      <th className="text-left p-2 font-medium text-muted-foreground">
                        Продукты
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {fullCycleAnalytics.ordersInProgress.map((order, idx) => (
                      <tr key={idx} className="border-b hover:bg-muted/50">
                        <td className="p-2 font-medium">{order.orderNumber}</td>
                        <td className="p-2">{order.customerName}</td>
                        <td className="p-2 text-center font-semibold text-primary">
                          {formatDuration(order.currentDurationHours)}
                        </td>
                        <td className="p-2 text-center">
                          <div className="flex flex-col items-center gap-1">
                            <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                              <div
                                className="h-full bg-primary transition-all"
                                style={{ width: `${order.completionPercent}%` }}
                              />
                            </div>
                            <span className="text-xs">
                              {order.completionPercent}% ({order.completedProducts}/
                              {order.totalProducts})
                            </span>
                          </div>
                        </td>
                        <td className="p-2">
                          <div className="text-xs space-y-1">
                            {order.products.map((product, pIdx) => (
                              <div key={pIdx} className="flex items-center gap-2">
                                <span>{product.name}</span>
                                <span className="px-2 py-0.5 rounded bg-primary/20 text-primary/90">
                                  {getStageLabel(product.stage)}
                                </span>
                                <span className="text-muted-foreground">
                                  ({product.quantity} шт)
                                </span>
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Производительность сотрудников — таблица */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Users size={18} className="text-primary" />
            Производительность сотрудников
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2 font-medium text-muted-foreground">
                    Сотрудник
                  </th>
                  <th className="text-left p-2 font-medium text-muted-foreground">
                    Роль
                  </th>
                  <th className="text-center p-2 font-medium text-muted-foreground">
                    Выполнено задач
                  </th>
                  <th className="text-center p-2 font-medium text-muted-foreground">
                    Среднее время
                  </th>
                  <th className="text-left p-2 font-medium text-muted-foreground">
                    Текущая задача
                  </th>
                </tr>
              </thead>
              <tbody>
                {userPerformance.map((perf) => {
                  const maxCompleted = Math.max(
                    ...userPerformance.map((p) => p.stats.completedTasks),
                    1,
                  );
                  const ratio = perf.stats.completedTasks / maxCompleted;
                  return (
                    <tr key={perf.user.id} className="border-b hover:bg-muted/50">
                      <td className="p-2 font-medium">{perf.user.name}</td>
                      <td className="p-2">
                        <span className="text-xs px-2 py-1 rounded bg-primary/20 text-primary/90">
                          {typeof perf.user.role === 'object'
                            ? perf.user.role.name
                            : perf.user.role}
                        </span>
                      </td>
                      <td className="p-2">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 max-w-[120px] bg-muted rounded-full h-1.5 overflow-hidden">
                            <div
                              className="h-full bg-primary"
                              style={{ width: `${ratio * 100}%` }}
                            />
                          </div>
                          <span className="font-semibold text-right min-w-[2ch]">
                            {perf.stats.completedTasks}
                          </span>
                        </div>
                      </td>
                      <td className="p-2 text-center">
                        {perf.stats.avgTaskDurationHours
                          ? formatDuration(perf.stats.avgTaskDurationHours)
                          : '—'}
                      </td>
                      <td className="p-2">
                        {perf.stats.hasActiveTask && perf.stats.activeTask ? (
                          <div>
                            <div className="font-medium">
                              {perf.stats.activeTask.productName}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {perf.stats.activeTask.orderNumber} ·{' '}
                              {getStageLabel(perf.stats.activeTask.stage)}
                            </div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Сводка за период */}
      <div>
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <TrendingUp size={22} className="text-primary" />
          Сводка за период
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <KpiCard
            label="Дней в периоде"
            value={performanceSummary?.period.days ?? 0}
          />
          <KpiCard
            label="Создано заказов"
            value={performanceSummary?.ordersCreated ?? 0}
            tone="accent"
          />
          <KpiCard
            label="Завершено заказов"
            value={performanceSummary?.ordersCompleted ?? 0}
            tone="success"
          />
          <KpiCard
            label="Завершено продуктов"
            value={performanceSummary?.productsCompleted ?? 0}
            tone="success"
          />
          <KpiCard
            label="Продуктов в день"
            value={performanceSummary?.avgProductsPerDay?.toFixed(1) ?? '0'}
          />
        </div>
      </div>

      {/* Детальный отчёт по заказам */}
      <div>
        <h2 className="text-xl font-semibold mb-2 flex items-center gap-2">
          <FileText size={22} className="text-primary" />
          Детальный отчёт по заказам
        </h2>
        <p className="text-xs text-muted-foreground mb-3">
          Нажмите на заказ, чтобы увидеть продукты и сотрудников по этапам.
        </p>
        <Card>
          <CardContent className="p-4">
            {orderReport.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                Нет заказов за выбранный период
              </p>
            ) : (
              <div className="space-y-2">
                {orderReport.map((order) => {
                  const expanded = expandedOrders.has(order.id);
                  return (
                    <div key={order.id} className="border rounded-lg overflow-hidden">
                      <button
                        onClick={() => toggleOrder(order.id)}
                        className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/50 text-left"
                      >
                        <div className="flex items-center gap-3">
                          {expanded ? (
                            <ChevronDown size={16} />
                          ) : (
                            <ChevronRight size={16} />
                          )}
                          <div>
                            <div className="font-semibold">
                              {order.orderNumber} · {order.customerName}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {new Date(order.createdAt).toLocaleDateString('ru-RU')} ·
                              позиций: {order.products.length}
                              {order.createdBy && ` · менеджер: ${order.createdBy}`}
                            </div>
                          </div>
                        </div>
                        <span className="text-xs px-2 py-1 rounded bg-primary/20 text-primary">
                          {order.status}
                        </span>
                      </button>

                      {expanded && (
                        <div className="border-t bg-muted/20 p-4 space-y-4">
                          {order.products.map((product) => (
                            <div
                              key={product.id}
                              className="border rounded-md bg-card p-3"
                            >
                              <div className="flex items-center justify-between mb-2">
                                <div>
                                  <div className="font-medium">{product.name}</div>
                                  <div className="text-xs text-muted-foreground">
                                    {product.productType && `${product.productType} · `}
                                    Кол-во: {product.quantity}
                                    {product.color && ` · Цвет: ${product.color}`}
                                    {product.dimensions && ` · ${product.dimensions}`}
                                  </div>
                                </div>
                                <span className="text-xs px-2 py-0.5 rounded bg-muted">
                                  {getStageLabel(product.stage as ProductionStage)}
                                </span>
                              </div>

                              {product.stages.length === 0 ? (
                                <p className="text-xs text-muted-foreground">
                                  Этапы ещё не начаты
                                </p>
                              ) : (
                                <div className="overflow-x-auto">
                                  <table className="w-full text-sm">
                                    <thead>
                                      <tr className="border-b text-muted-foreground">
                                        <th className="text-left px-2 py-1 font-medium">
                                          Этап
                                        </th>
                                        <th className="text-left px-2 py-1 font-medium">
                                          Сотрудник
                                        </th>
                                        <th className="text-left px-2 py-1 font-medium">
                                          Роль
                                        </th>
                                        <th className="text-left px-2 py-1 font-medium">
                                          Статус
                                        </th>
                                        <th className="text-left px-2 py-1 font-medium">
                                          Длительность
                                        </th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {product.stages.flatMap((stg) =>
                                        stg.workers.map((w, idx) => (
                                          <tr
                                            key={`${stg.stage}-${w.id}-${idx}`}
                                            className="border-b last:border-0"
                                          >
                                            <td className="px-2 py-1">
                                              {stg.stageName}
                                            </td>
                                            <td className="px-2 py-1 font-medium">
                                              {w.name}
                                            </td>
                                            <td className="px-2 py-1 text-xs text-muted-foreground">
                                              {w.role || '—'}
                                            </td>
                                            <td className="px-2 py-1 text-xs">
                                              {w.status}
                                            </td>
                                            <td className="px-2 py-1 text-xs">
                                              {w.durationHours != null
                                                ? formatDuration(w.durationHours)
                                                : 'в работе'}
                                            </td>
                                          </tr>
                                        )),
                                      )}
                                    </tbody>
                                  </table>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
