// Role interface (dynamic roles)
export interface Role {
  id: string;
  name: string;
  code: string;
  description?: string;
  color?: string;
  isSystem: boolean;
  isActive: boolean;
  order: number;
  permissions: string[];
  workflowStages?: { workflowStage: WorkflowStage }[];
  _count?: { users: number };
  createdAt: string;
  updatedAt: string;
}

// Permission interface
export interface Permission {
  code: string;
  name: string;
  group: string;
}

// User roles - kept for backward compatibility (use role.code instead)
export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  OWNER = 'OWNER',
  MANAGER = 'MANAGER',
  DESIGNER = 'DESIGNER',
  PREPARER = 'PREPARER',
  PAINTER = 'PAINTER',
  SEWER = 'SEWER',
  ASSEMBLER = 'ASSEMBLER',
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
  SEWING = 'SEWING',
  ASSEMBLY = 'ASSEMBLY',
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
  requiresSewing?: boolean; // Требуется ли этап пошива для этого типа
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

// Номенклатура товаров
export interface Nomenclature {
  id: string;
  name: string;
  sku?: string;
  description?: string;
  productTypeId: string;
  productType?: ProductType;
  dimensions?: string;
  materials?: string;
  color?: string;
  upholsteryMaterial?: string; // Материал обшивки (ткань/кожа)
  weight?: number;
  costPrice?: number;
  retailPrice?: number;
  productionTimeHours?: number;
  isActive: boolean;
  discontinuedAt?: string | null; // Дата прекращения выпуска
  createdAt: string;
  updatedAt: string;
}

export interface CreateNomenclatureDto {
  name: string;
  sku?: string;
  description?: string;
  productTypeId: string;
  dimensions?: string;
  materials?: string;
  color?: string;
  upholsteryMaterial?: string; // Материал обшивки
  weight?: number;
  costPrice?: number;
  retailPrice?: number;
  productionTimeHours?: number;
  isActive?: boolean;
}

export interface UpdateNomenclatureDto extends Partial<CreateNomenclatureDto> {}

// User interface
export type PaymentType = 'PIECE_RATE' | 'SALARY';

export interface User {
  id: string;
  email?: string;
  firstName: string;
  lastName: string;
  roleId: string;
  role: Role; // Dynamic role object
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  // Тип оплаты
  paymentType: PaymentType;
  monthlySalary?: number | null;
  // Telegram для уведомлений
  telegramId?: string;
  // SIP телефония (для менеджеров)
  sipServer?: string;
  sipUser?: string;
  sipPassword?: string;
  sipPort?: number;
  sipWsPort?: number;
  adminPassword?: string | null;
}

// Product interface
export interface Product {
  id: string;
  name: string;
  description?: string;
  productTypeId: string;
  productType?: ProductType;
  quantity: number;
  dimensions?: string;
  schemaImageUrl?: string;
  schemaImageUrls?: string[];
  stage: ProductionStage;
  orderId: string;
  deadline?: string;
  requiresSewing?: boolean | null; // null = берётся из типа продукта
  color?: string; // Цвет/покрытие (для маляра)
  upholsteryMaterial?: string; // Материал обшивки (ткань/кожа) - если указан, автоматически включается пошив
  isCustom?: boolean; // Индивидуальный заказ
  needsDesign?: boolean; // Требуется проектирование перед производством
  createdAt: string;
  updatedAt: string;
  order?: Order;
  history?: ProductHistory[];
  tasks?: Array<{
    id: string;
    stage: ProductionStage;
    status: string;
    isDefect?: boolean;
    assignedTo?: {
      id: string;
      firstName: string;
      lastName: string;
      role?: { code: string; name: string } | string | null;
    };
  }>;
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

// Order Source interface (источник заказа)
export interface OrderSource {
  id: string;
  name: string;
  code: string;
  description?: string;
  color?: string;
  icon?: string;
  isActive: boolean;
  order: number;
  _count?: { orders: number };
  createdAt: string;
  updatedAt: string;
}

// Order Source DTOs
export interface CreateOrderSourceDto {
  name: string;
  code: string;
  description?: string;
  color?: string;
  icon?: string;
  isActive?: boolean;
  order?: number;
}

export interface UpdateOrderSourceDto extends Partial<CreateOrderSourceDto> {}

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
  notes?: string;
  sourceId?: string;
  source?: OrderSource;
  totalAmount?: number;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  products?: Product[];
  createdBy?: User;
}

