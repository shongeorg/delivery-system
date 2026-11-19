import { useQuery } from '@tanstack/react-query';
import {
  DollarSign,
  ShoppingBag,
  TrendingUp,
  Users,
  ChefHat,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import { ownerApi } from '../api/owner';
import { StatCard } from '../components/StatCard';
import { formatDate, formatMoney, formatStatus, statusClass } from '../lib/format';

export function DashboardPage() {
  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['owner-overview'],
    queryFn: () => ownerApi.getOverview(),
    refetchInterval: 15000,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
          Failed to load the dashboard. Check that the backend is running.
        </div>
      </div>
    );
  }

  const maxProductRevenue = Math.max(...data.topProducts.map((product) => product.revenue), 1);

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-600 mt-1">Live overview of the restaurant</p>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="inline-flex items-center gap-2 bg-white border border-gray-300 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          label="Revenue Today"
          value={formatMoney(data.revenue.today)}
          hint={`${data.orders.today} orders today`}
          icon={DollarSign}
          tone="positive"
        />
        <StatCard
          label="Revenue This Month"
          value={formatMoney(data.revenue.month)}
          hint={`Week: ${formatMoney(data.revenue.week)}`}
          icon={TrendingUp}
        />
        <StatCard
          label="Net Profit (Month)"
          value={formatMoney(data.finance.netProfitMonth)}
          hint={`Payroll ${formatMoney(data.finance.payrollMonth)} · Expenses ${formatMoney(data.finance.expensesMonth)}`}
          icon={WalletIcon}
          tone={data.finance.netProfitMonth >= 0 ? 'positive' : 'negative'}
        />
        <StatCard
          label="Active Orders"
          value={data.orders.active}
          hint={`${data.orders.deliveredToday} delivered today`}
          icon={ShoppingBag}
          tone={data.orders.active > 0 ? 'warning' : 'default'}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard label="Average Order Value" value={formatMoney(data.orders.averageValue)} icon={ShoppingBag} />
        <StatCard label="Total Orders" value={data.orders.total} icon={ShoppingBag} />
        <StatCard
          label="Staff"
          value={data.staff.total}
          hint={`${data.staff.byRole.chef ?? 0} chefs · ${data.staff.byRole.courier ?? 0} couriers`}
          icon={Users}
        />
        <StatCard
          label="Blocked Accounts"
          value={data.staff.blocked}
          tone={data.staff.blocked > 0 ? 'negative' : 'default'}
          icon={Users}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-5 w-5 text-emerald-600" />
            <h2 className="text-lg font-semibold text-gray-900">Top Products by Revenue</h2>
          </div>
          {data.topProducts.length === 0 ? (
            <p className="text-sm text-gray-500">No paid orders yet.</p>
          ) : (
            <ul className="space-y-4">
              {data.topProducts.map((product) => (
                <li key={product.name}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="font-medium text-gray-800">{product.name}</span>
                    <span className="text-gray-600">
                      {product.quantity} sold · {formatMoney(product.revenue)}
                    </span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full"
                      style={{ width: `${Math.round((product.revenue / maxProductRevenue) * 100)}%` }}
                    ></div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            <h2 className="text-lg font-semibold text-gray-900">Low Stock</h2>
          </div>
          {data.lowStock.length === 0 ? (
            <p className="text-sm text-gray-500">All inventory items are sufficiently stocked.</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {data.lowStock.map((item) => (
                <li key={item.id} className="py-2 flex items-center justify-between text-sm">
                  <span className="text-gray-800">{item.name}</span>
                  <span className="font-semibold text-red-600">
                    {Number(item.quantity).toFixed(2)} {item.unit}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="flex items-center gap-2 px-6 py-4 border-b">
          <ChefHat className="h-5 w-5 text-gray-500" />
          <h2 className="text-lg font-semibold text-gray-900">Recent Orders</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs font-semibold uppercase text-gray-500">
              <tr>
                <th className="px-6 py-3">Order</th>
                <th className="px-6 py-3">Created</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Payment</th>
                <th className="px-6 py-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.recentOrders.map((order) => (
                <tr key={order.id}>
                  <td className="px-6 py-3 font-mono text-xs text-gray-700">#{order.id.slice(0, 8)}</td>
                  <td className="px-6 py-3 text-gray-600">{formatDate(order.createdAt)}</td>
                  <td className="px-6 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusClass(order.status)}`}>
                      {formatStatus(order.status)}
                    </span>
                  </td>
                  <td className="px-6 py-3 capitalize text-gray-600">
                    {order.paymentType}
                    <span className={order.paymentStatus === 'paid' ? 'text-emerald-600' : 'text-amber-600'}>
                      {' '}
                      ({order.paymentStatus})
                    </span>
                  </td>
                  <td className="px-6 py-3 text-right font-semibold text-gray-900">
                    {formatMoney(order.totalPrice)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function WalletIcon({ className }: { className?: string }) {
  return <DollarSign className={className} />;
}
