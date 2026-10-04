# MillionAIre Club by NoteAI — launch video

Code-rendered launch film built with [Remotion](https://www.remotion.dev/) (React).
22 s, 30 fps, H.264 + AAC, in two formats:

| Composition  | Output                 | Size       |
| ------------ | ---------------------- | ---------- |
| `Launch16x9` | `out/launch-16x9.mp4`  | 1920×1080  |
| `Launch9x16` | `out/launch-9x16.mp4`  | 1080×1920  |

## Render

```bash
npm install
npm run render          # copies ./assets → ./public, then renders both MP4s
npm run stills -- Launch16x9,Launch9x16 2,5,8,11,14,17,21   # QC frames → stills/
npm run studio          # live preview / scrubbing
```

## Where to change things

Everything lives in **`src/config.ts`**:

- `HITS`: the three music hits (6.0 s, 10.0 s, 12.0 s by default). The podium,
  ignition and reveal scenes are offsets from these, so moving a hit moves its
  scene with it.
- `T`: every other cue (logo build, logo move, text reveals, URL/CTA, fade).
- `COPY.cta`: the single call-to-action line. **Currently empty** (the brief's
  `[MY CTA]` placeholder was not filled in), so no CTA is rendered.
- `VOICE_LINES`: script and cue times (1.5 s, 12.3 s, 14.0 s).
- `MIX`: music fade in/out, duck depth (−8 dB) and ramp.
- `LANDSCAPE` / `PORTRAIT`: layout positions.

## Assets (`./assets`)

| File | Used for |
| ---- | -------- |
| `noteai-logo.png` | NoteAI logo, used untouched (masks, scale, opacity, glow, sweeps only) |
| `membership-card.pdf` | Source of the MillionAIre Club wordmark vectors |
| `music.mp3` *(optional)* | Background track: 1 s fade-in, −8 dB under voice, 1.5 s fade-out |
| `voiceover.mp3` *(optional)* | Recorded VO; its three lines are found by silence detection and placed on their cues |
| `voice/line1..3.mp3` *(optional)* | Per-line VO, e.g. from `npm run voice` (ElevenLabs, paid API, needs `ELEVENLABS_API_KEY`) |

The wordmark is not redrawn. `scripts/extract-wordmark.py` copies the vector
paths out of the card PDF into `src/wordmark-paths.json`, grouped as
Million / A / i / sparkle / re / Club / By Noteai so each part can be animated
on its own. The glass "A", "i" and sparkle on the podium reuse those same
outlines.

## Licensing note

Remotion is free for individuals and companies with up to 3 employees. Larger
companies need a paid Remotion company license. See remotion.dev/license.
