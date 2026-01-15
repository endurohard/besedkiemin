import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { orderSourcesApi } from '@/lib/api';
import { OrderSource, CreateOrderSourceDto } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Plus, Edit2, Trash2, X, Globe, Phone, Users, User, MessageCircle } from 'lucide-react';

// Иконки для источников
const iconMap: Record<string, any> = {
  avito: Globe,
  instagram: Globe,
  globe: Globe,
  phone: Phone,
  whatsapp: MessageCircle,
  telegram: MessageCircle,
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
                          <IconComponent size={16} className="text-white" />
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
