import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ClipboardList, ChefHat, CheckCircle, Package, TrendingUp } from 'lucide-react';
import { useOrders } from '../hooks/useOrders';
import { inventoryApi } from '../api/inventory';

export function DashboardPage() {
  const { data: orders = [], isLoading: ordersLoading } = useOrders();
  const { data: inventory = [], isLoading: inventoryLoading } = useQuery({
    queryKey: ['inventory'],
    queryFn: () => inventoryApi.getAll(),
    refetchInterval: 15000,
  });

  const newOrders = orders.filter((order: any) => order.status === 'created').length;
  const waitingOrders = orders.filter((order: any) => order.status === 'paid').length;
  const cookingOrders = orders.filter((order: any) => order.status === 'cooking').length;
  const readyOrders = orders.filter((order: any) => order.status === 'ready').length;

  const deliveredOrders = orders.filter((order: any) => order.status === 'delivered');
  const revenue = deliveredOrders.reduce(
    (total: number, order: any) => total + Number(order.totalPrice),
    0
  );

  const lowStock = inventory
    .filter((item: any) => Number(item.quantity) <= 10)
    .sort((a: any, b: any) => Number(a.quantity) - Number(b.quantity))
    .slice(0, 5);

  const stats = [
    { label: 'New Orders', value: newOrders, icon: ClipboardList, color: 'bg-red-50 text-red-700', href: '/orders' },
    { label: 'Waiting to Cook', value: waitingOrders, icon: ChefHat, color: 'bg-yellow-50 text-yellow-700', href: '/orders' },
    { label: 'Cooking Now', value: cookingOrders, icon: ChefHat, color: 'bg-orange-50 text-orange-700', href: '/orders' },
    { label: 'Ready for Courier', value: readyOrders, icon: CheckCircle, color: 'bg-green-50 text-green-700', href: '/orders' },
  ];

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link
              key={stat.label}
              to={stat.href}
              className="bg-white rounded-lg shadow p-5 hover:shadow-lg transition"
            >
              <div className={`inline-flex items-center justify-center w-10 h-10 rounded-lg ${stat.color}`}>
                <Icon className="h-5 w-5" />
              </div>
              <div className="mt-3 text-3xl font-bold text-gray-900">
                {ordersLoading ? '—' : stat.value}
              </div>
              <div className="text-sm text-gray-600">{stat.label}</div>
            </Link>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Link to="/orders" className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition">
          <div className="flex items-center gap-3">
            <TrendingUp className="h-6 w-6 text-blue-600" />
            <h2 className="text-xl font-semibold">Delivered Revenue</h2>
          </div>
          <p className="text-3xl font-bold text-gray-900 mt-4">
            ${revenue.toFixed(2)}
          </p>
          <p className="text-sm text-gray-600 mt-1">
            {ordersLoading ? 'Loading orders...' : `${deliveredOrders.length} delivered orders`}
          </p>
        </Link>

        <Link to="/inventory" className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition">
          <div className="flex items-center gap-3">
            <Package className="h-6 w-6 text-indigo-600" />
            <h2 className="text-xl font-semibold">Low Stock</h2>
          </div>
          {inventoryLoading ? (
            <p className="text-sm text-gray-600 mt-4">Loading inventory...</p>
          ) : lowStock.length === 0 ? (
            <p className="text-sm text-gray-600 mt-4">All items are sufficiently stocked.</p>
          ) : (
            <ul className="mt-4 space-y-2">
              {lowStock.map((item: any) => (
                <li key={item.id} className="flex justify-between text-sm">
                  <span className="text-gray-700">{item.name}</span>
                  <span className="font-medium text-red-600">
                    {item.quantity} {item.unit}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Link>
      </div>
    </div>
  );
}
