import axios from 'axios';
import type {
  LoginRequest,
  LoginResponse,
  Order,
  CreateOrderDto,
  UpdateOrderDto,
  Product,
  CreateProductDto,
  UpdateProductDto,
  MoveProductDto,
  ProductHistory,
  ProductType,
  CreateProductTypeDto,
  UpdateProductTypeDto,
  QualityCheck,
  CreateQualityCheckDto,
  UpdateQualityCheckDto,
  Statistics,
  User,
  OrderStatus,
  ProductionStage,
  CreateUserDto,
  UpdateUserDto,
  ProductionOverview,
  UserPerformance,
  QualityStats,
  ProductTypeStats,
  PerformanceSummary,
  Task,
  CompleteTaskDto,
  RejectTaskDto,
  ApproveTaskDto,
  InventoryItem,
  Shipment,
  CreateShipmentDto,
  UpdateShipmentStatusDto,
  ShipmentStatus,
  FullCycleAnalytics,
  WorkflowStage,
  CreateWorkflowStageDto,
  UpdateWorkflowStageDto,
  ReorderWorkflowStagesDto,
  CompanySettings,
  UpdateCompanySettingsDto,
  TelegramLoginCodeRequest,
  TelegramLoginCodeResponse,
  TelegramCheckAuthRequest,
  TelegramCheckAuthResponse,
  FeatureFlag,
  UpdateFeatureFlagDto,
  FeatureFlagsMap,
  Nomenclature,
  CreateNomenclatureDto,
  UpdateNomenclatureDto,
  Role,
  Permission,
  OrderSource,
  CreateOrderSourceDto,
  UpdateOrderSourceDto,
  WorkRate,
  WorkLog,
  Penalty,
  PayrollPeriod,
  ManagerCommission,
  PayrollSummary,
  PayrollStatus,
  CreateWorkRateDto,
  UpdateWorkRateDto,
  CreatePenaltyDto,
  UpdatePenaltyDto,
  CalculatePayrollDto,
  CreateManagerCommissionDto,
  UpdateManagerCommissionDto,
} from '@/types';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor для добавления токена
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor для обработки ошибок
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/app/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    const response = await api.post<LoginResponse>('/auth/login', data);
    return response.data;
  },

  getProfile: async (): Promise<User> => {
    const response = await api.get<User>('/auth/profile');
    return response.data;
  },

  requestTelegramCode: async (data: TelegramLoginCodeRequest): Promise<TelegramLoginCodeResponse> => {
    const response = await api.post<TelegramLoginCodeResponse>('/auth/telegram/request-code', data);
    return response.data;
  },

  checkTelegramAuth: async (data: TelegramCheckAuthRequest): Promise<TelegramCheckAuthResponse> => {
    const response = await api.post<TelegramCheckAuthResponse>('/auth/telegram/check-auth', data);
    return response.data;
  },
};

// Paginated response type
interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// Orders API
export const ordersApi = {
  getAll: async (params?: {
    status?: OrderStatus;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }): Promise<Order[]> => {
    const response = await api.get<PaginatedResponse<Order>>('/orders', { params });
    return response.data.data;
  },

  getOne: async (id: string): Promise<Order> => {
    const response = await api.get<Order>(`/orders/${id}`);
    return response.data;
  },

  create: async (data: CreateOrderDto): Promise<Order> => {
    const response = await api.post<Order>('/orders', data);
    return response.data;
  },

  update: async (id: string, data: UpdateOrderDto): Promise<Order> => {
    const response = await api.patch<Order>(`/orders/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/orders/${id}`);
  },

  getStatistics: async (params?: {
    startDate?: string;
    endDate?: string;
  }): Promise<Statistics> => {
    const response = await api.get<Statistics>('/orders/statistics', { params });
    return response.data;
  },

  exportToExcel: async (params?: {
    status?: OrderStatus;
    startDate?: string;
    endDate?: string;
  }): Promise<Blob> => {
    const response = await api.get('/orders/export', {
      params,
      responseType: 'blob',
    });
    return response.data;
  },
};

