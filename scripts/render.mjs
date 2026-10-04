// Robust renderer: renders each composition in short chunks (fresh browser per
// chunk, with a watchdog + retry, because headless Chrome's software GPU can
// occasionally hang), renders the soundtrack in a separate audio-only pass,
// then joins everything with ffmpeg into out/<name>.mp4 (H.264 + AAC).
//
// Usage: node scripts/render.mjs [Launch16x9,Launch9x16]
import { bundle } from "@remotion/bundler";
import { makeCancelSignal, renderMedia, selectComposition } from "@remotion/renderer";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const browserExecutable = "/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell";
const chromiumOptions = { gl: "swangle" };
const CHUNK = 30; // frames
const CHUNK_TIMEOUT = 15 * 60 * 1000;
const RETRIES = 4;
const OUT = { Launch16x9: "out/launch-16x9.mp4", Launch9x16: "out/launch-9x16.mp4" };
const ids = (process.argv[2] || "Launch16x9,Launch9x16").split(",");

const serveUrl = await bundle({ entryPoint: path.join(root, "src/index.ts"), publicDir: path.join(root, "public") });

const withWatchdog = async (label, fn) => {
  for (let attempt = 1; attempt <= RETRIES; attempt++) {
    const { cancelSignal, cancel } = makeCancelSignal();
    const timer = setTimeout(cancel, CHUNK_TIMEOUT);
    try {
      await fn(cancelSignal);
      clearTimeout(timer);
      return;
    } catch (e) {
      clearTimeout(timer);
      console.warn(`${label}: attempt ${attempt} failed (${String(e.message || e).split("\n")[0]})`);
    }
  }
  throw new Error(`${label}: failed after ${RETRIES} attempts`);
};

for (const id of ids) {
  const composition = await selectComposition({ serveUrl, id, browserExecutable, chromiumOptions });
  const tmp = path.join(root, "out", `.chunks-${id}`);
  fs.mkdirSync(tmp, { recursive: true });
  const total = composition.durationInFrames;
  const parts = [];
  for (let start = 0; start < total; start += CHUNK) {
    const end = Math.min(total - 1, start + CHUNK - 1);
    const file = path.join(tmp, `v_${String(start).padStart(4, "0")}.mp4`);
    parts.push(file);
    if (fs.existsSync(file)) continue; // resume support
    await withWatchdog(`${id} ${start}-${end}`, (cancelSignal) =>
      renderMedia({
        composition, serveUrl, browserExecutable, chromiumOptions, cancelSignal,
        codec: "h264", crf: 16, pixelFormat: "yuv420p", imageFormat: "jpeg", jpegQuality: 95,
        concurrency: 3, muted: true, frameRange: [start, end],
        outputLocation: file.replace(/\.mp4$/, ".part.mp4"),
      }).then(() => fs.renameSync(file.replace(/\.mp4$/, ".part.mp4"), file)),
    );
    console.log(`${id}: frames ${start}-${end} done`);
  }
  const audio = path.join(tmp, "audio.aac");
  await withWatchdog(`${id} audio`, (cancelSignal) =>
    renderMedia({ composition, serveUrl, browserExecutable, chromiumOptions, cancelSignal, codec: "aac", enforceAudioTrack: true, outputLocation: audio }),
  );
  const list = path.join(tmp, "list.txt");
  fs.writeFileSync(list, parts.map((p) => `file '${p}'`).join("\n"));
  const out = path.join(root, OUT[id]);
  execFileSync("ffmpeg", [
    "-y", "-v", "error", "-f", "concat", "-safe", "0", "-i", list, "-i", audio,
    "-map", "0:v", "-map", "1:a", "-c:v", "copy", "-c:a", "aac", "-b:a", "192k",
    "-t", String(total / composition.fps), "-movflags", "+faststart", out,
  ]);
  fs.rmSync(tmp, { recursive: true, force: true });
  console.log(`wrote ${OUT[id]}`);
}
