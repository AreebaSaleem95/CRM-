export function LoadingState({ text = "Loading..." }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white py-14 text-center text-sm text-slate-500">
      {text}
    </div>
  );
}

export function ErrorState({ message = "Something went wrong" }) {
  return (
    <div className="rounded-xl border border-rose-200 bg-rose-50 py-10 text-center text-sm text-rose-700">
      {message}
    </div>
  );
}