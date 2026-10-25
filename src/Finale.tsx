import { useEffect, useRef, useState } from "react";
import "./finale.css";
import { spawnBits } from "./fx";
import {
  CANDLES, CHEER_SAYS, DEV_SKIP_BUTTON, ENDING_BUTTON, ENDING_LINES, ENDING_TITLE, FACE_CROP, FACE_PIXELS,
  FACE_SCALE, FACE_SPOT, IDOL_PHOTO, PARTY_INTRO, SONG_BIRTHDAY, SONG_STAGE, SPRITE_ASPECT, STAGE_SAYS, WISH_SAYS, type SongCfg,
} from "./finale-data";
import Gacha from "./Gacha";
import VoiceNote from "./VoiceNote";
import Warung from "./Warung";
import { TalkBox } from "./Memories";
import type { Say } from "./memories-data";
import { music, sfx, track } from "./sfx";

/* ------------------------------------------------------------------ *
 *  Finale.tsx = ruangan perayaan: tiup lilin -> lagu -> panggung.
 *  Semua teks, lagu, lirik, dan posisi lilin ada di finale-data.ts.
 * ------------------------------------------------------------------ */
const asset = (p: string) => `${import.meta.env.BASE_URL}${p}`;

type Phase = "intro" | "light" | "wish" | "blow" | "cheer" | "song" | "curtain" | "warung" | "stage" | "sing" | "bow" | "gacha" | "voice" | "end";
type CState = "off" | "lit" | "out";
type Dlg = { lines: Say[]; i: number; done?: () => void };

// Letak kue di layar (persen). Lilin dan percikan dihitung dari sini.
const CAKE_L = 40.5;
const CAKE_T = 35.5;
const CAKE_W = 19;
const CAKE_H = CAKE_W * (834 / 860) * (16 / 9);
const PRELOAD = [
  "bg/party.png", "bg/stage.png", "items/cake.png", "sprites/ruby-idle.png", "sprites/ruby-wish.png", "sprites/ruby-blow.png",
  "sprites/ruby-cheer.png", "sprites/ruby-back-a.png", "sprites/ruby-back-b.png", "sprites/stage-architect-a.png",
  "sprites/stage-architect-b.png", "sprites/stage-architect-c.png", "bg/warung.png", "bg/gift.png",
];

// Wajah idola: foto dipotong, diperkecil jadi kotak-kotak, warnanya dikurangi supaya serasi dengan pixel art.
function PixelFace() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current;
    const g = c?.getContext("2d");
    if (!c || !g) return;
    const img = new Image();
    img.onload = () => {
      const sx = img.naturalWidth * FACE_CROP.x;
      const sy = img.naturalHeight * FACE_CROP.y;
      const sw = img.naturalWidth * FACE_CROP.w;
      const sh = img.naturalHeight * FACE_CROP.h;
      // dua langkah supaya hasil perkecilannya halus, baru dikotak-kotakkan
      const mid = document.createElement("canvas");
      mid.width = FACE_PIXELS.w * 3;
      mid.height = FACE_PIXELS.h * 3;
      const mg = mid.getContext("2d");
      if (!mg) return;
      mg.imageSmoothingQuality = "high";
      mg.drawImage(img, sx, sy, sw, sh, 0, 0, mid.width, mid.height);
      g.imageSmoothingQuality = "high";
      g.drawImage(mid, 0, 0, c.width, c.height);
      const data = g.getImageData(0, 0, c.width, c.height);
      const p = data.data;
      const L = 7;
      for (let i = 0; i < p.length; i += 4) for (let k = 0; k < 3; k++) p[i + k] = Math.round((Math.round((p[i + k] / 255) * (L - 1)) / (L - 1)) * 255);
      g.putImageData(data, 0, 0);
    };
    img.onerror = () => {
      g.fillStyle = "#e2ac84"; // foto belum ada: kulit polos
      g.fillRect(0, 0, c.width, c.height);
    };
    img.src = asset(IDOL_PHOTO);
  }, []);
  return <canvas ref={ref} className="f-faceimg" width={FACE_PIXELS.w} height={FACE_PIXELS.h} />;
}

