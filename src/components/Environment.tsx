import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { keys, rand, ramp } from "../anim";
import { C, FPS, T } from "../config";

/** Deep background: navy→royal gradient and large translucent curved waves. */
export const Backdrop: React.FC<{ lightX: number; lightY: number }> = ({ lightX, lightY }) => {
  const frame = useCurrentFrame();
  const { width: w, height: h } = useVideoConfig();
  const t = frame / FPS;
  const on = ramp(t, T.stageFadeIn.start, T.stageFadeIn.end);
  const s = Math.max(w, h);
  const wv = (i: number, amp: number) => Math.sin(t * (0.11 + i * 0.03) + i * 1.7) * amp;

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
      <defs>
        <radialGradient id="bd-base" gradientUnits="userSpaceOnUse" cx={lightX} cy={lightY} r={s * 0.85}>
          <stop offset="0" stopColor={C.royal} stopOpacity="0.95" />
          <stop offset="0.35" stopColor="#0b1d78" />
          <stop offset="0.7" stopColor="#060d3a" />
          <stop offset="1" stopColor={C.navy} />
        </radialGradient>
        <linearGradient id="bd-wave1" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#3f78ff" stopOpacity="0.55" />
          <stop offset="0.6" stopColor={C.royal} stopOpacity="0.18" />
          <stop offset="1" stopColor={C.navy} stopOpacity="0" />
        </linearGradient>
        <linearGradient id="bd-wave2" x1="1" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={C.cyan} stopOpacity="0.35" />
          <stop offset="0.5" stopColor="#2752ff" stopOpacity="0.16" />
          <stop offset="1" stopColor={C.navy} stopOpacity="0" />
        </linearGradient>
        <linearGradient id="bd-wave3" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0" stopColor="#4f8dff" stopOpacity="0.45" />
          <stop offset="1" stopColor={C.navy} stopOpacity="0" />
        </linearGradient>
        <filter id="bd-soft" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="2.2" />
        </filter>
        <filter id="bd-haze" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="70" />
        </filter>
      </defs>
      <rect x={-w} y={-h} width={w * 3} height={h * 3} fill={C.navy} />
      <g opacity={on}>
        <rect x={-w} y={-h} width={w * 3} height={h * 3} fill="url(#bd-base)" />
        {/* Large curved translucent waves (echo the card artwork) */}
        <g transform={`rotate(${wv(0, 2)} ${w / 2} ${h / 2})`}>
          <circle cx={-s * 0.15 + wv(1, 20)} cy={-s * 0.55} r={s * 0.95} fill="url(#bd-wave1)" opacity={0.75} />
          <circle cx={-s * 0.15 + wv(1, 20)} cy={-s * 0.55} r={s * 0.95} fill="none" stroke={C.cyan} strokeOpacity={0.28} strokeWidth={3} filter="url(#bd-soft)" />
        </g>
        <g transform={`rotate(${wv(2, 2.5)} ${w / 2} ${h / 2})`}>
          <circle cx={w + s * 0.25 + wv(3, 25)} cy={h + s * 0.2} r={s * 0.78} fill="url(#bd-wave2)" opacity={0.7} />
          <circle cx={w + s * 0.25 + wv(3, 25)} cy={h + s * 0.2} r={s * 0.78} fill="none" stroke={C.cyan} strokeOpacity={0.3} strokeWidth={3} filter="url(#bd-soft)" />
        </g>
        <g transform={`rotate(${wv(4, 3)} ${w / 2} ${h / 2})`}>
          <ellipse cx={-s * 0.1 + wv(5, 30)} cy={h + s * 0.08} rx={s * 0.6} ry={s * 0.45} fill="url(#bd-wave3)" opacity={0.6} />
          <ellipse cx={-s * 0.1 + wv(5, 30)} cy={h + s * 0.08} rx={s * 0.6} ry={s * 0.45} fill="none" stroke="#8fd8ff" strokeOpacity={0.22} strokeWidth={2.5} filter="url(#bd-soft)" />
        </g>
        {/* Faint haze */}
        <ellipse cx={w * 0.3 + wv(6, 60)} cy={h * 0.35} rx={s * 0.3} ry={s * 0.12} fill="#3d6bff" opacity={0.12} filter="url(#bd-haze)" />
        <ellipse cx={w * 0.7 + wv(7, 60)} cy={h * 0.6} rx={s * 0.28} ry={s * 0.1} fill={C.cyan} opacity={0.07} filter="url(#bd-haze)" />
      </g>
    </svg>
  );
};

