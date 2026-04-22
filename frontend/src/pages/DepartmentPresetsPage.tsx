import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { departmentPresetsApi, usersApi, DepartmentPreset, DepartmentPresetPayload } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Plus, Edit2, Trash2, Eye, EyeOff, X } from 'lucide-react';
import { User } from '@/types';

const COLOR_OPTIONS = [
  { value: 'orange', label: 'Оранжевый' },
  { value: 'green', label: 'Зелёный' },
  { value: 'blue', label: 'Синий' },
  { value: 'teal', label: 'Бирюзовый' },
  { value: 'red', label: 'Красный' },
  { value: 'purple', label: 'Фиолетовый' },
  { value: 'amber', label: 'Янтарный' },
  { value: 'gray', label: 'Серый' },
];

const previewClasses: Record<string, string> = {
  orange: 'bg-orange-50 text-orange-700 border-orange-200',
  green: 'bg-green-50 text-green-700 border-green-200',
  blue: 'bg-primary/10 text-primary border-blue-200',
  teal: 'bg-teal-50 text-teal-700 border-teal-200',
  red: 'bg-red-50 text-red-700 border-red-200',
  purple: 'bg-purple-50 text-purple-700 border-purple-200',
  amber: 'bg-amber-50 text-amber-700 border-amber-200',
  gray: 'bg-gray-50 text-gray-700 border-gray-200',
};

type FormState = DepartmentPresetPayload;

const emptyForm: FormState = {
  code: '',
  label: '',
  userId: '',
  color: 'blue',
  sortOrder: 0,
  isActive: true,
  newPassword: '',
};

