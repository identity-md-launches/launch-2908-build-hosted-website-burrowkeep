import { useEffect, useRef } from "react";
import { createRoomRenderer } from "../scene";
import type { Snapshot } from "../types";

export function Room({
  snapshot,
  animated,
  label,
}: {
  snapshot: Snapshot;
  animated: boolean;
  label: string;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const current = useRef(snapshot);
  const animation = useRef(animated);
  current.current = snapshot;
  animation.current = animated;
  useEffect(() => {
    if (!canvas.current) return;
    const paint = createRoomRenderer(canvas.current);
    const preference = matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;
    let previous = -100;
    let previousSnapshot: Snapshot | null = null;
    let previousAnimate: boolean | null = null;
    const loop = (now: number) => {
      const active = !preference.matches && animation.current;
      if (
        !document.hidden &&
        now - previous >= 50 &&
        ((current.current.running && active) ||
          previousSnapshot !== current.current ||
          active !== previousAnimate)
      ) {
        paint(current.current, now, active);
        previous = now;
        previousSnapshot = current.current;
        previousAnimate = active;
      }
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, []);
  return (
    <canvas
      ref={canvas}
      width="960"
      height="480"
      role="img"
      aria-label={label}
      className="room-canvas"
    />
  );
}
