import { useEffect, useRef, useState, type CSSProperties, type PointerEvent as RPointerEvent } from "react";
import "./lobby.css";
import Mascot, { walkTime } from "./Mascot";
import { spawnBits } from "./fx";
import { DOORS, DOOR_TEASE, POKE_LINES } from "./lobby-data";
import { sfx } from "./sfx";

const asset = (p: string) => `${import.meta.env.BASE_URL}${p}`;
const pick = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)];

// Posisi pintu di lobby (persen dari gambar bg/lobby.png). Ikut gambar, jangan diubah kecuali gambarnya diganti.
const LOBBY_DOORS = [
  { n: 1 as const, l: 33.5, t: 42.1, w: 10.2, h: 38.8 },
  { n: 2 as const, l: 56.8, t: 40.2, w: 10.6, h: 40.7 },
];
const IMG_H = 16 / 9 / (1024 / 423); // tinggi gambar lobby sebagai pecahan tinggi layar
const IDLE_X = 24;
const centerX = (d: (typeof LOBBY_DOORS)[number]) => d.l + d.w / 2;
const originY = (d: (typeof LOBBY_DOORS)[number]) => 50 + (d.t + d.h / 2 - 50) * IMG_H;
const MOTES = Array.from({ length: 16 }, (_, i) => ({
  left: ((i * 41 + 9) % 94) + 3,
  size: 0.25 + ((i * 3) % 4) * 0.1,
  dur: 11 + ((i * 5) % 9),
  delay: -((i * 3.3) % 15),
}));

type Props = {
  door2Open: boolean;
  cleared: boolean;
  cleared2: boolean;
  talking: boolean;
  entering: 1 | 2 | null; // diisi Game saat dialog masuk selesai: memicu zoom ke pintu
  pose: string;
  onDoor: (n: 1 | 2) => void;
  onHome: () => void;
};

