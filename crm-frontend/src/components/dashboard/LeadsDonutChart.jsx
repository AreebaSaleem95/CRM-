import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

// Badge aur pipeline wale rang, taake poora app ek jaisa dikhe
const COLORS = {
  New: "#0ea5e9",
  Contacted: "#f59e0b",
  Qualified: "#8b5cf6",
  Won: "#10b981",
  Lost: "#f43f5e",
};
const FALLBACK_COLOR = "#94a3b8";

export default function LeadsDonutChart({ pipeline = [] }) {
  const total = pipeline.reduce((sum, p) => sum + p.count, 0);

  // Jin status ki leads 0 hain unka slice nahi banta, lekin legend mein 0 dikhega
  const data = pipeline
    .filter((p) => p.count > 0)
    .map((p) => ({
      name: p.status,
      value: p.count,
      fill: COLORS[p.status] || FALLBACK_COLOR,
    }));

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="font-semibold">Leads by Status</h2>
      <p className="text-xs text-slate-500">Share of leads in each stage</p>

      {total === 0 ? (
        <div className="flex h-56 items-center justify-center text-sm text-slate-500">
          No leads yet
        </div>
      ) : (
        <div className="relative mt-2 h-56">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                innerRadius="62%"
                outerRadius="90%"
                paddingAngle={3}
                stroke="none"
              >
                {/* Rang dono tarah se diya hai (data mein fill aur Cell) taake Recharts ke har version mein chale */}
                {data.map((entry) => (
                  <Cell key={entry.name} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip formatter={(value, name) => [`${value} leads`, name]} />
            </PieChart>
          </ResponsiveContainer>

          {/* Donut ke beech mein total */}
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-bold">{total}</span>
            <span className="text-xs text-slate-500">Total leads</span>
          </div>
        </div>
      )}

      {/* Legend: naam, count aur percentage */}
      <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
        {pipeline.map(({ status, count }) => {
          const percent = total ? Math.round((count / total) * 100) : 0;
          return (
            <li key={status} className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-2">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: COLORS[status] || FALLBACK_COLOR }}
                />
                {status}
              </span>
              <span className="text-slate-500">
                {count} ({percent}%)
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}