export const DepartmentPresetsPage = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<DepartmentPreset | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);

  const { data: presets = [], isLoading } = useQuery({
    queryKey: ['department-presets'],
    queryFn: () => departmentPresetsApi.getAll(),
  });

  const { data: users = [] } = useQuery({
    queryKey: ['users-for-presets'],
    queryFn: () => usersApi.getAll(),
  });

  const sortedUsers = useMemo(
    () =>
      [...users]
        .filter((u: User) => u.isActive)
        .sort((a, b) => `${a.lastName} ${a.firstName}`.localeCompare(`${b.lastName} ${b.firstName}`)),
    [users],
  );

  const createMutation = useMutation({
    mutationFn: (payload: DepartmentPresetPayload) => departmentPresetsApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['department-presets'] });
      queryClient.invalidateQueries({ queryKey: ['department-presets-public'] });
      closeModal();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<DepartmentPresetPayload> }) =>
      departmentPresetsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['department-presets'] });
      queryClient.invalidateQueries({ queryKey: ['department-presets-public'] });
      closeModal();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => departmentPresetsApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['department-presets'] });
      queryClient.invalidateQueries({ queryKey: ['department-presets-public'] });
    },
  });

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setShowPassword(false);
    setIsModalOpen(true);
  };

  const openEdit = (preset: DepartmentPreset) => {
    setEditing(preset);
    setForm({
      code: preset.code,
      label: preset.label,
      userId: preset.userId,
      color: preset.color,
      sortOrder: preset.sortOrder,
      isActive: preset.isActive,
      newPassword: '',
    });
    setShowPassword(false);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditing(null);
    setForm(emptyForm);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: DepartmentPresetPayload = {
      ...form,
      code: form.code.trim().toUpperCase(),
      label: form.label.trim(),
      sortOrder: Number(form.sortOrder) || 0,
      newPassword: form.newPassword ? form.newPassword : undefined,
    };
    if (editing) {
      updateMutation.mutate({ id: editing.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleDelete = (preset: DepartmentPreset) => {
    if (confirm(`Удалить пресет "${preset.label}"?`)) {
      deleteMutation.mutate(preset.id);
    }
  };

  const mutationError = (createMutation.error || updateMutation.error) as
    | { response?: { data?: { message?: string } } }
    | undefined;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Быстрый вход — кнопки отделов</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Настройте кнопки на странице входа: какой пользователь логинится по клику
            и под каким паролем.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus size={16} className="mr-2" />
          Добавить кнопку
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Список пресетов</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Загрузка...</p>
          ) : presets.length === 0 ? (
            <p className="text-sm text-muted-foreground">Пока нет пресетов.</p>
          ) : (
            <div className="space-y-2">
              {presets.map((preset) => (
                <div
                  key={preset.id}
                  className="flex items-center justify-between p-3 border border-border rounded-md"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`px-4 py-2 rounded-md border font-medium ${previewClasses[preset.color] ?? previewClasses.blue}`}
                    >
                      {preset.label}
                    </div>
                    <div className="text-sm">
                      <div className="font-medium">
                        {preset.user.lastName} {preset.user.firstName}
                      </div>
                      <div className="text-muted-foreground text-xs">
                        {preset.user.email}
                        {preset.user.role?.name ? ` · ${preset.user.role.name}` : ''}
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      код: <code className="bg-muted px-1 rounded">{preset.code}</code>
                      {' · '}порядок: {preset.sortOrder}
                      {!preset.isActive && (
                        <span className="ml-2 text-red-600">выключено</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => openEdit(preset)}
                      className="p-2 hover:bg-muted rounded-md"
                      aria-label="Редактировать"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(preset)}
                      className="p-2 hover:bg-muted rounded-md text-red-600"
                      aria-label="Удалить"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-card rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-bold">
                {editing ? 'Изменить пресет' : 'Новый пресет'}
              </h2>
              <button onClick={closeModal} aria-label="Закрыть" className="text-muted-foreground hover:text-foreground">
                <X size={22} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Подпись кнопки</label>
                <Input
                  value={form.label}
                  onChange={(e) => setForm({ ...form, label: e.target.value })}
                  placeholder="Заготовка"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Код</label>
                <Input
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                  placeholder="PREPARATION"
                  required
                  pattern="[A-Z0-9_]+"
                  title="Только заглавные латинские буквы, цифры и _"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Используется для внутренней ссылки на кнопку. Уникальный.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Пользователь (логин)</label>
                <select
                  value={form.userId}
                  onChange={(e) => setForm({ ...form, userId: e.target.value })}
                  required
                  className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                >
                  <option value="">— выберите пользователя —</option>
                  {sortedUsers.map((u: User) => (
                    <option key={u.id} value={u.id}>
                      {u.lastName} {u.firstName} — {u.email}
                      {u.role?.name ? ` (${u.role.name})` : ''}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground mt-1">
                  При клике по кнопке произойдёт вход под этим пользователем.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Новый пароль</label>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={form.newPassword ?? ''}
                    onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
                    placeholder={editing ? 'Оставьте пустым, чтобы не менять' : 'Минимум 4 символа'}
                    minLength={form.newPassword ? 4 : undefined}
                    autoComplete="new-password"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? 'Скрыть пароль' : 'Показать пароль'}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Если заполнено — пароль выбранного пользователя будет перезаписан.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Цвет кнопки</label>
                  <select
                    value={form.color}
                    onChange={(e) => setForm({ ...form, color: e.target.value })}
                    className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                  >
                    {COLOR_OPTIONS.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Порядок</label>
                  <Input
                    type="number"
                    value={form.sortOrder ?? 0}
                    onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  id="is-active"
                  type="checkbox"
                  checked={form.isActive ?? true}
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                />
                <label htmlFor="is-active" className="text-sm">
                  Показывать кнопку на странице входа
                </label>
              </div>

              {mutationError && (
                <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                  {mutationError.response?.data?.message || 'Не удалось сохранить'}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t">
                <Button type="button" variant="outline" onClick={closeModal}>
                  Отмена
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {createMutation.isPending || updateMutation.isPending ? 'Сохранение...' : 'Сохранить'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DepartmentPresetsPage;
