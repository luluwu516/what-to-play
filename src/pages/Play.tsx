import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { PageHeader } from "@/components/PageHeader";
import { GameCover } from "@/components/GameCover";
import { StatusBadge } from "@/components/StatusBadge";
import { WeightStepper } from "@/components/WeightStepper";
import { Wheel, type WheelSlot } from "@/components/Wheel";
import { listGames } from "@/lib/repo";
import { defaultWeightFor, type AllowedWeight } from "@/lib/weight";
import type { Game } from "@/lib/types";

type Step = "filter" | "select" | "spin" | "result";

export function Play() {
  const allGames = useLiveQuery(() => listGames(), []);
  const [step, setStep] = useState<Step>("filter");
  const [players, setPlayers] = useState(4);
  const [time, setTime] = useState(60);
  const [slots, setSlots] = useState<Map<number, AllowedWeight>>(new Map());
  const [winner, setWinner] = useState<Game | null>(null);

  const candidates: Game[] = (allGames ?? []).filter((g) => {
    const minOk = g.min_players == null || g.min_players <= players;
    const maxOk = g.max_players == null || g.max_players >= players;
    const timeOk = g.playing_time == null || g.playing_time <= time;
    return minOk && maxOk && timeOk;
  });

  const wheelSlots: WheelSlot[] = Array.from(slots.entries())
    .map(([id, weight]) => {
      const game = (allGames ?? []).find((g) => g.id === id);
      return game ? { game, weight } : null;
    })
    .filter((x): x is WheelSlot => x !== null);

  function reset() {
    setSlots(new Map());
    setWinner(null);
    setStep("filter");
  }

  function handleWinner(g: Game) {
    setWinner(g);
    setStep("result");
  }

  return (
    <main className="flex-1 max-w-5xl w-full mx-auto px-6 py-8">
      <PageHeader
        title={
          step === "filter"
            ? "Set conditions"
            : step === "select"
              ? "Pick candidates"
              : step === "spin"
                ? "Wheel of fate"
                : "And the winner is…"
        }
        subtitle={`Step ${["filter", "select", "spin", "result"].indexOf(step) + 1} / 4`}
      />

      {step === "filter" && (
        <FilterView
          players={players}
          time={time}
          onPlayers={setPlayers}
          onTime={setTime}
          onNext={() => setStep("select")}
        />
      )}

      {step === "select" && (
        <SelectView
          candidates={candidates}
          slots={slots}
          onChange={setSlots}
          onBack={() => setStep("filter")}
          onNext={() => setStep("spin")}
        />
      )}

      {step === "spin" && (
        <div className="flex flex-col items-center gap-6">
          <Wheel slots={wheelSlots} onResult={handleWinner} />
          <button
            type="button"
            onClick={() => setStep("select")}
            className="text-sm text-cocoa/60 underline"
          >
            ← Back to selection
          </button>
        </div>
      )}

      {step === "result" && winner && (
        <ResultView
          game={winner}
          onSpinAgain={() => {
            setWinner(null);
            setStep("spin");
          }}
          onReset={reset}
        />
      )}
    </main>
  );
}

function FilterView({
  players,
  time,
  onPlayers,
  onTime,
  onNext,
}: {
  players: number;
  time: number;
  onPlayers: (v: number) => void;
  onTime: (v: number) => void;
  onNext: () => void;
}) {
  return (
    <section className="card-sticker p-8 max-w-md mx-auto flex flex-col gap-6">
      <NumberRow
        label="🧑‍🤝‍🧑 Players"
        value={players}
        min={1}
        step={1}
        onChange={onPlayers}
      />
      <NumberRow
        label="⏱ Time available (min)"
        value={time}
        min={5}
        step={5}
        onChange={onTime}
      />
      <button
        type="button"
        onClick={onNext}
        className="btn-sticker active:btn-sticker-active bg-tangerine text-lg self-end"
      >
        See candidates →
      </button>
    </section>
  );
}

function NumberRow({
  label,
  value,
  min,
  step,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  step: number;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <label className="font-bold mb-2 block">{label}</label>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => onChange(Math.max(min, value - step))}
          className="btn-sticker active:btn-sticker-active bg-berry w-12 h-12 p-0"
        >
          –
        </button>
        <div className="text-3xl font-bold w-20 text-center">{value}</div>
        <button
          type="button"
          onClick={() => onChange(value + step)}
          className="btn-sticker active:btn-sticker-active bg-mint w-12 h-12 p-0"
        >
          +
        </button>
      </div>
    </div>
  );
}

