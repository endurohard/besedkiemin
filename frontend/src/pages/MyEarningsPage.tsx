import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/store/authStore';
import { payrollApi } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { STAGE_TO_NAME } from '@/lib/labels';

export const MyEarningsPage = () => {
  const { user, logout } = useAuthStore();
  const [period, setPeriod] = useState<'today' | 'month'>('today');

  const { data: earnings, isLoading } = useQuery({
    queryKey: ['my-earnings', period],
    queryFn: () =>
      period === 'today'
        ? payrollApi.getMyEarningsToday()
        : payrollApi.getMyEarnings(),
    refetchInterval: 30000, // Обновлять каждые 30 сек
  });

  const formatMoney = (amount: number) =>
    new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(amount);

  const formatTime = (dateStr: string) =>
    new Date(dateStr).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 p-4">
      <div className="max-w-lg mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold">
              {user?.firstName} {user?.lastName}
            </h1>
            <p className="text-sm text-muted-foreground">{user?.role?.name}</p>
          </div>
          <Button variant="outline" size="sm" onClick={logout}>
            Выйти
          </Button>
        </div>

        {/* Period toggle */}
        <div className="flex gap-2">
          <Button
            variant={period === 'today' ? 'default' : 'outline'}
            className="flex-1"
            onClick={() => setPeriod('today')}
          >
            Сегодня
          </Button>
          <Button
            variant={period === 'month' ? 'default' : 'outline'}
            className="flex-1"
            onClick={() => setPeriod('month')}
          >
            За месяц
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        ) : earnings ? (
          <>
            {/* Summary cards */}
            <div className="grid grid-cols-2 gap-3">
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-xs text-muted-foreground">Заработано</p>
                  <p className="text-2xl font-bold text-green-600">
                    {formatMoney(
                      period === 'today'
                        ? earnings.today?.earnings || 0
                        : earnings.period_totals?.earnings || 0,
                    )}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-xs text-muted-foreground">Штрафы</p>
                  <p className="text-2xl font-bold text-red-600">
                    {formatMoney(
                      period === 'today'
                        ? earnings.today?.penalties || 0
                        : earnings.period_totals?.penalties || 0,
                    )}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Net earnings */}
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-sm text-muted-foreground">Итого к выплате</p>
                <p className="text-3xl font-bold">
                  {formatMoney(
                    period === 'today'
                      ? earnings.today?.net || 0
                      : earnings.period_totals?.net || 0,
                  )}
                </p>
                {period === 'month' && earnings.period_totals && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Выполнено работ: {earnings.period_totals.workLogsCount}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Work logs */}
            <Card>
              <CardHeader className="p-3 pb-2">
                <CardTitle className="text-sm">
                  {period === 'today' ? 'Работы за сегодня' : 'Последние работы'}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 pt-0">
                {(period === 'today'
                  ? earnings.today?.workLogs
                  : earnings.recentWorkLogs
                )?.length > 0 ? (
                  <div className="space-y-2">
                    {(period === 'today'
                      ? earnings.today.workLogs
                      : earnings.recentWorkLogs
                    ).map((log: any) => (
                      <div
                        key={log.id}
                        className="flex items-center justify-between py-2 border-b last:border-0"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {log.product || 'Изделие'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {STAGE_TO_NAME[log.stage] || log.stage} / {log.quantity} шт.
                            {period === 'month' && log.completedAt && (
                              <span> / {formatDate(log.completedAt)}</span>
                            )}
                            {period === 'today' && log.completedAt && (
                              <span> / {formatTime(log.completedAt)}</span>
                            )}
                          </p>
                        </div>
                        <p className="text-sm font-semibold text-green-600 ml-2">
                          +{formatMoney(log.totalAmount)}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Нет записей
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Penalties */}
            {earnings.penalties?.length > 0 && (
              <Card>
                <CardHeader className="p-3 pb-2">
                  <CardTitle className="text-sm text-red-600">Штрафы</CardTitle>
                </CardHeader>
                <CardContent className="p-3 pt-0">
                  <div className="space-y-2">
                    {earnings.penalties.map((penalty: any) => (
                      <div
                        key={penalty.id}
                        className="flex items-center justify-between py-2 border-b last:border-0"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm truncate">{penalty.reason}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(penalty.date)}
                          </p>
                        </div>
                        <p className="text-sm font-semibold text-red-600 ml-2">
                          -{formatMoney(penalty.amount)}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        ) : (
          <p className="text-center text-muted-foreground py-8">
            Нет данных
          </p>
        )}
      </div>
    </div>
  );
};
