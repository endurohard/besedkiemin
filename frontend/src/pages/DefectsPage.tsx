import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { QualityCheck } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { AlertTriangle, X, Eye, Calendar, User, Package, FileText, CheckCircle } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

interface DefectWithPhotos extends QualityCheck {
  defectPhotos?: string[];
}

export const DefectsPage = () => {
  const [selectedDefect, setSelectedDefect] = useState<DefectWithPhotos | null>(null);
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  // Проверяем, может ли пользователь принимать браки на доработку
  const canAcceptDefects = user?.role?.code === 'PAINTER' || user?.role?.code === 'DESIGNER' || user?.role?.code === 'PREPARER' || user?.role?.code === 'MANAGER';

  // Fetch all defects with photos using dedicated endpoint
  const { data: defects, isLoading } = useQuery({
    queryKey: ['defects'],
    queryFn: async () => {
      const response = await fetch('/api/tasks/defects', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch defects');
      return response.json();
    },
    refetchInterval: 30000,
  });

  // Mutation for accepting defect rework
  const acceptReworkMutation = useMutation({
    mutationFn: async (productId: string) => {
      const response = await fetch(`/api/tasks/defects/${productId}/accept`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to accept rework');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['defects'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      alert('Брак принят на доработку! Задача появилась в разделе "Мои задачи"');
      setSelectedDefect(null);
    },
    onError: (error: Error) => {
      alert(`Ошибка: ${error.message}`);
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-lg text-muted-foreground">Загрузка...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Брак</h1>
          <p className="text-muted-foreground mt-1">
            Список всех забракованных товаров
          </p>
        </div>
        <div className="flex items-center gap-2 text-2xl font-semibold">
          <AlertTriangle className="text-red-500" size={28} />
          <span>Всего: {defects?.length || 0}</span>
        </div>
      </div>

      <div className="grid gap-4">
        {defects && defects.length > 0 ? (
          defects.map((defect: QualityCheck) => (
            <Card key={defect.id} className="border-l-4 border-l-red-500">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="text-red-500" size={20} />
                    {defect.product?.name || 'Товар'}
                  </CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedDefect(defect)}
                  >
                    <Eye size={16} className="mr-2" />
                    Детали
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Package size={16} className="text-muted-foreground" />
                    <div>
                      <div className="text-xs text-muted-foreground">Тип товара</div>
                      <div className="font-medium">{defect.product?.productType?.name || 'Н/Д'}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <FileText size={16} className="text-muted-foreground" />
                    <div>
                      <div className="text-xs text-muted-foreground">Заказ</div>
                      <div className="font-medium">{defect.product?.order?.orderNumber || 'Н/Д'}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <User size={16} className="text-muted-foreground" />
                    <div>
                      <div className="text-xs text-muted-foreground">Забраковал</div>
                      <div className="font-medium">
                        {defect.checkedBy ? `${defect.checkedBy.firstName} ${defect.checkedBy.lastName}` : 'Н/Д'}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar size={16} className="text-muted-foreground" />
                    <div>
                      <div className="text-xs text-muted-foreground">Дата</div>
                      <div className="font-medium">
                        {defect.checkedAt ? new Date(defect.checkedAt).toLocaleDateString('ru-RU') : 'Н/Д'}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <AlertTriangle size={16} className="text-orange-500" />
                    <div>
                      <div className="text-xs text-muted-foreground">Текущая стадия</div>
                      <div className="font-medium">
                        {defect.product?.stage === 'PAINTING' && 'Покраска'}
                        {defect.product?.stage === 'DESIGN' && 'Проектирование'}
                        {defect.product?.stage === 'PREPARATION' && 'Заготовка'}
                        {defect.product?.stage === 'PENDING' && 'Менеджер'}
                        {!defect.product?.stage && 'Н/Д'}
                      </div>
                    </div>
                  </div>
                </div>
                {defect.notes && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                    <div className="text-xs font-medium text-red-900 mb-1">Причина брака:</div>
                    <div className="text-sm text-red-800">{defect.notes}</div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <AlertTriangle size={48} className="mx-auto mb-4 opacity-20" />
              <p>Браков не найдено</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Модальное окно с деталями брака */}
      {selectedDefect && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="text-red-500" />
                Детали брака
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setSelectedDefect(null)}>
                <X size={20} />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-sm font-medium text-muted-foreground">Товар</div>
                <div className="text-lg font-semibold">{selectedDefect.product?.name || 'Н/Д'}</div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Тип товара</div>
                  <div>{selectedDefect.product?.productType?.name || 'Н/Д'}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Номер заказа</div>
                  <div>{selectedDefect.product?.order?.orderNumber || 'Н/Д'}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Клиент</div>
                  <div>{selectedDefect.product?.order?.customerName || 'Н/Д'}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Количество</div>
                  <div>{selectedDefect.product?.quantity || 0} шт.</div>
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">Причина брака</div>
                <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                  {selectedDefect.notes || 'Причина не указана'}
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">Забраковал</div>
                <div>
                  {selectedDefect.checkedBy ? (
                    <span>
                      {selectedDefect.checkedBy.firstName} {selectedDefect.checkedBy.lastName}
                      {' '}({selectedDefect.checkedBy.role?.name || 'Н/Д'})
                    </span>
                  ) : 'Н/Д'}
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">Дата браковки</div>
                <div>
                  {selectedDefect.checkedAt ? (
                    <>
                      {new Date(selectedDefect.checkedAt).toLocaleDateString('ru-RU', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                      {' в '}
                      {new Date(selectedDefect.checkedAt).toLocaleTimeString('ru-RU', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </>
                  ) : 'Н/Д'}
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-2">
                  Фото брака
                </div>
                {selectedDefect.defectPhotos && selectedDefect.defectPhotos.length > 0 ? (
                  <div className="grid grid-cols-2 gap-4">
                    {selectedDefect.defectPhotos.map((photoUrl, index) => (
                      <div key={index} className="relative">
                        <img
                          src={photoUrl}
                          alt={`Фото брака ${index + 1}`}
                          className="w-full rounded-lg border hover:scale-105 transition-transform cursor-pointer"
                          onClick={() => window.open(photoUrl, '_blank')}
                        />
                        <div className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                          {index + 1} / {selectedDefect.defectPhotos!.length}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 bg-gray-50 border border-gray-200 rounded-md text-sm text-gray-600">
                    Фото брака не прикреплены
                  </div>
                )}
              </div>

              {/* Кнопка принятия на доработку для работников */}
              {canAcceptDefects && selectedDefect.productId && (
                <div className="pt-4 border-t">
                  <Button
                    onClick={() => acceptReworkMutation.mutate(selectedDefect.productId)}
                    disabled={acceptReworkMutation.isPending}
                    className="w-full flex items-center justify-center gap-2"
                    variant="default"
                  >
                    <CheckCircle size={20} />
                    {acceptReworkMutation.isPending ? 'Принимаем...' : 'Принять на доработку'}
                  </Button>
                  <p className="text-xs text-muted-foreground text-center mt-2">
                    Задача появится в разделе "Мои задачи"
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};
