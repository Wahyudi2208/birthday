import { useCallback, useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import "./discord.css";
import { CHANNEL, CONNECT, ENDING, MEMORIES, NAMES, SCRIPT, type Memory, type Who } from "./discord-data";
import { sfx, track } from "./sfx";

/* ------------------------------------------------------------------ *
 *  Discord.tsx = adegan terakhir. Semua ISI (obrolan, lagu, lirik) ada di
 *  discord-data.ts. Posisi/ukuran avatar dan bubble ada di bagian atas
 *  discord.css. File ini hanya mesinnya.
 * ------------------------------------------------------------------ */
type Mouth = "closed" | "half" | "wide";
type Phase = "connect" | "chat" | "memory" | "end";

const asset = (p: string) => `${import.meta.env.BASE_URL}${p}`;
const FILE: Record<Who, string> = { architect: "dc-architect", kamu: "dc-ruby" };
const spr = (who: Who, m: Mouth) => asset(`sprites/${FILE[who]}-${m}.png`);
const PRELOAD = [
  ...(["architect", "kamu"] as Who[]).flatMap((w) => (["closed", "half", "wide"] as Mouth[]).map((m) => spr(w, m))),
  asset("bg/discord.png"),
  asset("sprites/dc-bubble.png"),
  asset("sprites/dc-tail.png"),
];

function Bubble({ side, text, n, lit, keyPhrase }: { side: "l" | "r"; text: string; n: number; lit: boolean; keyPhrase?: string }) {
  let live: ReactNode = lit ? text : text.slice(0, n);
  if (lit && keyPhrase) {
    const at = text.indexOf(keyPhrase);
    if (at >= 0) {
      live = (
        <>
          {text.slice(0, at)}
          <mark className="dc-key">{keyPhrase}</mark>
          {text.slice(at + keyPhrase.length)}
        </>
      );
    }
  }
  return (
    <div className={`dc-bub ${side}`} style={{ "--bub": `url(${asset("sprites/dc-bubble.png")})` } as CSSProperties}>
      {/* teks lengkap tak terlihat menjaga ukuran bubble tetap, supaya tidak melebar saat teks diketik */}
      <div className="dc-body">
        <p className="dc-txt">
          <span className="dc-ghost">{text}</span>
          <span className="dc-live">{live}</span>
        </p>
      </div>
      <img className="dc-tail" src={asset("sprites/dc-tail.png")} alt="" draggable={false} />
    </div>
  );
}

function Char({ who, speaking, dim, hop, mouth, children }: { who: Who; speaking: boolean; dim: boolean; hop: boolean; mouth: Mouth; children?: ReactNode }) {
  return (
    <div className={`dc-who ${who === "architect" ? "l" : "r"} ${speaking ? "on" : ""} ${dim ? "off" : ""}`}>
      <div className={`dc-hop ${hop ? "hop" : ""}`}>
        <img className="dc-spr" src={spr(who, mouth)} alt="" draggable={false} />
      </div>
      {children}
      <div className="dc-name">{NAMES[who]}</div>
    </div>
  );
}

/* Potongan memori: layar meredup, lagu masuk, foto, judul diketik, lirik baris per baris. */
function MemoryScene({ m, onDone }: { m: Memory; onDone: () => void }) {
  const [t, setT] = useState(0);
  const [out, setOut] = useState(false);
  const [typed, setTyped] = useState(0);
  const [badPhoto, setBadPhoto] = useState(false);
  const fin = useRef(false);
  const timers = useRef<number[]>([]);
  const cb = useRef(onDone);
  useEffect(() => {
    cb.current = onDone;
  });
  const title = `♪ ${m.title}${m.artist ? ` — ${m.artist}` : ""}`;

  const finish = useCallback(() => {
    if (fin.current) return;
    fin.current = true;
    setOut(true);
    track.stop();
    timers.current.push(window.setTimeout(() => cb.current(), 600));
  }, []);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  // Lagu + jam putar. Pakai waktu mp3 kalau ada, kalau tidak pakai jam simulasi.
  useEffect(() => {
    track.play(m.src || undefined, m.variant ?? 6, { from: m.from, loop: false, onEnd: finish });
    const start = performance.now();
    let sim: number | null = null;
    const id = window.setInterval(() => {
      const now = performance.now();
      const real = track.time();
      let cur: number;
      if (real !== null) cur = real - (m.from ?? 0);
      else if (!m.src) cur = (now - start) / 1000;
      else if (now - start > 2500) {
        sim ??= now; // mp3 tidak kunjung berbunyi: pakai jam simulasi
        cur = (now - sim) / 1000;
      } else cur = 0;
      setT(Math.max(0, cur));
      if (cur >= m.seconds) finish();
    }, 100);
    return () => {
      window.clearInterval(id);
      track.stop();
    };
  }, [m, finish]);

  // Judul diketik
  useEffect(() => {
    let k = 0;
    setTyped(0);
    const id = window.setInterval(() => {
      k += 1;
      setTyped(k);
      if (k >= title.length) window.clearInterval(id);
    }, 55);
    return () => window.clearInterval(id);
  }, [title]);

  const shown = m.lines.map((l, idx) => ({ ...l, idx })).filter((l) => l.at <= t).slice(-3);
  return (
    <div className={`dc-mem ${out ? "out" : ""}`}>
      <div className="dc-flash" />
      <div className="dc-polaroid">
        <div className="dc-photo">
          {m.photo && !badPhoto ? (
            <img src={asset(m.photo)} alt="" draggable={false} onError={() => setBadPhoto(true)} />
          ) : (
            <div className="dc-ph">
              FOTO
              <small>isi photo: di discord-data.ts</small>
            </div>
          )}
        </div>
        <span>{m.caption ?? ""}</span>
      </div>
      <div className="dc-song">
        <div className="dc-song-t">{title.slice(0, typed)}</div>
        <div className="dc-ly">
          {shown.map((l, k) => (
            <p key={l.idx} className={k === shown.length - 1 ? "" : k === shown.length - 2 ? "o1" : "o2"}>
              {l.text}
            </p>
          ))}
        </div>
      </div>
      <button
        className="dc-skip"
        onClick={(e) => {
          e.stopPropagation();
          finish();
        }}
      >
        LEWATI ▶▶
      </button>
      <i className="dc-prog" style={{ width: `${Math.min(100, (t / m.seconds) * 100)}%` }} />
    </div>
  );
}

export default function Discord({ onBack, onDone }: { onBack: () => void; onDone: () => void }) {
  const [phase, setPhase] = useState<Phase>("connect");
  const [i, setI] = useState(0);
  const [tp, setTp] = useState({ i: -1, n: 0 }); // n = jumlah huruf yang sudah tampil untuk bubble ke-i
  const [mouth, setMouth] = useState<Mouth>("closed");
  const [litI, setLitI] = useState<number | null>(null);
  const [mem, setMem] = useState<Memory | null>(null);
  const kRef = useRef(0);
  const doneRef = useRef(false);
  const cb = useRef({ onDone });
  useEffect(() => {
    cb.current = { onDone };
  });

  const beat = SCRIPT[i];
  const len = beat?.text.length ?? 0;
  const n = tp.i === i ? tp.n : 0; // dikunci ke nomor bubble supaya tidak "bocor" dari bubble sebelumnya
  const full = !!beat && n >= len;
  const lit = litI === i;

  useEffect(() => {
    PRELOAD.forEach((src) => {
      new Image().src = src;
    });
    const all = JSON.stringify({ SCRIPT, MEMORIES, ENDING, NAMES });
    const left = (all.match(/\[GANTI/g) ?? []).length;
    if (left) console.warn(`Discord: masih ada ${left} teks [GANTI] yang belum diisi (lihat discord-data.ts)`);
    return () => track.stop();
  }, []);

  // 1) layar "menghubungkan"
  useEffect(() => {
    if (phase !== "connect") return;
    const a = window.setTimeout(() => sfx.ping(), 1500);
    const b = window.setTimeout(() => setPhase("chat"), 2600);
    return () => {
      window.clearTimeout(a);
      window.clearTimeout(b);
    };
  }, [phase]);

  // 2) bubble diketik pelan, mulut avatar mengikuti huruf
  useEffect(() => {
    if (phase !== "chat" || !beat) return;
    kRef.current = 0;
    setTp({ i, n: 0 });
    setMouth("closed");
    const text = beat.text;
    const id = window.setInterval(() => {
      if (kRef.current < text.length) kRef.current += 1;
      const k = kRef.current;
      setTp({ i, n: k });
      const c = text[k - 1] ?? " ";
      if (k % 2 === 0) sfx.blip();
      if (k % 2 === 1) setMouth(/[\s.,!?…]/.test(c) ? "closed" : /[aiueoAIUEO]/.test(c) ? "wide" : "half");
      if (k >= text.length) {
        window.clearInterval(id);
        setMouth("closed");
      }
    }, 45);
    return () => window.clearInterval(id);
  }, [phase, i, beat]);

  const goNext = useCallback(() => {
    if (i + 1 < SCRIPT.length) {
      setI(i + 1);
      setPhase("chat");
    } else setPhase("end");
  }, [i]);

  // naskah kosong: langsung ke penutup
  useEffect(() => {
    if (phase === "chat" && !beat) setPhase("end");
  }, [phase, beat]);

  // 3) bubble yang memicu memori: kata kunci menyala, lalu potongan memori diputar
  useEffect(() => {
    if (phase !== "chat" || !beat?.memory || !full) return;
    const m = MEMORIES[beat.memory];
    if (!m) {
      console.warn(`Discord: memori "${beat.memory}" tidak ada di MEMORIES (discord-data.ts)`);
      const skip = window.setTimeout(goNext, 400);
      return () => window.clearTimeout(skip);
    }
    setLitI(i);
    sfx.ping();
    const id = window.setTimeout(() => {
      setMem(m);
      setPhase("memory");
    }, 1500);
    return () => window.clearTimeout(id);
  }, [phase, i, beat, full, goNext]);

  // 4) penutup: tandai Discord selesai (bintang ke-4 di home)
  useEffect(() => {
    if (phase === "end" && !doneRef.current) {
      doneRef.current = true;
      cb.current.onDone();
    }
  }, [phase]);

  const click = () => {
    if (phase === "connect") return setPhase("chat");
    if (phase !== "chat" || !beat) return;
    if (!full) {
      kRef.current = len;
      setTp({ i, n: len });
      setMouth("closed");
      return;
    }
    if (beat.memory) return; // bubble pemicu: memori jalan otomatis
    sfx.click();
    goNext();
  };

  const chatting = phase === "chat" && !!beat;
  const spk = (w: Who) => chatting && beat.who === w;
  const dim = (w: Who) => chatting && beat.who !== w;
  const typing = chatting && !full;

  return (
    <div className="g-scene dc-root hl-cursor" style={{ backgroundImage: `url(${asset("bg/discord.png")})` }} onClick={click}>
      <div className="dc-chan">🔊 {CHANNEL}</div>
      <i className={`dc-ring l ${spk("architect") ? "on" : ""}`} />
      <i className={`dc-ring r ${spk("kamu") ? "on" : ""}`} />

      {(["architect", "kamu"] as Who[]).map((w) => (
        <Char key={w} who={w} speaking={spk(w)} dim={dim(w)} hop={spk(w) && typing} mouth={spk(w) && typing ? mouth : "closed"}>
          {spk(w) && <Bubble key={i} side={w === "architect" ? "l" : "r"} text={beat.text} n={n} lit={lit} keyPhrase={beat.key} />}
        </Char>
      ))}

      {chatting && full && !beat.memory && <div className="dc-hint">▶ KLIK UNTUK LANJUT</div>}
      <button
        className="dc-exit"
        onClick={(e) => {
          e.stopPropagation();
          onBack();
        }}
      >
        ◀ KELUAR
      </button>

      {phase === "memory" && mem && <MemoryScene m={mem} onDone={goNext} />}

      {phase === "connect" && (
        <div className="dc-connect">
          <i className="dc-dot" />
          <div className="dc-ctext">
            <span className="dc-c1">{CONNECT.connecting}</span>
            <span className="dc-c2">{CONNECT.connected}</span>
          </div>
        </div>
      )}

      {phase === "end" && (
        <div className="dc-reward">
          <h2>{ENDING.title}</h2>
          {ENDING.lines.map((l, k) => (
            <p key={k}>{l}</p>
          ))}
          <button onClick={onBack}>{ENDING.button}</button>
        </div>
      )}
    </div>
  );
}