// Auth DTOs
export interface LoginRequest {
  email?: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  user: User;
}

// Order DTOs
export interface CreateOrderDto {
  orderNumber?: string;
  customerName: string;
  customerPhone?: string;
  customerAddress?: string;
  description?: string;
  priority?: OrderPriority;
  sourceId?: string;
  totalAmount?: number;
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
  description?: string;
  deadline?: string;
  dimensions?: string;
  schemaImageUrl?: string;
  schemaImageUrls?: string[];
  requiresSewing?: boolean | null;
  color?: string; // Цвет/покрытие (для маляра)
  upholsteryMaterial?: string; // Материал обшивки (для швеи)
  isCustom?: boolean; // Индивидуальный заказ
  needsDesign?: boolean; // Требуется проектирование перед производством
  assignedWorkerId?: string;
  stageAssignments?: Record<string, string>;
}

export interface UpdateProductDto extends Partial<CreateProductDto> {
  stage?: ProductionStage;
  requiresSewing?: boolean | null;
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
  email?: string;
  password: string;
  firstName: string;
  lastName: string;
  roleId: string; // ID роли
  paymentType?: PaymentType;
  monthlySalary?: number;
  // SIP телефония (для менеджеров)
  sipServer?: string;
  sipUser?: string;
  sipPassword?: string;
  sipPort?: number;
}