// Api lilin: pixel art kecil (o = oranye, y = kuning)
const FLAME = ["..o..", ".oyo.", ".oyo.", "oyyyo", "oyyyo", ".ooo."];
function Flame() {
  return (
    <svg className="f-flame" viewBox="0 0 5 6" shapeRendering="crispEdges" aria-hidden>
      {FLAME.flatMap((row, y) =>
        [...row].map((ch, x) => (ch === "." ? null : <rect key={`${x}-${y}`} x={x} y={y} width="1.02" height="1.02" fill={ch === "o" ? "#ff9a5a" : "#ffe27a"} />)),
      )}
    </svg>
  );
}

export default function Finale({ onBack, stars, start }: { onBack: () => void; stars?: number; start?: string }) {
  const [phase, setPhaseS] = useState<Phase>("intro");
  const [cs, setCsS] = useState<CState[]>(() => CANDLES.map(() => "off"));
  const [dlg, setDlg] = useState<Dlg | null>(null);
  const [blowing, setBlowing] = useState(false);
  const [onStage, setOnStage] = useState(false);
  const [cover, setCover] = useState(false);
  const [song, setSong] = useState<{ cfg: SongCfg; t: number } | null>(null);
  const [fr, setFr] = useState(0);
  const [micOn, setMicOn] = useState(false);
  const [micErr, setMicErr] = useState(false);
  const [bonus, setBonus] = useState(0); // +1 tiket gacha kalau ketoprak habis

  const phaseRef = useRef<Phase>("intro");
  const csRef = useRef<CState[]>(CANDLES.map(() => "off"));
  const timers = useRef<number[]>([]);
  const songTimer = useRef<number | undefined>(undefined);
  const songStop = useRef<(() => void) | undefined>(undefined);
  const fxRef = useRef<HTMLDivElement>(null);
  const micRef = useRef<{ stream: MediaStream; ac: AudioContext; raf: number } | null>(null);

  const setPhase = (p: Phase) => {
    phaseRef.current = p;
    setPhaseS(p);
  };
  const setCs = (n: CState[]) => {
    csRef.current = n;
    setCsS(n);
  };
  const later = (fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms));
  };
  const say = (lines: Say[], done?: () => void) => setDlg({ lines, i: 0, done });
  const advance = () => {
    if (!dlg) return;
    if (dlg.i < dlg.lines.length - 1) return setDlg({ ...dlg, i: dlg.i + 1 });
    const cb = dlg.done;
    setDlg(null);
    cb?.();
  };

  const confetti = (n = 4) => {
    for (let k = 0; k < n; k++) later(() => spawnBits(fxRef.current, 15 + Math.random() * 70, 18 + Math.random() * 30, 14, "burst"), k * 260);
  };
  const candleXY = (i: number): [number, number] => [CAKE_L + (CANDLES[i][0] / 100) * CAKE_W, CAKE_T + (CANDLES[i][1] / 100) * CAKE_H - 6];

  /* ---------- Lilin ---------- */
  const light = (i: number) => {
    if (phaseRef.current !== "light" || dlg || csRef.current[i] !== "off") return;
    const next = csRef.current.map((s, k) => (k === i ? "lit" : s)) as CState[];
    setCs(next);
    sfx.zap();
    sfx.pop();
    const [x, y] = candleXY(i);
    spawnBits(fxRef.current, x, y, 6, "spark");
    if (next.every((s) => s === "lit")) {
      setPhase("wish");
      later(() => say(WISH_SAYS, () => setPhase("blow")), 900);
    }
  };

  const blowOut = (i: number) => {
    const cur = csRef.current;
    if (phaseRef.current !== "blow" || cur[i] !== "lit") return;
    const next = cur.map((s, k) => (k === i ? "out" : s)) as CState[];
    setCs(next);
    sfx.wrap();
    sfx.pop();
    setBlowing(true);
    later(() => setBlowing(false), 700);
    const [x, y] = candleXY(i);
    spawnBits(fxRef.current, x, y, 5, "spark");
    if (next.every((s) => s === "out")) {
      setPhase("cheer");
      stopMic();
      later(() => {
        sfx.win();
        confetti(5);
        say(CHEER_SAYS, startBirthday);
      }, 1000);
    }
  };

  /* ---------- Tiup lewat mikrofon (opsional) ---------- */
  const stopMic = () => {
    const m = micRef.current;
    if (!m) return;
    cancelAnimationFrame(m.raf);
    m.stream.getTracks().forEach((t) => t.stop());
    void m.ac.close();
    micRef.current = null;
    setMicOn(false);
  };
  const startMic = async () => {
    if (micRef.current) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const ac = new AudioContext();
      const an = ac.createAnalyser();
      an.fftSize = 512;
      ac.createMediaStreamSource(stream).connect(an);
      const buf = new Uint8Array(an.fftSize);
      let last = 0;
      const m = { stream, ac, raf: 0 };
      const loop = () => {
        an.getByteTimeDomainData(buf);
        let sum = 0;
        for (let k = 0; k < buf.length; k++) {
          const v = (buf[k] - 128) / 128;
          sum += v * v;
        }
        const now = performance.now();
        if (Math.sqrt(sum / buf.length) > 0.14 && now - last > 380) {
          last = now;
          const idx = csRef.current.findIndex((s) => s === "lit");
          if (idx >= 0) blowOut(idx);
        }
        m.raf = requestAnimationFrame(loop);
      };
      micRef.current = m;
      setMicOn(true);
      loop();
    } catch {
      setMicErr(true);
    }
  };

  /* ---------- Lagu (mp3 kalau ada, melodi cadangan kalau tidak) ---------- */
  const runSong = (cfg: SongCfg, onEnd: () => void) => {
    track.play(cfg.src || undefined, cfg.variant, { from: cfg.from });
    const start = performance.now();
    let sim: number | null = null;
    let ended = false;
    const endSong = () => {
      if (ended) return;
      ended = true;
      window.clearInterval(songTimer.current);
      songStop.current = undefined;
      track.stop();
      setSong(null);
      onEnd();
    };
    songTimer.current = window.setInterval(() => {
      const now = performance.now();
      const real = track.time();
      let cur: number;
      if (real !== null) cur = real - (cfg.from ?? 0);
      else if (!cfg.src) cur = (now - start) / 1000;
      else if (now - start > 2500) {
        sim ??= now; // mp3 tidak kunjung berbunyi: pakai jam simulasi
        cur = (now - sim) / 1000;
      } else cur = 0;
      setSong({ cfg, t: Math.max(0, cur) });
      if (cur >= cfg.seconds) endSong();
    }, 100);
    songStop.current = endSong;
    setSong({ cfg, t: 0 });
  };

  // tirai menutup -> panggung -> dialog -> menyanyi
  const toStage = () => {
    setCover(true);
    later(() => {
      setPhase("curtain");
      setOnStage(true);
      later(() => {
        setCover(false);
        later(() => {
          setPhase("stage");
          say(STAGE_SAYS, startSing);
        }, 900);
      }, 500);
    }, 900);
  };
  const startBirthday = () => {
    setPhase("song");
    runSong(SONG_BIRTHDAY, () => {
      // lagu selesai -> warung ketoprak -> panggung
      setPhase("curtain");
      setCover(true);
      later(() => {
        setPhase("warung");
        later(() => setCover(false), 350);
      }, 900);
    });
  };
  const startSing = () => {
    setPhase("sing");
    runSong(SONG_STAGE, () => {
      setPhase("bow");
      sfx.win();
      confetti(6);
      // setelah membungkuk: tirai menutup -> buka hadiah (gacha) -> kartu penutup
      later(() => {
        setCover(true);
        later(() => {
          setPhase("gacha");
          later(() => setCover(false), 350);
        }, 900);
      }, 2600);
    });
  };

  /* ---------- Siklus hidup ---------- */
  useEffect(() => {
    music.stop();
    PRELOAD.forEach((p) => (new Image().src = asset(p)));
    // lompat langsung ke adegan tertentu (hanya dipakai lewat ?finale=... untuk testing)
    const out = CANDLES.map(() => "out" as CState);
    switch (start) {
      case "song":
        setCs(out);
        setPhase("cheer");
        later(startBirthday, 300);
        break;
      case "warung":
        setCs(out);
        setPhase("warung");
        break;
      case "stage":
        setCs(out);
        setOnStage(true);
        setPhase("stage");
        later(() => say(STAGE_SAYS, startSing), 600);
        break;
      case "gacha":
        setCs(out);
        setBonus(1);
        setOnStage(true);
        setPhase("gacha");
        break;
      case "voice":
        setCs(out);
        setOnStage(true);
        setPhase("voice");
        break;
      case "end":
        setCs(out);
        setOnStage(true);
        setPhase("end");
        break;
      default:
        later(() => say(PARTY_INTRO, () => setPhase("light")), 900);
    }
    return () => {
      timers.current.forEach(clearTimeout);
      timers.current = [];
      window.clearInterval(songTimer.current);
      track.stop();
      stopMic();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // ayunan penampil dan penonton
  useEffect(() => {
    if (phase !== "sing" && phase !== "song" && phase !== "cheer" && phase !== "stage") return;
    const id = window.setInterval(() => setFr((f) => 1 - f), phase === "sing" ? 420 : 520);
    return () => window.clearInterval(id);
  }, [phase]);
  // konfeti pelan selama menyanyi
  useEffect(() => {
    if (phase !== "sing") return;
    const id = window.setInterval(() => spawnBits(fxRef.current, 20 + Math.random() * 60, 15 + Math.random() * 25, 6, "burst"), 3200);
    return () => window.clearInterval(id);
  }, [phase]);

  const finish = () => {
    track.stop();
    onBack();
  };

  const locked = !!dlg || (phase !== "light" && phase !== "blow");
  const lit = cs.filter((s) => s === "lit").length;
  const rubyPose =
    phase === "wish" ? "wish" : phase === "blow" ? (blowing ? "blow" : "wish") : phase === "cheer" || phase === "song" || phase === "curtain" ? "cheer" : "idle";
  const dark = phase === "cheer" || phase === "song" || phase === "curtain" ? 0 : Math.max(0, 0.72 - lit * 0.13);
  const archFrame: "a" | "b" | "c" = phase === "bow" || phase === "end" ? "c" : phase === "sing" ? (fr ? "b" : "a") : "a";
  const lyric = song ? [...song.cfg.lines].filter((l) => l.at <= song.t).pop() : undefined;
  const line = dlg ? dlg.lines[dlg.i] : null;

  return (
    <div className="f-root">
      <div className="f-bg f-party" style={{ backgroundImage: `url(${asset("bg/party.png")})`, opacity: onStage ? 0 : 1 }} />
      <div className="f-bg f-stagebg" style={{ backgroundImage: `url(${asset("bg/stage.png")})`, opacity: onStage ? 1 : 0 }} />

      {!onStage && (
        <>
          <div className="f-dim" style={{ opacity: dark }} />
          <div className={`f-ruby ${phase === "cheer" || phase === "song" ? "is-hop" : ""}`}>
            <img src={asset(`sprites/ruby-${rubyPose}.png`)} alt="" draggable={false} />
          </div>
          <div className="f-cake" style={{ left: `${CAKE_L}%`, top: `${CAKE_T}%`, width: `${CAKE_W}%` }}>
            <img src={asset("items/cake.png")} alt="" draggable={false} />
            {CANDLES.map(([x, y], i) => {
              const s = cs[i];
              const hot = !locked && ((phase === "light" && s === "off") || (phase === "blow" && s === "lit"));
              return (
                <button key={i} className={`f-candle ${s} ${hot ? "is-hot" : ""}`} style={{ left: `${x}%`, top: `${y}%` }} onClick={() => (phase === "light" ? light(i) : blowOut(i))} disabled={locked} aria-label={`lilin ${i + 1}`}>
                  <span className="f-stick" />
                  {s === "lit" && <Flame />}
                  {s === "out" && (
                    <span className="f-smoke">
                      <i /><i /><i />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </>
      )}

      {onStage && (
        <>
          <div className="f-glow" />
          <div className={`f-arch ${phase === "sing" ? "is-sing" : ""}`} style={{ aspectRatio: SPRITE_ASPECT }}>
            {(["a", "b", "c"] as const).map((k) => {
              const f = FACE_SPOT[k];
              return (
                <div key={k} className={`f-frame ${archFrame === k ? "on" : ""}`}>
                  <img src={asset(`sprites/stage-architect-${k}.png`)} alt="" draggable={false} />
                  <div className="f-face" style={{ left: `${f.cx}%`, top: `${f.cy}%`, width: `${f.w * FACE_SCALE}%`, height: `${f.h * FACE_SCALE}%`, transform: `translate(-50%,-50%) rotate(${f.rot}deg)` }}>
                    <PixelFace />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="f-back">
            <img src={asset(`sprites/ruby-back-${fr ? "b" : "a"}.png`)} alt="" draggable={false} />
          </div>
        </>
      )}

      <div className="f-fx" ref={fxRef} />

      {/* petunjuk */}
      {!dlg && phase === "light" && <div className="f-hint">KLIK LILIN UNTUK MENYALAKAN ({lit}/{CANDLES.length})</div>}
      {!dlg && phase === "blow" && (
        <>
          <div className="f-hint">TIUP LILINNYA: KLIK TIAP LILIN ({CANDLES.length - lit}/{CANDLES.length})</div>
          <button className={`f-mic ${micOn ? "on" : ""}`} onClick={() => (micOn ? stopMic() : void startMic())}>
            {micErr ? "MIC TIDAK BISA DIPAKAI" : micOn ? "🎤 MIC AKTIF: TIUP!" : "🎤 TIUP PAKAI MIC"}
          </button>
        </>
      )}

      {/* lirik */}
      {song && (
        <div className={`f-song ${onStage ? "is-stage" : ""}`}>
          <small>♪ {song.cfg.title}{song.cfg.artist ? ` · ${song.cfg.artist}` : ""}</small>
          {lyric && <p key={lyric.text + lyric.at}>{lyric.text}</p>}
        </div>
      )}
      {DEV_SKIP_BUTTON && song && (
        <button className="f-skip" onClick={() => songStop.current?.()}>⏭ LEWATI</button>
      )}

      {phase === "warung" && (
        <Warung
          onDone={(b) => {
            setBonus(b ? 1 : 0);
            toStage();
          }}
        />
      )}
      {phase === "gacha" && (
        <Gacha
          tickets={Math.max(2, (stars ?? 4) + bonus)}
          onDone={() => {
            // gacha selesai -> tirai -> pesan suara -> kartu penutup
            setCover(true);
            later(() => {
              setPhase("voice");
              later(() => setCover(false), 350);
            }, 900);
          }}
        />
      )}
      {phase === "voice" && <VoiceNote onDone={() => setPhase("end")} />}
      <div className={`f-cover ${cover ? "on" : ""}`} />
      {line && <TalkBox line={line} onAdvance={advance} />}

      {phase === "end" && (
        <div className="f-end">
          <h2>{ENDING_TITLE}</h2>
          {ENDING_LINES.map((t, k) => <p key={k}>{t}</p>)}
          <button onClick={() => { sfx.click(); finish(); }}>{ENDING_BUTTON}</button>
        </div>
      )}
    </div>
  );
}

