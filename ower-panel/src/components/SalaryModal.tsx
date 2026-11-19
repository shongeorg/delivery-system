import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ownerApi, StaffMember } from '../api/owner';
import { Modal } from '../components/Modal';

interface SalaryModalProps {
  member: StaffMember;
  onClose: () => void;
}

export function SalaryModal({ member, onClose }: SalaryModalProps) {
  const queryClient = useQueryClient();
  const [baseSalary, setBaseSalary] = useState(member.salary?.baseSalary ?? '0');
  const [bonusPercentage, setBonusPercentage] = useState(member.salary?.bonusPercentage ?? '0');
  const [currency, setCurrency] = useState(member.salary?.currency ?? 'USD');
  const [error, setError] = useState('');

  const mutation = useMutation({
    mutationFn: () =>
      ownerApi.updateSalary(member.id, {
        baseSalary: Number(baseSalary),
        bonusPercentage: Number(bonusPercentage),
        currency,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['owner-staff'] });
      queryClient.invalidateQueries({ queryKey: ['owner-overview'] });
      onClose();
    },
    onError: () => setError('Failed to save salary terms'),
  });

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setError('');

    if (Number(baseSalary) < 0 || Number(bonusPercentage) < 0 || Number(bonusPercentage) > 100) {
      setError('Enter a valid base salary and a bonus percentage between 0 and 100');
      return;
    }

    mutation.mutate();
  };

  return (
    <Modal title={`Salary terms · ${member.name}`} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded text-sm">
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Base salary</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={baseSalary}
              onChange={(event) => setBaseSalary(event.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Bonus %</label>
            <input
              type="number"
              min="0"
              max="100"
              step="0.1"
              value={bonusPercentage}
              onChange={(event) => setBonusPercentage(event.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
          <select
            value={currency}
            onChange={(event) => setCurrency(event.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
            <option value="UAH">UAH</option>
          </select>
        </div>

        <p className="text-xs text-gray-500">
          Bonus percentage is applied to the base salary when a bonus is accrued.
        </p>

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={mutation.isPending}
            className="px-4 py-2 rounded-lg bg-amber-500 text-slate-900 font-semibold hover:bg-amber-400 disabled:opacity-50"
          >
            {mutation.isPending ? 'Saving...' : 'Save salary'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
