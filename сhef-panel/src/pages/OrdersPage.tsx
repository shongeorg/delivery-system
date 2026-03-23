import { useState } from 'react';
import { useOrders, useUpdateOrderStatus } from '../hooks/useOrders';
import { Clock, ChefHat, CheckCircle, AlertCircle } from 'lucide-react';

export function OrdersPage() {
  const [filter, setFilter] = useState<'all' | 'created' | 'paid' | 'cooking' | 'ready'>('all');
  const { data: ordersData, isLoading, error } = useOrders();
  const updateStatusMutation = useUpdateOrderStatus();

  const orders = ordersData || [];
  
  const filteredOrders = orders.filter((order: any) => {
    if (filter === 'all') return true;
    return order.status === filter;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'cooking': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'ready': return 'bg-green-100 text-green-800 border-green-300';
      case 'on_the_way': return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'delivered': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid': return <Clock className="h-5 w-5" />;
      case 'cooking': return <ChefHat className="h-5 w-5" />;
      case 'ready': return <CheckCircle className="h-5 w-5" />;
      case 'cancelled': return <AlertCircle className="h-5 w-5" />;
      default: return <Clock className="h-5 w-5" />;
    }
  };

  const handleStartCooking = (orderId: string) => {
    updateStatusMutation.mutate({ orderId, status: 'cooking' });
  };

  const handleMarkReady = (orderId: string) => {
    updateStatusMutation.mutate({ orderId, status: 'ready' });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
          Error loading orders. Please try again.
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-4">Kitchen Orders</h1>
        
        {/* Filter Tabs */}
        <div className="flex space-x-2 mb-6 overflow-x-auto">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
              filter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            All Orders ({orders.length})
          </button>
          <button
            onClick={() => setFilter('created')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
              filter === 'created'
                ? 'bg-red-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            New Orders
          </button>
          <button
            onClick={() => setFilter('paid')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
              filter === 'paid'
                ? 'bg-yellow-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            Waiting to Cook
          </button>
          <button
            onClick={() => setFilter('cooking')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
              filter === 'cooking'
                ? 'bg-orange-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            Cooking Now
          </button>
          <button
            onClick={() => setFilter('ready')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
              filter === 'ready'
                ? 'bg-green-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            Ready for Pickup
          </button>
        </div>
      </div>

      {/* Orders Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredOrders.length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-500">
            No orders found
          </div>
        ) : (
          filteredOrders.map((order: any) => (
            <div key={order.id} className="bg-white rounded-lg shadow-lg overflow-hidden border-2 border-gray-200">
              {/* Header */}
              <div className={`px-4 py-3 border-b flex items-center justify-between ${getStatusColor(order.status)}`}>
                <div className="flex items-center space-x-2">
                  {getStatusIcon(order.status)}
                  <span className="font-semibold uppercase text-sm">{order.status.replace('_', ' ')}</span>
                </div>
                <span className="text-xs opacity-75">
                  #{order.id.slice(0, 8)}
                </span>
              </div>

              {/* Body */}
              <div className="p-4">
                {/* Order Info */}
                <div className="mb-4">
                  <div className="text-2xl font-bold text-gray-900 mb-1">
                    ${order.totalPrice}
                  </div>
                  <div className="text-sm text-gray-600">
                    {new Date(order.createdAt).toLocaleString()}
                  </div>
                </div>

                {/* Customer Info */}
                {order.user && (
                  <div className="mb-4 pb-4 border-b">
                    <div className="text-sm font-medium text-gray-700 mb-1">Customer</div>
                    <div className="text-sm text-gray-600">{order.user.name}</div>
                    {order.user.phone && (
                      <div className="text-sm text-gray-600">{order.user.phone}</div>
                    )}
                  </div>
                )}

                {/* Order Items */}
                <div className="mb-4">
                  <div className="text-sm font-medium text-gray-700 mb-2">Items</div>
                  <div className="space-y-1">
                    {order.items?.map((item: any) => (
                      <div key={item.id} className="flex justify-between text-sm">
                        <span className="text-gray-600">
                          {item.quantity}x {item.product?.name || 'Item'}
                        </span>
                        <span className="text-gray-900 font-medium">
                          ${item.price}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Delivery Info */}
                {order.address && (
                  <div className="mb-4 pb-4 border-b">
                    <div className="text-sm font-medium text-gray-700 mb-1">Delivery Address</div>
                    <div className="text-sm text-gray-600">{order.address}</div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="space-y-2">
                  {order.status === 'created' && (
                    <button
                      onClick={() => handleStartCooking(order.id)}
                      disabled={updateStatusMutation.isPending}
                      className="w-full bg-orange-600 text-white py-2 px-4 rounded-lg hover:bg-orange-700 transition-colors font-medium disabled:opacity-50"
                    >
                      Accept & Start Cooking
                    </button>
                  )}
                  
                  {order.status === 'paid' && (
                    <button
                      onClick={() => handleStartCooking(order.id)}
                      disabled={updateStatusMutation.isPending}
                      className="w-full bg-orange-600 text-white py-2 px-4 rounded-lg hover:bg-orange-700 transition-colors font-medium disabled:opacity-50"
                    >
                      Start Cooking
                    </button>
                  )}
                  
                  {order.status === 'cooking' && (
                    <button
                      onClick={() => handleMarkReady(order.id)}
                      disabled={updateStatusMutation.isPending}
                      className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50"
                    >
                      Mark as Ready for Courier
                    </button>
                  )}

                  {order.status === 'ready' && (
                    <div className="text-center py-3 bg-green-50 border-2 border-green-200 rounded-lg">
                      <CheckCircle className="h-6 w-6 text-green-600 mx-auto mb-1" />
                      <div className="text-green-800 font-bold">Ready for Pickup</div>
                      <div className="text-green-600 text-sm">Waiting for courier</div>
                    </div>
                  )}

                  {(order.status === 'on_the_way' || order.status === 'delivered') && (
                    <div className="text-center py-2 text-gray-500 text-sm">
                      Order with courier
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
