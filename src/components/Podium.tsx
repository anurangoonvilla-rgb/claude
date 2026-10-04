import React from "react";
import { useCurrentFrame } from "remotion";
import { easeOut, keys, ramp, springAt } from "../anim";
import { C, FPS, T } from "../config";
import wordmark from "../wordmark-paths.json";

// Local coordinates: (0,0) is the floor point under the podium centre.
// Glass letters reuse the supplied "A", "i" and sparkle outlines from the
// MillionAIre artwork, rendered as glass props on the stage.
type P = { d: string; evenOdd: boolean; bbox: number[] };
const G = wordmark.groups as Record<string, P[]>;

const R1 = { rx: 330, ry: 60, h: 44 };
const R2 = { rx: 236, ry: 43, h: 36 };
const TOP1 = -R1.h;
const TOP2 = TOP1 - R2.h;
const K = 16; // glyph scale (path units → px)
const GLYPH_CX = 114.6; // centre of A+i in path units
const BASELINE = 55.5;
const STAND = TOP2 + 4;

export const glyphToLocal = (x: number, y: number) => ({
  x: K * (x - GLYPH_CX),
  y: STAND + K * (y - BASELINE),
});
export const STAR_LOCAL = glyphToLocal(125.5, 37.65);
export const PODIUM_TOP = TOP2;

const sidePath = (rx: number, ry: number, top: number, bottom: number) =>
  `M${-rx} ${top} A${rx} ${ry} 0 0 0 ${rx} ${top} L${rx} ${bottom} A${rx} ${ry} 0 0 1 ${-rx} ${bottom} Z`;

const Ring: React.FC<{
  id: string;
  px: string;
  rx: number;
  ry: number;
  top: number;
  bottom: number;
  lit: number; // 0..1 overall light level
  sweep: number; // 0..1 rim-glow sweep progress
  t: number;
}> = ({ id, px, rx, ry, top, bottom, lit, sweep, t }) => {
  id = `${px}-${id}`;
  const rimSteady = lit * (0.55 + 0.08 * Math.sin(t * 1.7));
  return (
    <g>
      <defs>
        <linearGradient id={`${id}-side`} x1={-rx} x2={rx} y1={0} y2={0} gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#040a2a" />
          <stop offset="0.35" stopColor="#0d2a8f" />
          <stop offset="0.5" stopColor="#1840c8" />
          <stop offset="0.65" stopColor="#0d2a8f" />
          <stop offset="1" stopColor="#040a2a" />
        </linearGradient>
        <radialGradient id={`${id}-top`} cx="0.5" cy="0.45" r="0.6">
          <stop offset="0" stopColor="#2a56e6" />
          <stop offset="0.55" stopColor="#0f2580" />
          <stop offset="1" stopColor="#060d38" />
        </radialGradient>
      </defs>
      {/* Side band */}
      <path d={sidePath(rx, ry, top, bottom)} fill="#050a26" />
      <path d={sidePath(rx, ry, top, bottom)} fill={`url(#${id}-side)`} opacity={0.25 + 0.75 * lit} />
      {/* Bottom rim highlight */}
      <path
        d={`M${-rx} ${bottom} A${rx} ${ry} 0 0 0 ${rx} ${bottom}`}
        fill="none"
        stroke={C.cyan}
        strokeWidth={2}
        opacity={0.35 * lit}
      />
      {/* Top face */}
      <ellipse cx={0} cy={top} rx={rx} ry={ry} fill="#060c30" />
      <ellipse cx={0} cy={top} rx={rx} ry={ry} fill={`url(#${id}-top)`} opacity={0.2 + 0.8 * lit} />
      {/* Specular reflection of the beam on the top face */}
      <ellipse cx={0} cy={top - ry * 0.15} rx={rx * 0.45} ry={ry * 0.32} fill="#9fdcff" opacity={0.18 * lit} filter={`url(#${px}-blur12)`} />
      {/* Steady rim glow */}
      <ellipse cx={0} cy={top} rx={rx} ry={ry} fill="none" stroke={C.cyan} strokeWidth={8} opacity={rimSteady * 0.6} filter={`url(#${px}-blur8)`} />
      <ellipse cx={0} cy={top} rx={rx} ry={ry} fill="none" stroke="#c9eeff" strokeWidth={1.8} opacity={rimSteady} />
      {/* Sweeping rim glint */}
      {sweep > 0 && sweep < 1 && (
        <g opacity={Math.sin(Math.PI * sweep)}>
          <ellipse
            cx={0}
            cy={top}
            rx={rx}
            ry={ry}
            fill="none"
            stroke="#ffffff"
            strokeWidth={14}
            pathLength={100}
            strokeDasharray="16 84"
            strokeDashoffset={-100 * sweep - 60}
            filter={`url(#${px}-blur8)`}
          />
          <ellipse
            cx={0}
            cy={top}
            rx={rx}
            ry={ry}
            fill="none"
            stroke="#ffffff"
            strokeWidth={3}
            pathLength={100}
            strokeDasharray="10 90"
            strokeDashoffset={-100 * sweep - 63}
          />
        </g>
      )}
    </g>
  );
};