/** Spotlight beam from above + floor pool + glossy floor. Screen coords. */
export const StageLight: React.FC<{ cx: number; floorY: number; scale: number }> = ({ cx, floorY, scale }) => {
  const frame = useCurrentFrame();
  const { width: w, height: h } = useVideoConfig();
  const t = frame / FPS;
  const floorOn = ramp(t, T.stageFadeIn.start, T.stageFadeIn.end);
  // Switch-on with a single soft flicker
  const beam = keys(
    t,
    [T.beamOn, T.beamOn + 0.12, T.beamOn + 0.22, T.beamOn + 0.6],
    [0, 0.75, 0.35, 1],
  );
  const pool = keys(t, [T.floorPool - 0.15, T.floorPool + 0.35, T.floorPool + 1.2], [0, 1, 0.8]);
  const breathe = 0.92 + 0.08 * Math.sin(t * 1.3);
  const topW = 70 * scale;
  const botW = 680 * scale;
  const topY = -60;
  const beamPath = `M${cx - topW / 2} ${topY} L${cx + topW / 2} ${topY} L${cx + botW / 2} ${floorY} L${cx - botW / 2} ${floorY} Z`;

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
      <defs>
        <linearGradient id="sl-beam" x1="0" y1={topY} x2="0" y2={floorY} gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.55" />
          <stop offset="0.35" stopColor="#bfe8ff" stopOpacity="0.22" />
          <stop offset="1" stopColor={C.cyan} stopOpacity="0.1" />
        </linearGradient>
        <linearGradient id="sl-floor" x1="0" y1={floorY - 140 * scale} x2="0" y2={h + 200} gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#0a1a66" stopOpacity="0" />
          <stop offset="0.12" stopColor="#0a1a66" stopOpacity="0.55" />
          <stop offset="1" stopColor={C.navy} stopOpacity="0.95" />
        </linearGradient>
        <radialGradient id="sl-pool">
          <stop offset="0" stopColor="#d9f3ff" stopOpacity="0.85" />
          <stop offset="0.3" stopColor={C.cyan} stopOpacity="0.45" />
          <stop offset="0.7" stopColor={C.royal} stopOpacity="0.25" />
          <stop offset="1" stopColor={C.royal} stopOpacity="0" />
        </radialGradient>
        <filter id="sl-blur" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation={22 * scale} />
        </filter>
        <filter id="sl-blur-s" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation={6 * scale} />
        </filter>
      </defs>
      {/* Glossy floor plane */}
      <g opacity={floorOn}>
        <rect x={-w} y={floorY - 140 * scale} width={w * 3} height={h * 2} fill="url(#sl-floor)" />
        <ellipse cx={cx} cy={floorY - 4} rx={w * 0.9} ry={3} fill={C.cyan} opacity={0.08} filter="url(#sl-blur-s)" />
      </g>
      {/* Beam */}
      <g opacity={beam * breathe}>
        <path d={beamPath} fill="url(#sl-beam)" filter="url(#sl-blur)" />
        <path d={beamPath} fill="url(#sl-beam)" opacity={0.45} filter="url(#sl-blur-s)" />
        {/* Volumetric streaks */}
        {[-0.28, -0.1, 0.12, 0.3].map((k, i) => (
          <path
            key={i}
            d={`M${cx + k * topW} ${topY} L${cx + k * botW * (1 + 0.04 * Math.sin(t * 0.7 + i))} ${floorY}`}
            stroke="#e6f6ff"
            strokeOpacity={0.06 + 0.04 * Math.sin(t * 0.9 + i * 2)}
            strokeWidth={10 * scale}
            filter="url(#sl-blur-s)"
          />
        ))}
      </g>
      {/* Floor pool where the beam lands */}
      <ellipse cx={cx} cy={floorY} rx={640 * scale} ry={120 * scale} fill="url(#sl-pool)" opacity={pool * breathe} />
    </svg>
  );
};

/** Slow drifting particles. `layer` picks a seed set and size range. */
export const Particles: React.FC<{ count: number; seed: number; size: [number, number]; opacity: number; blur?: number }> = ({
  count,
  seed,
  size,
  opacity,
  blur = 0,
}) => {
  const frame = useCurrentFrame();
  const { width: w, height: h } = useVideoConfig();
  const t = frame / FPS;
  const on = ramp(t, T.logoMove.start, T.stageFadeIn.end);
  const pad = 120;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ position: "absolute", inset: 0, overflow: "visible", opacity: on * opacity }}>
      <defs>
        <radialGradient id={`pt-${seed}`}>
          <stop offset="0" stopColor="#ffffff" stopOpacity="1" />
          <stop offset="0.35" stopColor={C.cyan} stopOpacity="0.7" />
          <stop offset="1" stopColor={C.cyan} stopOpacity="0" />
        </radialGradient>
        {blur > 0 && (
          <filter id={`ptb-${seed}`}>
            <feGaussianBlur stdDeviation={blur} />
          </filter>
        )}
      </defs>
      <g filter={blur > 0 ? `url(#ptb-${seed})` : undefined}>
        {new Array(count).fill(0).map((_, i) => {
          const r1 = rand(seed * 1000 + i);
          const r2 = rand(seed * 2000 + i * 3.1);
          const r3 = rand(seed * 3000 + i * 7.7);
          const speed = 8 + r3 * 18; // px per second, upward
          const span = h + pad * 2;
          const y = ((r2 * span - t * speed) % span + span) % span - pad;
          const x = r1 * (w + pad * 2) - pad + Math.sin(t * (0.2 + r3 * 0.3) + i) * 22;
          const r = size[0] + (size[1] - size[0]) * rand(seed * 4000 + i);
          const tw = 0.45 + 0.55 * (0.5 + 0.5 * Math.sin(t * (0.8 + r1 * 1.5) + i * 2.3));
          return <circle key={i} cx={x} cy={y} r={r} fill={`url(#pt-${seed})`} opacity={tw} />;
        })}
      </g>
    </svg>
  );
};
