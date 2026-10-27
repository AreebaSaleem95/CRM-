import { SearchX } from "lucide-react";

export default function EmptyState({
  title = "No results found",
  message = "Try changing your search or filters.",
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white py-14 text-center">
      <SearchX size={36} className="text-slate-400" />
      <h3 className="mt-3 text-base font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-slate-500">{message}</p>
    </div>
  );
}