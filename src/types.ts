export type Language = "en" | "zh";
export type Currency = "ore" | "iron" | "silver" | "gold";
export type Upgrade = "hamster" | "gear";
export interface Price {
  sand: Currency;
  amount: number;
}
export interface Item {
  id: string;
  sand: Currency;
  cost: number;
  decor: number;
  en: string;
  zh: string;
  enNote?: string;
  zhNote?: string;
}
export interface GameState {
  version: 2;
  ore: number;
  iron: number;
  silver: number;
  gold: number;
  satiety: number;
  hamster: number;
  gear: number;
  owned: string[];
  levels: Record<string, number>;
  snackUntil: number;
  snackReady: number;
  minerId: string;
  refId: string;
  welcomed: boolean;
  totalHashes: number;
  shares: number;
  friendOre: number;
  bank: number;
  unsentOre: number;
  hungerMs: number;
}
export interface BoardRow {
  id: string;
  score: number;
}
export interface Board {
  wealth: BoardRow[];
  decor: BoardRow[];
}
export type ServiceStatus = "idle" | "loading" | "ready" | "error";
export interface Snapshot {
  state: GameState;
  running: boolean;
  fullPower: boolean;
  rate: number;
  threads: number;
  board: Board;
  boardStatus: ServiceStatus;
  socialStatus: ServiceStatus;
  pendingMilli: number;
  saved: boolean;
  notice: "" | "worker-error" | "paused";
}
