import { motion, useAnimationControls } from "framer-motion";
import { useMemo, useState } from "react";
import type { Game } from "@/lib/types";
import type { AllowedWeight } from "@/lib/weight";

export type WheelSlot = { game: Game; weight: AllowedWeight };

const SLICE_COLORS = [
  "#FFB6C1", // berry
  "#B9F3DC", // mint
  "#C5B9FF", // lavender
  "#FFAA77", // tangerine
  "#FFF4D6", // cream
];

const SIZE = 420;
const RADIUS = SIZE / 2 - 8;
const CX = SIZE / 2;
const CY = SIZE / 2;

type Slice = { game: Game; slotIndex: number };

export function Wheel({
  slots,
  onResult,
}: {
  slots: WheelSlot[];
  onResult: (game: Game) => void;
}) {
  const controls = useAnimationControls();
  const [spinning, setSpinning] = useState(false);
  const [angle, setAngle] = useState(0);

  // Round-robin expand so interleaved (A,B,A,B,B,B) not grouped.
  const expanded = useMemo<Slice[]>(() => {
    const counts = slots.map((s) => Math.round(s.weight * 2));
    const total = counts.reduce((a, b) => a + b, 0);
    const out: Slice[] = [];
    while (out.length < total) {
      for (let i = 0; i < counts.length; i++) {
        if (counts[i] > 0) {
          out.push({ game: slots[i].game, slotIndex: i });
          counts[i]--;
        }
      }
    }
    return out;
  }, [slots]);

  const sliceDeg = expanded.length > 0 ? 360 / expanded.length : 0;

  async function spin() {
    if (spinning || expanded.length === 0) return;
    setSpinning(true);
    const winnerIndex = Math.floor(Math.random() * expanded.length);
    const winner = expanded[winnerIndex].game;
    const jitter = (Math.random() - 0.5) * sliceDeg * 0.6;
    const centerDeg = (winnerIndex + 0.5) * sliceDeg + jitter;
    const spinCount = 5 + Math.floor(Math.random() * 4);

    const current = angle;
    const currentMod = ((current % 360) + 360) % 360;
    const targetMod = ((-centerDeg) % 360 + 360) % 360;
    let delta = targetMod - currentMod;
    if (delta <= 0) delta += 360;
    const next = current + 360 * spinCount + delta;

    await controls.start({
      rotate: next,
      transition: { duration: 4.5, ease: [0.17, 0.67, 0.21, 1] },
    });
    setAngle(next);
    setSpinning(false);
    onResult(winner);
  }

  return (
    <div className="flex flex-col lg:flex-row items-center lg:items-start gap-8 w-full justify-center">
      <div className="flex flex-col items-center gap-6">
        <div className="relative" style={{ width: SIZE, height: SIZE }}>
          <div
            aria-hidden
            className="absolute rounded-full border-[3px] border-cocoa bg-white shadow-[6px_6px_0_0_var(--cocoa)]"
            style={{ left: 4, top: 4, right: 4, bottom: 4 }}
          />
          <div
            className="absolute left-1/2 -translate-x-1/2 -top-2 z-20"
            style={{
              width: 0,
              height: 0,
              borderLeft: "18px solid transparent",
              borderRight: "18px solid transparent",
              borderTop: "32px solid var(--cocoa)",
              filter: "drop-shadow(0 2px 0 white)",
            }}
          />
          <motion.svg
            width={SIZE}
            height={SIZE}
            viewBox={`0 0 ${SIZE} ${SIZE}`}
            animate={controls}
            style={{ originX: 0.5, originY: 0.5 }}
            className="relative z-10"
          >
            {expanded.map((slice, i) => {
              const start = -90 + i * sliceDeg;
              const end = -90 + (i + 1) * sliceDeg;
              const path = arcPath(CX, CY, RADIUS, start, end);
              const mid = (start + end) / 2;
              const labelR = RADIUS * 0.7;
              const lx = CX + labelR * Math.cos((mid * Math.PI) / 180);
              const ly = CY + labelR * Math.sin((mid * Math.PI) / 180);
              const fontSize = sliceDeg < 10 ? 16 : sliceDeg < 20 ? 22 : 28;
              return (
                <g key={`${slice.game.id}-${i}`}>
                  <path
                    d={path}
                    fill={SLICE_COLORS[slice.slotIndex % SLICE_COLORS.length]}
                    stroke="var(--cocoa)"
                    strokeWidth={2}
                  />
                  <text
                    x={lx}
                    y={ly}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontSize={fontSize}
                    fontWeight={800}
                    fill="var(--cocoa)"
                    style={{ pointerEvents: "none" }}
                  >
                    {slice.slotIndex + 1}
                  </text>
                </g>
              );
            })}
            <circle
              cx={CX}
              cy={CY}
              r={28}
              fill="var(--cocoa)"
              stroke="white"
              strokeWidth={4}
            />
          </motion.svg>
        </div>
        <button
          type="button"
          onClick={spin}
          disabled={spinning || expanded.length < 2}
          className="btn-sticker active:btn-sticker-active bg-tangerine text-xl px-8 py-4 disabled:opacity-50"
        >
          {spinning ? "Spinning…" : "🎲 Spin"}
        </button>
      </div>
      <Legend slots={slots} />
    </div>
  );
}

function Legend({ slots }: { slots: WheelSlot[] }) {
  if (slots.length === 0) return null;
  return (
    <div className="card-sticker p-4 min-w-[16rem] max-w-sm w-full">
      <h3 className="font-bold mb-2 text-cocoa/80">Legend</h3>
      <ul className="flex flex-col gap-1.5">
        {slots.map((s, i) => (
          <li key={s.game.id} className="flex items-center gap-3 text-sm">
            <span
              className="w-7 h-7 rounded-full border-2 border-cocoa flex items-center justify-center font-bold flex-shrink-0"
              style={{ background: SLICE_COLORS[i % SLICE_COLORS.length] }}
            >
              {i + 1}
            </span>
            <span className="flex-1 truncate font-semibold">{s.game.title}</span>
            <span className="text-cocoa/60 text-xs flex-shrink-0">×{s.weight}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function arcPath(
  cx: number,
  cy: number,
  r: number,
  startDeg: number,
  endDeg: number,
): string {
  const start = (startDeg * Math.PI) / 180;
  const end = (endDeg * Math.PI) / 180;
  const x1 = cx + r * Math.cos(start);
  const y1 = cy + r * Math.sin(start);
  const x2 = cx + r * Math.cos(end);
  const y2 = cy + r * Math.sin(end);
  const largeArc = endDeg - startDeg > 180 ? 1 : 0;
  return `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`;
}