export default function Lobby({ door2Open, cleared, cleared2, talking, entering, pose, onDoor, onHome }: Props) {
  const [hover, setHover] = useState<1 | 2 | null>(null);
  const [shake, setShake] = useState<1 | 2 | null>(null);
  const [tease, setTease] = useState<string | null>(null);
  const [mx, setMx] = useState(IDLE_X);
  const [busy, setBusy] = useState(false);

  const rootRef = useRef<HTMLDivElement>(null);
  const parRef = useRef<HTMLDivElement>(null);
  const fxRef = useRef<HTMLDivElement>(null);
  const timers = useRef<number[]>([]);
  const mxRef = useRef(IDLE_X);
  const hoverRef = useRef<1 | 2 | null>(null);
  const lastSpark = useRef(0);
  const cb = useRef({ onDoor, onHome });
  useEffect(() => {
    cb.current = { onDoor, onHome };
  });
  const later = (fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms));
  };
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  const go = (x: number) => {
    mxRef.current = x;
    setMx(x);
  };

  const active = !talking && !busy && entering === null;
  const isOpen = (n: 1 | 2) => n === 1 || door2Open;
  const isDone = (n: 1 | 2) => (n === 1 ? cleared : cleared2);
  const rooms = (cleared ? 1 : 0) + (cleared2 ? 1 : 0);

  // zoom masuk ke pintu + maskot ikut masuk
  useEffect(() => {
    if (entering === null) return;
    const d = LOBBY_DOORS[entering - 1];
    sfx.swoosh();
    go(centerX(d));
  }, [entering]);

  const enter = (n: 1 | 2) => {
    if (!active) return;
    sfx.hover();
    hoverRef.current = n;
    setHover(n);
    if (isOpen(n)) go(centerX(LOBBY_DOORS[n - 1]) - 8);
  };
  const leave = () => {
    hoverRef.current = null;
    setHover(null);
    later(() => {
      if (hoverRef.current === null && mxRef.current !== IDLE_X) go(IDLE_X);
    }, 900);
  };
  const press = (n: 1 | 2) => {
    if (!active) return;
    if (!isOpen(n)) {
      sfx.rattle();
      setShake(n);
      later(() => setShake(null), 600);
      setTease(pick(DOOR_TEASE));
      later(() => setTease(null), 2600);
      return;
    }
    const target = centerX(LOBBY_DOORS[n - 1]) - 8;
    sfx.click();
    setBusy(true);
    const wait = mxRef.current === target ? 0 : walkTime(mxRef.current, target) * 1000;
    go(target);
    later(() => cb.current.onDoor(n), wait + 150);
  };
  const home = () => {
    if (!active) return;
    sfx.click();
    cb.current.onHome();
  };

  const onMove = (e: RPointerEvent) => {
    const r = rootRef.current?.getBoundingClientRect();
    if (!r || !r.width) return;
    // parallax halus: latar bergeser berlawanan arah kursor
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    parRef.current?.style.setProperty("--px", `${(-px * 1.4).toFixed(2)}em`);
    parRef.current?.style.setProperty("--py", `${(-py * 0.9).toFixed(2)}em`);
    const now = performance.now();
    if (now - lastSpark.current < 70) return;
    lastSpark.current = now;
    spawnBits(fxRef.current, ((e.clientX - r.left) / r.width) * 100, ((e.clientY - r.top) / r.height) * 100, 1, "spark");
  };

  const zoomD = entering ? LOBBY_DOORS[entering - 1] : null;

  return (
    <div
      ref={rootRef}
      className={`g-scene hl-lobby hl-cursor ${entering ? "is-entering" : ""}`}
      style={{ backgroundColor: "#0b0708" }}
      onPointerMove={onMove}
    >
      <div
        className="hl-zoom"
        style={zoomD ? ({ "--zx": `${centerX(zoomD)}%`, "--zy": `${originY(zoomD)}%` } as CSSProperties) : undefined}
      >
        <div className="hl-par" ref={parRef}>
          <div className="hl-lobbyimg" style={{ backgroundImage: `url(${asset("bg/lobby.png")})` }}>
            <div className="hl-flicker" />
            {LOBBY_DOORS.map((d) => {
              const open = isOpen(d.n);
              const meta = open ? DOORS[d.n] : DOORS.locked;
              const done = isDone(d.n);
              return (
                <button
                  key={d.n}
                  className={`hl-door ${open ? "is-open" : "is-locked"} ${done ? "is-done" : ""} ${hover === d.n && active ? "is-hover" : ""} ${shake === d.n ? "is-shake" : ""} ${entering === d.n ? "is-opening" : ""} ${active && open ? "is-ready" : ""}`}
                  style={{ left: `${d.l}%`, top: `${d.t}%`, width: `${d.w}%`, height: `${d.h}%` }}
                  onClick={() => press(d.n)}
                  onPointerEnter={() => enter(d.n)}
                  onPointerLeave={leave}
                  aria-label={meta.name}
                >
                  <i className="hl-spill" />
                  {!open && (
                    <>
                      <i className="hl-chain a" />
                      <i className="hl-chain b" />
                      <i className="hl-lock" />
                    </>
                  )}
                  <span className="hl-sign">
                    <b className="hl-num">{d.n}</b>
                    <span className="hl-sname">{meta.name}</span>
                    <span className={`hl-stat ${!open ? "lock" : done ? "ok" : "go"}`}>{!open ? "🔒 TERKUNCI" : done ? "✓ SELESAI" : "▶ MASUK"}</span>
                    <span className="hl-hint">{meta.hint}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="hl-motes">
        {MOTES.map((m, n) => (
          <i key={n} style={{ left: `${m.left}%`, width: `${m.size}em`, height: `${m.size}em`, animationDuration: `${m.dur}s`, animationDelay: `${m.delay}s` }} />
        ))}
      </div>

      <div className="hl-neon"><span>ROBLOX</span> LOBBY</div>
      <div className="hl-hud">
        <button className="hl-back" onClick={home} disabled={!active}>◀ HOME</button>
        <span className="hl-chip">PLAYERS 2/2</span>
        <span className="hl-chip">RUANGAN {rooms}/2</span>
      </div>

      <Mascot
        x={mx}
        bottom={21}
        height={28}
        pose={pose}
        bubble={tease}
        away={entering !== null}
        canPoke={active}
        onPoke={() => {
          setTease(pick(POKE_LINES));
          later(() => setTease(null), 2200);
        }}
      />
      <div className="hl-fx" ref={fxRef} />
      <div className="hl-join" />
      {entering && <div className="hl-whiteout" />}
    </div>
  );
}
