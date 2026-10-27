import { Link } from "react-router-dom";
import Avatar from "../ui/Avatar";
import Badge from "../ui/Badge";

export default function RecentLeads({ leads = [] }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">Recent Leads</h2>
        <Link to="/leads" className="text-sm font-medium text-indigo-600 hover:underline">
          View all
        </Link>
      </div>

      <ul className="mt-4 divide-y divide-slate-100">
        {leads.map((lead) => (
          <li key={lead.id} className="flex items-center justify-between gap-3 py-3">
            <div className="flex min-w-0 items-center gap-3">
              <Avatar name={lead.name} src={lead.avatarUrl} />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{lead.name}</p>
                <p className="truncate text-xs text-slate-500">{lead.company}</p>
              </div>
            </div>
            <Badge status={lead.status} />
          </li>
        ))}
      </ul>
    </div>
  );
}