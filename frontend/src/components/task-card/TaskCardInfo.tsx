import { useState } from 'react';
import { Task } from '@/types';
import { Package } from 'lucide-react';
import { SchemaImageViewer } from '@/components/SchemaImageViewer';

interface TaskCardInfoProps {
  task: Task;
  isPainter: boolean;
  isSewer: boolean;
}

export const TaskCardInfo = ({ task, isPainter, isSewer }: TaskCardInfoProps) => {
  const [viewerOpen, setViewerOpen] = useState(false);

  if (!task.product) return null;

  return (
    <div
      className={`mb-2 p-1.5 rounded text-[11px] ${
        task.product.isCustom ? 'bg-pink-50 border border-pink-300' : 'bg-muted/50'
      }`}
    >
      {task.product.isCustom && (
        <div className="mb-1 inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-pink-500 text-white text-[9px] font-semibold uppercase">
          ★ Индивидуальный
        </div>
      )}
      <div className="space-y-0.5">
        <div className="flex gap-1">
          <span className="text-muted-foreground shrink-0">Продукт:</span>
          <span className="font-medium break-words">{task.product.name}</span>
        </div>
        <div className="flex gap-1">
          <span className="text-muted-foreground shrink-0">Кол-во:</span>
          <span className="font-medium">{task.quantity || task.product.quantity} шт.</span>
        </div>
        {task.product.dimensions && (
          <div className="flex gap-1">
            <span className="text-muted-foreground shrink-0">Размеры:</span>
            <span className="font-medium break-words">{task.product.dimensions}</span>
          </div>
        )}
        {task.product.description && (
          <div className="mt-1 pt-1 border-t">
            <span className="text-muted-foreground block">Описание:</span>
            <p className="font-medium whitespace-pre-wrap break-words">{task.product.description}</p>
          </div>
        )}
      </div>

      {isPainter && task.product.color && (
        <div className="mt-1 pt-1 border-t border-orange-200 bg-orange-50 p-1 rounded">
          <div className="flex gap-1 items-center">
            <span className="text-orange-700 font-medium">🎨 Цвет:</span>
            <span className="font-bold text-orange-900">{task.product.color}</span>
          </div>
        </div>
      )}

      {isSewer && task.product.upholsteryMaterial && (
        <div className="mt-1 pt-1 border-t border-purple-200 bg-purple-50 p-1 rounded">
          <div className="flex gap-1 items-center">
            <span className="text-purple-700 font-medium">🧵 Обшивка:</span>
            <span className="font-bold text-purple-900">{task.product.upholsteryMaterial}</span>
          </div>
        </div>
      )}

      {(() => {
        const gallery = (task.product.schemaImageUrls && task.product.schemaImageUrls.length > 0
          ? task.product.schemaImageUrls
          : task.product.schemaImageUrl
            ? [task.product.schemaImageUrl]
            : []);
        if (gallery.length === 0) return null;
        return (
          <>
            <div className="mt-1 pt-1 border-t">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setViewerOpen(true);
                }}
                className="text-[10px] text-primary hover:text-blue-800 underline flex items-center gap-0.5"
              >
                <Package size={10} />
                Схема{gallery.length > 1 ? ` (${gallery.length})` : ''}
              </button>
            </div>
            {viewerOpen && (
              <SchemaImageViewer
                images={gallery}
                onClose={() => setViewerOpen(false)}
              />
            )}
          </>
        );
      })()}
    </div>
  );
};
