import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Crown,
  LayoutDashboard,
  Users,
  Wallet,
  TrendingUp,
  ChefHat,
  Settings,
  ScrollText,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export function Layout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/staff', icon: Users, label: 'Staff' },
    { path: '/payroll', icon: Wallet, label: 'Payroll' },
    { path: '/finances', icon: TrendingUp, label: 'Finances' },
    { path: '/kitchen', icon: ChefHat, label: 'Kitchen' },
    { path: '/settings', icon: Settings, label: 'Restaurant' },
    { path: '/audit-logs', icon: ScrollText, label: 'Audit Logs' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-100 flex">
      <aside className="w-64 bg-slate-900 text-slate-100 flex flex-col fixed inset-y-0">
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Crown className="h-8 w-8 text-amber-400" />
            <h2 className="text-xl font-bold">Owner Panel</h2>
          </div>
          <p className="text-sm text-slate-400 mt-2">{user?.name}</p>
          <p className="text-xs text-slate-500 capitalize">{user?.role}</p>
        </div>

        <nav className="p-4 space-y-1 flex-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.path === '/' ? location.pathname === '/' : location.pathname.startsWith(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-amber-500 text-slate-900 font-semibold'
                    : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 w-full text-red-400 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <LogOut className="h-5 w-5" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 ml-64">
        <Outlet />
      </main>
    </div>
  );
}
