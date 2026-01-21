import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import api from '@/lib/api';

interface CatalogOrderItem {
  id: string;
  productId: string;
  quantity: number;
  price: number;
  product: {
    name: string;
  };
}

interface CatalogOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  deliveryAddress?: string;
  comment?: string;
  cancellationReason?: string;
  status: 'NEW' | 'CONTACTED' | 'IN_WORK' | 'COMPLETED' | 'CANCELLED';
  totalAmount: number | null;
  createdAt: string;
  contactedAt?: string;
  contactedBy?: string;
  processedAt?: string;
  processedBy?: string;
  items: CatalogOrderItem[];
}

const statusLabels: Record<string, string> = {
  NEW: 'Новый',
  CONTACTED: 'Связались',
  IN_WORK: 'В работе',
  COMPLETED: 'Завершён',
  CANCELLED: 'Отменён',
};

const statusColors: Record<string, string> = {
  NEW: 'bg-blue-500 text-white',
  CONTACTED: 'bg-yellow-500 text-white',
  IN_WORK: 'bg-purple-500 text-white',
  COMPLETED: 'bg-green-500 text-white',
  CANCELLED: 'bg-red-500 text-white',
};

const CatalogOrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<CatalogOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    deliveryAddress: '',
  });

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await api.get('/catalog-orders');
      // Backend возвращает пагинированный ответ { data: [...], meta: {...} }
      setOrders(response.data.data || []);
    } catch (error) {
      console.error('Ошибка загрузки заказов:', error);
      alert('Не удалось загрузить заказы');
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, status: string) => {
    try {
      await api.patch(`/catalog-orders/${orderId}`, { status });
      alert('Статус заказа обновлён');
      fetchOrders();
    } catch (error) {
      console.error('Ошибка обновления статуса:', error);
      alert('Не удалось обновить статус');
    }
  };

  const markContacted = async (orderId: string) => {
    if (!confirm('Отметить, что связались с клиентом?')) return;

    try {
      await api.post(`/catalog-orders/${orderId}/mark-contacted`);
      alert('Отмечено: связались с клиентом');
      fetchOrders();
    } catch (error) {
      console.error('Ошибка:', error);
      alert('Не удалось отметить действие');
    }
  };

  const markProcessed = async (orderId: string) => {
    if (!confirm('Оформить заказ и отправить в производство?')) return;

    try {
      await api.post(`/catalog-orders/${orderId}/mark-processed`);
      alert('Заказ оформлен и отправлен в производство!');
      fetchOrders();
    } catch (error) {
      console.error('Ошибка:', error);
      alert('Не удалось оформить заказ');
    }
  };

  const startEditOrder = (order: CatalogOrder) => {
    setEditingOrderId(order.id);
    setEditForm({
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      customerEmail: order.customerEmail || '',
      deliveryAddress: order.deliveryAddress || '',
    });
  };

  const cancelEdit = () => {
    setEditingOrderId(null);
    setEditForm({
      customerName: '',
      customerPhone: '',
      customerEmail: '',
      deliveryAddress: '',
    });
  };

  const saveOrderEdit = async (orderId: string) => {
    try {
      await api.patch(`/catalog-orders/${orderId}`, editForm);
      alert('Данные заказа обновлены');
      setEditingOrderId(null);
      fetchOrders();
    } catch (error) {
      console.error('Ошибка:', error);
      alert('Не удалось обновить заказ');
    }
  };

  const cancelOrder = async (orderId: string) => {
    const cancellationReason = prompt('Укажите причину отмены заказа:');
    if (!cancellationReason || cancellationReason.trim() === '') {
      alert('Необходимо указать причину отмены');
      return;
    }

    if (!confirm('Вы уверены, что хотите отменить этот заказ?')) return;

    try {
      await api.post(`/catalog-orders/${orderId}/cancel`, { cancellationReason });
      alert('Заказ отменён');
      fetchOrders();
    } catch (error) {
      console.error('Ошибка:', error);
      alert('Не удалось отменить заказ');
    }
  };

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customerPhone.includes(searchQuery) ||
      order.customerEmail?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-lg">Загрузка заказов...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Заказы с сайта</h1>
        <div className="text-lg px-4 py-2 bg-gray-100 rounded">
          Всего: {orders.length}
        </div>
      </div>

      {/* Фильтры */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4 flex-wrap">
            <Input
              placeholder="Поиск по имени, телефону, email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 min-w-[200px]"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border rounded-md min-w-[200px]"
            >
              <option value="all">Все статусы</option>
              <option value="NEW">Новые</option>
              <option value="CONTACTED">Связались</option>
              <option value="IN_WORK">В работе</option>
              <option value="COMPLETED">Завершённые</option>
              <option value="CANCELLED">Отменённые</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Заказы */}
      {filteredOrders.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <p className="text-center text-gray-500">
              {searchQuery || statusFilter !== 'all'
                ? 'Заказы не найдены'
                : 'Заказов с сайта пока нет'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <Card key={order.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <CardTitle className="text-xl">
                      {order.orderNumber} - {order.customerName}
                    </CardTitle>
                    <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                      <div>📞 {order.customerPhone}</div>
                      {order.customerEmail && <div>✉️ {order.customerEmail}</div>}
                      {order.deliveryAddress && <div>📍 {order.deliveryAddress}</div>}
                      <div>📅 {formatDate(order.createdAt)}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded text-sm ${statusColors[order.status]}`}>
                      {statusLabels[order.status]}
                    </span>
                    <select
                      value={order.status}
                      onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                      className="px-3 py-1 border rounded text-sm"
                    >
                      <option value="NEW">Новый</option>
                      <option value="CONTACTED">Связались</option>
                      <option value="IN_WORK">В работе</option>
                      <option value="COMPLETED">Завершён</option>
                      <option value="CANCELLED">Отменён</option>
                    </select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Кнопки действий */}
                  {order.status === 'NEW' && (
                    <div className="flex gap-2">
                      <Button
                        onClick={() => markContacted(order.id)}
                        className="bg-yellow-500 hover:bg-yellow-600 text-white"
                      >
                        ✓ Связались
                      </Button>
                      <Button
                        onClick={() => markProcessed(order.id)}
                        className="bg-green-500 hover:bg-green-600 text-white"
                      >
                        ✓ Оформили → В производство
                      </Button>
                      <Button
                        onClick={() => cancelOrder(order.id)}
                        className="bg-red-500 hover:bg-red-600 text-white"
                      >
                        ✗ Отменить
                      </Button>
                    </div>
                  )}

                  {order.status === 'CONTACTED' && (
                    <>
                      {editingOrderId === order.id ? (
                        <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                          <h3 className="font-medium mb-2">Редактирование данных клиента</h3>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-sm font-medium mb-1">Имя клиента</label>
                              <Input
                                value={editForm.customerName}
                                onChange={(e) => setEditForm({ ...editForm, customerName: e.target.value })}
                                placeholder="Имя клиента"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium mb-1">Телефон</label>
                              <Input
                                value={editForm.customerPhone}
                                onChange={(e) => setEditForm({ ...editForm, customerPhone: e.target.value })}
                                placeholder="Телефон"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium mb-1">Email</label>
                              <Input
                                value={editForm.customerEmail}
                                onChange={(e) => setEditForm({ ...editForm, customerEmail: e.target.value })}
                                placeholder="Email"
                                type="email"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium mb-1">Адрес доставки</label>
                              <Input
                                value={editForm.deliveryAddress}
                                onChange={(e) => setEditForm({ ...editForm, deliveryAddress: e.target.value })}
                                placeholder="Адрес доставки"
                              />
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              onClick={() => saveOrderEdit(order.id)}
                              className="bg-green-500 hover:bg-green-600 text-white"
                            >
                              💾 Сохранить
                            </Button>
                            <Button
                              onClick={cancelEdit}
                              className="bg-gray-500 hover:bg-gray-600 text-white"
                            >
                              Отмена
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <Button
                            onClick={() => startEditOrder(order)}
                            className="bg-blue-500 hover:bg-blue-600 text-white"
                          >
                            ✏️ Редактировать данные
                          </Button>
                          <Button
                            onClick={() => markProcessed(order.id)}
                            className="bg-green-500 hover:bg-green-600 text-white"
                          >
                            ✓ Оформили → В производство
                          </Button>
                          <Button
                            onClick={() => cancelOrder(order.id)}
                            className="bg-red-500 hover:bg-red-600 text-white"
                          >
                            ✗ Отменить
                          </Button>
                        </div>
                      )}
                    </>
                  )}

                  {/* Статистика действий */}
                  {(order.contactedAt || order.processedAt) && (
                    <div className="bg-blue-50 p-3 rounded text-sm space-y-1">
                      {order.contactedAt && (
                        <div>
                          ✓ Связались: {formatDate(order.contactedAt)}
                        </div>
                      )}
                      {order.processedAt && (
                        <div>
                          ✓ Оформили: {formatDate(order.processedAt)}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Товары */}
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left">Товар</th>
                          <th className="px-4 py-2 text-center">Количество</th>
                          <th className="px-4 py-2 text-right">Цена</th>
                          <th className="px-4 py-2 text-right">Сумма</th>
                        </tr>
                      </thead>
                      <tbody>
                        {order.items.map((item) => (
                          <tr key={item.id} className="border-t">
                            <td className="px-4 py-2">
                              📦 {item.product.name}
                            </td>
                            <td className="px-4 py-2 text-center">{item.quantity}</td>
                            <td className="px-4 py-2 text-right">
                              {item.price.toLocaleString()} ₽
                            </td>
                            <td className="px-4 py-2 text-right font-medium">
                              {(item.price * item.quantity).toLocaleString()} ₽
                            </td>
                          </tr>
                        ))}
                        <tr className="border-t bg-gray-50 font-bold">
                          <td colSpan={3} className="px-4 py-2 text-right">
                            Итого:
                          </td>
                          <td className="px-4 py-2 text-right text-lg">
                            {order.totalAmount ? `${order.totalAmount.toLocaleString()} ₽` : '—'}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Комментарий */}
                  {order.comment && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm font-medium mb-1">Комментарий клиента:</p>
                      <p className="text-sm text-gray-700">{order.comment}</p>
                    </div>
                  )}

                  {/* Причина отмены */}
                  {order.status === 'CANCELLED' && order.cancellationReason && (
                    <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                      <p className="text-sm font-medium mb-1 text-red-800">Причина отмены:</p>
                      <p className="text-sm text-red-700">{order.cancellationReason}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default CatalogOrdersPage;
