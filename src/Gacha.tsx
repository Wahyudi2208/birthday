import { useEffect, useRef, useState, type CSSProperties } from "react";
import "./gacha.css";
import { spawnBits } from "./fx";
import {
  ALBUM_SAYS, CARDS, CARD_FRAME, GIFT_INTRO, MACHINE_SAYS, ODDS, PITY, SECRET_SAYS, STAT_LABELS, TICKETS, TIER_STYLE,
  type GachaCard, type Tier,
} from "./gacha-data";
import { TalkBox } from "./Memories";
import type { Say } from "./memories-data";
import { sfx } from "./sfx";

/* ------------------------------------------------------------------ *
 *  Gacha.tsx = buka hadiah: kotak -> mesin gacha -> kapsul -> kartu -> album.
 *  Kartu, teks, dan aturan ada di gacha-data.ts.
 * ------------------------------------------------------------------ */
const asset = (p: string) => `${import.meta.env.BASE_URL}${p}`;
const pc = (v: number) => `${(v * 100).toFixed(2)}%`;
const rect = (r: { x: number; y: number; w: number; h: number }): CSSProperties => ({ left: pc(r.x), top: pc(r.y), width: pc(r.w), height: pc(r.h) });

type Phase = "box" | "unbox" | "machine" | "ready" | "crank" | "drop" | "open" | "reveal" | "album";
type Dlg = { lines: Say[]; i: number; done?: () => void };
const POOL = CARDS.filter((c) => c.tier !== "secret");
const SECRET = CARDS.find((c) => c.tier === "secret") ?? CARDS[CARDS.length - 1];

/** Satu kartu. k = skala teks (1 = ukuran besar; kecil = mini di album, teks disembunyikan). */
export function CardView({ card, k = 1 }: { card: GachaCard; k?: number }) {
  const [broken, setBroken] = useState(false);
  const t = TIER_STYLE[card.tier];
  const f = CARD_FRAME;
  const no = CARDS.findIndex((c) => c.id === card.id) + 1;
  const style = { "--tc": t.color, "--k": k } as CSSProperties;
  return (
    <div className={`gc-card t-${card.tier} ${k < 0.5 ? "mini" : ""}`} style={style}>
      <div className="gc-photo" style={rect(f.photo)}>
        {broken ? (
          <div className="gc-ph">
            <b>?</b>
            <small>FOTO BELUM ADA</small>
          </div>
        ) : (
          <img src={asset(card.photo)} alt="" draggable={false} onError={() => setBroken(true)} />
        )}
      </div>
      <img className="gc-frame" src={asset("items/card-frame.png")} alt="" draggable={false} style={{ filter: t.filter }} />
      <div className="gc-plate" style={rect(f.plate)}>{t.label}</div>
      <div className="gc-no">No. {String(no).padStart(2, "0")}/{String(CARDS.length).padStart(2, "0")}</div>
      <div className="gc-panel" style={rect(f.panel)}>
        <b>{card.name}</b>
        <div className="gc-stats">
          {card.stats.map((v, i) => (
            <span key={i}>
              <small>{STAT_LABELS[i]} {v}</small>
              <i><u style={{ width: `${Math.min(100, v)}%` }} /></i>
            </span>
          ))}
        </div>
        <p>{card.note}</p>
      </div>
      {(card.tier === "legendary" || card.tier === "secret") && <div className="gc-holo" />}
    </div>
  );
}

