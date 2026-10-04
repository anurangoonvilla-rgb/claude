// ─────────────────────────────────────────────────────────────────────────────
// MillionAIre Club launch: single source of truth for timing, copy and layout.
//
// All times are in SECONDS. To match a music track, move the three HITS: the
// podium, ignition and reveal scenes are defined as offsets from them, so
// everything that belongs to a hit moves with it.
// ─────────────────────────────────────────────────────────────────────────────

export const FPS = 30;
export const DURATION = 22; // seconds

/** Main music hits. Shift these to land on the track's beats. */
export const HITS = {
  beamHitsFloor: 6.0, // beam lands, podium scene starts
  starIgnites: 10.0, // sparkle ignites, push-in begins
  reveal: 12.0, // white-blue flash peak → poster composition
};

const h1 = HITS.beamHitsFloor;
const h2 = HITS.starIgnites;
const h3 = HITS.reveal;

export const T = {
  // 0–1s: thin line of light draws across centre
  lineDraw: { start: 0.15, end: 0.95 },

  // 1–4s: NoteAI logo intro
  logoExpand: { start: 1.0, end: 1.55 }, // line opens into the rounded square
  notchSnap: 1.5, // right-edge notch snaps in
  textWipe: { start: 1.9, end: 2.7 }, // "Note ai" wipes in left → right
  dots: { start: 2.7, stagger: 0.13 }, // three dots pop one after another
  logoSweep: { start: 3.0, end: 3.75 }, // one light sweep across the logo

  // 4–6s: logo glides to its poster position; glow becomes the stage light
  logoMove: { start: 4.0, end: 5.9 },
  stageFadeIn: { start: 4.2, end: 6.0 },
  beamOn: 5.15, // spotlight switches on from above

  // 6–10s: podium scene (offsets from HITS.beamHitsFloor)
  floorPool: h1, // beam hits the floor
  ring1: h1 + 0.2,
  ring2: h1 + 0.9,
  glassA: h1 + 1.6,
  glassI: h1 + 2.55,

  // 10–12s: ignition + push-in (offsets from HITS.starIgnites)
  starIgnite: h2,
  pushIn: { start: h2 + 0.25, end: h3 },
  flashBuild: { start: h2 + 0.9, end: h3 },

  // 12–18s: poster composition (offsets from HITS.reveal)
  flashOut: { start: h3, end: h3 + 0.9 },
  introducing: h3 + 0.3, // letters track in one by one
  wordmark: { start: h3 + 1.3, end: h3 + 2.5 }, // L→R reveal behind light sweep
  aiGlow: h3 + 2.45, // the "AI" letters glow last
  byNoteai: h3 + 3.3, // "By Noteai" settles in beneath

  // 18–22s: URL, CTA, hold, fade
  url: 18.0,
  cta: 18.8,
  fadeToBlack: 0.7, // seconds at the very end
};

// ── Copy ────────────────────────────────────────────────────────────────────
export const COPY = {
  introducing: "INTRODUCING",
  url: "www.noteai.in",
  /**
   * The one call-to-action line under the URL. Left empty: the brief's
   * "[MY CTA]" placeholder was not filled in. Put the final line here and
   * re-render; an empty string renders no CTA line.
   */
  cta: "",
};

// ── Voice-over ──────────────────────────────────────────────────────────────
// Line text is spelled for the voice engine ("Millionaire"); on screen the
// wordmark stays "MillionAIre".
export const VOICE_LINES = [
  { id: "line1", text: "From NoteAI.", at: 1.5 },
  { id: "line2", text: "Introducing.", at: 12.3 },
  { id: "line3", text: "Millionaire Club.", at: 14.0 },
];

// ── Music mix ───────────────────────────────────────────────────────────────
export const MIX = {
  musicFadeIn: 1.0,
  musicFadeOut: 1.5,
  duckDb: -8, // music level while voice is speaking
  duckRamp: 0.25, // seconds to duck / recover
  musicGain: 0.9,
  voiceGain: 1.0,
};

// ── Palette ─────────────────────────────────────────────────────────────────
export const C = {
  navy: "#04081F",
  royal: "#1535C9",
  cyan: "#6FD0FF",
  white: "#FFFFFF",
  noteBlue: "#2F6BFF", // opening logo scene only
  notePurple: "#8A22F0", // opening logo scene only
};

// ── Layouts ─────────────────────────────────────────────────────────────────
export type Layout = {
  w: number;
  h: number;
  /** Logo during the intro (centre) */
  logoIntro: { cx: number; cy: number; w: number };
  /** Logo in the poster composition */
  logoFinal: { cx: number; cy: number; w: number };
  /** Podium before the reveal flash (hero, centred) */
  podiumHero: { cx: number; floorY: number; scale: number };
  /** Podium in the poster composition */
  podiumFinal: { cx: number; floorY: number; scale: number };
  text: {
    align: "left" | "center";
    x: number; // left edge (left) or centre (center)
    introducingY: number;
    introducingSize: number;
    wordmarkY: number;
    wordmarkW: number;
  };
  url: { x: number; y: number; size: number; align: "left" | "center" };
  cta: { y: number; size: number };
  /** How far (px, before podium scale) the floor reflection extends */
  reflection: number;
};

export const LANDSCAPE: Layout = {
  w: 1920,
  h: 1080,
  logoIntro: { cx: 960, cy: 540, w: 420 },
  logoFinal: { cx: 1752, cy: 132, w: 150 },
  podiumHero: { cx: 960, floorY: 850, scale: 1.05 },
  podiumFinal: { cx: 1390, floorY: 838, scale: 0.98 },
  text: {
    align: "left",
    x: 150,
    introducingY: 336,
    introducingSize: 30,
    wordmarkY: 404,
    wordmarkW: 820,
  },
  url: { x: 150, y: 948, size: 26, align: "left" },
  cta: { y: 992, size: 30 },
  reflection: 300,
};

export const PORTRAIT: Layout = {
  w: 1080,
  h: 1920,
  logoIntro: { cx: 540, cy: 960, w: 480 },
  logoFinal: { cx: 540, cy: 190, w: 170 },
  podiumHero: { cx: 540, floorY: 1180, scale: 1.0 },
  podiumFinal: { cx: 540, floorY: 1000, scale: 0.98 },
  text: {
    align: "center",
    x: 540,
    introducingY: 1176,
    introducingSize: 32,
    wordmarkY: 1232,
    wordmarkW: 900,
  },
  url: { x: 540, y: 1640, size: 30, align: "center" },
  cta: { y: 1690, size: 34 },
  reflection: 150,
};
