import { useCallback, useEffect, useRef, useState, type CSSProperties, type PointerEvent as RPointerEvent } from "react";
import "./room1.css";
import { TalkBox } from "./Memories";
import { SPEAKER, type Say } from "./memories-data";
import {
  BANDAGE_BUTTON, BEAR_ATTACK, BEAR_FAR, BEAR_NEAR, HEAL_LINES, HURT_LINES, INTRO, ITEMS_DONE, ITEMS_START,
  LIGHT_HINT, LIGHT_HIT, LIGHT_MS, LIGHT_RADIUS, MEMORIES, RADIO_MUSIC, REWARD_LINES, REWARD_TITLE, ROAR,
  ROOM_MUSIC, SWEET_LINES, TITLE, TITLE_SUB, type Memory,
} from "./room1-data";
import { ambient, sfx, track } from "./sfx";

type Phase =
  | "title" | "enter" | "intro" | "explore" | "radio" | "items" | "exit"
  | "bear" | "light" | "flee" | "hurt" | "healing" | "healed" | "walk" | "end";
type Dlg = { lines: Say[]; i: number; done?: () => void };
type Item = "senter" | "bandages";

const asset = (p: string) => `${import.meta.env.BASE_URL}${p}`;
const sp = (n: string) => asset(`sprites/${n}.png`);
const HP_MAX = 5;
const SEGMENTS = 20;
const DRAIN = 0.6; // cahaya lepas dari beruang: bar turun 60% secepat naiknya
const TICK = 50;

// Gelembung / debu melayang (posisi tetap supaya tidak berubah tiap render)
const BUBBLES = Array.from({ length: 18 }, (_, i) => ({
  left: ((i * 53 + 11) % 96) + 2,
  size: 0.35 + ((i * 7) % 6) * 0.14,
  dur: 10 + ((i * 5) % 9),
  delay: -((i * 3.7) % 14),
  dust: i % 3 === 0,
}));
// Bayangan rumput laut menggantung di bagian atas layar
const KELP = [
  { l: 3, h: 30, w: 3.4, d: 0 }, { l: 14, h: 20, w: 2.6, d: -1.2 }, { l: 33, h: 16, w: 2.2, d: -2.1 },
  { l: 52, h: 24, w: 3, d: -0.6 }, { l: 71, h: 18, w: 2.4, d: -1.7 }, { l: 92, h: 32, w: 3.6, d: -0.9 },
];

function Card({ m }: { m: Memory }) {
  if (m.kind === "stamp") {
    return (
      <div className="r1-card is-stamp">
        <small>{m.label}</small>
        <b className="r1-stamp">{m.big}</b>
        <p>{m.text}</p>
      </div>
    );
  }
  if (m.kind === "chat") {
    return (
      <div className="r1-card is-chat">
        <small>{m.label}</small>
        <div className="r1-dots"><i /><i /><i /></div>
        <div className="r1-chatline"><span>{m.name}</span>{m.text}</div>
      </div>
    );
  }
  return (
    <div className="r1-card is-discord">
      <small>{m.label}</small>
      <div className="r1-dc">
        <div className="r1-dc-av">{(m.name ?? "?").slice(0, 1)}</div>
        <div>
          <div className="r1-dc-name">
            <span className="r1-dc-old">{m.name}</span>
            <span className="r1-dc-new">{m.real}</span>
          </div>
          <p>{m.text}</p>
        </div>
      </div>
    </div>
  );
}

