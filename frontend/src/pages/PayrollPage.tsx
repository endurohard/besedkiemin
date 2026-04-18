import { useState, useEffect } from 'react';
import { payrollApi, usersApi, productTypesApi, nomenclatureApi } from '@/lib/api';
import type {
  WorkRate,
  WorkLog,
  Penalty,
  PayrollPeriod,
  PayrollSummary,
  User,
  ProductType,
} from '@/types';
import { ProductionStage, PayrollStatus } from '@/types';
import { useAuthStore } from '@/store/authStore';

type Tab = 'summary' | 'periods' | 'work-logs' | 'penalties' | 'work-rates' | 'commissions';

const stageNames: Record<ProductionStage, string> = {
  PENDING: 'Ожидание',
  DESIGN: 'Проектирование',
  PREPARATION: 'Заготовка',
  PAINTING: 'Покраска',
  SEWING: 'Пошив',
  ASSEMBLY: 'Сборка',
  QUALITY_CHECK: 'Проверка качества',
  COMPLETED: 'Завершено',
  REJECTED: 'Брак',
};

const statusColors: Record<PayrollStatus, string> = {
  DRAFT: 'bg-muted text-foreground',
  APPROVED: 'bg-primary/20 text-primary/90',
  PAID: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
};

const statusNames: Record<PayrollStatus, string> = {
  DRAFT: 'Черновик',
  APPROVED: 'Утверждено',
  PAID: 'Выплачено',
  CANCELLED: 'Отменено',
};

