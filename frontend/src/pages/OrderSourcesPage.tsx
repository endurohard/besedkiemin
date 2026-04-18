import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { orderSourcesApi } from '@/lib/api';
import { OrderSource, CreateOrderSourceDto } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Plus, Edit2, Trash2, X, Globe, Phone, Users, User } from 'lucide-react';

// SVG логотипы источников
const AvitoLogo = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15h-2v-2h2v2zm0-4h-2V7h2v6zm4 4h-2v-2h2v2zm0-4h-2V7h2v6z"/>
  </svg>
);

const InstagramLogo = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
  </svg>
);

const WhatsAppLogo = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

const TelegramLogo = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.161l-1.725 8.126c-.13.617-.473.769-.957.479l-2.645-1.95-1.276 1.229c-.142.142-.26.26-.533.26l.19-2.698 4.897-4.422c.213-.19-.047-.295-.33-.105l-6.05 3.81-2.604-.814c-.566-.177-.578-.566.117-.837l10.184-3.924c.472-.177.884.105.73.837z"/>
  </svg>
);

// Иконки для источников
const iconMap: Record<string, any> = {
  avito: AvitoLogo,
  instagram: InstagramLogo,
  globe: Globe,
  phone: Phone,
  whatsapp: WhatsAppLogo,
  telegram: TelegramLogo,
  user: User,
  users: Users,
};

export const OrderSourcesPage = () => {
  const queryClient = useQueryClient();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<OrderSource | null>(null);

  const [formData, setFormData] = useState<CreateOrderSourceDto>({
    name: '',
    code: '',
    description: '',
    color: '#3B82F6',
    icon: 'globe',
    order: 1,
    isActive: true,
  });

  // Получение источников
  const { data: sources = [], isLoading } = useQuery({
    queryKey: ['order-sources'],
    queryFn: () => orderSourcesApi.getAll(),
  });

  // Мутации
  const createMutation = useMutation({
    mutationFn: orderSourcesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order-sources'] });
      resetForm();
      setIsCreateModalOpen(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateOrderSourceDto> }) =>
      orderSourcesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order-sources'] });
      resetForm();
      setEditingItem(null);
      setIsCreateModalOpen(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: orderSourcesApi.remove,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order-sources'] });
    },
  });

  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      description: '',
      color: '#3B82F6',
      icon: 'globe',
      order: sources.length + 1,
      isActive: true,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (item: OrderSource) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      code: item.code,
      description: item.description || '',
      color: item.color || '#3B82F6',
      icon: item.icon || 'globe',
      order: item.order,
      isActive: item.isActive,
    });
    setIsCreateModalOpen(true);
  };

  const handleDelete = (id: string, ordersCount: number) => {
    if (ordersCount > 0) {
      alert(`Нельзя удалить источник с привязанными заказами (${ordersCount} шт.)`);
      return;
    }
    if (confirm('Удалить этот источник заказов?')) {
      deleteMutation.mutate(id);
    }
  };

  const toggleActive = async (item: OrderSource) => {
    await orderSourcesApi.update(item.id, { isActive: !item.isActive });
    queryClient.invalidateQueries({ queryKey: ['order-sources'] });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Источники заказов</h1>
        <Button
          onClick={() => {
            resetForm();
            setEditingItem(null);
            setIsCreateModalOpen(true);
          }}
          className="flex items-center gap-2"
        >
          <Plus size={18} />
          Добавить источник
        </Button>
      </div>

      {/* Список источников */}
      {sources.length === 0 ? (
        <div className="text-center py-12 bg-card rounded-lg border">
          <Globe className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
          <p className="text-muted-foreground">Источники заказов не найдены</p>
          <p className="text-sm text-muted-foreground mt-2">
            Добавьте источники, нажав кнопку "Добавить источник"
          </p>
        </div>
      ) : (
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-lg">Все источники</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr className="text-left text-sm">
                  <th className="px-4 py-2 font-medium">Цвет</th>
                  <th className="px-4 py-2 font-medium">Название</th>
                  <th className="px-4 py-2 font-medium">Код</th>
                  <th className="px-4 py-2 font-medium">Заказов</th>
                  <th className="px-4 py-2 font-medium">Статус</th>
                  <th className="px-4 py-2 font-medium text-right">Действия</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {sources.map((item) => {
                  const IconComponent = iconMap[item.icon || 'globe'] || Globe;
                  return (
                    <tr key={item.id} className={!item.isActive ? 'opacity-50' : ''}>
                      <td className="px-4 py-3">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center"
                          style={{ backgroundColor: item.color || '#3B82F6' }}
                        >
                          <IconComponent className="w-4 h-4 text-white" />
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium">{item.name}</div>
                        {item.description && (
                          <div className="text-sm text-muted-foreground">{item.description}</div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm font-mono">{item.code}</td>
                      <td className="px-4 py-3 text-sm">{item._count?.orders || 0}</td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => toggleActive(item)}
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            item.isActive
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {item.isActive ? 'Активен' : 'Неактивен'}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(item)}
                          >
                            <Edit2 size={16} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(item.id, item._count?.orders || 0)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 size={16} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {/* Модальное окно создания/редактирования */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background rounded-lg shadow-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">
                {editingItem ? 'Редактировать источник' : 'Добавить источник'}
              </h2>
              <button
                onClick={() => {
                  setIsCreateModalOpen(false);
                  setEditingItem(null);
                  resetForm();
                }}
                className="p-1 hover:bg-muted rounded"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Название *</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Например: Авито"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Код *</label>
                <Input
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="AVITO"
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Уникальный код (латиницей, заглавными)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Описание</label>
                <Input
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Дополнительное описание"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Цвет</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={formData.color || '#3B82F6'}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      className="w-10 h-10 rounded cursor-pointer"
                    />
                    <Input
                      value={formData.color || '#3B82F6'}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      className="flex-1"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Иконка</label>
                  <select
                    value={formData.icon || 'globe'}
                    onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                    className="w-full h-10 px-3 border rounded-md"
                  >
                    <option value="globe">Глобус</option>
                    <option value="phone">Телефон</option>
                    <option value="user">Пользователь</option>
                    <option value="users">Группа</option>
                    <option value="avito">Авито</option>
                    <option value="instagram">Инстаграм</option>
                    <option value="whatsapp">WhatsApp</option>
                    <option value="telegram">Telegram</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Порядок</label>
                <Input
                  type="number"
                  min="1"
                  value={formData.order || 1}
                  onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) })}
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive !== false}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="rounded"
                />
                <label htmlFor="isActive" className="text-sm font-medium cursor-pointer">
                  Активен
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsCreateModalOpen(false);
                    setEditingItem(null);
                    resetForm();
                  }}
                >
                  Отмена
                </Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                  {editingItem ? 'Сохранить' : 'Добавить'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
