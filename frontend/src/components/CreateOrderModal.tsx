import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ordersApi, productsApi, productTypesApi, uploadApi } from '@/lib/api';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { AddressInput } from './AddressInput';
import { CustomerNameInput } from './CustomerNameInput';
import { X, Upload, Image as ImageIcon } from 'lucide-react';
import { OrderPriority } from '@/types';

interface CreateOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ProductFormData {
  name: string;
  productTypeId: string;
  quantity: number;
  dimensions?: string;
  schemaImageUrl?: string;
  schemaFile?: File;
}

export const CreateOrderModal = ({ isOpen, onClose }: CreateOrderModalProps) => {
  const queryClient = useQueryClient();

  // Fetch product types
  const { data: productTypes = [] } = useQuery({
    queryKey: ['product-types'],
    queryFn: () => productTypesApi.getAll(),
    enabled: isOpen,
  });

  const [isInternalOrder, setIsInternalOrder] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<OrderPriority>(OrderPriority.NORMAL);
  const [products, setProducts] = useState<ProductFormData[]>([]);

  const createOrderMutation = useMutation({
    mutationFn: async (orderData: any) => {
      const order = await ordersApi.create({
        customerName: orderData.customerName,
        customerPhone: orderData.customerPhone,
        customerAddress: orderData.customerAddress,
        description: orderData.description,
        priority: orderData.priority,
      });

      // Создаем продукты для заказа (если есть)
      if (orderData.products && orderData.products.length > 0) {
        for (const product of orderData.products) {
          // Загружаем фото схемы, если есть
          let schemaImageUrl = product.schemaImageUrl;
          if (product.schemaFile) {
            const uploadResult = await uploadApi.uploadSchemaImage(product.schemaFile);
            schemaImageUrl = uploadResult.url;
          }

          await productsApi.create({
            name: product.name,
            productTypeId: product.productTypeId,
            quantity: product.quantity,
            dimensions: product.dimensions,
            schemaImageUrl,
            orderId: order.id,
          });
        }
      }

      return order;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      handleClose();
    },
  });

  const handleClose = () => {
    setIsInternalOrder(false);
    setCustomerName('');
    setCustomerPhone('');
    setCustomerAddress('');
    setDescription('');
    setPriority(OrderPriority.NORMAL);
    setProducts([]);
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Для внутренних заказов используем название компании
    const finalCustomerName = isInternalOrder ? 'Внутренний заказ' : customerName;
    const finalCustomerPhone = isInternalOrder ? '' : customerPhone;

    createOrderMutation.mutate({
      customerName: finalCustomerName,
      customerPhone: finalCustomerPhone,
      customerAddress,
      description,
      priority,
      products: products.filter((p) => p.name.trim() !== '' && p.productTypeId),
    });
  };

  const addProduct = () => {
    setProducts([...products, { name: '', productTypeId: '', quantity: 1, dimensions: '', schemaImageUrl: '' }]);
  };

  const removeProduct = (index: number) => {
    setProducts(products.filter((_, i) => i !== index));
  };

  const updateProduct = (index: number, field: keyof ProductFormData, value: any) => {
    const updated = [...products];
    updated[index] = { ...updated[index], [field]: value };
    setProducts(updated);
  };

  const handleFileChange = (index: number, file: File | null) => {
    if (file) {
      const updated = [...products];
      updated[index] = { ...updated[index], schemaFile: file };
      setProducts(updated);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto m-4">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold">Создать новый заказ</h2>
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Тип заказа */}
          <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <input
              type="checkbox"
              id="internalOrder"
              checked={isInternalOrder}
              onChange={(e) => setIsInternalOrder(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
            />
            <label htmlFor="internalOrder" className="text-sm font-medium text-blue-900 cursor-pointer">
              Внутренний заказ (для собственного производства)
            </label>
          </div>

          {/* Информация о клиенте */}
          {!isInternalOrder && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Информация о клиенте</h3>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Имя клиента *
                </label>
                <CustomerNameInput
                  value={customerName}
                  onChange={(name, phone, address) => {
                    setCustomerName(name);
                    if (phone) setCustomerPhone(phone);
                    if (address) setCustomerAddress(address);
                  }}
                  placeholder="Иван Иванов"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Телефон *
                </label>
                <Input
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="+7999 999 99 99"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Адрес
                </label>
                <AddressInput
                  value={customerAddress}
                  onChange={setCustomerAddress}
                  placeholder="Начните вводить адрес..."
                />
              </div>
            </div>
          )}

          {/* Описание */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Описание заказа
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Дополнительная информация о заказе"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
            />
          </div>

          {/* Приоритет */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Приоритет заказа
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as OrderPriority)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={OrderPriority.LOW}>Низкий</option>
              <option value={OrderPriority.NORMAL}>Обычный</option>
              <option value={OrderPriority.HIGH}>Высокий</option>
              <option value={OrderPriority.URGENT}>Срочный</option>
            </select>
          </div>

          {/* Продукты */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Продукты</h3>
                <p className="text-xs text-gray-500 mt-1">Можно добавить позже через раздел "Заказы"</p>
              </div>
              <Button type="button" onClick={addProduct} className="text-sm">
                + Добавить продукт
              </Button>
            </div>

            {products.length === 0 && (
              <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                <p className="text-sm text-gray-500">Продукты не добавлены</p>
                <p className="text-xs text-gray-400 mt-1">Нажмите "+ Добавить продукт" чтобы добавить</p>
              </div>
            )}

            {products.map((product, index) => (
              <div key={index} className="p-4 border border-gray-200 rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">
                    Продукт {index + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeProduct(index)}
                    className="text-red-500 hover:text-red-700 text-sm"
                  >
                    Удалить
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Название *
                    </label>
                    <Input
                      value={product.name}
                      onChange={(e) => updateProduct(index, 'name', e.target.value)}
                      placeholder="Стол обеденный"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Количество *
                    </label>
                    <Input
                      type="number"
                      min="1"
                      value={product.quantity}
                      onChange={(e) =>
                        updateProduct(index, 'quantity', parseInt(e.target.value))
                      }
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Тип продукта *
                  </label>
                  <select
                    value={product.productTypeId}
                    onChange={(e) =>
                      updateProduct(index, 'productTypeId', e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Выберите тип</option>
                    {productTypes.map((type) => (
                      <option key={type.id} value={type.id}>
                        {type.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Размеры (ДxШxВ)
                  </label>
                  <Input
                    value={product.dimensions || ''}
                    onChange={(e) => updateProduct(index, 'dimensions', e.target.value)}
                    placeholder="180x90x75 см"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Фото схемы
                  </label>
                  <div className="flex items-center gap-2">
                    <label className="flex-1 flex items-center justify-center gap-2 px-3 py-2 border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50 transition-colors">
                      <Upload size={16} />
                      <span className="text-sm">
                        {product.schemaFile ? product.schemaFile.name : 'Выбрать файл'}
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileChange(index, file);
                        }}
                      />
                    </label>
                    {product.schemaFile && (
                      <div className="text-green-600">
                        <ImageIcon size={20} />
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Загрузите фото схемы для производственников (макс. 5MB)
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Кнопки действий */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              onClick={handleClose}
              className="bg-gray-200 text-gray-800 hover:bg-gray-300"
            >
              Отмена
            </Button>
            <Button
              type="submit"
              disabled={createOrderMutation.isPending}
              className="bg-blue-600 text-white hover:bg-blue-700"
            >
              {createOrderMutation.isPending ? 'Создание...' : 'Создать заказ'}
            </Button>
          </div>

          {createOrderMutation.isError && (
            <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
              Ошибка при создании заказа. Попробуйте еще раз.
            </div>
          )}
        </form>
      </div>
    </div>
  );
};
