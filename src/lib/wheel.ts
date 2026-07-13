import type { Game } from "./types";
import type { AllowedWeight } from "./weight";

export type WheelSlot = { game: Game; weight: AllowedWeight };
export type Slice = { game: Game; slotIndex: number };

// Turn weighted slots into concrete wheel slices. Each 0.5 of weight becomes
// one slice (round(weight*2)), and we round-robin across slots so slices
// interleave (A,B,A,B,B,B) rather than clumping all of A then all of B.
export function expandSlots(slots: WheelSlot[]): Slice[] {
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
}
