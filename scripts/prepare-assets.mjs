// Copies ./assets into ./public and writes src/asset-manifest.json describing
// which optional media exist (music, voice-over) so the composition can adapt.
// If assets/voiceover.mp3 exists, its three spoken lines are located with
// ffmpeg silencedetect so each can be placed at its cue in src/config.ts.
import { execFileSync, spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const A = path.join(root, "assets");
const P = path.join(root, "public");
fs.mkdirSync(P, { recursive: true });

const has = (f) => fs.existsSync(path.join(A, f));
const copy = (f, to = f) => {
  fs.mkdirSync(path.dirname(path.join(P, to)), { recursive: true });
  fs.copyFileSync(path.join(A, f), path.join(P, to));
};

for (const f of fs.readdirSync(A)) {
  if (/\.(png|jpe?g|webp|mp3|wav|m4a)$/i.test(f)) copy(f);
}

const duration = (file) =>
  parseFloat(
    execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", file]).toString(),
  );

const manifest = { music: null, voice: { mode: "none", lines: [] }, poster: has("poster.png"), clubLogo: has("club-logo.png") };

if (has("music.mp3")) manifest.music = { file: "music.mp3", duration: duration(path.join(A, "music.mp3")) };

if (has("voiceover.mp3")) {
  const file = path.join(A, "voiceover.mp3");
  const total = duration(file);
  const out = spawnSync("ffmpeg", ["-hide_banner", "-i", file, "-af", "silencedetect=noise=-38dB:d=0.35", "-f", "null", "-"], {
    encoding: "utf8",
  }).stderr;
  const starts = [...out.matchAll(/silence_start: ([\d.]+)/g)].map((m) => +m[1]);
  const ends = [...out.matchAll(/silence_end: ([\d.]+)/g)].map((m) => +m[1]);
  // Speech segments = gaps between silences
  const segs = [];
  let cursor = 0;
  const silences = starts.map((s, i) => [s, ends[i] ?? total]);
  for (const [s, e] of silences) {
    if (s - cursor > 0.15) segs.push([cursor, s]);
    cursor = e;
  }
  if (total - cursor > 0.15) segs.push([cursor, total]);
  if (segs.length === 3) {
    manifest.voice = { mode: "split", file: "voiceover.mp3", lines: segs.map(([a, b]) => ({ from: Math.max(0, a - 0.05), to: b + 0.1 })) };
  } else {
    console.warn(`voiceover.mp3: found ${segs.length} speech segments (expected 3); placing the whole file at the first cue.`);
    manifest.voice = { mode: "whole", file: "voiceover.mp3", lines: [{ from: 0, to: total }] };
  }
} else {
  const lines = ["line1", "line2", "line3"].map((id) => `voice/${id}.mp3`);
  if (lines.every(has)) {
    lines.forEach((f) => copy(f));
    manifest.voice = { mode: "lines", lines: lines.map((f) => ({ file: f, from: 0, to: duration(path.join(A, f)) })) };
  }
}

fs.writeFileSync(path.join(root, "src/asset-manifest.json"), JSON.stringify(manifest, null, 2) + "\n");
console.log("asset manifest:", JSON.stringify(manifest));
