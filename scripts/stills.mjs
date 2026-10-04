// QC: render still frames at given seconds for both formats into stills/.
// Usage: node scripts/stills.mjs [comp] [sec,sec,...]
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";
import path from "node:path";
import fs from "node:fs";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const comps = process.argv[2] ? process.argv[2].split(",") : ["Launch16x9", "Launch9x16"];
const secs = (process.argv[3] || "2,5,8,11,14,17,21").split(",").map(Number);
const browserExecutable = "/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell";

const serveUrl = await bundle({ entryPoint: path.join(root, "src/index.ts"), publicDir: path.join(root, "public") });
fs.mkdirSync(path.join(root, "stills"), { recursive: true });
for (const id of comps) {
  const composition = await selectComposition({ serveUrl, id, browserExecutable, chromiumOptions: { gl: "swangle" } });
  for (const s of secs) {
    const output = path.join(root, `stills/${id}-${String(s).replace(".", "_")}s.png`);
    await renderStill({ composition, serveUrl, output, frame: Math.min(composition.durationInFrames - 1, Math.round(s * 30)), browserExecutable, chromiumOptions: { gl: "swangle" } });
    console.log(output);
  }
}
