import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Gift, ShieldBan, ShieldCheck, Wallet } from 'lucide-react';
import { ownerApi } from '../api/owner';
import { Modal } from '../components/Modal';
import { SalaryModal } from '../components/SalaryModal';
import { StatCard } from '../components/StatCard';
import { formatDate, formatMoney, roleClass } from '../lib/format';

const roleOptions = ['owner', 'admin', 'chef', 'courier', 'customer'];

function currentPeriod() {
  return new Date().toISOString().slice(0, 7);
}

export function StaffDetailPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [showSalary, setShowSalary] = useState(false);
  const [showBonus, setShowBonus] = useState(false);
  const [bonusAmount, setBonusAmount] = useState('');
  const [bonusNote, setBonusNote] = useState('');
  const [period, setPeriod] = useState(currentPeriod());
  const [error, setError] = useState('');

  const { data: staff = [], isLoading } = useQuery({
    queryKey: ['owner-staff', 'detail'],
    queryFn: () => ownerApi.getStaff(),
  });

  const { data: payroll } = useQuery({
    queryKey: ['owner-payroll'],
    queryFn: () => ownerApi.getPayroll(),
  });

  const updateMutation = useMutation({
    mutationFn: (data: { role?: string; isBlocked?: boolean }) => ownerApi.updateStaff(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['owner-staff'] });
      queryClient.invalidateQueries({ queryKey: ['owner-overview'] });
    },
  });

  const bonusMutation = useMutation({
    mutationFn: () =>
      ownerApi.createPayroll({
        userId: id!,
        amount: Number(bonusAmount),
        type: 'bonus',
        period,
        note: bonusNote || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['owner-payroll'] });
      queryClient.invalidateQueries({ queryKey: ['owner-overview'] });
      queryClient.invalidateQueries({ queryKey: ['owner-finances'] });
      setShowBonus(false);
      setBonusAmount('');
      setBonusNote('');
    },
    onError: () => setError('Failed to accrue the bonus'),
  });

  const member = staff.find((item) => item.id === id);
  const payments = (payroll?.payments ?? []).filter((payment) => payment.userId === id);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  if (!member) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">Staff member not found.</div>
      </div>
    );
  }

  const baseSalary = Number(member.salary?.baseSalary ?? 0);
  const bonusPercentage = Number(member.salary?.bonusPercentage ?? 0);
  const calculatedBonus = (baseSalary * bonusPercentage) / 100;
  const totalPaid = payments.reduce((total, payment) => total + Number(payment.amount), 0);

  const handleBonus = (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    if (!bonusAmount || Number(bonusAmount) <= 0) {
      setError('Enter a valid bonus amount');
      return;
    }
    bonusMutation.mutate();
  };

  return (
    <div className="p-6 space-y-6">
      <Link to="/staff" className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900">
        <ArrowLeft className="h-4 w-4" />
        Back to staff
      </Link>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{member.name}</h1>
            <p className="text-gray-600 mt-1">{member.email}</p>
            {member.phone && <p className="text-sm text-gray-500 mt-1">{member.phone}</p>}
            <div className="flex items-center gap-2 mt-3">
              <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${roleClass(member.role)}`}>
                {member.role}
              </span>
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium ${
                  member.isBlocked ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'
                }`}
              >
                {member.isBlocked ? 'Blocked' : 'Active'}
              </span>
              <span className="text-xs text-gray-500">Joined {formatDate(member.createdAt)}</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={member.role}
              onChange={(event) => updateMutation.mutate({ role: event.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              {roleOptions.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
            <button
              onClick={() => updateMutation.mutate({ isBlocked: !member.isBlocked })}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium ${
                member.isBlocked
                  ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                  : 'bg-red-50 text-red-700 hover:bg-red-100'
              }`}
            >
              {member.isBlocked ? <ShieldCheck className="h-4 w-4" /> : <ShieldBan className="h-4 w-4" />}
              {member.isBlocked ? 'Unblock' : 'Block'}
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard label="Base Salary" value={formatMoney(baseSalary)} hint="Monthly" icon={Wallet} />
        <StatCard label="Bonus Rate" value={`${bonusPercentage}%`} hint={`≈ ${formatMoney(calculatedBonus)}`} icon={Gift} />
        <StatCard label="Paid To Date" value={formatMoney(totalPaid)} hint={`${payments.length} payments`} icon={Wallet} />
        <StatCard label="Currency" value={member.salary?.currency ?? 'USD'} />
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => setShowSalary(true)}
          className="inline-flex items-center gap-2 bg-amber-500 text-slate-900 px-4 py-2 rounded-lg font-semibold hover:bg-amber-400"
        >
          <Wallet className="h-4 w-4" />
          Edit salary terms
        </button>
        <button
          onClick={() => {
            setBonusAmount(calculatedBonus ? calculatedBonus.toFixed(2) : '');
            setShowBonus(true);
          }}
          className="inline-flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-lg font-semibold hover:bg-slate-800"
        >
          <Gift className="h-4 w-4" />
          Accrue bonus
        </button>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">Payment History</h2>
        </div>
        {payments.length === 0 ? (
          <p className="px-6 py-8 text-sm text-gray-500">No payroll payments for this employee yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs font-semibold uppercase text-gray-500">
              <tr>
                <th className="px-6 py-3">Date</th>
                <th className="px-6 py-3">Type</th>
                <th className="px-6 py-3">Period</th>
                <th className="px-6 py-3">Note</th>
                <th className="px-6 py-3 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {payments.map((payment) => (
                <tr key={payment.id}>
                  <td className="px-6 py-3 text-gray-600">{formatDate(payment.createdAt)}</td>
                  <td className="px-6 py-3 capitalize">{payment.type}</td>
                  <td className="px-6 py-3 text-gray-600">{payment.period ?? '—'}</td>
                  <td className="px-6 py-3 text-gray-600">{payment.note ?? '—'}</td>
                  <td className="px-6 py-3 text-right font-semibold">{formatMoney(payment.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showSalary && <SalaryModal member={member} onClose={() => setShowSalary(false)} />}

      {showBonus && (
        <Modal title={`Accrue bonus · ${member.name}`} onClose={() => setShowBonus(false)}>
          <form onSubmit={handleBonus} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded text-sm">
                {error}
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={bonusAmount}
                onChange={(event) => setBonusAmount(event.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Period</label>
              <input
                type="month"
                value={period}
                onChange={(event) => setPeriod(event.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Note</label>
              <input
                value={bonusNote}
                onChange={(event) => setBonusNote(event.target.value)}
                placeholder="Performance bonus"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowBonus(false)}
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={bonusMutation.isPending}
                className="px-4 py-2 rounded-lg bg-slate-900 text-white font-semibold hover:bg-slate-800 disabled:opacity-50"
              >
                {bonusMutation.isPending ? 'Saving...' : 'Accrue bonus'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
