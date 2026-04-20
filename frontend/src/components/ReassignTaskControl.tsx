import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tasksApi } from '@/lib/api';
import { Loader2, UserCheck } from 'lucide-react';

interface ReassignTaskControlProps {
  taskId: string;
  currentAssigneeId?: string;
}

export const ReassignTaskControl = ({ taskId, currentAssigneeId }: ReassignTaskControlProps) => {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedWorkerId, setSelectedWorkerId] = useState('');

  const { data: workers, isLoading } = useQuery({
    queryKey: ['reassignable-workers', taskId],
    queryFn: () => tasksApi.getReassignableWorkers(taskId),
    enabled: isOpen,
  });

  const reassignMutation = useMutation({
    mutationFn: async (workerId: string) => tasksApi.reassignTask(taskId, workerId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['department-tasks'] });
      setIsOpen(false);
      setSelectedWorkerId('');
    },
    onError: (error: any) => {
      alert(`Ошибка переназначения: ${error?.response?.data?.message || error?.message || 'Неизвестная ошибка'}`);
    },
  });

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded"
      >
        <UserCheck size={12} />
        Переназначить
      </button>
    );
  }

  const options = (workers ?? []).filter((w) => w.id !== currentAssigneeId);

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {isLoading ? (
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Loader2 size={12} className="animate-spin" />
          Загрузка…
        </div>
      ) : (
        <select
          value={selectedWorkerId}
          onChange={(e) => setSelectedWorkerId(e.target.value)}
          className="px-2 py-1 text-[11px] border border-border rounded bg-card"
        >
          <option value="">-- Выберите сотрудника --</option>
          {options.map((w) => (
            <option key={w.id} value={w.id}>
              {w.lastName} {w.firstName}
            </option>
          ))}
        </select>
      )}
      <button
        type="button"
        onClick={() => selectedWorkerId && reassignMutation.mutate(selectedWorkerId)}
        disabled={!selectedWorkerId || reassignMutation.isPending}
        className="px-2 py-1 text-[11px] font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 rounded"
      >
        {reassignMutation.isPending ? 'Передача…' : 'Передать'}
      </button>
      <button
        type="button"
        onClick={() => {
          setIsOpen(false);
          setSelectedWorkerId('');
        }}
        className="px-2 py-1 text-[11px] border border-border rounded hover:bg-muted/50"
      >
        Отмена
      </button>
    </div>
  );
};
