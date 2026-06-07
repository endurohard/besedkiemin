import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ordersApi, productsApi, tasksApi, productTypesApi, nomenclatureApi, uploadApi, usersApi } from '@/lib/api';
import { resizeImageFiles } from '@/lib/image-resize';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { OrderStatus, ProductionStage, Product, Order, Nomenclature, User } from '@/types';
import { useAuthStore } from '@/store/authStore';
import { Package, Clock, CheckCircle, ArrowRight, Plus, Search, Calendar, X, Trash2, Pencil, Eye, ChevronDown, ChevronRight, User as UserIcon, GripVertical } from 'lucide-react';
import { CreateOrderModal } from '@/components/CreateOrderModal';
import { SchemaImageViewer } from '@/components/SchemaImageViewer';
import { ReassignTaskControl } from '@/components/ReassignTaskControl';
import { getPriorityLabel, getPriorityColor, getPrioritySortOrder } from '@/lib/priority-utils';
import { taskStatusLabels } from '@/lib/labels';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

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
  description?: string;
  schemaImageUrl?: string;
  schemaImageUrls?: string[];
  schemaFile?: File;
  schemaFiles?: File[];
  isCustom?: boolean;
  stageAssignments?: Record<string, string>;
  isNew?: boolean; // flag for new products
  stage?: ProductionStage; // track current stage for safety checks
}

// ── Sortable stage card (outside KanbanPage to avoid React hook rules violation) ──
interface SortableStageItemProps {
  stage: ProductionStage;
  stageProducts: any[];
  getStageColor: (stage: ProductionStage) => string;
  getStageName: (stage: ProductionStage) => string;
  onStageClick: (stage: ProductionStage) => void;
}