const GlassGlyph: React.FC<{
  id: string;
  px: string;
  paths: P[];
  rise: number; // 0..1
  t: number;
  refraction: number; // 0..1 intensity of internal light
  bbox: [number, number, number, number]; // local px bbox
}> = ({ id, px, paths, rise, t, refraction, bbox }) => {
  id = `${px}-${id}`;
  const [x0, y0, x1, y1] = bbox;
  const hgt = y1 - y0;
  const dy = (1 - rise) * (hgt + 30);
  // Refraction band drifting slowly through the glass
  const bandX = x0 - 120 + ((t * 70) % (x1 - x0 + 260));
  const transform = `translate(${-K * GLYPH_CX} ${STAND - K * BASELINE}) scale(${K})`;
  const shapes = (props: React.SVGProps<SVGPathElement>) =>
    paths.map((p, i) => (
      <path key={i} d={p.d} fillRule={p.evenOdd ? "evenodd" : "nonzero"} clipRule={p.evenOdd ? "evenodd" : "nonzero"} {...props} />
    ));
  return (
    <g clipPath={`url(#${px}-above-top)`}>
      <g transform={`translate(0 ${dy})`} opacity={Math.min(1, rise * 2.5)}>
        <defs>
          <clipPath id={`${id}-clip`}>
            <g transform={transform}>{shapes({})}</g>
          </clipPath>
          <linearGradient id={`${id}-fill`} x1={x0} y1={y0} x2={x1} y2={y1} gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#e8f7ff" stopOpacity="0.42" />
            <stop offset="0.3" stopColor="#6f97ff" stopOpacity="0.12" />
            <stop offset="0.65" stopColor="#2a50e0" stopOpacity="0.16" />
            <stop offset="1" stopColor={C.cyan} stopOpacity="0.42" />
          </linearGradient>
          <linearGradient id={`${id}-edge`} x1={x0} y1={y0} x2={x1} y2={y1} gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#ffffff" stopOpacity="0.95" />
            <stop offset="0.45" stopColor="#bfe8ff" stopOpacity="0.35" />
            <stop offset="1" stopColor={C.cyan} stopOpacity="0.9" />
          </linearGradient>
        </defs>
        {/* Back-light bloom */}
        <g transform={transform} filter={`url(#${px}-blur24)`} opacity={0.55 * refraction}>
          {shapes({ fill: C.cyan })}
        </g>
        {/* Glass body */}
        <g transform={transform}>{shapes({ fill: `url(#${id}-fill)` })}</g>
        {/* Internal light: refraction band + caustic */}
        <g clipPath={`url(#${id}-clip)`}>
          <rect
            x={bandX}
            y={y0 - 200}
            width={70}
            height={hgt + 400}
            fill="#e8f8ff"
            opacity={0.35 * refraction}
            transform={`rotate(24 ${bandX} ${(y0 + y1) / 2})`}
            filter={`url(#${px}-blur8)`}
          />
          <ellipse cx={(x0 + x1) / 2} cy={y1 - 20} rx={(x1 - x0) * 0.45} ry={40} fill={C.cyan} opacity={0.45 * refraction} filter={`url(#${px}-blur24)`} />
          <ellipse cx={x0 + (x1 - x0) * 0.3} cy={y0 + 30} rx={50} ry={90} fill="#ffffff" opacity={0.18 * refraction} filter={`url(#${px}-blur24)`} />
        </g>
        {/* Chromatic fringe + bright rim */}
        <g transform={`translate(-1.5 0) ${transform}`} opacity={0.35 * refraction}>
          {shapes({ fill: "none", stroke: "#ff7ad9", strokeWidth: 0.12 })}
        </g>
        <g transform={`translate(1.5 0) ${transform}`} opacity={0.45 * refraction}>
          {shapes({ fill: "none", stroke: "#58e1ff", strokeWidth: 0.12 })}
        </g>
        {/* Thick inner bevel (stroke clipped to the inside) + crisp rim */}
        <g clipPath={`url(#${id}-clip)`}>
          <g transform={transform} opacity={0.55}>
            {shapes({ fill: "none", stroke: `url(#${id}-edge)`, strokeWidth: 0.9, filter: `url(#${px}-blur8)` })}
          </g>
          <g transform={transform} opacity={0.7}>
            {shapes({ fill: "none", stroke: `url(#${id}-edge)`, strokeWidth: 0.45 })}
          </g>
        </g>
        <g transform={transform}>
          {shapes({ fill: "none", stroke: "#effaff", strokeWidth: 0.12, opacity: 0.95 })}
        </g>
      </g>
    </g>
  );
};

