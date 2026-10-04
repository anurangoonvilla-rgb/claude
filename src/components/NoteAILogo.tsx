import React from "react";
import { staticFile, useCurrentFrame } from "remotion";
import { easeOut, keys, ramp, springAt } from "../anim";
import { FPS, T } from "../config";

// The supplied PNG is used as-is. Every effect below is a mask, clip, scale,
// opacity or light layer over the original pixels; nothing is redrawn.
const W = 615;
const H = 586;
const LOGO = staticFile("noteai-logo.png");

// Measured from the PNG.
const DOTS = [
  { cx: 53.5, cy: 551.5 },
  { cx: 71.5, cy: 551.5 },
  { cx: 89.5, cy: 551.5 },
];
const NOTCH = { x: 492, y: 326, w: W - 492, h: 220 }; // right-edge notch piece
const TEXT_BOTTOM = 420; // "Note ai" lives above this row

export const NoteAILogo: React.FC<{ width: number }> = ({ width }) => {
  const frame = useCurrentFrame();
  const t = frame / FPS;

  // After the intro build is complete we show the untouched PNG on its own.
  const built = t >= T.logoSweep.start;

  // 1) Line → square: clip opens vertically from a thin line.
  const open = keys(t, [T.logoExpand.start, T.logoExpand.end], [0, 1], easeOut);
  const clipH = 6 + (H - 6) * open;
  const clipY = H / 2 - clipH / 2;

  // 2) Notch piece snaps in from the right with a springy overshoot.
  const notchS = springAt(frame, T.notchSnap, { damping: 13, stiffness: 260 });
  const notchDx = (1 - notchS) * 70;
  const notchScale = 1 + (1 - notchS) * 0.25;
  const notchSettled = t > T.notchSnap + 0.45;

  // 3) Text wipe (soft edge), left → right.
  const wipe = ramp(t, T.textWipe.start, T.textWipe.end);
  const wipeX = -60 + (W + 120) * wipe;

  // 5) Light sweep: diagonal band crossing once.
  const sweep = ramp(t, T.logoSweep.start, T.logoSweep.end);
  const sweepX = -300 + (W + 600) * sweep;
  const sweepOn = t > T.logoSweep.start && t < T.logoSweep.end;

  const scale = width / W;

  return (
    <svg
      width={width}
      height={H * scale}
      viewBox={`0 0 ${W} ${H}`}
      style={{ overflow: "visible", display: "block" }}
    >
      <defs>
        {/* Alpha of the logo with its white text/dots knocked out
            (derived from the logo's own pixels: alpha' = k·(A − G)). */}
        <filter id="nl-textless" colorInterpolationFilters="sRGB">
          <feColorMatrix
            type="matrix"
            values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 -1.85 0 1.85 0"
          />
        </filter>
        {/* Logo silhouette as a luminance mask */}
        <filter id="nl-silhouette" colorInterpolationFilters="sRGB">
          <feColorMatrix
            type="matrix"
            values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 1 0"
          />
        </filter>
        <mask id="nl-alpha" maskUnits="userSpaceOnUse" x={0} y={0} width={W} height={H}>
          <image href={LOGO} width={W} height={H} filter="url(#nl-silhouette)" />
        </mask>

        <clipPath id="nl-open">
          <rect x={0} y={clipY} width={W} height={clipH} />
        </clipPath>
        <mask id="nl-body" maskUnits="userSpaceOnUse" x={-50} y={-50} width={W + 100} height={H + 100}>
          <rect x={0} y={clipY} width={W} height={clipH} fill="#fff" />
          {!notchSettled && (
            <rect x={NOTCH.x} y={NOTCH.y} width={NOTCH.w + 2} height={NOTCH.h} fill="#000" />
          )}
        </mask>
        <clipPath id="nl-notch">
          <rect x={NOTCH.x} y={NOTCH.y} width={NOTCH.w + 2} height={NOTCH.h} />
        </clipPath>

        <linearGradient id="nl-wipe-grad" x1={wipeX - 60} x2={wipeX} y1={0} y2={0} gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#fff" stopOpacity="1" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <mask id="nl-wipe" maskUnits="userSpaceOnUse" x={0} y={0} width={W} height={H}>
          <rect x={0} y={0} width={W} height={TEXT_BOTTOM} fill="url(#nl-wipe-grad)" />
        </mask>

        {DOTS.map((d, i) => (
          <clipPath id={`nl-dot-${i}`} key={i}>
            <circle cx={d.cx} cy={d.cy} r={8.5} />
          </clipPath>
        ))}

        <linearGradient id="nl-sweep" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="#fff" stopOpacity="0" />
          <stop offset="0.5" stopColor="#fff" stopOpacity="0.55" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
      </defs>

      {built ? (
        <image href={LOGO} width={W} height={H} />
      ) : (
        <>
          {/* Body (text knocked out until the wipe) */}
          <g mask="url(#nl-body)">
            <image href={LOGO} width={W} height={H} filter="url(#nl-textless)" />
          </g>
          {/* Notch piece snapping into place */}
          {!notchSettled && t >= T.notchSnap && (
            <g
              transform={`translate(${notchDx} 0) translate(${NOTCH.x} ${NOTCH.y + NOTCH.h / 2}) scale(${notchScale}) translate(${-NOTCH.x} ${-(NOTCH.y + NOTCH.h / 2)})`}
              opacity={Math.min(1, notchS * 1.6)}
            >
              <g clipPath="url(#nl-notch)">
                <image href={LOGO} width={W} height={H} filter="url(#nl-textless)" />
              </g>
            </g>
          )}
          {/* "Note ai" wipe */}
          {wipe > 0 && (
            <g mask="url(#nl-wipe)">
              <image href={LOGO} width={W} height={H} />
            </g>
          )}
          {/* Dots pop in one after another */}
          {DOTS.map((d, i) => {
            const s = springAt(frame, T.dots.start + i * T.dots.stagger, {
              damping: 9,
              stiffness: 220,
            });
            if (s <= 0.001) return null;
            return (
              <g
                key={i}
                transform={`translate(${d.cx} ${d.cy}) scale(${s}) translate(${-d.cx} ${-d.cy})`}
              >
                <g clipPath={`url(#nl-dot-${i})`}>
                  <image href={LOGO} width={W} height={H} />
                </g>
              </g>
            );
          })}
        </>
      )}

      {/* Single light sweep, masked to the logo silhouette */}
      {sweepOn && (
        <g mask="url(#nl-alpha)">
          <rect
            x={sweepX - 140}
            y={-200}
            width={280}
            height={H + 400}
            fill="url(#nl-sweep)"
            transform={`rotate(18 ${sweepX} ${H / 2})`}
          />
        </g>
      )}
    </svg>
  );
};
