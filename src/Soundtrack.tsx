import React from "react";
import { Html5Audio, interpolate, Sequence, staticFile } from "remotion";
import { DURATION, FPS, MIX, VOICE_LINES } from "./config";
import manifest from "./asset-manifest.json";

type Line = { file?: string; from: number; to: number };
const M = manifest as {
  music: { file: string; duration: number } | null;
  voice: { mode: "none" | "split" | "whole" | "lines"; file?: string; lines: Line[] };
};

/** Voice clips placed at their cues: [startSec, endSec] on the timeline. */
const voiceWindows = (): [number, number][] =>
  M.voice.lines.map((l, i) => {
    const at = VOICE_LINES[Math.min(i, VOICE_LINES.length - 1)].at;
    return [at, at + (l.to - l.from)];
  });

const db = (d: number) => Math.pow(10, d / 20);

export const musicVolume = (frame: number) => {
  const t = frame / FPS;
  const fadeIn = interpolate(t, [0, MIX.musicFadeIn], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const fadeOut = interpolate(t, [DURATION - MIX.musicFadeOut, DURATION], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  let duck = 1;
  for (const [a, b] of voiceWindows()) {
    const r = MIX.duckRamp;
    const k = interpolate(t, [a - r, a, b, b + r], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
    duck = Math.min(duck, 1 - k * (1 - db(MIX.duckDb)));
  }
  return MIX.musicGain * fadeIn * fadeOut * duck;
};

export const Soundtrack: React.FC = () => {
  const windows = voiceWindows();
  return (
    <>
      {M.music && <Html5Audio src={staticFile(M.music.file)} volume={musicVolume} />}
      {M.voice.lines.map((l, i) => {
        const [at] = windows[i];
        const src = staticFile(l.file ?? M.voice.file!);
        return (
          <Sequence key={i} from={Math.round(at * FPS)} durationInFrames={Math.ceil((l.to - l.from) * FPS) + 2} layout="none">
            <Html5Audio
              src={src}
              trimBefore={Math.round(l.from * FPS)}
              trimAfter={Math.round(l.to * FPS)}
              volume={MIX.voiceGain}
            />
          </Sequence>
        );
      })}
    </>
  );
};
