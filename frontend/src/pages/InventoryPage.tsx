import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { inventoryApi, shipmentsApi, productTypesApi } from '@/lib/api';
import { CreateShipmentDto, InventoryItem, ProductType } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { AddressInput } from '@/components/AddressInput';
import { CustomerNameInput } from '@/components/CustomerNameInput';
import { Loader2, Package, TruckIcon, XIcon, Search, Plus, PackagePlus } from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { useAuthStore } from '@/store/authStore';

export const InventoryPage = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [showShipmentModal, setShowShipmentModal] = useState(false);
  const [showGroupShipmentModal, setShowGroupShipmentModal] = useState(false);
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItems, setSelectedItems] = useState<Array<{ item: InventoryItem; quantity: number }>>([]);
  const [groupOrderId, setGroupOrderId] = useState<string | null>(null);
  const [groupShipmentForm, setGroupShipmentForm] = useState({
    customerName: '',
    customerPhone: '',
    deliveryAddress: '',
    notes: '',
    orderNumber: '',
  });
  const [shipmentForm, setShipmentForm] = useState<CreateShipmentDto>({
    items: [{
      inventoryItemId: '',
      quantity: 0,
    }],
    customerName: '',
    customerPhone: '',
    deliveryAddress: '',
    notes: '',
  });
  const [addItemForm, setAddItemForm] = useState({
    name: '',
    productTypeId: '',
    quantity: 1,
    notes: '',
  });

  const { data: inventory, isLoading, error } = useQuery({
    queryKey: ['inventory'],
    queryFn: inventoryApi.getAll,
  });

  const { data: summary } = useQuery({
    queryKey: ['inventory-summary'],
    queryFn: inventoryApi.getSummary,
  });

  // Получаем список типов товаров для формы добавления
  const { data: productTypes } = useQuery({
    queryKey: ['product-types'],
    queryFn: () => productTypesApi.getAll(),
  });

  // Мутация для добавления товара на склад
  const addItemMutation = useMutation({
    mutationFn: inventoryApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-summary'] });
      setShowAddItemModal(false);
      setAddItemForm({ name: '', productTypeId: '', quantity: 1, notes: '' });
    },
  });

  const filteredInventory = useMemo(() => {
    if (!inventory) return [];
    if (!searchQuery) return inventory;

    return inventory.filter((item) => {
      const searchLower = searchQuery.toLowerCase();
      return (
        item.name.toLowerCase().includes(searchLower) ||
        item.productType?.name.toLowerCase().includes(searchLower) ||
        item.order?.orderNumber.toLowerCase().includes(searchLower) ||
        item.order?.customerName.toLowerCase().includes(searchLower)
      );
    });
  }, [inventory, searchQuery]);

  const createShipmentMutation = useMutation({
    mutationFn: shipmentsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-summary'] });
      setShowShipmentModal(false);
      setSelectedItem(null);
      resetForm();
    },
  });

  const resetForm = () => {
    setShipmentForm({
      items: [{
        inventoryItemId: '',
        quantity: 0,
      }],
      customerName: '',
      customerPhone: '',
      deliveryAddress: '',
      notes: '',
    });
  };

  const resetGroupForm = () => {
    setSelectedItems([]);
    setGroupOrderId(null);
    setGroupShipmentForm({
      customerName: '',
      customerPhone: '',
      deliveryAddress: '',
      notes: '',
      orderNumber: '',
    });
  };

  const handleCreateShipment = (item: InventoryItem) => {
    setSelectedItem(item);

    // Если телефон = "N/A" (внутренний заказ), заменяем на пустую строку
    const phone = item.order?.customerPhone === 'N/A' ? '' : (item.order?.customerPhone || '');

    setShipmentForm({
      items: [{
        inventoryItemId: item.id,
        quantity: item.quantity,
      }],
      customerName: item.order?.customerName || '',
      customerPhone: phone,
      deliveryAddress: item.order?.customerAddress || '',
      notes: '',
      orderNumber: item.order?.orderNumber || '',
    });
    setShowShipmentModal(true);
  };

  // Отгрузить все готовые позиции заказа одной доставкой
  const handleShipWholeOrder = (orderItem: InventoryItem) => {
    if (!orderItem.orderId) return;
    const orderItems = (inventory || []).filter(
      (i) => i.orderId === orderItem.orderId && i.quantity > 0,
    );
    if (orderItems.length === 0) return;

    setSelectedItems(orderItems.map((i) => ({ item: i, quantity: i.quantity })));
    setGroupOrderId(orderItem.orderId);

    const phone =
      orderItem.order?.customerPhone === 'N/A'
        ? ''
        : orderItem.order?.customerPhone || '';

    setGroupShipmentForm({
      customerName: orderItem.order?.customerName || '',
      customerPhone: phone,
      deliveryAddress: orderItem.order?.customerAddress || '',
      notes: '',
      orderNumber: orderItem.order?.orderNumber || '',
    });
    setShowGroupShipmentModal(true);
  };

  const createGroupShipmentMutation = useMutation({
    mutationFn: shipmentsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-summary'] });
      queryClient.invalidateQueries({ queryKey: ['shipments'] });
      setShowGroupShipmentModal(false);
      resetGroupForm();
    },
  });

  const handleToggleItem = (item: InventoryItem) => {
    const existing = selectedItems.find(si => si.item.id === item.id);
    if (existing) {
      setSelectedItems(selectedItems.filter(si => si.item.id !== item.id));
    } else {
      setSelectedItems([...selectedItems, { item, quantity: Math.min(1, item.quantity) }]);
    }
  };

  const handleQuantityChange = (itemId: string, quantity: number) => {
    setSelectedItems(selectedItems.map(si =>
      si.item.id === itemId ? { ...si, quantity } : si
    ));
  };

  const handleSubmitGroupShipment = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedItems.length === 0) {
      alert('Выберите хотя бы один товар');
      return;
    }
    createGroupShipmentMutation.mutate({
      items: selectedItems.map(si => ({
        inventoryItemId: si.item.id,
        quantity: si.quantity,
      })),
      ...groupShipmentForm,
    });
  };

  const handleSubmitShipment = (e: React.FormEvent) => {
    e.preventDefault();
    createShipmentMutation.mutate(shipmentForm);
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
          Ошибка загрузки складских остатков: {(error as Error).message}
        </div>
      </div>
    );
  }

  // Группируем товары по типам для сводки
  const totalItems = inventory?.length || 0;
  const totalQuantity = inventory?.reduce((sum, item) => sum + item.quantity, 0) || 0;

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Складские остатки</h1>
          <p className="text-sm text-muted-foreground">
            Управление товарами на складе и создание отгрузок
          </p>
        </div>
        {(user?.role?.code === 'OWNER' || user?.role?.code === 'MANAGER' || user?.role?.code === 'SUPER_ADMIN' || user?.role?.code === 'WAREHOUSE') && (
          <div className="flex gap-2">
            <Button
              onClick={() => setShowAddItemModal(true)}
              variant="outline"
              className="gap-2"
            >
              <PackagePlus size={16} />
              Добавить товар
            </Button>
            <Button
              onClick={() => setShowGroupShipmentModal(true)}
              className="gap-2"
            >
              <Plus size={16} />
              Создать отгрузку
            </Button>
          </div>
        )}
      </div>

      {/* Статистика */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="bg-primary/10 border border-blue-200 p-3 rounded-lg">
          <div className="flex items-center gap-2 text-primary text-xs font-medium mb-1">
            <Package size={14} />
            Позиций
          </div>
          <div className="text-2xl font-bold text-blue-900">{totalItems}</div>
        </div>
        <div className="bg-green-50 border border-green-200 p-3 rounded-lg">
          <div className="flex items-center gap-2 text-green-600 text-xs font-medium mb-1">
            <Package size={14} />
            Всего единиц
          </div>
          <div className="text-2xl font-bold text-green-900">{totalQuantity}</div>
        </div>
        <div className="bg-purple-50 border border-purple-200 p-3 rounded-lg">
          <div className="flex items-center gap-2 text-purple-600 text-xs font-medium mb-1">
            <TruckIcon size={14} />
            Типов товаров
          </div>
          <div className="text-2xl font-bold text-purple-900">
            {summary ? Object.keys(summary).length : 0}
          </div>
        </div>
      </div>

      {/* Поиск */}
      <Card>
        <CardContent className="p-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Поиск по товару, типу, заказу, клиенту..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      {/* Таблица товаров */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Товар</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Тип</th>
                  <th className="px-4 py-3 text-center font-medium text-muted-foreground">Кол-во</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Заказ</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Клиент</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Поступило</th>
                  <th className="px-4 py-3 text-center font-medium text-muted-foreground">Действия</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center">
                      <Loader2 className="w-8 h-8 animate-spin mx-auto" />
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-red-600">
                      Ошибка загрузки: {(error as Error).message}
                    </td>
                  </tr>
                ) : filteredInventory.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                      <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>{searchQuery ? 'Ничего не найдено' : 'На складе пока нет товаров'}</p>
                    </td>
                  </tr>
                ) : (
                  filteredInventory.map((item) => (
                    <tr key={item.id} className="border-b hover:bg-muted/50">
                      <td className="px-4 py-3">
                        <div className="max-w-[200px] truncate font-medium" title={item.name}>
                          {item.name}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 bg-primary/20 text-primary/90 rounded text-xs">
                          {item.productType?.name}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">
                          {item.quantity}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="max-w-[120px] truncate" title={item.order?.orderNumber}>
                          {item.order?.orderNumber}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="max-w-[150px] truncate" title={item.order?.customerName}>
                          {item.order?.customerName}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-xs text-muted-foreground">
                        {format(new Date(item.receivedAt), 'dd.MM.yyyy HH:mm', { locale: ru })}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            onClick={() => handleCreateShipment(item)}
                            disabled={item.quantity === 0}
                            size="sm"
                            variant="outline"
                            className="gap-1"
                          >
                            <TruckIcon size={14} />
                            <span className="hidden sm:inline">Списать</span>
                          </Button>
                          {(() => {
                            if (!item.orderId || item.quantity === 0) return null;
                            const readyInOrder = (inventory || []).filter(
                              (i) => i.orderId === item.orderId && i.quantity > 0,
                            ).length;
                            if (readyInOrder < 2) return null;
                            return (
                              <Button
                                onClick={() => handleShipWholeOrder(item)}
                                size="sm"
                                variant="default"
                                className="gap-1"
                                title={`Отгрузить все готовые позиции заказа (${readyInOrder}) одной доставкой`}
                              >
                                <PackagePlus size={14} />
                                <span className="hidden sm:inline">Отгрузить заказ ({readyInOrder})</span>
                              </Button>
                            );
                          })()}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Статистика внизу */}
          {filteredInventory.length > 0 && (
            <div className="px-4 py-3 bg-muted/50 border-t text-sm text-muted-foreground">
              Показано товаров: <span className="font-semibold">{filteredInventory.length}</span>
              {searchQuery && inventory && (
                <span className="ml-2">из {inventory.length}</span>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Модальное окно создания групповой отгрузки */}
      {showGroupShipmentModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <CardHeader className="flex flex-row items-center justify-between border-b pb-3">
              <CardTitle className="text-lg">Создать отгрузку (несколько товаров)</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowGroupShipmentModal(false);
                  resetGroupForm();
                }}
              >
                <XIcon size={18} />
              </Button>
            </CardHeader>
            <CardContent className="pt-4">
              <form onSubmit={handleSubmitGroupShipment} className="space-y-4">
                {/* Выбор товаров */}
                <div>
                  <h3 className="text-sm font-semibold mb-2">Выберите товары для отгрузки</h3>
                  <div className="border rounded-lg max-h-64 overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50 border-b sticky top-0">
                        <tr>
                          <th className="px-3 py-2 text-left font-medium text-muted-foreground w-12"></th>
                          <th className="px-3 py-2 text-left font-medium text-muted-foreground">Товар</th>
                          <th className="px-3 py-2 text-left font-medium text-muted-foreground">Тип</th>
                          <th className="px-3 py-2 text-center font-medium text-muted-foreground">Доступно</th>
                          <th className="px-3 py-2 text-center font-medium text-muted-foreground">Количество</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredInventory
                          .filter((i) => i.quantity > 0)
                          .sort(
                            (a, b) =>
                              (b.orderId === groupOrderId ? 1 : 0) -
                              (a.orderId === groupOrderId ? 1 : 0),
                          )
                          .map((item) => {
                          const selected = selectedItems.find(si => si.item.id === item.id);
                          return (
                            <tr
                              key={item.id}
                              className={`border-b hover:bg-muted/50 ${
                                groupOrderId && item.orderId === groupOrderId ? 'bg-primary/10' : ''
                              }`}
                            >
                              <td className="px-3 py-2">
                                <input
                                  type="checkbox"
                                  checked={!!selected}
                                  onChange={() => handleToggleItem(item)}
                                  disabled={item.quantity === 0}
                                  className="w-4 h-4"
                                />
                              </td>
                              <td className="px-3 py-2">
                                <div className="max-w-[200px] truncate" title={item.name}>
                                  {item.name}
                                </div>
                              </td>
                              <td className="px-3 py-2">
                                <span className="px-2 py-1 bg-primary/20 text-primary/90 rounded text-xs">
                                  {item.productType?.name}
                                </span>
                              </td>
                              <td className="px-3 py-2 text-center">
                                <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">
                                  {item.quantity}
                                </span>
                              </td>
                              <td className="px-3 py-2">
                                {selected && (
                                  <Input
                                    type="number"
                                    min="1"
                                    max={item.quantity}
                                    value={selected.quantity}
                                    onChange={(e) => handleQuantityChange(item.id, parseInt(e.target.value) || 1)}
                                    className="h-7 w-20 mx-auto text-center"
                                    required
                                  />
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  {selectedItems.length > 0 && (
                    <div className="mt-2 text-xs text-muted-foreground">
                      Выбрано товаров: <span className="font-semibold">{selectedItems.length}</span>
                    </div>
                  )}
                </div>

                {/* Номер заказа */}
                <div>
                  <h3 className="text-sm font-semibold mb-2">Номер заказа</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium mb-1">Номер заказа (можно ввести вручную)</label>
                      <Input
                        value={groupShipmentForm.orderNumber}
                        onChange={(e) =>
                          setGroupShipmentForm({ ...groupShipmentForm, orderNumber: e.target.value })
                        }
                        placeholder="ORD-001 или свой номер"
                        className="h-8"
                      />
                    </div>
                  </div>
                </div>

                {/* Данные клиента */}
                <div>
                  <h3 className="text-sm font-semibold mb-2">Информация о получателе</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium mb-1">Имя клиента *</label>
                      <CustomerNameInput
                        value={groupShipmentForm.customerName}
                        onChange={(name, phone, address) => {
                          setGroupShipmentForm({
                            ...groupShipmentForm,
                            customerName: name,
                            ...(phone && { customerPhone: phone }),
                            ...(address && { deliveryAddress: address }),
                          });
                        }}
                        required
                        className="h-8"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium mb-1">
                        Телефон {groupShipmentForm.customerName !== 'Внутренний заказ' && '*'}
                      </label>
                      <Input
                        value={groupShipmentForm.customerPhone}
                        onChange={(e) =>
                          setGroupShipmentForm({ ...groupShipmentForm, customerPhone: e.target.value })
                        }
                        placeholder="+7999 999 99 99"
                        required={groupShipmentForm.customerName !== 'Внутренний заказ'}
                        className="h-8"
                      />
                    </div>
                  </div>
                </div>

                {/* Адрес */}
                <div>
                  <h3 className="text-sm font-semibold mb-2">Доставка</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium mb-1">Адрес доставки *</label>
                      <AddressInput
                        value={groupShipmentForm.deliveryAddress}
                        onChange={(value) =>
                          setGroupShipmentForm({ ...groupShipmentForm, deliveryAddress: value })
                        }
                        placeholder="Начните вводить адрес..."
                        required
                        className="h-8"
                      />
                    </div>
                  </div>
                </div>

                {/* Примечания */}
                <div>
                  <label className="block text-xs font-medium mb-1">Примечания</label>
                  <textarea
                    className="w-full px-3 py-2 border rounded-md text-sm"
                    rows={2}
                    value={groupShipmentForm.notes}
                    onChange={(e) =>
                      setGroupShipmentForm({ ...groupShipmentForm, notes: e.target.value })
                    }
                  />
                </div>

                {/* Ошибка */}
                {createGroupShipmentMutation.isError && (
                  <div className="bg-red-50 border border-red-200 text-red-800 p-2 rounded-md text-xs">
                    Ошибка: {(createGroupShipmentMutation.error as Error).message}
                  </div>
                )}

                {/* Кнопки */}
                <div className="flex gap-2 justify-end pt-3 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setShowGroupShipmentModal(false);
                      resetGroupForm();
                    }}
                  >
                    Отмена
                  </Button>
                  <Button
                    type="submit"
                    disabled={createGroupShipmentMutation.isPending || selectedItems.length === 0}
                    size="sm"
                    className="gap-2"
                  >
                    {createGroupShipmentMutation.isPending && <Loader2 className="animate-spin" size={14} />}
                    Создать отгрузку ({selectedItems.length})
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Модальное окно создания отгрузки */}
      {showShipmentModal && selectedItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <CardHeader className="flex flex-row items-center justify-between border-b pb-3">
              <CardTitle className="text-lg">Создать отгрузку</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowShipmentModal(false);
                  setSelectedItem(null);
                }}
              >
                <XIcon size={18} />
              </Button>
            </CardHeader>
            <CardContent className="pt-4">
              <form onSubmit={handleSubmitShipment} className="space-y-4">
                {/* Информация о товаре */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3 bg-muted/50 rounded-lg">
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">Товар</label>
                    <div className="text-sm font-medium">{selectedItem.name}</div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">Доступно</label>
                    <div className="text-sm font-medium text-green-600">{selectedItem.quantity} шт</div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">
                      Количество для отгрузки *
                    </label>
                    <Input
                      type="number"
                      min="1"
                      max={selectedItem.quantity}
                      value={shipmentForm.items[0]?.quantity || 0}
                      onChange={(e) =>
                        setShipmentForm({
                          ...shipmentForm,
                          items: [{
                            ...shipmentForm.items[0],
                            quantity: parseInt(e.target.value) || 0
                          }]
                        })
                      }
                      required
                      className="h-8"
                    />
                  </div>
                </div>

                {/* Номер заказа */}
                <div>
                  <h3 className="text-sm font-semibold mb-2">Номер заказа</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium mb-1">Номер заказа</label>
                      <Input
                        value={shipmentForm.orderNumber || ''}
                        onChange={(e) =>
                          setShipmentForm({ ...shipmentForm, orderNumber: e.target.value })
                        }
                        placeholder="ORD-001 или свой номер"
                        className="h-8"
                      />
                    </div>
                  </div>
                </div>

                {/* Данные клиента */}
                <div>
                  <h3 className="text-sm font-semibold mb-2">Информация о получателе</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium mb-1">Имя клиента *</label>
                      <CustomerNameInput
                        value={shipmentForm.customerName}
                        onChange={(name, phone, address) => {
                          setShipmentForm({
                            ...shipmentForm,
                            customerName: name,
                            ...(phone && { customerPhone: phone }),
                            ...(address && { deliveryAddress: address }),
                          });
                        }}
                        required
                        className="h-8"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium mb-1">Телефон {shipmentForm.customerName !== 'Внутренний заказ' && '*'}</label>
                      <Input
                        value={shipmentForm.customerPhone}
                        onChange={(e) =>
                          setShipmentForm({ ...shipmentForm, customerPhone: e.target.value })
                        }
                        placeholder="+7999 999 99 99"
                        required={shipmentForm.customerName !== 'Внутренний заказ'}
                        className="h-8"
                      />
                    </div>
                  </div>
                </div>

                {/* Адрес и дата */}
                <div>
                  <h3 className="text-sm font-semibold mb-2">Доставка</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium mb-1">Адрес доставки *</label>
                      <AddressInput
                        value={shipmentForm.deliveryAddress}
                        onChange={(value) =>
                          setShipmentForm({ ...shipmentForm, deliveryAddress: value })
                        }
                        placeholder="Начните вводить адрес..."
                        required
                        className="h-8"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium mb-1">Дата доставки</label>
                      <Input
                        type="datetime-local"
                        value={shipmentForm.deliveryDate || ''}
                        onChange={(e) =>
                          setShipmentForm({ ...shipmentForm, deliveryDate: e.target.value })
                        }
                        className="h-8"
                      />
                    </div>
                  </div>
                </div>

                {/* Примечания */}
                <div>
                  <label className="block text-xs font-medium mb-1">Примечания</label>
                  <textarea
                    className="w-full px-3 py-2 border rounded-md text-sm"
                    rows={2}
                    value={shipmentForm.notes}
                    onChange={(e) =>
                      setShipmentForm({ ...shipmentForm, notes: e.target.value })
                    }
                  />
                </div>

                {/* Ошибка */}
                {createShipmentMutation.isError && (
                  <div className="bg-red-50 border border-red-200 text-red-800 p-2 rounded-md text-xs">
                    Ошибка: {(createShipmentMutation.error as Error).message}
                  </div>
                )}

                {/* Кнопки */}
                <div className="flex gap-2 justify-end pt-3 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setShowShipmentModal(false);
                      setSelectedItem(null);
                    }}
                  >
                    Отмена
                  </Button>
                  <Button
                    type="submit"
                    disabled={createShipmentMutation.isPending}
                    size="sm"
                    className="gap-2"
                  >
                    {createShipmentMutation.isPending && <Loader2 className="animate-spin" size={14} />}
                    Создать отгрузку
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Модальное окно добавления товара на склад */}
      {showAddItemModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="flex flex-row items-center justify-between border-b pb-3">
              <CardTitle className="text-lg">Добавить товар на склад</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowAddItemModal(false);
                  setAddItemForm({ name: '', productTypeId: '', quantity: 1, notes: '' });
                }}
              >
                <XIcon size={18} />
              </Button>
            </CardHeader>
            <CardContent className="pt-4">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  addItemMutation.mutate(addItemForm);
                }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-xs font-medium mb-1">Название товара *</label>
                  <Input
                    value={addItemForm.name}
                    onChange={(e) => setAddItemForm({ ...addItemForm, name: e.target.value })}
                    placeholder="Введите название товара"
                    required
                    className="h-9"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium mb-1">Тип товара *</label>
                  <select
                    value={addItemForm.productTypeId}
                    onChange={(e) => setAddItemForm({ ...addItemForm, productTypeId: e.target.value })}
                    className="w-full h-9 px-3 border rounded-md text-sm"
                    required
                  >
                    <option value="">Выберите тип товара</option>
                    {productTypes?.map((type: ProductType) => (
                      <option key={type.id} value={type.id}>
                        {type.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium mb-1">Количество *</label>
                  <Input
                    type="number"
                    min="1"
                    value={addItemForm.quantity}
                    onChange={(e) => setAddItemForm({ ...addItemForm, quantity: parseInt(e.target.value) || 1 })}
                    required
                    className="h-9"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium mb-1">Примечания</label>
                  <textarea
                    className="w-full px-3 py-2 border rounded-md text-sm"
                    rows={2}
                    value={addItemForm.notes}
                    onChange={(e) => setAddItemForm({ ...addItemForm, notes: e.target.value })}
                    placeholder="Дополнительная информация"
                  />
                </div>

                {addItemMutation.isError && (
                  <div className="bg-red-50 border border-red-200 text-red-800 p-2 rounded-md text-xs">
                    Ошибка: {(addItemMutation.error as Error).message}
                  </div>
                )}

                <div className="flex gap-2 justify-end pt-3 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setShowAddItemModal(false);
                      setAddItemForm({ name: '', productTypeId: '', quantity: 1, notes: '' });
                    }}
                  >
                    Отмена
                  </Button>
                  <Button
                    type="submit"
                    disabled={addItemMutation.isPending}
                    size="sm"
                    className="gap-2"
                  >
                    {addItemMutation.isPending && <Loader2 className="animate-spin" size={14} />}
                    Добавить
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};
