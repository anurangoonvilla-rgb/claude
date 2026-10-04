import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { easeIn, easeOut, keys, lerp, ramp, springAt } from "./anim";
import { C, COPY, DURATION, FPS, LANDSCAPE, Layout, PORTRAIT, T } from "./config";
import { Backdrop, Particles, StageLight } from "./components/Environment";
import { NoteAILogo } from "./components/NoteAILogo";
import { Podium, Star, STAR_LOCAL } from "./components/Podium";
import { Wordmark, WORDMARK_ASPECT } from "./components/Wordmark";
import { Soundtrack } from "./Soundtrack";

const FONT = "'Plus Jakarta Sans', sans-serif";
const LOGO_ASPECT = 586 / 615;

/** Slow continuous camera drift; `depth` scales parallax. */
const drift = (t: number, depth: number) => ({
  x: (Math.sin(t * 0.23) * 16 + Math.sin(t * 0.61 + 1) * 4) * depth,
  y: (Math.cos(t * 0.19) * 9 + Math.sin(t * 0.47 + 2) * 3) * depth,
});

const Layer: React.FC<{ t: number; depth: number; children: React.ReactNode; style?: React.CSSProperties }> = ({
  t,
  depth,
  children,
  style,
}) => {
  const d = drift(t, depth);
  const s = 1 + 0.012 * depth * Math.sin(t * 0.15);
  return (
    <AbsoluteFill style={{ transform: `translate(${d.x}px, ${d.y}px) scale(${s})`, ...style }}>{children}</AbsoluteFill>
  );
};

