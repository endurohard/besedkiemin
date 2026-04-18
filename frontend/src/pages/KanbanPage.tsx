import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ordersApi, productsApi, tasksApi, productTypesApi, nomenclatureApi, uploadApi, usersApi } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { OrderStatus, ProductionStage, Product, Order, Nomenclature, User } from '@/types';
import { useAuthStore } from '@/store/authStore';
import { Package, Clock, CheckCircle, ArrowRight, Plus, Search, Calendar, X, Trash2, Pencil, Eye } from 'lucide-react';
import { CreateOrderModal } from '@/components/CreateOrderModal';
import { getPriorityLabel, getPriorityColor, getPrioritySortOrder } from '@/lib/priority-utils';

// Product form for adding/editing products in order
interface ProductEditForm {
  id?: string; // existing product id
  nomenclatureId?: string;
  name: string;
  productTypeId: string;
  quantity: number;
  dimensions?: string;
  color?: string;
  upholsteryMaterial?: string;
  schemaImageUrl?: string;
  schemaFile?: File;
  stageAssignments?: Record<string, string>;
  isNew?: boolean; // flag for new products
  stage?: ProductionStage; // track current stage for safety checks
}

export const KanbanPage = () => {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [isCreateOrderModalOpen, setIsCreateOrderModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editOrderForm, setEditOrderForm] = useState({ customerName: '', customerPhone: '', customerAddress: '', description: '', totalAmount: '', priority: 'NORMAL' as string, sourceId: '' });
  const [editProducts, setEditProducts] = useState<ProductEditForm[]>([]);
  const [productsToDelete, setProductsToDelete] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'ALL'>('ALL');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const { data: orders = [], isLoading: ordersLoading } = useQuery({
    queryKey: ['orders'],
    queryFn: () => ordersApi.getAll(),
    refetchInterval: 15000,
  });

  const { data: products = [], isLoading: productsLoading } = useQuery({
    queryKey: ['products'],
    queryFn: () => productsApi.getAll(),
    refetchInterval: 15000,
  });

  // Product types for editing
  const { data: productTypes = [] } = useQuery({
    queryKey: ['product-types'],
    queryFn: () => productTypesApi.getAll(),
    enabled: !!selectedOrder,
  });

  // Nomenclature for product selection
  const { data: nomenclature = [] } = useQuery({
    queryKey: ['nomenclature'],
    queryFn: () => nomenclatureApi.getAll(),
    enabled: !!selectedOrder && isEditing,
  });

  // Workers for stage assignments
  const { data: allWorkers = [] } = useQuery({
    queryKey: ['production-workers'],
    queryFn: () => usersApi.getAll(),
    enabled: !!selectedOrder && isEditing,
  });

  const workersByRole: Record<string, User[]> = {
    PREPARER: allWorkers.filter((w: User) => w.isActive && w.role?.code === 'PREPARER'),
    PAINTER: allWorkers.filter((w: User) => w.isActive && w.role?.code === 'PAINTER'),
    SEWER: allWorkers.filter((w: User) => w.isActive && w.role?.code === 'SEWER'),
    ASSEMBLER: allWorkers.filter((w: User) => w.isActive && w.role?.code === 'ASSEMBLER'),
  };

  const stageConfig = [
    { stage: 'PREPARATION', role: 'PREPARER', label: 'Заготовщик', icon: '🪚' },
    { stage: 'PAINTING', role: 'PAINTER', label: 'Маляр', icon: '🎨' },
    { stage: 'SEWING', role: 'SEWER', label: 'Швея', icon: '🧵' },
    { stage: 'ASSEMBLY', role: 'ASSEMBLER', label: 'Сборщик', icon: '🔧' },
  ];

  // Получаем задачи текущего пользователя для фильтрации
  const { data: myTasks = [] } = useQuery({
    queryKey: ['my-tasks'],
    queryFn: () => tasksApi.getMyTasks(),
    refetchInterval: 15000,
    enabled: user?.role?.code !== 'OWNER' && user?.role?.code !== 'MANAGER',
  });

  const moveProductMutation = useMutation({
    mutationFn: ({ productId, stage }: { productId: string; stage: ProductionStage }) =>
      productsApi.moveToStage(productId, { stage }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });

  const deleteOrderMutation = useMutation({
    mutationFn: (orderId: string) => ordersApi.delete(orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });

  const handleDeleteOrder = (order: Order) => {
    if (!confirm(`Вы уверены, что хотите удалить заказ ${order.orderNumber}? Все продукты и связанные данные будут удалены безвозвратно.`)) return;
    deleteOrderMutation.mutate(order.id);
    if (selectedOrder?.id === order.id) {
      setSelectedOrder(null);
      setIsEditing(false);
    }
  };

  const updateOrderMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => ordersApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });

  const createProductMutation = useMutation({
    mutationFn: (data: any) => productsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });

  const updateProductMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => productsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });

  const deleteProductMutation = useMutation({
    mutationFn: (id: string) => productsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });

  // Open order detail modal (view mode) — fetch full order data
  const handleOpenOrder = async (order: Order) => {
    setSelectedOrder(order); // show immediately with partial data
    setIsEditing(false);
    setProductsToDelete([]);
    try {
      const fullOrder = await ordersApi.getOne(order.id);
      setSelectedOrder(fullOrder);
    } catch (e) {
      console.error('Failed to fetch order details:', e);
    }
  };

  // Switch to edit mode
  const handleStartEdit = () => {
    if (!selectedOrder) return;
    setIsEditing(true);
    setEditOrderForm({
      customerName: selectedOrder.customerName || '',
      customerPhone: selectedOrder.customerPhone || '',
      customerAddress: selectedOrder.customerAddress || '',
      description: selectedOrder.description || '',
      totalAmount: selectedOrder.totalAmount ? String(selectedOrder.totalAmount) : '',
      priority: selectedOrder.priority || 'NORMAL',
      sourceId: selectedOrder.sourceId || '',
    });
    // Load existing products into edit form
    const existingProducts: ProductEditForm[] = (selectedOrder.products || []).map((p) => ({
      id: p.id,
      name: p.name,
      productTypeId: p.productTypeId || '',
      quantity: p.quantity,
      dimensions: p.dimensions || '',
      color: p.color || '',
      upholsteryMaterial: p.upholsteryMaterial || '',
      schemaImageUrl: p.schemaImageUrl || '',
      isNew: false,
      stage: p.stage,
    }));
    setEditProducts(existingProducts);
    setProductsToDelete([]);
  };

  const handleCloseModal = () => {
    setSelectedOrder(null);
    setIsEditing(false);
    setEditProducts([]);
    setProductsToDelete([]);
  };

  const handleAddProduct = () => {
    setEditProducts([
      {
        nomenclatureId: '',
        name: '',
        productTypeId: '',
        quantity: 1,
        dimensions: '',
        color: '',
        upholsteryMaterial: '',
        schemaImageUrl: '',
        stageAssignments: {},
        isNew: true,
      },
      ...editProducts,
    ]);
  };

  const handleRemoveProduct = (index: number) => {
    const product = editProducts[index];
    if (product.id && product.stage && product.stage !== ProductionStage.PENDING) {
      if (!confirm(`Позиция "${product.name}" уже в работе (этап: ${getStageName(product.stage)}). Удалить? Все связанные задачи будут потеряны.`)) {
        return;
      }
    }
    if (product.id) {
      setProductsToDelete([...productsToDelete, product.id]);
    }
    setEditProducts(editProducts.filter((_, i) => i !== index));
  };

  const handleUpdateProductField = (index: number, field: keyof ProductEditForm, value: any) => {
    const updated = [...editProducts];
    updated[index] = { ...updated[index], [field]: value };
    setEditProducts(updated);
  };

  const handleNomenclatureSelect = (index: number, nomenclatureId: string) => {
    const item = nomenclature.find((n: Nomenclature) => n.id === nomenclatureId);
    if (item) {
      const updated = [...editProducts];
      updated[index] = {
        ...updated[index],
        nomenclatureId,
        name: item.name,
        productTypeId: item.productTypeId,
        dimensions: item.dimensions || '',
        color: item.color || '',
        upholsteryMaterial: item.upholsteryMaterial || '',
      };
      setEditProducts(updated);
    } else {
      const updated = [...editProducts];
      updated[index] = {
        ...updated[index],
        nomenclatureId: '',
      };
      setEditProducts(updated);
    }
  };

  const handleSaveOrder = async () => {
    if (!selectedOrder) return;

    try {
      // 1. Update order metadata
      await updateOrderMutation.mutateAsync({
        id: selectedOrder.id,
        data: {
          customerName: editOrderForm.customerName,
          customerPhone: editOrderForm.customerPhone,
          customerAddress: editOrderForm.customerAddress,
          description: editOrderForm.description,
          totalAmount: editOrderForm.totalAmount ? parseFloat(editOrderForm.totalAmount) : undefined,
          priority: editOrderForm.priority,
          sourceId: editOrderForm.sourceId || undefined,
        },
      });

      // 2. Delete removed products
      for (const productId of productsToDelete) {
        await deleteProductMutation.mutateAsync(productId);
      }

      // 3. Update existing products and create new ones
      for (const product of editProducts) {
        if (product.isNew) {
          if (product.name.trim() && product.productTypeId) {
            let schemaImageUrl = product.schemaImageUrl;
            if (product.schemaFile) {
              try {
                const uploadResult = await uploadApi.uploadSchemaImage(product.schemaFile);
                schemaImageUrl = uploadResult.url;
              } catch (err) {
                console.warn('Не удалось загрузить фото схемы, продукт будет создан без неё:', err);
              }
            }
            await createProductMutation.mutateAsync({
              name: product.name,
              productTypeId: product.productTypeId,
              quantity: product.quantity,
              dimensions: product.dimensions || undefined,
              orderId: selectedOrder.id,
              color: product.color || undefined,
              upholsteryMaterial: product.upholsteryMaterial || undefined,
              schemaImageUrl: schemaImageUrl || undefined,
              stageAssignments: product.stageAssignments && Object.keys(product.stageAssignments).length > 0 ? product.stageAssignments : undefined,
            });
          }
        } else if (product.id) {
          await updateProductMutation.mutateAsync({
            id: product.id,
            data: {
              name: product.name,
              productTypeId: product.productTypeId,
              quantity: product.quantity,
              dimensions: product.dimensions || undefined,
              color: product.color || undefined,
              upholsteryMaterial: product.upholsteryMaterial || undefined,
            },
          });
        }
      }

      // Refresh and close edit mode
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setIsEditing(false);
      setSelectedOrder(null);
    } catch (error) {
      console.error('Error saving order:', error);
      alert('Ошибка при сохранении заказа');
    }
  };

  // Определяем какие этапы доступны для текущей роли
  const getRoleStages = (roleCode: string | undefined) => {
    switch (roleCode) {
      case 'OWNER':
      case 'MANAGER':
      case 'SUPER_ADMIN':
        return Object.values(ProductionStage);
      case 'DESIGNER':
        return [ProductionStage.PENDING, ProductionStage.DESIGN];
      case 'PREPARER':
        return [ProductionStage.DESIGN, ProductionStage.PREPARATION];
      case 'PAINTER':
        return [ProductionStage.PREPARATION, ProductionStage.PAINTING, ProductionStage.REJECTED];
      case 'ASSEMBLER':
        return [ProductionStage.PAINTING, ProductionStage.ASSEMBLY, ProductionStage.REJECTED];
      case 'WAREHOUSE':
        return [ProductionStage.ASSEMBLY, ProductionStage.QUALITY_CHECK, ProductionStage.COMPLETED, ProductionStage.REJECTED];
      default:
        return [];
    }
  };

  // Определяем следующий этап для перемещения
  const getNextStage = (currentStage: ProductionStage, roleCode: string | undefined): ProductionStage | null => {
    switch (roleCode) {
      case 'DESIGNER':
        if (currentStage === ProductionStage.PENDING) return ProductionStage.DESIGN;
        if (currentStage === ProductionStage.DESIGN) return ProductionStage.PREPARATION;
        break;
      case 'PREPARER':
        if (currentStage === ProductionStage.DESIGN) return ProductionStage.PREPARATION;
        if (currentStage === ProductionStage.PREPARATION) return ProductionStage.PAINTING;
        break;
      case 'PAINTER':
        if (currentStage === ProductionStage.PREPARATION || currentStage === ProductionStage.REJECTED)
          return ProductionStage.PAINTING;
        if (currentStage === ProductionStage.PAINTING) return ProductionStage.ASSEMBLY;
        break;
      case 'ASSEMBLER':
        if (currentStage === ProductionStage.PAINTING || currentStage === ProductionStage.REJECTED)
          return ProductionStage.ASSEMBLY;
        if (currentStage === ProductionStage.ASSEMBLY) return ProductionStage.QUALITY_CHECK;
        break;
      case 'WAREHOUSE':
        if (currentStage === ProductionStage.ASSEMBLY) return ProductionStage.QUALITY_CHECK;
        if (currentStage === ProductionStage.QUALITY_CHECK) return ProductionStage.COMPLETED;
        break;
    }
    return null;
  };

  const canMoveProduct = (product: Product) => {
    if (!user) return false;
    return getNextStage(product.stage, user.role?.code) !== null;
  };

  const handleMoveProduct = (product: Product) => {
    if (!user) return;
    const nextStage = getNextStage(product.stage, user.role?.code);
    if (nextStage) {
      moveProductMutation.mutate({ productId: product.id, stage: nextStage });
    }
  };

  // Определяем текст кнопки в зависимости от действия
  const getButtonText = (product: Product) => {
    if (!user) return 'Перевести далее';
    const currentStage = product.stage;
    const nextStage = getNextStage(currentStage, user.role?.code);

    const roleMainStage: Record<string, ProductionStage | null> = {
      'SUPER_ADMIN': null,
      'OWNER': null,
      'MANAGER': null,
      'DESIGNER': ProductionStage.DESIGN,
      'PREPARER': ProductionStage.PREPARATION,
      'PAINTER': ProductionStage.PAINTING,
      'ASSEMBLER': ProductionStage.ASSEMBLY,
      'WAREHOUSE': ProductionStage.QUALITY_CHECK,
    };

    const mainStage = user.role?.code ? roleMainStage[user.role.code] : null;

    if (nextStage === mainStage) {
      return 'Принять в работу';
    }

    if (currentStage === mainStage) {
      return 'Передать дальше';
    }

    return 'Перевести далее';
  };

  // Получаем список заказов с текущими задачами пользователя
  const myOrderIds = useMemo(() => {
    if (!user || user.role?.code === 'OWNER' || user.role?.code === 'MANAGER' || user.role?.code === 'SUPER_ADMIN') {
      return null;
    }
    const orderIds = new Set<string>();
    myTasks.forEach((task: any) => {
      if (task.product?.orderId) {
        orderIds.add(task.product.orderId);
      }
    });
    return orderIds;
  }, [myTasks, user]);

  // Фильтрация продуктов для сотрудников
  const filteredProducts = useMemo(() => {
    if (!myOrderIds) return products;
    return products.filter((product) => myOrderIds.has(product.orderId));
  }, [products, myOrderIds]);

  const allowedStages = user ? getRoleStages(user.role?.code) : [];
  const myProducts = filteredProducts.filter((p) => allowedStages.includes(p.stage));

  const getProductsByStage = (stage: ProductionStage) => {
    return myProducts
      .filter((product) => product.stage === stage)
      .sort((a, b) => {
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
      case ProductionStage.ASSEMBLY:
        return 'bg-teal-100 text-teal-700';
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
      case ProductionStage.ASSEMBLY:
        return 'Сборка';
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

  const getRoleName = () => {
    return user?.role?.name || 'Не указана';
  };

  // Функция для расчета прогресса заказа
  const getOrderProgress = (order: Order) => {
    if (!order.products || order.products.length === 0) return 0;
    const completedProducts = order.products.filter(p => p.stage === ProductionStage.COMPLETED).length;
    return Math.round((completedProducts / order.products.length) * 100);
  };

  // Фильтрация заказов
  const filteredOrders = useMemo(() => {
    if (!Array.isArray(orders)) {
      return [];
    }

    let ordersToFilter = orders;

    if (myOrderIds) {
      ordersToFilter = orders.filter((order) => myOrderIds.has(order.id));
    }

    return ordersToFilter.filter((order) => {
      const matchesSearch = searchQuery === '' ||
        order.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (order.customerPhone && order.customerPhone.includes(searchQuery)) ||
        order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = statusFilter === 'ALL' || order.status === statusFilter;

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

  const canEdit = user?.role?.code === 'OWNER' || user?.role?.code === 'SUPER_ADMIN' || user?.role?.code === 'MANAGER';

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
              Роль: <span className="font-medium">{getRoleName()}</span> |{' '}
              {user?.firstName} {user?.lastName}
            </p>
          </div>

          {/* Мои продукты для работы (скрываем для менеджера и владельца) */}
          {user?.role?.code !== 'MANAGER' && user?.role?.code !== 'OWNER' && user?.role?.code !== 'SUPER_ADMIN' && (
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
                        : getStageColor(product.stage).includes('teal')
                        ? '#14b8a6'
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
          {(user?.role?.code === 'MANAGER' || user?.role?.code === 'OWNER' || user?.role?.code === 'SUPER_ADMIN') && (
            <div className="space-y-4">
              {/* Шапка с кнопкой создания заказа */}
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Заказы</h2>
                  <p className="text-xs text-gray-600">Нажмите на заказ для просмотра позиций и редактирования</p>
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
                      <Card
                        key={order.id}
                        className="hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => handleOpenOrder(order)}
                      >
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
                                <span className="text-xs text-gray-400 ml-auto">
                                  <Eye className="w-3 h-3 inline mr-1" />
                                  {order.products?.length || 0} позиций
                                </span>
                              </div>
                              {/* Информация о клиенте - только для MANAGER и LOGIST */}
                              {(user?.role?.code === 'MANAGER' || user?.role?.code === 'LOGIST') && (
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
                              )}
                            </div>
                            {canEdit && (
                              <div className="flex items-center ml-2" onClick={(e) => e.stopPropagation()}>
                                <button
                                  onClick={async (e) => { e.stopPropagation(); await handleOpenOrder(order); }}
                                  className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                  title="Просмотреть / Редактировать заказ"
                                >
                                  <Pencil className="w-4 h-4" />
                                </button>
                                {(user?.role?.code === 'OWNER' || user?.role?.code === 'SUPER_ADMIN') && (
                                  <button
                                    onClick={(e) => { e.stopPropagation(); handleDeleteOrder(order); }}
                                    disabled={deleteOrderMutation.isPending}
                                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                    title="Удалить заказ"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            )}
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

                          {/* Продукты (компактный вид) */}
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

      {/* Модалка просмотра/редактирования заказа */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" onClick={handleCloseModal}>
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto m-4" onClick={(e) => e.stopPropagation()}>
            {/* Заголовок */}
            <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white z-10">
              <div>
                <h2 className="text-lg font-bold">
                  {isEditing ? 'Редактировать' : 'Заказ'} {selectedOrder.orderNumber}
                </h2>
                <p className="text-xs text-gray-500">
                  Создан: {new Date(selectedOrder.createdAt).toLocaleDateString('ru-RU')}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {canEdit && !isEditing && (
                  <button
                    onClick={handleStartEdit}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    Редактировать
                  </button>
                )}
                <button onClick={handleCloseModal} className="text-gray-500 hover:text-gray-700">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Содержимое */}
            <div className="p-4">
              {!isEditing ? (
                /* ====== РЕЖИМ ПРОСМОТРА ====== */
                <div className="space-y-4">
                  {/* Информация о заказе */}
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="font-medium text-gray-500">Клиент:</span>
                      <p className="font-semibold">{selectedOrder.customerName}</p>
                    </div>
                    {selectedOrder.customerPhone && (
                      <div>
                        <span className="font-medium text-gray-500">Телефон:</span>
                        <p>{selectedOrder.customerPhone}</p>
                      </div>
                    )}
                    {selectedOrder.customerAddress && (
                      <div className="col-span-2">
                        <span className="font-medium text-gray-500">Адрес:</span>
                        <p>{selectedOrder.customerAddress}</p>
                      </div>
                    )}
                    {selectedOrder.description && (
                      <div className="col-span-2">
                        <span className="font-medium text-gray-500">Описание:</span>
                        <p>{selectedOrder.description}</p>
                      </div>
                    )}
                    {selectedOrder.totalAmount && (
                      <div>
                        <span className="font-medium text-gray-500">Сумма:</span>
                        <p className="font-semibold">{selectedOrder.totalAmount.toLocaleString('ru-RU')} руб.</p>
                      </div>
                    )}
                    {selectedOrder.source && (
                      <div>
                        <span className="font-medium text-gray-500">Источник:</span>
                        <p>{selectedOrder.source.name}</p>
                      </div>
                    )}
                  </div>

                  {/* Список позиций (продуктов) */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                      Позиции заказа
                      <span className="text-xs font-normal text-gray-500">
                        ({selectedOrder.products?.length || 0} шт.)
                      </span>
                    </h3>

                    {(!selectedOrder.products || selectedOrder.products.length === 0) ? (
                      <div className="text-center py-6 border-2 border-dashed border-gray-300 rounded-lg">
                        <p className="text-sm text-gray-500">Позиции не добавлены</p>
                        {canEdit && (
                          <button
                            onClick={handleStartEdit}
                            className="mt-2 text-sm text-blue-600 hover:underline"
                          >
                            Добавить позиции
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="border rounded-lg overflow-hidden">
                        <table className="w-full text-sm">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-3 py-2 text-left font-medium text-gray-600">Название</th>
                              <th className="px-3 py-2 text-left font-medium text-gray-600">Тип</th>
                              <th className="px-3 py-2 text-center font-medium text-gray-600">Кол-во</th>
                              <th className="px-3 py-2 text-left font-medium text-gray-600">Этап</th>
                              <th className="px-3 py-2 text-left font-medium text-gray-600">Доп. инфо</th>
                            </tr>
                          </thead>
                          <tbody>
                            {selectedOrder.products.map((product) => (
                              <tr key={product.id} className="border-t hover:bg-gray-50">
                                <td className="px-3 py-2 font-medium">{product.name}</td>
                                <td className="px-3 py-2 text-gray-600">{product.productType?.name || '—'}</td>
                                <td className="px-3 py-2 text-center">{product.quantity}</td>
                                <td className="px-3 py-2">
                                  <span className={`inline-block px-2 py-0.5 rounded text-xs ${getStageColor(product.stage)}`}>
                                    {getStageName(product.stage)}
                                  </span>
                                </td>
                                <td className="px-3 py-2 text-xs text-gray-500">
                                  {product.dimensions && <div>Размеры: {product.dimensions}</div>}
                                  {product.color && <div>Цвет: {product.color}</div>}
                                  {product.upholsteryMaterial && <div>Обшивка: {product.upholsteryMaterial}</div>}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                /* ====== РЕЖИМ РЕДАКТИРОВАНИЯ ====== */
                <div className="space-y-4">
                  {/* Информация о заказе */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-gray-900">Данные заказа</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Имя клиента</label>
                        <input
                          value={editOrderForm.customerName}
                          onChange={(e) => setEditOrderForm({ ...editOrderForm, customerName: e.target.value })}
                          className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Телефон</label>
                        <input
                          value={editOrderForm.customerPhone}
                          onChange={(e) => setEditOrderForm({ ...editOrderForm, customerPhone: e.target.value })}
                          className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Адрес</label>
                      <input
                        value={editOrderForm.customerAddress}
                        onChange={(e) => setEditOrderForm({ ...editOrderForm, customerAddress: e.target.value })}
                        className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Описание</label>
                      <textarea
                        value={editOrderForm.description}
                        onChange={(e) => setEditOrderForm({ ...editOrderForm, description: e.target.value })}
                        className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        rows={2}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Сумма заказа (руб.)</label>
                        <input
                          type="number"
                          value={editOrderForm.totalAmount}
                          onChange={(e) => setEditOrderForm({ ...editOrderForm, totalAmount: e.target.value })}
                          className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Приоритет</label>
                        <select
                          value={editOrderForm.priority}
                          onChange={(e) => setEditOrderForm({ ...editOrderForm, priority: e.target.value })}
                          className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="LOW">Низкий</option>
                          <option value="NORMAL">Обычный</option>
                          <option value="HIGH">Высокий</option>
                          <option value="URGENT">Срочный</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Позиции (продукты) */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-gray-900">
                        Позиции заказа ({editProducts.length})
                      </h3>
                      <button
                        type="button"
                        onClick={handleAddProduct}
                        className="flex items-center gap-1 px-3 py-1.5 text-xs bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Добавить позицию
                      </button>
                    </div>

                    {editProducts.length === 0 && (
                      <div className="text-center py-6 border-2 border-dashed border-gray-300 rounded-lg">
                        <p className="text-sm text-gray-500">Позиции не добавлены</p>
                        <p className="text-xs text-gray-400 mt-1">Нажмите "Добавить позицию"</p>
                      </div>
                    )}

                    {editProducts.map((product, index) => (
                      <div key={product.id || `new-${index}`} className={`p-3 border rounded-lg space-y-2 ${product.stage && product.stage !== ProductionStage.PENDING && !product.isNew ? 'border-amber-300 bg-amber-50/30' : 'border-gray-200'}`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-gray-700">
                              {product.isNew ? 'Новая позиция' : product.name}
                            </span>
                            {product.stage && !product.isNew && (
                              <span className={`text-[10px] px-1.5 py-0.5 rounded ${getStageColor(product.stage)}`}>
                                {getStageName(product.stage)}
                              </span>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveProduct(index)}
                            className="text-red-500 hover:text-red-700 text-xs flex items-center gap-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Удалить
                          </button>
                        </div>

                        {/* Nomenclature selector for new products */}
                        {product.isNew && (
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Выберите из каталога</label>
                            <select
                              value={product.nomenclatureId || ''}
                              onChange={(e) => handleNomenclatureSelect(index, e.target.value)}
                              className="w-full px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="">-- Ввести вручную --</option>
                              {nomenclature.map((item: Nomenclature) => (
                                <option key={item.id} value={item.id}>
                                  {item.name} {item.productType?.name ? `(${item.productType.name})` : ''} {item.color ? `- ${item.color}` : ''}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}

                        <div className="grid grid-cols-3 gap-2">
                          <div className="col-span-2">
                            <label className="block text-xs font-medium text-gray-700 mb-1">Название</label>
                            <input
                              value={product.name}
                              onChange={(e) => handleUpdateProductField(index, 'name', e.target.value)}
                              className="w-full px-3 py-1.5 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="Название продукта"
                              disabled={!!product.nomenclatureId}
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Кол-во</label>
                            <input
                              type="number"
                              min="1"
                              value={product.quantity}
                              onChange={(e) => handleUpdateProductField(index, 'quantity', parseInt(e.target.value) || 1)}
                              className="w-full px-3 py-1.5 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Тип продукта</label>
                            <select
                              value={product.productTypeId}
                              onChange={(e) => handleUpdateProductField(index, 'productTypeId', e.target.value)}
                              className="w-full px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                              disabled={!!product.nomenclatureId}
                            >
                              <option value="">Выберите тип</option>
                              {productTypes.map((type) => (
                                <option key={type.id} value={type.id}>
                                  {type.name}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Размеры</label>
                            <input
                              value={product.dimensions || ''}
                              onChange={(e) => handleUpdateProductField(index, 'dimensions', e.target.value)}
                              className="w-full px-3 py-1.5 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="ДxШxВ"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Цвет/покрытие</label>
                            <input
                              value={product.color || ''}
                              onChange={(e) => handleUpdateProductField(index, 'color', e.target.value)}
                              className="w-full px-3 py-1.5 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="Например: Орех, код 906"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Материал обшивки</label>
                            <input
                              value={product.upholsteryMaterial || ''}
                              onChange={(e) => handleUpdateProductField(index, 'upholsteryMaterial', e.target.value)}
                              className="w-full px-3 py-1.5 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="Экокожа, Велюр..."
                            />
                          </div>
                        </div>

                        {/* Stage assignments for new products */}
                        {product.isNew && (
                          <div className="p-2 bg-indigo-50 border border-indigo-200 rounded-md space-y-2">
                            <label className="block text-xs font-medium text-indigo-900">Назначить работников</label>
                            <div className="grid grid-cols-2 gap-2">
                              {stageConfig.map(({ stage, role, label, icon }) => {
                                const workers = workersByRole[role] || [];
                                if (workers.length === 0) return null;
                                return (
                                  <div key={stage}>
                                    <label className="block text-xs text-gray-600 mb-0.5">{icon} {label}</label>
                                    <select
                                      value={product.stageAssignments?.[stage] || ''}
                                      onChange={(e) => {
                                        const newAssignments = { ...(product.stageAssignments || {}) };
                                        if (e.target.value) {
                                          newAssignments[stage] = e.target.value;
                                        } else {
                                          delete newAssignments[stage];
                                        }
                                        handleUpdateProductField(index, 'stageAssignments', newAssignments);
                                      }}
                                      className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                    >
                                      <option value="">Все</option>
                                      {workers.map((w: User) => (
                                        <option key={w.id} value={w.id}>{w.lastName} {w.firstName}</option>
                                      ))}
                                    </select>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Кнопки действий */}
                  <div className="flex justify-end gap-2 pt-3 border-t">
                    <button
                      onClick={() => setIsEditing(false)}
                      className="px-4 py-2 text-sm bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
                    >
                      Отмена
                    </button>
                    <button
                      onClick={handleSaveOrder}
                      disabled={updateOrderMutation.isPending}
                      className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                    >
                      {updateOrderMutation.isPending ? 'Сохранение...' : 'Сохранить'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <CreateOrderModal
        isOpen={isCreateOrderModalOpen}
        onClose={() => setIsCreateOrderModalOpen(false)}
      />
    </>
  );
};
