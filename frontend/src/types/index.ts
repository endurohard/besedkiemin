// User roles
export enum UserRole {
  OWNER = 'OWNER',
  MANAGER = 'MANAGER',
  DESIGNER = 'DESIGNER',
  PREPARER = 'PREPARER',
  PAINTER = 'PAINTER',
  WAREHOUSE = 'WAREHOUSE',
}

// Order statuses
export enum OrderStatus {
  NEW = 'NEW',
  IN_PRODUCTION = 'IN_PRODUCTION',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

// Order priority
export enum OrderPriority {
  LOW = 'LOW',
  NORMAL = 'NORMAL',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

// Production stages
export enum ProductionStage {
  PENDING = 'PENDING',
  DESIGN = 'DESIGN',
  PREPARATION = 'PREPARATION',
  PAINTING = 'PAINTING',
  QUALITY_CHECK = 'QUALITY_CHECK',
  COMPLETED = 'COMPLETED',
  REJECTED = 'REJECTED',
}

// Product type interface
export interface ProductType {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  productionTimeHours?: number; // Нормативное время производства
  createdAt: string;
  updatedAt: string;
}

// Quality check status
export enum QualityStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

// Task status
export enum TaskStatus {
  NEW = 'NEW',
  ACCEPTED = 'ACCEPTED',
  COMPLETED = 'COMPLETED',
  PASSED = 'PASSED',
  REJECTED = 'REJECTED',
}

// Task priority
export enum TaskPriority {
  LOW = 'LOW',
  NORMAL = 'NORMAL',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

// Shipment status
export enum ShipmentStatus {
  PENDING = 'PENDING',
  IN_TRANSIT = 'IN_TRANSIT',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
}

// =============================================
// ПУБЛИЧНЫЙ КАТАЛОГ ТОВАРОВ
// =============================================

// Категория товаров из каталога
export interface CatalogCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  products?: CatalogProduct[];
}

// Товар из каталога
export interface CatalogProduct {
  id: string;
  name: string;
  slug: string;
  description?: string;
  shortDesc?: string;
  images: string[];
  dimensions?: string;
  material?: string;
  price?: number;
  priceNote?: string;
  features?: Record<string, any>;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  order: number;
  isActive: boolean;
  isFeatured: boolean;
  categoryId: string;
  category?: CatalogCategory;
  createdAt: string;
  updatedAt: string;
}

// Статус заказа из каталога
export enum CatalogOrderStatus {
  NEW = 'NEW',
  CONTACTED = 'CONTACTED',
  IN_WORK = 'IN_WORK',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

// Позиция заказа
export interface CatalogOrderItem {
  id: string;
  quantity: number;
  price?: number;
  comment?: string;
  productId: string;
  product?: CatalogProduct;
  orderId: string;
  createdAt: string;
}

// Заказ из каталога
export interface CatalogOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  comment?: string;
  status: CatalogOrderStatus;
  deliveryAddress?: string;
  totalAmount?: number;
  createdAt: string;
  updatedAt: string;
  items: CatalogOrderItem[];
}

// Запрос обратной связи
export interface ContactRequest {
  id: string;
  name: string;
  phone: string;
  email?: string;
  message: string;
  productId?: string;
  isProcessed: boolean;
  processedAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// User interface
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  // SIP телефония (для менеджеров)
  sipServer?: string;
  sipUser?: string;
  sipPassword?: string;
  sipPort?: number;
  sipWsPort?: number;
}

// Product interface
export interface Product {
  id: string;
  name: string;
  productTypeId: string;
  productType?: ProductType;
  quantity: number;
  dimensions?: string;
  schemaImageUrl?: string;
  stage: ProductionStage;
  orderId: string;
  deadline?: string;
  createdAt: string;
  updatedAt: string;
  order?: Order;
  history?: ProductHistory[];
}

// Product history interface
export interface ProductHistory {
  id: string;
  productId: string;
  stage: ProductionStage;
  userId: string;
  notes?: string;
  startedAt: string;
  completedAt?: string;
  createdAt: string;
  user?: User;
}

// Quality check interface
export interface QualityCheck {
  id: string;
  productId: string;
  status: QualityStatus;
  notes?: string;
  photoUrl?: string;
  checkedById: string;
  checkedAt: string;
  createdAt: string;
  updatedAt: string;
  product?: Product;
  checkedBy?: User;
}

// Order interface
export interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone?: string | null;
  customerAddress?: string;
  status: OrderStatus;
  priority: OrderPriority;
  description?: string;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  products?: Product[];
  createdBy?: User;
}

// Auth DTOs
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  user: User;
}