export const Launch: React.FC<{ orientation: "landscape" | "portrait" }> = ({ orientation }) => {
  const frame = useCurrentFrame();
  const { width: w, height: h } = useVideoConfig();
  const t = frame / FPS;
  const L: Layout = orientation === "landscape" ? LANDSCAPE : PORTRAIT;

  // ── Podium placement: hero (centred) until the flash, poster layout after.
  const revealed = t >= T.flashOut.start;
  const pod = revealed ? L.podiumFinal : L.podiumHero;
  const starX = pod.cx + STAR_LOCAL.x * pod.scale;
  const starY = pod.floorY + STAR_LOCAL.y * pod.scale;

  // ── Camera push-in toward the star (10–12s), plus a gentle settle after.
  const push = keys(t, [T.pushIn.start, T.pushIn.end], [0, 1], easeIn);
  const pushScale = revealed ? keys(t, [T.flashOut.start, T.flashOut.end + 1.5], [1.08, 1], easeOut) : 1 + 2.2 * push;
  const pushOrigin = revealed ? `${w / 2}px ${h / 2}px` : `${starX}px ${starY}px`;
  const slowPush = 1 + 0.025 * ramp(t, T.flashOut.end, DURATION); // hold drift

  // ── Logo: centre intro → poster position
  const mv = springAt(frame, T.logoMove.start, { damping: 26, stiffness: 38 });
  const logoCx = lerp(L.logoIntro.cx, L.logoFinal.cx, mv);
  const logoCy = lerp(L.logoIntro.cy, L.logoFinal.cy, mv);
  const logoW = lerp(L.logoIntro.w, L.logoFinal.w, mv);
  const logoVisible = t >= T.logoExpand.start;
  // Logo stays in the poster through the flash
  const logoIntroGlow = keys(t, [T.logoExpand.start, T.logoExpand.end, T.logoMove.start, T.logoMove.start + 1.2], [0, 1, 1, 0]);

  // ── Light line (0–1s)
  const lineW = keys(t, [T.lineDraw.start, T.lineDraw.end], [0, L.logoIntro.w], easeOut);
  const lineFade = keys(t, [T.logoExpand.start, T.logoExpand.start + 0.35], [1, 0]);

  // ── Glow spill: logo glow becomes the blue stage light
  const spill = ramp(t, T.logoMove.start, T.logoMove.end);
  const spillCx = lerp(L.logoIntro.cx, L.podiumHero.cx, spill);
  const spillCy = lerp(L.logoIntro.cy, L.podiumHero.floorY - 260, spill);

  // ── Flash
  const flash = Math.max(
    keys(t, [T.flashBuild.start, T.flashBuild.end], [0, 1], easeIn) * (t < T.flashOut.start ? 1 : 0),
    t >= T.flashOut.start ? keys(t, [T.flashOut.start, T.flashOut.end], [1, 0], easeOut) : 0,
  );

  // ── Text
  const textOn = t >= T.flashOut.start;
  const urlO = ramp(t, T.url, T.url + 0.9);
  const ctaO = springAt(frame, T.cta, { damping: 24, stiffness: 60 });

  // ── Final fade to black
  const fade = keys(t, [DURATION - T.fadeToBlack, DURATION], [0, 1]);

  const lightX = revealed ? pod.cx : L.podiumHero.cx;
  const lightY = pod.floorY - 300 * pod.scale;

  const textLeft = L.text.align === "left";
  const wmLeft = textLeft ? L.text.x : L.text.x - L.text.wordmarkW / 2;

  return (
    <AbsoluteFill style={{ backgroundColor: C.navy, overflow: "hidden", fontFamily: FONT }}>
      <Soundtrack />
      {/* Skip the scene entirely while the flash fully covers it (saves very slow frames) */}
      {flash < 0.985 && (
      <AbsoluteFill
        style={{
          transform: `scale(${pushScale * slowPush})`,
          transformOrigin: pushOrigin,
          // Composite the scene as a bitmap while zooming instead of re-rasterising
          // every blur at 3x (software GPU); the push ends in a white flash anyway.
          willChange: push > 0 && !revealed ? "transform" : undefined,
        }}
      >
        {/* L1 · backdrop + waves */}
        <Layer t={t} depth={0.3}>
          <Backdrop lightX={lightX} lightY={lightY} />
        </Layer>

        {/* Glow spill → blue stage light */}
        <Layer t={t} depth={0.45}>
          <div
            style={{
              position: "absolute",
              left: spillCx,
              top: spillCy,
              width: lerp(L.logoIntro.w * 1.9, w * 1.1, spill),
              height: lerp(L.logoIntro.w * 1.9, w * 0.75, spill),
              transform: "translate(-50%, -50%)",
              borderRadius: "50%",
              background: `radial-gradient(closest-side, ${spill < 0.5 ? C.notePurple : C.royal}cc, ${
                spill < 0.5 ? C.noteBlue : C.royal
              }55 45%, transparent 100%)`,
              opacity: logoIntroGlow * 0.85 + spill * 0.55 * (1 - ramp(t, T.logoMove.end, T.floorPool + 1)) * 1,
            }}
          />
        </Layer>

        {/* L2 · back particles */}
        <Layer t={t} depth={0.4}>
          <Particles count={60} seed={1} size={[1.2, 2.6]} opacity={0.6} />
        </Layer>

        {/* L3 · beam, floor, pool */}
        <Layer t={t} depth={0.7}>
          <StageLight cx={pod.cx} floorY={pod.floorY} scale={pod.scale} />
        </Layer>

        {/* L4a · glossy floor reflection (flipped as a whole layer so blurs stay put) */}
        <Layer t={t} depth={0.7}>
          <AbsoluteFill
            style={{
              transform: "scaleY(-1)",
              transformOrigin: `50% ${pod.floorY}px`,
              opacity: 0.36,
              WebkitMaskImage: `linear-gradient(to bottom, transparent ${pod.floorY - L.reflection * pod.scale}px, black ${pod.floorY}px)`,
              maskImage: `linear-gradient(to bottom, transparent ${pod.floorY - L.reflection * pod.scale}px, black ${pod.floorY}px)`,
            }}
          >
            <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
              <g transform={`translate(${pod.cx} ${pod.floorY}) scale(${pod.scale})`}>
                <Podium px="rf" />
              </g>
            </svg>
          </AbsoluteFill>
        </Layer>

        {/* L4b · podium, glass letters, star */}
        <Layer t={t} depth={0.7}>
          <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
            <g transform={`translate(${pod.cx} ${pod.floorY}) scale(${pod.scale})`}>
              <Podium />
            </g>
            <g transform={`translate(${pod.cx} ${pod.floorY}) scale(${pod.scale})`}>
              <Star />
            </g>
          </svg>
        </Layer>

        {/* L5 · text block */}
        {textOn && (
          <Layer t={t} depth={0.9}>
            <Introducing L={L} wmLeft={wmLeft} />
            <div style={{ position: "absolute", left: wmLeft, top: L.text.wordmarkY, width: L.text.wordmarkW, height: L.text.wordmarkW * WORDMARK_ASPECT }}>
              <Wordmark width={L.text.wordmarkW} />
            </div>
            <div
              style={{
                position: "absolute",
                left: L.url.align === "left" ? L.url.x : 0,
                width: L.url.align === "left" ? undefined : w,
                textAlign: L.url.align,
                top: L.url.y,
                color: C.white,
                fontSize: L.url.size,
                fontWeight: 400,
                letterSpacing: "0.04em",
                opacity: urlO * 0.92,
                transform: `translateY(${(1 - urlO) * 10}px)`,
              }}
            >
              {COPY.url}
            </div>
            {COPY.cta && (
              <div
                style={{
                  position: "absolute",
                  left: L.url.align === "left" ? L.url.x : 0,
                  width: L.url.align === "left" ? undefined : w,
                  textAlign: L.url.align,
                  top: L.cta.y,
                  color: C.white,
                  fontSize: L.cta.size,
                  fontWeight: 600,
                  opacity: ctaO,
                  transform: `translateY(${(1 - ctaO) * 14}px)`,
                  textShadow: `0 0 18px ${C.cyan}66`,
                }}
              >
                {COPY.cta}
              </div>
            )}
          </Layer>
        )}

        {/* Vignette (under the logo so the logo is never dimmed) */}
        <AbsoluteFill style={{ background: `radial-gradient(ellipse at center, transparent 55%, ${C.navy}bb 100%)`, transform: "scale(1.2)" }} />

        {/* Light line (0–1s) */}
        {t < T.logoExpand.start + 0.4 && (
          <AbsoluteFill>
            <div
              style={{
                position: "absolute",
                left: L.logoIntro.cx - lineW / 2,
                top: L.logoIntro.cy - 1.5,
                width: lineW,
                height: 3,
                borderRadius: 2,
                background: `linear-gradient(90deg, ${C.noteBlue}, ${C.notePurple})`,
                boxShadow: `0 0 12px 2px ${C.noteBlue}cc, 0 0 40px 8px ${C.notePurple}88`,
                opacity: lineFade,
              }}
            />
          </AbsoluteFill>
        )}

        {/* NoteAI logo */}
        {logoVisible && (
          <Layer t={t} depth={0.25 * mv}>
            <div
              style={{
                position: "absolute",
                left: logoCx - logoW / 2,
                top: logoCy - (logoW * LOGO_ASPECT) / 2,
                width: logoW,
                filter: `drop-shadow(0 0 ${lerp(30, 14, mv)}px ${mv < 0.5 ? C.notePurple : C.cyan}${mv < 0.5 ? "88" : "55"})`,
              }}
            >
              <NoteAILogo width={logoW} />
            </div>
          </Layer>
        )}

        {/* L6 · foreground bokeh */}
        <Layer t={t} depth={1.4}>
          <Particles count={14} seed={7} size={[3, 7]} opacity={0.35} blur={2.5} />
        </Layer>
      </AbsoluteFill>
      )}

      {/* White-blue flash */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle at ${revealed ? "50% 50%" : `${(starX / w) * 100}% ${(starY / h) * 100}%`}, #ffffff 0%, #e4f6ff 35%, #a9dcff 100%)`,
          opacity: flash,
        }}
      />
      {/* Fade to black */}
      <AbsoluteFill style={{ backgroundColor: "#000", opacity: fade }} />
    </AbsoluteFill>
  );
};

