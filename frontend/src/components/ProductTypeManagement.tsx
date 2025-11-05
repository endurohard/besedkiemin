import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productTypesApi } from '@/lib/api';
import { ProductType } from '@/types';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Card, CardHeader, CardTitle, CardContent } from './ui/Card';
import { Plus, Edit2, Trash2, Power } from 'lucide-react';

export const ProductTypeManagement = () => {
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', description: '' });

  // Fetch product types
  const { data: productTypes = [], isLoading } = useQuery({
    queryKey: ['product-types', 'all'],
    queryFn: () => productTypesApi.getAll(true),
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: productTypesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-types'] });
      setIsCreating(false);
      setFormData({ name: '', description: '' });
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      productTypesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-types'] });
      setEditingId(null);
      setFormData({ name: '', description: '' });
    },
  });

  // Toggle active mutation
  const toggleActiveMutation = useMutation({
    mutationFn: productTypesApi.toggleActive,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-types'] });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: productTypesApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-types'] });
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || 'Ошибка при удалении типа продукта');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      updateMutation.mutate({ id: editingId, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (type: ProductType) => {
    setEditingId(type.id);
    setFormData({ name: type.name, description: type.description || '' });
    setIsCreating(true);
  };

  const handleCancel = () => {
    setIsCreating(false);
    setEditingId(null);
    setFormData({ name: '', description: '' });
  };

  if (isLoading) {
    return <div className="text-center py-8">Загрузка...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Управление типами продуктов</CardTitle>
          {!isCreating && (
            <Button onClick={() => setIsCreating(true)} className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Добавить тип
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isCreating && (
          <form onSubmit={handleSubmit} className="mb-6 p-4 border border-gray-200 rounded-lg">
            <h3 className="text-lg font-semibold mb-4">
              {editingId ? 'Редактировать тип' : 'Создать новый тип'}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Название *
                </label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Стол, Стул, и т.д."
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Описание
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Краткое описание типа продукта"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={2}
                />
              </div>
              <div className="flex items-center gap-3">
                <Button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {editingId ? 'Сохранить' : 'Создать'}
                </Button>
                <Button
                  type="button"
                  onClick={handleCancel}
                  className="bg-gray-200 text-gray-800 hover:bg-gray-300"
                >
                  Отмена
                </Button>
              </div>
            </div>
          </form>
        )}

        <div className="space-y-2">
          {productTypes.map((type) => (
            <div
              key={type.id}
              className={`p-4 border rounded-lg ${
                type.isActive ? 'border-gray-200 bg-white' : 'border-gray-300 bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h4 className="text-lg font-medium">{type.name}</h4>
                    {!type.isActive && (
                      <span className="px-2 py-1 text-xs bg-gray-200 text-gray-600 rounded">
                        Неактивный
                      </span>
                    )}
                  </div>
                  {type.description && (
                    <p className="text-sm text-gray-600 mt-1">{type.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleEdit(type)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                    title="Редактировать"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => toggleActiveMutation.mutate(type.id)}
                    className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-md transition-colors"
                    title={type.isActive ? 'Деактивировать' : 'Активировать'}
                  >
                    <Power className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      if (
                        window.confirm(
                          `Вы уверены, что хотите удалить тип "${type.name}"?`
                        )
                      ) {
                        deleteMutation.mutate(type.id);
                      }
                    }}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                    title="Удалить"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
