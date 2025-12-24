import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from './store/authStore';
import { Layout } from './components/Layout';
import { LoginPage } from './pages/LoginPage';
import { KanbanPage } from './pages/KanbanPage';
import { TasksPage } from './pages/TasksPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { UserManagementPage } from './pages/UserManagementPage';
import { InventoryPage } from './pages/InventoryPage';
import { ShipmentsPage } from './pages/ShipmentsPage';
import { DefectsPage } from './pages/DefectsPage';
import WorkflowSettingsPage from './pages/WorkflowSettingsPage';
import { CompanySettingsPage } from './pages/CompanySettingsPage';
import { ProductTypesPage } from './pages/ProductTypesPage';
import CatalogPage from './pages/CatalogPage';
import CatalogManagementPage from './pages/CatalogManagementPage';
import CatalogOrdersPage from './pages/CatalogOrdersPage';
import ProductDetailPage from './pages/ProductDetailPage';
import ChatPage from './pages/ChatPage';
import { FeatureFlagsPage } from './pages/FeatureFlagsPage';
import { NomenclaturePage } from './pages/NomenclaturePage';
import { UserRole } from './types';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuthStore();
  return user ? <Layout>{children}</Layout> : <Navigate to="/app/login" />;
};

const NonOwnerRoute = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuthStore();
  if (!user) return <Navigate to="/app/login" />;
  // OWNER, MANAGER и SUPER_ADMIN не имеют производственных задач, перенаправляем на Канбан
  if (user.role === UserRole.OWNER || user.role === UserRole.MANAGER || user.role === UserRole.SUPER_ADMIN) return <Navigate to="/app/kanban" />;
  return <Layout>{children}</Layout>;
};

const OwnerRoute = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuthStore();
  // SUPER_ADMIN имеет доступ ко всему что имеет OWNER
  return (user?.role === UserRole.OWNER || user?.role === UserRole.SUPER_ADMIN) ? (
    <Layout>{children}</Layout>
  ) : (
    <Navigate to="/app" />
  );
};

const SuperAdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuthStore();
  return user?.role === UserRole.SUPER_ADMIN ? (
    <Layout>{children}</Layout>
  ) : (
    <Navigate to="/app" />
  );
};

const ManagerOwnerRoute = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuthStore();
  if (!user) return <Navigate to="/app/login" />;
  // SUPER_ADMIN тоже имеет доступ
  if (user.role !== UserRole.OWNER && user.role !== UserRole.MANAGER && user.role !== UserRole.SUPER_ADMIN) {
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
      <BrowserRouter>
        <Routes>
          {/* Публичные маршруты */}
          <Route path="/" element={<CatalogPage />} />
          <Route path="/catalog" element={<CatalogPage />} />
          <Route path="/catalog/:slug" element={<ProductDetailPage />} />

          {/* Вход в систему управления */}
          <Route path="/app/login" element={<LoginPage />} />

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
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
