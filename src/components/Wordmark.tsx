import React from "react";
import { useCurrentFrame } from "remotion";
import { easeOut, keys, ramp, springAt } from "../anim";
import { C, FPS, T } from "../config";
import wordmark from "../wordmark-paths.json";

// Vector paths copied verbatim from the supplied MillionAIre Club artwork
// (assets/membership-card.pdf, see scripts/extract-wordmark.py).
type P = { d: string; evenOdd: boolean; bbox: number[] };
const G = wordmark.groups as Record<string, P[]>;
const [VX, VY, VW, VH] = wordmark.viewBox;

const Paths: React.FC<{ group: string; fill?: string }> = ({ group, fill = "#fff" }) => (
  <>
    {G[group].map((p, i) => (
      <path key={i} d={p.d} fill={fill} fillRule={p.evenOdd ? "evenodd" : "nonzero"} clipRule={p.evenOdd ? "evenodd" : "nonzero"} />
    ))}
  </>
);

export const WORDMARK_ASPECT = VH / VW;

export const Wordmark: React.FC<{ width: number }> = ({ width }) => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const scale = width / VW;

  // Main L→R reveal behind a light sweep
  const rev = ramp(t, T.wordmark.start, T.wordmark.end);
  const edge = VX - 8 + (VW + 16) * rev;
  const soft = 6;

  // "AI" glows last
  const ai = ramp(t, T.aiGlow, T.aiGlow + 0.6, easeOut);
  const aiGlow = keys(t, [T.aiGlow, T.aiGlow + 0.5, T.aiGlow + 1.6], [0, 1, 0.42]);

  // "By Noteai" settles in beneath
  const by = springAt(frame, T.byNoteai, { damping: 20, stiffness: 70 });

  return (
    <svg
      width={width}
      height={VH * scale}
      viewBox={`${VX} ${VY} ${VW} ${VH}`}
      style={{ overflow: "visible", display: "block" }}
    >
      <defs>
        <linearGradient id="wm-wipe" gradientUnits="userSpaceOnUse" x1={edge - soft} x2={edge} y1={0} y2={0}>
          <stop offset="0" stopColor="#fff" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <mask id="wm-reveal" maskUnits="userSpaceOnUse" x={VX - 10} y={VY - 10} width={VW + 20} height={VH + 20}>
          <rect x={VX - 10} y={VY - 10} width={VW + 20} height={VH + 20} fill="url(#wm-wipe)" />
        </mask>
        <clipPath id="wm-shape">
          {["million", "re", "club"].flatMap((g) =>
            G[g].map((p, i) => (
              <path key={g + i} d={p.d} clipRule={p.evenOdd ? "evenodd" : "nonzero"} />
            )),
          )}
        </clipPath>
        <linearGradient id="wm-sweep" gradientUnits="userSpaceOnUse" x1={edge - 14} x2={edge + 2} y1={0} y2={0}>
          <stop offset="0" stopColor={C.cyan} stopOpacity="0" />
          <stop offset="0.75" stopColor="#dff6ff" stopOpacity="0.95" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <filter id="wm-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="1.6" result="b1" />
          <feGaussianBlur in="SourceGraphic" stdDeviation="0.5" result="b2" />
          <feMerge>
            <feMergeNode in="b1" />
            <feMergeNode in="b2" />
          </feMerge>
        </filter>
        <filter id="wm-soft" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="0.9" />
        </filter>
      </defs>

      {/* Million / re / Club */}
      <g mask="url(#wm-reveal)">
        <Paths group="million" />
        <Paths group="re" />
        <Paths group="club" />
      </g>

      {/* A + i + sparkle: arrive last, with a cyan glow */}
      <g opacity={ai}>
        <g opacity={aiGlow} filter="url(#wm-glow)">
          <Paths group="A" fill={C.cyan} />
          <Paths group="i" fill={C.cyan} />
          <Paths group="star" fill={C.cyan} />
        </g>
        <Paths group="A" />
        <Paths group="i" />
        <Paths group="star" />
      </g>

      {/* Light sweep riding the reveal edge */}
      {rev > 0 && rev < 1 && (
        <g clipPath="url(#wm-shape)">
          <rect x={VX - 10} y={VY - 10} width={VW + 20} height={VH + 20} fill="url(#wm-sweep)" />
        </g>
      )}
      {/* By Noteai ✦ */}
      <g
        opacity={by}
        transform={`translate(0 ${(1 - by) * 3})`}
      >
        <Paths group="byNoteai" />
      </g>
    </svg>
  );
};
