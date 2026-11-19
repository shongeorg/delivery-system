import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BookOpen, Search } from 'lucide-react';
import { productsApi } from '../api/products';

export function RecipesPage() {
  const [search, setSearch] = useState('');
  const { data, isLoading, error } = useQuery({
    queryKey: ['products'],
    queryFn: () => productsApi.getAll(),
  });

  const products = data?.products ?? [];
  const total = data?.pagination?.total ?? products.length;

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return products;

    return products.filter(
      (product: any) =>
        product.name.toLowerCase().includes(query) ||
        (product.description ?? '').toLowerCase().includes(query)
    );
  }, [products, search]);

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
          Failed to load recipes.
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold">Recipes</h1>
          <p className="text-sm text-gray-600 mt-1">{total} menu items</p>
        </div>
        <div className="relative">
          <Search className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search recipes"
            className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-lg shadow text-gray-500">
          No recipes found
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((product: any) => (
            <div key={product.id} className="bg-white rounded-lg shadow overflow-hidden">
              {product.cover ? (
                <img src={product.cover} alt={product.name} className="w-full h-40 object-cover" />
              ) : (
                <div className="w-full h-40 bg-gray-100 flex items-center justify-center">
                  <BookOpen className="h-10 w-10 text-gray-300" />
                </div>
              )}
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <h2 className="font-semibold text-gray-900">{product.name}</h2>
                  <span className="font-bold text-blue-600 whitespace-nowrap">
                    ${Number(product.price).toFixed(2)}
                  </span>
                </div>
                {product.description && (
                  <p className="text-sm text-gray-600 mt-2 line-clamp-2">{product.description}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
