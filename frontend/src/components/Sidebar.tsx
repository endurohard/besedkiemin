import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { TaskStatus, ShipmentStatus, FeatureFlagsMap } from '@/types';
import { tasksApi, featureFlagsApi } from '@/lib/api';
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
  UserCog
} from 'lucide-react';

interface SidebarProps {
  userRole?: string; // Role code string
  permissions?: string[]; // User permissions array
}

export const Sidebar = ({ userRole, permissions = [] }: SidebarProps) => {
  // Проверка наличия permission
  const hasPermission = (perm: string) => {
    if (userRole === 'SUPER_ADMIN' || userRole === 'OWNER') return true;
    return permissions.includes(perm);
  };
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Fetch task counts for production workers
  const { data: tasks } = useQuery({
    queryKey: ['tasks'],
    queryFn: tasksApi.getMyTasks,
    enabled: hasPermission('tasks:view_own') && !hasPermission('kanban:view'),
    refetchInterval: 30000,
  });

  // Fetch shipments for users with shipments:view permission
  const { data: shipments } = useQuery({
    queryKey: ['shipments'],
    queryFn: async () => {
      const response = await fetch('/api/shipments', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      return response.json();
    },
    enabled: hasPermission('shipments:view'),
    refetchInterval: 30000,
  });

  // Fetch unaccepted defects count for users with defects:view permission
  const { data: defectsCountData } = useQuery({
    queryKey: ['defects-count'],
    queryFn: async () => {
      const response = await fetch('/api/tasks/defects/unaccepted/count', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      return response.json();
    },
    enabled: hasPermission('defects:view'),
    refetchInterval: 30000,
  });

  // Fetch feature flags to determine which menu items to show
  const { data: featureFlags } = useQuery<FeatureFlagsMap>({
    queryKey: ['feature-flags-public'],
    queryFn: featureFlagsApi.getPublic,
    staleTime: 5000, // Cache for 5 seconds
    refetchOnMount: true,
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
        className={`
          relative flex items-center gap-2 px-3 py-2 rounded-lg transition-all
          ${active
            ? 'bg-primary text-primary-foreground'
            : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
          }
          ${isCollapsed ? 'justify-center' : ''}
        `}
        title={isCollapsed ? label : undefined}
      >
        <div className="relative">
          <Icon size={18} />
          {badge !== undefined && badge > 0 && isCollapsed && (
            <span className={`absolute -top-2 -right-2 flex items-center justify-center min-w-[16px] h-4 px-1 text-[10px] font-bold text-white ${badgeColor} rounded-full`}>
              {badge > 99 ? '99+' : badge}
            </span>
          )}
        </div>
        {!isCollapsed && (
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

  return (
    <aside className={`
      border-r bg-card min-h-[calc(100vh-49px)] transition-all duration-200
      ${isCollapsed ? 'w-14' : 'w-48'}
    `}>
      {/* Toggle button */}
      <div className="p-2 border-b">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="w-full flex items-center justify-center p-2 rounded-lg text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
          title={isCollapsed ? 'Развернуть меню' : 'Свернуть меню'}
        >
          {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

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

        {/* Канбан - для тех кто может просматривать */}
        {hasPermission('kanban:view') && (
          <NavLink to="/app/kanban" icon={LayoutDashboard} label="Канбан" />
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
          <NavLink to="/app/catalog-orders" icon={ShoppingBag} label="Заказы" />
        )}

        {hasPermission('chat:view') && featureFlags?.chat !== false && (
          <NavLink to="/app/chat" icon={MessageCircle} label="Чат" />
        )}

        {/* Аналитика */}
        {hasPermission('analytics:view') && featureFlags?.analytics !== false && (
          <NavLink to="/app/analytics" icon={BarChart3} label="Аналитика" />
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
        {hasPermission('settings:view') && (
          <NavLink to="/app/company-settings" icon={Settings} label="Настройки" />
        )}

        {/* Feature Flags - только SUPER_ADMIN */}
        {userRole === 'SUPER_ADMIN' && (
          <NavLink to="/app/feature-flags" icon={Shield} label="Функции" />
        )}
      </nav>
    </aside>
  );
};
