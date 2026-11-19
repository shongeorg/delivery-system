import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { ownerApi } from '../api/owner';
import { Modal } from '../components/Modal';
import { StatCard } from '../components/StatCard';
import { formatDate, formatMoney, roleClass } from '../lib/format';

function currentPeriod() {
  return new Date().toISOString().slice(0, 7);
}

export function PayrollPage() {
  const queryClient = useQueryClient();
  const [period, setPeriod] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [userId, setUserId] = useState('');
  const [type, setType] = useState<'salary' | 'bonus'>('salary');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [paymentPeriod, setPaymentPeriod] = useState(currentPeriod());
  const [error, setError] = useState('');

  const { data, isLoading, error: queryError } = useQuery({
    queryKey: ['owner-payroll', period],
    queryFn: () => ownerApi.getPayroll(period || undefined),
  });

  const { data: staff = [] } = useQuery({
    queryKey: ['owner-staff', 'payroll-form'],
    queryFn: () => ownerApi.getStaff(),
  });

  const createMutation = useMutation({
    mutationFn: () =>
      ownerApi.createPayroll({
        userId,
        amount: Number(amount),
        type,
        period: paymentPeriod || undefined,
        note: note || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['owner-payroll'] });
      queryClient.invalidateQueries({ queryKey: ['owner-overview'] });
      queryClient.invalidateQueries({ queryKey: ['owner-finances'] });
      setShowForm(false);
      setUserId('');
      setAmount('');
      setNote('');
    },
    onError: () => setError('Failed to record the payment'),
  });

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setError('');

    if (!userId) {
      setError('Select an employee');
      return;
    }
    if (!amount || Number(amount) <= 0) {
      setError('Enter a valid amount');
      return;
    }

    createMutation.mutate();
  };

  const employees = staff.filter((member) => member.role !== 'customer');

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Payroll</h1>
          <p className="text-sm text-gray-600 mt-1">Salaries, bonuses and payment history</p>
        </div>
        <button
          onClick={() => {
            setError('');
            setShowForm(true);
          }}
          className="inline-flex items-center gap-2 bg-amber-500 text-slate-900 px-4 py-2 rounded-lg font-semibold hover:bg-amber-400"
        >
          <Plus className="h-4 w-4" />
          Record payment
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Salaries" value={formatMoney(data?.totals.salary ?? 0)} />
        <StatCard label="Bonuses" value={formatMoney(data?.totals.bonus ?? 0)} tone="positive" />
        <StatCard label="Total Payroll" value={formatMoney(data?.totals.all ?? 0)} />
      </div>

      <div className="flex items-center gap-3">
        <label className="text-sm font-medium text-gray-700">Period</label>
        <input
          type="month"
          value={period}
          onChange={(event) => setPeriod(event.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
        />
        {period && (
          <button onClick={() => setPeriod('')} className="text-sm text-gray-500 hover:text-gray-800">
            Clear
          </button>
        )}
      </div>

      {queryError && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
          Failed to load payroll.
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs font-semibold uppercase text-gray-500">
              <tr>
                <th className="px-6 py-3">Employee</th>
                <th className="px-6 py-3">Type</th>
                <th className="px-6 py-3">Period</th>
                <th className="px-6 py-3">Note</th>
                <th className="px-6 py-3">Date</th>
                <th className="px-6 py-3 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(data?.payments ?? []).map((payment) => (
                <tr key={payment.id}>
                  <td className="px-6 py-3">
                    <div className="font-medium text-gray-900">{payment.user?.name ?? 'Unknown'}</div>
                    <div className="flex items-center gap-1 mt-1">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium capitalize ${roleClass(payment.user?.role ?? '')}`}>
                        {payment.user?.role ?? '—'}
                      </span>
                      <span className="text-xs text-gray-500">{payment.user?.email}</span>
                    </div>
                  </td>
                  <td className="px-6 py-3">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${
                        payment.type === 'bonus' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'
                      }`}
                    >
                      {payment.type}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-gray-600">{payment.period ?? '—'}</td>
                  <td className="px-6 py-3 text-gray-600">{payment.note ?? '—'}</td>
                  <td className="px-6 py-3 text-gray-600">{formatDate(payment.createdAt)}</td>
                  <td className="px-6 py-3 text-right font-semibold text-gray-900">
                    {formatMoney(payment.amount)}
                  </td>
                </tr>
              ))}
              {(data?.payments ?? []).length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-gray-500">
                    No payroll payments for this period
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <Modal title="Record payroll payment" onClose={() => setShowForm(false)}>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Employee</label>
              <select
                value={userId}
                onChange={(event) => setUserId(event.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="">Select employee</option>
                {employees.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name} · {member.role}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select
                  value={type}
                  onChange={(event) => setType(event.target.value as 'salary' | 'bonus')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="salary">Salary</option>
                  <option value="bonus">Bonus</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Period</label>
              <input
                type="month"
                value={paymentPeriod}
                onChange={(event) => setPaymentPeriod(event.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Note</label>
              <input
                value={note}
                onChange={(event) => setNote(event.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createMutation.isPending}
                className="px-4 py-2 rounded-lg bg-amber-500 text-slate-900 font-semibold hover:bg-amber-400 disabled:opacity-50"
              >
                {createMutation.isPending ? 'Saving...' : 'Record payment'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
