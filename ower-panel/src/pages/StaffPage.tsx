import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Search, ShieldBan, ShieldCheck, Wallet } from 'lucide-react';
import { ownerApi, StaffMember } from '../api/owner';
import { SalaryModal } from '../components/SalaryModal';
import { formatMoney, roleClass } from '../lib/format';

const roleOptions = ['owner', 'admin', 'chef', 'courier', 'customer'];

export function StaffPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [salaryMember, setSalaryMember] = useState<StaffMember | null>(null);

  const { data: staff = [], isLoading, error } = useQuery({
    queryKey: ['owner-staff', search, role],
    queryFn: () => ownerApi.getStaff({ search: search || undefined, role: role || undefined }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { role?: string; isBlocked?: boolean } }) =>
      ownerApi.updateStaff(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['owner-staff'] });
      queryClient.invalidateQueries({ queryKey: ['owner-overview'] });
    },
  });

  const counts = useMemo(() => {
    return staff.reduce<Record<string, number>>((acc, member) => {
      acc[member.role] = (acc[member.role] ?? 0) + 1;
      return acc;
    }, {});
  }, [staff]);

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
          Failed to load staff.
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Staff</h1>
        <p className="text-sm text-gray-600 mt-1">
          {staff.length} accounts · {roleOptions.map((item) => `${item}: ${counts[item] ?? 0}`).join(' · ')}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search name, email, phone"
            className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg w-72 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>
        <select
          value={role}
          onChange={(event) => setRole(event.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
        >
          <option value="">All roles</option>
          {roleOptions.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs font-semibold uppercase text-gray-500">
              <tr>
                <th className="px-6 py-3">Name</th>
                <th className="px-6 py-3">Contact</th>
                <th className="px-6 py-3">Role</th>
                <th className="px-6 py-3">Salary</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {staff.map((member) => (
                <tr key={member.id} className="hover:bg-gray-50">
                  <td className="px-6 py-3">
                    <Link to={`/staff/${member.id}`} className="font-medium text-gray-900 hover:text-amber-600">
                      {member.name}
                    </Link>
                  </td>
                  <td className="px-6 py-3 text-gray-600">
                    <div>{member.email}</div>
                    {member.phone && <div className="text-xs text-gray-500">{member.phone}</div>}
                  </td>
                  <td className="px-6 py-3">
                    <select
                      value={member.role}
                      onChange={(event) =>
                        updateMutation.mutate({ id: member.id, data: { role: event.target.value } })
                      }
                      className={`px-2 py-1 rounded-full text-xs font-medium capitalize border-0 focus:ring-2 focus:ring-amber-500 ${roleClass(
                        member.role
                      )}`}
                    >
                      {roleOptions.map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-6 py-3 text-gray-700">
                    {member.salary ? (
                      <span>
                        {formatMoney(member.salary.baseSalary)}
                        <span className="text-xs text-gray-500"> +{Number(member.salary.bonusPercentage)}%</span>
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400">Not set</span>
                    )}
                  </td>
                  <td className="px-6 py-3">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        member.isBlocked ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'
                      }`}
                    >
                      {member.isBlocked ? 'Blocked' : 'Active'}
                    </span>
                  </td>
                  <td className="px-6 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setSalaryMember(member)}
                        className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-50 px-3 py-1.5 rounded hover:bg-amber-100"
                      >
                        <Wallet className="h-3.5 w-3.5" />
                        Salary
                      </button>
                      <button
                        onClick={() => {
                          if (
                            member.isBlocked ||
                            confirm(`Block ${member.name}? They will not be able to sign in.`)
                          ) {
                            updateMutation.mutate({
                              id: member.id,
                              data: { isBlocked: !member.isBlocked },
                            });
                          }
                        }}
                        className={`inline-flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded ${
                          member.isBlocked
                            ? 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                            : 'text-red-700 bg-red-50 hover:bg-red-100'
                        }`}
                      >
                        {member.isBlocked ? (
                          <>
                            <ShieldCheck className="h-3.5 w-3.5" />
                            Unblock
                          </>
                        ) : (
                          <>
                            <ShieldBan className="h-3.5 w-3.5" />
                            Block
                          </>
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {salaryMember && <SalaryModal member={salaryMember} onClose={() => setSalaryMember(null)} />}
    </div>
  );
}
