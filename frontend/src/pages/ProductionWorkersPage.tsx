import { useState, useEffect } from 'react';
import { usersApi, rolesApi, payrollApi, productTypesApi } from '@/lib/api';
import type { User, Role, WorkRate, ProductType } from '@/types';
import { ProductionStage } from '@/types';
import { useAuthStore } from '@/store/authStore';
import { Plus, Trash2, Edit2, DollarSign, Users, Save } from 'lucide-react';

// Производственные роли
const PRODUCTION_ROLES = ['PREPARER', 'PAINTER', 'ASSEMBLER', 'SEWER', 'WAREHOUSE'];

const roleNames: Record<string, string> = {
  PREPARER: 'Заготовка',
  PAINTER: 'Малярка',
  ASSEMBLER: 'Сборка',
  SEWER: 'Пошив',
  WAREHOUSE: 'Склад',
};

const roleColors: Record<string, string> = {
  PREPARER: 'bg-orange-500',
  PAINTER: 'bg-green-500',
  ASSEMBLER: 'bg-blue-500',
  SEWER: 'bg-purple-500',
  WAREHOUSE: 'bg-teal-500',
};

const stageByRole: Record<string, ProductionStage> = {
  PREPARER: ProductionStage.PREPARATION,
  PAINTER: ProductionStage.PAINTING,
  ASSEMBLER: ProductionStage.ASSEMBLY,
  SEWER: ProductionStage.ASSEMBLY, // или отдельный этап
  WAREHOUSE: ProductionStage.QUALITY_CHECK,
};

