interface StatCardProps {
  label: string;
  value: string | number;
  hint?: string;
  tone?: 'default' | 'positive' | 'warning' | 'negative';
  icon?: React.ComponentType<{ className?: string }>;
}

const toneClasses: Record<string, string> = {
  default: 'text-gray-900',
  positive: 'text-emerald-600',
  warning: 'text-amber-600',
  negative: 'text-red-600',
};

export function StatCard({ label, value, hint, tone = 'default', icon: Icon }: StatCardProps) {
  return (
    <div className="bg-white rounded-lg shadow p-5">
      <div className="flex items-start justify-between">
        <p className="text-sm font-medium text-gray-600">{label}</p>
        {Icon && <Icon className="h-5 w-5 text-gray-400" />}
      </div>
      <p className={`mt-2 text-2xl font-bold ${toneClasses[tone]}`}>{value}</p>
      {hint && <p className="mt-1 text-xs text-gray-500">{hint}</p>}
    </div>
  );
}
