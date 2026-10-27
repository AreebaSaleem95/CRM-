const barColors = {
  New: "bg-sky-500",
  Contacted: "bg-amber-500",
  Qualified: "bg-violet-500",
  Won: "bg-emerald-500",
  Lost: "bg-rose-500",
};

export default function PipelineCard({ pipeline = [] }) {
  const total = pipeline.reduce((sum, p) => sum + p.count, 0);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="font-semibold">Lead Pipeline</h2>
      <div className="mt-4 space-y-4">
        {pipeline.map(({ status, count }) => {
          const percent = total ? (count / total) * 100 : 0;
          return (
            <div key={status}>
              <div className="mb-1 flex justify-between text-sm">
                <span>{status}</span>
                <span className="text-slate-500">{count}</span>
              </div>
              <div className="h-2 rounded-full bg-slate-100">
                <div
                  className={`h-2 rounded-full ${barColors[status] || "bg-slate-400"}`}
                  style={{ width: `${percent}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}