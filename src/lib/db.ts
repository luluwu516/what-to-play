import Dexie, { type Table } from "dexie";
import type { GameRecord } from "./types";

class WellWheelDB extends Dexie {
  games!: Table<GameRecord, number>;

  constructor() {
    super("wellwheel");
    this.version(1).stores({
      // primary key is `id` (assigned by us, not autoincrement, since BGG
      // ids are positive and manual entries get negative ids).
      // secondary indexes for fast list ordering.
      games: "id, created_at",
    });
  }
}

export const db = new WellWheelDB();
