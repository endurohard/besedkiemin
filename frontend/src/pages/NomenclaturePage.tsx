import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { nomenclatureApi, productTypesApi } from '@/lib/api';
import { Nomenclature, ProductType, CreateNomenclatureDto } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Plus, Edit2, Trash2, X, Package, Filter } from 'lucide-react';

export const NomenclaturePage = () => {
  const queryClient = useQueryClient();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Nomenclature | null>(null);
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('');
  const [showInactive, setShowInactive] = useState(false);

  const [formData, setFormData] = useState<CreateNomenclatureDto>({
    name: '',
    sku: '',
    description: '',
    productTypeId: '',
    dimensions: '',
    materials: '',
    color: '',
    upholsteryMaterial: '',
    weight: undefined,
    basePrice: undefined,
    productionTimeHours: undefined,
  });

  // Получение типов товаров
  const { data: productTypes = [] } = useQuery({
    queryKey: ['product-types'],
    queryFn: () => productTypesApi.getAll(true),
  });

  // Получение номенклатуры
  const { data: nomenclature = [], isLoading } = useQuery({
    queryKey: ['nomenclature', showInactive],
    queryFn: () => nomenclatureApi.getAll(showInactive),
  });

  // Фильтрация по типу
  const filteredNomenclature = selectedTypeFilter
    ? nomenclature.filter((n) => n.productTypeId === selectedTypeFilter)
    : nomenclature;

  // Мутации
  const createMutation = useMutation({
    mutationFn: nomenclatureApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nomenclature'] });
      resetForm();
      setIsCreateModalOpen(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateNomenclatureDto> }) =>
      nomenclatureApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nomenclature'] });
      resetForm();
      setEditingItem(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: nomenclatureApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nomenclature'] });
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: nomenclatureApi.toggleActive,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nomenclature'] });
    },
  });

  const resetForm = () => {
    setFormData({
      name: '',
      sku: '',
      description: '',
      productTypeId: '',
      dimensions: '',
      materials: '',
      color: '',
      upholsteryMaterial: '',
      weight: undefined,
      basePrice: undefined,
      productionTimeHours: undefined,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.productTypeId) {
      alert('Выберите тип товара');
      return;
    }
    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (item: Nomenclature) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      sku: item.sku || '',
      description: item.description || '',
      productTypeId: item.productTypeId,
      dimensions: item.dimensions || '',
      materials: item.materials || '',
      color: item.color || '',
      upholsteryMaterial: item.upholsteryMaterial || '',
      weight: item.weight || undefined,
      basePrice: item.basePrice || undefined,
      productionTimeHours: item.productionTimeHours || undefined,
    });
    setIsCreateModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Удалить эту номенклатуру?')) {
      deleteMutation.mutate(id);
    }
  };

  // Группировка по типам товаров
  const groupedNomenclature = filteredNomenclature.reduce((acc, item) => {
    const typeName = item.productType?.name || 'Без типа';
    if (!acc[typeName]) {
      acc[typeName] = [];
    }
    acc[typeName].push(item);
    return acc;
  }, {} as Record<string, Nomenclature[]>);

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
        <h1 className="text-3xl font-bold">Каталог</h1>
        <Button
          onClick={() => {
            resetForm();
            setEditingItem(null);
            setIsCreateModalOpen(true);
          }}
          className="flex items-center gap-2"
        >
          <Plus size={18} />
          Добавить товар
        </Button>
      </div>

      {/* Фильтры */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <Filter size={18} className="text-muted-foreground" />
          <select
            value={selectedTypeFilter}
            onChange={(e) => setSelectedTypeFilter(e.target.value)}
            className="h-9 px-3 border rounded-md text-sm bg-background"
          >
            <option value="">Все типы</option>
            {productTypes.map((type: ProductType) => (
              <option key={type.id} value={type.id}>
                {type.name}
              </option>
            ))}
          </select>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={showInactive}
            onChange={(e) => setShowInactive(e.target.checked)}
            className="rounded"
          />
          Показать неактивные
        </label>
      </div>

      {/* Список номенклатуры */}
      {Object.keys(groupedNomenclature).length === 0 ? (
        <div className="text-center py-12 bg-card rounded-lg border">
          <Package className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
          <p className="text-muted-foreground">Номенклатура не найдена</p>
          <p className="text-sm text-muted-foreground mt-2">
            Добавьте товары в каталог, нажав кнопку "Добавить товар"
          </p>
        </div>
      ) : (
        Object.entries(groupedNomenclature).map(([typeName, items]) => (
          <Card key={typeName}>
            <CardHeader className="py-3">
              <CardTitle className="text-lg">{typeName}</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr className="text-left text-sm">
                    <th className="px-4 py-2 font-medium">Название</th>
                    <th className="px-4 py-2 font-medium">Артикул</th>
                    <th className="px-4 py-2 font-medium">Размеры</th>
                    <th className="px-4 py-2 font-medium">Цена</th>
                    <th className="px-4 py-2 font-medium">Статус</th>
                    <th className="px-4 py-2 font-medium text-right">Действия</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {items.map((item) => (
                    <tr key={item.id} className={!item.isActive ? 'opacity-50' : ''}>
                      <td className="px-4 py-3">
                        <div>
                          <div className="font-medium">{item.name}</div>
                          {item.description && (
                            <div className="text-sm text-muted-foreground">{item.description}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm">{item.sku || '-'}</td>
                      <td className="px-4 py-3 text-sm">{item.dimensions || '-'}</td>
                      <td className="px-4 py-3 text-sm">
                        {item.basePrice ? `${item.basePrice.toLocaleString()} ₽` : '-'}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => toggleActiveMutation.mutate(item.id)}
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
                            onClick={() => handleDelete(item.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 size={16} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        ))
      )}

      {/* Модальное окно создания/редактирования */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background rounded-lg shadow-lg w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">
                {editingItem ? 'Редактировать товар' : 'Добавить товар'}
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
                <label className="block text-sm font-medium mb-1">Тип товара *</label>
                <select
                  value={formData.productTypeId}
                  onChange={(e) => setFormData({ ...formData, productTypeId: e.target.value })}
                  className="w-full h-10 px-3 border rounded-md"
                  required
                >
                  <option value="">Выберите тип</option>
                  {productTypes.filter((t: ProductType) => t.isActive).map((type: ProductType) => (
                    <option key={type.id} value={type.id}>
                      {type.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Название *</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Например: Беседка 3x3"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Артикул</label>
                  <Input
                    value={formData.sku || ''}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    placeholder="BES-3X3"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Размеры</label>
                  <Input
                    value={formData.dimensions || ''}
                    onChange={(e) => setFormData({ ...formData, dimensions: e.target.value })}
                    placeholder="3x3 м"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Описание</label>
                <textarea
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md resize-none"
                  rows={2}
                  placeholder="Краткое описание товара"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Материалы</label>
                  <Input
                    value={formData.materials || ''}
                    onChange={(e) => setFormData({ ...formData, materials: e.target.value })}
                    placeholder="Сосна, лиственница"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Цвет/покрытие (для маляра)</label>
                  <Input
                    value={formData.color || ''}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    placeholder="Орех, Палисандр, код 906"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Материал обшивки (для швеи)</label>
                <Input
                  value={formData.upholsteryMaterial || ''}
                  onChange={(e) => setFormData({ ...formData, upholsteryMaterial: e.target.value })}
                  placeholder="Экокожа черная, Велюр бежевый, код 1140"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Если указан - автоматически включается этап пошива
                </p>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Вес (кг)</label>
                  <Input
                    type="number"
                    step="0.1"
                    value={formData.weight || ''}
                    onChange={(e) => setFormData({ ...formData, weight: e.target.value ? parseFloat(e.target.value) : undefined })}
                    placeholder="150"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Цена (₽)</label>
                  <Input
                    type="number"
                    value={formData.basePrice || ''}
                    onChange={(e) => setFormData({ ...formData, basePrice: e.target.value ? parseFloat(e.target.value) : undefined })}
                    placeholder="50000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Время (ч)</label>
                  <Input
                    type="number"
                    step="0.5"
                    value={formData.productionTimeHours || ''}
                    onChange={(e) => setFormData({ ...formData, productionTimeHours: e.target.value ? parseFloat(e.target.value) : undefined })}
                    placeholder="8"
                  />
                </div>
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