const Introducing: React.FC<{ L: Layout; wmLeft: number }> = ({ L, wmLeft }) => {
  const frame = useCurrentFrame();
  const { width: w } = useVideoConfig();
  const letters = COPY.introducing.split("");
  const spacing = 0.62;
  return (
    <div
      style={{
        position: "absolute",
        top: L.text.introducingY,
        left: L.text.align === "left" ? wmLeft + 2 : 0,
        width: L.text.align === "left" ? undefined : w,
        textAlign: L.text.align,
        whiteSpace: "nowrap",
        fontSize: L.text.introducingSize,
        fontWeight: 500,
        color: C.cyan,
        textShadow: `0 0 14px ${C.cyan}aa, 0 0 34px ${C.cyan}44`,
        // keep the trailing letter-spacing from offsetting centred text
        marginLeft: L.text.align === "center" ? `${spacing / 2}em` : undefined,
      }}
    >
      {letters.map((ch, i) => {
        const s = springAt(frame, T.introducing + i * 0.055, { damping: 22, stiffness: 80 });
        return (
          <span
            key={i}
            style={{
              display: "inline-block",
              opacity: s,
              letterSpacing: `${spacing + (1 - s) * 0.6}em`,
              transform: `translateX(${(1 - s) * 28}px)`,
            }}
          >
            {ch}
          </span>
        );
      })}
    </div>
  );
};