// Products API
export const productsApi = {
  getAll: async (params?: {
    orderId?: string;
    stage?: ProductionStage;
  }): Promise<Product[]> => {
    const response = await api.get<Product[]>('/products', { params });
    return response.data;
  },

  getByStage: async (stage: ProductionStage): Promise<Product[]> => {
    const response = await api.get<Product[]>(`/products/stage/${stage}`);
    return response.data;
  },

  getOne: async (id: string): Promise<Product> => {
    const response = await api.get<Product>(`/products/${id}`);
    return response.data;
  },

  getHistory: async (id: string): Promise<ProductHistory[]> => {
    const response = await api.get<ProductHistory[]>(`/products/${id}/history`);
    return response.data;
  },

  create: async (data: CreateProductDto): Promise<Product> => {
    const response = await api.post<Product>('/products', data);
    return response.data;
  },

  update: async (id: string, data: UpdateProductDto): Promise<Product> => {
    const response = await api.patch<Product>(`/products/${id}`, data);
    return response.data;
  },

  moveToStage: async (id: string, data: MoveProductDto): Promise<Product> => {
    const response = await api.post<Product>(`/products/${id}/move`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/products/${id}`);
  },
};

// Product Types API
export const productTypesApi = {
  getAll: async (includeInactive = false): Promise<ProductType[]> => {
    const response = await api.get<ProductType[]>('/product-types', {
      params: { includeInactive },
    });
    return response.data;
  },

  getOne: async (id: string): Promise<ProductType> => {
    const response = await api.get<ProductType>(`/product-types/${id}`);
    return response.data;
  },

  create: async (data: CreateProductTypeDto): Promise<ProductType> => {
    const response = await api.post<ProductType>('/product-types', data);
    return response.data;
  },

  update: async (id: string, data: UpdateProductTypeDto): Promise<ProductType> => {
    const response = await api.patch<ProductType>(`/product-types/${id}`, data);
    return response.data;
  },

  toggleActive: async (id: string): Promise<ProductType> => {
    const response = await api.post<ProductType>(`/product-types/${id}/toggle-active`);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/product-types/${id}`);
  },
};

