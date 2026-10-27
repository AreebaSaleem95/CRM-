export default function ActivityList({ activities = [] }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="font-semibold">Recent Activity</h2>
      <ul className="mt-4 space-y-4">
        {activities.map((a) => (
          <li key={a.id} className="flex gap-3">
            <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-indigo-500" />
            <div>
              <p className="text-sm">{a.text}</p>
              <p className="text-xs text-slate-400">{a.time}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}