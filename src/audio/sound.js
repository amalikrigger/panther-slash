// Sound effects, made with code using the Web Audio API.
//
// There are no sound files: each effect is built from simple pieces, like
// noise (a "shhh" sound) and tones (a beep), shaped by volume envelopes and
// filters. That means no licensing questions, and nothing extra to download.
//
// Phones and tablets block sound until the player taps the screen, so
// `unlock()` must be called from a tap or click (main.js does this).

let audio = null;  // the AudioContext, created on the first tap
let master = null; // one volume knob for everything
let noiseBuffer = null;
let muted = false;

export function unlock() {
  if (!audio) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    audio = new AudioContextClass();
    master = audio.createGain();
    master.gain.value = muted ? 0 : 0.6;
    master.connect(audio.destination);
    noiseBuffer = makeNoise(audio);
  }
  if (audio.state === 'suspended') audio.resume();
}

export function setMuted(value) {
  muted = value;
  if (master) master.gain.value = muted ? 0 : 0.6;
}

export const isMuted = () => muted;

function makeNoise(ctx) {
  const buffer = ctx.createBuffer(1, ctx.sampleRate * 1, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  return buffer;
}

/** Is sound ready to play right now? */
function ready() {
  return audio && audio.state === 'running' && !muted;
}

/** A burst of filtered noise. Sweeping the filter makes a "whoosh". */
function noise({ duration, volume, filter = 'bandpass', from, to, q = 1 }) {
  const t = audio.currentTime;
  const source = audio.createBufferSource();
  source.buffer = noiseBuffer;
  const bandpass = audio.createBiquadFilter();
  bandpass.type = filter;
  bandpass.Q.value = q;
  bandpass.frequency.setValueAtTime(from, t);
  bandpass.frequency.exponentialRampToValueAtTime(to, t + duration);
  const gain = audio.createGain();
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(volume, t + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
  source.connect(bandpass).connect(gain).connect(master);
  source.start(t, Math.random() * 0.5);
  source.stop(t + duration + 0.05);
}

/** A tone that slides from one pitch to another. */
function tone({ duration, volume, type = 'sine', from, to = from, delay = 0 }) {
  const t = audio.currentTime + delay;
  const osc = audio.createOscillator();
  osc.type = type;
  osc.frequency.setValueAtTime(from, t);
  osc.frequency.exponentialRampToValueAtTime(to, t + duration);
  const gain = audio.createGain();
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(volume, t + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
  osc.connect(gain).connect(master);
  osc.start(t);
  osc.stop(t + duration + 0.05);
}

export const sounds = {
  throw() {
    if (!ready()) return;
    noise({ duration: 0.35, volume: 0.12, from: 300, to: 1200, q: 0.8 });
  },
  slice() {
    if (!ready()) return;
    noise({ duration: 0.16, volume: 0.5, filter: 'highpass', from: 5000, to: 1500 });
    tone({ duration: 0.12, volume: 0.25, type: 'triangle', from: 220, to: 70 }); // squish
  },
  critical() {
    if (!ready()) return;
    tone({ duration: 0.25, volume: 0.2, type: 'square', from: 880, to: 1760 });
  },
  panther() {
    if (!ready()) return;
    // A low growl: a buzzy tone wobbling down in pitch.
    tone({ duration: 0.6, volume: 0.35, type: 'sawtooth', from: 140, to: 60 });
    noise({ duration: 0.5, volume: 0.25, filter: 'lowpass', from: 800, to: 200 });
    [784, 988, 1175, 1568].forEach((f, i) => tone({ duration: 0.2, volume: 0.15, type: 'triangle', from: f, delay: 0.1 + i * 0.07 }));
  },
  combo(count) {
    if (!ready()) return;
    // A rising arpeggio, one note per hit (up to 6).
    const notes = [523, 659, 784, 988, 1175, 1319];
    for (let i = 0; i < Math.min(count, notes.length); i++) {
      tone({ duration: 0.18, volume: 0.18, type: 'triangle', from: notes[i], delay: i * 0.06 });
    }
  },
  bomb() {
    if (!ready()) return;
    noise({ duration: 1.0, volume: 0.9, filter: 'lowpass', from: 2000, to: 60 });
    tone({ duration: 0.8, volume: 0.6, type: 'sine', from: 120, to: 30 });
  },
  miss() {
    if (!ready()) return;
    tone({ duration: 0.3, volume: 0.2, type: 'square', from: 180, to: 90 });
  },
  tick() {
    if (!ready()) return;
    tone({ duration: 0.06, volume: 0.15, type: 'square', from: 1200 });
  },
  start() {
    if (!ready()) return;
    [392, 523, 659].forEach((f, i) => tone({ duration: 0.2, volume: 0.2, type: 'triangle', from: f, delay: i * 0.09 }));
  },
  end() {
    if (!ready()) return;
    [659, 523, 392, 262].forEach((f, i) => tone({ duration: 0.35, volume: 0.2, type: 'triangle', from: f, delay: i * 0.13 }));
  },
  fanfare() {
    if (!ready()) return;
    [523, 659, 784, 1047, 784, 1047].forEach((f, i) => tone({ duration: 0.28, volume: 0.22, type: 'square', from: f, delay: i * 0.12 }));
  },
  click() {
    if (!ready()) return;
    tone({ duration: 0.05, volume: 0.15, type: 'triangle', from: 660 });
  },
};
