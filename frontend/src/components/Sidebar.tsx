import { useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { TaskStatus, ShipmentStatus, FeatureFlagsMap, Shipment } from '@/types';
import { tasksApi, shipmentsApi, featureFlagsApi } from '@/lib/api';
import {
  LayoutDashboard,
  BarChart3,
  Users,
  ClipboardList,
  Package,
  TruckIcon,
  Settings,
  Grid3x3,
  ShoppingCart,
  ShoppingBag,
  AlertTriangle,
  MessageCircle,
  ChevronLeft,
  ChevronRight,
  Shield,
  UserCog,
  Wallet,
  HardHat,
  Globe,
  User,
  KeyRound,
  DoorOpen,
  Archive,
} from 'lucide-react';

interface SidebarProps {
  userRole?: string; // Role code string
  permissions?: string[]; // User permissions array
  onNavigate?: () => void; // Callback when navigating (for mobile menu close)
  isMobile?: boolean; // Is mobile view
}

export const Sidebar = ({ userRole, permissions = [], onNavigate, isMobile = false }: SidebarProps) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const selectedWorkerId = searchParams.get('worker');

  // Проверка наличия permission
  const hasPermission = (perm: string) => {
    if (userRole === 'SUPER_ADMIN' || userRole === 'OWNER') return true;
    return permissions.includes(perm);
  };
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Проверяем, является ли пользователь производственным работником
  const isProductionWorker = ['PREPARER', 'PAINTER', 'SEWER', 'ASSEMBLER', 'WAREHOUSE'].includes(userRole || '');

  // Fetch task counts for production workers
  const { data: tasks } = useQuery({
    queryKey: ['tasks'],
    queryFn: tasksApi.getMyTasks,
    enabled: hasPermission('tasks:view_own') && !hasPermission('kanban:view'),
  });

  // Fetch department tasks (all workers in department)
  const { data: departmentTasks } = useQuery({
    queryKey: ['department-tasks'],
    queryFn: tasksApi.getDepartmentTasks,
    enabled: isProductionWorker && !isCollapsed,
  });

  // Fetch shipments for users with shipments:view permission
  const { data: shipments } = useQuery<Shipment[]>({
    queryKey: ['shipments'],
    queryFn: shipmentsApi.getAll,
    enabled: hasPermission('shipments:view'),
  });

  // Fetch unaccepted defects count for users with defects:view permission
  const { data: defectsCountData } = useQuery({
    queryKey: ['defects-count'],
    queryFn: tasksApi.getUnacceptedDefectsCount,
    enabled: hasPermission('defects:view'),
  });

  // Fetch feature flags to determine which menu items to show
  const { data: featureFlags } = useQuery<FeatureFlagsMap>({
    queryKey: ['feature-flags-public'],
    queryFn: featureFlagsApi.getPublic,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  // Calculate task count (NEW + ACCEPTED)
  const taskCount = tasks?.filter((t: any) =>
    t.status === TaskStatus.NEW || t.status === TaskStatus.ACCEPTED
  ).length || 0;

  // Calculate pending shipments count
  const shipmentCount = shipments?.filter((s: any) =>
    s.status === ShipmentStatus.PENDING || s.status === ShipmentStatus.IN_TRANSIT
  ).length || 0;

  // Calculate defects count (unaccepted defects for painter)
  const defectCount = defectsCountData?.count || 0;

  // Выбрать сотрудника и показать его задачи в main
  const selectWorker = (workerId: string) => {
    navigate(`/app?worker=${workerId}`);
    onNavigate?.();
  };

  // Показать все задачи (сбросить фильтр)
  const showAllTasks = () => {
    navigate('/app');
    onNavigate?.();
  };

  const NavLink = ({
    to,
    icon: Icon,
    label,
    badge,
    badgeColor = 'bg-red-500'
  }: {
    to: string;
    icon: any;
    label: string;
    badge?: number;
    badgeColor?: string;
  }) => {
    const active = isActive(to);

    return (
      <Link
        to={to}
        onClick={onNavigate}
        className={`
          relative flex items-center gap-2 px-3 py-2 rounded-lg transition-all
          ${active
            ? 'bg-primary text-primary-foreground'
            : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
          }
          ${isCollapsed && !isMobile ? 'justify-center' : ''}
        `}
        title={isCollapsed && !isMobile ? label : undefined}
      >
        <div className="relative">
          <Icon size={18} />
          {badge !== undefined && badge > 0 && isCollapsed && (
            <span className={`absolute -top-2 -right-2 flex items-center justify-center min-w-[16px] h-4 px-1 text-[10px] font-bold text-white ${badgeColor} rounded-full`}>
              {badge > 99 ? '99+' : badge}
            </span>
          )}
        </div>
        {(!isCollapsed || isMobile) && (
          <>
            <span className="flex-1 text-sm font-medium truncate">{label}</span>
            {badge !== undefined && badge > 0 && (
              <span className={`flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-bold text-white ${badgeColor} rounded-full`}>
                {badge > 99 ? '99+' : badge}
              </span>
            )}
          </>
        )}
      </Link>
    );
  };

  // Компонент для отображения сотрудника в списке
  const WorkerButton = ({
    worker,
    taskCount,
    isCurrentUser
  }: {
    worker: { id: string; firstName: string; lastName: string };
    taskCount: number;
    isCurrentUser: boolean;
  }) => {
    const isSelected = selectedWorkerId === worker.id;

    return (
      <button
        onClick={() => selectWorker(worker.id)}
        className={`w-full flex items-center gap-2 px-3 py-2 text-left transition-colors ${
          isSelected
            ? 'bg-primary text-primary-foreground'
            : isCurrentUser
              ? 'bg-muted hover:bg-accent'
              : 'hover:bg-accent'
        }`}
      >
        <User size={14} className={isSelected ? 'text-primary-foreground' : isCurrentUser ? 'text-primary' : 'text-muted-foreground'} />
        <span className={`flex-1 text-xs font-medium truncate ${
          isSelected ? 'text-primary-foreground' : isCurrentUser ? 'text-primary' : 'text-foreground'
        }`}>
          {worker.lastName} {worker.firstName}
          {isCurrentUser && ' (Я)'}
        </span>
        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
          isSelected
            ? 'bg-primary-foreground text-primary'
            : isCurrentUser
              ? 'bg-primary text-primary-foreground'
              : 'bg-figma-warning text-figma-bg'
        }`}>
          {taskCount}
        </span>
      </button>
    );
  };

  return (
    <aside className={`
      border-r bg-sidebar text-sidebar-foreground min-h-[calc(100vh-49px)] transition-all duration-200 flex flex-col
      ${isMobile ? 'w-56' : (isCollapsed ? 'w-14' : 'w-48')}
    `}>
      {/* Toggle button - hidden on mobile */}
      {!isMobile && (
        <div className="p-2 border-b">
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="w-full flex items-center justify-center p-2 rounded-lg text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
            title={isCollapsed ? 'Развернуть меню' : 'Свернуть меню'}
          >
            {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>
      )}

      <nav className="p-2 space-y-0.5">
        {/* Мои задачи - для работников производства */}
        {hasPermission('tasks:view_own') && !hasPermission('kanban:view') && (
          <NavLink
            to="/app"
            icon={ClipboardList}
            label="Мои задачи"
            badge={taskCount}
          />
        )}

        {/* Личный кабинет - вход по PIN для производственных работников и склада */}
        {isProductionWorker && (
          <NavLink
            to="/pin"
            icon={KeyRound}
            label="Личный кабинет"
          />
        )}

        {/* Канбан - для тех кто может просматривать */}
        {hasPermission('kanban:view') && (
          <NavLink to="/app/kanban" icon={LayoutDashboard} label="Канбан" />
        )}

        {/* Архив заказов: выполненные (для всех с канбаном) + удалённые (владелец) */}
        {hasPermission('kanban:view') && (
          <NavLink to="/app/order-archive" icon={Archive} label="Архив заказов" />
        )}

        {/* Ревизия отделов — менеджер/владелец/суперадмин */}
        {(hasPermission('orders:view') || userRole === 'OWNER' || userRole === 'SUPER_ADMIN') && (
          <NavLink to="/app/revision" icon={ClipboardList} label="Ревизия" />
        )}

        {/* Склад и Отгрузки */}
        {hasPermission('inventory:view') && (
          <NavLink to="/app/inventory" icon={Package} label="Склад" />
        )}
        {hasPermission('shipments:view') && (
          <NavLink
            to="/app/shipments"
            icon={TruckIcon}
            label="Отгрузки"
            badge={shipmentCount}
            badgeColor="bg-orange-500"
          />
        )}

        {/* Брак/Дефекты */}
        {hasPermission('defects:view') && (
          <NavLink
            to="/app/defects"
            icon={AlertTriangle}
            label="Брак"
            badge={defectCount}
          />
        )}

        {/* Заказы и каталог */}
        {hasPermission('orders:view') && (
          <>
            <NavLink to="/app/product-types" icon={Grid3x3} label="Типы товаров" />
            {featureFlags?.product_types !== false && (
              <NavLink to="/app/nomenclature" icon={Package} label="Каталог" />
            )}
          </>
        )}

        {hasPermission('catalog:view') && featureFlags?.catalog !== false && (
          <NavLink to="/app/catalog-management" icon={ShoppingCart} label="Витрина" />
        )}

        {hasPermission('orders:view') && featureFlags?.catalog_orders !== false && (
          <NavLink to="/app/catalog-orders" icon={ShoppingBag} label="С сайта" />
        )}

        {hasPermission('chat:view') && featureFlags?.chat !== false && (
          <NavLink to="/app/chat" icon={MessageCircle} label="Чат" />
        )}

        {/* Аналитика */}
        {hasPermission('analytics:view') && featureFlags?.analytics !== false && (
          <NavLink to="/app/analytics" icon={BarChart3} label="Аналитика" />
        )}

        {/* Зарплата - для OWNER, SUPER_ADMIN и WAREHOUSE */}
        {(userRole === 'OWNER' || userRole === 'SUPER_ADMIN' || userRole === 'WAREHOUSE') && (
          <NavLink to="/app/payroll" icon={Wallet} label={userRole === 'WAREHOUSE' ? 'Штрафы' : 'Зарплата'} />
        )}

        {/* Сотрудники производства - только для OWNER и SUPER_ADMIN */}
        {(userRole === 'OWNER' || userRole === 'SUPER_ADMIN') && (
          <NavLink to="/app/workers" icon={HardHat} label="Работники" />
        )}

        {/* Управление */}
        {hasPermission('users:view') && (
          <NavLink to="/app/users" icon={Users} label="Пользователи" />
        )}
        {hasPermission('roles:view') && (
          <NavLink to="/app/roles" icon={UserCog} label="Роли" />
        )}
        {hasPermission('workflow:manage') && (
          <NavLink to="/app/workflow" icon={Settings} label="Цикл" />
        )}
        {hasPermission('orders:view') && (
          <NavLink to="/app/order-sources" icon={Globe} label="Источники" />
        )}
        {hasPermission('settings:view') && (
          <NavLink to="/app/company-settings" icon={Settings} label="Настройки" />
        )}

        {/* Быстрый вход отделов — OWNER/SUPER_ADMIN/MANAGER */}
        {(userRole === 'OWNER' || userRole === 'SUPER_ADMIN' || userRole === 'MANAGER') && (
          <NavLink to="/app/department-presets" icon={DoorOpen} label="Вход отделов" />
        )}

        {/* Feature Flags - только SUPER_ADMIN */}
        {userRole === 'SUPER_ADMIN' && (
          <NavLink to="/app/feature-flags" icon={Shield} label="Функции" />
        )}
      </nav>

      {/* Секция "Отдел" - сотрудники с задачами (только для производственных работников) */}
      {isProductionWorker && !isCollapsed && departmentTasks && departmentTasks.length > 0 && (
        <div className="flex-1 border-t mt-2 overflow-hidden flex flex-col">
          <div className="px-3 py-2 bg-muted border-b flex items-center justify-between">
            <div className="flex items-center gap-2">
              <HardHat size={14} className="text-muted-foreground" />
              <span className="text-xs font-semibold text-muted-foreground uppercase">Отдел</span>
            </div>
            {selectedWorkerId && (
              <button
                onClick={showAllTasks}
                className="text-[10px] text-primary hover:text-primary/80 font-medium"
              >
                Все задачи
              </button>
            )}
          </div>
          <div className="flex-1 overflow-y-auto">
            {/* Сначала показываем текущего пользователя */}
            {departmentTasks
              .sort((a, b) => {
                // Текущий пользователь первым
                if (a.worker.isCurrentUser) return -1;
                if (b.worker.isCurrentUser) return 1;
                return a.worker.lastName.localeCompare(b.worker.lastName);
              })
              .map(item => (
                <WorkerButton
                  key={item.worker.id}
                  worker={item.worker}
                  taskCount={item.tasks.filter(t => t.status === TaskStatus.ACCEPTED).length}
                  isCurrentUser={item.worker.isCurrentUser}
                />
              ))}
          </div>
        </div>
      )}
    </aside>
  );
};
