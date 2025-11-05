import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { Button } from './ui/Button';
import { LogOut } from 'lucide-react';
import { PhoneWidget } from './PhoneWidget';
import { Sidebar } from './Sidebar';
import { TelegramLinkWidget } from './TelegramLinkWidget';

export const Layout = ({ children }: { children: React.ReactNode }) => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Besedki EMIN</h1>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium">{user?.firstName} {user?.lastName}</p>
              <p className="text-xs text-muted-foreground">{user?.role}</p>
            </div>
            <TelegramLinkWidget />
            <Button variant="outline" size="sm" onClick={handleLogout} className="flex items-center gap-2">
              <LogOut size={16} />
              Выход
            </Button>
          </div>
        </div>
      </header>
      <div className="flex">
        <Sidebar userRole={user?.role} />
        <main className="flex-1 p-6">{children}</main>
      </div>

      {/* Phone Widget - показывается только для пользователей с SIP данными */}
      <PhoneWidget />
    </div>
  );
};
