// Render share artwork from the actual game canvas. Run against a production preview.
import { createRequire } from "node:module";
import { readdir, readFile } from "node:fs/promises";
const require = createRequire(
  process.env.BURROWKEEP_TEST_MODULE_ROOT || import.meta.url,
);
const { chromium } = require("playwright");
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({
    viewport: { width: 1200, height: 630 },
    deviceScaleFactor: 1,
  });
  await page.route(
    "https://burrowkeep-api.46.250.250.111.sslip.io/**",
    (route) =>
      route.fulfill({
        contentType: "application/json",
        body: '{"wealth":[],"decor":[]}',
      }),
  );
  await page.goto(process.argv[2] || "http://127.0.0.1:8765/");
  await page.locator("canvas").waitFor();
  await page.waitForTimeout(150);
  const room = await page.locator("canvas").evaluate((c) => c.toDataURL());
  const assets = await readdir("dist/assets");
  const font = await readFile(
    `dist/assets/${assets.find((n) => n.startsWith("fraunces-latin"))}`,
  );
  const sans = await readFile(
    `dist/assets/${assets.find((n) => n.startsWith("dm-sans-latin"))}`,
  );
  const mark = await readFile("public/favicon.svg", "utf8");
  await page.setContent(`<style>
    @font-face{font-family:Display;src:url(data:font/woff2;base64,${font.toString("base64")})} @font-face{font-family:Body;src:url(data:font/woff2;base64,${sans.toString("base64")})}
    *{box-sizing:border-box}body{margin:0;background:#f6f3eb;color:#342f26;font-family:Body} .card{width:1200px;height:630px;padding:44px 48px;position:relative;overflow:hidden} .brand{display:flex;gap:12px;align-items:center;font:700 32px Display}.brand svg{width:44px;height:44px}.body{display:flex;align-items:center;gap:48px;margin-top:64px}.copy{width:410px;flex-shrink:0}h1{font:600 64px/1.05 Display;letter-spacing:-3px;margin:0 0 24px}p{font:400 22px/1.5 Body;color:#716957;max-width:350px;margin:0}.room{border:8px solid #34241a;border-radius:16px;image-rendering:pixelated;width:700px;height:350px;object-fit:cover;object-position:right;flex-shrink:0}.bottom{position:absolute;bottom:40px;font:400 16px Body;color:#716957;display:flex;align-items:center;gap:10px}.dot{width:8px;height:8px;border-radius:50%;background:#516647}
    </style><div class="card"><div class="brand">${mark}<span>burrowkeep.</span></div><div class="body"><div class="copy"><h1>Small paws.<br>Big plans.</h1><p>A cozy mining game, powered by your browser.</p></div><img class="room" src="${room}"/></div><div class="bottom"><span class="dot"></span>Mine ore. Raise a hamster. Make a home.</div></div>`);
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: "public/share.png" });
  await page.setViewportSize({ width: 180, height: 180 });
  await page.setContent(
    `<style>body{margin:0}svg{width:180px;height:180px}</style>${mark}`,
  );
  await page.screenshot({ path: "public/icon.png", omitBackground: true });
  console.log(
    "Generated public/share.png (1200×630) and public/icon.png (180×180) from local assets.",
  );
} finally {
  await browser.close();
}
