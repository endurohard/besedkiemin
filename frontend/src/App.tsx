import { useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from './store/authStore';
import { Layout } from './components/Layout';
import { LoginPage } from './pages/LoginPage';
import { PinLoginPage } from './pages/PinLoginPage';

// Lazy-loaded pages
const KanbanPage = lazy(() => import('./pages/KanbanPage').then(m => ({ default: m.KanbanPage })));
const TasksPage = lazy(() => import('./pages/TasksPage').then(m => ({ default: m.TasksPage })));
const AnalyticsPage = lazy(() => import('./pages/AnalyticsPage').then(m => ({ default: m.AnalyticsPage })));
const UserManagementPage = lazy(() => import('./pages/UserManagementPage').then(m => ({ default: m.UserManagementPage })));
const InventoryPage = lazy(() => import('./pages/InventoryPage').then(m => ({ default: m.InventoryPage })));
const ShipmentsPage = lazy(() => import('./pages/ShipmentsPage').then(m => ({ default: m.ShipmentsPage })));
const DefectsPage = lazy(() => import('./pages/DefectsPage').then(m => ({ default: m.DefectsPage })));
const WorkflowSettingsPage = lazy(() => import('./pages/WorkflowSettingsPage'));
const CompanySettingsPage = lazy(() => import('./pages/CompanySettingsPage').then(m => ({ default: m.CompanySettingsPage })));
const ProductTypesPage = lazy(() => import('./pages/ProductTypesPage').then(m => ({ default: m.ProductTypesPage })));
const CatalogPage = lazy(() => import('./pages/CatalogPage'));
const CatalogManagementPage = lazy(() => import('./pages/CatalogManagementPage'));
const CatalogOrdersPage = lazy(() => import('./pages/CatalogOrdersPage'));
const ProductDetailPage = lazy(() => import('./pages/ProductDetailPage'));
const ChatPage = lazy(() => import('./pages/ChatPage'));
const FeatureFlagsPage = lazy(() => import('./pages/FeatureFlagsPage').then(m => ({ default: m.FeatureFlagsPage })));
const NomenclaturePage = lazy(() => import('./pages/NomenclaturePage').then(m => ({ default: m.NomenclaturePage })));
const OrderSourcesPage = lazy(() => import('./pages/OrderSourcesPage').then(m => ({ default: m.OrderSourcesPage })));
const RolesPage = lazy(() => import('./pages/RolesPage'));
const PayrollPage = lazy(() => import('./pages/PayrollPage'));
const ProductionWorkersPage = lazy(() => import('./pages/ProductionWorkersPage'));
const MyEarningsPage = lazy(() => import('./pages/MyEarningsPage').then(m => ({ default: m.MyEarningsPage })));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[50vh]">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
  </div>
);

const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuthStore();
  return user ? <Layout>{children}</Layout> : <Navigate to="/app/login" />;
};

const NonOwnerRoute = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuthStore();
  if (!user) return <Navigate to="/app/login" />;
  const roleCode = user.role?.code || '';
  // OWNER, MANAGER и SUPER_ADMIN не имеют производственных задач, перенаправляем на Канбан
  if (roleCode === 'OWNER' || roleCode === 'MANAGER' || roleCode === 'SUPER_ADMIN') return <Navigate to="/app/kanban" />;
  return <Layout>{children}</Layout>;
};

const OwnerRoute = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuthStore();
  const roleCode = user?.role?.code || '';
  // SUPER_ADMIN имеет доступ ко всему что имеет OWNER
  return (roleCode === 'OWNER' || roleCode === 'SUPER_ADMIN') ? (
    <Layout>{children}</Layout>
  ) : (
    <Navigate to="/app" />
  );
};

const OwnerOrWarehouseRoute = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuthStore();
  const roleCode = user?.role?.code || '';
  return (roleCode === 'OWNER' || roleCode === 'SUPER_ADMIN' || roleCode === 'WAREHOUSE') ? (
    <Layout>{children}</Layout>
  ) : (
    <Navigate to="/app" />
  );
};

const SuperAdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuthStore();
  return user?.role?.code === 'SUPER_ADMIN' ? (
    <Layout>{children}</Layout>
  ) : (
    <Navigate to="/app" />
  );
};

