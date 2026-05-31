// SIZE is just the SVG viewBox/coordinate space; the rendered size is driven
// by the host element's responsive width (see `wheel-host` classes below), so
// the wheel shrinks on phones to keep the "Spin" button above the fold.
const SIZE = 280;
const RADIUS = SIZE / 2 - 8;
const CX = SIZE / 2;
const CY = SIZE / 2;

const COLORS = [
  "#FFB6C1",
  "#B9F3DC",
  "#C5B9FF",
  "#FFAA77",
  "#FFF4D6",
  "#FFB6C1",
  "#B9F3DC",
  "#C5B9FF",
];

export function DecorativeWheel() {
  const n = COLORS.length;
  const slice = 360 / n;
  return (
    <div className="wheel-host relative cursor-pointer w-48 sm:w-72 aspect-square">
      <div
        aria-hidden
        className="absolute rounded-full border-2 border-cocoa bg-white shadow-[5px_5px_0_0_var(--cocoa)]"
        style={{ left: 5, top: 5, right: 5, bottom: 5 }}
      />
      <div
        className="absolute left-1/2 -translate-x-1/2 -top-1 z-20"
        style={{
          width: 0,
          height: 0,
          borderLeft: "14px solid transparent",
          borderRight: "14px solid transparent",
          borderTop: "28px solid var(--cocoa)",
          filter: "drop-shadow(0 2px 0 white)",
        }}
      />
      <svg
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        className="wheel-spin relative z-10 w-full h-full"
      >
        {Array.from({ length: n }, (_, i) => {
          const start = -90 + i * slice;
          const end = -90 + (i + 1) * slice;
          return (
            <path
              key={i}
              d={arcPath(CX, CY, RADIUS, start, end)}
              fill={COLORS[i]}
              stroke="var(--cocoa)"
              strokeWidth={2}
            />
          );
        })}
        <circle
          cx={CX}
          cy={CY}
          r={22}
          fill="var(--cocoa)"
          stroke="white"
          strokeWidth={3}
        />
      </svg>
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