const SortableStageItem = ({ stage, stageProducts, getStageColor, getStageName, onStageClick }: SortableStageItemProps) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: stage });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    position: isDragging ? 'relative' as const : undefined,
    zIndex: isDragging ? 10 : undefined,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <button
        type="button"
        onClick={() => onStageClick(stage)}
        className={`w-full text-left p-2 rounded-lg ${getStageColor(stage)} transition-all hover:ring-2 hover:ring-primary/40 cursor-pointer`}
      >
        <div className="flex items-center justify-between gap-1">
          <div className="flex items-center gap-1 min-w-0">
            <span
              {...attributes}
              {...listeners}
              className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 shrink-0 touch-none"
              onClick={(e) => e.stopPropagation()}
            >
              <GripVertical size={12} />
            </span>
            <span className="font-medium text-xs truncate">{getStageName(stage)}</span>
          </div>
          <span className="text-xs font-bold shrink-0">{stageProducts.length}</span>
        </div>
        {stageProducts.length > 0 && (
          <div className="mt-1 space-y-0.5 ml-4">
            {stageProducts.slice(0, 2).map((product: any) => (
              <div key={product.id} className="text-[10px] opacity-80 truncate">
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
      </button>
    </div>
  );
};
// ────────────────────────────────────────────────────────────────────────────────

export const KanbanPage = () => {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [isCreateOrderModalOpen, setIsCreateOrderModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editOrderForm, setEditOrderForm] = useState({ customerName: '', customerPhone: '', customerAddress: '', description: '', totalAmount: '', priority: 'NORMAL' as string, sourceId: '' });
  const [editProducts, setEditProducts] = useState<ProductEditForm[]>([]);
  const [productsToDelete, setProductsToDelete] = useState<string[]>([]);
  const [expandedProductIds, setExpandedProductIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'ALL'>('ALL');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [viewerImages, setViewerImages] = useState<{ images: string[]; index: number } | null>(null);
  const [stageDetailsFor, setStageDetailsFor] = useState<ProductionStage | null>(null);

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
    queryFn: () => usersApi.getProductionWorkers(),
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
      description: p.description || '',
      schemaImageUrl: p.schemaImageUrl || '',
      schemaImageUrls: p.schemaImageUrls ?? [],
      isCustom: !!p.isCustom,
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
        description: '',
        schemaImageUrl: '',
        schemaImageUrls: [],
        isCustom: false,
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
        let schemaImageUrls: string[] = product.schemaImageUrls ?? [];
        const filesToUpload = product.schemaFiles && product.schemaFiles.length > 0
          ? product.schemaFiles
          : product.schemaFile
            ? [product.schemaFile]
            : [];
        if (filesToUpload.length > 0) {
          try {
            const resized = await resizeImageFiles(filesToUpload);
            const uploaded = await uploadApi.uploadSchemaImages(resized);
            schemaImageUrls = [...schemaImageUrls, ...uploaded.urls];
          } catch (err) {
            console.warn('Не удалось загрузить фото схем:', err);
          }
        }
        const schemaImageUrl = schemaImageUrls[0] || product.schemaImageUrl || undefined;

        if (product.isNew) {
          if (product.name.trim() && product.productTypeId) {
            await createProductMutation.mutateAsync({
              name: product.name,
              productTypeId: product.productTypeId,
              quantity: product.quantity,
              dimensions: product.dimensions || undefined,
              orderId: selectedOrder.id,
              color: product.color || undefined,
              upholsteryMaterial: product.upholsteryMaterial || undefined,
              description: product.description || undefined,
              schemaImageUrl,
              schemaImageUrls,
              isCustom: product.isCustom || undefined,
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
              description: product.description || undefined,
              schemaImageUrl,
              schemaImageUrls,
              isCustom: product.isCustom ?? false,
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

  // Drag-and-drop порядок этапов, сохраняется в localStorage
  const [stagesOrder, setStagesOrder] = useState<ProductionStage[]>(() => {
    try {
      const saved = localStorage.getItem('kanban-stages-order');
      if (saved) return JSON.parse(saved) as ProductionStage[];
    } catch {}
    return [];
  });

  const orderedStages = useMemo(() => {
    if (!stagesOrder.length) return allowedStages;
    return [...allowedStages].sort((a, b) => {
      const ia = stagesOrder.indexOf(a);
      const ib = stagesOrder.indexOf(b);
      if (ia === -1) return 1;
      if (ib === -1) return -1;
      return ia - ib;
    });
  }, [allowedStages, stagesOrder]);

  const handleStagesDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = orderedStages.indexOf(active.id as ProductionStage);
    const newIndex = orderedStages.indexOf(over.id as ProductionStage);
    const newOrder = arrayMove(orderedStages, oldIndex, newIndex);
    setStagesOrder(newOrder);
    localStorage.setItem('kanban-stages-order', JSON.stringify(newOrder));
  };

  const stagesSensors = useSensors(useSensor(PointerSensor));

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
        return 'bg-muted text-foreground';
      case ProductionStage.DESIGN:
        return 'bg-purple-100 text-purple-700';
      case ProductionStage.PREPARATION:
        return 'bg-primary/20 text-primary';
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
        return 'bg-muted text-foreground';
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
      <div className="flex h-[calc(100vh-49px)] bg-muted/50">
        {/* Основная область с продуктами */}
        <div className="flex-1 overflow-auto p-4">
          <div className="mb-4">
            <h1 className="text-xl font-bold text-gray-900">Управление производством</h1>
            <p className="text-muted-foreground text-sm">
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
                      <div className="space-y-1 text-xs text-muted-foreground">
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
                  <div className="col-span-full text-center py-12 text-muted-foreground">
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
                  <p className="text-xs text-muted-foreground">Нажмите на заказ для просмотра позиций и редактирования</p>
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
                  <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
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
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Период:</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="h-8 text-xs w-36"
                    placeholder="От"
                  />
                  <span className="text-muted-foreground">—</span>
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
                      className="h-8 px-2 text-muted-foreground hover:text-foreground"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
                {(dateFrom || dateTo) && (
                  <span className="text-xs text-muted-foreground">
                    Найдено: {filteredOrders.length}
                  </span>
                )}
              </div>

              {/* Список заказов */}
              <div className="space-y-2">
                {filteredOrders.length === 0 ? (
                  <Card className="p-12 text-center">
                    <Package className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
                    <p className="text-muted-foreground">
                      {searchQuery || statusFilter !== 'ALL' ? 'Ничего не найдено' : 'Нет заказов'}
                    </p>
                  </Card>
                ) : (
                  filteredOrders.map((order) => {
                    const progress = getOrderProgress(order);
                    const statusConfig: Record<OrderStatus, { label: string; color: string; icon: typeof Clock }> = {
                      [OrderStatus.NEW]: { label: 'Новый', color: 'bg-muted/500', icon: Clock },
                      [OrderStatus.IN_PRODUCTION]: { label: 'В производстве', color: 'bg-primary/100', icon: Package },
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
                                <span className="text-xs text-muted-foreground ml-auto">
                                  <Eye className="w-3 h-3 inline mr-1" />
                                  {order.products?.length || 0} позиций
                                </span>
                              </div>
                              {/* Информация о клиенте - только для MANAGER и LOGIST */}
                              {(user?.role?.code === 'MANAGER' || user?.role?.code === 'LOGIST') && (
                                <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-muted-foreground">
                                  <div>
                                    <span className="font-medium">Клиент:</span> {order.customerName}
                                  </div>
                                  {order.customerPhone && (
                                    <div>
                                      <span className="font-medium">Тел:</span> {order.customerPhone}
                                    </div>
                                  )}
                                  {order.createdBy && (
                                    <div>
                                      <span className="font-medium">Создал:</span>{' '}
                                      {`${order.createdBy.lastName ?? ''} ${order.createdBy.firstName ?? ''}`.trim() || order.createdBy.email}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                            {canEdit && (
                              <div className="flex items-center ml-2" onClick={(e) => e.stopPropagation()}>
                                <button
                                  onClick={async (e) => { e.stopPropagation(); await handleOpenOrder(order); }}
                                  className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded transition-colors"
                                  title="Просмотреть / Редактировать заказ"
                                >
                                  <Pencil className="w-4 h-4" />
                                </button>
                                {(user?.role?.code === 'OWNER' || user?.role?.code === 'SUPER_ADMIN') && (
                                  <button
                                    onClick={(e) => { e.stopPropagation(); handleDeleteOrder(order); }}
                                    disabled={deleteOrderMutation.isPending}
                                    className="p-1.5 text-muted-foreground hover:text-red-600 hover:bg-red-50 rounded transition-colors"
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
                                <span className="font-medium text-foreground">Прогресс</span>
                                <span className="text-muted-foreground">{progress}%</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-1.5">
                                <div
                                  className={`h-1.5 rounded-full transition-all ${
                                    progress === 100 ? 'bg-green-500' : 'bg-primary/100'
                                  }`}
                                  style={{ width: `${progress}%` }}
                                />
                              </div>
                            </div>
                          )}

                          {/* Продукты (компактный вид) */}
                          {order.products && order.products.length > 0 && (
                            <div>
                              <div className="text-xs font-medium text-foreground mb-1">
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
        <div className="w-56 bg-card border-l border-border p-3 overflow-auto">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">
            Этапы
          </h3>
          <DndContext sensors={stagesSensors} collisionDetection={closestCenter} onDragEnd={handleStagesDragEnd}>
            <SortableContext items={orderedStages} strategy={verticalListSortingStrategy}>
              <div className="space-y-2">
                {orderedStages.map((stage) => (
                  <SortableStageItem
                    key={stage}
                    stage={stage}
                    stageProducts={getProductsByStage(stage)}
                    getStageColor={getStageColor}
                    getStageName={getStageName}
                    onStageClick={setStageDetailsFor}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>
      </div>

      {/* Модалка просмотра/редактирования заказа */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" onClick={handleCloseModal}>
          <div className="bg-card rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto m-4" onClick={(e) => e.stopPropagation()}>
            {/* Заголовок */}
            <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-card z-10">
              <div>
                <h2 className="text-lg font-bold">
                  {isEditing ? 'Редактировать' : 'Заказ'} {selectedOrder.orderNumber}
                </h2>
                <p className="text-xs text-muted-foreground">
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
                <button onClick={handleCloseModal} className="text-muted-foreground hover:text-foreground">
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
                      <span className="font-medium text-muted-foreground">Клиент:</span>
                      <p className="font-semibold">{selectedOrder.customerName}</p>
                    </div>
                    {selectedOrder.customerPhone && (
                      <div>
                        <span className="font-medium text-muted-foreground">Телефон:</span>
                        <p>{selectedOrder.customerPhone}</p>
                      </div>
                    )}
                    {selectedOrder.customerAddress && (
                      <div className="col-span-2">
                        <span className="font-medium text-muted-foreground">Адрес:</span>
                        <p>{selectedOrder.customerAddress}</p>
                      </div>
                    )}
                    {selectedOrder.description && (
                      <div className="col-span-2">
                        <span className="font-medium text-muted-foreground">Описание:</span>
                        <p className="whitespace-pre-wrap">{selectedOrder.description}</p>
                      </div>
                    )}
                    {selectedOrder.notes && (
                      <div className="col-span-2 bg-muted/40 rounded-md p-2 border-l-4 border-primary">
                        <span className="font-medium text-muted-foreground">Заметки:</span>
                        <p className="whitespace-pre-wrap">{selectedOrder.notes}</p>
                      </div>
                    )}
                    {selectedOrder.totalAmount && (
                      <div>
                        <span className="font-medium text-muted-foreground">Сумма:</span>
                        <p className="font-semibold">{selectedOrder.totalAmount.toLocaleString('ru-RU')} руб.</p>
                      </div>
                    )}
                    {selectedOrder.source && (
                      <div>
                        <span className="font-medium text-muted-foreground">Источник:</span>
                        <p>{selectedOrder.source.name}</p>
                      </div>
                    )}
                    {selectedOrder.createdBy && (
                      <div>
                        <span className="font-medium text-muted-foreground">Создал:</span>
                        <p>
                          {`${selectedOrder.createdBy.lastName ?? ''} ${selectedOrder.createdBy.firstName ?? ''}`.trim() || selectedOrder.createdBy.email}
                          {selectedOrder.createdBy.role?.name ? ` · ${selectedOrder.createdBy.role.name}` : ''}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Список позиций (продуктов) */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                      Позиции заказа
                      <span className="text-xs font-normal text-muted-foreground">
                        ({selectedOrder.products?.length || 0} шт.)
                      </span>
                    </h3>

                    {(!selectedOrder.products || selectedOrder.products.length === 0) ? (
                      <div className="text-center py-6 border-2 border-dashed border-border rounded-lg">
                        <p className="text-sm text-muted-foreground">Позиции не добавлены</p>
                        {canEdit && (
                          <button
                            onClick={handleStartEdit}
                            className="mt-2 text-sm text-primary hover:underline"
                          >
                            Добавить позиции
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {selectedOrder.products.map((product) => {
                          const isExpanded = expandedProductIds.has(product.id);
                          const activeTask = product.tasks?.find((t) => t.status === 'ACCEPTED' || t.status === 'NEW');
                          const completedTasks = product.tasks?.filter((t) => t.status === 'COMPLETED') || [];
                          return (
                            <div
                              key={product.id}
                              className={`border rounded-lg overflow-hidden ${
                                product.isCustom
                                  ? 'border-pink-400 ring-1 ring-pink-300 bg-pink-50/30'
                                  : ''
                              }`}
                            >
                              <button
                                type="button"
                                onClick={() =>
                                  setExpandedProductIds((prev) => {
                                    const next = new Set(prev);
                                    if (next.has(product.id)) next.delete(product.id);
                                    else next.add(product.id);
                                    return next;
                                  })
                                }
                                className="w-full flex items-center justify-between gap-3 px-3 py-2 hover:bg-muted/50 text-left"
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                  <div className="min-w-0">
                                    <div className="font-medium truncate flex items-center gap-2">
                                      {product.name}
                                      {product.isCustom && (
                                        <span className="shrink-0 inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-pink-500 text-white text-[10px] font-semibold uppercase">
                                          ★ Индивидуальный
                                        </span>
                                      )}
                                    </div>
                                    <div className="text-xs text-muted-foreground truncate">
                                      {product.productType?.name || '—'} · Кол-во: {product.quantity}
                                      {product.color && ` · Цвет: ${product.color}`}
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                  {activeTask?.assignedTo && (
                                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                      <UserIcon size={12} />
                                      {activeTask.assignedTo.firstName} {activeTask.assignedTo.lastName}
                                    </span>
                                  )}
                                  <span className={`inline-block px-2 py-0.5 rounded text-xs ${getStageColor(product.stage)}`}>
                                    {getStageName(product.stage)}
                                  </span>
                                </div>
                              </button>

                              {isExpanded && (
                                <div className="border-t bg-muted/20 p-3 space-y-3">
                                  {product.description && (
                                    <div className="bg-card rounded-md p-2 border-l-4 border-primary">
                                      <div className="text-xs font-medium text-muted-foreground mb-0.5">Комментарий к позиции:</div>
                                      <p className="text-sm whitespace-pre-wrap">{product.description}</p>
                                    </div>
                                  )}

                                  {(() => {
                                    const gallery = (product.schemaImageUrls && product.schemaImageUrls.length > 0
                                      ? product.schemaImageUrls
                                      : product.schemaImageUrl
                                        ? [product.schemaImageUrl]
                                        : []);
                                    if (gallery.length === 0) return null;
                                    return (
                                      <div>
                                        <div className="text-xs font-medium text-muted-foreground mb-1">
                                          Схема / фото {gallery.length > 1 ? `(${gallery.length})` : ''}:
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                          {gallery.map((url, i) => (
                                            <button
                                              key={i}
                                              type="button"
                                              onClick={() => setViewerImages({ images: gallery, index: i })}
                                              className="block cursor-zoom-in"
                                            >
                                              <img
                                                src={url}
                                                alt={`Схема ${i + 1}`}
                                                className="h-24 rounded-md border border-border object-cover bg-card hover:border-primary transition-colors"
                                              />
                                            </button>
                                          ))}
                                        </div>
                                      </div>
                                    );
                                  })()}

                                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                                    {product.dimensions && (
                                      <div>
                                        <span className="text-muted-foreground">Размеры:</span>{' '}
                                        <span className="font-medium">{product.dimensions}</span>
                                      </div>
                                    )}
                                    {product.color && (
                                      <div>
                                        <span className="text-muted-foreground">Цвет:</span>{' '}
                                        <span className="font-medium">{product.color}</span>
                                      </div>
                                    )}
                                    {product.upholsteryMaterial && (
                                      <div className="col-span-2">
                                        <span className="text-muted-foreground">Обшивка:</span>{' '}
                                        <span className="font-medium">{product.upholsteryMaterial}</span>
                                      </div>
                                    )}
                                    {product.deadline && (
                                      <div>
                                        <span className="text-muted-foreground">Дедлайн:</span>{' '}
                                        <span className="font-medium">
                                          {new Date(product.deadline).toLocaleDateString('ru-RU')}
                                        </span>
                                      </div>
                                    )}
                                  </div>

                                  <div>
                                    <div className="text-xs font-medium text-muted-foreground mb-1">
                                      Кто взял в производство:
                                    </div>
                                    {activeTask?.assignedTo ? (
                                      <div className="space-y-1.5">
                                        <div className="text-sm">
                                          <span className="font-medium">
                                            {activeTask.assignedTo.firstName} {activeTask.assignedTo.lastName}
                                          </span>
                                          {activeTask.assignedTo.role && (
                                            <span className="text-xs text-muted-foreground ml-2">
                                              (
                                              {typeof activeTask.assignedTo.role === 'object'
                                                ? activeTask.assignedTo.role.name
                                                : activeTask.assignedTo.role}
                                              )
                                            </span>
                                          )}
                                          <span className="text-xs text-muted-foreground ml-2">
                                            · этап: {getStageName(activeTask.stage)} · {taskStatusLabels[activeTask.status] || activeTask.status}
                                          </span>
                                        </div>
                                        {!activeTask.isDefect &&
                                          (activeTask.status === 'NEW' || activeTask.status === 'ACCEPTED') &&
                                          (user?.role?.code === 'OWNER' ||
                                            user?.role?.code === 'SUPER_ADMIN' ||
                                            user?.role?.code === 'MANAGER') && (
                                            <ReassignTaskControl
                                              taskId={activeTask.id}
                                              currentAssigneeId={activeTask.assignedTo.id}
                                            />
                                          )}
                                      </div>
                                    ) : (
                                      <p className="text-xs text-muted-foreground">Нет активных задач по этапу</p>
                                    )}
                                  </div>

                                  {completedTasks.length > 0 && (
                                    <div>
                                      <div className="text-xs font-medium text-muted-foreground mb-1">
                                        Выполнили этапы:
                                      </div>
                                      <ul className="text-xs space-y-0.5">
                                        {completedTasks.map((t) => (
                                          <li key={t.id}>
                                            {getStageName(t.stage)} —{' '}
                                            <span className="font-medium">
                                              {t.assignedTo?.firstName} {t.assignedTo?.lastName}
                                            </span>
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}

                                  {product.history && product.history.length > 0 && (
                                    <div>
                                      <div className="text-xs font-medium text-muted-foreground mb-1">
                                        История этапов:
                                      </div>
                                      <ul className="text-xs space-y-0.5">
                                        {product.history.map((h) => (
                                          <li key={h.id}>
                                            {getStageName(h.stage)} —{' '}
                                            {h.user && (
                                              <span className="font-medium">
                                                {h.user.firstName} {h.user.lastName}
                                              </span>
                                            )}
                                            {h.completedAt && (
                                              <span className="text-muted-foreground">
                                                {' '}
                                                · завершён {new Date(h.completedAt).toLocaleDateString('ru-RU')}
                                              </span>
                                            )}
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
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
                        <label className="block text-xs font-medium text-foreground mb-1">Имя клиента</label>
                        <input
                          value={editOrderForm.customerName}
                          onChange={(e) => setEditOrderForm({ ...editOrderForm, customerName: e.target.value })}
                          className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-foreground mb-1">Телефон</label>
                        <input
                          value={editOrderForm.customerPhone}
                          onChange={(e) => setEditOrderForm({ ...editOrderForm, customerPhone: e.target.value })}
                          className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-foreground mb-1">Адрес</label>
                      <input
                        value={editOrderForm.customerAddress}
                        onChange={(e) => setEditOrderForm({ ...editOrderForm, customerAddress: e.target.value })}
                        className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-foreground mb-1">Описание</label>
                      <textarea
                        value={editOrderForm.description}
                        onChange={(e) => setEditOrderForm({ ...editOrderForm, description: e.target.value })}
                        className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                        rows={2}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-foreground mb-1">Сумма заказа (руб.)</label>
                        <input
                          type="number"
                          value={editOrderForm.totalAmount}
                          onChange={(e) => setEditOrderForm({ ...editOrderForm, totalAmount: e.target.value })}
                          className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-foreground mb-1">Приоритет</label>
                        <select
                          value={editOrderForm.priority}
                          onChange={(e) => setEditOrderForm({ ...editOrderForm, priority: e.target.value })}
                          className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
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
                      <div className="text-center py-6 border-2 border-dashed border-border rounded-lg">
                        <p className="text-sm text-muted-foreground">Позиции не добавлены</p>
                        <p className="text-xs text-muted-foreground mt-1">Нажмите "Добавить позицию"</p>
                      </div>
                    )}

                    {editProducts.map((product, index) => (
                      <div
                        key={product.id || `new-${index}`}
                        className={`p-3 border rounded-lg space-y-2 ${
                          product.isCustom
                            ? 'border-pink-400 bg-pink-50/40 ring-1 ring-pink-300'
                            : product.stage && product.stage !== ProductionStage.PENDING && !product.isNew
                              ? 'border-amber-300 bg-amber-50/30'
                              : 'border-border'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-foreground">
                              {product.isNew ? 'Новая позиция' : product.name}
                            </span>
                            {product.isCustom && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-pink-500 text-white font-semibold uppercase">
                                ★ Индивидуальный
                              </span>
                            )}
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

                        <label className="flex items-center gap-2 p-1.5 bg-pink-50 border border-pink-200 rounded cursor-pointer">
                          <input
                            type="checkbox"
                            checked={!!product.isCustom}
                            onChange={(e) => handleUpdateProductField(index, 'isCustom', e.target.checked)}
                            className="w-4 h-4 accent-pink-500"
                          />
                          <span className="text-xs font-medium text-pink-900">★ Индивидуальный заказ</span>
                        </label>

                        {/* Nomenclature selector for new products */}
                        {product.isNew && (
                          <div>
                            <label className="block text-xs font-medium text-foreground mb-1">Выберите из каталога</label>
                            <select
                              value={product.nomenclatureId || ''}
                              onChange={(e) => handleNomenclatureSelect(index, e.target.value)}
                              className="w-full px-3 py-1.5 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
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
                            <label className="block text-xs font-medium text-foreground mb-1">Название</label>
                            <input
                              value={product.name}
                              onChange={(e) => handleUpdateProductField(index, 'name', e.target.value)}
                              className="w-full px-3 py-1.5 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                              placeholder="Название продукта"
                              disabled={!!product.nomenclatureId}
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-foreground mb-1">Кол-во</label>
                            <input
                              type="number"
                              min="1"
                              value={product.quantity}
                              onChange={(e) => handleUpdateProductField(index, 'quantity', parseInt(e.target.value) || 1)}
                              className="w-full px-3 py-1.5 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-xs font-medium text-foreground mb-1">Тип продукта</label>
                            <select
                              value={product.productTypeId}
                              onChange={(e) => handleUpdateProductField(index, 'productTypeId', e.target.value)}
                              className="w-full px-3 py-1.5 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
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
                            <label className="block text-xs font-medium text-foreground mb-1">Размеры</label>
                            <input
                              value={product.dimensions || ''}
                              onChange={(e) => handleUpdateProductField(index, 'dimensions', e.target.value)}
                              className="w-full px-3 py-1.5 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                              placeholder="ДxШxВ"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-xs font-medium text-foreground mb-1">Цвет/покрытие</label>
                            <input
                              value={product.color || ''}
                              onChange={(e) => handleUpdateProductField(index, 'color', e.target.value)}
                              className="w-full px-3 py-1.5 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                              placeholder="Например: Орех, код 906"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-foreground mb-1">Материал обшивки</label>
                            <input
                              value={product.upholsteryMaterial || ''}
                              onChange={(e) => handleUpdateProductField(index, 'upholsteryMaterial', e.target.value)}
                              className="w-full px-3 py-1.5 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                              placeholder="Экокожа, Велюр..."
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-foreground mb-1">Комментарий к позиции</label>
                          <textarea
                            value={product.description || ''}
                            onChange={(e) => handleUpdateProductField(index, 'description', e.target.value)}
                            className="w-full px-3 py-1.5 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                            rows={2}
                            placeholder="Особенности изделия, пожелания клиента, детали..."
                          />
                        </div>

                        {(() => {
                          const existingUrls = product.schemaImageUrls ?? [];
                          const pendingFiles = product.schemaFiles ?? [];
                          const totalCount = existingUrls.length + pendingFiles.length;
                          const canAddMore = totalCount < 10;
                          return (
                            <div>
                              <div className="flex items-center justify-between mb-1">
                                <label className="block text-xs font-medium text-foreground">Фото / схемы (до 10)</label>
                                <span className="text-xs text-muted-foreground">{totalCount}/10</span>
                              </div>
                              {totalCount > 0 && (
                                <div className="grid grid-cols-5 gap-2 mb-2">
                                  {existingUrls.map((url, urlIdx) => (
                                    <div key={`url-${urlIdx}`} className="relative group aspect-square">
                                      <img
                                        src={url}
                                        alt=""
                                        className="w-full h-full object-cover rounded-md border border-border cursor-zoom-in"
                                        onClick={() => setViewerImages({ images: existingUrls, index: urlIdx })}
                                      />
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const next = existingUrls.filter((_, i) => i !== urlIdx);
                                          handleUpdateProductField(index, 'schemaImageUrls', next);
                                          if (product.schemaImageUrl === url) {
                                            handleUpdateProductField(index, 'schemaImageUrl', next[0] || '');
                                          }
                                        }}
                                        className="absolute top-1 right-1 px-1 py-0.5 text-[10px] bg-red-600 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity"
                                      >
                                        ×
                                      </button>
                                    </div>
                                  ))}
                                  {pendingFiles.map((file, fileIdx) => (
                                    <div key={`file-${fileIdx}`} className="relative group aspect-square">
                                      <img
                                        src={URL.createObjectURL(file)}
                                        alt=""
                                        className="w-full h-full object-cover rounded-md border-2 border-amber-400"
                                      />
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const next = pendingFiles.filter((_, i) => i !== fileIdx);
                                          handleUpdateProductField(index, 'schemaFiles', next);
                                        }}
                                        className="absolute top-1 right-1 px-1 py-0.5 text-[10px] bg-red-600 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity"
                                      >
                                        ×
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              )}
                              {canAddMore && (
                                <label className="flex items-center justify-center gap-2 px-3 py-1.5 border border-dashed rounded-md text-xs cursor-pointer hover:bg-muted/50">
                                  <input
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    className="hidden"
                                    onChange={(e) => {
                                      const incoming = Array.from(e.target.files ?? []);
                                      if (incoming.length === 0) return;
                                      const slotsLeft = Math.max(0, 10 - totalCount);
                                      const next = [...pendingFiles, ...incoming.slice(0, slotsLeft)];
                                      handleUpdateProductField(index, 'schemaFiles', next);
                                      e.target.value = '';
                                    }}
                                  />
                                  {totalCount === 0 ? 'Загрузить фото' : 'Добавить ещё'}
                                </label>
                              )}
                              <p className="text-[10px] text-muted-foreground mt-1">Сжатие до 1024×768, макс. 5MB каждое</p>
                            </div>
                          );
                        })()}

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
                                    <label className="block text-xs text-muted-foreground mb-0.5">{icon} {label}</label>
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
                                      className="w-full px-2 py-1.5 border border-border rounded text-xs focus:outline-none focus:ring-1 focus:ring-ring"
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

      {viewerImages && (
        <SchemaImageViewer
          images={viewerImages.images}
          initialIndex={viewerImages.index}
          onClose={() => setViewerImages(null)}
        />
      )}

      {stageDetailsFor && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => setStageDetailsFor(null)}
        >
          <div
            className="bg-card rounded-lg shadow-xl max-w-2xl w-full max-h-[85vh] overflow-y-auto m-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-card z-10">
              <div>
                <h2 className="text-lg font-bold">{getStageName(stageDetailsFor)}</h2>
                <p className="text-xs text-muted-foreground">
                  В работе: {getProductsByStage(stageDetailsFor).length} поз.
                </p>
              </div>
              <button
                onClick={() => setStageDetailsFor(null)}
                className="text-muted-foreground hover:text-foreground"
                aria-label="Закрыть"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4">
              {getProductsByStage(stageDetailsFor).length === 0 ? (
                <div className="text-center text-sm text-muted-foreground py-8">
                  Нет позиций на этом этапе
                </div>
              ) : (
                <div className="space-y-2">
                  {getProductsByStage(stageDetailsFor).map((product) => {
                    const activeTask = product.tasks?.find(
                      (t) => t.stage === stageDetailsFor && !t.isDefect,
                    );
                    const worker = activeTask?.assignedTo;
                    const orderNumber = product.order?.orderNumber;
                    const customerName = product.order?.customerName;
                    const isAccepted = activeTask?.status === 'ACCEPTED';
                    return (
                      <div
                        key={product.id}
                        className="p-3 rounded-lg border hover:bg-muted/40 flex items-start justify-between gap-3"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium truncate">{product.name}</span>
                            {product.quantity > 1 && (
                              <span className="text-xs text-muted-foreground">
                                × {product.quantity}
                              </span>
                            )}
                            <span
                              className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                                isAccepted
                                  ? 'bg-primary/15 text-primary'
                                  : 'bg-muted text-muted-foreground'
                              }`}
                            >
                              {isAccepted ? 'В работе' : 'Ожидает'}
                            </span>
                          </div>
                          <div className="text-xs text-muted-foreground mt-0.5">
                            {orderNumber && <span className="font-mono">{orderNumber}</span>}
                            {customerName && <span> · {customerName}</span>}
                          </div>
                        </div>
                        <div className="shrink-0 text-right">
                          {worker ? (
                            <div className="flex items-center gap-1.5 text-sm">
                              <UserIcon className="w-3.5 h-3.5 text-muted-foreground" />
                              <span className="truncate">
                                {worker.lastName} {worker.firstName}
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground italic">
                              Не назначен
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
