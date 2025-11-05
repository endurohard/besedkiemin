import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { ProductType, CreateProductTypeDto, UpdateProductTypeDto } from '@/types';
import { Button } from '@/components/ui/Button';
import { Plus, Edit2, Trash2, CheckCircle, XCircle } from 'lucide-react';

export const ProductTypesPage = () => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingType, setEditingType] = useState<ProductType | null>(null);
  const [formData, setFormData] = useState<CreateProductTypeDto>({
    name: '',
    description: '',
    isActive: true,
    productionTimeHours: undefined,
  });

  const queryClient = useQueryClient();

  // Получаем список типов товаров
  const { data: productTypes = [], isLoading } = useQuery<ProductType[]>({
    queryKey: ['productTypes'],
    queryFn: async () => {
      const response = await api.get('/product-types');
      return response.data;
    },
  });

  // Создание нового типа товара
  const createMutation = useMutation({
    mutationFn: async (data: CreateProductTypeDto) => {
      const response = await api.post('/product-types', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productTypes'] });
      setIsCreateModalOpen(false);
      resetForm();
    },
  });

  // Обновление типа товара
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateProductTypeDto }) => {
      const response = await api.patch(`/product-types/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productTypes'] });
      setEditingType(null);
      resetForm();
    },
  });

  // Удаление типа товара
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/product-types/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productTypes'] });
    },
  });

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      isActive: true,
      productionTimeHours: undefined,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingType) {
      updateMutation.mutate({ id: editingType.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (type: ProductType) => {
    setEditingType(type);
    setFormData({
      name: type.name,
      description: type.description || '',
      isActive: type.isActive,
      productionTimeHours: type.productionTimeHours,
    });
    setIsCreateModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Вы уверены, что хотите удалить этот тип товара?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleToggleActive = (type: ProductType) => {
    updateMutation.mutate({
      id: type.id,
      data: { isActive: !type.isActive },
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Загрузка...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Типы товаров</h1>
        <Button
          onClick={() => {
            resetForm();
            setEditingType(null);
            setIsCreateModalOpen(true);
          }}
          className="flex items-center gap-2"
        >
          <Plus size={18} />
          Добавить тип
        </Button>
      </div>

      <div className="grid gap-4">
        {productTypes.length === 0 ? (
          <div className="text-center py-12 bg-card rounded-lg border">
            <p className="text-muted-foreground">Типы товаров не найдены</p>
            <p className="text-sm text-muted-foreground mt-2">
              Создайте первый тип товара, нажав на кнопку "Добавить тип"
            </p>
          </div>
        ) : (
          <div className="bg-card rounded-lg border overflow-hidden">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Название</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Описание</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Норма времени (ч)</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Статус</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Дата создания</th>
                  <th className="px-6 py-3 text-right text-sm font-semibold">Действия</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {productTypes.map((type) => (
                  <tr key={type.id} className="hover:bg-muted/30">
                    <td className="px-6 py-4 font-medium">{type.name}</td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {type.description || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {type.productionTimeHours ? (
                        <span className="font-medium">{type.productionTimeHours} ч</span>
                      ) : (
                        <span className="text-muted-foreground">Не указано</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleToggleActive(type)}
                        className="flex items-center gap-2 text-sm"
                      >
                        {type.isActive ? (
                          <>
                            <CheckCircle size={16} className="text-green-500" />
                            <span className="text-green-600">Активен</span>
                          </>
                        ) : (
                          <>
                            <XCircle size={16} className="text-red-500" />
                            <span className="text-red-600">Неактивен</span>
                          </>
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {new Date(type.createdAt).toLocaleDateString('ru-RU')}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(type)}
                          className="flex items-center gap-1"
                        >
                          <Edit2 size={16} />
                          Изменить
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(type.id)}
                          className="flex items-center gap-1 text-red-600 hover:text-red-700"
                        >
                          <Trash2 size={16} />
                          Удалить
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Модальное окно создания/редактирования */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card rounded-lg p-6 w-full max-w-md shadow-xl">
            <h2 className="text-xl font-bold mb-4">
              {editingType ? 'Редактировать тип товара' : 'Создать тип товара'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Название <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                  placeholder="Например: Беседка деревянная"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Описание</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  rows={3}
                  placeholder="Краткое описание типа товара"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Нормативное время производства (часы)
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  value={formData.productionTimeHours || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    productionTimeHours: e.target.value ? parseFloat(e.target.value) : undefined
                  })}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Например: 8 или 2.5"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Оставьте пустым, если не требуется отслеживать норму времени
                </p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4 rounded border-gray-300"
                />
                <label htmlFor="isActive" className="text-sm font-medium">
                  Активный тип товара
                </label>
              </div>
              <div className="flex gap-3 pt-4">
                <Button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="flex-1"
                >
                  {editingType ? 'Сохранить' : 'Создать'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsCreateModalOpen(false);
                    setEditingType(null);
                    resetForm();
                  }}
                  className="flex-1"
                >
                  Отмена
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
