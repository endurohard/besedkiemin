import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Task, TaskStatus } from '@/types';
import { tasksApi } from '@/lib/api';
import { Loader2, UserCheck } from 'lucide-react';

interface TaskCardManagerActionsProps {
  task: Task;
}

export const TaskCardManagerActions = ({ task }: TaskCardManagerActionsProps) => {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedWorkerId, setSelectedWorkerId] = useState('');

  const canReassign =
    !task.isDefect &&
    (task.status === TaskStatus.NEW || task.status === TaskStatus.ACCEPTED);

  const { data: workers, isLoading: isLoadingWorkers } = useQuery({
    queryKey: ['reassignable-workers', task.id],
    queryFn: () => tasksApi.getReassignableWorkers(task.id),
    enabled: isOpen && canReassign,
  });

  const reassignMutation = useMutation({
    mutationFn: async (workerId: string) => tasksApi.reassignTask(task.id, workerId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['department-tasks'] });
      setIsOpen(false);
      setSelectedWorkerId('');
    },
    onError: (error: any) => {
      alert(`Ошибка переназначения: ${error?.response?.data?.message || error?.message || 'Неизвестная ошибка'}`);
    },
  });

  if (!canReassign) return null;

  const assigneeLabel = task.assignedTo
    ? `${task.assignedTo.lastName ?? ''} ${task.assignedTo.firstName ?? ''}`.trim() || '—'
    : '—';

  return (
    <div className="mt-1.5 border-t border-dashed border-border pt-1.5">
      {!isOpen ? (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="w-full flex items-center justify-center gap-1 px-2 py-1 text-[10px] font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded"
        >
          <UserCheck size={12} />
          <span>
            {task.status === TaskStatus.ACCEPTED
              ? `Передать от: ${assigneeLabel}`
              : 'Назначить исполнителя'}
          </span>
        </button>
      ) : (
        <div className="space-y-1.5">
          {isLoadingWorkers ? (
            <div className="flex justify-center py-1">
              <Loader2 size={14} className="animate-spin text-primary" />
            </div>
          ) : (
            <select
              value={selectedWorkerId}
              onChange={(e) => setSelectedWorkerId(e.target.value)}
              className="w-full px-2 py-1 text-[11px] border border-border rounded bg-card"
            >
              <option value="">-- Выберите сотрудника --</option>
              {workers?.filter((w) => w.id !== task.assignedToId).map((w) => (
                <option key={w.id} value={w.id}>
                  {w.lastName} {w.firstName}
                </option>
              ))}
            </select>
          )}
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => selectedWorkerId && reassignMutation.mutate(selectedWorkerId)}
              disabled={!selectedWorkerId || reassignMutation.isPending}
              className="flex-1 px-2 py-1 text-[10px] font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 rounded"
            >
              {reassignMutation.isPending ? 'Передача…' : 'Передать'}
            </button>
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                setSelectedWorkerId('');
              }}
              className="px-2 py-1 text-[10px] border border-border rounded hover:bg-muted/50"
            >
              Отмена
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
