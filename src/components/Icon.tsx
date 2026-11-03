export type IconName =
  | "play"
  | "pause"
  | "arrow"
  | "help"
  | "close"
  | "check"
  | "copy"
  | "leaf"
  | "home"
  | "heart"
  | "exchange"
  | "cup"
  | "friends"
  | "rig"
  | "spark"
  | "chevron"
  | "external"
  | "refresh";
const paths: Record<IconName, React.ReactNode> = {
  play: <path d="m9 5 11 7-11 7z" fill="currentColor" stroke="none" />,
  pause: (
    <>
      <path d="M8 5v14M16 5v14" strokeWidth="3" />
    </>
  ),
  arrow: <path d="M4 12h15m-6-6 6 6-6 6" />,
  help: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.5 9a2.5 2.5 0 1 1 4 2c-1.5 1-1.5 1-1.5 3m0 3h.01" />
    </>
  ),
  close: <path d="m6 6 12 12M6 18 18 6" />,
  check: <path d="m5 12 4 4L19 6" />,
  copy: (
    <>
      <rect x="8" y="8" width="12" height="12" rx="2" />
      <path d="M15 8V4H4v11h4" />
    </>
  ),
  leaf: (
    <>
      <path d="M20 4C4 1 2 13 7 17S23 18 20 4Z" />
      <path d="M4 21 16 9m-7 7v-5m4 1h5" />
    </>
  ),
  home: (
    <>
      <path d="m3 10 9-7 9 7v10H3Z" />
      <path d="M9 20v-7h6v7" />
    </>
  ),
  heart: <path d="M20 5c-3-3-7-1-8 1-1-2-5-4-8-1s-1 7 8 14c9-7 11-11 8-14Z" />,
  exchange: (
    <>
      <path d="M3 7h17m-4-4 4 4-4 4M21 17H4m4-4-4 4 4 4" />
    </>
  ),
  cup: (
    <>
      <path d="M7 3h10v7a5 5 0 0 1-10 0ZM7 5H3v3c0 3 2 4 5 4m9-7h4v3c0 3-2 4-5 4M12 15v6m-5 0h10" />
    </>
  ),
  friends: (
    <>
      <circle cx="9" cy="8" r="3" />
      <path d="M3 20v-2a6 6 0 0 1 12 0v2m1-15a3 3 0 1 1 0 6m2 3a5 5 0 0 1 3 4v2" />
    </>
  ),
  rig: (
    <>
      <rect x="4" y="4" width="16" height="16" rx="2" />
      <circle cx="12" cy="12" r="4" />
      <path d="m12 8 1 3 3 1-3 1-1 3-1-3-3-1 3-1Z" />
    </>
  ),
  spark: <path d="m12 2 2.5 7.5L22 12l-7.5 2.5L12 22l-2.5-7.5L2 12l7.5-2.5Z" />,
  chevron: <path d="m6 9 6 6 6-6" />,
  external: (
    <>
      <path d="M14 3h7v7m0-7L10 14M10 5H3v16h16v-7" />
    </>
  ),
  refresh: (
    <>
      <path d="M20 10a8 8 0 1 0-1 7M20 3v7h-7" />
    </>
  ),
};
export function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  );
}
export function HamsterMark({ size = 36 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M10 17C0 10 9 1 16 9m8 0c8-8 17 2 7 9"
        fill="#b47c4b"
        stroke="#563b2c"
        strokeWidth="2"
      />
      <path
        d="M5 24C5 10 35 10 35 24c0 15-30 15-30 0Z"
        fill="#d7a36b"
        stroke="#563b2c"
        strokeWidth="2"
      />
      <path
        d="M10 27c0-9 8-7 10-3 3-4 10-6 10 3 0 10-20 10-20 0Z"
        fill="#fff1da"
      />
      <circle cx="13" cy="22" r="2" fill="#563b2c" />
      <circle cx="27" cy="22" r="2" fill="#563b2c" />
      <path
        d="m18 27 2 2 2-2m-2 2v3"
        stroke="#563b2c"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}
export function Mineral({ kind, size = 22 }: { kind: string; size?: number }) {
  const colors: Record<string, string[]> = {
    ore: ["#bd814a", "#e0b077", "#815433"],
    iron: ["#697775", "#a8b4ad", "#465451"],
    silver: ["#8c96aa", "#ccd3dd", "#596577"],
    gold: ["#bd8b30", "#e7c567", "#876019"],
  };
  const c = colors[kind] || colors.ore;
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} aria-hidden="true">
      <path d="m3 21 6-13 12-4 9 16-9 9H10Z" fill={c[0]} />
      <path d="M9 8 21 4l-3 15L3 21Z" fill={c[1]} />
      <path d="m18 19 12 1-9 9H10Z" fill={c[2]} />
      <path d="m9 8 9 11 3-15" fill="none" stroke={c[0]} strokeWidth="1.5" />
    </svg>
  );
}
