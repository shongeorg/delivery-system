import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Save } from 'lucide-react';
import { ownerApi } from '../api/owner';

export function SettingsPage() {
  const queryClient = useQueryClient();
  const { data, isLoading, error } = useQuery({
    queryKey: ['owner-settings'],
    queryFn: () => ownerApi.getSettings(),
  });

  const [form, setForm] = useState({
    name: '',
    phone: '',
    address: '',
    workingHours: '',
    currency: 'USD',
    taxRate: '0',
    deliveryFee: '0',
    logo: '',
    cover: '',
  });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!data) return;
    setForm({
      name: data.name ?? '',
      phone: data.phone ?? '',
      address: data.address ?? '',
      workingHours: data.workingHours ?? '',
      currency: data.currency ?? 'USD',
      taxRate: data.taxRate ?? '0',
      deliveryFee: data.deliveryFee ?? '0',
      logo: data.logo ?? '',
      cover: data.cover ?? '',
    });
  }, [data]);

  const mutation = useMutation({
    mutationFn: () =>
      ownerApi.updateSettings({
        name: form.name,
        phone: form.phone,
        address: form.address,
        workingHours: form.workingHours,
        currency: form.currency,
        taxRate: Number(form.taxRate),
        deliveryFee: Number(form.deliveryFee),
        logo: form.logo,
        cover: form.cover,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['owner-settings'] });
      setSaved(true);
    },
  });

  const update = (field: keyof typeof form, value: string) => {
    setSaved(false);
    setForm((current) => ({ ...current, [field]: value }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
          Failed to load restaurant settings.
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Restaurant Profile</h1>
        <p className="text-sm text-gray-600 mt-1">Global branding, location and system settings</p>
      </div>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          mutation.mutate();
        }}
        className="space-y-6 max-w-4xl"
      >
        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Identity</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Restaurant name</label>
            <input
              value={form.name}
              onChange={(event) => update('name', event.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Logo URL</label>
              <input
                value={form.logo}
                onChange={(event) => update('logo', event.target.value)}
                placeholder="https://..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              {form.logo && <img src={form.logo} alt="Logo preview" className="mt-2 h-16 w-16 object-contain rounded border" />}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cover image URL</label>
              <input
                value={form.cover}
                onChange={(event) => update('cover', event.target.value)}
                placeholder="https://..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              {form.cover && <img src={form.cover} alt="Cover preview" className="mt-2 h-16 w-full object-cover rounded border" />}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Location & Contact</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input
                value={form.phone}
                onChange={(event) => update('phone', event.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Working hours</label>
              <input
                value={form.workingHours}
                onChange={(event) => update('workingHours', event.target.value)}
                placeholder="10am - 10pm Daily"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
            <input
              value={form.address}
              onChange={(event) => update('address', event.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">System</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
              <select
                value={form.currency}
                onChange={(event) => update('currency', event.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="UAH">UAH</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tax rate (%)</label>
              <input
                type="number"
                min="0"
                step="0.1"
                value={form.taxRate}
                onChange={(event) => update('taxRate', event.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Delivery fee</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.deliveryFee}
                onChange={(event) => update('deliveryFee', event.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>
        </div>

        {mutation.isError && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
            Failed to save settings.
          </div>
        )}

        {saved && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded">
            Restaurant settings saved.
          </div>
        )}

        <button
          type="submit"
          disabled={mutation.isPending}
          className="inline-flex items-center gap-2 bg-amber-500 text-slate-900 px-6 py-3 rounded-lg font-semibold hover:bg-amber-400 disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          {mutation.isPending ? 'Saving...' : 'Save settings'}
        </button>
      </form>
    </div>
  );
}