const ManagerOwnerRoute = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuthStore();
  if (!user) return <Navigate to="/app/login" />;
  const roleCode = user.role?.code || '';
  // SUPER_ADMIN тоже имеет доступ
  if (roleCode !== 'OWNER' && roleCode !== 'MANAGER' && roleCode !== 'SUPER_ADMIN') {
    return <Navigate to="/app" />;
  }
  return <Layout>{children}</Layout>;
};

function App() {
  const initializeAuth = useAuthStore((state) => state.initializeAuth);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Публичные маршруты */}
            <Route path="/" element={<CatalogPage />} />
            <Route path="/catalog" element={<CatalogPage />} />
            <Route path="/catalog/:slug" element={<ProductDetailPage />} />

            {/* Вход в систему управления */}
            <Route path="/app/login" element={<LoginPage />} />
            <Route path="/pin" element={<PinLoginPage />} />

            {/* Мои заработки (для работников с PIN-входом) — без Layout */}
            <Route path="/app/my-earnings" element={<MyEarningsPage />} />

            {/* Система управления производством */}
            <Route
              path="/app"
              element={
                <NonOwnerRoute>
                  <TasksPage />
                </NonOwnerRoute>
              }
            />
            <Route
              path="/app/kanban"
              element={
                <PrivateRoute>
                  <KanbanPage />
                </PrivateRoute>
              }
            />
            <Route
              path="/app/analytics"
              element={
                <OwnerRoute>
                  <AnalyticsPage />
                </OwnerRoute>
              }
            />
            <Route
              path="/app/users"
              element={
                <OwnerRoute>
                  <UserManagementPage />
                </OwnerRoute>
              }
            />
            <Route
              path="/app/inventory"
              element={
                <PrivateRoute>
                  <InventoryPage />
                </PrivateRoute>
              }
            />
            <Route
              path="/app/shipments"
              element={
                <PrivateRoute>
                  <ShipmentsPage />
                </PrivateRoute>
              }
            />
            <Route
              path="/app/defects"
              element={
                <PrivateRoute>
                  <DefectsPage />
                </PrivateRoute>
              }
            />
            <Route
              path="/app/workflow"
              element={
                <OwnerRoute>
                  <WorkflowSettingsPage />
                </OwnerRoute>
              }
            />
            <Route
              path="/app/company-settings"
              element={
                <OwnerRoute>
                  <CompanySettingsPage />
                </OwnerRoute>
              }
            />
            <Route
              path="/app/product-types"
              element={
                <ManagerOwnerRoute>
                  <ProductTypesPage />
                </ManagerOwnerRoute>
              }
            />
            <Route
              path="/app/nomenclature"
              element={
                <ManagerOwnerRoute>
                  <NomenclaturePage />
                </ManagerOwnerRoute>
              }
            />
            <Route
              path="/app/order-sources"
              element={
                <ManagerOwnerRoute>
                  <OrderSourcesPage />
                </ManagerOwnerRoute>
              }
            />
            <Route
              path="/app/catalog-management"
              element={
                <ManagerOwnerRoute>
                  <CatalogManagementPage />
                </ManagerOwnerRoute>
              }
            />
            <Route
              path="/app/catalog-orders"
              element={
                <ManagerOwnerRoute>
                  <CatalogOrdersPage />
                </ManagerOwnerRoute>
              }
            />
            <Route
              path="/app/chat"
              element={
                <ManagerOwnerRoute>
                  <ChatPage />
                </ManagerOwnerRoute>
              }
            />
            <Route
              path="/app/feature-flags"
              element={
                <SuperAdminRoute>
                  <FeatureFlagsPage />
                </SuperAdminRoute>
              }
            />
            <Route
              path="/app/roles"
              element={
                <OwnerRoute>
                  <RolesPage />
                </OwnerRoute>
              }
            />
            <Route
              path="/app/payroll"
              element={
                <OwnerOrWarehouseRoute>
                  <PayrollPage />
                </OwnerOrWarehouseRoute>
              }
            />
            <Route
              path="/app/workers"
              element={
                <OwnerRoute>
                  <ProductionWorkersPage />
                </OwnerRoute>
              }
            />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
