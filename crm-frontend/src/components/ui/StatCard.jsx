import { Target, Users, Trophy, TrendingUp, TrendingDown } from "lucide-react";

const icons = {
  leads: Target,
  contacts: Users,
  won: Trophy,
};

export default function StatCard({ title, value, change, positive, icon }) {
  const Icon = icons[icon] || Target;
  const Trend = positive ? TrendingUp : TrendingDown;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">{title}</p>
        <div className="rounded-lg bg-indigo-50 p-2 text-indigo-600">
          {icon === "revenue" ? (
            <span className="flex h-[18px] min-w-[18px] items-center justify-center text-xs font-bold leading-none">
              Rs
            </span>
          ) : (
            <Icon size={18} />
          )}
        </div>
      </div>
      <p className="mt-3 text-2xl font-bold">{value}</p>
      <p
        className={`mt-1 flex items-center gap-1 text-xs font-medium ${
          positive ? "text-emerald-600" : "text-rose-600"
        }`}
      >
        <Trend size={14} />
        {change} vs last month
      </p>
    </div>
  );
}