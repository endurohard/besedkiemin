import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ordersApi, productsApi } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { OrderStatus, ProductionStage, UserRole, Product, Order } from '@/types';
import { useAuthStore } from '@/store/authStore';
import { Package, Clock, CheckCircle, ArrowRight, Plus, Search, Calendar, X } from 'lucide-react';
import { CreateOrderModal } from '@/components/CreateOrderModal';
import { getPriorityLabel, getPriorityColor, getPrioritySortOrder } from '@/lib/priority-utils';

export const KanbanPage = () => {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [isCreateOrderModalOpen, setIsCreateOrderModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'ALL'>('ALL');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const { data: orders = [], isLoading: ordersLoading } = useQuery({
    queryKey: ['orders'],
    queryFn: () => ordersApi.getAll(),
  });

  const { data: products = [], isLoading: productsLoading } = useQuery({
    queryKey: ['products'],
    queryFn: () => productsApi.getAll(),
  });

  // Получаем задачи текущего пользователя для фильтрации
  const { data: myTasks = [] } = useQuery({
    queryKey: ['my-tasks'],
    queryFn: async () => {
      const response = await fetch('http://localhost:3000/tasks/my', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      return response.json();
    },
    enabled: user?.role !== UserRole.OWNER && user?.role !== UserRole.MANAGER,
  });

  const moveProductMutation = useMutation({
    mutationFn: ({ productId, stage }: { productId: string; stage: ProductionStage }) =>
      productsApi.moveToStage(productId, { stage }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });

  // Определяем какие этапы доступны для текущей роли
  const getRoleStages = (role: UserRole) => {
    switch (role) {
      case UserRole.MANAGER:
        return Object.values(ProductionStage);
      case UserRole.DESIGNER:
        return [ProductionStage.PENDING, ProductionStage.DESIGN];
      case UserRole.PREPARER:
        return [ProductionStage.DESIGN, ProductionStage.PREPARATION];
      case UserRole.PAINTER:
        return [ProductionStage.PREPARATION, ProductionStage.PAINTING, ProductionStage.REJECTED];
      case UserRole.WAREHOUSE:
        return [ProductionStage.PAINTING, ProductionStage.QUALITY_CHECK, ProductionStage.COMPLETED, ProductionStage.REJECTED];
      default:
        return [];
    }
  };

  // Определяем следующий этап для перемещения
  const getNextStage = (currentStage: ProductionStage, role: UserRole): ProductionStage | null => {
    switch (role) {
      case UserRole.DESIGNER:
        if (currentStage === ProductionStage.PENDING) return ProductionStage.DESIGN;
        if (currentStage === ProductionStage.DESIGN) return ProductionStage.PREPARATION;
        break;
      case UserRole.PREPARER:
        if (currentStage === ProductionStage.DESIGN) return ProductionStage.PREPARATION;
        if (currentStage === ProductionStage.PREPARATION) return ProductionStage.PAINTING;
        break;
      case UserRole.PAINTER:
        if (currentStage === ProductionStage.PREPARATION || currentStage === ProductionStage.REJECTED)
          return ProductionStage.PAINTING;
        if (currentStage === ProductionStage.PAINTING) return ProductionStage.QUALITY_CHECK;
        break;
      case UserRole.WAREHOUSE:
        if (currentStage === ProductionStage.PAINTING) return ProductionStage.QUALITY_CHECK;
        if (currentStage === ProductionStage.QUALITY_CHECK) return ProductionStage.COMPLETED;
        break;
    }
    return null;
  };

  const canMoveProduct = (product: Product) => {
    if (!user) return false;
    return getNextStage(product.stage, user.role) !== null;
  };

  const handleMoveProduct = (product: Product) => {
    if (!user) return;
    const nextStage = getNextStage(product.stage, user.role);
    if (nextStage) {
      moveProductMutation.mutate({ productId: product.id, stage: nextStage });
    }
  };

  // Определяем текст кнопки в зависимости от действия
  const getButtonText = (product: Product) => {
    if (!user) return 'Перевести далее';
    const currentStage = product.stage;
    const nextStage = getNextStage(currentStage, user.role);

    // Определяем основные рабочие этапы для каждой роли
    const roleMainStage: Record<UserRole, ProductionStage | null> = {
      [UserRole.SUPER_ADMIN]: null,
      [UserRole.OWNER]: null,
      [UserRole.MANAGER]: null,
      [UserRole.DESIGNER]: ProductionStage.DESIGN,
      [UserRole.PREPARER]: ProductionStage.PREPARATION,
      [UserRole.PAINTER]: ProductionStage.PAINTING,
      [UserRole.WAREHOUSE]: ProductionStage.QUALITY_CHECK,
    };

    const mainStage = roleMainStage[user.role];

    // Если переходим В свой основной этап - это "Принять в работу"
    if (nextStage === mainStage) {
      return 'Принять в работу';
    }

    // Если переходим ИЗ своего основного этапа - это "Передать дальше"
    if (currentStage === mainStage) {
      return 'Передать дальше';
    }

    return 'Перевести далее';
  };

  // Получаем список заказов с текущими задачами пользователя
  const myOrderIds = useMemo(() => {
    if (!user || user.role === UserRole.OWNER || user.role === UserRole.MANAGER) {
      return null; // OWNER и MANAGER видят все
    }
    const orderIds = new Set<string>();
    myTasks.forEach((task: any) => {
      if (task.product?.orderId) {
        orderIds.add(task.product.orderId);
      }
    });
    return orderIds;
  }, [myTasks, user]);

  // Фильтрация продуктов для сотрудников (только из заказов с их задачами)
  const filteredProducts = useMemo(() => {
    if (!myOrderIds) return products; // OWNER/MANAGER видят все
    return products.filter((product) => myOrderIds.has(product.orderId));
  }, [products, myOrderIds]);

  const allowedStages = user ? getRoleStages(user.role) : [];
  const myProducts = filteredProducts.filter((p) => allowedStages.includes(p.stage));

  const getProductsByStage = (stage: ProductionStage) => {
    return myProducts
      .filter((product) => product.stage === stage)
      .sort((a, b) => {
        // Сортировка по приоритету заказа (срочные первыми)
        const priorityA = a.order?.priority || 'NORMAL';
        const priorityB = b.order?.priority || 'NORMAL';
        return getPrioritySortOrder(priorityA as any) - getPrioritySortOrder(priorityB as any);
      });
  };

  const getStageColor = (stage: ProductionStage) => {
    switch (stage) {
      case ProductionStage.PENDING:
        return 'bg-gray-100 text-gray-700';
      case ProductionStage.DESIGN:
        return 'bg-purple-100 text-purple-700';
      case ProductionStage.PREPARATION:
        return 'bg-blue-100 text-blue-700';
      case ProductionStage.PAINTING:
        return 'bg-yellow-100 text-yellow-700';
      case ProductionStage.QUALITY_CHECK:
        return 'bg-orange-100 text-orange-700';
      case ProductionStage.COMPLETED:
        return 'bg-green-100 text-green-700';
      case ProductionStage.REJECTED:
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getStageName = (stage: ProductionStage) => {
    switch (stage) {
      case ProductionStage.PENDING:
        return 'Ожидает';
      case ProductionStage.DESIGN:
        return 'Проектирование';
      case ProductionStage.PREPARATION:
        return 'Заготовка';
      case ProductionStage.PAINTING:
        return 'Покраска';
      case ProductionStage.QUALITY_CHECK:
        return 'Проверка качества';
      case ProductionStage.COMPLETED:
        return 'Завершено';
      case ProductionStage.REJECTED:
        return 'Брак';
      default:
        return stage;
    }
  };

  const getRoleName = (role: UserRole) => {
    switch (role) {
      case UserRole.MANAGER:
        return 'Менеджер';
      case UserRole.DESIGNER:
        return 'Дизайнер';
      case UserRole.PREPARER:
        return 'Заготовщик';
      case UserRole.PAINTER:
        return 'Маляр';
      case UserRole.WAREHOUSE:
        return 'Складист';
      default:
        return role;
    }
  };

  // Функция для расчета прогресса заказа
  const getOrderProgress = (order: Order) => {
    if (!order.products || order.products.length === 0) return 0;
    const completedProducts = order.products.filter(p => p.stage === ProductionStage.COMPLETED).length;
    return Math.round((completedProducts / order.products.length) * 100);
  };

  // Фильтрация заказов
  const filteredOrders = useMemo(() => {
    let ordersToFilter = orders;

    // Для сотрудников показываем только заказы с их задачами
    if (myOrderIds) {
      ordersToFilter = orders.filter((order) => myOrderIds.has(order.id));
    }

    return ordersToFilter.filter((order) => {
      const matchesSearch = searchQuery === '' ||
        order.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (order.customerPhone && order.customerPhone.includes(searchQuery)) ||
        order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = statusFilter === 'ALL' || order.status === statusFilter;

      // Фильтрация по датам
      let matchesDateFrom = true;
      let matchesDateTo = true;

      if (dateFrom) {
        const fromDate = new Date(dateFrom);
        fromDate.setHours(0, 0, 0, 0);
        const orderDate = new Date(order.createdAt);
        matchesDateFrom = orderDate >= fromDate;
      }

      if (dateTo) {
        const toDate = new Date(dateTo);
        toDate.setHours(23, 59, 59, 999);
        const orderDate = new Date(order.createdAt);
        matchesDateTo = orderDate <= toDate;
      }

      return matchesSearch && matchesStatus && matchesDateFrom && matchesDateTo;
    });
  }, [orders, searchQuery, statusFilter, myOrderIds, dateFrom, dateTo]);

  // Сброс фильтров по датам
  const clearDateFilters = () => {
    setDateFrom('');
    setDateTo('');
  };

  if (ordersLoading || productsLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg text-muted-foreground">Загрузка...</div>
      </div>
    );
  }

  return (
    <>
      <div className="flex h-[calc(100vh-49px)] bg-gray-50">
        {/* Основная область с продуктами */}
        <div className="flex-1 overflow-auto p-4">
          <div className="mb-4">
            <h1 className="text-xl font-bold text-gray-900">Управление производством</h1>
            <p className="text-gray-600 text-sm">
              Роль: <span className="font-medium">{getRoleName(user!.role)}</span> |{' '}
              {user?.firstName} {user?.lastName}
            </p>
          </div>

          {/* Мои продукты для работы (скрываем для менеджера и владельца) */}
          {user?.role !== UserRole.MANAGER && user?.role !== UserRole.OWNER && (
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">
                Мои задачи ({myProducts.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {myProducts.map((product) => (
                  <Card
                    key={product.id}
                    className="hover:shadow-lg transition-shadow border-l-4"
                    style={{
                      borderLeftColor: getStageColor(product.stage).includes('purple')
                        ? '#a855f7'
                        : getStageColor(product.stage).includes('blue')
                        ? '#3b82f6'
                        : getStageColor(product.stage).includes('yellow')
                        ? '#eab308'
                        : getStageColor(product.stage).includes('red')
                        ? '#ef4444'
                        : '#6b7280',
                    }}
                  >
                    <CardHeader className="pb-2 pt-3 px-3">
                      <div className="flex items-center justify-between gap-2">
                        <CardTitle className="text-sm font-semibold truncate">
                          {product.name}
                        </CardTitle>
                        <span
                          className={`text-xs px-1.5 py-0.5 rounded whitespace-nowrap ${getStageColor(
                            product.stage
                          )}`}
                        >
                          {getStageName(product.stage)}
                        </span>
                      </div>
                      {product.order?.priority && (
                        <div className="mt-1">
                          <span
                            className={`text-xs px-1.5 py-0.5 rounded border ${getPriorityColor(
                              product.order.priority
                            )}`}
                          >
                            {getPriorityLabel(product.order.priority)}
                          </span>
                        </div>
                      )}
                    </CardHeader>
                    <CardContent className="px-3 pb-3">
                      <div className="space-y-1 text-xs text-gray-600">
                        <p>
                          <span className="font-medium">Тип:</span> {product.productType?.name || 'Не указан'}
                        </p>
                        <p>
                          <span className="font-medium">Кол-во:</span> {product.quantity}
                        </p>
                        {canMoveProduct(product) && (
                          <button
                            onClick={() => handleMoveProduct(product)}
                            disabled={moveProductMutation.isPending}
                            className="mt-2 w-full flex items-center justify-center gap-1.5 bg-blue-600 text-white py-1.5 px-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 text-xs"
                          >
                            <span>{getButtonText(product)}</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {myProducts.length === 0 && (
                  <div className="col-span-full text-center py-12 text-gray-400">
                    Нет продуктов для обработки
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Управление заказами (для менеджера и владельца) */}
          {(user?.role === UserRole.MANAGER || user?.role === UserRole.OWNER) && (
            <div className="space-y-4">
              {/* Шапка с кнопкой создания заказа */}
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Заказы</h2>
                  <p className="text-xs text-gray-600">Управление заказами и контроль производства</p>
                </div>
                <Button
                  onClick={() => setIsCreateOrderModalOpen(true)}
                  className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700"
                  size="sm"
                >
                  <Plus className="w-4 h-4" />
                  Создать заказ
                </Button>
              </div>

              {/* Поиск и фильтры */}
              <div className="flex flex-wrap gap-2">
                <div className="flex-1 min-w-[200px] relative">
                  <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Поиск по заказу, клиенту..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 h-8 text-sm"
                  />
                </div>
                <div className="flex gap-1.5 flex-wrap">
                  <Button
                    variant={statusFilter === 'ALL' ? 'default' : 'outline'}
                    onClick={() => setStatusFilter('ALL')}
                    size="sm"
                    className="h-8 text-xs px-2"
                  >
                    Все ({orders.length})
                  </Button>
                  <Button
                    variant={statusFilter === OrderStatus.NEW ? 'default' : 'outline'}
                    onClick={() => setStatusFilter(OrderStatus.NEW)}
                    size="sm"
                    className="h-8 text-xs px-2"
                  >
                    Новые ({orders.filter(o => o.status === OrderStatus.NEW).length})
                  </Button>
                  <Button
                    variant={statusFilter === OrderStatus.IN_PRODUCTION ? 'default' : 'outline'}
                    onClick={() => setStatusFilter(OrderStatus.IN_PRODUCTION)}
                    size="sm"
                    className="h-8 text-xs px-2"
                  >
                    В работе ({orders.filter(o => o.status === OrderStatus.IN_PRODUCTION).length})
                  </Button>
                  <Button
                    variant={statusFilter === OrderStatus.COMPLETED ? 'default' : 'outline'}
                    onClick={() => setStatusFilter(OrderStatus.COMPLETED)}
                    size="sm"
                    className="h-8 text-xs px-2"
                  >
                    Готово ({orders.filter(o => o.status === OrderStatus.COMPLETED).length})
                  </Button>
                </div>
              </div>

              {/* Фильтр по датам */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <span className="text-xs text-gray-600">Период:</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="h-8 text-xs w-36"
                    placeholder="От"
                  />
                  <span className="text-gray-400">—</span>
                  <Input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="h-8 text-xs w-36"
                    placeholder="До"
                  />
                  {(dateFrom || dateTo) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearDateFilters}
                      className="h-8 px-2 text-gray-500 hover:text-gray-700"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
                {(dateFrom || dateTo) && (
                  <span className="text-xs text-gray-500">
                    Найдено: {filteredOrders.length}
                  </span>
                )}
              </div>

              {/* Список заказов */}
              <div className="space-y-2">
                {filteredOrders.length === 0 ? (
                  <Card className="p-12 text-center">
                    <Package className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                    <p className="text-gray-600">
                      {searchQuery || statusFilter !== 'ALL' ? 'Ничего не найдено' : 'Нет заказов'}
                    </p>
                  </Card>
                ) : (
                  filteredOrders.map((order) => {
                    const progress = getOrderProgress(order);
                    const statusConfig: Record<OrderStatus, { label: string; color: string; icon: typeof Clock }> = {
                      [OrderStatus.NEW]: { label: 'Новый', color: 'bg-gray-500', icon: Clock },
                      [OrderStatus.IN_PRODUCTION]: { label: 'В производстве', color: 'bg-blue-500', icon: Package },
                      [OrderStatus.COMPLETED]: { label: 'Завершён', color: 'bg-green-500', icon: CheckCircle },
                      [OrderStatus.CANCELLED]: { label: 'Отменён', color: 'bg-red-500', icon: Clock },
                    };
                    const config = statusConfig[order.status];
                    const Icon = config.icon;

                    return (
                      <Card key={order.id} className="hover:shadow-md transition-shadow">
                        <CardHeader className="py-2 px-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <CardTitle className="text-sm">{order.orderNumber}</CardTitle>
                                <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium text-white ${config.color}`}>
                                  <Icon className="w-3 h-3" />
                                  {config.label}
                                </span>
                                {order.priority && (
                                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getPriorityColor(order.priority)}`}>
                                    {getPriorityLabel(order.priority)}
                                  </span>
                                )}
                              </div>
                              <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-gray-600">
                                <div>
                                  <span className="font-medium">Клиент:</span> {order.customerName}
                                </div>
                                {order.customerPhone && (
                                  <div>
                                    <span className="font-medium">Тел:</span> {order.customerPhone}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="py-2 px-3">
                          {/* Прогресс */}
                          {order.products && order.products.length > 0 && (
                            <div className="mb-2">
                              <div className="flex items-center justify-between mb-1 text-xs">
                                <span className="font-medium text-gray-700">Прогресс</span>
                                <span className="text-gray-600">{progress}%</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-1.5">
                                <div
                                  className={`h-1.5 rounded-full transition-all ${
                                    progress === 100 ? 'bg-green-500' : 'bg-blue-500'
                                  }`}
                                  style={{ width: `${progress}%` }}
                                />
                              </div>
                            </div>
                          )}

                          {/* Продукты */}
                          {order.products && order.products.length > 0 && (
                            <div>
                              <div className="text-xs font-medium text-gray-700 mb-1">
                                Продукты ({order.products.length}):
                              </div>
                              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-1.5">
                                {order.products.map((product) => (
                                  <div
                                    key={product.id}
                                    className={`p-1.5 rounded text-xs ${getStageColor(product.stage)}`}
                                  >
                                    <div className="font-medium truncate text-xs">{product.name}</div>
                                    <div className="opacity-80 text-[10px]">{getStageName(product.stage)}</div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* Правая панель с этапами производства */}
        <div className="w-56 bg-white border-l border-gray-200 p-3 overflow-auto">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">
            Этапы
          </h3>
          <div className="space-y-2">
            {allowedStages.map((stage) => {
              const stageProducts = getProductsByStage(stage);
              return (
                <div
                  key={stage}
                  className={`p-2 rounded-lg ${getStageColor(stage)} transition-all`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-xs">{getStageName(stage)}</span>
                    <span className="text-xs font-bold">{stageProducts.length}</span>
                  </div>
                  {stageProducts.length > 0 && (
                    <div className="mt-1 space-y-0.5">
                      {stageProducts.slice(0, 2).map((product) => (
                        <div
                          key={product.id}
                          className="text-[10px] opacity-80 truncate"
                        >
                          • {product.name}
                        </div>
                      ))}
                      {stageProducts.length > 2 && (
                        <div className="text-[10px] opacity-60">
                          +{stageProducts.length - 2} еще
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <CreateOrderModal
        isOpen={isCreateOrderModalOpen}
        onClose={() => setIsCreateOrderModalOpen(false)}
      />
    </>
  );
};
