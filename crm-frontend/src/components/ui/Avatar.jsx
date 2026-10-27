const colors = [
  "bg-indigo-500",
  "bg-emerald-500",
  "bg-amber-500",
  "bg-rose-500",
  "bg-sky-500",
  "bg-violet-500",
];

const sizes = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-14 w-14 text-lg",
};

export default function Avatar({ name = "", size = "md", src = null }) {
  // Photo ho to photo, warna naam ke initials
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={`shrink-0 rounded-full object-cover ${sizes[size]}`}
      />
    );
  }

  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");

  const colorIndex =
    name.split("").reduce((sum, ch) => sum + ch.charCodeAt(0), 0) %
    colors.length;

  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full font-semibold text-white ${colors[colorIndex]} ${sizes[size]}`}
    >
      {initials}
    </div>
  );
}