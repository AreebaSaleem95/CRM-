import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

const FALLBACK_COLOR = "#94a3b8";

export default function DonutCard({
  title,
  subtitle,
  items = [], // [{ label, count }]
  colors = {}, // { label: "#hex" }
  centerLabel = "Total",
  unit = "leads",
}) {
  const total = items.reduce((sum, i) => sum + i.count, 0);

  // Jin items ki ginti 0 hai unka slice nahi banta, lekin legend mein 0 dikhega
  const data = items
    .filter((i) => i.count > 0)
    .map((i) => ({
      name: i.label,
      value: i.count,
      fill: colors[i.label] || FALLBACK_COLOR,
    }));

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="font-semibold">{title}</h2>
      {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}

      {total === 0 ? (
        <div className="flex h-56 items-center justify-center text-sm text-slate-500">
          No {unit} yet
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
              <Tooltip formatter={(value, name) => [`Rs{value} ${unit}`, name]} />
            </PieChart>
          </ResponsiveContainer>

          {/* Donut ke beech mein total */}
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-bold">{total}</span>
            <span className="text-xs text-slate-500">{centerLabel}</span>
          </div>
        </div>
      )}

      {/* Legend: naam, count aur percentage */}
      <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
        {items.map(({ label, count }) => {
          const percent = total ? Math.round((count / total) * 100) : 0;
          return (
            <li key={label} className="flex items-center justify-between gap-2">
              <span className="flex min-w-0 items-center gap-2">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: colors[label] || FALLBACK_COLOR }}
                />
                <span className="truncate">{label}</span>
              </span>
              <span className="shrink-0 text-slate-500">
                {count} ({percent}%)
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}