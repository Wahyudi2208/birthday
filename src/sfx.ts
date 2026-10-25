let ctx: AudioContext | null = null;
let muted = false;

function tone(f: number, d: number, type: OscillatorType = "square", v = 0.04, delay = 0, to?: number, dest?: AudioNode) {
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
  o.connect(g).connect(dest ?? ctx.destination);
  o.start(t);
  o.stop(t + d);
}

export const sfx = {
  blip: () => tone(480 + Math.random() * 120, 0.05),
  click: () => tone(300, 0.06, "square", 0.05),
  step: () => tone(95 + Math.random() * 15, 0.07, "square", 0.04),
  pickup: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.09, "square", 0.05, i * 0.07)),
  locked: () => tone(120, 0.15, "sawtooth", 0.06),
  door: () => tone(180, 0.35, "sawtooth", 0.05, 0, 60),
  growl: () => {
    tone(110, 0.6, "sawtooth", 0.08, 0, 55);
    tone(90, 0.6, "square", 0.05, 0.05, 45);
  },
  whimper: () => tone(700, 0.5, "triangle", 0.06, 0, 250),
  hit: () => tone(200, 0.2, "sawtooth", 0.09, 0, 40),
  page: () => {
    tone(220, 0.3, "sawtooth", 0.02, 0, 70);
    tone(1200, 0.08, "square", 0.015, 0.05, 300);
  },
  win: () => [523, 659, 784, 659, 784, 1047].forEach((f, i) => tone(f, 0.12, "square", 0.05, i * 0.1)),
  // Cahaya senter mengenai beruang / lampu berkedip
  zap: () => tone(1400 + Math.random() * 400, 0.09, "sawtooth", 0.025, 0, 300),
  // Gelembung kecil saat kartu kenangan muncul
  pop: () => tone(520, 0.1, "sine", 0.05, 0, 900),
  // Perban dililit
  wrap: () => {
    tone(260, 0.08, "sawtooth", 0.02, 0, 520);
    tone(900, 0.04, "square", 0.012, 0.05);
  },
  // Kursor menyentuh app/pintu
  hover: () => tone(880, 0.04, "square", 0.015),
  // App dibuka: arpeggio naik
  launch: () => [392, 523, 659, 784, 1047].forEach((f, i) => tone(f, 0.1, "square", 0.04, i * 0.07)),
  // Terkunci: rantai bergemerincing
  rattle: () => {
    tone(150, 0.07, "sawtooth", 0.04, 0, 90);
    tone(190, 0.07, "sawtooth", 0.035, 0.09, 110);
    tone(140, 0.08, "sawtooth", 0.03, 0.2, 80);
  },
  // Zoom masuk ke pintu
  swoosh: () => tone(180, 0.7, "sawtooth", 0.035, 0, 1100),
  // Notifikasi lembut (Discord): dipakai saat terhubung dan saat kata kunci memicu kenangan
  ping: () => [880, 1319].forEach((f, i) => tone(f, 0.14, "sine", 0.045, i * 0.09)),
  // Nyawa bertambah, k = 0,1,2,... nadanya makin tinggi
  heal: (k = 0) => tone(440 + k * 110, 0.14, "triangle", 0.05),
};

// Suara ambient bawah laut: gelembung acak yang pelan. Mulai/berhenti dengan ambient.start()/stop().
let ambTimer: number | undefined;
export const ambient = {
  start() {
    if (ambTimer !== undefined) return;
    const next = () => {
      ambTimer = window.setTimeout(() => {
        const f = 220 + Math.random() * 260;
        tone(f, 0.16, "sine", 0.018, 0, f * 2.2);
        if (Math.random() < 0.35) tone(f * 1.3, 0.12, "sine", 0.012, 0.12, f * 2.8);
        next();
      }, 1400 + Math.random() * 2600);
    };
    next();
  },
  stop() {
    window.clearTimeout(ambTimer);
    ambTimer = undefined;
  },
};

// Hujan lembut (noise yang disaring) untuk layar PIN dan surat. rain.start() / rain.stop().
let rainNode: { src: AudioBufferSourceNode; g: GainNode } | null = null;
export const rain = {
  start() {
    if (rainNode || muted) return;
    ctx ??= new AudioContext();
    if (ctx.state === "suspended") void ctx.resume();
    const len = ctx.sampleRate * 2;
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    let b = 0;
    for (let i = 0; i < len; i++) {
      b = 0.97 * b + 0.03 * (Math.random() * 2 - 1); // noise lembut (lebih dalam dari noise putih)
      d[i] = b * 7;
    }
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.loop = true;
    const hp = ctx.createBiquadFilter();
    hp.type = "highpass";
    hp.frequency.value = 350;
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 3200;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, ctx.currentTime);
    g.gain.linearRampToValueAtTime(0.05, ctx.currentTime + 2.5);
    src.connect(hp).connect(lp).connect(g).connect(ctx.destination);
    src.start();
    rainNode = { src, g };
  },
  stop(fade = 0.8) {
    if (!rainNode || !ctx) return;
    const { src, g } = rainNode;
    rainNode = null;
    const t = ctx.currentTime;
    g.gain.cancelScheduledValues(t);
    g.gain.setValueAtTime(g.gain.value, t);
    g.gain.linearRampToValueAtTime(0, t + fade);
    src.stop(t + fade + 0.05);
  },
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
export const isMuted = () => muted;
export function setMuted(m: boolean) {
  muted = m;
  if (m) {
    music.stop();
    rain.stop(0.1);
  }
  if (curAudio) curAudio.muted = m;
}

/* ---------- Musik per momen (dengan crossfade) ----------
 * track.play("audio/lagu.mp3", 0) -> putar mp3 (fade in), lagu sebelumnya fade out.
 * Kalau file mp3 tidak ada / src kosong -> otomatis pakai melodi chiptune bawaan
 * (variant 0-4 = melodi berbeda), jadi tetap ada suara sebelum kamu isi musiknya. */
