import { useState, useEffect, useMemo } from 'react';
import { usersApi, rolesApi, payrollApi, productTypesApi, nomenclatureApi, authApi } from '@/lib/api';
import type { User, Role, WorkRate, ProductType, PaymentType } from '@/types';
import { ProductionStage } from '@/types';
import { useAuthStore } from '@/store/authStore';
import { Plus, Trash2, Edit2, DollarSign, Users, Save, TrendingUp, BarChart3, AlertTriangle, Key } from 'lucide-react';

const PRODUCTION_ROLES = ['PREPARER', 'PAINTER', 'ASSEMBLER', 'SEWER'];

const roleNames: Record<string, string> = {
  PREPARER: 'Заготовка',
  PAINTER: 'Малярка',
  ASSEMBLER: 'Сборка',
  SEWER: 'Пошив',
};

const roleColors: Record<string, string> = {
  PREPARER: 'bg-orange-500',
  PAINTER: 'bg-green-500',
  ASSEMBLER: 'bg-blue-500',
  SEWER: 'bg-purple-500',
};

const stageByRole: Record<string, ProductionStage> = {
  PREPARER: ProductionStage.PREPARATION,
  PAINTER: ProductionStage.PAINTING,
  ASSEMBLER: ProductionStage.ASSEMBLY,
  SEWER: ProductionStage.SEWING,
};

interface WorkerStat {
  userId: string;
  firstName: string;
  lastName: string;
  roleCode: string;
  paymentType: PaymentType;
  monthlySalary: number | null;
  itemsCompleted: number;
  workAmount: number;
  penaltyAmount: number;
  penaltyCount: number;
  netAmount: number;
  efficiencyCoefficient: number | null;
  workLogsCount: number;
}

function getMonthRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  return { start: start.toISOString(), end: end.toISOString() };
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(amount);
}

