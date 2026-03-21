const TTS_URL = 'https://api.elevenlabs.io/v1/text-to-speech';
const VOICE_ID = '21m00Tcm4TlvDq8ikWAM';

let audio: HTMLAudioElement | null = null;
let enabled = true;
let speaking = false;
let onChange: ((s: boolean) => void) | null = null;

export function onSpeakingChange(cb: (s: boolean) => void) { onChange = cb; }
export function isTTSEnabled() { return enabled; }
export function isSpeaking() { return speaking; }

export function setTTSEnabled(v: boolean) {
  enabled = v;
  if (!v) stopSpeaking();
}

export async function speak(text: string) {
  const key = import.meta.env.VITE_ELEVENLABS_API_KEY;
  if (!key || !enabled) return;
  stopSpeaking();

  try {
    const res = await fetch(`${TTS_URL}/${VOICE_ID}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'xi-api-key': key },
      body: JSON.stringify({
        text,
        model_id: 'eleven_multilingual_v2',
        voice_settings: { stability: 0.5, similarity_boost: 0.75 },
      }),
    });
    if (!res.ok) return;

    const url = URL.createObjectURL(await res.blob());
    audio = new Audio(url);
    speaking = true;
    onChange?.(true);

    const done = () => { speaking = false; onChange?.(false); URL.revokeObjectURL(url); audio = null; };
    audio.addEventListener('ended', done);
    audio.addEventListener('error', done);
    await audio.play();
  } catch {
    speaking = false;
    onChange?.(false);
  }
}

export function stopSpeaking() {
  if (audio) { audio.pause(); audio = null; }
  if (speaking) { speaking = false; onChange?.(false); }
}