// Order DTOs
export interface CreateOrderDto {
  customerName: string;
  customerPhone?: string;
  customerAddress?: string;
  description?: string;
  priority?: OrderPriority;
}

export interface UpdateOrderDto extends Partial<CreateOrderDto> {
  status?: OrderStatus;
  priority?: OrderPriority;
}

// Product DTOs
export interface CreateProductDto {
  name: string;
  productTypeId: string;
  quantity: number;
  orderId: string;
  deadline?: string;
  dimensions?: string;
  schemaImageUrl?: string;
}

export interface UpdateProductDto extends Partial<CreateProductDto> {
  stage?: ProductionStage;
}

export interface MoveProductDto {
  stage: ProductionStage;
  notes?: string;
}

// Quality check DTOs
export interface CreateQualityCheckDto {
  productId: string;
  status: QualityStatus;
  notes?: string;
}

export interface UpdateQualityCheckDto extends Partial<CreateQualityCheckDto> {}

// ProductType DTOs
export interface CreateProductTypeDto {
  name: string;
  description?: string;
  isActive?: boolean;
  productionTimeHours?: number;
}

export interface UpdateProductTypeDto extends Partial<CreateProductTypeDto> {}

// Statistics interface
export interface Statistics {
  total: number;
  new: number;
  inProduction: number;
  completed: number;
  cancelled: number;
}

// User management DTOs (only for OWNER)
export interface CreateUserDto {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  // SIP телефония (для менеджеров)
  sipServer?: string;
  sipUser?: string;
  sipPassword?: string;
  sipPort?: number;
}

export interface UpdateUserDto extends Partial<CreateUserDto> {
  isActive?: boolean;
  telegramId?: string;
  // SIP телефония (для менеджеров)
  sipServer?: string;
  sipUser?: string;
  sipPassword?: string;
  sipPort?: number;
}

// Task interface
export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  stage: ProductionStage;
  quantity: number;
  priority: TaskPriority; // Приоритет задачи
  acceptedAt?: string;
  completedAt?: string;
  passedAt?: string;
  rejectedAt?: string;
  notes?: string;
  defectPhotos: string[]; // Массив URL фото брака
  quantityProcessed: number; // Количество уже обработанное
  productId: string;
  assignedToId: string;
  createdAt: string;
  updatedAt: string;
  product?: Product;
  assignedTo?: User;
}

// Task action DTOs
export interface AcceptTaskDto {
  // no body needed
}

export interface CompleteTaskDto {
  notes?: string;
  quantity?: number;
}

export interface PassTaskDto {
  // no body needed
}

export interface RejectTaskDto {
  notes: string;
  quantity?: number;
  defectPhotoUrl?: string;
  requestPhoto?: boolean; // Запросить фото через Telegram бот
  returnToStage?: string; // Стадия для возврата брака
}

export interface ApproveTaskDto {
  quantity: number;
}

// Analytics interfaces (only for OWNER)
export interface ProductionOverview {
  orders: {
    total: number;
    active: number;
    completed: number;
    completionRate: string;
  };
  products: {
    total: number;
    inProduction: number;
    completed: number;
    rejected: number;
    pendingQualityCheck: number;
    completionRate: string;
  };
  stageDistribution: Record<string, number>;
}

export interface UserPerformance {
  user: {
    id: string;
    name: string;
    role: UserRole;
  };
  stats: {
    completedTasks: number;
    avgTaskDurationHours: number;
    hasActiveTask: boolean;
    activeTask: {
      productName: string;
      orderNumber: string;
      stage: ProductionStage;
      startedAt: string;
    } | null;
  };
}

