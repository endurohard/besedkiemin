import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tasksApi, workflowApi } from '@/lib/api';
import { WorkflowStage } from '@/types';
import { Loader2, Undo2 } from 'lucide-react';

interface ReturnStageControlProps {
  productId: string;
  // Текущий этап изделия (legacyStage), чтобы предлагать только более ранние
  currentStage?: string;
}

export const ReturnStageControl = ({ productId, currentStage }: ReturnStageControlProps) => {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [targetStage, setTargetStage] = useState('');

  const { data: stages, isLoading } = useQuery({
    queryKey: ['workflow-stages-active'],
    queryFn: () => workflowApi.getActive(),
    enabled: isOpen,
  });

  const returnMutation = useMutation({
    mutationFn: async (stage: string) => tasksApi.returnProductToStage(productId, stage),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['department-tasks'] });
      setIsOpen(false);
      setTargetStage('');
    },
    onError: (error: any) => {
      alert(
        `Ошибка возврата: ${error?.response?.data?.message || error?.message || 'Неизвестная ошибка'}`,
      );
    },
  });

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded"
      >
        <Undo2 size={12} />
        Вернуть на этап
      </button>
    );
  }

  // Предлагаем только активные этапы не позже текущего
  const currentOrder =
    (stages ?? []).find((s: WorkflowStage) => s.legacyStage === currentStage)?.order ?? Infinity;
  const options = (stages ?? [])
    .filter((s: WorkflowStage) => !!s.legacyStage && s.order <= currentOrder && s.legacyStage !== currentStage)
    .sort((a: WorkflowStage, b: WorkflowStage) => a.order - b.order);

  const targetLabel = options.find((s) => s.legacyStage === targetStage)?.name;

  const handleReturn = () => {
    if (!targetStage) return;
    if (
      confirm(
        `Вернуть изделие на этап «${targetLabel}»? Текущие незавершённые задачи по этому изделию будут удалены и создана задача выбранного отдела.`,
      )
    ) {
      returnMutation.mutate(targetStage);
    }
  };

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {isLoading ? (
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Loader2 size={12} className="animate-spin" />
          Загрузка…
        </div>
      ) : (
        <select
          value={targetStage}
          onChange={(e) => setTargetStage(e.target.value)}
          className="px-2 py-1 text-[11px] border border-border rounded bg-card"
        >
          <option value="">-- Вернуть на этап --</option>
          {options.map((s) => (
            <option key={s.id} value={s.legacyStage}>
              {s.name}
            </option>
          ))}
        </select>
      )}
      <button
        type="button"
        onClick={handleReturn}
        disabled={!targetStage || returnMutation.isPending}
        className="px-2 py-1 text-[11px] font-medium text-white bg-amber-600 hover:bg-amber-700 disabled:bg-amber-300 rounded"
      >
        {returnMutation.isPending ? 'Возврат…' : 'Вернуть'}
      </button>
      <button
        type="button"
        onClick={() => {
          setIsOpen(false);
          setTargetStage('');
        }}
        className="px-2 py-1 text-[11px] border border-border rounded hover:bg-muted/50"
      >
        Отмена
      </button>
    </div>
  );
};
