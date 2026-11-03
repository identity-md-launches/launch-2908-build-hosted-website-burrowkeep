import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash, randomBytes } from "node:crypto";
import {
  upgradeCost,
  upgrade,
  feed,
  snack,
  exchange,
  mintOre,
  hashesPerOre,
  threadsFor,
  GEAR_CAP,
  MAX_LEVEL,
  buyItem,
  upgradeDecor,
  friendOreMilli,
} from "../src/economy";
import { fresh, parseSave } from "../src/storage";
import { sha256, isShare } from "../src/hash";
import { ITEMS, decorTotal } from "../src/items";
import { API, parseBoard } from "../src/api";

test("all hamster prices are identical to a836815", () => {
  assert.deepEqual(
    Array.from({ length: 7 }, (_, i) => upgradeCost("hamster", i + 1)),
    [
      { sand: "ore", amount: 200 },
      { sand: "ore", amount: 800 },
      { sand: "silver", amount: 8 },
      { sand: "silver", amount: 25 },
      { sand: "silver", amount: 70 },
      { sand: "gold", amount: 4 },
      { sand: "gold", amount: 12 },
    ],
  );
  assert.equal(MAX_LEVEL, 8);
});
test("all 31 rig upgrades retain original prices and 32-thread ceiling", () => {
  const expected = [
    200, 500, 1200, 6, 12, 24, 48, 80, 1, 1, 1, 2, 2, 2, 3, 3, 3, 4, 4, 4, 5, 5,
    5, 6, 6, 6, 7, 7, 7, 8, 8,
  ];
  for (let level = 1; level <= 31; level++)
    assert.deepEqual(upgradeCost("gear", level), {
      sand: level <= 3 ? "ore" : level <= 8 ? "silver" : "gold",
      amount: expected[level - 1],
    });
  assert.equal(GEAR_CAP, 32);
  assert.equal(threadsFor(40, 128), 32);
  assert.equal(threadsFor(32, 4), 4);
  assert.equal(threadsFor(32, 0), 1);
});
test("upgrades debit the correct resource once, respect affordability and caps", () => {
  const s = { ...fresh(), ore: 200, silver: 25, gold: 12 };
  const next = upgrade(s, "hamster")!;
  assert.equal(next.ore, 0);
  assert.equal(next.hamster, 2);
  assert.equal(s.ore, 200);
  assert.equal(upgrade(next, "hamster"), null);
  const silver = upgrade({ ...s, hamster: 4 }, "hamster")!;
  assert.equal(silver.silver, 0);
  assert.equal(silver.ore, 200);
  assert.equal(upgrade({ ...s, hamster: 7 }, "hamster")!.gold, 0);
  assert.equal(upgrade({ ...s, hamster: 8 }, "hamster"), null);
  assert.equal(upgrade({ ...s, gear: 32 }, "gear"), null);
});
test("minting, hunger, oil and snack efficiency match the original formula", () => {
  assert.deepEqual(
    [1, 2, 3, 4, 5, 6, 7, 8].map((l) => hashesPerOre(l, false)),
    [400000, 320000, 240000, 160000, 80000, 70000, 60000, 50000],
  );
  assert.equal(hashesPerOre(1, true), 800000);
  assert.equal(hashesPerOre(1, false, 0.9 * 0.8), 288000);
  assert.deepEqual(mintOre(950000, 1, false), {
    ore: 2,
    leftover: 150000,
    need: 400000,
  });
  assert.deepEqual(mintOre(950000, 1, true), {
    ore: 1,
    leftover: 150000,
    need: 800000,
  });
  assert.equal(hashesPerOre(8, false, 0.1), 30000);
});
test("feeding costs eight ore and never exceeds eight food", () => {
  const s = { ...fresh(), ore: 8, satiety: 7 };
  assert.equal(feed(s)!.ore, 0);
  assert.equal(feed(s)!.satiety, 8);
  assert.equal(feed({ ...s, ore: 7 }), null);
  assert.equal(feed({ ...s, satiety: 8 }), null);
});
test("snack requires the tin, costs six, buffs fifteen seconds and cools sixty", () => {
  const s = { ...fresh(), ore: 6, owned: ["tin"], satiety: 8 };
  const next = snack(s, 1000)!;
  assert.equal(next.ore, 0);
  assert.equal(next.satiety, 8);
  assert.equal(next.snackUntil, 16000);
  assert.equal(next.snackReady, 61000);
  assert.equal(snack({ ...next, ore: 6 }, 60999), null);
  assert.notEqual(snack({ ...next, ore: 6 }, 61000), null);
  assert.equal(snack({ ...s, owned: [] }), null);
});
test("three one-way exchange rates are preserved, with no overspending", () => {
  const s = { ...fresh(), ore: 100, iron: 10, silver: 10 };
  assert.deepEqual(
    [exchange(s, "iron")!.ore, exchange(s, "iron")!.iron],
    [0, 11],
  );
  assert.deepEqual(
    [exchange(s, "silver")!.iron, exchange(s, "silver")!.silver],
    [0, 11],
  );
  assert.deepEqual(
    [exchange(s, "gold")!.silver, exchange(s, "gold")!.gold],
    [0, 1],
  );
  assert.equal(exchange(fresh(), "iron"), null);
  assert.equal(exchange(s, "ore"), null);
});
test("all 17 decorations retain prices and decor levels, with no duplicate purchases", () => {
  assert.equal(ITEMS.length, 17);
  assert.deepEqual(
    ITEMS.map((i) => i.cost),
    [2, 3, 3, 4, 5, 6, 8, 2, 3, 3, 4, 4, 2, 2, 3, 3, 4],
  );
  const bowl = ITEMS[0];
  const s = { ...fresh(), iron: 20 };
  const bought = buyItem(s, bowl)!;
  assert.equal(bought.iron, 18);
  assert.equal(decorTotal(bought), 2);
  assert.equal(buyItem(bought, bowl), null);
  const two = upgradeDecor(bought, bowl)!;
  const three = upgradeDecor(two, bowl)!;
  assert.equal(two.iron, 16);
  assert.equal(three.iron, 12);
  assert.equal(decorTotal(three), 6);
  assert.equal(upgradeDecor(three, bowl), null);
});
test("save loading migrates v1 and rejects corrupt resources and over-cap rigs", () => {
  const s = fresh();
  const v1 = { ...s, version: 1 };
  assert.equal(parseSave(JSON.stringify(v1)).version, 2);
  assert.equal(parseSave(JSON.stringify({ ...s, iron: -5 })).iron, 0);
  assert.equal(parseSave(JSON.stringify({ ...s, gear: 33 })).gear, 1);
  assert.equal(parseSave(JSON.stringify({ ...s, hamster: 0 })).hamster, 1);
  assert.equal(parseSave("not json").ore, 0);
  assert.deepEqual(
    parseSave(
      JSON.stringify({
        ...s,
        owned: ["bowl", "invalid", "bowl"],
        levels: { bowl: 99 },
      }),
    ).owned,
    ["bowl"],
  );
  assert.equal(
    parseSave(JSON.stringify({ ...s, owned: ["bowl"], levels: { bowl: 99 } }))
      .levels.bowl,
    3,
  );
});
test("first-visit referral stays locked, never binds a later URL or the player to themself", () => {
  const s = fresh();
  const other = fresh().minerId;
  assert.equal(parseSave(JSON.stringify(s), other).refId, "");
  assert.equal(parseSave(JSON.stringify({ ...s, refId: s.minerId })).refId, "");
  assert.equal(fresh(other).refId, other);
  assert.equal(friendOreMilli(20), 1000);
});
test("API address is pinned and leaderboard parser rejects malformed and unsafe data", () => {
  assert.equal(API, "https://burrowkeep-api.46.250.250.111.sslip.io");
  assert.throws(() => parseBoard({}));
  assert.deepEqual(
    parseBoard({ wealth: [{ id: "<script>", score: 10 }], decor: [] }),
    { wealth: [], decor: [] },
  );
});
test("SHA-256 matches Node crypto, including padding boundaries and mining blocks", () => {
  for (const length of [0, 1, 3, 24, 55, 56, 63, 64, 65, 128, 1024]) {
    const bytes = randomBytes(length);
    assert.equal(
      Buffer.from(sha256(bytes)).toString("hex"),
      createHash("sha256").update(bytes).digest("hex"),
    );
  }
  assert.equal(
    Buffer.from(sha256(new TextEncoder().encode("abc"))).toString("hex"),
    "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
  );
  assert.equal(isShare(new Uint8Array([0, 0, 1])), true);
  assert.equal(isShare(new Uint8Array([0, 1, 0])), false);
});