export interface QualityStats {
  total: number;
  approved: number;
  rejected: number;
  pending: number;
  approvalRate: string;
  recentRejections: Array<{
    id: string;
    productName: string;
    orderNumber: string;
    customerName: string;
    reason: string | null;
    checkedBy: string;
    checkedAt: string | null;
  }>;
}

export interface ProductTypeStats {
  type: string;
  total: number;
  completed: number;
  inProduction: number;
  rejected: number;
  completionRate: string;
}

export interface PerformanceSummary {
  period: {
    start: string;
    end: string;
    days: number;
  };
  ordersCreated: number;
  ordersCompleted: number;
  productsCompleted: number;
  qualityChecksPerformed: number;
  avgProductsPerDay: number;
}

// Inventory (складские остатки)
export interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  productId: string;
  productTypeId: string;
  orderId: string;
  receivedAt: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  product?: Product;
  productType?: ProductType;
  order?: Order;
  shipments?: Shipment[];
}

// Shipment Item (позиция в отгрузке)
export interface ShipmentItem {
  id: string;
  quantity: number;
  shipmentId: string;
  inventoryItemId: string;
  inventoryItem?: InventoryItem;
  createdAt: string;
  updatedAt: string;
}

// Shipment (отгрузки)
export interface Shipment {
  id: string;
  status: ShipmentStatus;
  items: ShipmentItem[];
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  deliveryDate?: string;
  shippedById: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  shippedBy?: User;
}

// Inventory DTOs
export interface CreateShipmentDto {
  items: Array<{
    inventoryItemId: string;
    quantity: number;
  }>;
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  deliveryDate?: string;
  notes?: string;
}

export interface UpdateShipmentStatusDto {
  status: ShipmentStatus;
}

// Workflow Stage interface
export interface WorkflowStage {
  id: string;
  name: string;
  description?: string;
  order: number;
  role: UserRole;
  isActive: boolean;
  legacyStage?: ProductionStage;
  createdAt: string;
  updatedAt: string;
}

// Workflow DTOs
export interface CreateWorkflowStageDto {
  name: string;
  description?: string;
  order: number;
  role: UserRole;
  legacyStage?: ProductionStage;
  isActive?: boolean;
}

export interface UpdateWorkflowStageDto {
  name?: string;
  description?: string;
  order?: number;
  role?: UserRole;
  legacyStage?: ProductionStage;
  isActive?: boolean;
}

export interface ReorderWorkflowStagesDto {
  stageIds: string[];
}

// Full Cycle Analytics
export interface CycleDurations {
  fullCycleHours: number;
  productionHours: number;
  warehouseHours: number;
  deliveryHours: number;
  stageHours: Record<string, number>;
}

export interface CompletedCycle {
  orderNumber: string;
  customerName: string;
  productName: string;
  productType: string;
  quantity: number;
  orderCreatedAt: string;
  deliveredAt: string;
  durations: CycleDurations;
}

export interface OrderInProgress {
  orderNumber: string;
  customerName: string;
  createdAt: string;
  currentDurationHours: number;
  totalProducts: number;
  completedProducts: number;
  completionPercent: number;
  products: Array<{
    name: string;
    type: string;
    stage: ProductionStage;
    quantity: number;
  }>;
}

export interface FullCycleAnalytics {
  period: {
    start: string;
    end: string;
    days: number;
  };
  summary: {
    totalDelivered: number;
    avgFullCycleHours: number;
    avgProductionHours: number;
    avgWarehouseHours: number;
    avgDeliveryHours: number;
    avgStageHours: Record<string, number>;
  };
  completedCycles: CompletedCycle[];
  ordersInProgress: OrderInProgress[];
}

// Company Settings
export interface CompanySettings {
  id: string;
  companyName: string;
  phone: string;
  email: string;
  address: string;
  website: string;
  inn: string;
  director: string;
  bank: string;
  bik: string;
  accountNumber: string;
  logoUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateCompanySettingsDto {
  companyName?: string;
  phone?: string;
  email?: string;
  address?: string;
  website?: string;
  inn?: string;
  director?: string;
  bank?: string;
  bik?: string;
  accountNumber?: string;
  logoUrl?: string;
}
