import { Mail, Phone, MapPin, Pencil, Trash2 } from "lucide-react";
import Avatar from "../ui/Avatar";

export default function ContactCard({ contact, onEdit, onDelete, canDelete = false }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-3">
          <Avatar name={contact.name} size="lg" src={contact.avatarUrl} />
          <div className="min-w-0">
            <p className="truncate font-semibold">{contact.name}</p>
            <p className="truncate text-sm text-slate-500">
              {contact.role} · {contact.company}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center">
          <button
            onClick={() => onEdit(contact)}
            className="rounded-lg p-2 text-slate-500 hover:bg-indigo-50 hover:text-indigo-600"
            aria-label={`Edit ${contact.name}`}
            title="Edit"
          >
            <Pencil size={16} />
          </button>
          {canDelete && (
            <button
              onClick={() => onDelete(contact)}
              className="rounded-lg p-2 text-slate-500 hover:bg-rose-50 hover:text-rose-600"
              aria-label={`Delete ${contact.name}`}
              title="Delete"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
      </div>

      <ul className="mt-4 space-y-2 text-sm text-slate-600">
        <li className="flex items-center gap-2">
          <Mail size={15} className="shrink-0 text-slate-400" />
          <span className="truncate">{contact.email}</span>
        </li>
        <li className="flex items-center gap-2">
          <Phone size={15} className="shrink-0 text-slate-400" />
          {contact.phone}
        </li>
        <li className="flex items-center gap-2">
          <MapPin size={15} className="shrink-0 text-slate-400" />
          {contact.city}
        </li>
      </ul>
    </div>
  );
}