// Nomenclature API
export const nomenclatureApi = {
  getAll: async (includeInactive = false): Promise<Nomenclature[]> => {
    const response = await api.get<Nomenclature[]>('/nomenclature', {
      params: { includeInactive },
    });
    return response.data;
  },

  getByProductType: async (productTypeId: string, includeInactive = false): Promise<Nomenclature[]> => {
    const response = await api.get<Nomenclature[]>(`/nomenclature/by-type/${productTypeId}`, {
      params: { includeInactive },
    });
    return response.data;
  },

  getOne: async (id: string): Promise<Nomenclature> => {
    const response = await api.get<Nomenclature>(`/nomenclature/${id}`);
    return response.data;
  },

  create: async (data: CreateNomenclatureDto): Promise<Nomenclature> => {
    const response = await api.post<Nomenclature>('/nomenclature', data);
    return response.data;
  },

  update: async (id: string, data: UpdateNomenclatureDto): Promise<Nomenclature> => {
    const response = await api.patch<Nomenclature>(`/nomenclature/${id}`, data);
    return response.data;
  },

  toggleActive: async (id: string): Promise<Nomenclature> => {
    const response = await api.patch<Nomenclature>(`/nomenclature/${id}/toggle-active`);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/nomenclature/${id}`);
  },
};

// Quality Checks API
export const qualityChecksApi = {
  getAll: async (params?: {
    productId?: string;
    status?: string;
  }): Promise<QualityCheck[]> => {
    const response = await api.get<QualityCheck[]>('/quality-checks', { params });
    return response.data;
  },

  getRejected: async (): Promise<QualityCheck[]> => {
    const response = await api.get<QualityCheck[]>('/quality-checks/rejected');
    return response.data;
  },

  getByProduct: async (productId: string): Promise<QualityCheck[]> => {
    const response = await api.get<QualityCheck[]>(`/quality-checks/product/${productId}`);
    return response.data;
  },

  getOne: async (id: string): Promise<QualityCheck> => {
    const response = await api.get<QualityCheck>(`/quality-checks/${id}`);
    return response.data;
  },

  create: async (data: CreateQualityCheckDto, photo?: File): Promise<QualityCheck> => {
    const formData = new FormData();
    formData.append('productId', data.productId);
    formData.append('status', data.status);
    if (data.notes) {
      formData.append('notes', data.notes);
    }
    if (photo) {
      formData.append('photo', photo);
    }

    const response = await api.post<QualityCheck>('/quality-checks', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  update: async (
    id: string,
    data: UpdateQualityCheckDto,
    photo?: File
  ): Promise<QualityCheck> => {
    const formData = new FormData();
    if (data.productId) formData.append('productId', data.productId);
    if (data.status) formData.append('status', data.status);
    if (data.notes) formData.append('notes', data.notes);
    if (photo) formData.append('photo', photo);

    const response = await api.patch<QualityCheck>(`/quality-checks/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/quality-checks/${id}`);
  },
};

// Users API (только для OWNER)
export const usersApi = {
  getAll: async (): Promise<User[]> => {
    const response = await api.get<User[]>('/users');
    return response.data;
  },

  getOne: async (id: string): Promise<User> => {
    const response = await api.get<User>(`/users/${id}`);
    return response.data;
  },

  create: async (data: CreateUserDto): Promise<User> => {
    const response = await api.post<User>('/users', data);
    return response.data;
  },

  update: async (id: string, data: UpdateUserDto): Promise<User> => {
    const response = await api.patch<User>(`/users/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<{ message: string }> => {
    const response = await api.delete<{ message: string }>(`/users/${id}`);
    return response.data;
  },

  toggleActive: async (id: string): Promise<User> => {
    const response = await api.post<User>(`/users/${id}/toggle-active`);
    return response.data;
  },
};

// Tasks API
export const tasksApi = {
  getMyTasks: async (): Promise<Task[]> => {
    const response = await api.get<Task[]>('/tasks/my');
    return response.data;
  },

  acceptTask: async (id: string, selectedUserId?: string): Promise<Task> => {
    const response = await api.post<Task>(`/tasks/${id}/accept`, { selectedUserId });
    return response.data;
  },

  getDepartmentWorkers: async (): Promise<Array<{
    id: string;
    firstName: string;
    lastName: string;
    role: { id: string; name: string; code: string };
  }>> => {
    const response = await api.get('/tasks/department-workers');
    return response.data;
  },

  completeTask: async (id: string, data?: CompleteTaskDto): Promise<Task> => {
    const response = await api.post<Task>(`/tasks/${id}/complete`, data);
    return response.data;
  },

  passTask: async (id: string): Promise<Task> => {
    const response = await api.post<Task>(`/tasks/${id}/pass`);
    return response.data;
  },

  rejectTask: async (id: string, data: RejectTaskDto): Promise<Task> => {
    const response = await api.post<Task>(`/tasks/${id}/reject`, data);
    return response.data;
  },

  approveTask: async (id: string, data: ApproveTaskDto): Promise<Task> => {
    const response = await api.post<Task>(`/tasks/${id}/approve`, data);
    return response.data;
  },
};

// Analytics API (только для OWNER)
export const analyticsApi = {
  getProductionOverview: async (): Promise<ProductionOverview> => {
    const response = await api.get<ProductionOverview>('/analytics/production/overview');
    return response.data;
  },

  getUserPerformance: async (): Promise<UserPerformance[]> => {
    const response = await api.get<UserPerformance[]>('/analytics/users/performance');
    return response.data;
  },

  getQualityStats: async (): Promise<QualityStats> => {
    const response = await api.get<QualityStats>('/analytics/quality/stats');
    return response.data;
  },

  getProductTypeStats: async (): Promise<ProductTypeStats[]> => {
    const response = await api.get<ProductTypeStats[]>('/analytics/products/types');
    return response.data;
  },

  getPerformanceSummary: async (params?: {
    startDate?: string;
    endDate?: string;
  }): Promise<PerformanceSummary> => {
    const response = await api.get<PerformanceSummary>('/analytics/performance/summary', {
      params,
    });
    return response.data;
  },

  getFullCycleAnalytics: async (params?: {
    startDate?: string;
    endDate?: string;
  }): Promise<FullCycleAnalytics> => {
    const response = await api.get<FullCycleAnalytics>('/analytics/full-cycle', {
      params,
    });
    return response.data;
  },
};

// Upload API
export const uploadApi = {
  uploadSchemaImage: async (file: File): Promise<{ url: string; filename: string }> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post<{ url: string; filename: string }>('/upload/schema-image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};

// Inventory API (складские остатки)
export const inventoryApi = {
  getAll: async (): Promise<InventoryItem[]> => {
    const response = await api.get<InventoryItem[]>('/inventory');
    return response.data;
  },

  getSummary: async (): Promise<any> => {
    const response = await api.get<any>('/inventory/summary');
    return response.data;
  },

  getByType: async (productTypeId: string): Promise<InventoryItem[]> => {
    const response = await api.get<InventoryItem[]>(`/inventory/type/${productTypeId}`);
    return response.data;
  },

  getByOrder: async (orderId: string): Promise<InventoryItem[]> => {
    const response = await api.get<InventoryItem[]>(`/inventory/order/${orderId}`);
    return response.data;
  },

  getOne: async (id: string): Promise<InventoryItem> => {
    const response = await api.get<InventoryItem>(`/inventory/${id}`);
    return response.data;
  },

  create: async (data: {
    name: string;
    productTypeId: string;
    quantity: number;
    notes?: string;
  }): Promise<InventoryItem> => {
    const response = await api.post<InventoryItem>('/inventory', data);
    return response.data;
  },
};

// Shipments API (отгрузки)
export const shipmentsApi = {
  getAll: async (): Promise<Shipment[]> => {
    const response = await api.get<Shipment[]>('/shipments');
    return response.data;
  },

  getByStatus: async (status: ShipmentStatus): Promise<Shipment[]> => {
    const response = await api.get<Shipment[]>(`/shipments/status/${status}`);
    return response.data;
  },

  getOne: async (id: string): Promise<Shipment> => {
    const response = await api.get<Shipment>(`/shipments/${id}`);
    return response.data;
  },

  create: async (data: CreateShipmentDto): Promise<Shipment> => {
    const response = await api.post<Shipment>('/shipments', data);
    return response.data;
  },

  updateStatus: async (id: string, data: UpdateShipmentStatusDto): Promise<Shipment> => {
    const response = await api.patch<Shipment>(`/shipments/${id}/status`, data);
    return response.data;
  },

  cancel: async (id: string): Promise<Shipment> => {
    const response = await api.post<Shipment>(`/shipments/${id}/cancel`);
    return response.data;
  },

  getWaybillData: async (id: string): Promise<any> => {
    const response = await api.get(`/shipments/${id}/waybill`);
    return response.data;
  },
};

// Workflow API (производственный цикл)
export const workflowApi = {
  getAll: async (): Promise<WorkflowStage[]> => {
    const response = await api.get<WorkflowStage[]>('/workflow');
    return response.data;
  },

  getActive: async (): Promise<WorkflowStage[]> => {
    const response = await api.get<WorkflowStage[]>('/workflow/active');
    return response.data;
  },

  getOne: async (id: string): Promise<WorkflowStage> => {
    const response = await api.get<WorkflowStage>(`/workflow/${id}`);
    return response.data;
  },

  create: async (data: CreateWorkflowStageDto): Promise<WorkflowStage> => {
    const response = await api.post<WorkflowStage>('/workflow', data);
    return response.data;
  },

  update: async (id: string, data: UpdateWorkflowStageDto): Promise<WorkflowStage> => {
    const response = await api.patch<WorkflowStage>(`/workflow/${id}`, data);
    return response.data;
  },

  remove: async (id: string): Promise<void> => {
    await api.delete(`/workflow/${id}`);
  },

  reorder: async (data: ReorderWorkflowStagesDto): Promise<WorkflowStage[]> => {
    const response = await api.post<WorkflowStage[]>('/workflow/reorder', data);
    return response.data;
  },

  initialize: async (): Promise<WorkflowStage[]> => {
    const response = await api.post<WorkflowStage[]>('/workflow/initialize');
    return response.data;
  },

  getNext: async (id: string): Promise<WorkflowStage | null> => {
    const response = await api.get<WorkflowStage | null>(`/workflow/${id}/next`);
    return response.data;
  },

  getPrevious: async (id: string): Promise<WorkflowStage | null> => {
    const response = await api.get<WorkflowStage | null>(`/workflow/${id}/previous`);
    return response.data;
  },
};

// Company Settings API
export const companySettingsApi = {
  get: async (): Promise<CompanySettings> => {
    const response = await api.get<CompanySettings>('/company-settings');
    return response.data;
  },

  update: async (data: UpdateCompanySettingsDto): Promise<CompanySettings> => {
    const response = await api.patch<CompanySettings>('/company-settings', data);
    return response.data;
  },
};

// Telegram API
export const telegramApi = {
  getLink: async (): Promise<{ link: string; botUsername: string }> => {
    const response = await api.get('/telegram/link');
    return response.data;
  },
};

// Feature Flags API (только для OWNER)
export const featureFlagsApi = {
  // Получить публичное состояние флагов (для любого пользователя)
  getPublic: async (): Promise<FeatureFlagsMap> => {
    const response = await api.get<FeatureFlagsMap>('/feature-flags/public');
    return response.data;
  },

  // Получить все флаги с детальной информацией (только OWNER)
  getAll: async (): Promise<FeatureFlag[]> => {
    const response = await api.get<FeatureFlag[]>('/feature-flags');
    return response.data;
  },

  // Получить флаг по ключу
  getByKey: async (key: string): Promise<FeatureFlag> => {
    const response = await api.get<FeatureFlag>(`/feature-flags/${key}`);
    return response.data;
  },

  // Обновить флаг
  update: async (key: string, data: UpdateFeatureFlagDto): Promise<FeatureFlag> => {
    const response = await api.patch<FeatureFlag>(`/feature-flags/${key}`, data);
    return response.data;
  },

  // Переключить состояние флага
  toggle: async (key: string): Promise<FeatureFlag> => {
    const response = await api.post<FeatureFlag>(`/feature-flags/${key}/toggle`);
    return response.data;
  },

  // Массовое обновление флагов
  bulkUpdate: async (updates: { key: string; isEnabled: boolean }[]): Promise<FeatureFlag[]> => {
    const response = await api.post<FeatureFlag[]>('/feature-flags/bulk-update', updates);
    return response.data;
  },
};

// Roles API
export const rolesApi = {
  getAll: async (): Promise<Role[]> => {
    const response = await api.get<Role[]>('/roles');
    return response.data;
  },

  getOne: async (id: string): Promise<Role> => {
    const response = await api.get<Role>(`/roles/${id}`);
    return response.data;
  },

  getPermissions: async (): Promise<Permission[]> => {
    const response = await api.get<Permission[]>('/roles/permissions');
    return response.data;
  },

  create: async (data: {
    name: string;
    code: string;
    description?: string;
    color?: string;
    isActive?: boolean;
    order?: number;
    permissions?: string[];
    workflowStageIds?: string[];
  }): Promise<Role> => {
    const response = await api.post<Role>('/roles', data);
    return response.data;
  },

  update: async (id: string, data: {
    name?: string;
    code?: string;
    description?: string;
    color?: string;
    isActive?: boolean;
    order?: number;
    permissions?: string[];
    workflowStageIds?: string[];
  }): Promise<Role> => {
    const response = await api.put<Role>(`/roles/${id}`, data);
    return response.data;
  },

  remove: async (id: string): Promise<void> => {
    await api.delete(`/roles/${id}`);
  },
};

// Order Sources API (источники заказов)
export const orderSourcesApi = {
  getAll: async (): Promise<OrderSource[]> => {
    const response = await api.get<OrderSource[]>('/order-sources');
    return response.data;
  },

  getActive: async (): Promise<OrderSource[]> => {
    const response = await api.get<OrderSource[]>('/order-sources/active');
    return response.data;
  },

  getOne: async (id: string): Promise<OrderSource> => {
    const response = await api.get<OrderSource>(`/order-sources/${id}`);
    return response.data;
  },

  create: async (data: CreateOrderSourceDto): Promise<OrderSource> => {
    const response = await api.post<OrderSource>('/order-sources', data);
    return response.data;
  },

  update: async (id: string, data: UpdateOrderSourceDto): Promise<OrderSource> => {
    const response = await api.put<OrderSource>(`/order-sources/${id}`, data);
    return response.data;
  },

  remove: async (id: string): Promise<void> => {
    await api.delete(`/order-sources/${id}`);
  },

  initialize: async (): Promise<{ success: boolean; message: string }> => {
    const response = await api.post<{ success: boolean; message: string }>('/order-sources/initialize');
    return response.data;
  },
};

// Payroll API (Расчет зарплаты)
export const payrollApi = {
  // Расценки
  getWorkRates: async (): Promise<WorkRate[]> => {
    const response = await api.get<WorkRate[]>('/payroll/work-rates');
    return response.data;
  },

  getActiveWorkRates: async (): Promise<WorkRate[]> => {
    const response = await api.get<WorkRate[]>('/payroll/work-rates/active');
    return response.data;
  },

  getWorkRate: async (productTypeId: string, stage: ProductionStage): Promise<WorkRate | null> => {
    const response = await api.get<WorkRate>(`/payroll/work-rates/${productTypeId}/${stage}`);
    return response.data;
  },

  createWorkRate: async (data: CreateWorkRateDto): Promise<WorkRate> => {
    const response = await api.post<WorkRate>('/payroll/work-rates', data);
    return response.data;
  },

  updateWorkRate: async (id: string, data: UpdateWorkRateDto): Promise<WorkRate> => {
    const response = await api.put<WorkRate>(`/payroll/work-rates/${id}`, data);
    return response.data;
  },

  deleteWorkRate: async (id: string): Promise<void> => {
    await api.delete(`/payroll/work-rates/${id}`);
  },

  // Штрафы
  getPenalties: async (params?: {
    userId?: string;
    startDate?: string;
    endDate?: string;
    includeCancelled?: boolean;
  }): Promise<Penalty[]> => {
    const response = await api.get<Penalty[]>('/payroll/penalties', { params });
    return response.data;
  },

  createPenalty: async (data: CreatePenaltyDto): Promise<Penalty> => {
    const response = await api.post<Penalty>('/payroll/penalties', data);
    return response.data;
  },

  updatePenalty: async (id: string, data: UpdatePenaltyDto): Promise<Penalty> => {
    const response = await api.put<Penalty>(`/payroll/penalties/${id}`, data);
    return response.data;
  },

  cancelPenalty: async (id: string, notes?: string): Promise<Penalty> => {
    const response = await api.post<Penalty>(`/payroll/penalties/${id}/cancel`, { notes });
    return response.data;
  },

  // Настройки комиссии менеджера
  getManagerCommissions: async (): Promise<ManagerCommission[]> => {
    const response = await api.get<ManagerCommission[]>('/payroll/commissions');
    return response.data;
  },

  getManagerCommission: async (userId: string): Promise<ManagerCommission | null> => {
    const response = await api.get<ManagerCommission>(`/payroll/commissions/user/${userId}`);
    return response.data;
  },

  createManagerCommission: async (data: CreateManagerCommissionDto): Promise<ManagerCommission> => {
    const response = await api.post<ManagerCommission>('/payroll/commissions', data);
    return response.data;
  },

  updateManagerCommission: async (id: string, data: UpdateManagerCommissionDto): Promise<ManagerCommission> => {
    const response = await api.put<ManagerCommission>(`/payroll/commissions/${id}`, data);
    return response.data;
  },

  deleteManagerCommission: async (id: string): Promise<void> => {
    await api.delete(`/payroll/commissions/${id}`);
  },

  // Расчетные периоды
  getPayrollPeriods: async (params?: {
    userId?: string;
    status?: PayrollStatus;
    periodStart?: string;
    periodEnd?: string;
  }): Promise<PayrollPeriod[]> => {
    const response = await api.get<PayrollPeriod[]>('/payroll/periods', { params });
    return response.data;
  },

  getPayrollPeriod: async (id: string): Promise<PayrollPeriod> => {
    const response = await api.get<PayrollPeriod>(`/payroll/periods/${id}`);
    return response.data;
  },

  calculatePayroll: async (data: CalculatePayrollDto): Promise<PayrollPeriod[]> => {
    const response = await api.post<PayrollPeriod[]>('/payroll/calculate', data);
    return response.data;
  },

  approvePayrollPeriod: async (id: string, notes?: string): Promise<PayrollPeriod> => {
    const response = await api.post<PayrollPeriod>(`/payroll/periods/${id}/approve`, { notes });
    return response.data;
  },

  markPayrollAsPaid: async (id: string, notes?: string): Promise<PayrollPeriod> => {
    const response = await api.post<PayrollPeriod>(`/payroll/periods/${id}/pay`, { notes });
    return response.data;
  },

  cancelPayrollPeriod: async (id: string): Promise<PayrollPeriod> => {
    const response = await api.post<PayrollPeriod>(`/payroll/periods/${id}/cancel`);
    return response.data;
  },

  deletePayrollPeriod: async (id: string): Promise<void> => {
    await api.delete(`/payroll/periods/${id}`);
  },

  // Журнал работ
  getWorkLogs: async (params?: {
    userId?: string;
    productTypeId?: string;
    stage?: ProductionStage;
    startDate?: string;
    endDate?: string;
    unassigned?: boolean;
  }): Promise<WorkLog[]> => {
    const response = await api.get<WorkLog[]>('/payroll/work-logs', { params });
    return response.data;
  },

  // Сводка
  getPayrollSummary: async (periodStart: string, periodEnd: string): Promise<PayrollSummary> => {
    const response = await api.get<PayrollSummary>('/payroll/summary', {
      params: { periodStart, periodEnd },
    });
    return response.data;
  },
};

export default api;