export default function PayrollPage() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<Tab>(user?.role.code === 'WAREHOUSE' ? 'penalties' : 'summary');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Data states
  const [summary, setSummary] = useState<PayrollSummary | null>(null);
  const [periods, setPeriods] = useState<PayrollPeriod[]>([]);
  const [workLogs, setWorkLogs] = useState<WorkLog[]>([]);
  const [penalties, setPenalties] = useState<Penalty[]>([]);
  const [workRates, setWorkRates] = useState<WorkRate[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [productTypes, setProductTypes] = useState<ProductType[]>([]);
  const [nomenclatures, setNomenclatures] = useState<Array<{ id: string; name: string; sku?: string; color?: string }>>([]);

  // Filter states
  const [periodStart, setPeriodStart] = useState(() => {
    const date = new Date();
    date.setDate(1); // First day of current month
    return date.toISOString().split('T')[0];
  });
  const [periodEnd, setPeriodEnd] = useState(() => {
    const date = new Date();
    date.setMonth(date.getMonth() + 1, 0); // Last day of current month
    return date.toISOString().split('T')[0];
  });
  const [selectedUserId, setSelectedUserId] = useState('');

  // Modal states
  const [showWorkRateModal, setShowWorkRateModal] = useState(false);
  const [showPenaltyModal, setShowPenaltyModal] = useState(false);
  const [showCalculateModal, setShowCalculateModal] = useState(false);
  const [showPeriodDetailModal, setShowPeriodDetailModal] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<PayrollPeriod | null>(null);

  // Form states
  const [workRateForm, setWorkRateForm] = useState({
    productTypeId: '',
    nomenclatureId: '',
    stage: ProductionStage.DESIGN,
    pricePerUnit: 0,
    description: '',
  });

  const [penaltyForm, setPenaltyForm] = useState({
    userId: '',
    amount: 0,
    reason: '',
    notes: '',
  });

  const canManage = user?.role.code === 'SUPER_ADMIN' || user?.role.code === 'OWNER';
  const canManagePenalties = canManage || user?.role.code === 'WAREHOUSE';
  const isWarehouse = user?.role.code === 'WAREHOUSE';

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (activeTab === 'summary') loadSummary();
    else if (activeTab === 'periods') loadPeriods();
    else if (activeTab === 'work-logs') loadWorkLogs();
    else if (activeTab === 'penalties') loadPenalties();
    else if (activeTab === 'work-rates') loadWorkRates();
  }, [activeTab, periodStart, periodEnd, selectedUserId]);

  // Загружаем номенклатуры при выборе типа продукта
  useEffect(() => {
    if (workRateForm.productTypeId) {
      nomenclatureApi.getByProductType(workRateForm.productTypeId)
        .then(data => setNomenclatures(data))
        .catch(err => console.error('Error loading nomenclatures:', err));
    } else {
      setNomenclatures([]);
    }
  }, [workRateForm.productTypeId]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [usersData, productTypesData] = await Promise.all([
        usersApi.getAll(),
        productTypesApi.getAll(),
      ]);
      setUsers(usersData);
      setProductTypes(productTypesData);
      await loadSummary();
    } catch (err) {
      setError('Ошибка загрузки данных');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadSummary = async () => {
    try {
      const data = await payrollApi.getPayrollSummary(periodStart, periodEnd);
      setSummary(data);
    } catch (err) {
      console.error('Error loading summary:', err);
    }
  };

  const loadPeriods = async () => {
    try {
      const params: any = { periodStart, periodEnd };
      if (selectedUserId) params.userId = selectedUserId;
      const data = await payrollApi.getPayrollPeriods(params);
      setPeriods(data);
    } catch (err) {
      console.error('Error loading periods:', err);
    }
  };

  const loadWorkLogs = async () => {
    try {
      const params: any = { startDate: periodStart, endDate: periodEnd };
      if (selectedUserId) params.userId = selectedUserId;
      const data = await payrollApi.getWorkLogs(params);
      setWorkLogs(data);
    } catch (err) {
      console.error('Error loading work logs:', err);
    }
  };

  const loadPenalties = async () => {
    try {
      const params: any = { startDate: periodStart, endDate: periodEnd, includeCancelled: true };
      if (selectedUserId) params.userId = selectedUserId;
      const data = await payrollApi.getPenalties(params);
      setPenalties(data);
    } catch (err) {
      console.error('Error loading penalties:', err);
    }
  };

  const loadWorkRates = async () => {
    try {
      const data = await payrollApi.getWorkRates();
      setWorkRates(data);
    } catch (err) {
      console.error('Error loading work rates:', err);
    }
  };

  const handleCalculatePayroll = async () => {
    try {
      setLoading(true);
      await payrollApi.calculatePayroll({
        periodStart,
        periodEnd,
        userIds: selectedUserId ? [selectedUserId] : undefined,
      });
      setShowCalculateModal(false);
      loadPeriods();
      loadSummary();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Ошибка расчета зарплаты');
    } finally {
      setLoading(false);
    }
  };

  const handleApprovePeriod = async (id: string) => {
    if (!confirm('Утвердить расчет зарплаты?')) return;
    try {
      await payrollApi.approvePayrollPeriod(id);
      loadPeriods();
      loadSummary();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Ошибка утверждения');
    }
  };

  const handlePayPeriod = async (id: string) => {
    if (!confirm('Отметить как выплачено?')) return;
    try {
      await payrollApi.markPayrollAsPaid(id);
      loadPeriods();
      loadSummary();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Ошибка');
    }
  };

  const handleCancelPeriod = async (id: string) => {
    if (!confirm('Отменить расчет?')) return;
    try {
      await payrollApi.cancelPayrollPeriod(id);
      loadPeriods();
      loadSummary();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Ошибка отмены');
    }
  };

  const handleDeletePeriod = async (id: string) => {
    if (!confirm('Удалить расчет? Это действие необратимо.')) return;
    try {
      await payrollApi.deletePayrollPeriod(id);
      loadPeriods();
      loadSummary();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Ошибка удаления');
    }
  };

  const handleCreateWorkRate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await payrollApi.createWorkRate(workRateForm);
      setShowWorkRateModal(false);
      loadWorkRates();
      setWorkRateForm({ productTypeId: '', nomenclatureId: '', stage: ProductionStage.DESIGN, pricePerUnit: 0, description: '' });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Ошибка создания расценки');
    }
  };

  const handleDeleteWorkRate = async (id: string) => {
    if (!confirm('Удалить расценку?')) return;
    try {
      await payrollApi.deleteWorkRate(id);
      loadWorkRates();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Ошибка удаления');
    }
  };

  const handleCreatePenalty = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await payrollApi.createPenalty(penaltyForm);
      setShowPenaltyModal(false);
      loadPenalties();
      loadSummary();
      setPenaltyForm({ userId: '', amount: 0, reason: '', notes: '' });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Ошибка создания штрафа');
    }
  };

  const handleCancelPenalty = async (id: string) => {
    if (!confirm('Отменить штраф?')) return;
    try {
      await payrollApi.cancelPenalty(id);
      loadPenalties();
      loadSummary();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Ошибка отмены штрафа');
    }
  };

  const openPeriodDetail = async (period: PayrollPeriod) => {
    try {
      const detailed = await payrollApi.getPayrollPeriod(period.id);
      setSelectedPeriod(detailed);
      setShowPeriodDetailModal(true);
    } catch (err) {
      console.error('Error loading period details:', err);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB' }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('ru-RU');
  };

  if (loading && !summary) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Расчет зарплаты</h1>
        {canManage && (
          <button
            onClick={() => setShowCalculateModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Рассчитать зарплату
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
          <button onClick={() => setError('')} className="float-right font-bold">&times;</button>
        </div>
      )}

      {/* Filters */}
      <div className="bg-card p-4 rounded-lg shadow mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Начало периода</label>
            <input
              type="date"
              value={periodStart}
              onChange={(e) => setPeriodStart(e.target.value)}
              className="w-full border rounded-lg px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Конец периода</label>
            <input
              type="date"
              value={periodEnd}
              onChange={(e) => setPeriodEnd(e.target.value)}
              className="w-full border rounded-lg px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Сотрудник</label>
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="w-full border rounded-lg px-3 py-2"
            >
              <option value="">Все сотрудники</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.lastName} {u.firstName} ({u.role?.name})
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={() => {
                if (activeTab === 'summary') loadSummary();
                else if (activeTab === 'periods') loadPeriods();
                else if (activeTab === 'work-logs') loadWorkLogs();
                else if (activeTab === 'penalties') loadPenalties();
              }}
              className="bg-muted text-foreground px-4 py-2 rounded-lg hover:bg-accent"
            >
              Применить
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-border mb-6">
        <nav className="-mb-px flex space-x-8">
          {[
            ...(!isWarehouse ? [
              { id: 'summary', name: 'Сводка' },
              { id: 'periods', name: 'Расчеты' },
              { id: 'work-logs', name: 'Журнал работ' },
            ] : []),
            { id: 'penalties', name: 'Штрафы' },
            ...(!isWarehouse ? [
              { id: 'work-rates', name: 'Расценки' },
            ] : []),
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as Tab)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
              }`}
            >
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Summary Tab */}
      {activeTab === 'summary' && summary && (
        <div>
          {/* Totals */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-card p-4 rounded-lg shadow">
              <div className="text-sm text-muted-foreground">Сдельная оплата</div>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(summary.totals.workAmount)}
              </div>
            </div>
            <div className="bg-card p-4 rounded-lg shadow">
              <div className="text-sm text-muted-foreground">Комиссия</div>
              <div className="text-2xl font-bold text-primary">
                {formatCurrency(summary.totals.commissionAmount)}
              </div>
            </div>
            <div className="bg-card p-4 rounded-lg shadow">
              <div className="text-sm text-muted-foreground">Штрафы</div>
              <div className="text-2xl font-bold text-red-600">
                {formatCurrency(summary.totals.penaltyAmount)}
              </div>
            </div>
            <div className="bg-card p-4 rounded-lg shadow">
              <div className="text-sm text-muted-foreground">Итого к выплате</div>
              <div className="text-2xl font-bold">
                {formatCurrency(summary.totals.totalAmount)}
              </div>
            </div>
          </div>

          {/* Users table */}
          <div className="bg-card rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Сотрудник</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Роль</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase">Сдельная</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase">Комиссия</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase">Штрафы</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase">Итого</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-muted-foreground uppercase">Работ</th>
                </tr>
              </thead>
              <tbody className="bg-card divide-y divide-border">
                {summary.users.map((userSummary) => (
                  <tr key={userSummary.userId} className="hover:bg-muted/50">
                    <td className="px-6 py-4 whitespace-nowrap">{userSummary.userName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">{userSummary.role}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-green-600">
                      {formatCurrency(userSummary.workAmount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-primary">
                      {formatCurrency(userSummary.commissionAmount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-red-600">
                      {formatCurrency(userSummary.penaltyAmount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right font-bold">
                      {formatCurrency(userSummary.totalAmount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-muted-foreground">
                      {userSummary.workLogsCount}
                    </td>
                  </tr>
                ))}
                {summary.users.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-4 text-center text-muted-foreground">
                      Нет данных за выбранный период
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Periods Tab */}
      {activeTab === 'periods' && (
        <div className="bg-card rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Сотрудник</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Период</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase">Итого</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-muted-foreground uppercase">Статус</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-muted-foreground uppercase">Действия</th>
              </tr>
            </thead>
            <tbody className="bg-card divide-y divide-border">
              {periods.map((period) => (
                <tr key={period.id} className="hover:bg-muted/50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    {period.user?.lastName} {period.user?.firstName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {formatDate(period.periodStart)} - {formatDate(period.periodEnd)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right font-bold">
                    {formatCurrency(period.totalAmount)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span className={`px-2 py-1 rounded-full text-xs ${statusColors[period.status]}`}>
                      {statusNames[period.status]}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <div className="flex justify-center space-x-2">
                      <button
                        onClick={() => openPeriodDetail(period)}
                        className="text-primary hover:text-blue-900 text-sm"
                      >
                        Детали
                      </button>
                      {canManage && period.status === 'DRAFT' && (
                        <>
                          <button
                            onClick={() => handleApprovePeriod(period.id)}
                            className="text-green-600 hover:text-green-900 text-sm"
                          >
                            Утвердить
                          </button>
                          <button
                            onClick={() => handleDeletePeriod(period.id)}
                            className="text-red-600 hover:text-red-900 text-sm"
                          >
                            Удалить
                          </button>
                        </>
                      )}
                      {canManage && period.status === 'APPROVED' && (
                        <>
                          <button
                            onClick={() => handlePayPeriod(period.id)}
                            className="text-green-600 hover:text-green-900 text-sm"
                          >
                            Выплатить
                          </button>
                          <button
                            onClick={() => handleCancelPeriod(period.id)}
                            className="text-red-600 hover:text-red-900 text-sm"
                          >
                            Отменить
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {periods.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-muted-foreground">
                    Нет расчетов за выбранный период
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Work Logs Tab */}
      {activeTab === 'work-logs' && (
        <div className="bg-card rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Дата</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Сотрудник</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Продукт</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Этап</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase">Кол-во</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase">Цена</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase">Сумма</th>
              </tr>
            </thead>
            <tbody className="bg-card divide-y divide-border">
              {workLogs.map((log) => (
                <tr key={log.id} className="hover:bg-muted/50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {formatDate(log.completedAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {log.user?.lastName} {log.user?.firstName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {log.product?.name || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {stageNames[log.stage]}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    {log.quantity}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-muted-foreground">
                    {formatCurrency(log.pricePerUnit)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right font-medium text-green-600">
                    {formatCurrency(log.totalAmount)}
                  </td>
                </tr>
              ))}
              {workLogs.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-muted-foreground">
                    Нет записей за выбранный период
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Penalties Tab */}
      {activeTab === 'penalties' && (
        <div>
          {canManagePenalties && (
            <div className="mb-4">
              <button
                onClick={() => setShowPenaltyModal(true)}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
              >
                + Добавить штраф
              </button>
            </div>
          )}
          <div className="bg-card rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Дата</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Сотрудник</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Причина</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase">Сумма</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-muted-foreground uppercase">Статус</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-muted-foreground uppercase">Действия</th>
                </tr>
              </thead>
              <tbody className="bg-card divide-y divide-border">
                {penalties.map((penalty) => (
                  <tr key={penalty.id} className={`hover:bg-muted/50 ${penalty.isCancelled ? 'opacity-50' : ''}`}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {formatDate(penalty.date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {penalty.user?.lastName} {penalty.user?.firstName}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">{penalty.reason}</div>
                      {penalty.notes && (
                        <div className="text-xs text-muted-foreground">{penalty.notes}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right font-medium text-red-600">
                      {formatCurrency(penalty.amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      {penalty.isCancelled ? (
                        <span className="px-2 py-1 rounded-full text-xs bg-muted text-muted-foreground">
                          Отменен
                        </span>
                      ) : (
                        <span className="px-2 py-1 rounded-full text-xs bg-red-100 text-red-800">
                          Активен
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      {canManage && !penalty.isCancelled && (
                        <button
                          onClick={() => handleCancelPenalty(penalty.id)}
                          className="text-muted-foreground hover:text-gray-900 text-sm"
                        >
                          Отменить
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {penalties.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center text-muted-foreground">
                      Нет штрафов за выбранный период
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Work Rates Tab */}
      {activeTab === 'work-rates' && (
        <div>
          {canManage && (
            <div className="mb-4">
              <button
                onClick={() => setShowWorkRateModal(true)}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
              >
                + Добавить расценку
              </button>
            </div>
          )}
          <div className="bg-card rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Тип продукта</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Этап</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase">Цена за шт.</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Описание</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-muted-foreground uppercase">Статус</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-muted-foreground uppercase">Действия</th>
                </tr>
              </thead>
              <tbody className="bg-card divide-y divide-border">
                {workRates.map((rate) => (
                  <tr key={rate.id} className="hover:bg-muted/50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      {rate.productType?.name || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {stageNames[rate.stage]}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right font-medium">
                      {formatCurrency(rate.pricePerUnit)}
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {rate.description || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className={`px-2 py-1 rounded-full text-xs ${rate.isActive ? 'bg-green-100 text-green-800' : 'bg-muted text-muted-foreground'}`}>
                        {rate.isActive ? 'Активна' : 'Неактивна'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      {canManage && (
                        <button
                          onClick={() => handleDeleteWorkRate(rate.id)}
                          className="text-red-600 hover:text-red-900 text-sm"
                        >
                          Удалить
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {workRates.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center text-muted-foreground">
                      Расценки не настроены
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Calculate Modal */}
      {showCalculateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-card rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Рассчитать зарплату</h2>
            <p className="text-muted-foreground mb-4">
              Будет произведен расчет зарплаты за период с {formatDate(periodStart)} по {formatDate(periodEnd)}
              {selectedUserId ? ' для выбранного сотрудника' : ' для всех сотрудников'}.
            </p>
            <p className="text-sm text-amber-600 mb-4">
              Внимание: существующие черновики за этот период будут пересчитаны.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowCalculateModal(false)}
                className="px-4 py-2 border rounded-lg hover:bg-muted/50"
              >
                Отмена
              </button>
              <button
                onClick={handleCalculatePayroll}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                disabled={loading}
              >
                {loading ? 'Расчет...' : 'Рассчитать'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Work Rate Modal */}
      {showWorkRateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-card rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Новая расценка</h2>
            <form onSubmit={handleCreateWorkRate}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Тип продукта</label>
                  <select
                    value={workRateForm.productTypeId}
                    onChange={(e) => setWorkRateForm({ ...workRateForm, productTypeId: e.target.value, nomenclatureId: '' })}
                    className="w-full border rounded-lg px-3 py-2"
                    required
                  >
                    <option value="">Выберите тип</option>
                    {productTypes.map((pt) => (
                      <option key={pt.id} value={pt.id}>{pt.name}</option>
                    ))}
                  </select>
                </div>
                {workRateForm.productTypeId && (
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Изделие (номенклатура) <span className="text-muted-foreground text-xs">— необязательно</span>
                    </label>
                    {nomenclatures.length > 0 ? (
                      <>
                        <select
                          value={workRateForm.nomenclatureId}
                          onChange={(e) => setWorkRateForm({ ...workRateForm, nomenclatureId: e.target.value })}
                          className="w-full border rounded-lg px-3 py-2"
                        >
                          <option value="">Все изделия этого типа</option>
                          {nomenclatures.map((nom) => (
                            <option key={nom.id} value={nom.id}>
                              {nom.name} {nom.color ? `(${nom.color})` : ''} {nom.sku ? `[${nom.sku}]` : ''}
                            </option>
                          ))}
                        </select>
                        <p className="text-xs text-muted-foreground mt-1">
                          Выберите конкретное изделие для индивидуальной расценки
                        </p>
                      </>
                    ) : (
                      <div className="text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                        Нет номенклатур для этого типа продукта. Расценка будет применяться ко всем изделиям этого типа.
                        <br />
                        <span className="text-xs text-muted-foreground">
                          Создайте номенклатуры в разделе "Каталог" для индивидуальных расценок.
                        </span>
                      </div>
                    )}
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Этап</label>
                  <select
                    value={workRateForm.stage}
                    onChange={(e) => setWorkRateForm({ ...workRateForm, stage: e.target.value as ProductionStage })}
                    className="w-full border rounded-lg px-3 py-2"
                    required
                  >
                    {Object.entries(stageNames)
                      .filter(([key]) => !['PENDING', 'COMPLETED', 'REJECTED'].includes(key))
                      .map(([key, name]) => (
                        <option key={key} value={key}>{name}</option>
                      ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Цена за единицу (руб.)</label>
                  <input
                    type="number"
                    value={workRateForm.pricePerUnit}
                    onChange={(e) => setWorkRateForm({ ...workRateForm, pricePerUnit: Number(e.target.value) })}
                    className="w-full border rounded-lg px-3 py-2"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Описание</label>
                  <input
                    type="text"
                    value={workRateForm.description}
                    onChange={(e) => setWorkRateForm({ ...workRateForm, description: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2"
                    placeholder="Необязательно"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowWorkRateModal(false)}
                  className="px-4 py-2 border rounded-lg hover:bg-muted/50"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Создать
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Penalty Modal */}
      {showPenaltyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-card rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Новый штраф</h2>
            <form onSubmit={handleCreatePenalty}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Сотрудник</label>
                  <select
                    value={penaltyForm.userId}
                    onChange={(e) => setPenaltyForm({ ...penaltyForm, userId: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2"
                    required
                  >
                    <option value="">Выберите сотрудника</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.lastName} {u.firstName} ({u.role?.name})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Сумма штрафа (руб.)</label>
                  <div className="grid grid-cols-5 gap-2 mb-2">
                    {[200, 400, 600, 800, 1000].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setPenaltyForm({ ...penaltyForm, amount: amt })}
                        className={`px-2 py-2 rounded-lg text-sm font-medium border transition-colors ${
                          penaltyForm.amount === amt
                            ? 'bg-red-600 text-white border-red-600'
                            : 'bg-card text-foreground border-border hover:bg-muted/50'
                        }`}
                      >
                        {amt} ₽
                      </button>
                    ))}
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {[1500, 2000, 2500, 3000, 3500, 4000, 4500, 5000].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setPenaltyForm({ ...penaltyForm, amount: amt })}
                        className={`px-2 py-2 rounded-lg text-sm font-medium border transition-colors ${
                          penaltyForm.amount === amt
                            ? 'bg-red-600 text-white border-red-600'
                            : 'bg-card text-foreground border-border hover:bg-muted/50'
                        }`}
                      >
                        {amt} ₽
                      </button>
                    ))}
                  </div>
                  {penaltyForm.amount === 0 && (
                    <p className="text-xs text-red-500 mt-1">Выберите сумму штрафа</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Причина</label>
                  <input
                    type="text"
                    value={penaltyForm.reason}
                    onChange={(e) => setPenaltyForm({ ...penaltyForm, reason: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Заметки</label>
                  <textarea
                    value={penaltyForm.notes}
                    onChange={(e) => setPenaltyForm({ ...penaltyForm, notes: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2"
                    rows={2}
                    placeholder="Необязательно"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowPenaltyModal(false)}
                  className="px-4 py-2 border rounded-lg hover:bg-muted/50"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Создать штраф
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Period Detail Modal */}
      {showPeriodDetailModal && selectedPeriod && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-card rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">
                Детали расчета: {selectedPeriod.user?.lastName} {selectedPeriod.user?.firstName}
              </h2>
              <button
                onClick={() => setShowPeriodDetailModal(false)}
                className="text-muted-foreground hover:text-foreground text-2xl"
              >
                &times;
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-muted/50 p-3 rounded-lg">
                <div className="text-sm text-muted-foreground">Оклад</div>
                <div className="font-bold">{formatCurrency(selectedPeriod.baseSalary)}</div>
              </div>
              <div className="bg-green-50 p-3 rounded-lg">
                <div className="text-sm text-muted-foreground">Сдельная</div>
                <div className="font-bold text-green-600">{formatCurrency(selectedPeriod.workAmount)}</div>
              </div>
              <div className="bg-primary/10 p-3 rounded-lg">
                <div className="text-sm text-muted-foreground">Комиссия</div>
                <div className="font-bold text-primary">{formatCurrency(selectedPeriod.commissionAmount)}</div>
              </div>
              <div className="bg-red-50 p-3 rounded-lg">
                <div className="text-sm text-muted-foreground">Штрафы</div>
                <div className="font-bold text-red-600">{formatCurrency(selectedPeriod.penaltyAmount)}</div>
              </div>
            </div>

            <div className="text-right mb-6 p-4 bg-muted rounded-lg">
              <span className="text-muted-foreground">Итого к выплате: </span>
              <span className="text-2xl font-bold">{formatCurrency(selectedPeriod.totalAmount)}</span>
            </div>

            {/* Work Logs */}
            {selectedPeriod.workLogs && selectedPeriod.workLogs.length > 0 && (
              <div className="mb-6">
                <h3 className="font-bold mb-2">Выполненные работы ({selectedPeriod.workLogs.length})</h3>
                <div className="border rounded-lg overflow-hidden">
                  <table className="min-w-full divide-y divide-border">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Дата</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Продукт</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Этап</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-muted-foreground">Кол-во</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-muted-foreground">Сумма</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {selectedPeriod.workLogs.map((log) => (
                        <tr key={log.id}>
                          <td className="px-4 py-2 text-sm">{formatDate(log.completedAt)}</td>
                          <td className="px-4 py-2 text-sm">{log.product?.name || '-'}</td>
                          <td className="px-4 py-2 text-sm">{stageNames[log.stage]}</td>
                          <td className="px-4 py-2 text-sm text-right">{log.quantity}</td>
                          <td className="px-4 py-2 text-sm text-right text-green-600">
                            {formatCurrency(log.totalAmount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Penalties */}
            {selectedPeriod.penalties && selectedPeriod.penalties.length > 0 && (
              <div className="mb-6">
                <h3 className="font-bold mb-2">Штрафы ({selectedPeriod.penalties.length})</h3>
                <div className="border rounded-lg overflow-hidden">
                  <table className="min-w-full divide-y divide-border">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Дата</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Причина</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-muted-foreground">Сумма</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {selectedPeriod.penalties.map((penalty) => (
                        <tr key={penalty.id}>
                          <td className="px-4 py-2 text-sm">{formatDate(penalty.date)}</td>
                          <td className="px-4 py-2 text-sm">{penalty.reason}</td>
                          <td className="px-4 py-2 text-sm text-right text-red-600">
                            {formatCurrency(penalty.amount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="flex justify-end">
              <button
                onClick={() => setShowPeriodDetailModal(false)}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
