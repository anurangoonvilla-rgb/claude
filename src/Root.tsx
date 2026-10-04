import "@fontsource/plus-jakarta-sans/400.css";
import "@fontsource/plus-jakarta-sans/500.css";
import "@fontsource/plus-jakarta-sans/600.css";
import React from "react";
import { Composition, continueRender, delayRender } from "remotion";
import { DURATION, FPS, LANDSCAPE, PORTRAIT } from "./config";
import { Launch } from "./Launch";

// Make sure the brand font is ready before any frame is captured.
const fontHandle = delayRender("Loading Plus Jakarta Sans");
Promise.all(
  ["400", "500", "600"].map((wt) => document.fonts.load(`${wt} 32px "Plus Jakarta Sans"`)),
).then(() => continueRender(fontHandle));

export const Root: React.FC = () => (
  <>
    <Composition
      id="Launch16x9"
      component={Launch}
      durationInFrames={DURATION * FPS}
      fps={FPS}
      width={LANDSCAPE.w}
      height={LANDSCAPE.h}
      defaultProps={{ orientation: "landscape" as const }}
    />
    <Composition
      id="Launch9x16"
      component={Launch}
      durationInFrames={DURATION * FPS}
      fps={FPS}
      width={PORTRAIT.w}
      height={PORTRAIT.h}
      defaultProps={{ orientation: "portrait" as const }}
    />
  </>
);