export default function ProductionWorkersPage() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Data
  const [workers, setWorkers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [workRates, setWorkRates] = useState<WorkRate[]>([]);
  const [productTypes, setProductTypes] = useState<ProductType[]>([]);

  // UI state
  const [activeRole, setActiveRole] = useState<string>('PREPARER');
  const [showAddWorkerModal, setShowAddWorkerModal] = useState(false);
  const [showWorkRateModal, setShowWorkRateModal] = useState(false);
  const [editingWorker, setEditingWorker] = useState<User | null>(null);

  // Form state
  const [workerForm, setWorkerForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '123456',
    roleId: '',
  });

  const [workRateForm, setWorkRateForm] = useState({
    productTypeId: '',
    pricePerUnit: 0,
    description: '',
  });

  const canManage = user?.role?.code === 'SUPER_ADMIN' || user?.role?.code === 'OWNER';

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [usersData, rolesData, ratesData, typesData] = await Promise.all([
        usersApi.getAll(),
        rolesApi.getAll(),
        payrollApi.getWorkRates(),
        productTypesApi.getAll(),
      ]);
      setWorkers(usersData);
      setRoles(rolesData);
      setWorkRates(ratesData);
      setProductTypes(typesData);
    } catch (err) {
      setError('Ошибка загрузки данных');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Фильтрация работников по роли
  const getWorkersByRole = (roleCode: string) => {
    return workers.filter(w => w.role?.code === roleCode && w.isActive);
  };

  // Получение расценок для роли
  const getWorkRatesForRole = (roleCode: string) => {
    const stage = stageByRole[roleCode];
    return workRates.filter(wr => wr.stage === stage && wr.isActive);
  };

  // Получение роли по коду
  const getRoleByCode = (code: string) => {
    return roles.find(r => r.code === code);
  };

  // Добавление работника
  const handleAddWorker = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const role = getRoleByCode(activeRole);
      if (!role) {
        setError('Роль не найдена');
        return;
      }

      await usersApi.create({
        ...workerForm,
        roleId: role.id,
      });

      setShowAddWorkerModal(false);
      setWorkerForm({ firstName: '', lastName: '', email: '', password: '123456', roleId: '' });
      setSuccess('Сотрудник добавлен');
      loadData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Ошибка добавления сотрудника');
    }
  };

  // Обновление работника
  const handleUpdateWorker = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingWorker) return;

    try {
      await usersApi.update(editingWorker.id, {
        firstName: workerForm.firstName,
        lastName: workerForm.lastName,
        email: workerForm.email,
      });

      setEditingWorker(null);
      setWorkerForm({ firstName: '', lastName: '', email: '', password: '123456', roleId: '' });
      setSuccess('Сотрудник обновлен');
      loadData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Ошибка обновления');
    }
  };

  // Удаление (деактивация) работника
  const handleDeleteWorker = async (workerId: string) => {
    if (!confirm('Удалить сотрудника?')) return;

    try {
      await usersApi.update(workerId, { isActive: false });
      setSuccess('Сотрудник удален');
      loadData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Ошибка удаления');
    }
  };

  // Сброс пароля
  const handleResetPassword = async (workerId: string) => {
    if (!confirm('Сбросить пароль на 123456?')) return;

    try {
      await usersApi.update(workerId, { password: '123456' });
      setSuccess('Пароль сброшен на 123456');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Ошибка сброса пароля');
    }
  };

  // Добавление расценки
  const handleAddWorkRate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const stage = stageByRole[activeRole];
      await payrollApi.createWorkRate({
        productTypeId: workRateForm.productTypeId,
        stage,
        pricePerUnit: workRateForm.pricePerUnit,
        description: workRateForm.description,
        isActive: true,
      });

      setShowWorkRateModal(false);
      setWorkRateForm({ productTypeId: '', pricePerUnit: 0, description: '' });
      setSuccess('Расценка добавлена');
      loadData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Ошибка добавления расценки');
    }
  };

  // Удаление расценки
  const handleDeleteWorkRate = async (rateId: string) => {
    if (!confirm('Удалить расценку?')) return;

    try {
      await payrollApi.deleteWorkRate(rateId);
      setSuccess('Расценка удалена');
      loadData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Ошибка удаления');
    }
  };

  const openEditWorker = (worker: User) => {
    setEditingWorker(worker);
    setWorkerForm({
      firstName: worker.firstName,
      lastName: worker.lastName,
      email: worker.email,
      password: '',
      roleId: worker.roleId || '',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB' }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const currentWorkers = getWorkersByRole(activeRole);
  const currentRates = getWorkRatesForRole(activeRole);

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Сотрудники производства</h1>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
          <button onClick={() => setError('')} className="float-right font-bold">&times;</button>
        </div>
      )}

      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {success}
        </div>
      )}

      {/* Tabs для отделов */}
      <div className="flex flex-wrap gap-2 mb-6">
        {PRODUCTION_ROLES.map((roleCode) => {
          const count = getWorkersByRole(roleCode).length;
          return (
            <button
              key={roleCode}
              onClick={() => setActiveRole(roleCode)}
              className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                activeRole === roleCode
                  ? `${roleColors[roleCode]} text-white`
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${activeRole === roleCode ? 'bg-white' : roleColors[roleCode]}`}></span>
              {roleNames[roleCode]}
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                activeRole === roleCode ? 'bg-white/20' : 'bg-gray-200'
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Список сотрудников */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b flex justify-between items-center">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Users size={20} />
              {roleNames[activeRole]} ({currentWorkers.length})
            </h2>
            {canManage && (
              <button
                onClick={() => setShowAddWorkerModal(true)}
                className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-blue-700 flex items-center gap-1"
              >
                <Plus size={16} />
                Добавить
              </button>
            )}
          </div>

          <div className="divide-y">
            {currentWorkers.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                Нет сотрудников в этом отделе
              </div>
            ) : (
              currentWorkers.map((worker) => (
                <div key={worker.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                  <div>
                    <div className="font-medium">{worker.lastName} {worker.firstName}</div>
                    <div className="text-sm text-gray-500">{worker.email}</div>
                  </div>
                  {canManage && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => openEditWorker(worker)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                        title="Редактировать"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleResetPassword(worker.id)}
                        className="p-2 text-amber-600 hover:bg-amber-50 rounded text-xs"
                        title="Сбросить пароль"
                      >
                        123456
                      </button>
                      <button
                        onClick={() => handleDeleteWorker(worker.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded"
                        title="Удалить"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Расценки */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b flex justify-between items-center">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <DollarSign size={20} />
              Расценки за изделие
            </h2>
            {canManage && (
              <button
                onClick={() => setShowWorkRateModal(true)}
                className="bg-green-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-green-700 flex items-center gap-1"
              >
                <Plus size={16} />
                Добавить
              </button>
            )}
          </div>

          <div className="divide-y">
            {currentRates.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                Расценки не настроены
              </div>
            ) : (
              currentRates.map((rate) => (
                <div key={rate.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                  <div>
                    <div className="font-medium">{rate.productType?.name || 'Все типы'}</div>
                    {rate.description && (
                      <div className="text-sm text-gray-500">{rate.description}</div>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold text-green-600">
                      {formatCurrency(rate.pricePerUnit)}
                    </span>
                    {canManage && (
                      <button
                        onClick={() => handleDeleteWorkRate(rate.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded"
                        title="Удалить"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Подсказка */}
          <div className="p-4 bg-blue-50 border-t text-sm text-blue-800">
            <strong>Как работает:</strong> За каждое изделие, обработанное сотрудником отдела "{roleNames[activeRole]}",
            ему начисляется указанная сумма. Итог виден в разделе "Зарплата".
          </div>
        </div>
      </div>

      {/* Модальное окно добавления сотрудника */}
      {showAddWorkerModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">
              Новый сотрудник - {roleNames[activeRole]}
            </h2>
            <form onSubmit={handleAddWorker}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Фамилия</label>
                  <input
                    type="text"
                    value={workerForm.lastName}
                    onChange={(e) => setWorkerForm({ ...workerForm, lastName: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Имя</label>
                  <input
                    type="text"
                    value={workerForm.firstName}
                    onChange={(e) => setWorkerForm({ ...workerForm, firstName: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email (логин)</label>
                  <input
                    type="email"
                    value={workerForm.email}
                    onChange={(e) => setWorkerForm({ ...workerForm, email: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2"
                    placeholder="ivanov@example.com"
                    required
                  />
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-600">
                    Пароль по умолчанию: <strong>123456</strong>
                  </p>
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAddWorkerModal(false)}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Добавить
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Модальное окно редактирования сотрудника */}
      {editingWorker && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Редактирование сотрудника</h2>
            <form onSubmit={handleUpdateWorker}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Фамилия</label>
                  <input
                    type="text"
                    value={workerForm.lastName}
                    onChange={(e) => setWorkerForm({ ...workerForm, lastName: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Имя</label>
                  <input
                    type="text"
                    value={workerForm.firstName}
                    onChange={(e) => setWorkerForm({ ...workerForm, firstName: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email (логин)</label>
                  <input
                    type="email"
                    value={workerForm.email}
                    onChange={(e) => setWorkerForm({ ...workerForm, email: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2"
                    required
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setEditingWorker(null)}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                >
                  <Save size={16} />
                  Сохранить
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Модальное окно добавления расценки */}
      {showWorkRateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">
              Новая расценка - {roleNames[activeRole]}
            </h2>
            <form onSubmit={handleAddWorkRate}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Тип продукта</label>
                  <select
                    value={workRateForm.productTypeId}
                    onChange={(e) => setWorkRateForm({ ...workRateForm, productTypeId: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2"
                    required
                  >
                    <option value="">Выберите тип</option>
                    {productTypes.map((pt) => (
                      <option key={pt.id} value={pt.id}>{pt.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Цена за изделие (руб.)</label>
                  <input
                    type="number"
                    value={workRateForm.pricePerUnit}
                    onChange={(e) => setWorkRateForm({ ...workRateForm, pricePerUnit: Number(e.target.value) })}
                    className="w-full border rounded-lg px-3 py-2"
                    min="0"
                    step="1"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Описание (необязательно)</label>
                  <input
                    type="text"
                    value={workRateForm.description}
                    onChange={(e) => setWorkRateForm({ ...workRateForm, description: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2"
                    placeholder="Например: стандартная ставка"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowWorkRateModal(false)}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Добавить
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