function SelectView({
  candidates,
  slots,
  onChange,
  onBack,
  onNext,
}: {
  candidates: Game[];
  slots: Map<number, AllowedWeight>;
  onChange: (next: Map<number, AllowedWeight>) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  if (candidates.length === 0) {
    return (
      <div className="text-center py-16 flex flex-col items-center gap-4">
        <p className="text-2xl">🥲 No games match</p>
        <button
          type="button"
          onClick={onBack}
          className="btn-sticker active:btn-sticker-active bg-mint"
        >
          ← Adjust filters
        </button>
      </div>
    );
  }

  function toggle(game: Game) {
    const next = new Map(slots);
    if (next.has(game.id)) {
      next.delete(game.id);
    } else {
      const def = defaultWeightFor(game);
      next.set(game.id, def as AllowedWeight);
    }
    onChange(next);
  }

  function setWeight(id: number, w: AllowedWeight) {
    const next = new Map(slots);
    next.set(id, w);
    onChange(next);
  }

  return (
    <div className="pb-32">
      <p className="text-cocoa/70 mb-4">
        {candidates.length} games match. Tap a card to add it, then tweak its weight (chance).
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {candidates.map((g) => {
          const selected = slots.has(g.id);
          const weight = slots.get(g.id) ?? (defaultWeightFor(g) as AllowedWeight);
          return (
            // The whole card is the toggle target (not just the image). The
            // weight stepper stops propagation so tweaking it doesn't deselect.
            <div
              key={g.id}
              role="button"
              tabIndex={0}
              aria-pressed={selected}
              onClick={() => toggle(g)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  toggle(g);
                }
              }}
              className={`card-sticker overflow-hidden flex flex-col cursor-pointer transition ${
                selected ? "ring-4 ring-tangerine/70" : ""
              }`}
            >
              <div className="relative w-full aspect-square bg-cream overflow-hidden">
                <GameCover
                  src={g.image_url}
                  alt={g.title}
                  className="absolute inset-0 w-full h-full"
                />
                <div className="absolute top-2 left-2 flex gap-1 z-10">
                  <StatusBadge game={g} />
                </div>
                {selected && (
                  <div className="absolute top-2 right-2 z-10 bg-tangerine border-2 border-cocoa rounded-full w-9 h-9 flex items-center justify-center text-lg font-bold">
                    ✓
                  </div>
                )}
              </div>
              <div className="p-3 flex flex-col gap-2">
                <h3 className="font-bold leading-tight line-clamp-2">{g.title}</h3>
                <div className="text-xs text-cocoa/70 flex gap-2">
                  <span>👥 {g.min_players}–{g.max_players}</span>
                  <span>⏱ {g.playing_time}m</span>
                </div>
                {selected && (
                  <div onClick={(e) => e.stopPropagation()}>
                    <WeightStepper
                      value={weight}
                      onChange={(w) => setWeight(g.id, w)}
                    />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <div className="fixed bottom-0 left-0 right-0 z-30 bg-paper/95 backdrop-blur border-t-2 border-cocoa p-4 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          aria-label="Back to filters"
          className="btn-sticker active:btn-sticker-active bg-white"
        >
          <span aria-hidden>←</span>
          <span className="hidden sm:inline"> Filters</span>
        </button>
        <span className="font-bold">{slots.size} selected</span>
        <button
          type="button"
          onClick={onNext}
          disabled={slots.size < 2}
          aria-label="To the wheel"
          className="btn-sticker active:btn-sticker-active bg-tangerine disabled:opacity-50"
        >
          <span className="hidden sm:inline">To the wheel </span>
          <span aria-hidden>→</span>
        </button>
      </div>
    </div>
  );
}

function ResultView({
  game,
  onSpinAgain,
  onReset,
}: {
  game: Game;
  onSpinAgain: () => void;
  onReset: () => void;
}) {
  return (
    <section className="flex flex-col items-center gap-6">
      <p className="text-2xl">🎉 Tonight you&apos;ll play…</p>
      <div className="card-sticker p-6 max-w-sm w-full flex flex-col items-center gap-4 animate-bounce-once">
        <div className="w-48 h-48 rounded-2xl overflow-hidden border-2 border-cocoa">
          <GameCover
            src={game.image_url}
            alt={game.title}
            className="w-full h-full"
          />
        </div>
        <h2 className="text-2xl font-extrabold text-center">{game.title}</h2>
        <div className="text-sm text-cocoa/70 flex gap-3">
          <span>👥 {game.min_players}–{game.max_players}</span>
          <span>⏱ {game.playing_time}m</span>
        </div>
      </div>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={onSpinAgain}
          className="btn-sticker active:btn-sticker-active bg-lavender"
        >
          🔄 Spin again
        </button>
        <button
          type="button"
          onClick={onReset}
          className="btn-sticker active:btn-sticker-active bg-mint"
        >
          🧹 Reset
        </button>
      </div>
    </section>
  );
}
