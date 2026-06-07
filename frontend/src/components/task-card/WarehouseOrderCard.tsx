import { useState } from 'react';
import { Task } from '@/types';
import { Button } from '../ui/Button';
import { ordersApi } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';
import { User, Phone, MapPin, FileText, X, Package } from 'lucide-react';
import { stageLabels } from '@/lib/labels';

interface WarehouseOrderCardProps {
  task: Task;
}

/**
 * Блок информации о заказе для складиста: имя клиента, телефон, адрес.
 * По кнопке «Детали заказа» открывается модалка со всеми позициями заказа,
 * чтобы при приёмке складист видел всю карточку заказа целиком.
 */
export const WarehouseOrderCard = ({ task }: WarehouseOrderCardProps) => {
  const [showDetails, setShowDetails] = useState(false);
  const order = task.product?.order;

  if (!order) return null;

  return (
    <>
      <div className="mb-2 p-1.5 rounded text-[11px] bg-blue-50 border border-blue-200 space-y-0.5">
        <div className="flex gap-1 items-center">
          <User size={11} className="text-blue-700 flex-shrink-0" />
          <span className="font-semibold text-blue-900 truncate">{order.customerName}</span>
          {order.orderNumber && (
            <span className="ml-auto text-[10px] text-blue-700 font-medium flex-shrink-0">
              №{order.orderNumber}
            </span>
          )}
        </div>
        {order.customerPhone && (
          <div className="flex gap-1 items-center">
            <Phone size={11} className="text-blue-700 flex-shrink-0" />
            <a
              href={`tel:${order.customerPhone}`}
              className="text-blue-800 hover:underline truncate"
              onClick={(e) => e.stopPropagation()}
            >
              {order.customerPhone}
            </a>
          </div>
        )}
        {order.customerAddress && (
          <div className="flex gap-1 items-start">
            <MapPin size={11} className="text-blue-700 flex-shrink-0 mt-0.5" />
            <span className="text-blue-800 break-words">{order.customerAddress}</span>
          </div>
        )}
        <button
          type="button"
          onClick={() => setShowDetails(true)}
          className="mt-1 text-[10px] text-primary hover:text-blue-900 underline flex items-center gap-0.5"
        >
          <FileText size={10} />
          Детали заказа
        </button>
      </div>

      {showDetails && (
        <OrderDetailsModal orderId={order.id} currentProductId={task.productId} onClose={() => setShowDetails(false)} />
      )}
    </>
  );
};

interface OrderDetailsModalProps {
  orderId: string;
  currentProductId?: string;
  onClose: () => void;
}

const OrderDetailsModal = ({ orderId, currentProductId, onClose }: OrderDetailsModalProps) => {
  const { data: order, isLoading } = useQuery({
    queryKey: ['order', orderId],
    queryFn: () => ordersApi.getOne(orderId),
  });

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-card rounded-lg w-full max-w-md max-h-[85vh] overflow-y-auto shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-card border-b px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <Package size={18} className="text-primary flex-shrink-0" />
            <h3 className="text-base font-bold truncate">
              Заказ {order?.orderNumber ? `№${order.orderNumber}` : ''}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded hover:bg-muted flex-shrink-0"
            aria-label="Закрыть"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-blue-600" />
            </div>
          ) : !order ? (
            <p className="text-sm text-muted-foreground text-center py-6">Заказ не найден</p>
          ) : (
            <div className="space-y-3 text-sm">
              <div className="space-y-1">
                <div className="flex gap-2 items-center">
                  <User size={14} className="text-muted-foreground flex-shrink-0" />
                  <span className="font-semibold">{order.customerName}</span>
                </div>
                {order.customerPhone && (
                  <div className="flex gap-2 items-center">
                    <Phone size={14} className="text-muted-foreground flex-shrink-0" />
                    <a href={`tel:${order.customerPhone}`} className="text-primary hover:underline">
                      {order.customerPhone}
                    </a>
                  </div>
                )}
                {order.customerAddress && (
                  <div className="flex gap-2 items-start">
                    <MapPin size={14} className="text-muted-foreground flex-shrink-0 mt-0.5" />
                    <span>{order.customerAddress}</span>
                  </div>
                )}
                {order.description && (
                  <p className="text-xs text-muted-foreground pt-1">{order.description}</p>
                )}
              </div>

              <div className="border-t pt-3">
                <p className="text-xs font-semibold text-muted-foreground mb-2">
                  Позиции заказа ({order.products?.length || 0})
                </p>
                <div className="space-y-1.5">
                  {order.products?.map((p) => {
                    const isCurrent = p.id === currentProductId;
                    return (
                      <div
                        key={p.id}
                        className={`p-2 rounded border text-xs ${
                          isCurrent ? 'bg-blue-50 border-blue-300' : 'bg-muted/40 border-border'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <span className="font-medium">{p.name}</span>
                            {p.isCustom && (
                              <span className="ml-1 text-[9px] font-semibold text-pink-600">★ инд.</span>
                            )}
                            {isCurrent && (
                              <span className="ml-1 text-[9px] font-semibold text-blue-700">← текущая</span>
                            )}
                          </div>
                          <span className="text-muted-foreground flex-shrink-0">{p.quantity} шт.</span>
                        </div>
                        <div className="flex items-center justify-between mt-0.5 text-[10px] text-muted-foreground">
                          <span>{p.productType?.name || ''}</span>
                          <span className="font-medium">{stageLabels[p.stage] || p.stage}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="sticky bottom-0 bg-card border-t px-4 py-3">
          <Button onClick={onClose} variant="outline" className="w-full">
            Закрыть
          </Button>
        </div>
      </div>
    </div>
  );
};
