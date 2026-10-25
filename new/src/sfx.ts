let ctx: AudioContext | null = null;
let muted = false;

function tone(f: number, d: number, type: OscillatorType = "square", v = 0.04, delay = 0, to?: number) {
  if (muted) return;
  ctx ??= new AudioContext();
  if (ctx.state === "suspended") void ctx.resume();
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  const t = ctx.currentTime + delay;
  o.type = type;
  o.frequency.setValueAtTime(f, t);
  if (to) o.frequency.exponentialRampToValueAtTime(to, t + d);
  g.gain.setValueAtTime(v, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + d);
  o.connect(g).connect(ctx.destination);
  o.start(t);
  o.stop(t + d);
}

export const sfx = {
  blip: () => tone(480 + Math.random() * 120, 0.05),
  click: () => tone(300, 0.06, "square", 0.05),
  pickup: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.09, "square", 0.05, i * 0.07)),
  locked: () => tone(120, 0.15, "sawtooth", 0.06),
  door: () => tone(180, 0.35, "sawtooth", 0.05, 0, 60),
  growl: () => {
    tone(110, 0.6, "sawtooth", 0.08, 0, 55);
    tone(90, 0.6, "square", 0.05, 0.05, 45);
  },
  whimper: () => tone(700, 0.5, "triangle", 0.06, 0, 250),
  hit: () => tone(200, 0.2, "sawtooth", 0.09, 0, 40),
  win: () => [523, 659, 784, 659, 784, 1047].forEach((f, i) => tone(f, 0.12, "square", 0.05, i * 0.1)),
};

// Chiptune loop sederhana (tanpa file audio).
const NOTES = [262, 330, 392, 330, 294, 349, 440, 349, 262, 330, 392, 523, 392, 330, 294, 196];
let timer: number | undefined;
let k = 0;
export const music = {
  start() {
    if (timer || muted) return;
    timer = window.setInterval(() => tone(NOTES[k++ % NOTES.length], 0.22, "triangle", 0.025), 280);
  },
  stop() {
    window.clearInterval(timer);
    timer = undefined;
  },
};
export function setMuted(m: boolean) {
  muted = m;
  if (m) music.stop();
}
