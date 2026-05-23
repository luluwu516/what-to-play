import { Link } from "react-router";

export function PageHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <header className="flex items-center justify-between gap-4 mb-8">
      <Link
        to="/"
        className="btn-sticker active:btn-sticker-active bg-white text-base px-4 py-2"
      >
        ← Home
      </Link>
      <div className="text-right">
        <h1 className="text-2xl sm:text-3xl font-extrabold">{title}</h1>
        {subtitle && <p className="text-cocoa/60 text-sm">{subtitle}</p>}
      </div>
    </header>
  );
}
