import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ordersApi } from '@/lib/api';
import { ArchivedOrder } from '@/types';
import { orderStatusLabels } from '@/lib/labels';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Loader2, Archive, Search, RotateCcw } from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

export const OrderArchivePage = () => {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');

  const { data: orders, isLoading, error } = useQuery({
    queryKey: ['orders-archive'],
    queryFn: ordersApi.getArchive,
  });

  const restoreMutation = useMutation({
    mutationFn: ordersApi.restore,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders-archive'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });

  const filteredOrders = useMemo(() => {
    if (!orders) return [];
    if (!searchQuery) return orders;
    const q = searchQuery.toLowerCase();
    return orders.filter(
      (o) =>
        o.orderNumber.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q) ||
        (o.customerPhone || '').toLowerCase().includes(q),
    );
  }, [orders, searchQuery]);

  const handleRestore = (order: ArchivedOrder) => {
    if (
      confirm(
        `Восстановить заказ ${order.orderNumber} (${order.customerName})? Он снова появится в Канбане и отчётах.`,
      )
    ) {
      restoreMutation.mutate(order.id);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="animate-spin" size={48} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-md">
          Ошибка загрузки архива: {(error as Error).message}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-2">
        <Archive size={24} />
        <h1 className="text-2xl font-bold">Архив удалённых заказов</h1>
      </div>
      <p className="text-sm text-muted-foreground">
        Удалённые заказы не видны в Канбане и не учитываются в аналитике и зарплате.
        Восстановленный заказ возвращается со всеми товарами и историей.
      </p>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center justify-between">
            <span>Заказов в архиве: {orders?.length || 0}</span>
          </CardTitle>
          <div className="relative mt-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Поиск по номеру, клиенту, телефону..."
              className="w-full pl-9 pr-3 py-2 border rounded-md bg-background text-sm"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Заказ</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Клиент</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Телефон</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Статус</th>
                  <th className="px-4 py-3 text-center font-medium text-muted-foreground">Товаров</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">Сумма</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Создан</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Удалён</th>
                  <th className="px-4 py-3 text-center font-medium text-muted-foreground">Действия</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-12 text-center text-muted-foreground">
                      <Archive className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>{searchQuery ? 'Ничего не найдено' : 'Архив пуст'}</p>
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((order) => (
                    <tr key={order.id} className="border-b hover:bg-muted/50">
                      <td className="px-4 py-3 font-medium">{order.orderNumber}</td>
                      <td className="px-4 py-3">
                        <div className="max-w-[180px] truncate" title={order.customerName}>
                          {order.customerName}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">{order.customerPhone || '—'}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 bg-muted rounded text-xs">
                          {orderStatusLabels[order.status] || order.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">{order._count?.products ?? '—'}</td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        {order.totalAmount != null
                          ? `${order.totalAmount.toLocaleString('ru-RU')} ₽`
                          : '—'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-xs text-muted-foreground">
                        {format(new Date(order.createdAt), 'dd.MM.yyyy', { locale: ru })}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-xs text-muted-foreground">
                        {format(new Date(order.deletedAt), 'dd.MM.yyyy HH:mm', { locale: ru })}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Button
                          onClick={() => handleRestore(order)}
                          disabled={restoreMutation.isPending}
                          size="sm"
                          variant="outline"
                          className="gap-1"
                        >
                          <RotateCcw size={14} />
                          <span className="hidden sm:inline">Восстановить</span>
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
