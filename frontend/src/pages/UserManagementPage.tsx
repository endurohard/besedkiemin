import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersApi, rolesApi } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { User, Role, CreateUserDto, UpdateUserDto } from '@/types';
import { Pencil, Trash2, Plus, X, Check } from 'lucide-react';

export const UserManagementPage = () => {
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<CreateUserDto & { sipServer?: string; sipUser?: string; sipPassword?: string; sipPort?: number }>({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    roleId: '',
    sipServer: '',
    sipUser: '',
    sipPassword: '',
    sipPort: 5060,
  });

  // Получение списка ролей
  const { data: roles = [] } = useQuery({
    queryKey: ['roles'],
    queryFn: rolesApi.getAll,
  });

  // Получение списка пользователей (без супер админов)
  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: usersApi.getAll,
    select: (data) => data.filter((user) => user.role?.code !== 'SUPER_ADMIN'),
  });

  // Создание пользователя
  const createMutation = useMutation({
    mutationFn: usersApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setIsCreating(false);
      resetForm();
    },
  });

  // Обновление пользователя
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateUserDto }) =>
      usersApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setEditingUser(null);
      resetForm();
    },
  });

  // Удаление пользователя
  const deleteMutation = useMutation({
    mutationFn: usersApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });

  // Переключение активности
  const toggleActiveMutation = useMutation({
    mutationFn: usersApi.toggleActive,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });

  // Доступные роли (исключаем SUPER_ADMIN)
  const availableRoles = roles.filter((r: Role) => r.code !== 'SUPER_ADMIN');

  // Роль по умолчанию
  const defaultRoleId = availableRoles.find((r: Role) => r.code === 'MANAGER')?.id || availableRoles[0]?.id || '';

  const resetForm = () => {
    setFormData({
      email: '',
      password: '',
      firstName: '',
      lastName: '',
      roleId: defaultRoleId,
      sipServer: '',
      sipUser: '',
      sipPassword: '',
      sipPort: 5060,
    });
  };

  const handleCreate = () => {
    if (
      !formData.email ||
      !formData.password ||
      !formData.firstName ||
      !formData.lastName ||
      !formData.roleId
    ) {
      alert('Заполните все обязательные поля');
      return;
    }
    createMutation.mutate(formData);
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      email: user.email,
      password: '', // Пароль не заполняем при редактировании
      firstName: user.firstName,
      lastName: user.lastName,
      roleId: user.roleId,
      sipServer: user.sipServer || '',
      sipUser: user.sipUser || '',
      sipPassword: user.sipPassword || '',
      sipPort: user.sipPort || 5060,
    });
  };

  const handleUpdate = () => {
    if (!editingUser) return;

    const updateData: UpdateUserDto = {
      email: formData.email,
      firstName: formData.firstName,
      lastName: formData.lastName,
      roleId: formData.roleId,
      sipServer: formData.sipServer,
      sipUser: formData.sipUser,
      sipPassword: formData.sipPassword,
      sipPort: formData.sipPort,
    };

    // Добавляем пароль только если он введен
    if (formData.password) {
      updateData.password = formData.password;
    }

    updateMutation.mutate({ id: editingUser.id, data: updateData });
  };

  const handleDelete = (id: string, userName: string) => {
    if (confirm(`Вы уверены, что хотите удалить пользователя ${userName}?`)) {
      deleteMutation.mutate(id);
    }
  };

  const handleCancel = () => {
    setIsCreating(false);
    setEditingUser(null);
    resetForm();
  };

  // Проверяем, является ли выбранная роль менеджером
  const isManagerRole = () => {
    const selectedRole = roles.find((r: Role) => r.id === formData.roleId);
    return selectedRole?.code === 'MANAGER';
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="text-center">Загрузка...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Управление пользователями</h1>
        {!isCreating && !editingUser && (
          <Button
            onClick={() => {
              resetForm();
              setIsCreating(true);
            }}
            className="flex items-center gap-2"
          >
            <Plus size={16} />
            Добавить пользователя
          </Button>
        )}
      </div>

      {/* Форма создания/редактирования */}
      {(isCreating || editingUser) && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">
              {editingUser ? 'Редактирование пользователя' : 'Новый пользователь'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium mb-2">Email *</label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  placeholder="user@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Пароль {editingUser ? '(оставьте пустым для сохранения текущего)' : '*'}
                </label>
                <Input
                  type="password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  placeholder={editingUser ? 'Новый пароль' : 'Пароль'}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Имя *</label>
                <Input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) =>
                    setFormData({ ...formData, firstName: e.target.value })
                  }
                  placeholder="Иван"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Фамилия *</label>
                <Input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) =>
                    setFormData({ ...formData, lastName: e.target.value })
                  }
                  placeholder="Иванов"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2">Роль *</label>
                <select
                  className="w-full px-3 py-2 border rounded-md"
                  value={formData.roleId}
                  onChange={(e) =>
                    setFormData({ ...formData, roleId: e.target.value })
                  }
                >
                  <option value="">Выберите роль</option>
                  {availableRoles.map((role: Role) => (
                    <option key={role.id} value={role.id}>
                      {role.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* SIP настройки для менеджеров */}
            {isManagerRole() && (
              <div className="border-t pt-4 mt-4">
                <h3 className="text-lg font-semibold mb-4">Настройки SIP телефонии</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">SIP сервер</label>
                    <Input
                      type="text"
                      value={formData.sipServer || ''}
                      onChange={(e) =>
                        setFormData({ ...formData, sipServer: e.target.value })
                      }
                      placeholder="sip.example.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Порт SIP</label>
                    <Input
                      type="number"
                      value={formData.sipPort || 5060}
                      onChange={(e) =>
                        setFormData({ ...formData, sipPort: parseInt(e.target.value) || 5060 })
                      }
                      placeholder="5060"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Логин SIP</label>
                    <Input
                      type="text"
                      value={formData.sipUser || ''}
                      onChange={(e) =>
                        setFormData({ ...formData, sipUser: e.target.value })
                      }
                      placeholder="user123"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Пароль SIP</label>
                    <Input
                      type="password"
                      value={formData.sipPassword || ''}
                      onChange={(e) =>
                        setFormData({ ...formData, sipPassword: e.target.value })
                      }
                      placeholder="********"
                    />
                  </div>
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  * Настройки телефонии для автоматического подключения
                </p>
              </div>
            )}

            <div className="border-t pt-4 mt-4"></div>
            <div className="flex gap-2">
              <Button
                onClick={editingUser ? handleUpdate : handleCreate}
                disabled={createMutation.isPending || updateMutation.isPending}
                className="flex items-center gap-2"
              >
                <Check size={16} />
                {editingUser ? 'Сохранить' : 'Создать'}
              </Button>
              <Button
                onClick={handleCancel}
                variant="outline"
                className="flex items-center gap-2"
              >
                <X size={16} />
                Отмена
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Список пользователей */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Список пользователей ({users.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">ФИО</th>
                  <th className="text-left p-2">Email</th>
                  <th className="text-left p-2">Роль</th>
                  <th className="text-center p-2">Статус</th>
                  <th className="text-center p-2">Дата создания</th>
                  <th className="text-right p-2">Действия</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b hover:bg-muted/50">
                    <td className="p-2 font-medium">
                      {user.firstName} {user.lastName}
                    </td>
                    <td className="p-2 text-sm text-muted-foreground">{user.email}</td>
                    <td className="p-2">
                      <span
                        className="text-xs px-2 py-1 rounded text-white"
                        style={{ backgroundColor: user.role?.color || '#6B7280' }}
                      >
                        {user.role?.name || 'Не указана'}
                      </span>
                    </td>
                    <td className="p-2 text-center">
                      <button
                        onClick={() => toggleActiveMutation.mutate(user.id)}
                        className={`text-xs px-2 py-1 rounded font-medium ${
                          user.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {user.isActive ? 'Активен' : 'Неактивен'}
                      </button>
                    </td>
                    <td className="p-2 text-center text-sm text-muted-foreground">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="p-2">
                      <div className="flex justify-end gap-2">
                        <Button
                          onClick={() => handleEdit(user)}
                          variant="outline"
                          size="sm"
                          className="flex items-center gap-1"
                        >
                          <Pencil size={14} />
                          Изменить
                        </Button>
                        <Button
                          onClick={() =>
                            handleDelete(user.id, `${user.firstName} ${user.lastName}`)
                          }
                          variant="destructive"
                          size="sm"
                          className="flex items-center gap-1"
                        >
                          <Trash2 size={14} />
                          Удалить
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {users.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                Пользователи не найдены
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