export default function Gacha({ onDone, tickets: nTickets = TICKETS }: { onDone: () => void; tickets?: number }) {
  const [phase, setPhaseS] = useState<Phase>("box");
  const [tickets, setTickets] = useState(nTickets);
  const [dlg, setDlg] = useState<Dlg | null>(null);
  const [cur, setCur] = useState<GachaCard | null>(null);
  const [owned, setOwned] = useState<string[]>([]);
  const [flipped, setFlipped] = useState(false);
  const [burst, setBurst] = useState(false);
  const [shake, setShake] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);
  const [zoom, setZoom] = useState<GachaCard | null>(null);

  const phaseRef = useRef<Phase>("box");
  const ownedRef = useRef<string[]>([]);
  const streakRef = useRef(0);
  const pullRef = useRef(0);
  const timers = useRef<number[]>([]);
  const fxRef = useRef<HTMLDivElement>(null);

  const setPhase = (p: Phase) => {
    phaseRef.current = p;
    setPhaseS(p);
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

  useEffect(() => {
    const names = [
      "bg/gift.png", "items/gift-box-closed.png", "items/gift-box-open.png", "items/gacha-idle.png", "items/gacha-crank.png",
      "items/card-frame.png", "items/card-back.png", "items/capsule-common.png", "items/capsule-rare.png", "items/capsule-epic.png",
      "items/capsule-legendary.png", "items/capsule-secret.png", "items/capsule-half-a.png", "items/capsule-half-b.png",
      "sprites/ruby-idle.png", "sprites/ruby-cheer.png", ...CARDS.map((c) => c.photo),
    ];
    names.forEach((n) => (new Image().src = asset(n)));
    later(() => say(GIFT_INTRO), 700);
    return () => {
      timers.current.forEach(clearTimeout);
      timers.current = [];
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---------- Undian ---------- */
  const draw = (): GachaCard => {
    const n = pullRef.current + 1;
    pullRef.current = n;
    if (n >= nTickets) return SECRET; // tarikan terakhir selalu Secret
    let remaining = POOL.filter((c) => !ownedRef.current.includes(c.id));
    if (!remaining.length) remaining = POOL;
    const w: Record<string, number> = { ...ODDS };
    if (streakRef.current >= PITY) w.common = 0; // pity: dijamin rare ke atas
    const avail = (Object.keys(w) as Tier[]).filter((t) => w[t] > 0 && remaining.some((c) => c.tier === t));
    const tiers = avail.length ? avail : (Object.keys(w) as Tier[]).filter((t) => remaining.some((c) => c.tier === t));
    const total = tiers.reduce((s, t) => s + (w[t] || 1), 0);
    let r = Math.random() * total;
    let tier = tiers[0];
    for (const t of tiers) {
      r -= w[t] || 1;
      if (r <= 0) {
        tier = t;
        break;
      }
    }
    const list = remaining.filter((c) => c.tier === tier);
    const card = list[Math.floor(Math.random() * list.length)];
    streakRef.current = card.tier === "common" ? streakRef.current + 1 : 0;
    return card;
  };

  /* ---------- Alur ---------- */
  const openBox = () => {
    if (phaseRef.current !== "box" || dlg) return;
    setPhase("unbox");
    sfx.win();
    spawnBits(fxRef.current, 50, 58, 14, "burst");
    later(() => {
      setPhase("machine");
      sfx.pop();
      say(MACHINE_SAYS.map((l) => ({ ...l, text: l.text.replace("{n}", String(nTickets)) })), () => setPhase("ready"));
    }, 1800);
  };

  const pull = () => {
    if (phaseRef.current !== "ready" || dlg || tickets <= 0) return;
    const card = draw();
    setCur(card);
    setTickets((t) => t - 1);
    setPhase("crank");
    sfx.zap();
    later(() => sfx.zap(), 280);
    later(() => sfx.zap(), 560);
    later(() => {
      setPhase("drop");
      sfx.pop();
    }, 1100);
  };

  const openCapsule = () => {
    if (phaseRef.current !== "drop" || !cur) return;
    const hi = cur.tier === "legendary" || cur.tier === "secret";
    setPhase("open");
    sfx.click();
    const wait = hi ? 1900 : cur.tier === "epic" ? 1400 : 950;
    later(() => {
      setBurst(true);
      setFlash(TIER_STYLE[cur.tier].color);
      setShake(hi);
      spawnBits(fxRef.current, 50, 42, hi ? 28 : 16, "burst");
      sfx.win();
      if (cur.tier !== "common") later(() => sfx.win(), 220);
      if (hi) later(() => sfx.win(), 440);
      later(() => {
        setFlash(null);
        setShake(false);
      }, 520);
      later(() => {
        setBurst(false);
        ownedRef.current = [...ownedRef.current, cur.id];
        setOwned(ownedRef.current);
        setFlipped(false);
        setPhase("reveal");
        later(() => {
          setFlipped(true);
          if (cur.tier !== "common") spawnBits(fxRef.current, 50, 40, 12, "burst");
        }, 350);
      }, 650);
    }, wait);
  };

  const toAlbum = () => {
    setPhase("album");
    setCur(null);
    say(ALBUM_SAYS);
  };
  const afterReveal = () => {
    if (phaseRef.current !== "reveal" || !flipped || dlg || !cur) return;
    const c = cur;
    setCur(null);
    setFlipped(false);
    if (c.tier === "secret") return say(SECRET_SAYS, toAlbum);
    if (pullRef.current >= nTickets) return toAlbum();
    setPhase("ready");
  };

  const line = dlg ? dlg.lines[dlg.i] : null;
  const showMachine = phase !== "box" && phase !== "unbox" && phase !== "album";
  const frame = phase === "crank" ? "crank" : "idle";
  const tier = cur?.tier;
  const cheer = phase === "unbox" || (phase === "reveal" && (tier === "epic" || tier === "legendary" || tier === "secret"));
  const cols = Math.ceil(CARDS.length / 2);
  const miniW = Math.min(12.5, 72 / cols);
  const miniH = miniW / CARD_FRAME.aspect;

  return (
    <div className={`gc-root ${shake ? "shake" : ""}`}>
      <div className="gc-bg" style={{ backgroundImage: `url(${asset("bg/gift.png")})` }} />
      <div className="gc-dim" style={{ opacity: phase === "open" || phase === "reveal" ? 0.7 : 0 }} />

      {phase !== "album" && (
        <div className="gc-ruby">
          <img src={asset(`sprites/ruby-${cheer ? "cheer" : "idle"}.png`)} alt="" draggable={false} />
        </div>
      )}

      {(phase === "box" || phase === "unbox") && (
        <button className={`gc-box ${phase === "unbox" ? "is-open" : ""} ${!dlg && phase === "box" ? "hot" : ""}`} onClick={openBox} disabled={phase !== "box" || !!dlg} aria-label="buka hadiah">
          <img src={asset("items/gift-box-closed.png")} alt="" draggable={false} className="c" />
          <img src={asset("items/gift-box-open.png")} alt="" draggable={false} className="o" />
        </button>
      )}

      {showMachine && (
        <button className={`gc-machine ${phase === "machine" ? "pop" : ""}`} onClick={pull} disabled={phase !== "ready" || !!dlg} aria-label="mesin gacha">
          <img src={asset(`items/gacha-${frame}.png`)} alt="" draggable={false} />
        </button>
      )}

      {cur && (phase === "drop" || phase === "open") && !burst && (
        <button className={`gc-cap ${phase === "drop" ? "tray" : "center shaking"}`} onClick={openCapsule} disabled={phase !== "drop"} aria-label="kapsul">
          <img src={asset(`items/capsule-${cur.tier}.png`)} alt="" draggable={false} />
        </button>
      )}
      {burst && (
        <>
          <img className="gc-half a" src={asset("items/capsule-half-a.png")} alt="" draggable={false} />
          <img className="gc-half b" src={asset("items/capsule-half-b.png")} alt="" draggable={false} />
        </>
      )}

      {phase === "reveal" && cur && (
        <div className="gc-reveal" onClick={afterReveal}>
          <div className="gc-tier" style={{ color: TIER_STYLE[cur.tier].color, opacity: flipped ? 1 : 0 }}>{TIER_STYLE[cur.tier].label}!</div>
          <div className="gc-glow" style={{ "--tc": TIER_STYLE[cur.tier].color } as CSSProperties}>
            <div className={`gc-flip ${flipped ? "flipped" : ""}`} style={{ aspectRatio: CARD_FRAME.aspect }}>
              <div className="gc-face back"><img src={asset("items/card-back.png")} alt="" draggable={false} /></div>
              <div className="gc-face front"><CardView card={cur} /></div>
            </div>
          </div>
          {flipped && !dlg && <div className="gc-next">{pullRef.current >= nTickets ? "KLIK UNTUK LANJUT ▶" : `KLIK UNTUK TARIK LAGI ▶ (sisa ${tickets})`}</div>}
        </div>
      )}

      {phase === "album" && (
        <div className="gc-album">
          <h3>KOLEKSI {owned.length}/{CARDS.length}</h3>
          <div className="gc-grid" style={{ gridTemplateColumns: `repeat(${cols}, ${miniW}em)` }}>
            {CARDS.map((c) => (
              <button key={c.id} className={owned.includes(c.id) ? "own" : "not-own"} style={{ width: `${miniW}em`, height: `${miniH}em` }} onClick={() => setZoom(c)}>
                <CardView card={c} k={0.2} />
              </button>
            ))}
          </div>
          {!dlg && <button className="gc-go" onClick={() => { sfx.click(); onDone(); }}>[ LANJUT ▶ ]</button>}
        </div>
      )}
      {zoom && (
        <div className="gc-zoom" onClick={() => setZoom(null)}>
          <div className="gc-big" style={{ aspectRatio: CARD_FRAME.aspect }}><CardView card={zoom} /></div>
        </div>
      )}

      {phase !== "box" && phase !== "unbox" && phase !== "album" && <div className="gc-tickets">TIKET ×{tickets}</div>}
      {!dlg && phase === "box" && <div className="f-hint">KLIK HADIAH UNTUK MEMBUKA</div>}
      {!dlg && phase === "ready" && <button className="gc-pull" onClick={pull}>TARIK ▶</button>}
      {!dlg && phase === "drop" && <div className="f-hint">KLIK KAPSULNYA</div>}

      <div className="gc-flash" style={{ opacity: flash ? 0.85 : 0, background: flash ?? "#fff" }} />
      <div className="gc-fx" ref={fxRef} />
      {line && <TalkBox line={line} onAdvance={advance} />}
    </div>
  );
}
