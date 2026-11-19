import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Plus, Trash2 } from 'lucide-react';
import { ownerApi } from '../api/owner';
import { Modal } from '../components/Modal';
import { StatCard } from '../components/StatCard';
import { formatDate, formatMoney } from '../lib/format';

const categories = ['supplies', 'rent', 'utilities', 'marketing', 'equipment', 'other'];

function firstOfMonth() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

export function FinancePage() {
  const queryClient = useQueryClient();
  const [from, setFrom] = useState(firstOfMonth());
  const [to, setTo] = useState(today());
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('supplies');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');

  const { data, isLoading, error: queryError } = useQuery({
    queryKey: ['owner-finances', from, to],
    queryFn: () => ownerApi.getFinances(from, to),
  });

  const createMutation = useMutation({
    mutationFn: () =>
      ownerApi.createExpense({
        title,
        category,
        amount: Number(amount),
        note: note || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['owner-finances'] });
      queryClient.invalidateQueries({ queryKey: ['owner-overview'] });
      setShowExpenseForm(false);
      setTitle('');
      setAmount('');
      setNote('');
    },
    onError: () => setError('Failed to add the expense'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => ownerApi.deleteExpense(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['owner-finances'] });
      queryClient.invalidateQueries({ queryKey: ['owner-overview'] });
    },
  });

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setError('');

    if (title.trim().length < 2) {
      setError('Enter an expense title');
      return;
    }
    if (!amount || Number(amount) <= 0) {
      setError('Enter a valid amount');
      return;
    }

    createMutation.mutate();
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Finance & Cash Flow</h1>
          <p className="text-sm text-gray-600 mt-1">Revenue, payroll, expenses and net profit</p>
        </div>
        <button
          onClick={() => {
            setError('');
            setShowExpenseForm(true);
          }}
          className="inline-flex items-center gap-2 bg-amber-500 text-slate-900 px-4 py-2 rounded-lg font-semibold hover:bg-amber-400"
        >
          <Plus className="h-4 w-4" />
          Add expense
        </button>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">From</label>
          <input
            type="date"
            value={from}
            onChange={(event) => setFrom(event.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">To</label>
          <input
            type="date"
            value={to}
            onChange={(event) => setTo(event.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>
      </div>

      {queryError && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
          Failed to load finance data.
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <StatCard
              label="Revenue"
              value={formatMoney(data?.totals.revenue ?? 0)}
              hint={`${data?.totals.paidOrders ?? 0} paid orders`}
              tone="positive"
            />
            <StatCard label="Payroll" value={formatMoney(data?.totals.payroll ?? 0)} />
            <StatCard label="Expenses" value={formatMoney(data?.totals.expenses ?? 0)} tone="warning" />
            <StatCard
              label="Net Profit"
              value={formatMoney(data?.totals.net ?? 0)}
              hint={`${data?.totals.orders ?? 0} orders in period`}
              tone={(data?.totals.net ?? 0) >= 0 ? 'positive' : 'negative'}
            />
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Daily Cash Flow</h2>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data?.series ?? []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} tickFormatter={(value: string) => value.slice(5)} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(value) => formatMoney(Number(value))} />
                  <Legend />
                  <Line type="monotone" dataKey="revenue" name="Revenue" stroke="#059669" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="expenses" name="Expenses" stroke="#d97706" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="payroll" name="Payroll" stroke="#2563eb" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="net" name="Net" stroke="#0f172a" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b">
                <h2 className="text-lg font-semibold text-gray-900">Expenses</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-left text-xs font-semibold uppercase text-gray-500">
                    <tr>
                      <th className="px-6 py-3">Title</th>
                      <th className="px-6 py-3">Category</th>
                      <th className="px-6 py-3">Date</th>
                      <th className="px-6 py-3 text-right">Amount</th>
                      <th className="px-6 py-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {(data?.expenses ?? []).map((expense) => (
                      <tr key={expense.id}>
                        <td className="px-6 py-3">
                          <div className="font-medium text-gray-900">{expense.title}</div>
                          {expense.note && <div className="text-xs text-gray-500">{expense.note}</div>}
                        </td>
                        <td className="px-6 py-3 capitalize text-gray-600">{expense.category}</td>
                        <td className="px-6 py-3 text-gray-600">{formatDate(expense.createdAt)}</td>
                        <td className="px-6 py-3 text-right font-semibold">{formatMoney(expense.amount)}</td>
                        <td className="px-6 py-3 text-right">
                          <button
                            onClick={() => {
                              if (confirm(`Delete expense "${expense.title}"?`)) {
                                deleteMutation.mutate(expense.id);
                              }
                            }}
                            className="text-red-600 hover:text-red-500"
                            aria-label="Delete expense"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {(data?.expenses ?? []).length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                          No expenses in this period
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b">
                <h2 className="text-lg font-semibold text-gray-900">Payroll in Period</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-left text-xs font-semibold uppercase text-gray-500">
                    <tr>
                      <th className="px-6 py-3">Type</th>
                      <th className="px-6 py-3">Period</th>
                      <th className="px-6 py-3">Date</th>
                      <th className="px-6 py-3 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {(data?.payrollPayments ?? []).map((payment) => (
                      <tr key={payment.id}>
                        <td className="px-6 py-3 capitalize text-gray-700">{payment.type}</td>
                        <td className="px-6 py-3 text-gray-600">{payment.period ?? '—'}</td>
                        <td className="px-6 py-3 text-gray-600">{formatDate(payment.createdAt)}</td>
                        <td className="px-6 py-3 text-right font-semibold">{formatMoney(payment.amount)}</td>
                      </tr>
                    ))}
                    {(data?.payrollPayments ?? []).length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                          No payroll payments in this period
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}

      {showExpenseForm && (
        <Modal title="Add expense" onClose={() => setShowExpenseForm(false)}>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Flour delivery"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  value={category}
                  onChange={(event) => setCategory(event.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  {categories.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
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
                onClick={() => setShowExpenseForm(false)}
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createMutation.isPending}
                className="px-4 py-2 rounded-lg bg-amber-500 text-slate-900 font-semibold hover:bg-amber-400 disabled:opacity-50"
              >
                {createMutation.isPending ? 'Saving...' : 'Add expense'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
