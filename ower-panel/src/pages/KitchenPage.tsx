import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, Clock, RefreshCw } from 'lucide-react';
import { ownerApi } from '../api/owner';
import { StatCard } from '../components/StatCard';
import { formatMoney, formatStatus, statusClass } from '../lib/format';

const statusTabs = ['all', 'created', 'paid', 'cooking', 'ready', 'on_the_way'];

export function KitchenPage() {
  const [tab, setTab] = useState('all');

  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['owner-kitchen'],
    queryFn: () => ownerApi.getKitchen(),
    refetchInterval: 10000,
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
          Failed to load kitchen data.
        </div>
      </div>
    );
  }

  const queue = tab === 'all' ? data.queue : data.queue.filter((order) => order.status === tab);

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Kitchen Control</h1>
          <p className="text-sm text-gray-600 mt-1">Live order queue and stock alerts</p>
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

      {data.oldestWaitingMinutes >= 30 && (
        <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-lg">
          <AlertTriangle className="h-5 w-5" />
          <span>
            Oldest active order has been waiting {data.oldestWaitingMinutes} minutes. Check the kitchen queue.
          </span>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-4">
        <StatCard label="New" value={data.counts.created ?? 0} tone={(data.counts.created ?? 0) > 0 ? 'warning' : 'default'} />
        <StatCard label="Paid / Waiting" value={data.counts.paid ?? 0} tone={(data.counts.paid ?? 0) > 0 ? 'warning' : 'default'} />
        <StatCard label="Cooking" value={data.counts.cooking ?? 0} />
        <StatCard label="Ready" value={data.counts.ready ?? 0} tone="positive" />
        <StatCard label="On the Way" value={data.counts.on_the_way ?? 0} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-4">
          <div className="flex flex-wrap gap-2">
            {statusTabs.map((status) => (
              <button
                key={status}
                onClick={() => setTab(status)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium capitalize transition ${
                  tab === status
                    ? 'bg-slate-900 text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                {status === 'all' ? 'All active' : formatStatus(status)}
              </button>
            ))}
          </div>

          {queue.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-10 text-center text-gray-500">
              No orders in this state
            </div>
          ) : (
            <div className="space-y-3">
              {queue.map((order) => (
                <div key={order.id} className="bg-white rounded-lg shadow p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm text-gray-700">#{order.id.slice(0, 8)}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusClass(order.status)}`}>
                          {formatStatus(order.status)}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {order.deliveryType === 'delivery' ? 'Delivery' : 'Pickup'} · {order.paymentType} (
                        {order.paymentStatus})
                      </div>
                      {order.courier && (
                        <div className="text-xs text-indigo-700 mt-1">
                          Courier: {order.courier.name}
                          {order.courier.phone ? ` · ${order.courier.phone}` : ''}
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-gray-900">{formatMoney(order.totalPrice)}</div>
                      <div
                        className={`inline-flex items-center gap-1 text-xs mt-1 ${
                          order.waitingMinutes >= 30 ? 'text-red-600 font-semibold' : 'text-gray-500'
                        }`}
                      >
                        <Clock className="h-3.5 w-3.5" />
                        {order.waitingMinutes} min
                      </div>
                    </div>
                  </div>

                  <ul className="mt-3 divide-y divide-gray-100 border-t pt-2">
                    {order.items.map((item, index) => (
                      <li key={`${order.id}-${index}`} className="py-1 flex justify-between text-sm">
                        <span className="text-gray-700">
                          {item.quantity}× {item.name}
                        </span>
                        <span className="text-gray-500">
                          {formatMoney(Number(item.price) * item.quantity)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow h-fit">
          <div className="flex items-center gap-2 px-6 py-4 border-b">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            <h2 className="text-lg font-semibold text-gray-900">Low Stock</h2>
          </div>
          {data.lowStock.length === 0 ? (
            <p className="px-6 py-8 text-sm text-gray-500">All inventory items are sufficiently stocked.</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {data.lowStock.map((item) => (
                <li key={item.id} className="px-6 py-3 flex items-center justify-between text-sm">
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
    </div>
  );
}