type Handle = { stop: () => void };
const TUNES: number[][] = [
  [262, 330, 392, 330, 294, 349, 440, 349],
  [220, 262, 330, 262, 247, 294, 370, 294],
  [330, 392, 494, 392, 349, 440, 523, 440],
  [294, 349, 440, 349, 262, 330, 392, 330],
  [392, 494, 587, 494, 440, 523, 659, 523],
  [196, 208, 196, 175, 185, 175, 156, 147], // 5 = tegang (ruangan The Mimic)
  [220, 262, 330, 262, 247, 294, 262, 196], // 6 = tenang-misterius (ruangan Survive Bikini Bottom)
  // 7 = Happy Birthday (finale). 0 = tahan nada / jeda. 32 langkah x 260 ms = 8,3 detik per putaran
  [392, 392, 440, 392, 523, 494, 0, 0, 392, 392, 440, 392, 587, 523, 0, 0, 392, 392, 784, 659, 523, 494, 440, 0, 698, 698, 659, 523, 587, 523, 0, 0],
  // 8 = kotak musik pengantar (layar awal, PIN, surat). Arpeggio C - Am - F - G, pelan dan lembut
  [392, 523, 659, 784, 659, 523, 659, 523, 440, 523, 659, 880, 659, 523, 440, 523, 349, 440, 523, 698, 523, 440, 523, 440, 392, 494, 587, 784, 587, 494, 392, 0],
];
// Tempo per variant (milidetik antar nada). Yang tidak tercantum = 300.
const TEMPO: Record<number, number> = { 6: 560, 7: 260, 8: 440 };
const FADE_MS = 1200;
let cur: Handle | null = null;
let curAudio: HTMLAudioElement | null = null;

function synthTrack(variant: number): Handle {
  ctx ??= new AudioContext();
  const c = ctx;
  if (c.state === "suspended") void c.resume();
  const g = c.createGain();
  g.gain.setValueAtTime(0, c.currentTime);
  g.gain.linearRampToValueAtTime(1, c.currentTime + FADE_MS / 1000);
  g.connect(c.destination);
  const notes = TUNES[variant % TUNES.length];
  let k = 0;
  const tempo = TEMPO[variant % TUNES.length] ?? 300;
  const soft = tempo > 300; // tempo lambat = nada sine yang lebih panjang dan lembut
  const t = window.setInterval(() => {
    const f = notes[k++ % notes.length];
    if (f) tone(f, soft ? 0.55 : 0.24, soft ? "sine" : "triangle", soft ? 0.04 : 0.03, 0, undefined, g); // 0 = jeda
  }, tempo);
  return {
    stop() {
      g.gain.cancelScheduledValues(c.currentTime);
      g.gain.setValueAtTime(g.gain.value, c.currentTime);
      g.gain.linearRampToValueAtTime(0, c.currentTime + FADE_MS / 1000);
      window.setTimeout(() => {
        window.clearInterval(t);
        g.disconnect();
      }, FADE_MS + 100);
    },
  };
}

function fade(a: HTMLAudioElement, to: number, done?: () => void) {
  const id = window.setInterval(() => {
    const step = 0.8 / (FADE_MS / 50);
    a.volume = to > a.volume ? Math.min(to, a.volume + step) : Math.max(to, a.volume - step);
    if (a.volume === to) {
      window.clearInterval(id);
      done?.();
    }
  }, 50);
}

// Opsi tambahan (dipakai adegan Discord). Pemanggil lama tidak memakainya, jadi perilakunya tetap (loop + fade).
//   from  : mulai dari detik ke-berapa (potong klip)
//   loop  : false = putar sekali saja
//   onEnd : dipanggil saat file selesai diputar (hanya kalau loop false)
export type PlayOpts = { from?: number; loop?: boolean; onEnd?: () => void };
let curAudioOk = false; // true = file mp3 benar-benar sedang diputar (bukan melodi cadangan)

function audioTrack(src: string, variant: number, opts: PlayOpts = {}): Handle {
  const a = new Audio(import.meta.env.BASE_URL + src);
  a.loop = opts.loop ?? true;
  a.volume = 0;
  a.muted = muted;
  curAudio = a;
  curAudioOk = false;
  let live = true;
  let fallback: Handle | null = null;
  const useFallback = () => {
    if (curAudio === a) curAudioOk = false;
    if (live && !fallback) fallback = synthTrack(variant);
  };
  const from = opts.from;
  if (from) a.addEventListener("loadedmetadata", () => { a.currentTime = from; }, { once: true });
  a.addEventListener("playing", () => { if (curAudio === a) curAudioOk = true; });
  a.addEventListener("ended", () => { if (live) opts.onEnd?.(); });
  a.addEventListener("error", useFallback);
  a.play().then(() => fade(a, 0.8)).catch(useFallback);
  return {
    stop() {
      live = false;
      fallback?.stop();
      fade(a, 0, () => a.pause());
    },
  };
}

export const track = {
  play(src: string | undefined, variant = 0, opts?: PlayOpts) {
    cur?.stop();
    curAudioOk = false;
    cur = src ? audioTrack(src, variant, opts) : synthTrack(variant);
  },
  // Detik putar file mp3 saat ini, atau null kalau tidak ada file yang benar-benar berbunyi
  // (src kosong, file hilang, atau memakai melodi cadangan). Pemanggil lalu memakai jam sendiri.
  time(): number | null {
    return curAudio && curAudioOk ? curAudio.currentTime : null;
  },
  stop() {
    cur?.stop();
    cur = null;
    curAudio = null;
    curAudioOk = false;
  },
};
