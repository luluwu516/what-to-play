import type { Game } from "@/lib/types";

export function StatusBadge({
  game,
  onDismissNew,
}: {
  game: Game;
  onDismissNew?: () => void;
}) {
  if (!game.is_new) return null;
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-tangerine border-2 border-cocoa pl-2 pr-1 py-0.5 text-xs font-bold">
      ✨ NEW
      {onDismissNew && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDismissNew();
          }}
          aria-label="Dismiss new tag"
          title="Not actually a new game"
          className="ml-0.5 w-4 h-4 rounded-full bg-white/70 hover:bg-white text-cocoa flex items-center justify-center leading-none"
        >
          ×
        </button>
      )}
    </span>
  );
}
