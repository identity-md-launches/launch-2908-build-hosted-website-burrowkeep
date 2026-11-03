// Checks the actual static export at a gateway-style subpath. No writes to the live game API.
import { createRequire } from "node:module";
import { createServer } from "node:http";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { resolve, extname } from "node:path";
import assert from "node:assert/strict";
const require = createRequire(
  process.env.BURROWKEEP_TEST_MODULE_ROOT || import.meta.url,
);
const { chromium, webkit } = require("playwright");
const AxeBuilder = require("@axe-core/playwright").default;
const root = resolve("dist");
const output = resolve("test/scratch/interaction");
await mkdir(output, { recursive: true });
const mime = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
};
const server = createServer(async (req, res) => {
  const path = resolve(
    root,
    decodeURIComponent(new URL(req.url, "http://local").pathname).replace(
      /^\/preview\//,
      "",
    ) || "index.html",
  );
  if (!path.startsWith(root + "/")) return res.writeHead(404).end();
  try {
    res.setHeader("content-type", mime[extname(path)] || "text/plain");
    res.end(await readFile(path));
  } catch {
    res.writeHead(404).end("Not found");
  }
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const url = `http://127.0.0.1:${server.address().port}/preview/`;
const result = { checks: [], errors: [], limitations: [] };
const check = (name, detail = "passed") => {
  result.checks.push({ name, detail });
  console.log(`PASS ${name}: ${detail}`);
};
const API = "https://burrowkeep-api.46.250.250.111.sslip.io";
let browser;
let serviceMode = "empty";
let posts = [];
let miningWorkers = 0;
const readSave = (page) =>
  page.evaluate(() => JSON.parse(localStorage.getItem("burrowkeep-cpu-v1")));
const waitSave = (page, predicate) =>
  page.waitForFunction(predicate, {}, { timeout: 20000 });
const mockApi = async (route) => {
  const req = route.request(),
    path = new URL(req.url()).pathname;
  if (req.method() === "POST") posts.push({ path, body: req.postDataJSON() });
  if (serviceMode === "error")
    return route.fulfill({
      status: 503,
      contentType: "application/json",
      body: '{"error":"test unavailable"}',
    });
  if (serviceMode === "slow") await new Promise((r) => setTimeout(r, 600));
  let body = {};
  if (path === "/api/board")
    body =
      req.method() === "POST"
        ? { ok: true }
        : serviceMode === "rows"
          ? {
              wealth: [{ id: "fixtureminer01", score: 42 }],
              decor: [{ id: "fixtureminer02", score: 18 }],
            }
          : { wealth: [], decor: [] };
  if (path === "/api/hello")
    body = {
      refId: req.postDataJSON().refId || "",
      locked: true,
      bound: !!req.postDataJSON().refId,
    };
  if (path === "/api/pulse")
    body = { ok: true, accepted: req.postDataJSON().ore };
  if (path === "/api/bonus") body = { ore: 0, pendingMilli: 0 };
  return route.fulfill({
    contentType: "application/json",
    body: JSON.stringify(body),
  });
};
try {
  browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    locale: "en-US",
  });
  await context.route(`${API}/**`, mockApi);
  const page = await context.newPage();
  const pageErrors = [];
  const failed = [];
  page.on("pageerror", (e) => pageErrors.push(e.message));
  page.on("response", (r) => {
    if (r.url().startsWith(url) && r.status() >= 400)
      failed.push(`${r.status()} ${r.url()}`);
  });
  page.on("worker", () => miningWorkers++);
  await page.goto(url);
  await page
    .getByRole("button", { name: "Start mining", exact: true })
    .waitFor();
  await page.evaluate(() => document.fonts.ready);
  assert.equal((await readSave(page)).ore, 0);
  assert.equal(miningWorkers, 0);
  check("No mining or fabricated ore before consent");
  for (const width of [320, 390, 600, 768, 850, 1024, 1440]) {
    await page.setViewportSize({ width, height: 844 });
    const dimensions = await page.evaluate(() => ({
      width: document.documentElement.clientWidth,
      scroll: document.documentElement.scrollWidth,
      button: document
        .querySelector(".start-button")
        .getBoundingClientRect()
        .toJSON(),
    }));
    assert.ok(dimensions.scroll <= width, `Overflow at ${width}`);
    if (width === 390) {
      assert.ok(dimensions.button.bottom < 844);
      await page.screenshot({
        path: `${output}/mobile-390.png`,
        fullPage: true,
      });
    }
    if (width === 1440)
      await page.screenshot({
        path: `${output}/desktop-1440.png`,
        fullPage: true,
      });
  }
  check(
    "Reflow at 320, 390, 600, 768, 850, 1024, 1440; main action on first 390 screen",
  );
  await page.setViewportSize({ width: 390, height: 844 });
  const axe = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
    .analyze();
  await writeFile(
    `${output}/axe-initial.json`,
    JSON.stringify(axe.violations, null, 2),
  );
  assert.equal(
    axe.violations.length,
    0,
    JSON.stringify(
      axe.violations.map((v) => ({
        id: v.id,
        nodes: v.nodes.map((n) => n.target),
      })),
    ),
  );
  check("Automated accessibility scan: initial phone view");
  await page.getByRole("button", { name: "How to play", exact: true }).focus();
  await page.keyboard.press("Enter");
  await page.getByRole("dialog").waitFor();
  assert.equal(
    await page.evaluate(() =>
      document.activeElement?.getAttribute("aria-label"),
    ),
    "Close guide",
  );
  await page.keyboard.press("Tab");
  assert.ok(
    await page.evaluate(() => !!document.activeElement.closest("dialog")),
  );
  await page.keyboard.press("Escape");
  assert.equal(
    await page.evaluate(() =>
      document.activeElement?.getAttribute("aria-label"),
    ),
    "How to play",
  );
  check("Help: keyboard opening, modal focus, Escape and focus restoration");
  await page.getByRole("button", { name: "Start mining", exact: true }).focus();
  await page.keyboard.press("Enter");
  await page
    .getByRole("button", { name: "Stop mining", exact: true })
    .waitFor();
  await waitSave(
    page,
    () => JSON.parse(localStorage.getItem("burrowkeep-cpu-v1")).ore >= 1,
  );
  await page.getByRole("button", { name: "Stop mining", exact: true }).click();
  const stopped = await readSave(page);
  assert.ok(stopped.totalHashes >= 400000);
  assert.ok(stopped.ore >= 1);
  assert.equal(miningWorkers, 1);
  await page.waitForTimeout(700);
  assert.equal((await readSave(page)).totalHashes, stopped.totalHashes);
  await page.reload();
  assert.equal((await readSave(page)).ore, stopped.ore);
  assert.equal(
    await page
      .getByRole("button", { name: "Start mining", exact: true })
      .count(),
    1,
  );
  check(
    "Real SHA-256 worker earns ore, stops cleanly, saves and never auto-resumes",
    `${stopped.totalHashes} hashes, ${stopped.ore} ore`,
  );
  // Rich save exists only in this test context to reach purchases promptly. Never sent to the live API.
  await page.addInitScript(() => {
    if (sessionStorage.getItem("fixtureApplied")) return;
    sessionStorage.setItem("fixtureApplied", "1");
    const key = "burrowkeep-cpu-v1";
    const s = JSON.parse(localStorage.getItem(key));
    localStorage.setItem(
      key,
      JSON.stringify({
        ...s,
        ore: 10000,
        iron: 100,
        silver: 100,
        gold: 100,
        satiety: 3,
      }),
    );
  });
  await page.reload();
  await page.getByRole("button", { name: "Feed 8 ore", exact: true }).click();
  assert.equal((await readSave(page)).ore, 9992);
  assert.equal((await readSave(page)).satiety, 4);
  await page
    .getByRole("button", { name: "Upgrade 200 ore", exact: true })
    .click();
  assert.equal((await readSave(page)).hamster, 2);
  assert.equal((await readSave(page)).ore, 9792);
  await page
    .getByRole("button", { name: "Add a rig 200 ore", exact: true })
    .click();
  assert.equal((await readSave(page)).gear, 2);
  assert.equal((await readSave(page)).ore, 9592);
  await page.getByRole("radio", { name: "Full power 2", exact: true }).check();
  const before = miningWorkers;
  await page.getByRole("button", { name: "Start mining", exact: true }).click();
  await page.waitForTimeout(200);
  assert.equal(miningWorkers - before, 2);
  await page.getByRole("button", { name: "Stop mining", exact: true }).click();
  check(
    "Feed, hamster upgrade, rig purchase and two actual full-power workers",
  );
  await page.getByRole("tab", { name: "Home shop", exact: true }).click();
  await page
    .getByRole("button", { name: "Buy Bowl, 2 iron", exact: true })
    .click();
  assert.equal((await readSave(page)).iron, 98);
  await page
    .getByRole("button", { name: "Upgrade Bowl, 2 iron", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Upgrade Bowl, 4 iron", exact: true })
    .click();
  assert.equal((await readSave(page)).levels.bowl, 3);
  assert.ok(
    await page
      .getByRole("button", { name: "Bowl, maximum level", exact: true })
      .isDisabled(),
  );
  await page.getByLabel("Material", { exact: true }).selectOption("silver");
  assert.equal(await page.locator(".shop-item").count(), 5);
  await page
    .getByRole("button", { name: "Buy Snack tin, 4 silver", exact: true })
    .click();
  await page.getByRole("tab", { name: "Care", exact: true }).click();
  await page
    .getByRole("button", { name: "Give a snack 6 ore", exact: true })
    .click();
  assert.ok(
    await page
      .getByRole("button", { name: "Cooling down 6 ore", exact: true })
      .isDisabled(),
  );
  assert.equal((await readSave(page)).satiety, 5);
  check(
    "Shop filter, visible decoration, level cap, snack purchase and cooldown",
  );
  await page.getByRole("tab", { name: "Exchange", exact: true }).click();
  const beforeTrades = await readSave(page);
  await page
    .getByRole("button", { name: "Exchange for iron", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Exchange for silver", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Exchange for gold", exact: true })
    .click();
  const afterTrades = await readSave(page);
  assert.equal(afterTrades.ore, beforeTrades.ore - 100);
  assert.equal(afterTrades.iron, beforeTrades.iron + 1 - 10);
  assert.equal(afterTrades.silver, beforeTrades.silver + 1 - 10);
  assert.equal(afterTrades.gold, beforeTrades.gold + 1);
  check("All three exchanges debit and credit exact amounts");
  for (const mode of ["slow", "empty", "rows", "error"]) {
    serviceMode = mode;
    if (mode === "slow") {
      await page.getByRole("tab", { name: "Leaderboard", exact: true }).click();
      await page
        .getByText("Checking the noticeboard…", { exact: true })
        .waitFor();
    } else
      await page.getByRole("button", { name: "Refresh", exact: true }).click();
    if (mode === "error")
      await page
        .getByText("The noticeboard is out of reach.", { exact: true })
        .waitFor();
    else if (mode === "rows")
      await page.getByText("fixtureminer01", { exact: true }).waitFor();
    else
      await page
        .getByText("Room for the first little legend.", { exact: true })
        .waitFor();
  }
  serviceMode = "empty";
  await page.getByRole("button", { name: "Try again", exact: true }).click();
  await page
    .getByText("Room for the first little legend.", { exact: true })
    .waitFor();
  check(
    "Leaderboard loading, empty, populated, failure and retry states (mock API)",
  );
  await page.getByRole("button", { name: "中文", exact: true }).click();
  assert.equal(await page.locator("html").getAttribute("lang"), "zh-Hans");
  await page.reload();
  assert.equal(await page.locator("html").getAttribute("lang"), "zh-Hans");
  await page.getByRole("button", { name: "English", exact: true }).click();
  check("Chinese/English switch updates document language and persists");
  await page.getByRole("tab", { name: "Care", exact: true }).focus();
  await page.keyboard.press("ArrowRight");
  assert.equal(
    await page
      .getByRole("tab", { name: "Home shop", exact: true })
      .getAttribute("aria-selected"),
    "true",
  );
  await page.keyboard.press("End");
  assert.equal(
    await page
      .getByRole("tab", { name: "Leaderboard", exact: true })
      .getAttribute("aria-selected"),
    "true",
  );
  check("Tabs support Arrow keys, Home/End and selected state");
  await page
    .getByRole("button", { name: "Invite a friend", exact: true })
    .click();
  await page.getByRole("dialog").waitFor();
  const inviteValue = await page
    .getByLabel("Your invite link", { exact: true })
    .inputValue();
  assert.ok(inviteValue.endsWith(`?ref=${(await readSave(page)).minerId}`));
  await page.evaluate(() =>
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: async () => {
          throw new Error("test permission denial");
        },
      },
    }),
  );
  await page
    .getByRole("button", { name: "Copy invite link", exact: true })
    .click();
  await page
    .getByText(
      "Copy is unavailable here. Select the link and copy it manually.",
      { exact: true },
    )
    .waitFor();
  await page.evaluate(() =>
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: async () => {} },
    }),
  );
  await page
    .getByRole("button", { name: "Copy invite link", exact: true })
    .click();
  await page.getByRole("button", { name: "Copied", exact: true }).waitFor();
  serviceMode = "slow";
  await page.getByRole("button", { name: "Sync rewards", exact: true }).click();
  await page.getByRole("button", { name: "Syncing…", exact: true }).waitFor();
  await page
    .getByText("Rewards last synced with the server.", { exact: true })
    .waitFor();
  serviceMode = "error";
  await page.getByRole("button", { name: "Sync rewards", exact: true }).click();
  await page
    .getByText(
      "Rewards are currently unreachable. Your local mining progress is safe; try syncing again.",
      { exact: true },
    )
    .waitFor();
  serviceMode = "empty";
  await page.getByRole("button", { name: "Sync rewards", exact: true }).click();
  await page
    .getByText("Rewards last synced with the server.", { exact: true })
    .waitFor();
  check("Referral sync pending, success, failure and retry (mock API)");
  await page.keyboard.press("Escape");
  check(
    "Referral link correctness and clipboard success/failure feedback (permission mocked)",
  );
  for (const label of ["Care", "Home shop", "Exchange", "Leaderboard"]) {
    await page.getByRole("tab", { name: label, exact: true }).click();
    await page.waitForTimeout(100);
    const scan = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
      .analyze();
    assert.equal(
      scan.violations.length,
      0,
      `${label}: ${JSON.stringify(scan.violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target) })))}`,
    );
  }
  check("Automated accessibility scans: all four workshop panels");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.getByRole("button", { name: "Start mining", exact: true }).click();
  await page.waitForTimeout(100);
  const frame = await page.locator("canvas").evaluate((el) => el.toDataURL());
  await page.waitForTimeout(200);
  assert.equal(
    await page.locator("canvas").evaluate((el) => el.toDataURL()),
    frame,
  );
  await page.getByRole("button", { name: "Stop mining", exact: true }).click();
  check("Reduced motion freezes the room while mining remains usable");
  await page.getByRole("button", { name: "Start mining", exact: true }).click();
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", {
      configurable: true,
      value: true,
    });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await page
    .getByRole("button", { name: "Start mining", exact: true })
    .waitFor();
  await page
    .getByText(
      "Mining paused because you left this tab. Start again when you’re ready.",
      { exact: true },
    )
    .waitFor();
  await page.evaluate(() => {
    delete document.hidden;
  });
  check(
    "Hidden-tab event stops mining with a recoverable notice (visibility simulated)",
  );
  await page.evaluate(() => (document.documentElement.style.fontSize = "200%"));
  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    assert.ok(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      `Text enlargement overflow at ${width}`,
    );
  }
  check(
    "200% text enlargement at mobile and desktop (not native browser zoom)",
  );
  assert.equal(pageErrors.length, 0, pageErrors.join("\n"));
  assert.equal(failed.length, 0, failed.join("\n"));
  check("No uncaught application errors or failed local assets");
  assert.ok(posts.some((p) => p.path === "/api/hello"));
  assert.ok(posts.some((p) => p.path === "/api/pulse"));
  assert.ok(posts.some((p) => p.path === "/api/board"));
  check("Original API request shapes exercised without live writes");
  await context.close();

  const timerContext = await browser.newContext({ locale: "en-US" });
  await timerContext.route(`${API}/**`, mockApi);
  const timerPage = await timerContext.newPage();
  await timerPage.clock.install({ time: new Date() });
  await timerPage.goto(url);
  await timerPage
    .getByRole("button", { name: "Start mining", exact: true })
    .click();
  await timerPage.clock.fastForward(75000);
  assert.equal((await readSave(timerPage)).satiety, 2);
  await timerPage
    .getByRole("button", { name: "Stop mining", exact: true })
    .click();
  await timerPage.clock.fastForward(75000);
  assert.equal((await readSave(timerPage)).satiety, 2);
  await timerContext.close();
  check(
    "Hunger consumes food after 75 active seconds and pauses when stopped (virtual clock)",
  );

  const failureContext = await browser.newContext({ locale: "en-US" });
  await failureContext.route(`${API}/**`, mockApi);
  await failureContext.addInitScript(() => {
    Storage.prototype.setItem = () => {
      throw new Error("test blocked storage");
    };
    window.Worker = class {
      constructor() {
        throw new Error("test unavailable worker");
      }
    };
  });
  const failurePage = await failureContext.newPage();
  await failurePage.goto(url);
  await failurePage
    .getByText(
      "Progress is only kept in this tab. Allow browser storage before closing the page.",
      { exact: true },
    )
    .waitFor();
  await failurePage
    .getByRole("button", { name: "Start mining", exact: true })
    .click();
  await failurePage
    .getByText(
      "Mining could not start. Reload this page and try again in a browser that supports Web Workers.",
      { exact: true },
    )
    .waitFor();
  assert.equal(
    await failurePage
      .getByRole("button", { name: "Start mining", exact: true })
      .count(),
    1,
  );
  await failureContext.close();
  check(
    "Blocked storage and unavailable worker show actionable feedback (capabilities mocked)",
  );

  // Try WebKit independently. A missing platform library is recorded, never called a pass.
  let safari;
  try {
    safari = await webkit.launch({ headless: true, timeout: 15000 });
  } catch (e) {
    result.limitations.push(
      `WebKit could not launch: ${e.message.split("\n").slice(0, 5).join(" ")}`,
    );
    console.log("LIMIT WebKit launch unavailable");
  }
  if (safari) {
    const ctx = await safari.newContext({
      viewport: { width: 390, height: 844 },
      locale: "en-US",
    });
    await ctx.route(`${API}/**`, mockApi);
    const p = await ctx.newPage();
    await p.goto(url);
    await p.getByRole("button", { name: "Start mining", exact: true }).click();
    await waitSave(
      p,
      () => JSON.parse(localStorage.getItem("burrowkeep-cpu-v1")).ore >= 1,
    );
    await p.getByRole("button", { name: "Stop mining", exact: true }).click();
    assert.ok((await readSave(p)).totalHashes >= 400000);
    assert.ok(
      await p.evaluate(() => document.documentElement.scrollWidth <= 390),
    );
    await p.screenshot({ path: `${output}/webkit-390.png`, fullPage: true });
    check("WebKit: real mining, stop and mobile reflow");
    await safari.close();
  }
} catch (error) {
  result.errors.push(error.stack);
  console.error(error.stack);
  process.exitCode = 1;
} finally {
  if (browser) await browser.close();
  server.close();
  await writeFile(`${output}/results.json`, JSON.stringify(result, null, 2));
}
