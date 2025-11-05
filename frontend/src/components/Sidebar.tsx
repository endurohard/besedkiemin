import { Link, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { UserRole, TaskStatus, ShipmentStatus } from '@/types';
import { tasksApi } from '@/lib/api';
import { LayoutDashboard, BarChart3, Users, ClipboardList, Package, TruckIcon, Settings, Grid3x3, ShoppingCart, ShoppingBag, AlertTriangle } from 'lucide-react';

interface SidebarProps {
  userRole?: UserRole;
}

export const Sidebar = ({ userRole }: SidebarProps) => {
  const location = useLocation();

  // Fetch task counts for production workers
  const { data: tasks } = useQuery({
    queryKey: ['tasks'],
    queryFn: tasksApi.getMyTasks,
    enabled: userRole !== UserRole.OWNER && userRole !== UserRole.MANAGER,
    refetchInterval: 30000,
  });

  // Fetch shipments for warehouse/manager/owner
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
    enabled: userRole === UserRole.WAREHOUSE || userRole === UserRole.MANAGER || userRole === UserRole.OWNER,
    refetchInterval: 30000,
  });

  // Fetch unaccepted defects count for painter
  const { data: defectsCountData } = useQuery({
    queryKey: ['defects-count'],
    queryFn: async () => {
      const response = await fetch('http://localhost:3000/tasks/defects/unaccepted/count', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      return response.json();
    },
    enabled: userRole === UserRole.PAINTER || userRole === UserRole.WAREHOUSE || userRole === UserRole.MANAGER || userRole === UserRole.OWNER,
    refetchInterval: 30000,
  });

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const linkClasses = (path: string) => {
    const base = "flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors";
    return isActive(path)
      ? `${base} bg-primary text-primary-foreground`
      : `${base} text-muted-foreground hover:bg-accent hover:text-accent-foreground`;
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

  return (
    <aside className="w-64 border-r bg-card min-h-[calc(100vh-73px)] p-4">
      <nav className="space-y-1">
        {userRole !== UserRole.OWNER && userRole !== UserRole.MANAGER && (
          <Link to="/app" className={`${linkClasses('/app')} relative`}>
            <ClipboardList size={20} />
            <span className="flex-1">Мои задачи</span>
            {taskCount > 0 && (
              <span className="ml-auto flex items-center justify-center min-w-[24px] h-6 px-2 text-xs font-bold text-white bg-red-500 rounded-full">
                {taskCount}
              </span>
            )}
          </Link>
        )}

        {(userRole === UserRole.OWNER || userRole === UserRole.MANAGER) && (
          <Link to="/app/kanban" className={linkClasses('/app/kanban')}>
            <LayoutDashboard size={20} />
            <span>Канбан</span>
          </Link>
        )}

        {(userRole === UserRole.WAREHOUSE || userRole === UserRole.MANAGER || userRole === UserRole.OWNER) && (
          <>
            <Link to="/app/inventory" className={linkClasses('/app/inventory')}>
              <Package size={20} />
              <span>Склад</span>
            </Link>
            <Link to="/app/shipments" className={`${linkClasses('/app/shipments')} relative`}>
              <TruckIcon size={20} />
              <span className="flex-1">Отгрузки</span>
              {shipmentCount > 0 && (
                <span className="ml-auto flex items-center justify-center min-w-[24px] h-6 px-2 text-xs font-bold text-white bg-orange-500 rounded-full">
                  {shipmentCount}
                </span>
              )}
            </Link>
          </>
        )}

        {/* Брак - доступен для маляра, складиста, менеджера и владельца */}
        {(userRole === UserRole.PAINTER || userRole === UserRole.WAREHOUSE || userRole === UserRole.MANAGER || userRole === UserRole.OWNER) && (
          <Link to="/app/defects" className={`${linkClasses('/app/defects')} relative`}>
            <AlertTriangle size={20} />
            <span className="flex-1">Брак</span>
            {defectCount > 0 && (
              <span className="ml-auto flex items-center justify-center min-w-[24px] h-6 px-2 text-xs font-bold text-white bg-red-500 rounded-full">
                {defectCount}
              </span>
            )}
          </Link>
        )}

        {(userRole === UserRole.OWNER || userRole === UserRole.MANAGER) && (
          <>
            <Link to="/app/product-types" className={linkClasses('/app/product-types')}>
              <Grid3x3 size={20} />
              <span>Типы товаров</span>
            </Link>
            <Link to="/app/catalog-management" className={linkClasses('/app/catalog-management')}>
              <ShoppingCart size={20} />
              <span>Каталог товаров</span>
            </Link>
            <Link to="/app/catalog-orders" className={linkClasses('/app/catalog-orders')}>
              <ShoppingBag size={20} />
              <span>Заказы с сайта</span>
            </Link>
          </>
        )}

        {userRole === UserRole.OWNER && (
          <>
            <Link to="/app/analytics" className={linkClasses('/app/analytics')}>
              <BarChart3 size={20} />
              <span>Аналитика</span>
            </Link>
            <Link to="/app/users" className={linkClasses('/app/users')}>
              <Users size={20} />
              <span>Пользователи</span>
            </Link>
            <Link to="/app/workflow" className={linkClasses('/app/workflow')}>
              <Settings size={20} />
              <span>Производственный цикл</span>
            </Link>
            <Link to="/app/company-settings" className={linkClasses('/app/company-settings')}>
              <Settings size={20} />
              <span>Настройки компании</span>
            </Link>
          </>
        )}
      </nav>
    </aside>
  );
};
