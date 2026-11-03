import { MAX_DECOR_LEVEL, MAX_LEVEL, GEAR_CAP } from "./economy";
import { ITEMS } from "./items";
import type { GameState } from "./types";

export const SAVE_KEY = "burrowkeep-cpu-v1";
const validId = (id: unknown): id is string =>
  typeof id === "string" && /^[a-z0-9]{8,32}$/i.test(id);
const integer = (n: unknown, fallback = 0) =>
  typeof n === "number" && Number.isSafeInteger(n) && n >= 0 ? n : fallback;

export function fresh(ref: string | null = null): GameState {
  const minerId = crypto.randomUUID().replace(/-/g, "").slice(0, 12);
  return {
    version: 2,
    ore: 0,
    iron: 0,
    silver: 0,
    gold: 0,
    satiety: 3,
    hamster: 1,
    gear: 1,
    owned: [],
    levels: {},
    snackUntil: 0,
    snackReady: 0,
    minerId,
    refId: validId(ref) && ref !== minerId ? ref : "",
    welcomed: false,
    totalHashes: 0,
    shares: 0,
    friendOre: 0,
    bank: 0,
    unsentOre: 0,
    hungerMs: 0,
  };
}

export function parseSave(
  raw: string | null,
  ref: string | null = null,
): GameState {
  try {
    const p = JSON.parse(raw || "null");
    if (!p || ![1, 2].includes(p.version) || !validId(p.minerId))
      return fresh(ref);
    if (
      ![p.ore, p.satiety, p.hamster, p.gear].every(
        (n) => Number.isSafeInteger(n) && n >= 0,
      ) ||
      p.satiety > MAX_LEVEL ||
      p.hamster < 1 ||
      p.hamster > MAX_LEVEL ||
      p.gear < 1 ||
      p.gear > GEAR_CAP
    )
      return fresh(ref);
    const owned = Array.isArray(p.owned)
      ? [
          ...new Set<string>(
            p.owned.filter((id: string) => ITEMS.some((i) => i.id === id)),
          ),
        ]
      : [];
    return {
      version: 2,
      minerId: p.minerId,
      refId: validId(p.refId) && p.refId !== p.minerId ? p.refId : "",
      welcomed: p.welcomed === true,
      ore: p.ore,
      satiety: p.satiety,
      hamster: p.hamster,
      gear: p.gear,
      iron: integer(p.iron),
      silver: integer(p.silver),
      gold: integer(p.gold),
      owned,
      levels: Object.fromEntries(
        owned.map((id) => [
          id,
          Math.min(MAX_DECOR_LEVEL, Math.max(1, integer(p.levels?.[id], 1))),
        ]),
      ),
      snackUntil: integer(p.snackUntil),
      snackReady: integer(p.snackReady),
      totalHashes: integer(p.totalHashes),
      shares: integer(p.shares),
      friendOre: integer(p.friendOre),
      bank: integer(p.bank),
      unsentOre: integer(p.unsentOre),
      hungerMs: integer(p.hungerMs),
    };
  } catch {
    return fresh(ref);
  }
}

export function loadState(): GameState {
  const ref = new URLSearchParams(location.search).get("ref");
  try {
    return parseSave(localStorage.getItem(SAVE_KEY), ref);
  } catch {
    return fresh(ref);
  }
}
export function persist(state: GameState): boolean {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}
