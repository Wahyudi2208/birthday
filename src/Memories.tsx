import { useEffect, useRef, useState } from "react";
import "./memories.css";
import { INTRO_MUSIC, INTRO_SAYS, MOMENTS, REWARD_LINES, REWARD_TITLE, SPEAKER, type Mood, type Say } from "./memories-data";
import { sfx, track } from "./sfx";

type Mouth = "closed" | "half" | "wide";
type Dlg = { lines: Say[]; i: number; done?: () => void };

const asset = (p: string) => `${import.meta.env.BASE_URL}${p}`;
// Mood yang punya frame kedip (kalau kamu menambah gambar "<mood>-blink.png", tambahkan di sini)
const HAS_BLINK: Partial<Record<Mood, boolean>> = { neutral: true, happy: true };
const MOODS: Mood[] = ["neutral", "happy", "shy", "surprised"];

function Portrait({ mood, mouth }: { mood: Mood; mouth: Mouth }) {
  const [blink, setBlink] = useState(false);
  useEffect(() => {
    let t: number;
    const loop = () => {
      t = window.setTimeout(() => {
        setBlink(true);
        t = window.setTimeout(() => {
          setBlink(false);
          loop();
        }, 150);
      }, 2500 + Math.random() * 2500);
    };
    loop();
    return () => window.clearTimeout(t);
  }, []);
  const state = mouth === "closed" && blink && HAS_BLINK[mood] ? "blink" : mouth;
  return (
    <div className={`m-portrait ${mood === "mimic" ? "is-mimic" : ""}`}>
      <img src={asset(`portraits/${mood}-${state}.png`)} alt="" draggable={false} />
    </div>
  );
}

export function TalkBox({ line, onAdvance }: { line: Say; onAdvance: () => void }) {
  const [n, setN] = useState(0);
  const [mouth, setMouth] = useState<Mouth>("closed");
  const i = useRef(0);
  const mood = line.mood ?? "neutral";
  useEffect(() => {
    i.current = 0;
    setN(0);
    setMouth("closed");
    const t = window.setInterval(() => {
      i.current += 1;
      const c = line.text[i.current - 1] ?? " ";
      setN(i.current);
      if (i.current % 2 === 0) sfx.blip();
      // Mulut mengikuti huruf: vokal = lebar, konsonan = setengah, spasi/tanda baca = tutup
      if (i.current % 2 === 1) setMouth(/[\s.,!?…]/.test(c) ? "closed" : /[aiueoAIUEO]/.test(c) ? "wide" : "half");
      if (i.current >= line.text.length) {
        window.clearInterval(t);
        setMouth("closed");
      }
    }, 45);
    return () => window.clearInterval(t);
  }, [line]);
  const full = n >= line.text.length;
  const click = () => {
    if (!full) {
      i.current = line.text.length;
      setN(line.text.length);
      setMouth("closed");
    } else {
      sfx.click();
      onAdvance();
    }
  };
  return (
    <>
      <Portrait mood={mood} mouth={full ? "closed" : mouth} />
      <div className={`m-dialog ${mood === "mimic" ? "is-mimic" : ""}`} onClick={click}>
        <div className="m-who">{line.who ?? SPEAKER}</div>
        <p>{line.text.slice(0, n)}</p>
        {full && <span className="m-next">▶</span>}
      </div>
    </>
  );
}

function Photo({ src, n }: { src: string; n: number }) {
  const [bad, setBad] = useState(false);
  return bad ? (
    <div className="m-ph">FOTO {n}<small>taruh di public/{src}</small></div>
  ) : (
    <img src={asset(src)} alt="" draggable={false} onError={() => setBad(true)} />
  );
}

export default function Memories({ onBack }: { onBack: () => void }) {
  const [dlg, setDlg] = useState<Dlg | null>(null);
  const [shown, setShown] = useState(-1); // momen yang tampil di buku (-1 = halaman kosong)
  const [flip, setFlip] = useState(false);
  const [canNext, setCanNext] = useState(false);
  const [ended, setEnded] = useState(false);
  const timers = useRef<number[]>([]);

  const later = (fn: () => void, ms: number) => timers.current.push(window.setTimeout(fn, ms));
  const say = (lines: Say[], done?: () => void) => setDlg({ lines, i: 0, done });
  const advance = () => {
    if (!dlg) return;
    if (dlg.i < dlg.lines.length - 1) return setDlg({ ...dlg, i: dlg.i + 1 });
    const cb = dlg.done;
    setDlg(null);
    cb?.();
  };

  // Balik halaman -> ganti musik -> isi halaman muncul -> avatar bicara
  const openMoment = (i: number) => {
    setCanNext(false);
    setFlip(true);
    sfx.page();
    track.play(MOMENTS[i].music || undefined, i);
    later(() => setShown(i), 450);
    later(() => {
      setFlip(false);
      say(MOMENTS[i].says, () => {
        if (i < MOMENTS.length - 1) setCanNext(true);
        else {
          sfx.win();
          setEnded(true);
        }
      });
    }, 950);
  };

  useEffect(() => {
    const imgs = [...MOMENTS.map((m) => m.photo), "bg/book.jpg", ...MOODS.flatMap((m) => ["closed", "half", "wide", "blink"].map((s) => `portraits/${m}-${s}.png`))];
    imgs.forEach((p) => (new Image().src = asset(p)));
    track.play(INTRO_MUSIC || undefined, 4);
    say(INTRO_SAYS, () => openMoment(0));
    return () => {
      timers.current.forEach(clearTimeout);
      track.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const m = shown >= 0 ? MOMENTS[shown] : null;
  const line = dlg ? dlg.lines[dlg.i] : null;

  return (
    <div className="m-root" style={{ backgroundImage: `url(${asset("bg/book.jpg")})` }}>
      <div className={`m-content ${flip ? "is-hidden" : ""}`}>
        {m && (
          <>
            <div className="m-polaroid" key={`p${shown}`}>
              <div className="m-photo"><Photo src={m.photo} n={shown + 1} /></div>
              <span>{m.date}</span>
            </div>
            <div className="m-text" key={`t${shown}`}>
              <small>MOMEN {shown + 1} / {MOMENTS.length}</small>
              <h3>{m.title}</h3>
              <p>{m.caption}</p>
            </div>
          </>
        )}
      </div>
      {flip && <div className="m-flip" />}
      {canNext && !dlg && (
        <button className="m-nextpage" onClick={() => { sfx.click(); openMoment(shown + 1); }}>BALIK HALAMAN ▶</button>
      )}
      {line && <TalkBox line={line} onAdvance={advance} />}
      {ended && (
        <div className="m-reward">
          <h2>{REWARD_TITLE}</h2>
          {REWARD_LINES.map((t, k) => <p key={k}>{t}</p>)}
          <button onClick={() => { sfx.click(); onBack(); }}>[ KEMBALI KE HOME ▶ ]</button>
        </div>
      )}
    </div>
  );
}
