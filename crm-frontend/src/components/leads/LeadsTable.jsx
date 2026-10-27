import { ArrowDown, ArrowUp, ArrowUpDown, Pencil, Sparkles, Trash2 } from "lucide-react";
import Avatar from "../ui/Avatar";
import Badge from "../ui/Badge";
import { formatMoney } from "../../lib/currency";

const columns = [
  { key: "name", label: "Lead" },
  { key: "company", label: "Company" },
  { key: "status", label: "Status" },
  { key: "source", label: "Source" },
  { key: "value", label: "Value" },
  { key: "owner", label: "Owner" },
  { key: "date", label: "Date" },
];

function SortHeader({ column, sortBy, order, onSort }) {
  const active = sortBy === column.key;
  const Icon = !active ? ArrowUpDown : order === "asc" ? ArrowUp : ArrowDown;

  return (
    <th
      className="px-5 py-3 font-medium"
      aria-sort={active ? (order === "asc" ? "ascending" : "descending") : "none"}
    >
      <button
        type="button"
        onClick={() => onSort(column.key)}
        className={`inline-flex items-center gap-1 uppercase ${
          active ? "text-indigo-600" : "hover:text-slate-700"
        }`}
      >
        {column.label}
        <Icon size={13} />
      </button>
    </th>
  );
}

function RowActions({ lead, onEdit, onDelete, onDraft, canDelete }) {
  return (
    <div className="flex items-center justify-end gap-1">
      {onDraft && (
        <button
          onClick={() => onDraft(lead)}
          className="rounded-lg p-2 text-slate-500 hover:bg-amber-50 hover:text-amber-600"
          aria-label={`Draft email for ${lead.name}`}
          title="Draft follow-up email (AI)"
        >
          <Sparkles size={16} />
        </button>
      )}
      <button
        onClick={() => onEdit(lead)}
        className="rounded-lg p-2 text-slate-500 hover:bg-indigo-50 hover:text-indigo-600"
        aria-label={`Edit ${lead.name}`}
        title="Edit"
      >
        <Pencil size={16} />
      </button>
      {canDelete && (
        <button
          onClick={() => onDelete(lead)}
          className="rounded-lg p-2 text-slate-500 hover:bg-rose-50 hover:text-rose-600"
          aria-label={`Delete ${lead.name}`}
          title="Delete"
        >
          <Trash2 size={16} />
        </button>
      )}
    </div>
  );
}

export default function LeadsTable({
  leads,
  onEdit,
  onDelete,
  onDraft,
  canDelete = false,
  sortBy,
  order,
  onSort = () => {},
}) {
  return (
    <>
      {/* Desktop / tablet table */}
      <div className="hidden overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm md:block">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                {columns.map((c) => (
                  <SortHeader
                    key={c.key}
                    column={c}
                    sortBy={sortBy}
                    order={order}
                    onSort={onSort}
                  />
                ))}
                <th className="px-5 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {leads.map((lead) => (
                <tr key={lead.id} className="hover:bg-slate-50">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar name={lead.name} size="sm" src={lead.avatarUrl} />
                      <div>
                        <p className="font-medium">{lead.name}</p>
                        <p className="text-xs text-slate-500">{lead.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3">{lead.company}</td>
                  <td className="px-5 py-3">
                    <Badge status={lead.status} />
                  </td>
                  <td className="px-5 py-3">{lead.source}</td>
                  <td className="whitespace-nowrap px-5 py-3 font-medium">
                    {formatMoney(lead.value)}
                  </td>
                  <td className="px-5 py-3">{lead.owner}</td>
                  <td className="px-5 py-3 text-slate-500">{lead.date}</td>
                  <td className="px-5 py-3">
                    <RowActions
                      lead={lead}
                      onEdit={onEdit}
                      onDelete={onDelete}
                      onDraft={onDraft}
                      canDelete={canDelete}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile cards */}
      <div className="space-y-3 md:hidden">
        {leads.map((lead) => (
          <div
            key={lead.id}
            className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-3">
                <Avatar name={lead.name} src={lead.avatarUrl} />
                <div>
                  <p className="font-medium">{lead.name}</p>
                  <p className="text-xs text-slate-500">{lead.company}</p>
                </div>
              </div>
              <Badge status={lead.status} />
            </div>
            <dl className="mt-3 grid grid-cols-2 gap-2 text-xs">
              <div>
                <dt className="text-slate-400">Source</dt>
                <dd>{lead.source}</dd>
              </div>
              <div>
                <dt className="text-slate-400">Value</dt>
                <dd className="font-medium">{formatMoney(lead.value)}</dd>
              </div>
              <div>
                <dt className="text-slate-400">Owner</dt>
                <dd>{lead.owner}</dd>
              </div>
              <div>
                <dt className="text-slate-400">Date</dt>
                <dd>{lead.date}</dd>
              </div>
            </dl>
            <div className="mt-3 border-t border-slate-100 pt-2">
              <RowActions
                lead={lead}
                onEdit={onEdit}
                onDelete={onDelete}
                onDraft={onDraft}
                canDelete={canDelete}
              />
            </div>
          </div>
        ))}
      </div>
    </>
  );
}