import { useState, useEffect } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { workflowApi } from '@/lib/api';
import { WorkflowStage, UserRole, CreateWorkflowStageDto, UpdateWorkflowStageDto } from '@/types';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';

interface SortableStageItemProps {
  stage: WorkflowStage;
  onEdit: (stage: WorkflowStage) => void;
  onToggle: (stage: WorkflowStage) => void;
  onDelete: (stage: WorkflowStage) => void;
}

function SortableStageItem({ stage, onEdit, onToggle, onDelete }: SortableStageItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: stage.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const roleLabels: Record<UserRole, string> = {
    SUPER_ADMIN: 'Супер-админ',
    OWNER: 'Владелец',
    MANAGER: 'Менеджер',
    DESIGNER: 'Проектировщик',
    PREPARER: 'Заготовка',
    PAINTER: 'Маляр',
    WAREHOUSE: 'Склад',
  };

  return (
    <div ref={setNodeRef} style={style} className="mb-3">
      <Card className={`p-4 ${!stage.isActive ? 'opacity-50' : ''}`}>
        <div className="flex items-center gap-4">
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing"
          >
            <svg
              className="w-6 h-6 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 8h16M4 16h16"
              />
            </svg>
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-lg font-semibold">{stage.order}. {stage.name}</span>
              <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                {roleLabels[stage.role]}
              </span>
              {!stage.isActive && (
                <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">
                  Неактивен
                </span>
              )}
            </div>
            {stage.description && (
              <p className="text-sm text-gray-600 mt-1">{stage.description}</p>
            )}
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => onToggle(stage)}
            >
              {stage.isActive ? 'Деактивировать' : 'Активировать'}
            </Button>
            <Button
              variant="outline"
              onClick={() => onEdit(stage)}
            >
              Изменить
            </Button>
            <Button
              variant="destructive"
              onClick={() => onDelete(stage)}
            >
              Удалить
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

interface StageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CreateWorkflowStageDto | UpdateWorkflowStageDto) => void;
  stage?: WorkflowStage;
  nextOrder: number;
}

function StageModal({ isOpen, onClose, onSave, stage, nextOrder }: StageModalProps) {
  const [formData, setFormData] = useState<CreateWorkflowStageDto>({
    name: '',
    description: '',
    order: nextOrder,
    role: UserRole.PREPARER,
    isActive: true,
  });

  useEffect(() => {
    if (stage) {
      setFormData({
        name: stage.name,
        description: stage.description || '',
        order: stage.order,
        role: stage.role,
        isActive: stage.isActive,
      });
    } else {
      setFormData({
        name: '',
        description: '',
        order: nextOrder,
        role: UserRole.PREPARER,
        isActive: true,
      });
    }
  }, [stage, nextOrder]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  if (!isOpen) return null;

  const roleOptions = [
    { value: UserRole.OWNER, label: 'Владелец' },
    { value: UserRole.MANAGER, label: 'Менеджер' },
    { value: UserRole.DESIGNER, label: 'Проектировщик' },
    { value: UserRole.PREPARER, label: 'Заготовка' },
    { value: UserRole.PAINTER, label: 'Маляр' },
    { value: UserRole.WAREHOUSE, label: 'Склад' },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md p-6">
        <h2 className="text-2xl font-bold mb-4">
          {stage ? 'Редактировать этап' : 'Создать этап'}
        </h2>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Название</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Описание</label>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Роль исполнителя</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                required
              >
                {roleOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                />
                <span className="text-sm font-medium">Активен</span>
              </label>
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <Button type="submit" className="flex-1">
              {stage ? 'Сохранить' : 'Создать'}
            </Button>
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Отмена
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

export default function WorkflowSettingsPage() {
  const [stages, setStages] = useState<WorkflowStage[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStage, setEditingStage] = useState<WorkflowStage | undefined>();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const loadStages = async () => {
    try {
      setLoading(true);
      const data = await workflowApi.getAll();
      setStages(data);
    } catch (error) {
      console.error('Ошибка загрузки этапов:', error);
      alert('Не удалось загрузить этапы');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStages();
  }, []);

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = stages.findIndex((s) => s.id === active.id);
      const newIndex = stages.findIndex((s) => s.id === over.id);

      const newStages = arrayMove(stages, oldIndex, newIndex);
      setStages(newStages);

      try {
        await workflowApi.reorder({
          stageIds: newStages.map((s) => s.id),
        });
      } catch (error) {
        console.error('Ошибка изменения порядка:', error);
        alert('Не удалось изменить порядок этапов');
        loadStages(); // Reload on error
      }
    }
  };

  const handleCreate = () => {
    setEditingStage(undefined);
    setIsModalOpen(true);
  };

  const handleEdit = (stage: WorkflowStage) => {
    setEditingStage(stage);
    setIsModalOpen(true);
  };

  const handleSave = async (data: CreateWorkflowStageDto | UpdateWorkflowStageDto) => {
    try {
      if (editingStage) {
        await workflowApi.update(editingStage.id, data);
      } else {
        await workflowApi.create(data as CreateWorkflowStageDto);
      }
      setIsModalOpen(false);
      loadStages();
    } catch (error) {
      console.error('Ошибка сохранения:', error);
      alert('Не удалось сохранить этап');
    }
  };

  const handleToggle = async (stage: WorkflowStage) => {
    try {
      await workflowApi.update(stage.id, { isActive: !stage.isActive });
      loadStages();
    } catch (error) {
      console.error('Ошибка изменения статуса:', error);
      alert('Не удалось изменить статус этапа');
    }
  };

  const handleDelete = async (stage: WorkflowStage) => {
    if (!confirm(`Вы уверены, что хотите удалить этап "${stage.name}"?`)) {
      return;
    }

    try {
      await workflowApi.remove(stage.id);
      loadStages();
    } catch (error) {
      console.error('Ошибка удаления:', error);
      alert('Не удалось удалить этап. Возможно, он используется в задачах.');
    }
  };

  const handleInitialize = async () => {
    if (!confirm('Вы уверены, что хотите создать стандартный производственный цикл?')) {
      return;
    }

    try {
      await workflowApi.initialize();
      loadStages();
    } catch (error) {
      console.error('Ошибка инициализации:', error);
      alert('Не удалось инициализировать workflow');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-xl">Загрузка...</div>
      </div>
    );
  }

  const nextOrder = stages.length > 0 ? Math.max(...stages.map((s) => s.order)) + 1 : 1;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Настройка производственного цикла</h1>
        <div className="flex gap-3">
          {stages.length === 0 && (
            <Button onClick={handleInitialize} variant="outline">
              Инициализировать стандартный workflow
            </Button>
          )}
          <Button onClick={handleCreate}>
            Создать этап
          </Button>
        </div>
      </div>

      {stages.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-gray-600 mb-4">
            Производственный цикл пока не настроен
          </p>
          <Button onClick={handleInitialize}>
            Создать стандартный workflow
          </Button>
        </Card>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={stages.map((s) => s.id)}
            strategy={verticalListSortingStrategy}
          >
            {stages.map((stage) => (
              <SortableStageItem
                key={stage.id}
                stage={stage}
                onEdit={handleEdit}
                onToggle={handleToggle}
                onDelete={handleDelete}
              />
            ))}
          </SortableContext>
        </DndContext>
      )}

      <StageModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        stage={editingStage}
        nextOrder={nextOrder}
      />
    </div>
  );
}
