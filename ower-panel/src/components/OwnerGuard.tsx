import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export function OwnerGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== 'owner') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow p-8 text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-2">Access denied</h1>
          <p className="text-gray-600">The owner panel is available to the restaurant owner only.</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
