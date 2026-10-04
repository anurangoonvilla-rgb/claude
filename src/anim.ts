import { Easing, interpolate, spring } from "remotion";
import { FPS } from "./config";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

export const easeInOut = Easing.bezier(0.45, 0, 0.55, 1);
export const easeOut = Easing.bezier(0.16, 1, 0.3, 1);
export const easeIn = Easing.bezier(0.6, 0, 0.9, 0.4);

/** 0→1 between two times (seconds) with ease-in-out. */
export const ramp = (t: number, a: number, b: number, ease = easeInOut) =>
  interpolate(t, [a, b], [0, 1], { ...clamp, easing: ease });

/** Map t through arbitrary keyframes with a shared easing. */
export const keys = (
  t: number,
  input: number[],
  output: number[],
  ease = easeInOut,
) => interpolate(t, input, output, { ...clamp, easing: ease });

/** Spring that starts at time `at` (seconds). */
export const springAt = (
  frame: number,
  at: number,
  config: { damping?: number; stiffness?: number; mass?: number } = {},
) =>
  spring({
    frame: frame - Math.round(at * FPS),
    fps: FPS,
    config: { damping: 18, stiffness: 90, mass: 1, ...config },
  });

export const lerp = (a: number, b: number, k: number) => a + (b - a) * k;

/** Deterministic pseudo-random in [0,1). */
export const rand = (seed: number) => {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};
