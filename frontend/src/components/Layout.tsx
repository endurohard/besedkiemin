import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { Button } from './ui/Button';
import { LogOut, Menu, X } from 'lucide-react';
import { PhoneWidget } from './PhoneWidget';
import { Sidebar } from './Sidebar';
import { TelegramLinkWidget } from './TelegramLinkWidget';

// Роли рабочих которые должны всегда попадать на страницу задач
const WORKER_ROLES = ['PREPARER', 'PAINTER', 'ASSEMBLER', 'DESIGNER'];

// Разрешённые страницы для каждой роли (кроме стандартных /app и /app/defects)
const ROLE_ALLOWED_PATHS: Record<string, string[]> = {
  WAREHOUSE: ['/app/inventory', '/app/shipments'],
};

export const Layout = ({ children }: { children: React.ReactNode }) => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Редирект рабочих на страницу задач при загрузке
  useEffect(() => {
    const roleCode = user?.role?.code;
    if (roleCode && WORKER_ROLES.includes(roleCode)) {
      // Базовые разрешенные страницы для рабочих
      const basePaths = ['/app', '/app/defects'];
      // Дополнительные страницы для конкретной роли
      const rolePaths = ROLE_ALLOWED_PATHS[roleCode] || [];
      const allowedPaths = [...basePaths, ...rolePaths];

      if (!allowedPaths.includes(location.pathname)) {
        navigate('/app', { replace: true });
      }
    }
  }, [user?.role?.code, location.pathname, navigate]);

  const handleLogout = () => {
    logout();
    navigate('/app/login');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-40">
        <div className="px-3 py-2 flex items-center justify-between">
          {/* Mobile menu button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-2 -ml-2 rounded-lg text-muted-foreground hover:bg-accent"
          >
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          <h1 className="text-lg font-bold">Besedki EMIN</h1>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* User info - hidden on very small screens */}
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium">{user?.firstName} {user?.lastName}</p>
              <p className="text-xs text-muted-foreground">{user?.role?.name}</p>
            </div>
            <TelegramLinkWidget />
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="flex items-center gap-1.5"
            >
              <LogOut size={14} />
              <span className="hidden sm:inline">Выход</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Desktop Sidebar */}
        <div className="hidden lg:block">
          <Sidebar
            userRole={user?.role?.code}
            permissions={user?.role?.permissions as string[] || []}
          />
        </div>

        {/* Mobile Sidebar Overlay */}
        {isMobileMenuOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}

        {/* Mobile Sidebar */}
        <div className={`
          fixed top-[49px] left-0 h-[calc(100vh-49px)] z-50 lg:hidden
          transform transition-transform duration-200 ease-in-out
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        `}>
          <Sidebar
            userRole={user?.role?.code}
            permissions={user?.role?.permissions as string[] || []}
            onNavigate={() => setIsMobileMenuOpen(false)}
            isMobile={true}
          />
        </div>

        {/* Main content */}
        <main className="flex-1 p-2 sm:p-4 overflow-auto min-h-[calc(100vh-49px)]">
          {children}
        </main>
      </div>

      {/* Phone Widget */}
      <PhoneWidget />
    </div>
  );
};