export interface UpdateUserDto extends Partial<CreateUserDto> {
  isActive?: boolean;
  telegramId?: string;
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
  isDefect?: boolean; // Задача-доработка брака
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
  penaltyAmount?: number; // Сумма штрафа при браке
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
    role: { code: string; name: string }; // Dynamic role
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
  orderNumber?: string;
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
  orderNumber?: string;
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
  email?: string;
  address: string;
  website: string;
  supportTelegram: string;
  inn: string;
  director: string;
  bank: string;
  bik: string;
  accountNumber: string;
  logoUrl: string | null;
  // Рабочие часы для онлайн-чата
  chatEnabled: boolean;
  workingHoursStart: string;
  workingHoursEnd: string;
  workingDays: string;
  timezone: string;
  offlineMessage: string;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateCompanySettingsDto {
  companyName?: string;
  phone?: string;
  email?: string;
  address?: string;
  website?: string;
  supportTelegram?: string;
  inn?: string;
  director?: string;
  bank?: string;
  bik?: string;
  accountNumber?: string;
  logoUrl?: string;
}

// Telegram Authorization
export interface TelegramLoginCodeRequest {
  email?: string;
  password: string;
}

export interface TelegramLoginCodeResponse {
  code: string;
  expiresIn: number;
  message: string;
}

export interface TelegramCheckAuthRequest {
  code: string;
}

export interface TelegramCheckAuthResponse {
  status?: 'pending';
  message?: string;
  access_token?: string;
  user?: User;
}

// Feature Flags (переключатели функций для супер-админа)
export interface FeatureFlag {
  id: string;
  key: string;
  name: string;
  description?: string;
  isEnabled: boolean;
  category: string;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateFeatureFlagDto {
  name?: string;
  description?: string;
  isEnabled?: boolean;
  category?: string;
}

export type FeatureFlagsMap = Record<string, boolean>;

// =============================================
// РАСЧЕТ ЗАРПЛАТЫ (PAYROLL)
// =============================================

// Статус расчетного периода
export enum PayrollStatus {
  DRAFT = 'DRAFT',
  APPROVED = 'APPROVED',
  PAID = 'PAID',
  CANCELLED = 'CANCELLED',
}

// Расценка за работу
export interface WorkRate {
  id: string;
  productTypeId: string;
  productType?: ProductType;
  nomenclatureId?: string;
  nomenclature?: Nomenclature;
  stage: ProductionStage;
  workflowStageId?: string;
  workflowStage?: WorkflowStage;
  pricePerUnit: number;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Журнал выполненных работ
export interface WorkLog {
  id: string;
  userId: string;
  user?: User;
  productId: string;
  product?: Product;
  taskId?: string;
  task?: Task;
  productTypeId: string;
  productType?: ProductType;
  stage: ProductionStage;
  workflowStageId?: string;
  workflowStage?: WorkflowStage;
  quantity: number;
  pricePerUnit: number;
  totalAmount: number;
  completedAt: string;
  notes?: string;
  payrollPeriodId?: string;
  createdAt: string;
  updatedAt: string;
}

// Штраф
export interface Penalty {
  id: string;
  userId: string;
  user?: User;
  amount: number;
  reason: string;
  productId?: string;
  product?: Product;
  date: string;
  isCancelled: boolean;
  cancelledAt?: string;
  cancelledById?: string;
  cancelledBy?: User;
  notes?: string;
  createdById: string;
  createdBy?: User;
  payrollPeriodId?: string;
  createdAt: string;
  updatedAt: string;
}

// Расчетный период
export interface PayrollPeriod {
  id: string;
  userId: string;
  user?: User;
  periodStart: string;
  periodEnd: string;
  baseSalary: number;
  workAmount: number;
  commissionAmount: number;
  penaltyAmount: number;
  totalAmount: number;
  status: PayrollStatus;
  approvedById?: string;
  approvedBy?: User;
  approvedAt?: string;
  paidById?: string;
  paidBy?: User;
  paidAt?: string;
  notes?: string;
  workLogs?: WorkLog[];
  penalties?: Penalty[];
  createdAt: string;
  updatedAt: string;
}

// Настройки комиссии менеджера
export interface ManagerCommission {
  id: string;
  userId?: string;
  user?: User;
  roleId?: string;
  role?: Role;
  baseSalary: number;
  commissionPercent: number;
  minOrderAmount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Сводка по зарплате
export interface PayrollSummary {
  periodStart: string;
  periodEnd: string;
  users: Array<{
    userId: string;
    userName: string;
    role: string;
    workAmount: number;
    commissionAmount: number;
    penaltyAmount: number;
    totalAmount: number;
    workLogsCount: number;
    penaltiesCount: number;
  }>;
  totals: {
    workAmount: number;
    commissionAmount: number;
    penaltyAmount: number;
    totalAmount: number;
  };
}

// DTOs для Payroll
export interface CreateWorkRateDto {
  productTypeId: string;
  nomenclatureId?: string;
  stage: ProductionStage;
  workflowStageId?: string;
  pricePerUnit: number;
  description?: string;
  isActive?: boolean;
}

export interface UpdateWorkRateDto {
  pricePerUnit?: number;
  description?: string;
  isActive?: boolean;
}

export interface CreatePenaltyDto {
  userId: string;
  amount: number;
  reason: string;
  productId?: string;
  date?: string;
  notes?: string;
}

export interface UpdatePenaltyDto {
  amount?: number;
  reason?: string;
  notes?: string;
}

export interface CalculatePayrollDto {
  periodStart: string;
  periodEnd: string;
  userIds?: string[];
}

export interface CreateManagerCommissionDto {
  userId?: string;
  roleId?: string;
  baseSalary?: number;
  commissionPercent: number;
  minOrderAmount?: number;
  isActive?: boolean;
}

export interface UpdateManagerCommissionDto {
  baseSalary?: number;
  commissionPercent?: number;
  minOrderAmount?: number;
  isActive?: boolean;
}