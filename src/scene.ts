// Pixel room adapted from beibei030/burrowkeep@a836815.
// Changes: encapsulated renderer, typed input, capped frame rate by caller, reduced-motion support.
import type { Snapshot } from "./types";
const WORLD_W = 192;
const WORLD_H = 96;
const PIXEL = 5;
export function createRoomRenderer(canvas: HTMLCanvasElement) {
  let roomScratch: HTMLCanvasElement | null = null;
  let angle = 0;
  let previousOre: number | null = null;
  let pops: { life: number; ore: number }[] = [];
  return (snapshot: Snapshot, now: number, animate: boolean) => {
    const state = snapshot.state;
    const running = snapshot.running && animate;
    const shownRate = snapshot.rate;
    const itemLevel = (id: string) =>
      state.owned.includes(id) ? state.levels[id] || 1 : 0;
    if (animate && previousOre !== null && state.ore > previousOre)
      pops.push({ life: 1.2, ore: state.ore - previousOre });
    previousOre = state.ore;
    if (!animate || !running) pops = [];
    const bufW = WORLD_W * PIXEL;
    const bufH = WORLD_H * PIXEL;
    if (canvas.width !== bufW || canvas.height !== bufH) {
      canvas.width = bufW;
      canvas.height = bufH;
    }
    const pix = new Uint8ClampedArray(WORLD_W * WORLD_H * 4);
    const set = (x: number, y: number, rgb: number) => {
      x = Math.round(x);
      y = Math.round(y);
      if (x < 0 || y < 0 || x >= WORLD_W || y >= WORLD_H) return;
      const i = (y * WORLD_W + x) * 4;
      pix[i] = (rgb >> 16) & 255;
      pix[i + 1] = (rgb >> 8) & 255;
      pix[i + 2] = rgb & 255;
      pix[i + 3] = 255;
    };
    const at = (x: number, y: number) => {
      if (x < 0 || y < 0 || x >= WORLD_W || y >= WORLD_H) return -1;
      const i = (y * WORLD_W + x) * 4;
      if (!pix[i + 3]) return -1;
      return (pix[i] << 16) | (pix[i + 1] << 8) | pix[i + 2];
    };
    const fill = (
      x0: number,
      y0: number,
      w: number,
      h: number,
      rgb: number,
    ) => {
      for (let y = y0; y < y0 + h; y += 1) {
        for (let x = x0; x < x0 + w; x += 1) set(x, y, rgb);
      }
    };
    const ellipse = (
      cx: number,
      cy: number,
      rx: number,
      ry: number,
      rgb: number,
    ) => {
      const rx2 = rx * rx;
      const ry2 = ry * ry;
      for (let y = -ry; y <= ry; y += 1) {
        for (let x = -rx; x <= rx; x += 1) {
          if (x * x * ry2 + y * y * rx2 <= rx2 * ry2) set(cx + x, cy + y, rgb);
        }
      }
    };
    const ring = (
      cx: number,
      cy: number,
      rOut: number,
      rIn: number,
      rgb: number,
    ) => {
      const outer = rOut * rOut;
      const inner = rIn * rIn;
      for (let y = cy - rOut; y <= cy + rOut; y += 1) {
        for (let x = cx - rOut; x <= cx + rOut; x += 1) {
          const d = (x - cx) * (x - cx) + (y - cy) * (y - cy);
          if (d <= outer && d >= inner) set(x, y, rgb);
        }
      }
    };
    const has = (id: string) => (state.owned || []).includes(id);
    const floorY = 74;
    const INK = 0x1c140e;
    const FUR = 0xe0974a;
    const FUR2 = 0xf6c27a;
    const BELLY = 0xf8e2c4;
    const EAR = 0xe56b8a;
    const EYE = 0x1a120c;
    const WOOD = 0xd8c4a2;
    const WOOD2 = 0xb8946a;
    const GOLD = 0xf2b544;

    for (let y = 0; y < floorY; y += 1) {
      for (let x = 0; x < WORLD_W; x += 1) {
        const panel = Math.floor(x / 16) % 2 === 0 ? 0x4e382c : 0x453226;
        const seam = x % 16 === 0;
        const top = y < 8;
        set(x, y, seam ? 0x2c1e16 : top ? 0x3a281e : panel);
      }
    }
    fill(0, floorY - 5, WORLD_W, 5, 0x6b442c);
    fill(0, floorY - 5, WORLD_W, 1, 0x8a5a38);
    for (let y = floorY; y < WORLD_H; y += 1) {
      const row = Math.floor((y - floorY) / 5);
      for (let x = 0; x < WORLD_W; x += 1) {
        const gap = (x + row * 11) % 28 === 0;
        set(x, y, gap ? 0x5c3818 : row % 2 ? 0x8d5a32 : 0xa56b3c);
      }
    }

    const wx = 12;
    const wy = 14;
    fill(wx, wy, 44, 30, 0x6b4428);
    fill(wx + 2, wy + 2, 18, 11, 0xc5ebf6);
    fill(wx + 22, wy + 2, 18, 11, 0x9fd4ea);
    fill(wx + 2, wy + 15, 18, 11, 0x9fd4ea);
    fill(wx + 22, wy + 15, 18, 11, 0xb7e4f4);
    fill(wx + 20, wy + 2, 2, 24, 0xf4efe6);
    fill(wx + 2, wy + 13, 38, 2, 0xf4efe6);
    fill(wx - 1, wy + 28, 46, 3, 0xc4a574);
    if (has("curtain")) {
      fill(wx + 2, wy + 2, 8, 24, 0xc45b55);
      fill(wx + 32, wy + 2, 8, 24, 0xa84842);
      fill(wx + 2, wy + 2, 38, 3, 0x8d3a36);
    }

    if (has("shelf")) {
      fill(70, 22, 36, 3, 0x8a5a32);
      fill(70, 25, 2, 8, 0x6b4428);
      fill(104, 25, 2, 8, 0x6b4428);
      for (let i = 0; i < 4; i += 1) {
        const colors = [0xc45b55, 0x67b36a, 0x7eb0d4, 0xf2b544];
        fill(74 + i * 8, 16, 5, 6, colors[i]);
        set(75 + i * 8, 15, 0xf4efe6);
      }
    }
    if (has("lamp")) {
      fill(112, 10, 2, 16, INK);
      ellipse(113, 28, 5, 3, GOLD);
      ellipse(113, 27, 2, 1, 0xfff1c4);
    }
    if (has("plant")) {
      fill(58, 64, 10, 8, 0x6b3a22);
      fill(57, 62, 12, 3, 0x8a4e2c);
      ellipse(63, 56, 6, 5, 0x2f6b32);
      ellipse(56, 58, 4, 3, 0x67b36a);
      ellipse(70, 57, 4, 3, 0x8fd18a);
    }
    if (has("mat")) {
      fill(8, 78, 36, 12, 0xc47a3a);
      fill(8, 78, 36, 2, 0xe0a060);
      fill(8, 88, 36, 2, 0x8a4e24);
      for (let y = 80; y < 88; y += 2) {
        for (let x = 10; x < 42; x += 4) set(x, y, 0xf2b544);
      }
    }
    if (has("bowl")) {
      ellipse(26, 82, 8, 3, 0xf4efe6);
      ellipse(26, 81, 6, 2, 0xe7d3b0);
      set(24, 80, GOLD);
      set(26, 80, GOLD);
      set(28, 80, 0xc45b55);
    }
    if (has("bell")) {
      const swing = running ? Math.round(Math.sin(now / 280) * 3) : 0;
      fill(96, 6, 1, 8, INK);
      ellipse(96 + swing, 16, 3, 3, GOLD);
      set(96 + swing, 19, INK);
    }
    if (has("frame")) {
      fill(58, 14, 10, 12, 0x6b4428);
      fill(60, 16, 6, 8, 0x7eb0d4);
      fill(61, 18, 4, 3, 0x67b36a);
    }
    if (has("banner")) {
      fill(160, 6, 2, 4, INK);
      fill(178, 6, 2, 4, INK);
      fill(160, 10, 20, 10, 0x8d3a36);
      fill(164, 12, 12, 4, GOLD);
    }
    if (has("clock")) {
      fill(90, 58, 10, 14, 0xf4efe6);
      fill(90, 58, 10, 2, 0x6b4428);
      set(95, 64, INK);
      set(95, 61, INK);
      set(97, 64, INK);
    }
    if (has("tin")) {
      fill(78, 66, 8, 8, 0xc45b55);
      fill(79, 64, 6, 2, 0xf4efe6);
      set(81, 68, GOLD);
    }
    if (has("nest")) {
      ellipse(40, 84, 12, 4, 0xc45b55);
      ellipse(40, 83, 8, 2, 0xf6d7b0);
    }
    if (has("ball")) {
      const roll = running ? Math.round(Math.sin(now / 180) * 5) : 0;
      ellipse(50 + roll, floorY - 4, 3, 3, 0xc45b55);
      set(50 + roll, floorY - 5, 0xf4efe6);
    }
    if (has("crate")) {
      fill(8, floorY - 10, 30, 10, 0x8a5a32);
      fill(8, floorY - 10, 30, 2, 0x6b4428);
      fill(8, floorY - 2, 30, 2, 0x6b4428);
    }
    if (has("oil")) {
      fill(102, 66, 6, 8, 0x2a1c14);
      fill(103, 64, 4, 3, GOLD);
    }

    const cx = 142;
    const cy = 48;
    const stand = 0xc4a574;
    const standDark = 0x6b4428;
    for (let y = floorY; y < floorY + 4; y += 1) {
      for (let x = cx - 20; x < cx + 20; x += 1) {
        if (((x - cx) * (x - cx)) / 3 + (y - floorY) * 8 < 80)
          set(x, y, 0x5c3818);
      }
    }
    if (running)
      angle +=
        Math.max(0.04, Math.min(0.22, shownRate / 1600000)) *
        (has("oil") ? 1.35 : 1);
    ring(cx, cy, 24, 22, INK);
    ring(cx, cy, 22, 16, has("rim") ? GOLD : WOOD);
    ring(cx, cy, 17, 15, WOOD2);
    for (let spoke = 0; spoke < 8; spoke += 1) {
      const t = angle + (spoke * Math.PI) / 4;
      const px = -Math.sin(t);
      const py = Math.cos(t);
      for (let dist = 4; dist <= 15; dist += 1) {
        set(cx + Math.cos(t) * dist, cy + Math.sin(t) * dist, 0xf0e2c4);
        set(cx + Math.cos(t) * dist + px, cy + Math.sin(t) * dist + py, WOOD);
      }
    }
    fill(cx - 34, cy - 2, 14, 5, stand);
    fill(cx + 20, cy - 2, 14, 5, stand);
    fill(cx - 34, cy - 3, 14, 1, INK);
    fill(cx + 20, cy - 3, 14, 1, INK);
    for (let y = cy + 2; y < floorY + 4; y += 1) {
      fill(cx - 34, y, 4, 1, standDark);
      set(cx - 34, y, stand);
      fill(cx + 30, y, 4, 1, standDark);
      set(cx + 33, y, stand);
    }
    fill(cx - 36, floorY + 1, 12, 4, standDark);
    fill(cx + 24, floorY + 1, 12, 4, standDark);
    ellipse(cx, cy, 3, 3, 0xc9cdd4);
    set(cx, cy, 0x6d7388);

    const bob = running ? Math.floor(now / 130) % 2 : 0;
    const step = Math.floor(now / 130) % 2;
    const blink = false;
    const hx = cx - 2;
    const hy = cy + 8 + bob;
    ellipse(hx - 6, hy + 1, 2, 1, FUR);
    ellipse(hx, hy, 6, 4, FUR);
    ellipse(hx, hy + 1, 3, 2, BELLY);
    ellipse(hx + 5, hy - 1, 3, 3, FUR2);
    ellipse(hx + 7, hy, 2, 1, FUR2);
    ellipse(hx + 6, hy - 5, 2, 2, FUR);
    ellipse(hx + 6, hy - 4, 1, 1, EAR);
    ellipse(hx + 3, hy - 5, 1, 2, FUR);
    if (blink) {
      fill(hx + 5, hy - 1, 3, 1, EYE);
    } else {
      set(hx + 6, hy - 2, EYE);
      set(hx + 6, hy - 3, 0xfff6e8);
    }
    set(hx + 8, hy, 0xc45b55);
    set(hx + 4, hy, EAR);
    if (running) {
      if (step === 0) {
        fill(hx - 3, hy + 3, 2, 2, FUR);
        fill(hx + 2, hy + 4, 2, 2, FUR);
      } else {
        fill(hx - 4, hy + 4, 2, 2, FUR);
        fill(hx + 1, hy + 3, 2, 2, FUR);
      }
    } else {
      fill(hx - 2, hy + 3, 2, 1, FUR);
      fill(hx + 2, hy + 3, 2, 1, FUR);
    }

    const family = new Set([FUR, FUR2, BELLY, EAR, EYE, 0xc45b55, 0xfff6e8]);
    const contour = [];
    for (let y = hy - 8; y <= hy + 7; y += 1) {
      for (let x = hx - 9; x <= hx + 11; x += 1) {
        if (!family.has(at(x, y))) continue;
        const neighbors = [
          [1, 0],
          [-1, 0],
          [0, 1],
          [0, -1],
        ];
        for (const [dx, dy] of neighbors) {
          if (!family.has(at(x + dx, y + dy))) contour.push([x + dx, y + dy]);
        }
      }
    }
    for (const [x, y] of contour) set(x, y, INK);

    if (has("crown")) {
      fill(hx + 3, hy - 7, 5, 1, GOLD);
      fill(hx + 3, hy - 9, 1, 2, GOLD);
      fill(hx + 5, hy - 10, 1, 3, 0xffe7b0);
      fill(hx + 7, hy - 9, 1, 2, GOLD);
    }
    for (const [id, x, y] of [
      ["bowl", 20, 79],
      ["mat", 10, 80],
      ["ball", 48, 68],
      ["crate", 10, 66],
      ["lamp", 116, 26],
      ["frame", 58, 14],
      ["nest", 30, 82],
      ["plant", 56, 60],
      ["curtain", 14, 14],
      ["clock", 90, 58],
      ["shelf", 70, 20],
      ["tin", 78, 64],
      ["bell", 92, 12],
      ["banner", 160, 10],
      ["oil", 102, 64],
      ["crown", hx + 4, hy - 10],
      ["rim", cx, cy - 23],
    ]) {
      const level = itemLevel(String(id));
      if (level >= 2) set(Number(x), Number(y), 0xffe7b0);
      if (level >= 3) set(Number(x) + 2, Number(y), GOLD);
    }

    const pile = Math.min(8, Math.floor((state.ore || 0) / 8));
    for (let i = 0; i < pile; i += 1) {
      const nx = 16 + (i % 4) * 5;
      const ny = floorY - 4 - Math.floor(i / 4) * 4;
      ellipse(nx, ny, 2, 2, GOLD);
      set(nx, ny - 1, 0xffe7b0);
    }

    const glyph: Record<string, string[]> = {
      "+": ["#.#", "###", "#.#"],
      "0": ["###", "#.#", "#.#", "#.#", "###"],
      "1": [".#.", "##.", ".#.", ".#.", "###"],
      "2": ["###", "..#", "###", "#..", "###"],
      "3": ["###", "..#", "###", "..#", "###"],
      "4": ["#.#", "#.#", "###", "..#", "..#"],
      "5": ["###", "#..", "###", "..#", "###"],
      "6": ["###", "#..", "###", "#.#", "###"],
      "7": ["###", "..#", ".#.", ".#.", ".#."],
      "8": ["###", "#.#", "###", "#.#", "###"],
      "9": ["###", "#.#", "###", "..#", "###"],
    };
    const stamp = (text: string, x: number, y: number) => {
      let cursor = x;
      for (const ch of text) {
        const rows = glyph[ch];
        if (!rows) continue;
        rows.forEach((row, ry) => {
          [...row].forEach((cell, rx) => {
            if (cell === "#") set(cursor + rx, y + ry, 0xfff1c4);
          });
        });
        cursor += 4;
      }
    };
    pops.forEach((pop) => {
      pop.life -= 0.05;
      const rise = Math.round((1.4 - pop.life) * 10);
      stamp(pop.ore ? `+${pop.ore}` : "+", 24, 28 - rise);
    });
    pops = pops.filter((pop) => pop.life > 0);

    if (!roomScratch) roomScratch = document.createElement("canvas");
    roomScratch.width = WORLD_W;
    roomScratch.height = WORLD_H;
    const scratch = roomScratch.getContext("2d")!;
    scratch.putImageData(new ImageData(pix, WORLD_W, WORLD_H), 0, 0);
    const ctx = canvas.getContext("2d")!;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(roomScratch, 0, 0, bufW, bufH);
  };
}
