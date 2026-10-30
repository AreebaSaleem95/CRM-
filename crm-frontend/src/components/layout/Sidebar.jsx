import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Target,
  Users,
  Briefcase,
  CheckSquare,
  Calendar,
  Settings as SettingsIcon,
  X,
  Menu,
} from "lucide-react";

const links = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/leads", label: "Leads", icon: Target },
  { to: "/contacts", label: "Contacts", icon: Users },
  { to: "/deals", label: "Deals Pipeline", icon: Briefcase },
  { to: "/tasks", label: "Tasks", icon: CheckSquare },
  { to: "/calendar", label: "Calendar", icon: Calendar },
  { to: "/settings", label: "Settings", icon: SettingsIcon },
];

export default function Sidebar({ open, onClose, isCollapsed, onToggleCollapse }) {
  return (
    <>
      {/* Mobile Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Main Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 transform bg-slate-900 text-slate-200 will-change-[width] transition-[width] duration-200 ease-in-out lg:translate-x-0 overflow-hidden ${
          open ? "translate-x-0" : "-translate-x-full"
        } ${isCollapsed ? "lg:w-20" : "lg:w-64"} w-64`}
      >
        {/* Header: Open hone par NovaCRM + Menu, Close hone par Sirf Menu */}
        <div
          className={`flex h-16 items-center border-b border-slate-800 transition-none ${
            isCollapsed ? "justify-center px-0" : "justify-between px-5"
          }`}
        >
          {/* Logo (Collapse par bilkul render nahi hoga) */}
          {!isCollapsed && (
            <span className="text-xl font-bold tracking-tight text-white whitespace-nowrap">
              Nova<span className="text-indigo-400">CRM</span>
            </span>
          )}

          {/* Desktop Toggle Button (Hamburger) */}
          <button
            onClick={onToggleCollapse}
            className="hidden lg:flex items-center justify-center rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-label="Toggle sidebar collapse"
          >
            <Menu size={20} />
          </button>

          {/* Mobile Close Button */}
          <button
            onClick={onClose}
            className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-white lg:hidden"
            aria-label="Close sidebar"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="mt-4 space-y-1.5 px-3">
          {links.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={onClose}
              title={isCollapsed ? label : undefined}
              className={({ isActive }) =>
                `flex items-center rounded-lg py-2.5 font-medium transition-colors ${
                  isCollapsed ? "justify-center px-0" : "gap-3 px-3.5 text-sm"
                } ${
                  isActive
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }`
              }
            >
              <Icon size={20} className="shrink-0" />
              {!isCollapsed && (
                <span className="truncate whitespace-nowrap">{label}</span>
              )}
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  );
}