function EfficiencyBadge({ coeff }: { coeff: number | null }) {
  if (coeff === null) return null;
  let color = 'bg-red-100 text-red-700';
  if (coeff >= 1.2) color = 'bg-green-100 text-green-700';
  else if (coeff >= 0.8) color = 'bg-yellow-100 text-yellow-700';
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${color}`} title="Коэффициент: стоимость работ / оклад">
      x{coeff.toFixed(2)}
    </span>
  );
}

function PaymentTypeBadge({ type, salary }: { type: PaymentType; salary?: number | null }) {
  if (type === 'SALARY') {
    return (
      <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium">
        Оклад {salary ? formatCurrency(salary) : ''}
      </span>
    );
  }
  return (
    <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-medium">
      Сдельная
    </span>
  );
}

export default function ProductionWorkersPage() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [workers, setWorkers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [workRates, setWorkRates] = useState<WorkRate[]>([]);
  const [productTypes, setProductTypes] = useState<ProductType[]>([]);
  const [nomenclatures, setNomenclatures] = useState<Array<{ id: string; name: string; sku?: string; color?: string }>>([]);
  const [workerStats, setWorkerStats] = useState<WorkerStat[]>([]);

  const [activeRole, setActiveRole] = useState<string>('PREPARER');
  const [showAddWorkerModal, setShowAddWorkerModal] = useState(false);
  const [showWorkRateModal, setShowWorkRateModal] = useState(false);
  const [editingWorker, setEditingWorker] = useState<User | null>(null);
  const [pinModal, setPinModal] = useState<{ userId: string; name: string } | null>(null);
  const [pinValue, setPinValue] = useState('');

  const [workerForm, setWorkerForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '123456',
    roleId: '',
    paymentType: 'PIECE_RATE' as PaymentType,
    monthlySalary: 0,
    pin: '',
  });

  const [workRateForm, setWorkRateForm] = useState({
    productTypeId: '',
    nomenclatureId: '',
    pricePerUnit: 0,
    description: '',
  });

  const canManage = user?.role?.code === 'SUPER_ADMIN' || user?.role?.code === 'OWNER';

  useEffect(() => { loadData(); }, []);

  useEffect(() => {
    if (workRateForm.productTypeId) {
      nomenclatureApi.getByProductType(workRateForm.productTypeId)
        .then(data => setNomenclatures(data))
        .catch(err => console.error('Error loading nomenclatures:', err));
    } else {
      setNomenclatures([]);
    }
  }, [workRateForm.productTypeId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const { start, end } = getMonthRange();
      const [usersData, rolesData, ratesData, typesData, statsData] = await Promise.all([
        usersApi.getAll(),
        rolesApi.getAll(),
        payrollApi.getWorkRates(),
        productTypesApi.getAll(),
        payrollApi.getWorkerStats(start, end).catch(() => []),
      ]);
      setWorkers(usersData);
      setRoles(rolesData);
      setWorkRates(ratesData);
      setProductTypes(typesData);
      setWorkerStats(statsData);
    } catch (err) {
      setError('Ошибка загрузки данных');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getWorkersByRole = (roleCode: string) => workers.filter(w => w.role?.code === roleCode && w.isActive);
  const getWorkRatesForRole = (roleCode: string) => workRates.filter(wr => wr.stage === stageByRole[roleCode] && wr.isActive);
  const getRoleByCode = (code: string) => roles.find(r => r.code === code);
  const getStatForWorker = (userId: string) => workerStats.find(s => s.userId === userId);

  // Сводка по отделу
  const roleSummary = useMemo(() => {
    const roleWorkers = getWorkersByRole(activeRole);
    const roleStats = roleWorkers.map(w => getStatForWorker(w.id)).filter(Boolean) as WorkerStat[];
    const totalItems = roleStats.reduce((s, st) => s + st.itemsCompleted, 0);
    const totalWork = roleStats.reduce((s, st) => s + st.workAmount, 0);
    const totalPenalties = roleStats.reduce((s, st) => s + st.penaltyAmount, 0);
    const salaryWorkers = roleStats.filter(s => s.paymentType === 'SALARY');
    const totalSalary = salaryWorkers.reduce((s, st) => s + (st.monthlySalary || 0), 0);
    const avgEfficiency = salaryWorkers.length > 0
      ? salaryWorkers.reduce((s, st) => s + (st.efficiencyCoefficient || 0), 0) / salaryWorkers.length
      : null;
    return { totalItems, totalWork, totalPenalties, totalSalary, avgEfficiency, workersCount: roleWorkers.length };
  }, [activeRole, workers, workerStats]);

  const handleAddWorker = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const role = getRoleByCode(activeRole);
      if (!role) { setError('Роль не найдена'); return; }
      const { pin: _pin, email, ...createData } = workerForm;
      const newUser = await usersApi.create({
        ...createData,
        ...(email ? { email } : {}),
        roleId: role.id,
        monthlySalary: workerForm.paymentType === 'SALARY' ? workerForm.monthlySalary : undefined,
      });
      if (workerForm.pin && workerForm.pin.length >= 4) {
        await authApi.setUserPin(newUser.id, workerForm.pin).catch(() => {});
      }
      setShowAddWorkerModal(false);
      setWorkerForm({ firstName: '', lastName: '', email: '', password: '123456', roleId: '', paymentType: 'PIECE_RATE', monthlySalary: 0, pin: '' });
      setSuccess('Сотрудник добавлен');
      loadData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Ошибка добавления сотрудника');
    }
  };

  const handleUpdateWorker = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingWorker) return;
    try {
      await usersApi.update(editingWorker.id, {
        firstName: workerForm.firstName,
        lastName: workerForm.lastName,
        email: workerForm.email,
        paymentType: workerForm.paymentType,
        monthlySalary: workerForm.paymentType === 'SALARY' ? workerForm.monthlySalary : 0,
      });
      setEditingWorker(null);
      setWorkerForm({ firstName: '', lastName: '', email: '', password: '123456', roleId: '', paymentType: 'PIECE_RATE', monthlySalary: 0, pin: '' });
      setSuccess('Сотрудник обновлен');
      loadData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Ошибка обновления');
    }
  };

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

  const handleSetPin = async () => {
    if (!pinModal) return;
    if (!pinValue || pinValue.length < 4 || pinValue.length > 6 || !/^\d+$/.test(pinValue)) {
      setError('PIN должен содержать от 4 до 6 цифр');
      return;
    }
    try {
      await authApi.setUserPin(pinModal.userId, pinValue);
      setPinModal(null);
      setPinValue('');
      setSuccess('PIN-код установлен');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Ошибка установки PIN');
    }
  };

  const handleAddWorkRate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await payrollApi.createWorkRate({
        productTypeId: workRateForm.productTypeId,
        nomenclatureId: workRateForm.nomenclatureId || undefined,
        stage: stageByRole[activeRole],
        pricePerUnit: workRateForm.pricePerUnit,
        description: workRateForm.description,
        isActive: true,
      });
      setShowWorkRateModal(false);
      setWorkRateForm({ productTypeId: '', nomenclatureId: '', pricePerUnit: 0, description: '' });
      setNomenclatures([]);
      setSuccess('Расценка добавлена');
      loadData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Ошибка добавления расценки');
    }
  };

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
      email: worker.email || '',
      password: '',
      roleId: worker.roleId || '',
      paymentType: worker.paymentType || 'PIECE_RATE',
      monthlySalary: worker.monthlySalary || 0,
      pin: '',
    });
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
  const monthName = new Date().toLocaleString('ru-RU', { month: 'long' });

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
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">{success}</div>
      )}

      {/* Табы отделов */}
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
              <span className={`w-2 h-2 rounded-full ${activeRole === roleCode ? 'bg-white' : roleColors[roleCode]}`} />
              {roleNames[roleCode]}
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${activeRole === roleCode ? 'bg-white/20' : 'bg-gray-200'}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Сводка по отделу */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-500">Изделий за {monthName}</div>
          <div className="text-2xl font-bold">{roleSummary.totalItems}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-500">Сдельный фонд</div>
          <div className="text-2xl font-bold text-green-600">{formatCurrency(roleSummary.totalWork)}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-500">Штрафы</div>
          <div className="text-2xl font-bold text-red-500">{formatCurrency(roleSummary.totalPenalties)}</div>
        </div>
        {roleSummary.avgEfficiency !== null && (
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-500 flex items-center gap-1">
              <TrendingUp size={14} /> Ср. эффективность
            </div>
            <div className="text-2xl font-bold">
              <EfficiencyBadge coeff={roleSummary.avgEfficiency} />
            </div>
          </div>
        )}
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
                onClick={() => { setWorkerForm({ firstName: '', lastName: '', email: '', password: '123456', roleId: '', paymentType: 'PIECE_RATE', monthlySalary: 0, pin: '' }); setShowAddWorkerModal(true); }}
                className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-blue-700 flex items-center gap-1"
              >
                <Plus size={16} /> Добавить
              </button>
            )}
          </div>

          <div className="divide-y">
            {currentWorkers.length === 0 ? (
              <div className="p-8 text-center text-gray-500">Нет сотрудников в этом отделе</div>
            ) : (
              currentWorkers.map((worker) => {
                const stat = getStatForWorker(worker.id);
                return (
                  <div key={worker.id} className="p-4 hover:bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium">{worker.lastName} {worker.firstName}</span>
                          <PaymentTypeBadge type={worker.paymentType || 'PIECE_RATE'} salary={worker.monthlySalary} />
                          {stat?.efficiencyCoefficient !== undefined && stat?.efficiencyCoefficient !== null && (
                            <EfficiencyBadge coeff={stat.efficiencyCoefficient} />
                          )}
                        </div>
                        <div className="text-sm text-gray-500">{worker.email?.includes("@internal") ? "" : worker.email}</div>

                        {/* Статистика за месяц */}
                        {stat && stat.itemsCompleted > 0 && (
                          <div className="flex items-center gap-4 mt-2 text-sm">
                            <span className="flex items-center gap-1 text-gray-600">
                              <BarChart3 size={14} />
                              {stat.itemsCompleted} изд.
                            </span>
                            <span className="text-green-600 font-medium">
                              {formatCurrency(stat.workAmount)}
                            </span>
                            {stat.penaltyAmount > 0 && (
                              <span className="text-red-500 flex items-center gap-1">
                                <AlertTriangle size={12} />
                                -{formatCurrency(stat.penaltyAmount)}
                              </span>
                            )}
                          </div>
                        )}
                        {stat && stat.itemsCompleted === 0 && (
                          <div className="text-xs text-gray-400 mt-1">Нет выполненных работ за {monthName}</div>
                        )}
                      </div>

                      {canManage && (
                        <div className="flex gap-1 ml-2 shrink-0">
                          <button onClick={() => { setPinModal({ userId: worker.id, name: `${worker.lastName} ${worker.firstName}` }); setPinValue(''); }} className="p-2 text-violet-600 hover:bg-violet-50 rounded" title="Задать PIN-код">
                            <Key size={16} />
                          </button>
                          <button onClick={() => openEditWorker(worker)} className="p-2 text-blue-600 hover:bg-blue-50 rounded" title="Редактировать">
                            <Edit2 size={16} />
                          </button>
                          <button onClick={() => handleResetPassword(worker.id)} className="p-2 text-amber-600 hover:bg-amber-50 rounded text-xs" title="Сбросить пароль">
                            123456
                          </button>
                          <button onClick={() => handleDeleteWorker(worker.id)} className="p-2 text-red-600 hover:bg-red-50 rounded" title="Удалить">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
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
                <Plus size={16} /> Добавить
              </button>
            )}
          </div>

          <div className="divide-y">
            {currentRates.length === 0 ? (
              <div className="p-8 text-center text-gray-500">Расценки не настроены</div>
            ) : (
              currentRates.map((rate) => (
                <div key={rate.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                  <div>
                    <div className="font-medium">{rate.productType?.name || 'Все типы'}</div>
                    {rate.description && <div className="text-sm text-gray-500">{rate.description}</div>}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold text-green-600">{formatCurrency(rate.pricePerUnit)}</span>
                    {canManage && (
                      <button onClick={() => handleDeleteWorkRate(rate.id)} className="p-2 text-red-600 hover:bg-red-50 rounded" title="Удалить">
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="p-4 bg-blue-50 border-t text-sm text-blue-800">
            <strong>Как работает:</strong> За каждое изделие, обработанное сотрудником отдела &laquo;{roleNames[activeRole]}&raquo;,
            ему начисляется указанная сумма. Для сотрудников на окладе работы учитываются для расчёта коэффициента эффективности.
          </div>
        </div>
      </div>

      {/* Модальное окно добавления сотрудника */}
      {showAddWorkerModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Новый сотрудник - {roleNames[activeRole]}</h2>
            <form onSubmit={handleAddWorker}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Фамилия</label>
                  <input type="text" value={workerForm.lastName} onChange={(e) => setWorkerForm({ ...workerForm, lastName: e.target.value })} className="w-full border rounded-lg px-3 py-2" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Имя</label>
                  <input type="text" value={workerForm.firstName} onChange={(e) => setWorkerForm({ ...workerForm, firstName: e.target.value })} className="w-full border rounded-lg px-3 py-2" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email (необязательно)</label>
                  <input type="email" value={workerForm.email} onChange={(e) => setWorkerForm({ ...workerForm, email: e.target.value })} className="w-full border rounded-lg px-3 py-2" placeholder="Необязательно" />
                </div>

                {/* Тип оплаты */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Тип оплаты</label>
                  <div className="flex gap-2">
                    <button type="button"
                      onClick={() => setWorkerForm({ ...workerForm, paymentType: 'PIECE_RATE' })}
                      className={`flex-1 py-2 px-3 rounded-lg border-2 text-sm font-medium transition-all ${
                        workerForm.paymentType === 'PIECE_RATE'
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                          : 'border-gray-200 text-gray-500 hover:border-gray-300'
                      }`}
                    >
                      Сдельная
                    </button>
                    <button type="button"
                      onClick={() => setWorkerForm({ ...workerForm, paymentType: 'SALARY' })}
                      className={`flex-1 py-2 px-3 rounded-lg border-2 text-sm font-medium transition-all ${
                        workerForm.paymentType === 'SALARY'
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 text-gray-500 hover:border-gray-300'
                      }`}
                    >
                      Оклад
                    </button>
                  </div>
                </div>

                {workerForm.paymentType === 'SALARY' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Оклад (руб./мес)</label>
                    <input type="number" value={workerForm.monthlySalary || ''} onChange={(e) => setWorkerForm({ ...workerForm, monthlySalary: Number(e.target.value) })} className="w-full border rounded-lg px-3 py-2" min="0" step="1000" placeholder="50000" required />
                    <p className="text-xs text-gray-500 mt-1">Изделия будут учитываться для расчёта коэффициента эффективности</p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">PIN-код <span className="text-gray-400 text-xs">— необязательно</span></label>
                  <input type="text" inputMode="numeric" pattern="[0-9]*" maxLength={6} value={workerForm.pin} onChange={(e) => setWorkerForm({ ...workerForm, pin: e.target.value.replace(/\D/g, '') })} className="w-full border rounded-lg px-3 py-2 font-mono tracking-widest" placeholder="4-6 цифр для входа через окно отдела" />
                </div>

                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-600">Пароль по умолчанию: <strong>123456</strong></p>
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button type="button" onClick={() => setShowAddWorkerModal(false)} className="px-4 py-2 border rounded-lg hover:bg-gray-50">Отмена</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Добавить</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Модальное окно редактирования */}
      {editingWorker && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Редактирование сотрудника</h2>
            <form onSubmit={handleUpdateWorker}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Фамилия</label>
                  <input type="text" value={workerForm.lastName} onChange={(e) => setWorkerForm({ ...workerForm, lastName: e.target.value })} className="w-full border rounded-lg px-3 py-2" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Имя</label>
                  <input type="text" value={workerForm.firstName} onChange={(e) => setWorkerForm({ ...workerForm, firstName: e.target.value })} className="w-full border rounded-lg px-3 py-2" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email (необязательно)</label>
                  <input type="email" value={workerForm.email} onChange={(e) => setWorkerForm({ ...workerForm, email: e.target.value })} className="w-full border rounded-lg px-3 py-2" />
                </div>

                {/* Тип оплаты */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Тип оплаты</label>
                  <div className="flex gap-2">
                    <button type="button"
                      onClick={() => setWorkerForm({ ...workerForm, paymentType: 'PIECE_RATE' })}
                      className={`flex-1 py-2 px-3 rounded-lg border-2 text-sm font-medium transition-all ${
                        workerForm.paymentType === 'PIECE_RATE'
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                          : 'border-gray-200 text-gray-500 hover:border-gray-300'
                      }`}
                    >
                      Сдельная
                    </button>
                    <button type="button"
                      onClick={() => setWorkerForm({ ...workerForm, paymentType: 'SALARY' })}
                      className={`flex-1 py-2 px-3 rounded-lg border-2 text-sm font-medium transition-all ${
                        workerForm.paymentType === 'SALARY'
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 text-gray-500 hover:border-gray-300'
                      }`}
                    >
                      Оклад
                    </button>
                  </div>
                </div>

                {workerForm.paymentType === 'SALARY' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Оклад (руб./мес)</label>
                    <input type="number" value={workerForm.monthlySalary || ''} onChange={(e) => setWorkerForm({ ...workerForm, monthlySalary: Number(e.target.value) })} className="w-full border rounded-lg px-3 py-2" min="0" step="1000" placeholder="50000" required />
                    <p className="text-xs text-gray-500 mt-1">Коэффициент = стоимость выполненных работ / оклад</p>
                  </div>
                )}
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button type="button" onClick={() => setEditingWorker(null)} className="px-4 py-2 border rounded-lg hover:bg-gray-50">Отмена</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
                  <Save size={16} /> Сохранить
                </button>
              </div>
            </form>
          </div>
        </div>
      )}


      {/* Модальное окно установки PIN */}
      {pinModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-sm">
            <h2 className="text-xl font-bold mb-2">Установить PIN-код</h2>
            <p className="text-sm text-gray-500 mb-4">{pinModal.name}</p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">PIN (4-6 цифр)</label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                value={pinValue}
                onChange={(e) => setPinValue(e.target.value.replace(/\D/g, ''))}
                className="w-full border rounded-lg px-3 py-3 text-center text-2xl tracking-widest font-mono"
                placeholder="****"
                autoFocus
              />
              <p className="text-xs text-gray-500 mt-2">Сотрудник сможет войти в личный кабинет через окно отдела, используя этот PIN</p>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button onClick={() => setPinModal(null)} className="px-4 py-2 border rounded-lg hover:bg-gray-50">Отмена</button>
              <button onClick={handleSetPin} disabled={pinValue.length < 4} className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
                <Key size={16} /> Установить
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно расценки */}
      {showWorkRateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Новая расценка - {roleNames[activeRole]}</h2>
            <form onSubmit={handleAddWorkRate}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Тип продукта</label>
                  <select value={workRateForm.productTypeId} onChange={(e) => setWorkRateForm({ ...workRateForm, productTypeId: e.target.value, nomenclatureId: '' })} className="w-full border rounded-lg px-3 py-2" required>
                    <option value="">Выберите тип</option>
                    {productTypes.map((pt) => (<option key={pt.id} value={pt.id}>{pt.name}</option>))}
                  </select>
                </div>
                {workRateForm.productTypeId && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Изделие (номенклатура) <span className="text-gray-400 text-xs">— необязательно</span></label>
                    {nomenclatures.length > 0 ? (
                      <>
                        <select value={workRateForm.nomenclatureId} onChange={(e) => setWorkRateForm({ ...workRateForm, nomenclatureId: e.target.value })} className="w-full border rounded-lg px-3 py-2">
                          <option value="">Все изделия этого типа</option>
                          {nomenclatures.map((nom) => (<option key={nom.id} value={nom.id}>{nom.name} {nom.color ? `(${nom.color})` : ''} {nom.sku ? `[${nom.sku}]` : ''}</option>))}
                        </select>
                        <p className="text-xs text-gray-500 mt-1">Выберите конкретное изделие для индивидуальной расценки</p>
                      </>
                    ) : (
                      <div className="text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                        Нет номенклатур для этого типа продукта. Расценка будет применяться ко всем изделиям этого типа.
                      </div>
                    )}
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Цена за изделие (руб.)</label>
                  <input type="number" value={workRateForm.pricePerUnit} onChange={(e) => setWorkRateForm({ ...workRateForm, pricePerUnit: Number(e.target.value) })} className="w-full border rounded-lg px-3 py-2" min="0" step="1" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Описание (необязательно)</label>
                  <input type="text" value={workRateForm.description} onChange={(e) => setWorkRateForm({ ...workRateForm, description: e.target.value })} className="w-full border rounded-lg px-3 py-2" placeholder="Например: стандартная ставка" />
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button type="button" onClick={() => setShowWorkRateModal(false)} className="px-4 py-2 border rounded-lg hover:bg-gray-50">Отмена</button>
                <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">Добавить</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