const bboxOf = (paths: P[]) => {
  const bb = paths.reduce(
    (a, p) => [Math.min(a[0], p.bbox[0]), Math.min(a[1], p.bbox[1]), Math.max(a[2], p.bbox[2]), Math.max(a[3], p.bbox[3])],
    [Infinity, Infinity, -Infinity, -Infinity],
  );
  const a = glyphToLocal(bb[0], bb[1]);
  const b = glyphToLocal(bb[2], bb[3]);
  return [a.x, a.y, b.x, b.y] as [number, number, number, number];
};

export const Podium: React.FC<{ px?: string }> = ({ px = "pd" }) => {
  const frame = useCurrentFrame();
  const t = frame / FPS;

  const present = ramp(t, T.stageFadeIn.start + 0.4, T.stageFadeIn.end);
  const r1 = ramp(t, T.ring1, T.ring1 + 0.5);
  const r2 = ramp(t, T.ring2, T.ring2 + 0.5);
  const s1 = ramp(t, T.ring1, T.ring1 + 1.3);
  const s2 = ramp(t, T.ring2, T.ring2 + 1.3);
  const riseA = springAt(frame, T.glassA, { damping: 22, stiffness: 55 });
  const riseI = springAt(frame, T.glassI, { damping: 22, stiffness: 55 });
  const refrA = keys(t, [T.glassA + 0.3, T.glassA + 1.2], [0, 1]);
  const refrI = keys(t, [T.glassI + 0.3, T.glassI + 1.2], [0, 1]);

  const bbA = bboxOf(G.A);
  const bbI = bboxOf(G.i);

  return (
    <g opacity={present}>
      <defs>
        <filter id={`${px}-blur8`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="6" />
        </filter>
        <filter id={`${px}-blur12`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="12" />
        </filter>
        <filter id={`${px}-blur24`} x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation="20" />
        </filter>
        <clipPath id={`${px}-above-top`}>
          <rect x={-2000} y={-3000} width={4000} height={3000 + TOP2 + 6} />
        </clipPath>
      </defs>
      <Ring px={px} id="r1" rx={R1.rx} ry={R1.ry} top={TOP1} bottom={0} lit={r1} sweep={s1} t={t} />
      <Ring px={px} id="r2" rx={R2.rx} ry={R2.ry} top={TOP2} bottom={TOP1} lit={r2} sweep={s2} t={t} />
      <GlassGlyph px={px} id="ga" paths={G.A} rise={riseA} t={t} refraction={refrA} bbox={bbA} />
      <GlassGlyph px={px} id="gi" paths={G.i} rise={riseI} t={t + 3} refraction={refrI} bbox={bbI} />
    </g>
  );
};

/** Sparkle star above the "i" + lens flare. Drawn in podium-local coords. */
export const Star: React.FC = () => {
  const px = "pd";
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const ign = springAt(frame, T.starIgnite, { damping: 12, stiffness: 120 });
  if (t < T.starIgnite) return null;
  const flare = keys(t, [T.starIgnite, T.starIgnite + 0.25, T.starIgnite + 1.4], [0, 1, 0.55], easeOut);
  // Settle to a gentle shimmer in the poster
  const settled = t > T.flashOut.start ? 0.6 + 0.1 * Math.sin(t * 2.4) : 1;
  const { x, y } = STAR_LOCAL;
  const starScale = 1.35;
  const transform = `translate(${x} ${y}) scale(${ign * starScale}) translate(${-x} ${-y}) translate(${-K * GLYPH_CX} ${STAND - K * BASELINE}) scale(${K})`;
  const rot = t * 6;
  return (
    <g>
      <defs>
        <radialGradient id="st-core">
          <stop offset="0" stopColor="#ffffff" stopOpacity="1" />
          <stop offset="0.25" stopColor="#bfe9ff" stopOpacity="0.8" />
          <stop offset="1" stopColor={C.cyan} stopOpacity="0" />
        </radialGradient>
        <linearGradient id="st-streak" x1="0" x2="1">
          <stop offset="0" stopColor={C.cyan} stopOpacity="0" />
          <stop offset="0.5" stopColor="#ffffff" stopOpacity="0.9" />
          <stop offset="1" stopColor={C.cyan} stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* Bloom */}
      <circle cx={x} cy={y} r={170 * flare * settled} fill="url(#st-core)" opacity={0.8} />
      {/* Anamorphic streak */}
      <ellipse cx={x} cy={y} rx={900 * flare} ry={5 * flare + 1} fill="url(#st-streak)" opacity={0.85 * flare * settled} />
      <ellipse cx={x} cy={y} rx={520 * flare} ry={22 * flare} fill="url(#st-streak)" opacity={0.25 * flare * settled} filter={`url(#${px}-blur8)`} />
      {/* Starburst rays */}
      <g transform={`rotate(${rot} ${x} ${y})`} opacity={0.5 * flare * settled}>
        {[0, 45, 90, 135].map((a) => (
          <ellipse key={a} cx={x} cy={y} rx={220 * flare} ry={1.6} fill="#e8f8ff" transform={`rotate(${a} ${x} ${y})`} />
        ))}
      </g>
      {/* Ghost rings */}
      <circle cx={x - 260} cy={y + 180} r={46} fill="none" stroke={C.cyan} strokeWidth={2} opacity={0.22 * flare * settled} />
      <circle cx={x - 420} cy={y + 290} r={22} fill="#7c5cff" opacity={0.14 * flare * settled} />
      <circle cx={x + 180} cy={y - 120} r={30} fill={C.cyan} opacity={0.1 * flare * settled} />
      {/* The star itself (supplied sparkle outline) */}
      <g transform={transform} filter={`url(#${px}-blur8)`} opacity={0.9}>
        {G.star.map((p, i) => (
          <path key={i} d={p.d} fill={C.cyan} />
        ))}
      </g>
      <g transform={transform}>
        {G.star.map((p, i) => (
          <path key={i} d={p.d} fill="#ffffff" />
        ))}
      </g>
    </g>
  );
};
