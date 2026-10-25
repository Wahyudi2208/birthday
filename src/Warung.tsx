import { useEffect, useRef, useState } from "react";
import "./warung.css";
import { spawnBits } from "./fx";
import { TalkBox } from "./Memories";
import type { Say } from "./memories-data";
import { sfx } from "./sfx";
import {
  BITES, BUBBLE_COOL, BUBBLE_SPICY, COOK_SAYS, DONE_SAYS, INGREDIENTS, INTRO_SAYS, REWARD_TEXT, RUBY_H, SAMBAL, SERVE_SAYS, SPICY_AT,
} from "./warung-data";

/* ------------------------------------------------------------------ *
 *  Warung.tsx = pesan ketoprak -> abang masak -> Ruby makan -> bonus tiket gacha.
 *  Teks, pilihan, dan aturan ada di warung-data.ts.
 * ------------------------------------------------------------------ */
const asset = (p: string) => `${import.meta.env.BASE_URL}${p}`;

type Phase = "intro" | "order" | "cook" | "serve" | "eat" | "spicy" | "done";
type Pose = "idle" | "wait" | "scoop" | "spicy" | "drink" | "full";
type Dlg = { lines: Say[]; i: number; done?: () => void };
const PRELOAD = [
  "bg/warung.png", "sprites/abang-idle.png", "sprites/abang-grind.png", "sprites/abang-serve.png", "sprites/ruby-idle.png",
  "sprites/ruby-eat-wait.png", "sprites/ruby-eat-scoop.png", "sprites/ruby-eat-spicy.png", "sprites/ruby-eat-drink.png",
  "sprites/ruby-eat-full.png", "items/kt-esteh.png", ...INGREDIENTS.map((i) => i.icon),
];

