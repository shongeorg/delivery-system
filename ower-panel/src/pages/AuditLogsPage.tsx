import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import { ownerApi } from '../api/owner';
import { formatDate, roleClass } from '../lib/format';

export function AuditLogsPage() {
  const [search, setSearch] = useState('');

  const { data: logs = [], isLoading, error } = useQuery({
    queryKey: ['owner-audit-logs'],
    queryFn: () => ownerApi.getAuditLogs(),
    refetchInterval: 30000,
  });

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return logs;

    return logs.filter((log) =>
      [log.action, log.entity, log.user?.name ?? '', log.details ?? ''].some((value) =>
        value.toLowerCase().includes(query)
      )
    );
  }, [logs, search]);

  function formatDetails(details: string | null | undefined) {
    if (!details) return '—';
    try {
      return JSON.stringify(JSON.parse(details));
    } catch {
      return details;
    }
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
          Failed to load audit logs.
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Audit Logs</h1>
          <p className="text-sm text-gray-600 mt-1">Price changes, deletions, payroll and settings updates</p>
        </div>
        <div className="relative">
          <Search className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search action, user, entity"
            className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg w-72 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>
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
                <th className="px-6 py-3">Date</th>
                <th className="px-6 py-3">User</th>
                <th className="px-6 py-3">Action</th>
                <th className="px-6 py-3">Entity</th>
                <th className="px-6 py-3">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((log) => (
                <tr key={log.id}>
                  <td className="px-6 py-3 text-gray-600 whitespace-nowrap">{formatDate(log.createdAt)}</td>
                  <td className="px-6 py-3">
                    <div className="font-medium text-gray-900">{log.user?.name ?? 'Unknown'}</div>
                    <span
                      className={`inline-block mt-1 px-1.5 py-0.5 rounded text-[10px] font-medium capitalize ${roleClass(
                        log.user?.role ?? ''
                      )}`}
                    >
                      {log.user?.role ?? '—'}
                    </span>
                  </td>
                  <td className="px-6 py-3 font-mono text-xs text-gray-800">{log.action}</td>
                  <td className="px-6 py-3 text-gray-600">
                    {log.entity}
                    {log.entityId && <span className="text-xs text-gray-400"> · {log.entityId.slice(0, 8)}</span>}
                  </td>
                  <td className="px-6 py-3 text-xs text-gray-600 max-w-md break-words font-mono">
                    {formatDetails(log.details)}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-gray-500">
                    No audit records found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
