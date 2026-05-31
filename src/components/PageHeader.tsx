import { Link } from "react-router";

export function PageHeader({
  title,
  subtitle,
  backTo = "/",
  backLabel = "Home",
}: {
  title: string;
  subtitle?: string;
  backTo?: string;
  backLabel?: string;
}) {
  // Going home shows a 🏠 icon; going back one page shows ←. On phones we show
  // just the icon/arrow; the text label appears from sm: up.
  const isHome = backTo === "/";
  return (
    <header className="flex items-center justify-between gap-4 mb-8">
      <Link
        to={backTo}
        aria-label={isHome ? "Home" : backLabel}
        className="btn-sticker active:btn-sticker-active bg-white text-base px-4 py-2"
      >
        <span aria-hidden>{isHome ? "🏠" : "←"}</span>
        <span className="hidden sm:inline"> {backLabel}</span>
      </Link>
      <div className="text-right">
        <h1 className="text-2xl sm:text-3xl font-extrabold">{title}</h1>
        {subtitle && <p className="text-cocoa/60 text-sm">{subtitle}</p>}
      </div>
    </header>
  );
}
