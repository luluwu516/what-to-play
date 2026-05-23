import { ALLOWED_WEIGHTS, type AllowedWeight } from "@/lib/weight";

export function WeightStepper({
  value,
  onChange,
}: {
  value: AllowedWeight;
  onChange: (next: AllowedWeight) => void;
}) {
  return (
    <div className="flex gap-1 flex-wrap">
      {ALLOWED_WEIGHTS.map((w) => {
        const active = w === value;
        return (
          <button
            key={w}
            type="button"
            onClick={() => onChange(w)}
            className={`px-2 py-1 rounded-lg border-2 border-cocoa text-xs font-bold transition
              ${active ? "bg-tangerine text-cocoa" : "bg-white text-cocoa/60 hover:bg-cream"}`}
          >
            {w}x
          </button>
        );
      })}
    </div>
  );
}
