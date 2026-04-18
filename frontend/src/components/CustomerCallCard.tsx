import { useQuery } from '@tanstack/react-query';
import { ordersApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { User, Phone, MapPin, Package, Clock } from 'lucide-react';
import { Order, OrderStatus } from '@/types';
import { getPriorityLabel, getPriorityColor } from '@/lib/priority-utils';

interface CustomerCallCardProps {
  phoneNumber: string;
}

const getStatusLabel = (status: OrderStatus): string => {
  switch (status) {
    case OrderStatus.NEW: return 'Новый';
    case OrderStatus.IN_PRODUCTION: return 'В производстве';
    case OrderStatus.COMPLETED: return 'Завершён';
    case OrderStatus.CANCELLED: return 'Отменён';
    default: return status;
  }
};

const getStatusColor = (status: OrderStatus): string => {
  switch (status) {
    case OrderStatus.NEW: return 'bg-primary/20 text-blue-800';
    case OrderStatus.IN_PRODUCTION: return 'bg-yellow-100 text-yellow-800';
    case OrderStatus.COMPLETED: return 'bg-green-100 text-green-800';
    case OrderStatus.CANCELLED: return 'bg-red-100 text-red-800';
    default: return 'bg-muted text-gray-800';
  }
};

export const CustomerCallCard = ({ phoneNumber }: CustomerCallCardProps) => {
  // Поиск клиента по номеру телефона
  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['orders', 'by-phone', phoneNumber],
    queryFn: async () => {
      const allOrders = await ordersApi.getAll();
      // Нормализуем номер для сравнения (убираем все кроме цифр)
      const normalizedPhone = phoneNumber.replace(/\D/g, '');
      return allOrders.filter((order: Order) => {
        const orderPhone = (order.customerPhone || '').replace(/\D/g, '');
        return orderPhone.includes(normalizedPhone) || normalizedPhone.includes(orderPhone);
      });
    },
    enabled: phoneNumber.length > 5,
  });

  const currentOrders = orders.filter((order: Order) =>
    order.status !== OrderStatus.COMPLETED &&
    order.status !== OrderStatus.CANCELLED
  );

  const completedOrders = orders.filter((order: Order) =>
    order.status === OrderStatus.COMPLETED ||
    order.status === OrderStatus.CANCELLED
  );

  const isNewCustomer = !isLoading && orders.length === 0;
  const isExistingCustomer = orders.length > 0;

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <User size={20} />
          {isNewCustomer ? 'Новый клиент' : orders[0]?.customerName || 'Клиент'}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Информация о клиенте */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Phone size={16} className="text-muted-foreground" />
            <span className="font-mono">{phoneNumber}</span>
          </div>
          {isExistingCustomer && orders[0]?.customerAddress && (
            <div className="flex items-center gap-2 text-sm">
              <MapPin size={16} className="text-muted-foreground" />
              <span>{orders[0].customerAddress}</span>
            </div>
          )}
        </div>

        {/* Новый клиент */}
        {isNewCustomer && (
          <div className="p-3 bg-primary/10 border border-blue-200 rounded-md">
            <p className="text-sm text-blue-900 font-medium">
              Это первый звонок от этого номера
            </p>
            <p className="text-xs text-primary mt-1">
              Создайте заказ после завершения разговора
            </p>
          </div>
        )}

        {/* Текущие заказы */}
        {currentOrders.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
              <Package size={16} />
              Текущие заказы ({currentOrders.length})
            </h4>
            <div className="space-y-2">
              {currentOrders.map((order: Order) => (
                <div
                  key={order.id}
                  className="p-3 border rounded-md bg-white hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-sm font-semibold">
                      #{order.orderNumber}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded ${getStatusColor(order.status)}`}>
                      {getStatusLabel(order.status)}
                    </span>
                  </div>
                  {order.priority && (
                    <div className="mb-2">
                      <span className={`text-xs px-2 py-1 rounded border ${getPriorityColor(order.priority)}`}>
                        {getPriorityLabel(order.priority)}
                      </span>
                    </div>
                  )}
                  {order.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2">{order.description}</p>
                  )}
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mt-2">
                    <Clock size={12} />
                    {new Date(order.createdAt).toLocaleDateString('ru-RU')}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* История заказов */}
        {completedOrders.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
              <Clock size={16} />
              История ({completedOrders.length})
            </h4>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {completedOrders.slice(0, 5).map((order: Order) => (
                <div
                  key={order.id}
                  className="p-2 border rounded-md bg-muted/50 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-semibold">#{order.orderNumber}</span>
                    <span className={`px-2 py-0.5 rounded ${getStatusColor(order.status)}`}>
                      {getStatusLabel(order.status)}
                    </span>
                  </div>
                  {order.description && (
                    <p className="text-muted-foreground mt-1 line-clamp-1">{order.description}</p>
                  )}
                  <div className="text-muted-foreground mt-1">
                    {new Date(order.createdAt).toLocaleDateString('ru-RU')}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Статистика */}
        {isExistingCustomer && (
          <div className="pt-3 border-t">
            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="p-2 bg-primary/10 rounded">
                <div className="text-2xl font-bold text-primary">{orders.length}</div>
                <div className="text-xs text-muted-foreground">Всего заказов</div>
              </div>
              <div className="p-2 bg-green-50 rounded">
                <div className="text-2xl font-bold text-green-600">{completedOrders.length}</div>
                <div className="text-xs text-muted-foreground">Завершено</div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
