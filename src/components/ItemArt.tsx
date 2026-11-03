// Small pixel illustrations echo the original room's palette.
export function ItemArt({ id }: { id: string }) {
  const wood = "#96633f",
    cream = "#edddbd",
    gold = "#d9a341",
    green = "#64815a",
    red = "#b96e5e";
  const art: Record<string, React.ReactNode> = {
    bowl: (
      <>
        <path d="M8 24h32l-6 12H14Z" fill={cream} />
        <ellipse cx="24" cy="24" rx="16" ry="5" fill="#bca480" />
        <path d="M15 21h6v5h-6m8-7h5v5h-5m8 3h4v4h-4" fill={gold} />
      </>
    ),
    mat: (
      <>
        <path d="M6 20h36v16H6Z" fill="#c39862" />
        <path
          d="M6 23h36M6 32h36M11 21v13m7-13v13m7-13v13m7-13v13m6-13v13"
          stroke="#edcd91"
          strokeWidth="2"
        />
      </>
    ),
    ball: (
      <>
        <circle cx="24" cy="26" r="13" fill={red} />
        <path d="M12 21h23v5H12m8-13v26" fill={cream} />
      </>
    ),
    crate: (
      <>
        <path d="M8 15h32v24H8Z" fill={wood} />
        <path d="M8 15h32v5H8m0 14h32v5H8" fill="#6f4c32" />
        <path d="m13 20 22 14m0-14L13 34" stroke="#bc9566" strokeWidth="3" />
      </>
    ),
    lamp: (
      <>
        <path d="M23 4h2v10h-2m-8 25h18v3H15m8-9h2v10h-2" fill={wood} />
        <path d="m18 13-7 17h26l-7-17Z" fill={gold} />
        <path d="M20 16h7l5 10H16Z" fill="#f7e4a9" />
      </>
    ),
    frame: (
      <>
        <path d="M10 8h28v32H10Z" fill={wood} />
        <path d="M14 12h20v24H14Z" fill="#b6d3da" />
        <path d="m14 29 8-11 6 8 6-4v14H14" fill={green} />
        <path d="M27 15h4v4h-4" fill={cream} />
      </>
    ),
    nest: (
      <>
        <ellipse cx="24" cy="31" rx="19" ry="10" fill={red} />
        <ellipse cx="24" cy="28" rx="15" ry="7" fill="#dec4a2" />
        <ellipse cx="24" cy="29" rx="10" ry="4" fill={cream} />
      </>
    ),
    plant: (
      <>
        <path d="M16 29h17l-3 13H19Z" fill={red} />
        <path d="M24 32V15" stroke={green} strokeWidth="3" />
        <path
          d="M24 25C9 25 7 14 14 14s11 6 10 11m1-6c-1-14 13-16 13-9s-8 11-13 9"
          fill={green}
        />
      </>
    ),
    curtain: (
      <>
        <path d="M6 9h36v3H6" fill={wood} />
        <path d="M9 12h12l-5 17 4 11H9Zm18 0h12v28H28l4-11Z" fill={red} />
        <path d="M11 29h7m13 0h6" stroke={gold} strokeWidth="2" />
      </>
    ),
    clock: (
      <>
        <path d="M12 10h24v31H12Z" fill={wood} />
        <circle cx="24" cy="22" r="9" fill={cream} />
        <path d="M24 16v6h5m-13 14h16" stroke="#654630" strokeWidth="2" />
      </>
    ),
    shelf: (
      <>
        <path d="M7 20h34v4H7m3 0v9m28-9v9" stroke={wood} strokeWidth="3" />
        <path d="M12 7h5v13h-5" fill={red} />
        <path d="M19 9h5v11h-5" fill={green} />
        <path d="M26 6h5v14h-5" fill="#93aebb" />
        <path d="M33 10h5v10h-5" fill={gold} />
      </>
    ),
    tin: (
      <>
        <path d="M13 14h23v27H13Z" fill={red} />
        <path d="M12 10h25v6H12" fill={cream} />
        <path d="m24 21 2 4 5 1-4 3v5l-3-2-4 2 1-5-4-3 5-1Z" fill={gold} />
      </>
    ),
    bell: (
      <>
        <path d="M23 4h2v8h-2" fill={wood} />
        <path d="M14 28V18c0-11 20-11 20 0v10l5 5H9Z" fill={gold} />
        <path d="M21 33h6v5h-6" fill={wood} />
        <path d="M18 18v8" stroke={cream} strokeWidth="3" />
      </>
    ),
    banner: (
      <>
        <path d="M8 7h32v4H8" fill={wood} />
        <path d="M11 11h26v24l-13 7-13-7Z" fill={red} />
        <path d="m24 16 3 6 6 1-5 5 1 6-5-3-5 3 1-6-5-5 6-1Z" fill={gold} />
      </>
    ),
    crown: (
      <>
        <path d="m7 15 8 7 9-13 9 13 8-7-4 22H11Z" fill={gold} />
        <path d="M12 32h24v5H12" fill="#b58029" />
        <path d="M22 25h4v5h-4" fill={red} />
      </>
    ),
    oil: (
      <>
        <path d="M16 19h21v21H16Z" fill={green} />
        <path
          d="M20 13h13v6H20m11 7h7l5-7M16 22H9v11h7"
          stroke={wood}
          strokeWidth="3"
        />
        <path d="m26 24-4 7a4 4 0 0 0 8 0Z" fill={gold} />
      </>
    ),
    rim: (
      <>
        <circle
          cx="24"
          cy="24"
          r="17"
          fill="none"
          stroke={gold}
          strokeWidth="6"
        />
        <circle cx="24" cy="24" r="5" fill={gold} />
        <path
          d="M24 7v34M7 24h34M12 12l24 24M12 36l24-24"
          stroke={gold}
          strokeWidth="3"
        />
      </>
    ),
  };
  return (
    <svg
      className="item-art"
      width="64"
      height="64"
      viewBox="0 0 48 48"
      aria-hidden="true"
      shapeRendering="crispEdges"
    >
      {art[id] || art.bowl}
    </svg>
  );
}
