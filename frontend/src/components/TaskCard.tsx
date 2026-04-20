import { Task, TaskStatus } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { useAuthStore } from '@/store/authStore';
import { TaskTimer } from './TaskTimer';
import { taskStatusLabels, getTaskStatusColor } from '@/lib/labels';
import { TaskCardInfo } from './task-card/TaskCardInfo';
import { TaskCardManagerActions } from './task-card/TaskCardManagerActions';
import { TaskCardWarehouseActions } from './task-card/TaskCardWarehouseActions';
import { TaskCardWorkerActions } from './task-card/TaskCardWorkerActions';

interface TaskCardProps {
  task: Task;
}

export const TaskCard = ({ task }: TaskCardProps) => {
  const { user } = useAuthStore();

  const isWarehouse = user?.role?.code === 'WAREHOUSE';
  const isPreparer = user?.role?.code === 'PREPARER';
  const isPainter = user?.role?.code === 'PAINTER';
  const isAssembler = user?.role?.code === 'ASSEMBLER';
  const isSewer = user?.role?.code === 'SEWER';
  const isSimplifiedRole = isPreparer || isPainter || isAssembler || isSewer;
  const needsWorkerSelection = isPreparer || isPainter || isAssembler || isSewer;
  const canReassignTask =
    user?.role?.code === 'OWNER' ||
    user?.role?.code === 'SUPER_ADMIN' ||
    user?.role?.code === 'MANAGER';

  return (
    <Card className="mb-1.5">
      <CardHeader className="p-2 pb-1">
        <div className="flex items-start justify-between gap-1">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-xs font-semibold truncate">{task.title}</CardTitle>
          </div>
          <span
            className={`px-1.5 py-0.5 rounded text-[10px] font-medium border flex-shrink-0 ${getTaskStatusColor(task.status)}`}
          >
            {taskStatusLabels[task.status] || task.status}
          </span>
        </div>
      </CardHeader>
      <CardContent className="p-2 pt-0">
        <TaskTimer
          createdAt={task.createdAt}
          acceptedAt={task.acceptedAt}
          productionTimeHours={task.product?.productType?.productionTimeHours}
          priority={task.product?.order?.priority || task.priority}
        />

        {task.title?.includes('БРАК') && task.assignedTo && (
          <div className="mb-2 p-2 bg-red-100 border-2 border-red-400 rounded text-[11px]">
            <div className="flex items-center gap-1 text-red-800 font-bold">
              <span>🚨 БРАК - Исполнитель:</span>
              <span className="text-red-900">{task.assignedTo.firstName} {task.assignedTo.lastName}</span>
            </div>
          </div>
        )}

        <TaskCardInfo task={task} isPainter={isPainter} isSewer={isSewer} />

        {task.notes && (
          <div className="mb-2 p-1.5 bg-yellow-50 border border-yellow-200 rounded text-[10px]">
            <p className="font-medium text-yellow-900">Примечание:</p>
            <p className="text-yellow-800 truncate">{task.notes}</p>
          </div>
        )}

        <div className="space-y-2">
          {isWarehouse && (
            <TaskCardWarehouseActions task={task} />
          )}

          {!isWarehouse && (
            <TaskCardWorkerActions
              task={task}
              currentUserId={user?.id}
              isSimplifiedRole={isSimplifiedRole}
              needsWorkerSelection={needsWorkerSelection}
            />
          )}

          {canReassignTask && <TaskCardManagerActions task={task} />}

          {task.status === TaskStatus.PASSED && (
            <div className="text-center p-1.5 bg-purple-50 border border-purple-200 rounded text-[10px] text-purple-800 font-medium">
              Передано
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
