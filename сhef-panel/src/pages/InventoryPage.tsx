import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Package, Save } from 'lucide-react';
import { inventoryApi } from '../api/inventory';

export function InventoryPage() {
  const queryClient = useQueryClient();
  const { data: inventory = [], isLoading, error } = useQuery({
    queryKey: ['inventory'],
    queryFn: () => inventoryApi.getAll(),
  });

  const [draft, setDraft] = useState<Record<string, string>>({});

  useEffect(() => {
    const next: Record<string, string> = {};
    inventory.forEach((item: any) => {
      next[item.id] = item.quantity;
    });
    setDraft(next);
  }, [inventory]);

  const updateMutation = useMutation({
    mutationFn: ({ id, quantity }: { id: string; quantity: string }) =>
      inventoryApi.updateQuantity(id, quantity),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
    },
  });

  const createMutation = useMutation({
    mutationFn: () =>
      inventoryApi.create({ name: 'New ingredient', quantity: '0', unit: 'kg' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => inventoryApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
    },
  });

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
          Failed to load inventory.
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold">Inventory</h1>
          <p className="text-sm text-gray-600 mt-1">Manage stock levels</p>
        </div>
        <button
          onClick={() => createMutation.mutate()}
          disabled={createMutation.isPending}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
        >
          Add Ingredient
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : inventory.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-lg shadow text-gray-500">
          <Package className="h-10 w-10 text-gray-300 mx-auto mb-3" />
          No inventory items yet
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 text-left text-xs font-semibold uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3">Ingredient</th>
                <th className="px-4 py-3">Quantity</th>
                <th className="px-4 py-3">Unit</th>
                <th className="px-4 py-3">Updated</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {inventory.map((item: any) => {
                const value = draft[item.id] ?? item.quantity;
                const changed = value !== item.quantity;
                const low = Number(value) <= 10;

                return (
                  <tr key={item.id}>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{item.name}</div>
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={value}
                        onChange={(event) =>
                          setDraft((current) => ({ ...current, [item.id]: event.target.value }))
                        }
                        className={`w-24 px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          low ? 'border-red-300 text-red-600' : 'border-gray-300'
                        }`}
                      />
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{item.unit}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {new Date(item.updatedAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() =>
                            updateMutation.mutate({ id: item.id, quantity: value })
                          }
                          disabled={!changed || updateMutation.isPending}
                          className="inline-flex items-center gap-1 bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition disabled:opacity-40"
                        >
                          <Save className="h-3 w-3" />
                          Save
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Delete ${item.name}?`)) {
                              deleteMutation.mutate(item.id);
                            }
                          }}
                          disabled={deleteMutation.isPending}
                          className="text-red-600 hover:text-red-500 text-sm px-2 disabled:opacity-40"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
