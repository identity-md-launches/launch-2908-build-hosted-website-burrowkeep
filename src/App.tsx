import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Game } from "./game";
import {
  FOOD_COST,
  GEAR_CAP,
  MAX_LEVEL,
  MAX_DECOR_LEVEL,
  SNACK_COST,
  hashesPerOre,
  upgradeCost,
  threadsFor,
} from "./economy";
import { ITEMS, decorTotal, itemLevel } from "./items";
import { Icon, HamsterMark, Mineral } from "./components/Icon";
import type { IconName } from "./components/Icon";
import { Room } from "./components/Room";
import { ItemArt } from "./components/ItemArt";
import { Dialog } from "./components/Dialog";
import type { Currency, Language, Price } from "./types";

const game = new Game();
type Tab = "care" | "shop" | "exchange" | "board";
const initialLanguage = (): Language => {
  try {
    const saved = localStorage.getItem("burrowkeep-lang");
    if (saved === "zh" || saved === "en") return saved;
  } catch {
    /* use browser preference */
  }
  return navigator.language.startsWith("zh") ? "zh" : "en";
};

export function App() {
  const snap = useSyncExternalStore(game.subscribe, game.getSnapshot);
  const s = snap.state;
  const [lang, setLang] = useState<Language>(initialLanguage);
  const [tab, setTab] = useState<Tab>("care");
  const [guide, setGuide] = useState(false);
  const [invite, setInvite] = useState(false);
  const [animated, setAnimated] = useState(true);
  const [announcement, announce] = useState("");
  const [copied, setCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);
  const [shopFilter, setShopFilter] = useState<"all" | Currency>("all");
  const [ranking, setRanking] = useState<"wealth" | "decor">("wealth");
  const inviteInput = useRef<HTMLInputElement>(null);
  const t = (en: string, zh: string) => (lang === "en" ? en : zh);
  const fmt = (n: number) =>
    n.toLocaleString(lang === "en" ? "en-US" : "zh-CN");
  const currency = (key: Currency) =>
    ({
      ore: t("ore", "矿砂"),
      iron: t("iron", "铁砂"),
      silver: t("silver", "银砂"),
      gold: t("gold", "金砂"),
    })[key];
  const priceText = (p: Price) => `${fmt(p.amount)} ${currency(p.sand)}`;
  const affordable = (p: Price) => s[p.sand] >= p.amount;
  const shortage = (p: Price) =>
    t(
      `Need ${fmt(Math.max(0, p.amount - s[p.sand]))} more ${currency(p.sand)}`,
      `还差 ${fmt(Math.max(0, p.amount - s[p.sand]))} ${currency(p.sand)}`,
    );
  const act = (fn: () => boolean, message: string) => {
    if (fn()) announce(message);
  };
  const tabs: { id: Tab; label: string; icon: IconName }[] = [
    { id: "care", label: t("Care", "养成"), icon: "heart" },
    { id: "shop", label: t("Home shop", "家园商店"), icon: "home" },
    { id: "exchange", label: t("Exchange", "兑换"), icon: "exchange" },
    { id: "board", label: t("Leaderboard", "排行榜"), icon: "cup" },
  ];
  const decor = decorTotal(s);
  const hamsterPrice =
    s.hamster < MAX_LEVEL ? upgradeCost("hamster", s.hamster) : null;
  const rigPrice = s.gear < GEAR_CAP ? upgradeCost("gear", s.gear) : null;
  const progress = Math.min(100, (s.bank / game.need()) * 100);
  const nextOre = Math.max(0, game.need() - s.bank);
  const link = `${location.origin}${location.pathname}?ref=${s.minerId}`;
  const snackWait = Math.max(0, Math.ceil((s.snackReady - Date.now()) / 1000));
  const snackActive = s.snackUntil > Date.now();

  useEffect(() => game.mount(), []);
  useEffect(() => {
    document.documentElement.lang = lang === "zh" ? "zh-Hans" : "en";
    try {
      localStorage.setItem("burrowkeep-lang", lang);
    } catch {
      /* language remains usable */
    }
  }, [lang]);

  const changeTab = (next: Tab) => {
    setTab(next);
    announce("");
    if (next === "board") void game.refreshBoard();
  };
  const copyInvite = async () => {
    setCopied(false);
    setCopyFailed(false);
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
    } catch {
      inviteInput.current?.focus();
      inviteInput.current?.select();
      setCopyFailed(true);
    }
  };

  return (
    <>
      <a className="skip-link" href="#main">
        {t("Skip to the game", "跳到游戏")}
      </a>
      <header className="site-header">
        <a
          className="brand"
          href="./"
          aria-label={t("Burrowkeep home", "Burrowkeep 首页")}
        >
          <HamsterMark />
          <span>
            burrowkeep<span className="brand-period">.</span>
          </span>
        </a>
        <div className="header-tools">
          <button
            className="text-button guide-button"
            aria-label={t("How to play", "玩法指南")}
            type="button"
            onClick={() => setGuide(true)}
          >
            <Icon name="help" />
            <span>{t("How to play", "玩法指南")}</span>
          </button>
          <span className="header-divider" aria-hidden="true" />
          <button
            type="button"
            className="language-button"
            lang={lang === "en" ? "zh-Hans" : "en"}
            onClick={() => setLang(lang === "en" ? "zh" : "en")}
          >
            {lang === "en" ? "中文" : "English"}
          </button>
        </div>
      </header>
      <main id="main" tabIndex={-1}>
        <div className="intro">
          <div>
            <h1>{t("Small paws. Big plans.", "小小爪子，大大梦想。")}</h1>
            <p>
              {t(
                "A cozy mining game, powered by your browser.",
                "一款由浏览器驱动的温馨挖矿游戏。",
              )}
            </p>
          </div>
          <span className={`save-status ${snap.saved ? "" : "warning-text"}`}>
            <Icon name={snap.saved ? "check" : "help"} size={16} />
            {snap.saved
              ? t("Saved on this device", "已保存在此设备")
              : t("Saving unavailable", "暂时无法保存")}
          </span>
        </div>
        <section
          className="game-grid"
          aria-label={t("Your mining game", "你的挖矿游戏")}
        >
          <div className="burrow">
            <div className="scene-heading">
              <h2>{t("Your burrow", "你的家园")}</h2>
              <div className="scene-status">
                <span
                  className={snap.running ? "status-dot active" : "status-dot"}
                />
                {snap.running
                  ? t("Hard at work", "正在努力挖矿")
                  : t("A moment of rest", "休息一下")}
              </div>
              <button
                type="button"
                className="icon-button motion-button"
                aria-label={
                  animated
                    ? t("Pause scene animation", "暂停场景动画")
                    : t("Enable scene animation", "开启场景动画")
                }
                aria-pressed={!animated}
                onClick={() => setAnimated(!animated)}
              >
                <Icon name={animated ? "pause" : "play"} size={16} />
              </button>
            </div>
            <div className="scene-frame">
              <Room
                snapshot={snap}
                animated={animated}
                label={t(
                  `A pixel-art wooden burrow. Your hamster is ${snap.running ? "running on its wheel" : "resting on its wheel"}. ${s.owned.length} decorations placed.`,
                  `像素木屋，仓鼠${snap.running ? "正在跑轮上奔跑" : "正在休息"}，已放置 ${s.owned.length} 件装饰。`,
                )}
              />
            </div>
            <div className="burrow-stats">
              <div className="food-stat">
                <span>
                  <Icon name="leaf" size={16} />
                  {t("Food", "饱食度")}
                  <strong>
                    {s.satiety}
                    <span> / {MAX_LEVEL}</span>
                  </strong>
                </span>
                <div className="food-pips" aria-hidden="true">
                  {Array.from({ length: MAX_LEVEL }, (_, i) => (
                    <i key={i} className={i < s.satiety ? "filled" : ""} />
                  ))}
                </div>
              </div>
              <div className="simple-stat">
                <span>{t("Hamster", "仓鼠")}</span>
                <strong>
                  {t("Level", "等级")} {s.hamster}
                </strong>
              </div>
              <div className="simple-stat">
                <span>{t("Decor", "装饰度")}</span>
                <strong>
                  <Icon name="spark" size={16} />
                  {decor}
                </strong>
              </div>
            </div>
            <div className="room-caption">
              <Icon name="home" size={16} />
              <span>
                {s.owned.length === 0
                  ? t("A blank canvas, a place to begin.", "从空空的小屋开始。")
                  : t(
                      `${s.owned.length} little touches that make it yours.`,
                      `${s.owned.length} 件装饰，让小屋更像家。`,
                    )}
              </span>
              <button
                type="button"
                className="inline-button"
                onClick={() => {
                  changeTab("shop");
                  document
                    .getElementById("workshop")
                    ?.scrollIntoView({ block: "start" });
                }}
              >
                {t("Make it home", "布置家园")}
                <Icon name="arrow" size={16} />
              </button>
            </div>
          </div>
          <div className="mining-panel">
            <div className="ore-heading">
              <span>{t("Your ore", "你的矿砂")}</span>
              <Mineral kind="ore" size={26} />
            </div>
            <div className="ore-total" data-testid="ore-total">
              {fmt(s.ore)}
            </div>
            <div className="resources" aria-label={t("Resources", "资源")}>
              {(["iron", "silver", "gold"] as Currency[]).map((kind) => (
                <div key={kind}>
                  <Mineral kind={kind} size={20} />
                  <span>{currency(kind)}</span>
                  <strong data-testid={`resource-${kind}`}>
                    {fmt(s[kind])}
                  </strong>
                </div>
              ))}
            </div>
            <button
              type="button"
              className={`start-button ${snap.running ? "is-running" : ""}`}
              aria-label={
                snap.running
                  ? t("Stop mining", "停止挖矿")
                  : t("Start mining", "开始挖矿")
              }
              onClick={snap.running ? game.stop : game.start}
            >
              <Icon name={snap.running ? "pause" : "play"} />
              <span>
                {snap.running
                  ? t("Stop mining", "停止挖矿")
                  : t("Start mining", "开始挖矿")}
              </span>
              <span className="button-end">
                <Icon name={snap.running ? "pause" : "arrow"} size={18} />
              </span>
            </button>
            <p className="cpu-consent">
              {t(
                "Uses your CPU for SHA-256 while running.",
                "运行时使用你的 CPU 计算 SHA-256。",
              )}
            </p>
            <fieldset className="power-control">
              <legend className="sr-only">
                {t("Mining power", "挖矿功率")}
              </legend>
              <label className={!snap.fullPower ? "selected" : ""}>
                <input
                  type="radio"
                  name="power"
                  checked={!snap.fullPower}
                  onChange={() => game.setPower(false)}
                />
                <Icon name="leaf" size={16} />
                {t("Gentle", "温和")}
                <span>1</span>
              </label>
              <label className={snap.fullPower ? "selected" : ""}>
                <input
                  type="radio"
                  name="power"
                  checked={snap.fullPower}
                  onChange={() => game.setPower(true)}
                />
                <Icon name="rig" size={16} />
                {t("Full power", "全力")}
                <span>{threadsFor(s.gear, game.cores)}</span>
              </label>
            </fieldset>
            <div className="mining-progress">
              <div>
                <span className="rate-label">
                  {snap.running
                    ? t("Mining", "挖矿中")
                    : t("Ready when you are", "准备好了就开始")}
                </span>
                <strong>
                  {(snap.rate / 1000).toFixed(1)} <span>kH/s</span>
                </strong>
              </div>
              <progress
                max="100"
                value={progress}
                aria-label={t("Progress to next ore", "距离下一块矿砂的进度")}
              />
              <p>
                {t(
                  `${fmt(nextOre)} hashes to the next ore`,
                  `再算 ${fmt(nextOre)} 次哈希获得矿砂`,
                )}
              </p>
            </div>
            {(s.satiety === 0 || snackActive) && (
              <p className="state-note">
                {s.satiety === 0
                  ? t(
                      "Hungry: twice the hashes per ore. Feed your hamster below.",
                      "饿了：每块矿砂需要双倍哈希。请在下方喂食。",
                    )
                  : t(
                      "Snack boost active: 20% fewer hashes.",
                      "零食加成中：所需哈希减少 20%。",
                    )}
              </p>
            )}
          </div>
        </section>
        {snap.notice && (
          <div className="notice" role="status">
            <p>
              {snap.notice === "paused"
                ? t(
                    "Mining paused because you left this tab. Start again when you’re ready.",
                    "离开页面后挖矿已暂停。准备好后可重新开始。",
                  )
                : t(
                    "Mining could not start. Reload this page and try again in a browser that supports Web Workers.",
                    "无法开始挖矿。请刷新页面，并使用支持 Web Worker 的浏览器重试。",
                  )}
            </p>
            <button
              type="button"
              className="icon-button"
              onClick={game.dismissNotice}
              aria-label={t("Dismiss notice", "关闭提示")}
            >
              <Icon name="close" />
            </button>
          </div>
        )}
        {!snap.saved && (
          <p className="notice" role="alert">
            {t(
              "Progress is only kept in this tab. Allow browser storage before closing the page.",
              "进度仅保留在此页面中。关闭前请允许浏览器存储。",
            )}
          </p>
        )}
        <section
          className="workshop"
          id="workshop"
          aria-label={t("Burrow workshop", "家园工坊")}
        >
          <div className="workshop-top">
            <div
              role="tablist"
              aria-label={t("Workshop sections", "工坊分类")}
              className="tabs"
            >
              {tabs.map((item, index) => (
                <button
                  key={item.id}
                  type="button"
                  role="tab"
                  id={`tab-${item.id}`}
                  aria-controls={`panel-${item.id}`}
                  aria-selected={tab === item.id}
                  tabIndex={tab === item.id ? 0 : -1}
                  onClick={() => changeTab(item.id)}
                  onKeyDown={(e) => {
                    let next = index;
                    if (e.key === "ArrowRight")
                      next = (index + 1) % tabs.length;
                    else if (e.key === "ArrowLeft")
                      next = (index + tabs.length - 1) % tabs.length;
                    else if (e.key === "Home") next = 0;
                    else if (e.key === "End") next = tabs.length - 1;
                    else return;
                    e.preventDefault();
                    changeTab(tabs[next].id);
                    document.getElementById(`tab-${tabs[next].id}`)?.focus();
                  }}
                >
                  <Icon name={item.icon} />
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
            <button
              type="button"
              className="text-button invite-trigger"
              onClick={() => {
                setInvite(true);
                setCopied(false);
                setCopyFailed(false);
              }}
            >
              <Icon name="friends" size={18} />
              {t("Invite a friend", "邀请好友")}
              <Icon name="arrow" size={16} />
            </button>
          </div>
          <div
            role="status"
            className={`action-status ${announcement ? "visible" : ""}`}
          >
            {announcement}
          </div>
          <div
            role="tabpanel"
            id={`panel-${tab}`}
            aria-labelledby={`tab-${tab}`}
            tabIndex={0}
            className="tab-panel"
          >
            {tab === "care" && (
              <>
                <div className="section-intro">
                  <h2>
                    {t(
                      "A little care goes a long way.",
                      "照顾好它，慢慢长大。",
                    )}
                  </h2>
                  <p>
                    {t(
                      "Feed your hamster and grow your mining crew.",
                      "喂饱仓鼠，壮大你的小矿坊。",
                    )}
                  </p>
                </div>
                <div className="care-grid">
                  <article className="care-item">
                    <div className="care-art">
                      <ItemArt id="bowl" />
                    </div>
                    <div className="care-copy">
                      <div className="item-heading">
                        <h3>{t("Feed your hamster", "喂食仓鼠")}</h3>
                        <span>
                          {s.satiety} / {MAX_LEVEL}
                        </span>
                      </div>
                      <p>
                        {t(
                          "A full belly makes every hash count.",
                          "吃饱了，每次计算都不浪费。",
                        )}
                      </p>
                      <span className="effect">
                        {t(
                          "+1 food · Hunger slows with a nest",
                          "饱食 +1 · 软窝让饱食下降更慢",
                        )}
                      </span>
                    </div>
                    <button
                      type="button"
                      className="purchase-button"
                      disabled={s.ore < FOOD_COST || s.satiety >= MAX_LEVEL}
                      onClick={() =>
                        act(
                          game.feed,
                          t(
                            "Fed your hamster. Food +1.",
                            "喂食成功，饱食度 +1。",
                          ),
                        )
                      }
                    >
                      <span>
                        {s.satiety >= MAX_LEVEL
                          ? t("Belly full", "已经吃饱")
                          : t("Feed", "喂食")}
                      </span>
                      <span>
                        <Mineral kind="ore" size={18} />
                        {FOOD_COST} {currency("ore")}
                      </span>
                    </button>
                  </article>
                  <article className="care-item">
                    <div className="care-art hamster-art">
                      <HamsterMark size={52} />
                    </div>
                    <div className="care-copy">
                      <div className="item-heading">
                        <h3>{t("Raise your hamster", "升级仓鼠")}</h3>
                        <span>
                          {t("Level", "等级")} {s.hamster} / {MAX_LEVEL}
                        </span>
                      </div>
                      <p>
                        {t(
                          "Little paws, a little more efficient.",
                          "小小爪子，再提高一点效率。",
                        )}
                      </p>
                      <span className="effect">
                        {hamsterPrice
                          ? t(
                              `${fmt(hashesPerOre(s.hamster, false))} → ${fmt(hashesPerOre(s.hamster + 1, false))} hashes / ore`,
                              `${fmt(hashesPerOre(s.hamster, false))} → ${fmt(hashesPerOre(s.hamster + 1, false))} 次哈希 / 矿砂`,
                            )
                          : t("Your hamster is fully grown.", "仓鼠已满级。")}
                      </span>
                    </div>
                    <button
                      type="button"
                      className="purchase-button"
                      disabled={!hamsterPrice || !affordable(hamsterPrice)}
                      onClick={() =>
                        act(
                          () => game.upgrade("hamster"),
                          t(
                            "Hamster upgraded. Fewer hashes per ore.",
                            "仓鼠升级成功，每块矿砂所需哈希减少。",
                          ),
                        )
                      }
                    >
                      <span>
                        {hamsterPrice
                          ? t("Upgrade", "升级")
                          : t("Max level", "已满级")}
                      </span>
                      {hamsterPrice && (
                        <span>
                          <Mineral kind={hamsterPrice.sand} size={18} />
                          {priceText(hamsterPrice)}
                        </span>
                      )}
                    </button>
                  </article>
                  <article className="care-item">
                    <div className="care-art rig-art">
                      <Icon name="rig" size={48} />
                    </div>
                    <div className="care-copy">
                      <div className="item-heading">
                        <h3>{t("Expand your rig", "扩建矿机")}</h3>
                        <span>
                          {s.gear} / {GEAR_CAP}
                        </span>
                      </div>
                      <p>
                        {t(
                          "More threads for your mining crew.",
                          "为你的小矿坊增加线程。",
                        )}
                      </p>
                      <span className="effect">
                        {rigPrice
                          ? t(
                              `${threadsFor(s.gear + 1, game.cores)} threads next · ${game.cores} cores available`,
                              `升级后可用 ${threadsFor(s.gear + 1, game.cores)} 线程 · 设备有 ${game.cores} 核`,
                            )
                          : t(
                              "All 32 rigs unlocked.",
                              "全部 32 台矿机已解锁。",
                            )}
                      </span>
                    </div>
                    <button
                      type="button"
                      className="purchase-button"
                      disabled={!rigPrice || !affordable(rigPrice)}
                      onClick={() =>
                        act(
                          () => game.upgrade("gear"),
                          t(
                            "Rig added. Choose Full power to use unlocked threads.",
                            "矿机已添加。选择全力模式使用已解锁的线程。",
                          ),
                        )
                      }
                    >
                      <span>
                        {rigPrice
                          ? t("Add a rig", "增加矿机")
                          : t("Max rigs", "矿机已满")}
                      </span>
                      {rigPrice && (
                        <span>
                          <Mineral kind={rigPrice.sand} size={18} />
                          {priceText(rigPrice)}
                        </span>
                      )}
                    </button>
                  </article>
                  <article className="care-item">
                    <div className="care-art">
                      <ItemArt id="tin" />
                    </div>
                    <div className="care-copy">
                      <div className="item-heading">
                        <h3>{t("A little pick-me-up", "加餐时间")}</h3>
                        <span>{t("15 sec boost", "加成 15 秒")}</span>
                      </div>
                      <p>
                        {t(
                          "A snack for a short burst of energy.",
                          "来点零食，补充一下能量。",
                        )}
                      </p>
                      <span className="effect">
                        {!s.owned.includes("tin")
                          ? t(
                              "Unlock with a snack tin from the shop",
                              "在商店购买零食罐后解锁",
                            )
                          : snackWait > 0
                            ? t(
                                `Ready in ${snackWait}s`,
                                `${snackWait} 秒后可再次喂食`,
                              )
                            : t(
                                "+1 food · 20% fewer hashes · 60s cooldown",
                                "饱食 +1 · 所需哈希减少 20% · 冷却 60 秒",
                              )}
                      </span>
                    </div>
                    <button
                      type="button"
                      className="purchase-button"
                      disabled={
                        !s.owned.includes("tin") ||
                        s.ore < SNACK_COST ||
                        snackWait > 0
                      }
                      onClick={() =>
                        act(
                          game.snack,
                          t(
                            "Snack served. The boost lasts 15 seconds.",
                            "零食已喂，加成持续 15 秒。",
                          ),
                        )
                      }
                    >
                      <span>
                        {!s.owned.includes("tin")
                          ? t("Tin needed", "需要零食罐")
                          : snackWait > 0
                            ? t("Cooling down", "冷却中")
                            : t("Give a snack", "喂零食")}
                      </span>
                      <span>
                        <Mineral kind="ore" size={18} />
                        {SNACK_COST} {currency("ore")}
                      </span>
                    </button>
                  </article>
                </div>
                <p className="section-footnote">
                  <Icon name="help" size={16} />
                  {t(
                    "Exchange ore for higher-tier materials as your burrow grows.",
                    "积攒矿砂，逐步兑换高级材料。",
                  )}
                </p>
              </>
            )}
            {tab === "shop" && (
              <>
                <div className="section-intro section-with-tools">
                  <div>
                    <h2>
                      {t(
                        "Make room for the little things.",
                        "把喜欢的小物件带回家。",
                      )}
                    </h2>
                    <p>
                      {t(
                        "Every piece appears in your burrow. Upgrade each to level 3.",
                        "每件装饰都会出现在家园中，最高可升到 3 级。",
                      )}
                    </p>
                  </div>
                  <div className="filter-label">
                    <label htmlFor="material-filter">
                      {t("Material", "材料")}
                    </label>
                    <select
                      id="material-filter"
                      value={shopFilter}
                      onChange={(e) =>
                        setShopFilter(e.target.value as typeof shopFilter)
                      }
                    >
                      <option value="all">
                        {t("All materials", "全部材料")}
                      </option>
                      {(["iron", "silver", "gold"] as Currency[]).map((k) => (
                        <option key={k} value={k}>
                          {currency(k)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="shop-grid">
                  {ITEMS.filter(
                    (item) => shopFilter === "all" || item.sand === shopFilter,
                  ).map((item) => {
                    const level = itemLevel(s, item.id);
                    const max = level >= MAX_DECOR_LEVEL;
                    const cost = item.cost * Math.max(1, level);
                    const price = { amount: cost, sand: item.sand };
                    const name = lang === "en" ? item.en : item.zh;
                    return (
                      <article className="shop-item" key={item.id}>
                        <div className="shop-art">
                          <ItemArt id={item.id} />
                          {level > 0 && (
                            <span className="placed">
                              <Icon name="check" size={14} />
                              {t("Level", "等级")} {level}
                            </span>
                          )}
                        </div>
                        <div className="shop-item-heading">
                          <h3>{name}</h3>
                          <span>
                            <Icon name="spark" size={14} />
                            {item.decor * Math.max(1, level)}
                          </span>
                        </div>
                        <p className="item-effect">
                          {(lang === "en" ? item.enNote : item.zhNote) ||
                            t("A little more like home.", "让家园更温馨。")}
                        </p>
                        <button
                          type="button"
                          className="purchase-button"
                          aria-label={
                            max
                              ? t(`${name}, maximum level`, `${name}已满级`)
                              : `${level ? t("Upgrade", "升级") : t("Buy", "购买")} ${name}, ${priceText(price)}`
                          }
                          disabled={max || !affordable(price)}
                          onClick={() =>
                            act(
                              () => game.buy(item),
                              t(
                                `${name} ${level ? "upgraded" : "placed in your burrow"}.`,
                                `${name}${level ? "已升级" : "已放入家园"}。`,
                              ),
                            )
                          }
                        >
                          <span>
                            {max
                              ? t("Max level", "已满级")
                              : level
                                ? t("Upgrade", "升级")
                                : t("Buy", "购买")}
                          </span>
                          {!max && (
                            <span>
                              <Mineral kind={item.sand} size={18} />
                              {priceText(price)}
                            </span>
                          )}
                        </button>
                        <span className="purchase-hint">
                          {!max && !affordable(price)
                            ? shortage(price)
                            : max
                              ? t("As cozy as can be.", "已经是最棒的样子。")
                              : t("Ready to place", "可以放入家园")}
                        </span>
                      </article>
                    );
                  })}
                </div>
              </>
            )}
            {tab === "exchange" && (
              <>
                <div className="section-intro">
                  <h2>
                    {t(
                      "From a handful to a treasure.",
                      "从一把矿砂到一份宝藏。",
                    )}
                  </h2>
                  <p>
                    {t(
                      "Trade up for upgrades and home comforts. Exchanges are one-way.",
                      "兑换高级材料，升级仓鼠、矿机和家园。兑换不可逆。",
                    )}
                  </p>
                </div>
                <div className="exchange-grid">
                  {(
                    [
                      { from: "ore", to: "iron", cost: 100 },
                      { from: "iron", to: "silver", cost: 10 },
                      { from: "silver", to: "gold", cost: 10 },
                    ] as { from: Currency; to: Currency; cost: number }[]
                  ).map((trade) => (
                    <article className="trade" key={trade.to}>
                      <div className="trade-visual">
                        <Mineral kind={trade.from} size={48} />
                        <Icon name="arrow" size={24} />
                        <Mineral kind={trade.to} size={48} />
                      </div>
                      <h3>
                        {trade.cost} {currency(trade.from)} <span>→</span> 1{" "}
                        {currency(trade.to)}
                      </h3>
                      <p>
                        {t(
                          `You have ${fmt(s[trade.from])} ${currency(trade.from)}`,
                          `你有 ${fmt(s[trade.from])} ${currency(trade.from)}`,
                        )}
                      </p>
                      <button
                        type="button"
                        className="purchase-button"
                        disabled={s[trade.from] < trade.cost}
                        onClick={() =>
                          act(
                            () => game.exchange(trade.to),
                            t(
                              `Exchanged ${trade.cost} ${currency(trade.from)} for 1 ${currency(trade.to)}.`,
                              `已将 ${trade.cost} ${currency(trade.from)} 兑换为 1 ${currency(trade.to)}。`,
                            ),
                          )
                        }
                      >
                        {t(
                          `Exchange for ${currency(trade.to)}`,
                          `兑换${currency(trade.to)}`,
                        )}
                        <Icon name="arrow" size={18} />
                      </button>
                    </article>
                  ))}
                </div>
              </>
            )}
            {tab === "board" && (
              <>
                <div className="section-intro section-with-tools">
                  <div>
                    <h2>{t("The burrow noticeboard.", "家园公告板。")}</h2>
                    <p>
                      {t(
                        "Shared rankings from the Burrowkeep server. Your progress stays on this device.",
                        "Burrowkeep 服务器的共享排行榜。游戏进度保存在此设备。",
                      )}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => void game.refreshBoard()}
                    disabled={snap.boardStatus === "loading"}
                  >
                    <Icon name="refresh" size={18} />
                    {snap.boardStatus === "loading"
                      ? t("Loading…", "加载中…")
                      : t("Refresh", "刷新")}
                  </button>
                </div>
                <div className="board-controls">
                  <div
                    className="segmented"
                    aria-label={t("Ranking category", "排行榜分类")}
                  >
                    {(["wealth", "decor"] as const).map((k) => (
                      <button
                        type="button"
                        key={k}
                        aria-pressed={ranking === k}
                        onClick={() => setRanking(k)}
                      >
                        {k === "wealth"
                          ? t("Wealth", "财富")
                          : t("Decor", "装饰度")}
                      </button>
                    ))}
                  </div>
                  <span>
                    {ranking === "wealth"
                      ? t(
                          `Your gold: ${fmt(s.gold)}`,
                          `你的金砂：${fmt(s.gold)}`,
                        )
                      : t(`Your decor: ${decor}`, `你的装饰度：${decor}`)}
                  </span>
                </div>
                <div
                  className="board-body"
                  aria-live="polite"
                  aria-busy={snap.boardStatus === "loading"}
                >
                  {snap.boardStatus === "loading" ? (
                    <div className="empty-state">
                      <Icon name="cup" size={32} />
                      <h3>
                        {t("Checking the noticeboard…", "正在查看公告板…")}
                      </h3>
                    </div>
                  ) : snap.boardStatus === "error" ? (
                    <div className="empty-state">
                      <Icon name="cup" size={32} />
                      <h3>
                        {t(
                          "The noticeboard is out of reach.",
                          "暂时无法读取排行榜。",
                        )}
                      </h3>
                      <p>
                        {t(
                          "The shared server could not be reached. You can keep mining locally and try again.",
                          "暂时无法连接共享服务器。你可以继续在本地挖矿，稍后再试。",
                        )}
                      </p>
                      <button
                        type="button"
                        className="secondary-button"
                        onClick={() => void game.refreshBoard()}
                      >
                        {t("Try again", "重试")}
                      </button>
                    </div>
                  ) : snap.board[ranking].length === 0 ? (
                    <div className="empty-state">
                      <Icon name="cup" size={32} />
                      <h3>
                        {t(
                          "Room for the first little legend.",
                          "等待第一位小传奇。",
                        )}
                      </h3>
                      <p>
                        {ranking === "wealth"
                          ? t(
                              "No gold scores yet. Exchange your way to gold to join the board.",
                              "还没有金砂记录。兑换金砂后即可参与排行。",
                            )
                          : t(
                              "No decor scores yet. Place your first decoration to join the board.",
                              "还没有装饰记录。购买第一件装饰即可参与排行。",
                            )}
                      </p>
                    </div>
                  ) : (
                    <table className="leaderboard">
                      <thead>
                        <tr>
                          <th scope="col">{t("Rank", "排名")}</th>
                          <th scope="col">{t("Keeper", "玩家")}</th>
                          <th scope="col">
                            {ranking === "wealth"
                              ? t("Gold", "金砂")
                              : t("Decor", "装饰度")}
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {snap.board[ranking].map((row, i) => (
                          <tr
                            key={row.id}
                            className={row.id === s.minerId ? "your-row" : ""}
                          >
                            <td>{i + 1}</td>
                            <td>
                              <bdi>{row.id}</bdi>
                              {row.id === s.minerId && (
                                <span> {t("(you)", "（你）")}</span>
                              )}
                            </td>
                            <td>{fmt(row.score)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
                <p className="section-footnote">
                  {t(
                    "Scores are submitted after you start mining. Server limits may delay ranking changes.",
                    "开始挖矿后上传分数。服务器限制可能导致排行榜更新延迟。",
                  )}
                </p>
              </>
            )}
          </div>
        </section>
        <div className="bottom-note">
          <HamsterMark size={32} />
          <p>
            {t(
              "A home for your hamster. A little pause for you.",
              "给仓鼠一个家，也给自己一点闲暇。",
            )}
          </p>
          <button
            type="button"
            className="text-button mobile-invite"
            onClick={() => setInvite(true)}
          >
            <Icon name="friends" size={18} />
            {t("Invite a friend", "邀请好友")}
          </button>
        </div>
      </main>
      <footer className="site-footer">
        <p>
          Burrowkeep uses this tab’s CPU only after you press start. Upgrades do
          not make Squeektoshi run.
        </p>
        <div>
          <a
            href="https://sepolia.squeekchain.com/#stream-game"
            target="_blank"
            rel="noreferrer"
          >
            {t("Watch the real wheel", "观看真实跑轮")}
            <Icon name="external" size={14} />
          </a>
          <a
            href="https://github.com/beibei030/burrowkeep/tree/a836815"
            target="_blank"
            rel="noreferrer"
          >
            {t("Original game", "原版游戏")}
            <Icon name="external" size={14} />
          </a>
        </div>
      </footer>
      {guide && (
        <Dialog
          title={t("A keeper’s field guide", "家园饲养指南")}
          closeLabel={t("Close guide", "关闭指南")}
          onClose={() => setGuide(false)}
        >
          <p>
            {t(
              "Burrowkeep is a small mining-and-raising game. Ore is a game resource, not money.",
              "Burrowkeep 是一款挖矿和养成小游戏。矿砂是游戏资源，不是金钱。",
            )}
          </p>
          <ol className="guide-steps">
            <li>
              <strong>{t("Start small", "从小开始")}</strong>
              <p>
                {t(
                  "Press Start mining to run real SHA-256 calculations in your browser. Gentle mode uses one CPU thread. Stop any time; leaving the tab pauses mining.",
                  "点击开始挖矿，在浏览器里计算真实 SHA-256。温和模式使用一个 CPU 线程。可随时停止，离开页面会自动暂停。",
                )}
              </p>
            </li>
            <li>
              <strong>{t("Keep the bowl full", "填满食盆")}</strong>
              <p>
                {t(
                  "At level 1, 400,000 hashes make 1 ore. Food costs 8 ore and restores 1 food. Mining uses 1 food every 75 seconds, or 120 seconds with a nest. At zero food, ore takes twice as many hashes.",
                  "1 级时每 400,000 次哈希获得 1 矿砂。喂食花费 8 矿砂，增加 1 饱食。挖矿每 75 秒消耗 1 饱食，拥有软窝后延长到 120 秒。饱食为零时所需哈希翻倍。",
                )}
              </p>
            </li>
            <li>
              <strong>{t("Grow your little world", "建设你的小世界")}</strong>
              <p>
                {t(
                  "Raise your hamster to level 8 to reduce the work per ore. Add rigs up to 32; Full power uses the threads your device supports. Exchange 100 ore for 1 iron, 10 iron for 1 silver, and 10 silver for 1 gold.",
                  "仓鼠最高 8 级，升级降低每块矿砂所需哈希。矿机最高 32 台，全力模式使用设备支持的线程。100 矿砂换 1 铁砂，10 铁砂换 1 银砂，10 银砂换 1 金砂。",
                )}
              </p>
            </li>
            <li>
              <strong>{t("Make it yours", "打造你的家园")}</strong>
              <p>
                {t(
                  "Decorations appear in your room and each has three levels. The nest slows hunger, the snack tin unlocks snacks, and oil reduces the hashes needed by 10%. Friends keep their ore; you receive an extra 5% when the server books their mining.",
                  "装饰出现在小屋里，每件最高 3 级。软窝减缓饥饿，零食罐解锁零食，润滑油减少 10% 所需哈希。好友的矿砂不会被扣除，服务器确认后你额外获得其矿砂的 5%。",
                )}
              </p>
            </li>
          </ol>
          <details>
            <summary>{t("Progress & privacy", "进度与隐私")}</summary>
            <p>
              {t(
                "Your progress and random keeper ID are saved in this browser. Clearing site data loses your burrow. No account or wallet is needed. The shared server receives your keeper ID, referral ID, mined ore, gold and decor scores. Rankings and referrals need an internet connection; the game does not need them to run.",
                "进度和随机玩家编号保存在浏览器里。清除网站数据会丢失家园。不需要账号或钱包。共享服务器接收玩家编号、邀请编号、挖出的矿砂、金砂和装饰分数。排行榜和邀请奖励需要网络连接，但本地游戏不依赖它们。",
              )}
            </p>
            <p>
              {t(
                "Use one tab for this burrow. There is no offline mining or cloud save.",
                "请使用一个页面游玩。没有离线挖矿或云存档。",
              )}
            </p>
          </details>
          <div className="guide-proof">
            <span>{t("Actual work so far", "已完成的实际计算")}</span>
            <strong>
              {fmt(s.totalHashes)} {t("hashes", "次哈希")} · {fmt(s.shares)}{" "}
              {t("shares", "个份额")}
            </strong>
          </div>
        </Dialog>
      )}
      {invite && (
        <Dialog
          title={t("Good things grow together.", "和好友一起慢慢成长。")}
          closeLabel={t("Close invitation", "关闭邀请")}
          onClose={() => setInvite(false)}
        >
          <div className="invite-art">
            <Icon name="friends" size={40} />
          </div>
          <p>
            {t(
              "Friends keep every ore they mine. Every 20 ore the server books for them adds 1 extra ore for you.",
              "好友挖到的矿砂一分不扣。服务器每为好友确认 20 矿砂，你额外获得 1 矿砂。",
            )}
          </p>
          <label className="invite-label" htmlFor="invite-link">
            {t("Your invite link", "你的邀请链接")}
          </label>
          <input
            ref={inviteInput}
            id="invite-link"
            className="invite-field"
            readOnly
            value={link}
            onFocus={(e) => e.currentTarget.select()}
          />
          <button
            type="button"
            className="secondary-button copy-button"
            onClick={() => void copyInvite()}
          >
            <Icon name={copied ? "check" : "copy"} size={18} />
            {copied
              ? t("Copied", "已复制")
              : t("Copy invite link", "复制邀请链接")}
          </button>
          <p role="status" className="copy-status">
            {copyFailed
              ? t(
                  "Copy is unavailable here. Select the link and copy it manually.",
                  "此处无法自动复制，请选中链接后手动复制。",
                )
              : copied
                ? t(
                    "Your invite link is ready to share.",
                    "邀请链接已复制，可以分享了。",
                  )
                : ""}
          </p>
          <div className="invite-rewards">
            <div>
              <span>{t("Received", "已领取")}</span>
              <strong>
                {fmt(s.friendOre)} {currency("ore")}
              </strong>
            </div>
            <div>
              <span>{t("Pending", "待入账")}</span>
              <strong>
                {(snap.pendingMilli / 1000).toFixed(2)} {currency("ore")}
              </strong>
            </div>
          </div>
          <p className="muted">
            {s.refId
              ? t(
                  `Invited by ${s.refId}. The first invitation is permanent.`,
                  `邀请人：${s.refId}。首次绑定后不可更改。`,
                )
              : t(
                  "No inviter is linked to this burrow. Later links do not replace the first visit.",
                  "此家园未绑定邀请人。后续链接不会改变首次访问的绑定。",
                )}
          </p>
          <p className="muted">
            {snap.socialStatus === "error"
              ? t(
                  "Rewards are currently unreachable. Your local mining progress is safe; try syncing again.",
                  "暂时无法同步奖励。本地进度不受影响，可稍后重试。",
                )
              : snap.socialStatus === "ready"
                ? t(
                    "Rewards last synced with the server.",
                    "奖励已与服务器同步。",
                  )
                : snap.socialStatus === "loading"
                  ? t("Syncing rewards…", "正在同步奖励…")
                  : t(
                      "Start mining or sync to check rewards.",
                      "开始挖矿或同步以查询奖励。",
                    )}
          </p>
          <button
            type="button"
            className="text-button"
            disabled={snap.socialStatus === "loading"}
            aria-busy={snap.socialStatus === "loading"}
            onClick={() => void game.sync()}
          >
            <Icon name="refresh" size={16} />
            {snap.socialStatus === "loading"
              ? t("Syncing…", "同步中…")
              : t("Sync rewards", "同步奖励")}
          </button>
        </Dialog>
      )}
    </>
  );
}
