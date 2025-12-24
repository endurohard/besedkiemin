import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { shipmentsApi } from '@/lib/api';
import { Shipment, ShipmentStatus, UserRole } from '@/types';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Loader2, Printer, Package, TruckIcon, CheckCircle, XCircle, Search } from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { printWaybill } from '@/components/WaybillPrint';
import { useAuthStore } from '@/store/authStore';

export const ShipmentsPage = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [printingShipmentId, setPrintingShipmentId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<ShipmentStatus | 'ALL'>('ALL');

  const { data: shipments, isLoading, error } = useQuery({
    queryKey: ['shipments'],
    queryFn: shipmentsApi.getAll,
    refetchInterval: 30000,
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: ShipmentStatus }) =>
      shipmentsApi.updateStatus(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shipments'] });
    },
  });

  const filteredShipments = useMemo(() => {
    if (!shipments) return [];

    return shipments.filter((shipment) => {
      const matchesSearch = searchQuery === '' ||
        shipment.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        shipment.customerPhone.includes(searchQuery) ||
        shipment.deliveryAddress.toLowerCase().includes(searchQuery.toLowerCase()) ||
        shipment.items.some(item => (item.inventoryItem?.name || '').toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesStatus = statusFilter === 'ALL' || shipment.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [shipments, searchQuery, statusFilter]);

  const handlePrintWaybill = async (shipmentId: string) => {
    try {
      setPrintingShipmentId(shipmentId);
      const waybillData = await shipmentsApi.getWaybillData(shipmentId);
      printWaybill(waybillData);
    } catch (error) {
      console.error('Ошибка при получении данных путевого листа:', error);
      alert('Не удалось загрузить данные для печати');
    } finally {
      setPrintingShipmentId(null);
    }
  };

  const handleUpdateStatus = (shipmentId: string, newStatus: ShipmentStatus) => {
    if (confirm(`Изменить статус отгрузки?`)) {
      updateStatusMutation.mutate({ id: shipmentId, status: newStatus });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      PENDING: { label: 'Ожидает', color: 'bg-yellow-100 text-yellow-800', icon: Package },
      IN_TRANSIT: { label: 'В пути', color: 'bg-blue-100 text-blue-800', icon: TruckIcon },
      DELIVERED: { label: 'Доставлено', color: 'bg-green-100 text-green-800', icon: CheckCircle },
      CANCELLED: { label: 'Отменено', color: 'bg-red-100 text-red-800', icon: XCircle },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.PENDING;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="w-3 h-3" />
        {config.label}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-800 rounded-lg">
        Ошибка загрузки отгрузок
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4">
      <div>
        <h1 className="text-2xl font-bold">Отгрузки со склада</h1>
        <p className="text-sm text-muted-foreground">
          Управление отгрузками и печать путевых листов
        </p>
      </div>

      {/* Фильтры */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-3">
            <div className="flex-1 min-w-[250px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Поиск по клиенту, адресу, товару..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant={statusFilter === 'ALL' ? 'default' : 'outline'}
                onClick={() => setStatusFilter('ALL')}
                size="sm"
              >
                Все
              </Button>
              <Button
                variant={statusFilter === ShipmentStatus.PENDING ? 'default' : 'outline'}
                onClick={() => setStatusFilter(ShipmentStatus.PENDING)}
                size="sm"
              >
                Ожидает
              </Button>
              <Button
                variant={statusFilter === ShipmentStatus.IN_TRANSIT ? 'default' : 'outline'}
                onClick={() => setStatusFilter(ShipmentStatus.IN_TRANSIT)}
                size="sm"
              >
                В пути
              </Button>
              <Button
                variant={statusFilter === ShipmentStatus.DELIVERED ? 'default' : 'outline'}
                onClick={() => setStatusFilter(ShipmentStatus.DELIVERED)}
                size="sm"
              >
                Доставлено
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Таблица */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Дата</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Заказ</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Статус</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Клиент</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Телефон</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Адрес</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Товары</th>
                  <th className="px-4 py-3 text-center font-medium text-gray-600">Действия</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center">
                      <Loader2 className="w-8 h-8 animate-spin mx-auto" />
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center text-red-600">
                      Ошибка загрузки отгрузок
                    </td>
                  </tr>
                ) : filteredShipments.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center text-gray-500">
                      <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>{searchQuery || statusFilter !== 'ALL' ? 'Ничего не найдено' : 'Отгрузок пока нет'}</p>
                    </td>
                  </tr>
                ) : (
                  filteredShipments.map((shipment: Shipment) => (
                    <tr key={shipment.id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-xs">
                          {format(new Date(shipment.createdAt), 'dd.MM.yyyy', { locale: ru })}
                          <br />
                          <span className="text-gray-500">
                            {format(new Date(shipment.createdAt), 'HH:mm', { locale: ru })}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {shipment.orderNumber ? (
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                            {shipment.orderNumber}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-xs">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {getStatusBadge(shipment.status)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="max-w-[150px] truncate" title={shipment.customerName}>
                          {shipment.customerName}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {shipment.customerPhone}
                      </td>
                      <td className="px-4 py-3">
                        <div className="max-w-[200px] truncate" title={shipment.deliveryAddress}>
                          {shipment.deliveryAddress}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="space-y-1">
                          {shipment.items.map((item) => (
                            <div key={item.id} className="text-xs">
                              <span className="font-medium">{item.inventoryItem?.name || '—'}</span>
                              <span className="text-gray-500"> × {item.quantity}</span>
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1">
                          {/* Кнопка печати */}
                          <Button
                            onClick={() => handlePrintWaybill(shipment.id)}
                            disabled={printingShipmentId === shipment.id}
                            size="sm"
                            variant="outline"
                            className="gap-1"
                            title="Печать путевого листа"
                          >
                            {printingShipmentId === shipment.id ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <Printer className="w-3 h-3" />
                            )}
                          </Button>

                          {/* Кнопка "Отгрузил" для статуса PENDING */}
                          {shipment.status === ShipmentStatus.PENDING && (
                            <Button
                              onClick={() => handleUpdateStatus(shipment.id, ShipmentStatus.IN_TRANSIT)}
                              disabled={updateStatusMutation.isPending}
                              size="sm"
                              className="gap-1 bg-blue-600 hover:bg-blue-700"
                              title="Отправить в путь"
                            >
                              <TruckIcon className="w-3 h-3" />
                              <span className="hidden sm:inline">В путь</span>
                            </Button>
                          )}

                          {/* Кнопка "Доставлено" для статуса IN_TRANSIT (только для MANAGER и OWNER) */}
                          {shipment.status === ShipmentStatus.IN_TRANSIT &&
                            (user?.role === UserRole.MANAGER || user?.role === UserRole.OWNER) && (
                              <Button
                                onClick={() => handleUpdateStatus(shipment.id, ShipmentStatus.DELIVERED)}
                                disabled={updateStatusMutation.isPending}
                                size="sm"
                                className="gap-1 bg-green-600 hover:bg-green-700"
                                title="Отметить как доставлено"
                              >
                                <CheckCircle className="w-3 h-3" />
                                <span className="hidden sm:inline">Доставлено</span>
                              </Button>
                            )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Статистика внизу */}
          {filteredShipments.length > 0 && (
            <div className="px-4 py-3 bg-gray-50 border-t text-sm text-gray-600">
              Показано отгрузок: <span className="font-semibold">{filteredShipments.length}</span>
              {(searchQuery || statusFilter !== 'ALL') && shipments && (
                <span className="ml-2">из {shipments.length}</span>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