export default function Room1({ onBack, onCleared }: { onBack: () => void; onCleared: () => void }) {
  const [phase, setPhase] = useState<Phase>("title");
  const [dlg, setDlg] = useState<Dlg | null>(null);
  const [lights, setLights] = useState<"off" | "flicker" | "on">("off");
  const [card, setCard] = useState<number | null>(null);
  const [hearts, setHearts] = useState(false);
  const [got, setGot] = useState<Item[]>([]);
  const [doorOpen, setDoorOpen] = useState(false);
  const [bearStage, setBearStage] = useState(0); // 0 belum ada, 1 siluet jauh, 2 mendekat, 3 sangat dekat, 4 menyerang
  const [roar, setRoar] = useState(false);
  const [shake, setShake] = useState(false);
  const [flash, setFlash] = useState<null | "white" | "red">(null);
  const [hp, setHp] = useState(HP_MAX);
  const [prog, setProg] = useState(0);
  const [lit, setLit] = useState(false);
  const [walk, setWalk] = useState(false);

  const timers = useRef<number[]>([]);
  const rootRef = useRef<HTMLDivElement>(null);
  const bearRef = useRef<HTMLImageElement>(null);
  const ptr = useRef<{ x: number; y: number } | null>(null);
  const progRef = useRef(0);
  const cb = useRef({ onBack, onCleared });
  useEffect(() => {
    cb.current = { onBack, onCleared };
  });

  const later = useCallback((fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms));
  }, []);
  const say = useCallback((lines: Say[], done?: () => void) => setDlg({ lines, i: 0, done }), []);
  const advance = () => {
    if (!dlg) return;
    if (dlg.i < dlg.lines.length - 1) return setDlg({ ...dlg, i: dlg.i + 1 });
    const done = dlg.done;
    setDlg(null);
    done?.();
  };
  const doShake = useCallback((ms: number) => {
    setShake(true);
    later(() => setShake(false), ms);
  }, [later]);
  const doFlash = useCallback((c: "white" | "red", ms: number) => {
    setFlash(c);
    later(() => setFlash(null), ms);
  }, [later]);

  // ---------- Pembukaan sinematik ----------
  useEffect(() => {
    ["guide", "protect", "hurt", "bear-attack", "bear-flee"].forEach((n) => (new Image().src = sp(n)));
    ["bg/room.png", "items/radio.png", "items/senter.png", "items/bandages.png"].forEach((p) => (new Image().src = asset(p)));
    ["neutral", "happy", "shy", "surprised"].forEach((m) =>
      ["closed", "half", "wide"].forEach((s) => (new Image().src = asset(`portraits/${m}-${s}.png`))),
    );
    track.play(ROOM_MUSIC || undefined, 6);
    ambient.start();
    later(() => {
      setPhase("enter");
      for (let k = 0; k < 5; k++) later(() => sfx.step(), k * 340);
    }, 3000);
    later(() => {
      setLights("flicker");
      [0, 260, 620, 900, 1150].forEach((d) => later(() => sfx.zap(), d));
    }, 5000);
    later(() => setLights("on"), 6500);
    later(() => {
      setPhase("intro");
      say(INTRO, () => setPhase("explore"));
    }, 6900);
    return () => {
      timers.current.forEach(clearTimeout);
      timers.current = [];
      track.stop();
      ambient.stop();
    };
  }, [later, say]);

  // ---------- Radio: kenangan satu per satu ----------
  const sweet = () => {
    setHearts(true);
    say(SWEET_LINES, () => {
      setHearts(false);
      setPhase("items");
      say(ITEMS_START);
    });
  };
  const playMemory = (i: number) => {
    if (i >= MEMORIES.length) return sweet();
    setCard(i);
    sfx.pop();
    later(() => {
      say(MEMORIES[i].says, () => {
        setCard(null);
        later(() => playMemory(i + 1), 450);
      });
    }, 1300);
  };
  const clickRadio = () => {
    if (phase !== "explore" || dlg) return;
    sfx.click();
    setPhase("radio");
    track.play(RADIO_MUSIC || undefined, 2);
    later(() => playMemory(0), 900);
  };

  // ---------- Barang ----------
  const collect = (n: Item) => {
    if (phase !== "items" || dlg || got.includes(n)) return;
    sfx.pickup();
    setGot((g) => [...g, n]);
  };
  useEffect(() => {
    if (phase === "items" && got.length === 2) say(ITEMS_DONE, () => setPhase("exit"));
  }, [got, phase, say]);

  // ---------- Beruang: bertahap ----------
  const startLight = () => {
    progRef.current = 0;
    setProg(0);
    setLit(false);
    setPhase("light");
  };
  const attack = () => {
    setBearStage(4);
    setRoar(true);
    sfx.growl();
    sfx.hit();
    doShake(900);
    doFlash("red", 500);
    later(() => setRoar(false), 1300);
    later(() => say(BEAR_ATTACK, startLight), 1000);
  };
  const clickExit = () => {
    if (phase !== "exit" || dlg) return;
    sfx.door();
    track.stop();
    ambient.stop();
    setDoorOpen(true);
    setPhase("bear");
    later(() => {
      setBearStage(1);
      sfx.growl();
      doShake(600);
    }, 900);
    later(() => {
      say(BEAR_FAR, () => {
        setBearStage(2);
        sfx.growl();
        doShake(700);
        later(() => {
          say(BEAR_NEAR, () => {
            setBearStage(3);
            sfx.growl();
            doShake(900);
            later(attack, 1200);
          });
        }, 1400);
      });
    }, 2000);
  };

  // ---------- Mini-game senter: beruang bergerak, cahaya harus mengikuti ----------
  useEffect(() => {
    if (phase !== "light") return;
    let tick = 0;
    const id = window.setInterval(() => {
      const root = rootRef.current;
      const bear = bearRef.current;
      const p = ptr.current;
      let on = false;
      if (root && bear && p) {
        const em = root.getBoundingClientRect().width / 80; // lebar stage = 80em
        const b = bear.getBoundingClientRect();
        // hitbox dikecilkan 15% tiap sisi supaya tidak terlalu mudah
        const l = b.left + b.width * 0.15, r = b.right - b.width * 0.15;
        const t = b.top + b.height * 0.15, bt = b.bottom - b.height * 0.15;
        const dx = Math.max(l - p.x, 0, p.x - r);
        const dy = Math.max(t - p.y, 0, p.y - bt);
        on = Math.hypot(dx, dy) <= LIGHT_RADIUS * em;
      }
      setLit(on);
      progRef.current = Math.max(0, Math.min(LIGHT_MS, progRef.current + (on ? TICK : -TICK * DRAIN)));
      setProg((progRef.current / LIGHT_MS) * 100);
      if (on && tick++ % 5 === 0) sfx.zap();
      if (progRef.current >= LIGHT_MS) {
        window.clearInterval(id);
        setLit(false);
        setPhase("flee");
      }
    }, TICK);
    return () => window.clearInterval(id);
  }, [phase]);

  // ---------- Beruang kabur, BARU SETELAH ITU avatar terlihat terluka ----------
  useEffect(() => {
    if (phase !== "flee") return;
    sfx.whimper();
    const t = window.setTimeout(() => {
      setPhase("hurt");
      setHp(1);
      sfx.hit();
      doShake(700);
      doFlash("red", 500);
      say(HURT_LINES);
    }, 1500);
    return () => window.clearTimeout(t);
  }, [phase, say, doShake, doFlash]);

  // ---------- Perawatan ----------
  const walkOut = () => {
    setPhase("walk");
    setWalk(true);
    for (let k = 0; k < 6; k++) later(() => sfx.step(), k * 320);
    later(() => {
      sfx.door();
      doFlash("white", 650);
    }, 1900);
    later(() => {
      sfx.win();
      setPhase("end");
      cb.current.onCleared();
    }, 2700);
  };
  const applyBandage = () => {
    if (phase !== "hurt" || dlg) return;
    sfx.pickup();
    setPhase("healing");
    track.play(undefined, 6);
    ambient.start();
    for (let k = 0; k < 5; k++) later(() => sfx.wrap(), 700 + k * 330);
    for (let k = 0; k < HP_MAX - 1; k++) {
      later(() => {
        setHp((h) => Math.min(HP_MAX, h + 1));
        sfx.heal(k);
      }, 2300 + k * 380);
    }
    later(() => {
      setPhase("healed");
      doFlash("white", 350);
      say(HEAL_LINES, walkOut);
    }, 4200);
  };

  const pose =
    phase === "hurt" || phase === "healing" ? "hurt"
    : bearStage >= 4 && (phase === "bear" || phase === "light" || phase === "flee") ? "protect"
    : "guide";
  const showBear = bearStage > 0 && (phase === "bear" || phase === "light" || phase === "flee");
  const line = dlg ? dlg.lines[dlg.i] : null;
  const hot = (on: boolean) => (on && !dlg ? "r1-hot" : "");
  const hudOn = phase !== "title" && phase !== "enter";
  const bagHas = (n: Item) => got.includes(n) && !(n === "bandages" && ["healing", "healed", "walk", "end"].includes(phase));

  const onMove = (e: RPointerEvent) => {
    const r = rootRef.current;
    if (!r) return;
    const b = r.getBoundingClientRect();
    ptr.current = { x: e.clientX, y: e.clientY };
    r.style.setProperty("--lx", `${e.clientX - b.left}px`);
    r.style.setProperty("--ly", `${e.clientY - b.top}px`);
  };

  return (
    <div
      ref={rootRef}
      className={`r1-root ${shake ? "r1-rumble" : ""} ${phase === "light" ? "is-dark" : ""}`}
      onPointerMove={onMove}
    >
      <div className={`r1-world ${walk ? "push" : ""}`}>
        <div className="r1-bg" style={{ backgroundImage: `url(${asset("bg/room.png")})` }} />
        <div className="r1-beams"><i /><i /><i /></div>
        <div className="r1-kelp">
          {KELP.map((k, n) => (
            <i key={n} style={{ left: `${k.l}%`, height: `${k.h}%`, width: `${k.w}%`, animationDelay: `${k.d}s` }} />
          ))}
        </div>
        <div className="r1-bubbles">
          {BUBBLES.map((b, n) => (
            <i
              key={n}
              className={b.dust ? "dust" : ""}
              style={{ left: `${b.left}%`, width: `${b.size}em`, height: `${b.size}em`, animationDuration: `${b.dur}s`, animationDelay: `${b.delay}s` }}
            />
          ))}
        </div>

        <div className={`r1-doorglow ${doorOpen ? "on" : ""}`} />
        <button className={`r1-item r1-radio ${phase === "radio" ? "on" : ""} ${hot(phase === "explore")}`} disabled={phase !== "explore"} onClick={clickRadio}>
          {phase === "radio" && <span className="r1-waves"><b /><b /><b /></span>}
          <img src={asset("items/radio.png")} alt="" draggable={false} />
          <small>RADIO</small>
        </button>
        {!got.includes("senter") && (
          <button className={`r1-item r1-senter ${hot(phase === "items")}`} disabled={phase !== "items"} onClick={() => collect("senter")}>
            <img src={asset("items/senter.png")} alt="" draggable={false} /><small>SENTER</small>
          </button>
        )}
        {!got.includes("bandages") && (
          <button className={`r1-item r1-bandages ${hot(phase === "items")}`} disabled={phase !== "items"} onClick={() => collect("bandages")}>
            <img src={asset("items/bandages.png")} alt="" draggable={false} /><small>BANDAGES</small>
          </button>
        )}
        <button className={`r1-exit ${hot(phase === "exit")}`} disabled={phase !== "exit"} onClick={clickExit} aria-label="Pintu keluar" />

        {showBear && (
          <div className={`r1-bear s${bearStage} ${phase === "light" || phase === "flee" ? "prowl" : ""} ${phase === "flee" ? "fled" : ""}`}>
            <img
              ref={bearRef}
              className={`${lit ? "is-lit" : ""} ${phase === "flee" ? "is-flee" : ""}`}
              src={sp(phase === "flee" ? "bear-flee" : "bear-attack")}
              alt=""
              draggable={false}
            />
          </div>
        )}

        {phase !== "title" && (
          <div
            key={pose}
            className={`r1-av pose-${pose} ${phase === "enter" ? "enter" : ""} ${phase === "healed" ? "healed" : ""} ${walk ? "walk" : ""}`}
          >
            <img src={sp(pose)} alt="" draggable={false} />
            {pose === "protect" && <span className="r1-speed"><i /><i /><i /></span>}
            {phase === "healing" && <i className="r1-strip" />}
            {phase === "healing" && (
              <span className="r1-pluses"><b>+</b><b>+</b><b>+</b><b>+</b></span>
            )}
          </div>
        )}
        {phase === "healing" && <img className="r1-roll" src={asset("items/bandages.png")} alt="" draggable={false} />}

        {phase === "light" && <div className="r1-dark" />}
      </div>

      <div className="r1-vig" />
      <div className={`r1-lights ${lights}`} />

      {hudOn && (
        <div className="r1-hud">
          <span className="r1-hud-name">{SPEAKER}</span>
          <div className={`r1-hp ${hp <= 1 ? "low" : ""}`}>
            <em>HP</em>
            {Array.from({ length: HP_MAX }, (_, k) => <i key={k} className={k < hp ? "on" : ""} />)}
          </div>
          <div className="r1-bag">
            <em>TAS</em>
            {(["senter", "bandages"] as Item[]).map((n) => (
              <span key={n} className={bagHas(n) ? "on" : ""}>{bagHas(n) && <img src={asset(`items/${n}.png`)} alt="" draggable={false} />}</span>
            ))}
          </div>
        </div>
      )}

      {card !== null && <div className="r1-cardwrap" key={`c${card}`}><Card m={MEMORIES[card]} /></div>}
      {hearts && <div className="r1-hearts">{[0, 1, 2, 3, 4, 5, 6].map((k) => <i key={k} style={{ "--k": k } as CSSProperties}>♥</i>)}</div>}

      {phase === "light" && (
        <div className="r1-meter">
          <span className={lit ? "hit" : ""}>{lit ? LIGHT_HIT : LIGHT_HINT}</span>
          <div>{Array.from({ length: SEGMENTS }, (_, k) => <i key={k} className={k < (prog / 100) * SEGMENTS ? "on" : ""} />)}</div>
        </div>
      )}
      {roar && <div className="r1-roar">{ROAR}</div>}
      {flash && <div className={`r1-flash ${flash}`} />}
      {phase === "hurt" && !dlg && (
        <button className="r1-bandage-btn r1-hot" onClick={applyBandage}>🩹 {BANDAGE_BUTTON}</button>
      )}

      {line && <TalkBox line={line} onAdvance={advance} />}

      <div className={`r1-title ${phase === "title" ? "" : "out"}`}>
        <h1>{TITLE}</h1>
        <p>{TITLE_SUB}</p>
      </div>

      {phase === "end" && (
        <div className="r1-reward">
          <h2>{REWARD_TITLE}</h2>
          {REWARD_LINES.map((t, k) => <p key={k}>{t}</p>)}
          <button onClick={() => { sfx.click(); cb.current.onBack(); }}>[ KEMBALI KE LOBBY ▶ ]</button>
        </div>
      )}
    </div>
  );
}
