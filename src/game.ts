import {
  buyItem,
  exchange,
  feed,
  hashesPerOre,
  mintOre,
  snack,
  threadsFor,
  upgrade,
  upgradeDecor,
} from "./economy";
import { decorTotal } from "./items";
import { loadState, persist } from "./storage";
import { parseBoard, request } from "./api";
import type { Currency, GameState, Item, Snapshot, Upgrade } from "./types";

export class Game {
  private listeners = new Set<() => void>();
  private workers: Worker[] = [];
  private samples: { at: number; hashes: number }[] = [];
  private lastTick = Date.now();
  private lastSave = 0;
  private timer?: ReturnType<typeof setInterval>;
  private serviceTimer?: ReturnType<typeof setInterval>;
  private syncing = false;
  private readingBoard = false;
  private postedKey = "";
  readonly cores = Math.max(1, navigator.hardwareConcurrency || 1);
  private snapshot: Snapshot;

  constructor() {
    const state = loadState();
    this.snapshot = {
      state,
      running: false,
      fullPower: false,
      rate: 0,
      threads: 1,
      board: { wealth: [], decor: [] },
      boardStatus: "loading",
      socialStatus: "idle",
      pendingMilli: 0,
      saved: persist(state),
      notice: "",
    };
  }
  getSnapshot = () => this.snapshot;
  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };
  private publish(patch: Partial<Snapshot> = {}) {
    this.snapshot = { ...this.snapshot, ...patch };
    this.listeners.forEach((fn) => fn());
  }
  private save() {
    const saved = persist(this.snapshot.state);
    this.snapshot = { ...this.snapshot, saved };
    this.lastSave = Date.now();
  }
  mount = () => {
    this.timer = setInterval(this.tick, 500);
    this.serviceTimer = setInterval(() => {
      if (document.hidden) return;
      if (this.snapshot.running) void this.sync();
    }, 5000);
    document.addEventListener("visibilitychange", this.onVisibility);
    window.addEventListener("pagehide", this.onPageHide);
    void this.refreshBoard();
    return () => {
      clearInterval(this.timer);
      clearInterval(this.serviceTimer);
      document.removeEventListener("visibilitychange", this.onVisibility);
      window.removeEventListener("pagehide", this.onPageHide);
      this.stop();
    };
  };
  private onVisibility = () => {
    if (document.hidden && this.snapshot.running) {
      this.stop();
      this.publish({ notice: "paused" });
    }
  };
  private onPageHide = () => this.stop();
  ease = () =>
    (this.snapshot.state.owned.includes("oil") ? 0.9 : 1) *
    (this.snapshot.state.snackUntil > Date.now() ? 0.8 : 1);
  need = () =>
    hashesPerOre(
      this.snapshot.state.hamster,
      this.snapshot.state.satiety === 0,
      this.ease(),
    );

  start = () => {
    this.stop();
    const threads = this.snapshot.fullPower
      ? threadsFor(this.snapshot.state.gear, this.cores)
      : 1;
    this.lastTick = Date.now();
    this.samples = [];
    this.publish({ running: true, rate: 0, notice: "", threads });
    try {
      for (let i = 0; i < threads; i++) {
        const worker = new Worker(new URL("./worker.ts", import.meta.url), {
          type: "module",
        });
        worker.onmessage = (
          event: MessageEvent<{ hashes: number; shares: number }>,
        ) => {
          if (!this.snapshot.running) return;
          const { hashes, shares } = event.data;
          if (
            !Number.isSafeInteger(hashes) ||
            hashes < 0 ||
            !Number.isSafeInteger(shares) ||
            shares < 0
          )
            return;
          const s = this.snapshot.state;
          this.snapshot = {
            ...this.snapshot,
            state: {
              ...s,
              bank: s.bank + hashes,
              totalHashes: s.totalHashes + hashes,
              shares: s.shares + shares,
            },
          };
          this.samples.push({ at: Date.now(), hashes });
        };
        worker.onerror = () => {
          this.stop();
          this.publish({ notice: "worker-error" });
        };
        worker.postMessage({ type: "start" });
        this.workers.push(worker);
      }
      void this.sync();
    } catch {
      this.stop();
      this.publish({ notice: "worker-error" });
    }
  };
  stop = () => {
    this.workers.forEach((worker) => worker.terminate());
    this.workers = [];
    this.tick();
    this.snapshot = { ...this.snapshot, running: false, rate: 0 };
    this.save();
    this.publish();
  };
  setPower = (fullPower: boolean) => {
    const running = this.snapshot.running;
    if (running) this.stop();
    this.publish({
      fullPower,
      threads: fullPower ? threadsFor(this.snapshot.state.gear, this.cores) : 1,
    });
    if (running) this.start();
  };
  private tick = () => {
    const now = Date.now();
    let state = this.snapshot.state;
    if (this.snapshot.running || state.bank > 0) {
      const minted = mintOre(
        state.bank,
        state.hamster,
        state.satiety === 0,
        this.ease(),
      );
      let hungerMs =
        state.hungerMs + (this.snapshot.running ? now - this.lastTick : 0);
      let satiety = state.satiety;
      const hungerEvery = state.owned.includes("nest") ? 120000 : 75000;
      if (hungerMs >= hungerEvery) {
        satiety = Math.max(0, satiety - Math.floor(hungerMs / hungerEvery));
        hungerMs %= hungerEvery;
      }
      state = {
        ...state,
        bank: minted.leftover,
        ore: state.ore + minted.ore,
        unsentOre: state.unsentOre + minted.ore,
        satiety,
        hungerMs,
      };
    }
    this.lastTick = now;
    this.samples = this.samples.filter((row) => now - row.at < 4000);
    const seconds = this.samples.length
      ? Math.max(1, (now - this.samples[0].at) / 1000)
      : 1;
    const rate = this.snapshot.running
      ? this.samples.reduce((sum, row) => sum + row.hashes, 0) / seconds
      : 0;
    this.snapshot = { ...this.snapshot, state, rate };
    if (now - this.lastSave > 3000) this.save();
    this.publish();
  };
  private apply(next: GameState | null) {
    if (!next) return false;
    const gearChanged = next.gear !== this.snapshot.state.gear;
    this.snapshot = { ...this.snapshot, state: next };
    this.save();
    this.publish();
    if (gearChanged) this.setPower(this.snapshot.fullPower);
    if (next.welcomed) void this.sync();
    return true;
  }
  feed = () => this.apply(feed(this.snapshot.state));
  upgrade = (kind: Upgrade) => this.apply(upgrade(this.snapshot.state, kind));
  exchange = (kind: Currency) =>
    this.apply(exchange(this.snapshot.state, kind));
  buy = (item: Item) =>
    this.apply(
      this.snapshot.state.owned.includes(item.id)
        ? upgradeDecor(this.snapshot.state, item)
        : buyItem(this.snapshot.state, item),
    );
  snack = () => this.apply(snack(this.snapshot.state));
  dismissNotice = () => this.publish({ notice: "" });

  refreshBoard = async () => {
    if (this.readingBoard) return;
    this.readingBoard = true;
    this.publish({ boardStatus: "loading" });
    try {
      const board = parseBoard(await request("/api/board"));
      this.publish({ board, boardStatus: "ready" });
    } catch {
      this.publish({ boardStatus: "error" });
    } finally {
      this.readingBoard = false;
    }
  };
  sync = async () => {
    if (this.syncing) return;
    this.syncing = true;
    this.publish({ socialStatus: "loading" });
    try {
      let s = this.snapshot.state;
      if (!s.welcomed) {
        const hello = (await request("/api/hello", {
          minerId: s.minerId,
          refId: s.refId,
        })) as { refId?: unknown; locked?: boolean };
        if (
          hello.locked !== true ||
          typeof hello.refId !== "string" ||
          (hello.refId && !/^[a-z0-9]{8,32}$/i.test(hello.refId))
        )
          throw new Error("Invalid hello");
        this.snapshot = {
          ...this.snapshot,
          state: { ...this.snapshot.state, welcomed: true, refId: hello.refId },
        };
        this.save();
      }
      s = this.snapshot.state;
      if (s.unsentOre > 0) {
        const amount = Math.min(100000, s.unsentOre);
        const pulse = (await request("/api/pulse", {
          minerId: s.minerId,
          ore: amount,
        })) as { ok?: boolean; accepted?: number };
        if (
          pulse.ok !== true ||
          !Number.isSafeInteger(pulse.accepted) ||
          pulse.accepted! < 0 ||
          pulse.accepted! > amount
        )
          throw new Error("Invalid pulse");
        this.snapshot = {
          ...this.snapshot,
          state: {
            ...this.snapshot.state,
            unsentOre: Math.max(
              0,
              this.snapshot.state.unsentOre - pulse.accepted!,
            ),
          },
        };
      }
      const bonus = (await request(`/api/bonus?id=${s.minerId}`)) as {
        ore?: number;
        pendingMilli?: number;
      };
      if (
        !Number.isSafeInteger(bonus.ore) ||
        bonus.ore! < 0 ||
        !Number.isSafeInteger(bonus.pendingMilli) ||
        bonus.pendingMilli! < 0
      )
        throw new Error("Invalid bonus");
      s = this.snapshot.state;
      this.snapshot = {
        ...this.snapshot,
        pendingMilli: bonus.pendingMilli!,
        state: {
          ...s,
          ore: s.ore + bonus.ore!,
          friendOre: s.friendOre + bonus.ore!,
        },
      };
      s = this.snapshot.state;
      const decor = decorTotal(s);
      const key = `${s.minerId}:${s.gold}:${decor}`;
      if (key !== this.postedKey) {
        await request("/api/board", {
          minerId: s.minerId,
          gold: s.gold,
          decor,
        });
        this.postedKey = key;
        void this.refreshBoard();
      }
      this.save();
      this.publish({ socialStatus: "ready" });
    } catch {
      this.save();
      this.publish({ socialStatus: "error" });
    } finally {
      this.syncing = false;
    }
  };
}
