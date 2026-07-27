import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ordersApi } from '@/lib/api';
import { ArchivedOrder, Order, OrderStatus } from '@/types';
import { orderStatusLabels, stageLabels } from '@/lib/labels';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/store/authStore';
import { Loader2, Archive, Search, RotateCcw, CheckCircle, Trash2, XIcon } from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

type ArchiveTab = 'completed' | 'deleted';

export const OrderArchivePage = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const roleCode = user?.role?.code || '';
  const isOwner = roleCode === 'OWNER' || roleCode === 'SUPER_ADMIN';

  const [tab, setTab] = useState<ArchiveTab>('completed');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  // Подробная карточка заказа (работает и для удалённых)
  const { data: orderDetail, isLoading: detailLoading } = useQuery({
    queryKey: ['order-detail', selectedOrderId],
    queryFn: () => ordersApi.getOne(selectedOrderId!),
    enabled: !!selectedOrderId,
  });

  // Выполненные заказы (скрыты из Канбана, но остаются в аналитике/зарплате)
  const { data: completedOrders, isLoading: completedLoading } = useQuery({
    queryKey: ['orders-completed'],
    queryFn: () => ordersApi.getAllPaginated({ status: OrderStatus.COMPLETED }),
  });

  // Удалённые заказы — только владелец
  const { data: deletedOrders, isLoading: deletedLoading } = useQuery({
    queryKey: ['orders-archive'],
    queryFn: ordersApi.getArchive,
    enabled: isOwner,
  });

  const restoreMutation = useMutation({
    mutationFn: ordersApi.restore,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders-archive'] });
      queryClient.invalidateQueries({ queryKey: ['orders-completed'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });

  const matchesSearch = (orderNumber: string, customerName: string, customerPhone?: string | null) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      orderNumber.toLowerCase().includes(q) ||
      customerName.toLowerCase().includes(q) ||
      (customerPhone || '').toLowerCase().includes(q)
    );
  };

  const filteredCompleted = useMemo(
    () =>
      (completedOrders || []).filter((o: Order) =>
        matchesSearch(o.orderNumber, o.customerName, o.customerPhone),
      ),
    [completedOrders, searchQuery],
  );

  const filteredDeleted = useMemo(
    () =>
      (deletedOrders || []).filter((o: ArchivedOrder) =>
        matchesSearch(o.orderNumber, o.customerName, o.customerPhone),
      ),
    [deletedOrders, searchQuery],
  );

  const handleRestore = (order: ArchivedOrder) => {
    if (
      confirm(
        `Восстановить заказ ${order.orderNumber} (${order.customerName})? Он снова появится в Канбане и отчётах.`,
      )
    ) {
      restoreMutation.mutate(order.id);
    }
  };

  const isLoading = tab === 'completed' ? completedLoading : deletedLoading;

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-2">
        <Archive size={24} />
        <h1 className="text-2xl font-bold">Архив заказов</h1>
      </div>

      {/* Вкладки */}
      <div className="flex gap-2">
        <Button
          variant={tab === 'completed' ? 'default' : 'outline'}
          onClick={() => setTab('completed')}
          size="sm"
          className="gap-1"
        >
          <CheckCircle size={14} />
          Выполненные ({completedOrders?.length || 0})
        </Button>
        {isOwner && (
          <Button
            variant={tab === 'deleted' ? 'default' : 'outline'}
            onClick={() => setTab('deleted')}
            size="sm"
            className="gap-1"
          >
            <Trash2 size={14} />
            Удалённые ({deletedOrders?.length || 0})
          </Button>
        )}
      </div>

      <p className="text-sm text-muted-foreground">
        {tab === 'completed'
          ? 'Выполненные заказы скрыты из Канбана, но учитываются в аналитике и зарплате.'
          : 'Удалённые заказы не видны никому кроме владельца и не учитываются в отчётах. Восстановленный заказ возвращается со всеми товарами и историей.'}
      </p>

      <Card>
        <CardHeader className="pb-2">
          <div className="relative">
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
            {isLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="animate-spin" size={32} />
              </div>
            ) : tab === 'completed' ? (
              <table className="w-full text-sm">
                <thead className="bg-muted/50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Заказ</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Клиент</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Телефон</th>
                    <th className="px-4 py-3 text-center font-medium text-muted-foreground">Товаров</th>
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">Сумма</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Создан</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Завершён</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCompleted.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                        <CheckCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p>{searchQuery ? 'Ничего не найдено' : 'Выполненных заказов пока нет'}</p>
                      </td>
                    </tr>
                  ) : (
                    filteredCompleted.map((order: Order) => (
                      <tr
                        key={order.id}
                        className="border-b hover:bg-muted/50 cursor-pointer"
                        onClick={() => setSelectedOrderId(order.id)}
                      >
                        <td className="px-4 py-3 font-medium">{order.orderNumber}</td>
                        <td className="px-4 py-3">
                          <div className="max-w-[180px] truncate" title={order.customerName}>
                            {order.customerName}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">{order.customerPhone || '—'}</td>
                        <td className="px-4 py-3 text-center">{order.products?.length ?? '—'}</td>
                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          {order.totalAmount != null
                            ? `${order.totalAmount.toLocaleString('ru-RU')} ₽`
                            : '—'}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-xs text-muted-foreground">
                          {format(new Date(order.createdAt), 'dd.MM.yyyy', { locale: ru })}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-xs text-muted-foreground">
                          {format(new Date(order.updatedAt), 'dd.MM.yyyy HH:mm', { locale: ru })}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-muted/50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Заказ</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Клиент</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Телефон</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Статус</th>
                    <th className="px-4 py-3 text-center font-medium text-muted-foreground">Товаров</th>
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">Сумма</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Удалён</th>
                    <th className="px-4 py-3 text-center font-medium text-muted-foreground">Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDeleted.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-12 text-center text-muted-foreground">
                        <Archive className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p>{searchQuery ? 'Ничего не найдено' : 'Удалённых заказов нет'}</p>
                      </td>
                    </tr>
                  ) : (
                    filteredDeleted.map((order: ArchivedOrder) => (
                      <tr
                        key={order.id}
                        className="border-b hover:bg-muted/50 cursor-pointer"
                        onClick={() => setSelectedOrderId(order.id)}
                      >
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
                          {format(new Date(order.deletedAt), 'dd.MM.yyyy HH:mm', { locale: ru })}
                        </td>
                        <td className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
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
            )}
          </div>
        </CardContent>
      </Card>

      {/* Модальное окно с подробной карточкой заказа */}
      {selectedOrderId && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedOrderId(null)}
        >
          <Card
            className="w-full max-w-3xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <CardHeader className="flex flex-row items-center justify-between border-b pb-3">
              <CardTitle className="text-lg">
                {orderDetail ? `Заказ ${orderDetail.orderNumber}` : 'Заказ'}
                {orderDetail?.deletedAt && (
                  <span className="ml-2 px-2 py-1 bg-red-100 text-red-800 rounded text-xs align-middle">
                    Удалён
                  </span>
                )}
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setSelectedOrderId(null)}>
                <XIcon size={18} />
              </Button>
            </CardHeader>
            <CardContent className="pt-4">
              {detailLoading || !orderDetail ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="animate-spin" size={32} />
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Основная информация */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                    <div>
                      <div className="text-xs text-muted-foreground">Клиент</div>
                      <div className="font-medium">{orderDetail.customerName}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Телефон</div>
                      <div>{orderDetail.customerPhone || '—'}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Статус</div>
                      <div>{orderStatusLabels[orderDetail.status] || orderDetail.status}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Сумма</div>
                      <div>
                        {orderDetail.totalAmount != null
                          ? `${orderDetail.totalAmount.toLocaleString('ru-RU')} ₽`
                          : '—'}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Создан</div>
                      <div>
                        {format(new Date(orderDetail.createdAt), 'dd.MM.yyyy HH:mm', { locale: ru })}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">
                        {orderDetail.deletedAt ? 'Удалён' : 'Обновлён'}
                      </div>
                      <div>
                        {format(
                          new Date(orderDetail.deletedAt || orderDetail.updatedAt),
                          'dd.MM.yyyy HH:mm',
                          { locale: ru },
                        )}
                      </div>
                    </div>
                    {orderDetail.customerAddress && (
                      <div className="col-span-2 md:col-span-3">
                        <div className="text-xs text-muted-foreground">Адрес</div>
                        <div>{orderDetail.customerAddress}</div>
                      </div>
                    )}
                    {orderDetail.description && (
                      <div className="col-span-2 md:col-span-3">
                        <div className="text-xs text-muted-foreground">Описание</div>
                        <div className="whitespace-pre-wrap">{orderDetail.description}</div>
                      </div>
                    )}
                    {orderDetail.createdBy && (
                      <div>
                        <div className="text-xs text-muted-foreground">Создал</div>
                        <div>
                          {orderDetail.createdBy.lastName} {orderDetail.createdBy.firstName}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Товары заказа */}
                  <div>
                    <h3 className="text-sm font-semibold mb-2">
                      Товары ({orderDetail.products?.length || 0})
                    </h3>
                    <div className="border rounded-lg overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-muted/50 border-b">
                          <tr>
                            <th className="px-3 py-2 text-left font-medium text-muted-foreground">Название</th>
                            <th className="px-3 py-2 text-left font-medium text-muted-foreground">Тип</th>
                            <th className="px-3 py-2 text-center font-medium text-muted-foreground">Кол-во</th>
                            <th className="px-3 py-2 text-left font-medium text-muted-foreground">Этап</th>
                            <th className="px-3 py-2 text-left font-medium text-muted-foreground">Размеры</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(orderDetail.products || []).length === 0 ? (
                            <tr>
                              <td colSpan={5} className="px-3 py-6 text-center text-muted-foreground">
                                Товаров нет
                              </td>
                            </tr>
                          ) : (
                            (orderDetail.products || []).map((p) => (
                              <tr key={p.id} className="border-b last:border-b-0">
                                <td className="px-3 py-2">
                                  <div className="max-w-[220px] truncate" title={p.name}>
                                    {p.name}
                                  </div>
                                </td>
                                <td className="px-3 py-2">
                                  <span className="px-2 py-1 bg-primary/20 text-primary/90 rounded text-xs">
                                    {p.productType?.name || '—'}
                                  </span>
                                </td>
                                <td className="px-3 py-2 text-center">{p.quantity}</td>
                                <td className="px-3 py-2">{stageLabels[p.stage] || p.stage}</td>
                                <td className="px-3 py-2 text-xs text-muted-foreground">
                                  {p.dimensions || '—'}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Восстановление удалённого заказа из карточки */}
                  {orderDetail.deletedAt && isOwner && (
                    <div className="flex justify-end">
                      <Button
                        onClick={() => {
                          handleRestore({
                            id: orderDetail.id,
                            orderNumber: orderDetail.orderNumber,
                            customerName: orderDetail.customerName,
                            status: orderDetail.status,
                            createdAt: orderDetail.createdAt,
                            deletedAt: orderDetail.deletedAt!,
                          });
                          setSelectedOrderId(null);
                        }}
                        disabled={restoreMutation.isPending}
                        className="gap-1"
                      >
                        <RotateCcw size={14} />
                        Восстановить заказ
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};
