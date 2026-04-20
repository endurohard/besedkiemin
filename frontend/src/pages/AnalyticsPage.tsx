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
} from 'lucide-react';

export const AnalyticsPage = () => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

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

  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());
  const toggleOrder = (id: string) => {
    setExpandedOrders((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const getStageLabel = (stage: ProductionStage): string => {
    const labels: Record<ProductionStage, string> = {
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
    return labels[stage] || stage;
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

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Аналитика производства</h1>

      {/* Общая статистика производства */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <BarChart3 size={24} />
          Общая статистика
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground">Всего заказов</p>
              <p className="text-3xl font-bold mt-2">
                {productionOverview?.orders.total || 0}
              </p>
              <p className="text-sm text-green-600 mt-1">
                Завершено: {productionOverview?.orders.completionRate || 0}%
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground">Активные заказы</p>
              <p className="text-3xl font-bold mt-2 text-primary">
                {productionOverview?.orders.active || 0}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground">Всего продуктов</p>
              <p className="text-3xl font-bold mt-2">
                {productionOverview?.products.total || 0}
              </p>
              <p className="text-sm text-green-600 mt-1">
                Завершено: {productionOverview?.products.completionRate || 0}%
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground">В производстве</p>
              <p className="text-3xl font-bold mt-2 text-yellow-600">
                {productionOverview?.products.inProduction || 0}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Распределение по этапам */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Распределение продуктов по этапам</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
              {Object.entries(productionOverview?.stageDistribution || {}).map(
                ([stage, count]) => (
                  <div key={stage} className="text-center p-4 bg-muted rounded-lg">
                    <p className="text-2xl font-bold text-primary">{count}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {getStageLabel(stage as ProductionStage)}
                    </p>
                  </div>
                )
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Статистика качества */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <CheckCircle2 size={24} />
          Контроль качества
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground">Всего проверок</p>
              <p className="text-3xl font-bold mt-2">{qualityStats?.total || 0}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground">Одобрено</p>
              <p className="text-3xl font-bold mt-2 text-green-600">
                {qualityStats?.approved || 0}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground">Отклонено</p>
              <p className="text-3xl font-bold mt-2 text-red-600">
                {qualityStats?.rejected || 0}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground">Процент одобрения</p>
              <p className="text-3xl font-bold mt-2 text-green-600">
                {qualityStats?.approvalRate || 0}%
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Последние браки */}
        {qualityStats && qualityStats.recentRejections.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Последние браки</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Продукт</th>
                      <th className="text-left p-2">Заказ</th>
                      <th className="text-left p-2">Клиент</th>
                      <th className="text-left p-2">Причина</th>
                      <th className="text-left p-2">Проверил</th>
                      <th className="text-left p-2">Дата</th>
                    </tr>
                  </thead>
                  <tbody>
                    {qualityStats.recentRejections.map((rejection) => (
                      <tr key={rejection.id} className="border-b hover:bg-muted/50">
                        <td className="p-2">{rejection.productName}</td>
                        <td className="p-2">{rejection.orderNumber}</td>
                        <td className="p-2">{rejection.customerName}</td>
                        <td className="p-2 text-sm">
                          {rejection.reason || 'Не указана'}
                        </td>
                        <td className="p-2 text-sm">{rejection.checkedBy}</td>
                        <td className="p-2 text-sm text-muted-foreground">
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
      </div>

      {/* Производительность сотрудников */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Users size={24} />
          Производительность сотрудников
        </h2>
        <Card>
          <CardContent className="p-6">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Сотрудник</th>
                    <th className="text-left p-2">Роль</th>
                    <th className="text-center p-2">Выполнено задач</th>
                    <th className="text-center p-2">Среднее время (часы)</th>
                    <th className="text-left p-2">Текущая задача</th>
                  </tr>
                </thead>
                <tbody>
                  {userPerformance.map((perf) => (
                    <tr key={perf.user.id} className="border-b hover:bg-muted/50">
                      <td className="p-2 font-medium">{perf.user.name}</td>
                      <td className="p-2">
                        <span className="text-xs px-2 py-1 rounded bg-primary/20 text-primary/90">
                          {typeof perf.user.role === 'object' ? perf.user.role.name : perf.user.role}
                        </span>
                      </td>
                      <td className="p-2 text-center font-semibold">
                        {perf.stats.completedTasks}
                      </td>
                      <td className="p-2 text-center">
                        {perf.stats.avgTaskDurationHours}
                      </td>
                      <td className="p-2">
                        {perf.stats.hasActiveTask && perf.stats.activeTask ? (
                          <div className="text-sm">
                            <div className="font-medium">
                              {perf.stats.activeTask.productName}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Заказ: {perf.stats.activeTask.orderNumber} |{' '}
                              {getStageLabel(perf.stats.activeTask.stage)}
                            </div>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">
                            Нет активных задач
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Статистика по типам продуктов */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Package size={24} />
          Статистика по типам продуктов
        </h2>
        <Card>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {productTypeStats.map((stat) => (
                <div
                  key={stat.type}
                  className="p-4 border rounded-lg hover:shadow-md transition-shadow"
                >
                  <h3 className="font-semibold text-lg mb-3">{stat.type}</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Всего:</span>
                      <span className="font-semibold">{stat.total}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">
                        Завершено:
                      </span>
                      <span className="font-semibold text-green-600">
                        {stat.completed}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">
                        В производстве:
                      </span>
                      <span className="font-semibold text-primary">
                        {stat.inProduction}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Брак:</span>
                      <span className="font-semibold text-red-600">
                        {stat.rejected}
                      </span>
                    </div>
                    <div className="mt-2 pt-2 border-t">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">
                          Процент выполнения:
                        </span>
                        <span className="text-lg font-bold text-green-600">
                          {stat.completionRate}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Сводка производительности за период */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <TrendingUp size={24} />
          Сводка производительности за период
        </h2>

        {/* Фильтры по датам */}
        <Card className="mb-4">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Дата начала</label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Дата окончания
                </label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-2">
                <Clock size={20} className="text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Период</p>
              </div>
              <p className="text-2xl font-bold">
                {performanceSummary?.period.days || 0} дней
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {performanceSummary?.period.start
                  ? new Date(performanceSummary.period.start).toLocaleDateString()
                  : '-'}{' '}
                -{' '}
                {performanceSummary?.period.end
                  ? new Date(performanceSummary.period.end).toLocaleDateString()
                  : '-'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground">Создано заказов</p>
              <p className="text-3xl font-bold mt-2 text-primary">
                {performanceSummary?.ordersCreated || 0}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground">Завершено заказов</p>
              <p className="text-3xl font-bold mt-2 text-green-600">
                {performanceSummary?.ordersCompleted || 0}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground">Завершено продуктов</p>
              <p className="text-3xl font-bold mt-2 text-green-600">
                {performanceSummary?.productsCompleted || 0}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground">Проверок качества</p>
              <p className="text-3xl font-bold mt-2">
                {performanceSummary?.qualityChecksPerformed || 0}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground">Продуктов в день</p>
              <p className="text-3xl font-bold mt-2 text-purple-600">
                {performanceSummary?.avgProductsPerDay.toFixed(1) || 0}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Полная аналитика цикла: от производства до доставки */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Zap size={24} />
          Полный цикл: от производства до доставки
        </h2>

        {/* Средние показатели времени */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-2">
                <Timer size={20} className="text-primary" />
                <p className="text-sm text-muted-foreground">Полный цикл</p>
              </div>
              <p className="text-3xl font-bold text-primary">
                {fullCycleAnalytics?.summary.avgFullCycleHours
                  ? formatDuration(fullCycleAnalytics.summary.avgFullCycleHours)
                  : '0 ч'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                от заказа до доставки
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-2">
                <Clock size={20} className="text-purple-600" />
                <p className="text-sm text-muted-foreground">Производство</p>
              </div>
              <p className="text-3xl font-bold text-purple-600">
                {fullCycleAnalytics?.summary.avgProductionHours
                  ? formatDuration(fullCycleAnalytics.summary.avgProductionHours)
                  : '0 ч'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                все этапы производства
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-2">
                <Package size={20} className="text-orange-600" />
                <p className="text-sm text-muted-foreground">На складе</p>
              </div>
              <p className="text-3xl font-bold text-orange-600">
                {fullCycleAnalytics?.summary.avgWarehouseHours
                  ? formatDuration(fullCycleAnalytics.summary.avgWarehouseHours)
                  : '0 ч'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                до отгрузки
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp size={20} className="text-green-600" />
                <p className="text-sm text-muted-foreground">Доставка</p>
              </div>
              <p className="text-3xl font-bold text-green-600">
                {fullCycleAnalytics?.summary.avgDeliveryHours
                  ? formatDuration(fullCycleAnalytics.summary.avgDeliveryHours)
                  : '0 ч'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                до клиента
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Время по этапам производства */}
        {fullCycleAnalytics?.summary.avgStageHours && (
          <Card className="mb-4">
            <CardHeader>
              <CardTitle className="text-lg">Среднее время по этапам производства</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(fullCycleAnalytics.summary.avgStageHours).map(
                  ([stage, hours]) => (
                    <div key={stage} className="text-center p-4 bg-muted rounded-lg">
                      <p className="text-2xl font-bold text-purple-600">
                        {formatDuration(hours)}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {getStageLabel(stage as ProductionStage)}
                      </p>
                    </div>
                  )
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Доставленные заказы */}
        {fullCycleAnalytics && fullCycleAnalytics.completedCycles.length > 0 && (
          <Card className="mb-4">
            <CardHeader>
              <CardTitle className="text-lg">
                Доставленные заказы ({fullCycleAnalytics.summary.totalDelivered})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Заказ</th>
                      <th className="text-left p-2">Клиент</th>
                      <th className="text-left p-2">Продукт</th>
                      <th className="text-center p-2">Кол-во</th>
                      <th className="text-center p-2">Полный цикл</th>
                      <th className="text-center p-2">Производство</th>
                      <th className="text-center p-2">Склад</th>
                      <th className="text-center p-2">Доставка</th>
                      <th className="text-left p-2">Дата доставки</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fullCycleAnalytics.completedCycles.slice(0, 10).map((cycle, idx) => (
                      <tr key={idx} className="border-b hover:bg-muted/50">
                        <td className="p-2 font-medium">{cycle.orderNumber}</td>
                        <td className="p-2">{cycle.customerName}</td>
                        <td className="p-2">
                          <div className="text-sm">
                            <div>{cycle.productName}</div>
                            <div className="text-xs text-muted-foreground">
                              {cycle.productType}
                            </div>
                          </div>
                        </td>
                        <td className="p-2 text-center">{cycle.quantity}</td>
                        <td className="p-2 text-center font-semibold text-primary">
                          {formatDuration(cycle.durations.fullCycleHours)}
                        </td>
                        <td className="p-2 text-center text-purple-600">
                          {formatDuration(cycle.durations.productionHours)}
                        </td>
                        <td className="p-2 text-center text-orange-600">
                          {formatDuration(cycle.durations.warehouseHours)}
                        </td>
                        <td className="p-2 text-center text-green-600">
                          {formatDuration(cycle.durations.deliveryHours)}
                        </td>
                        <td className="p-2 text-sm text-muted-foreground">
                          {new Date(cycle.deliveredAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Заказы в работе */}
        {fullCycleAnalytics && fullCycleAnalytics.ordersInProgress.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                Заказы в работе ({fullCycleAnalytics.ordersInProgress.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Заказ</th>
                      <th className="text-left p-2">Клиент</th>
                      <th className="text-center p-2">Текущее время</th>
                      <th className="text-center p-2">Прогресс</th>
                      <th className="text-left p-2">Продукты</th>
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
                          <div className="text-sm">
                            <div className="font-semibold">
                              {order.completionPercent}%
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {order.completedProducts} / {order.totalProducts}
                            </div>
                          </div>
                        </td>
                        <td className="p-2">
                          <div className="text-sm space-y-1">
                            {order.products.map((product, pIdx) => (
                              <div key={pIdx} className="flex items-center gap-2">
                                <span>{product.name}</span>
                                <span className="text-xs px-2 py-1 rounded bg-primary/20 text-primary/90">
                                  {getStageLabel(product.stage)}
                                </span>
                                <span className="text-xs text-muted-foreground">
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

        {/* Сообщение, если нет данных */}
        {fullCycleAnalytics &&
         fullCycleAnalytics.completedCycles.length === 0 &&
         fullCycleAnalytics.ordersInProgress.length === 0 && (
          <Card>
            <CardContent className="p-6 text-center text-muted-foreground">
              <p>Нет данных за выбранный период. Для анализа необходимы доставленные заказы.</p>
              <p className="text-sm mt-2">Выберите другой период или дождитесь завершения заказов.</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Детальный отчёт по заказам: кто из сотрудников делал какой этап */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <FileText size={24} />
          Детальный отчёт по заказам
        </h2>
        <p className="text-sm text-muted-foreground mb-3">
          Период фильтра берётся из секции выше. Нажмите на заказ, чтобы увидеть продукты и сотрудников по этапам.
        </p>
        <Card>
          <CardContent className="p-4">
            {orderReport.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">Нет заказов за выбранный период</p>
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
                          {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                          <div>
                            <div className="font-semibold">{order.orderNumber} · {order.customerName}</div>
                            <div className="text-xs text-muted-foreground">
                              {new Date(order.createdAt).toLocaleDateString('ru-RU')} · позиций: {order.products.length}
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
                            <div key={product.id} className="border rounded-md bg-card p-3">
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
                                <p className="text-xs text-muted-foreground">Этапы ещё не начаты</p>
                              ) : (
                                <div className="overflow-x-auto">
                                  <table className="w-full text-sm">
                                    <thead>
                                      <tr className="border-b text-muted-foreground">
                                        <th className="text-left px-2 py-1 font-medium">Этап</th>
                                        <th className="text-left px-2 py-1 font-medium">Сотрудник</th>
                                        <th className="text-left px-2 py-1 font-medium">Роль</th>
                                        <th className="text-left px-2 py-1 font-medium">Статус</th>
                                        <th className="text-left px-2 py-1 font-medium">Длительность</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {product.stages.flatMap((stg) =>
                                        stg.workers.map((w, idx) => (
                                          <tr key={`${stg.stage}-${w.id}-${idx}`} className="border-b last:border-0">
                                            <td className="px-2 py-1">{stg.stageName}</td>
                                            <td className="px-2 py-1 font-medium">{w.name}</td>
                                            <td className="px-2 py-1 text-xs text-muted-foreground">{w.role || '—'}</td>
                                            <td className="px-2 py-1 text-xs">{w.status}</td>
                                            <td className="px-2 py-1 text-xs">
                                              {w.durationHours != null ? formatDuration(w.durationHours) : 'в работе'}
                                            </td>
                                          </tr>
                                        ))
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
