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
          <span className="text-muted-foreground">Продукт:</span>
          <span className="font-medium truncate">{task.product.name}</span>
        </div>
        <div className="flex gap-1">
          <span className="text-muted-foreground">Кол-во:</span>
          <span className="font-medium">{task.quantity || task.product.quantity} шт.</span>
        </div>
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

      {task.product.schemaImageUrl && (
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
            Схема
          </button>
        </div>
      )}

      {viewerOpen && task.product.schemaImageUrl && (
        <SchemaImageViewer
          src={task.product.schemaImageUrl}
          onClose={() => setViewerOpen(false)}
        />
      )}
    </div>
  );
};
