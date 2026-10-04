// Generates the three voice-over lines with ElevenLabs into assets/voice/.
// Only runs when ELEVENLABS_API_KEY is set and assets/voiceover.mp3 is absent.
// NOTE: this calls a paid API. Usage: node scripts/generate-voice.mjs [voiceId]
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const key = process.env.ELEVENLABS_API_KEY;
if (fs.existsSync(path.join(root, "assets/voiceover.mp3"))) {
  console.log("assets/voiceover.mp3 exists; using the recorded voice-over.");
  process.exit(0);
}
if (!key) {
  console.log("ELEVENLABS_API_KEY not set; skipping voice generation.");
  process.exit(0);
}
// Spelled for pronunciation; on screen the wordmark stays "MillionAIre".
const LINES = [
  ["line1", "From NoteAI."],
  ["line2", "Introducing."],
  ["line3", "Millionaire Club."],
];
const voiceId = process.argv[2] || process.env.ELEVENLABS_VOICE_ID || "onwK4e9ZLuTAKqWW03F9"; // deep, calm male narrator
fs.mkdirSync(path.join(root, "assets/voice"), { recursive: true });
for (const [id, text] of LINES) {
  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`, {
    method: "POST",
    headers: { "xi-api-key": key, "Content-Type": "application/json" },
    body: JSON.stringify({
      text,
      model_id: "eleven_multilingual_v2",
      // calm, deep, slow, understated: high stability, low style
      voice_settings: { stability: 0.75, similarity_boost: 0.8, style: 0.05, use_speaker_boost: true, speed: 0.85 },
    }),
  });
  if (!res.ok) throw new Error(`${id}: ${res.status} ${await res.text()}`);
  fs.writeFileSync(path.join(root, `assets/voice/${id}.mp3`), Buffer.from(await res.arrayBuffer()));
  console.log("wrote", `assets/voice/${id}.mp3`);
}
