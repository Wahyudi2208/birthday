import { useEffect, useRef, useState } from "react";
import "./mimic.css";
import { TalkBox } from "./Memories";
import type { Say } from "./memories-data";
import {
  LUNGE_LINES, MAX_STRIKES, MIMIC_INTRO, MIMIC_MUSIC, OPENING_1, OPENING_2, QUESTIONS, REVEAL_LINES, REVEAL_MIMIC,
  REWARD_LINES, REWARD_TITLE, SPLIT_ARGUE, TAUNTS, TITLE, TITLE_SUB, WRONG_LINES,
} from "./mimic-data";
import { sfx, track } from "./sfx";

type Side = "A" | "B";
type Phase = "title" | "opening" | "answers" | "pick" | "feedback" | "lunge" | "reveal" | "exit" | "end";
type Dlg = { lines: Say[]; i: number; done?: () => void };

const asset = (p: string) => `${import.meta.env.BASE_URL}${p}`;
const sp = (n: string) => asset(`sprites/${n}.png`);
const who = (s: Side) => `AVATAR ${s}`;
const STEPS = MAX_STRIKES - 1; // jumlah tahap kedekatan Mimic sebelum menerkam

export default function Mimic({ onBack }: { onBack: () => void }) {
  const [dlg, setDlg] = useState<Dlg | null>(null);
  const [phase, setPhase] = useState<Phase>("title");
  const [qi, setQi] = useState(0);
  const [real, setReal] = useState<Side>("A");
  const [threat, setThreat] = useState(0); // TIDAK direset antar pertanyaan
  const [showAv, setShowAv] = useState(false);
  const [shadow, setShadow] = useState(false);
  const [flicker, setFlicker] = useState(false);
  const [flash, setFlash] = useState(false);
  const [glitch, setGlitch] = useState<null | boolean>(null); // null = tidak glitch; true/false = bergantian
  const [asMimic, setAsMimic] = useState(false);
  const [vanish, setVanish] = useState(false);
  const [walk, setWalk] = useState(false);
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
  const blinkFlash = (ms = 450) => {
    setFlash(true);
    later(() => setFlash(false), ms);
  };

  // ---------- Pembukaan ----------
  const split = () => {
    blinkFlash();
    sfx.locked();
    setShowAv(true);
    later(() => say(MIMIC_INTRO, () => say(SPLIT_ARGUE, () => startQuestion(0))), 600);
  };
  const shadowEvent = () => {
    setFlicker(true);
    setShadow(true);
    sfx.growl();
    later(() => {
      setShadow(false);
      setFlicker(false);
      say(OPENING_2, split);
    }, 2900);
  };

  // ---------- Pertanyaan ----------
  const sayAnswers = (i: number, side: Side) => {
    const q = QUESTIONS[i];
    setPhase("answers");
    const lines: Say[] = (["A", "B"] as Side[]).map((s) => ({ who: who(s), text: s === side ? q.real : q.fake, mood: "neutral" }));
    say(lines, () => setPhase("pick"));
  };
  const startQuestion = (i: number) => {
    const side: Side = Math.random() < 0.5 ? "A" : "B";
    setReal(side);
    setQi(i);
    sayAnswers(i, side); // threat sengaja tidak direset
  };

  // ---------- Mimic ketahuan ----------
  const reveal = () => {
    setPhase("reveal");
    let n = 0;
    const id = window.setInterval(() => {
      n += 1;
      setGlitch(n % 2 === 0);
      sfx.locked();
      if (n >= 8) {
        window.clearInterval(id);
        setGlitch(null);
        setAsMimic(true);
        blinkFlash(500);
        sfx.growl();
      }
    }, 110);
    timers.current.push(id);
    later(() => {
      say(REVEAL_MIMIC, () => {
        setVanish(true);
        sfx.whimper();
        later(() => say(REVEAL_LINES, walkOut), 1300);
      });
    }, 1900);
  };
  const walkOut = () => {
    setPhase("exit");
    setWalk(true);
    for (let k = 0; k < 6; k++) later(() => sfx.step(), k * 300);
    later(() => {
      sfx.door();
      blinkFlash(600);
    }, 1900);
    later(() => {
      sfx.win();
      setPhase("end");
    }, 2600);
  };
  const lunge = () => {
    setPhase("lunge");
    setThreat(MAX_STRIKES);
    sfx.growl();
    sfx.hit();
    later(() => {
      setThreat(1); // Mimic mundur, tapi tidak kembali ke 0
      say(LUNGE_LINES.map((l) => ({ ...l, who: l.who ?? who(real) })), () => sayAnswers(qi, real));
    }, 1300);
  };

  const pick = (s: Side) => {
    if (phase !== "pick" || dlg) return;
    if (s === real) {
      sfx.pickup();
      setPhase("feedback");
      const last = qi >= QUESTIONS.length - 1;
      say([{ who: who(real), text: QUESTIONS[qi].sweet, mood: "shy" }], () => {
        if (last) return reveal();
        const taunt = TAUNTS[qi];
        const next = () => startQuestion(qi + 1);
        if (taunt && taunt.length) say(taunt.map((l) => ({ ...l, who: l.who ?? "MIMIC", mood: "mimic" })), next);
        else next();
      });
    } else {
      const t = threat + 1;
      sfx.growl();
      if (t >= MAX_STRIKES) return lunge();
      setThreat(t);
      setFlicker(true);
      later(() => setFlicker(false), 900);
      setPhase("feedback");
      const text = WRONG_LINES[Math.floor(Math.random() * WRONG_LINES.length)];
      say([{ who: who(real), text, mood: "surprised" }], () => setPhase("pick"));
    }
  };

  useEffect(() => {
    ["guide", "mimic-stand", "mimic-lunge"].forEach((n) => (new Image().src = sp(n)));
    ["closed", "half", "wide"].forEach((s) => (new Image().src = asset(`portraits/mimic-${s}.png`)));
    new Image().src = asset("bg/hall.jpg");
    track.play(MIMIC_MUSIC || undefined, 5);
    later(() => {
      setPhase("opening");
      for (let k = 0; k < 5; k++) later(() => sfx.step(), k * 320);
    }, 3000);
    later(() => say(OPENING_1, shadowEvent), 5000);
    return () => {
      timers.current.forEach(clearTimeout);
      track.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const line = dlg ? dlg.lines[dlg.i] : null;
  const canPick = phase === "pick" && !dlg;
  const inQuiz = phase === "answers" || phase === "pick" || phase === "feedback" || phase === "lunge";
  const p = Math.min(threat, STEPS) / STEPS;

  const avatar = (s: Side) => {
    const isFake = s !== real;
    const reveal_ = isFake && phase === "reveal";
    const showMimic = reveal_ && (glitch === true || asMimic);
    const cls = ["mi-av", s === "A" ? "a" : "b"];
    if (canPick) cls.push("is-pick");
    if (reveal_ && glitch !== null) cls.push("glitching");
    if (reveal_ && asMimic) cls.push("is-mimic");
    if (reveal_ && vanish) cls.push("vanish");
    if (!isFake && walk) cls.push("walk");
    if (isFake && walk) return null;
    return (
      <button key={s} className={cls.join(" ")} onClick={() => pick(s)}>
        {phase !== "reveal" && phase !== "exit" && <span className="mi-tag">{who(s)}</span>}
        <img src={sp(showMimic ? "mimic-stand" : "guide")} alt="" draggable={false} />
      </button>
    );
  };

  return (
    <div className={`mi-root ${phase === "reveal" && asMimic && !vanish ? "mi-rumble" : ""}`} style={{ backgroundImage: `url(${asset("bg/hall.jpg")})` }}>
      {shadow && <img className="mi-shadow" src={sp("mimic-stand")} alt="" draggable={false} />}
      {inQuiz && threat >= 1 && threat < MAX_STRIKES && (
        <img className="mi-mimic" style={{ height: `${18 + p * 26}%`, bottom: `${46 - p * 14}%` }} src={sp("mimic-stand")} alt="" draggable={false} />
      )}
      <div className="mi-vig" style={{ opacity: vanish || phase === "exit" ? 0.1 : 0.2 + p * 0.55 }} />
      {flicker && <div className="mi-flicker" />}

      {!showAv && phase !== "title" && <img className="mi-solo" src={sp("guide")} alt="" draggable={false} />}
      {showAv && <>{avatar("A")}{avatar("B")}</>}

      {inQuiz && (
        <>
          <div className="mi-q">
            <small>PERTANYAAN {qi + 1} / {QUESTIONS.length}</small>
            <b>{QUESTIONS[qi].q}</b>
          </div>
          <div className="mi-threat">
            MIMIC {Array.from({ length: STEPS }, (_, k) => <i key={k} className={k < threat ? "on" : ""} />)}
          </div>
        </>
      )}
      {canPick && <div className="mi-hint">KLIK AVATAR YANG ASLI</div>}

      {phase === "lunge" && <img className="mi-lunge" src={sp("mimic-lunge")} alt="" draggable={false} />}
      {phase === "lunge" && <div className="mi-flash" />}
      {flash && <div className="mi-wflash" />}
      {line && <TalkBox line={line} onAdvance={advance} />}

      <div className={`mi-title ${phase === "title" ? "" : "out"}`}>
        <h1>{TITLE}</h1>
        <p>{TITLE_SUB}</p>
      </div>

      {phase === "end" && (
        <div className="m-reward">
          <h2>{REWARD_TITLE}</h2>
          {REWARD_LINES.map((t, k) => <p key={k}>{t}</p>)}
          <button onClick={() => { sfx.click(); onBack(); }}>[ KEMBALI KE LOBBY ▶ ]</button>
        </div>
      )}
    </div>
  );
}