export default function Warung({ onDone }: { onDone: (bonus: boolean) => void }) {
  const [phase, setPhaseS] = useState<Phase>("intro");
  const [dlg, setDlg] = useState<Dlg | null>(null);
  const [sambal, setSambal] = useState(1);
  const [picks, setPicks] = useState<string[]>(INGREDIENTS.map((i) => i.id));
  const [pose, setPose] = useState<Pose>("idle");
  const [abang, setAbang] = useState<"idle" | "grind" | "serve">("idle");
  const [bites, setBites] = useState(0);
  const [heat, setHeat] = useState(0);
  const [chewing, setChewing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [bubble, setBubble] = useState<string | null>(null);
  const [reward, setReward] = useState(false);

  const phaseRef = useRef<Phase>("intro");
  const bitesRef = useRef(0);
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
    PRELOAD.forEach((p) => (new Image().src = asset(p)));
    later(() => say(INTRO_SAYS, () => setPhase("order")), 800);
    return () => {
      timers.current.forEach(clearTimeout);
      timers.current = [];
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---------- Pesan dan masak ---------- */
  const toggle = (id: string) => setPicks((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  const order = () => {
    if (phaseRef.current !== "order" || picks.length === 0) return;
    sfx.click();
    setPhase("cook");
    const skipped = INGREDIENTS.filter((i) => !picks.includes(i.id)).map((i) => i.label.toLowerCase());
    const lines: Say[] = [{ text: SAMBAL[sambal].line, mood: sambal === 3 ? "surprised" : "happy" }];
    if (skipped.length) lines.push({ text: `Tanpa ${skipped.join(" dan ")}, noted.`, mood: "neutral" });
    say([...lines, ...COOK_SAYS], startCook);
  };
  const startCook = () => {
    setAbang("grind");
    sfx.zap();
    later(() => sfx.zap(), 350);
    later(() => sfx.zap(), 700);
    later(() => sfx.zap(), 1050);
    later(() => {
      setAbang("serve");
      setPose("wait");
      setPhase("serve");
      sfx.pop();
      spawnBits(fxRef.current, 40, 55, 8, "spark");
      say(SERVE_SAYS, () => {
        setAbang("idle");
        setPhase("eat");
      });
    }, 1700);
  };

  /* ---------- Makan ---------- */
  const finish = () => {
    setPose("full");
    setPhase("done");
    setBusy(true);
    setHeat(0);
    sfx.win();
    for (let k = 0; k < 3; k++) later(() => spawnBits(fxRef.current, 25 + Math.random() * 30, 40, 12, "burst"), k * 250);
    later(
      () =>
        say(DONE_SAYS, () => {
          setReward(true);
          sfx.win();
          spawnBits(fxRef.current, 50, 45, 20, "burst");
          later(() => onDone(true), 2400);
        }),
      1000,
    );
  };

  const bite = () => {
    if (phaseRef.current !== "eat" || busy || dlg) return;
    setBusy(true);
    setPose("scoop");
    sfx.pop();
    later(() => {
      setPose("wait");
      setChewing(true);
      sfx.click();
      later(() => {
        setChewing(false);
        const n = bitesRef.current + 1;
        bitesRef.current = n;
        setBites(n);
        spawnBits(fxRef.current, 27, 38, 4, "spark");
        if (n >= BITES) return finish();
        if (SPICY_AT[sambal]?.includes(n)) {
          setPhase("spicy");
          setPose("spicy");
          setHeat(100);
          setBubble(BUBBLE_SPICY);
          sfx.zap();
        } else {
          setHeat((h) => Math.min(85, h + sambal * 14));
        }
        setBusy(false);
      }, 650);
    }, 500);
  };

  const drink = () => {
    if (phaseRef.current !== "spicy" || busy) return;
    setBusy(true);
    setPose("drink");
    setBubble(null);
    sfx.wrap();
    later(() => {
      setPose("wait");
      setHeat(0);
      setPhase("eat");
      setBusy(false);
      setBubble(BUBBLE_COOL);
      later(() => setBubble(null), 1600);
    }, 1700);
  };

  const line = dlg ? dlg.lines[dlg.i] : null;
  const ruby = pose === "idle" ? "sprites/ruby-idle.png" : `sprites/ruby-eat-${pose}.png`;
  const eating = phase === "eat" || phase === "spicy";

  return (
    <div className="wr-root">
      <div className="wr-bg" style={{ backgroundImage: `url(${asset("bg/warung.png")})` }} />

      <div className="wr-abang">
        <img className={abang === "grind" ? "bob" : ""} src={asset(`sprites/abang-${abang}.png`)} alt="" draggable={false} />
      </div>
      <div className="wr-ruby" style={{ height: `${RUBY_H[pose]}%` }}>
        <img className={`${chewing ? "chew" : ""} ${pose === "spicy" ? "shiver" : ""}`} src={asset(ruby)} alt="" draggable={false} />
      </div>
      {bubble && <div className="wr-bubble">{bubble}</div>}

      {phase === "order" && !dlg && (
        <div className="wr-order">
          <h3>PESAN KETOPRAK</h3>
          <div className="wr-row">
            <small>SAMBAL</small>
            {SAMBAL.map((s, i) => (
              <button key={s.label} className={sambal === i ? "on" : ""} onClick={() => { sfx.click(); setSambal(i); }}>
                {s.label}
                <i>{s.sub}</i>
              </button>
            ))}
          </div>
          <div className="wr-row">
            <small>ISIAN</small>
            {INGREDIENTS.map((g) => (
              <button key={g.id} className={`ing ${picks.includes(g.id) ? "on" : ""}`} onClick={() => { sfx.click(); toggle(g.id); }}>
                <img src={asset(g.icon)} alt="" draggable={false} />
                {g.label}
              </button>
            ))}
          </div>
          <button className="wr-go" onClick={order} disabled={picks.length === 0}>
            {picks.length === 0 ? "PILIH MINIMAL 1 ISIAN" : "PESAN ▶"}
          </button>
        </div>
      )}

      {eating && (
        <div className="wr-hud">
          <span>KENYANG<i><u style={{ width: `${(bites / BITES) * 100}%` }} /></i></span>
          {sambal > 0 && <span className="hot">PEDAS<i><u style={{ width: `${heat}%` }} /></i></span>}
        </div>
      )}
      {phase === "eat" && !dlg && (
        <button className="wr-bite" onClick={bite} disabled={busy}>SUAP ▶</button>
      )}
      {phase === "spicy" && !dlg && (
        <button className="wr-teh" onClick={drink} disabled={busy}>
          <img src={asset("items/kt-esteh.png")} alt="" draggable={false} />
          <span>ES TEH!</span>
        </button>
      )}

      {reward && <div className="wr-reward">{REWARD_TEXT}</div>}
      <div className="wr-fx" ref={fxRef} />
      {line && <TalkBox line={line} onAdvance={advance} />}
    </div>
  );
}
