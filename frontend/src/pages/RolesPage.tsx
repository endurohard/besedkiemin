import { useState, useEffect } from 'react';
import { rolesApi, workflowApi } from '@/lib/api';
import type { Role, Permission, WorkflowStage } from '@/types';
import { useAuthStore } from '@/store/authStore';

export default function RolesPage() {
  const { user } = useAuthStore();
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [workflowStages, setWorkflowStages] = useState<WorkflowStage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    color: '#3B82F6',
    permissions: [] as string[],
    workflowStageIds: [] as string[],
  });

  const canManage = user?.role.code === 'SUPER_ADMIN' || user?.role.code === 'OWNER';

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [rolesData, permsData, stagesData] = await Promise.all([
        rolesApi.getAll(),
        rolesApi.getPermissions(),
        workflowApi.getActive(),
      ]);
      setRoles(rolesData);
      setPermissions(permsData);
      setWorkflowStages(stagesData);
    } catch (err) {
      setError('Ошибка загрузки данных');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingRole(null);
    setFormData({
      name: '',
      code: '',
      description: '',
      color: '#3B82F6',
      permissions: [],
      workflowStageIds: [],
    });
    setShowModal(true);
  };

  const openEditModal = (role: Role) => {
    setEditingRole(role);
    setFormData({
      name: role.name,
      code: role.code,
      description: role.description || '',
      color: role.color || '#3B82F6',
      permissions: role.permissions || [],
      workflowStageIds: role.workflowStages?.map(ws => ws.workflowStage.id) || [],
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingRole) {
        await rolesApi.update(editingRole.id, formData);
      } else {
        await rolesApi.create(formData);
      }
      setShowModal(false);
      loadData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Ошибка сохранения');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Удалить роль?')) return;
    try {
      await rolesApi.remove(id);
      loadData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Ошибка удаления');
    }
  };

  const togglePermission = (code: string) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(code)
        ? prev.permissions.filter(p => p !== code)
        : [...prev.permissions, code],
    }));
  };

  const toggleWorkflowStage = (id: string) => {
    setFormData(prev => ({
      ...prev,
      workflowStageIds: prev.workflowStageIds.includes(id)
        ? prev.workflowStageIds.filter(s => s !== id)
        : [...prev.workflowStageIds, id],
    }));
  };

  // Группируем разрешения
  const permissionGroups = permissions.reduce((acc, perm) => {
    if (!acc[perm.group]) acc[perm.group] = [];
    acc[perm.group].push(perm);
    return acc;
  }, {} as Record<string, Permission[]>);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Управление ролями</h1>
        {canManage && (
          <button
            onClick={openCreateModal}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            + Добавить роль
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
          <button onClick={() => setError('')} className="float-right">&times;</button>
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Роль</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Код</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Описание</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Пользователей</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Тип</th>
              {canManage && (
                <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase">Действия</th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {roles.map((role) => (
              <tr key={role.id} className="hover:bg-muted/50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div
                      className="w-3 h-3 rounded-full mr-3"
                      style={{ backgroundColor: role.color || '#6B7280' }}
                    />
                    <span className="font-medium">{role.name}</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                  {role.code}
                </td>
                <td className="px-6 py-4 text-sm text-muted-foreground">
                  {role.description || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                  {role._count?.users || 0}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {role.isSystem ? (
                    <span className="px-2 py-1 text-xs rounded-full bg-muted text-gray-800">
                      Системная
                    </span>
                  ) : (
                    <span className="px-2 py-1 text-xs rounded-full bg-primary/20 text-primary/90">
                      Пользовательская
                    </span>
                  )}
                </td>
                {canManage && (
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => openEditModal(role)}
                      className="text-primary hover:underline mr-3"
                    >
                      Изменить
                    </button>
                    {!role.isSystem && (
                      <button
                        onClick={() => handleDelete(role.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Удалить
                      </button>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">
              {editingRole ? 'Редактировать роль' : 'Новая роль'}
            </h2>

            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Название</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2"
                    required
                    disabled={editingRole?.isSystem}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Код</label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    className="w-full border rounded-lg px-3 py-2"
                    required
                    disabled={editingRole?.isSystem}
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Описание</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2"
                  rows={2}
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Цвет</label>
                <input
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="w-16 h-8 border rounded cursor-pointer"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Этапы производства</label>
                <div className="flex flex-wrap gap-2">
                  {workflowStages.map((stage) => (
                    <label
                      key={stage.id}
                      className={`px-3 py-1 rounded-full cursor-pointer border ${
                        formData.workflowStageIds.includes(stage.id)
                          ? 'bg-primary/20 border-blue-500 text-primary'
                          : 'bg-muted border-gray-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        className="hidden"
                        checked={formData.workflowStageIds.includes(stage.id)}
                        onChange={() => toggleWorkflowStage(stage.id)}
                      />
                      {stage.name}
                    </label>
                  ))}
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Разрешения</label>
                <div className="space-y-4 max-h-60 overflow-y-auto border rounded-lg p-3">
                  {Object.entries(permissionGroups).map(([group, perms]) => (
                    <div key={group}>
                      <h4 className="font-medium text-foreground mb-2">{group}</h4>
                      <div className="grid grid-cols-2 gap-2">
                        {perms.map((perm) => (
                          <label key={perm.code} className="flex items-center">
                            <input
                              type="checkbox"
                              checked={formData.permissions.includes(perm.code)}
                              onChange={() => togglePermission(perm.code)}
                              className="mr-2"
                            />
                            <span className="text-sm">{perm.name}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border rounded-lg hover:bg-muted/50"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {editingRole ? 'Сохранить' : 'Создать'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
