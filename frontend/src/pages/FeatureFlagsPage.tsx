import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { featureFlagsApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Loader2, Settings2, ToggleLeft, ToggleRight, Shield, MessageCircle, BarChart3, Package, Truck, ClipboardList, CheckSquare, Bell, Phone, FileText, PhoneCall } from 'lucide-react';
import type { FeatureFlag } from '@/types';

// Иконки для категорий
const categoryIcons: Record<string, React.ReactNode> = {
  general: <Settings2 className="w-5 h-5" />,
  sales: <MessageCircle className="w-5 h-5" />,
  production: <Package className="w-5 h-5" />,
  notifications: <Bell className="w-5 h-5" />,
  communications: <Phone className="w-5 h-5" />,
};

// Иконки для конкретных фич
const featureIcons: Record<string, React.ReactNode> = {
  chat: <MessageCircle className="w-5 h-5" />,
  catalog: <FileText className="w-5 h-5" />,
  analytics: <BarChart3 className="w-5 h-5" />,
  orders: <ClipboardList className="w-5 h-5" />,
  inventory: <Package className="w-5 h-5" />,
  shipments: <Truck className="w-5 h-5" />,
  tasks: <ClipboardList className="w-5 h-5" />,
  quality_checks: <CheckSquare className="w-5 h-5" />,
  telegram_notifications: <Bell className="w-5 h-5" />,
  sip_telephony: <Phone className="w-5 h-5" />,
  contact_requests: <FileText className="w-5 h-5" />,
  callback_requests: <PhoneCall className="w-5 h-5" />,
};

// Названия категорий на русском
const categoryNames: Record<string, string> = {
  general: 'Общее',
  sales: 'Продажи',
  production: 'Производство',
  notifications: 'Уведомления',
  communications: 'Коммуникации',
};

// Группировка флагов по категориям
const groupByCategory = (flags: FeatureFlag[]): Record<string, FeatureFlag[]> => {
  return flags.reduce((acc, flag) => {
    const category = flag.category || 'general';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(flag);
    return acc;
  }, {} as Record<string, FeatureFlag[]>);
};

export const FeatureFlagsPage = () => {
  const queryClient = useQueryClient();

  const { data: flags, isLoading } = useQuery({
    queryKey: ['feature-flags'],
    queryFn: featureFlagsApi.getAll,
  });

  const toggleMutation = useMutation({
    mutationFn: (key: string) => featureFlagsApi.toggle(key),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feature-flags'] });
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  const groupedFlags = flags ? groupByCategory(flags) : {};
  const categoryOrder = ['production', 'sales', 'communications', 'notifications', 'general'];

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Shield className="w-8 h-8" />
          Управление функциями
        </h1>
        <p className="text-muted-foreground mt-2">
          Включайте и отключайте функции системы. Изменения применяются немедленно.
        </p>
      </div>

      <div className="space-y-6">
        {categoryOrder.map((category) => {
          const categoryFlags = groupedFlags[category];
          if (!categoryFlags || categoryFlags.length === 0) return null;

          return (
            <Card key={category}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {categoryIcons[category] || <Settings2 className="w-5 h-5" />}
                  {categoryNames[category] || category}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="divide-y">
                  {categoryFlags.map((flag) => (
                    <div
                      key={flag.id}
                      className="flex items-center justify-between py-4 first:pt-0 last:pb-0"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${flag.isEnabled ? 'bg-green-100 text-green-600' : 'bg-muted text-muted-foreground'}`}>
                          {featureIcons[flag.key] || <Settings2 className="w-5 h-5" />}
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">{flag.name}</h3>
                          {flag.description && (
                            <p className="text-sm text-muted-foreground">{flag.description}</p>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() => toggleMutation.mutate(flag.key)}
                        disabled={toggleMutation.isPending}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                          flag.isEnabled
                            ? 'bg-green-100 text-green-700 hover:bg-green-200'
                            : 'bg-muted text-muted-foreground hover:bg-gray-200'
                        } ${toggleMutation.isPending ? 'opacity-50 cursor-wait' : ''}`}
                      >
                        {flag.isEnabled ? (
                          <>
                            <ToggleRight className="w-6 h-6" />
                            <span className="font-medium">Вкл</span>
                          </>
                        ) : (
                          <>
                            <ToggleLeft className="w-6 h-6" />
                            <span className="font-medium">Выкл</span>
                          </>
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Информационный блок */}
      <Card className="mt-6 bg-primary/10 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <div className="flex-shrink-0">
              <Shield className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="font-medium text-blue-900">Информация о функциях</h3>
              <p className="text-sm text-primary mt-1">
                Отключение функции скрывает её из интерфейса для всех пользователей,
                но не удаляет связанные данные. При повторном включении все данные будут доступны.
              </p>
              <p className="text-sm text-primary mt-2">
                <strong>Внимание:</strong> Отключение базовых функций (Заказы, Задачи)
                может ограничить работу системы.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
