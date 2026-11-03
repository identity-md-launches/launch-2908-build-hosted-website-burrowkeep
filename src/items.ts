import type { Item, GameState } from "./types";
// Original item prices, effects and decor values from a836815.
export const ITEMS: Item[] = [
  { id: "bowl", sand: "iron", cost: 2, decor: 2, zh: "食盆", en: "Bowl" },
  { id: "mat", sand: "iron", cost: 3, decor: 3, zh: "草垫", en: "Mat" },
  { id: "ball", sand: "iron", cost: 3, decor: 2, zh: "木球", en: "Ball" },
  { id: "crate", sand: "iron", cost: 4, decor: 3, zh: "木箱", en: "Crate" },
  { id: "lamp", sand: "iron", cost: 5, decor: 4, zh: "木灯", en: "Lamp" },
  { id: "frame", sand: "iron", cost: 6, decor: 5, zh: "挂画", en: "Picture" },
  {
    id: "nest",
    sand: "iron",
    cost: 8,
    decor: 6,
    zh: "软窝",
    en: "Nest",
    zhNote: "饱食掉得更慢",
    enNote: "Hunger slows",
  },
  { id: "plant", sand: "silver", cost: 2, decor: 8, zh: "花盆", en: "Plant" },
  {
    id: "curtain",
    sand: "silver",
    cost: 3,
    decor: 9,
    zh: "窗帘",
    en: "Curtain",
  },
  { id: "clock", sand: "silver", cost: 3, decor: 8, zh: "座钟", en: "Clock" },
  { id: "shelf", sand: "silver", cost: 4, decor: 10, zh: "书架", en: "Shelf" },
  {
    id: "tin",
    sand: "silver",
    cost: 4,
    decor: 8,
    zh: "零食罐",
    en: "Snack tin",
    zhNote: "养成里可以喂零食",
    enNote: "Unlocks a snack",
  },
  { id: "bell", sand: "gold", cost: 2, decor: 14, zh: "金铃", en: "Bell" },
  { id: "banner", sand: "gold", cost: 2, decor: 14, zh: "挂毯", en: "Banner" },
  { id: "crown", sand: "gold", cost: 3, decor: 18, zh: "王冠", en: "Crown" },
  {
    id: "oil",
    sand: "gold",
    cost: 3,
    decor: 16,
    zh: "润滑油",
    en: "Oil",
    zhNote: "每块矿砂少算 10% 哈希",
    enNote: "10% fewer hashes per ore",
  },
  { id: "rim", sand: "gold", cost: 4, decor: 20, zh: "金轮框", en: "Gold rim" },
];

export const itemLevel = (state: GameState, id: string) =>
  state.owned.includes(id) ? state.levels[id] || 1 : 0;
export const decorTotal = (state: GameState) =>
  ITEMS.reduce((sum, item) => sum + item.decor * itemLevel(state, item.id), 0);
