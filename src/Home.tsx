import { useEffect, useRef, useState, type CSSProperties, type MouseEvent as RMouseEvent, type PointerEvent as RPointerEvent } from "react";
import "./lobby.css";
import Mascot from "./Mascot";
import { spawnBits } from "./fx";
import { APPS, APP_TEASE, BALLOON_EASTER, BOOT_SUB, BOOT_TITLE, DISCORD_TEASE, HOME_BANNER, POKE_LINES } from "./lobby-data";
import { sfx } from "./sfx";

export type AppId = "roblox" | "discord" | "tiktok";
const asset = (p: string) => `${import.meta.env.BASE_URL}${p}`;
const pick = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)];

const APP_LIST: { id: AppId; icon: string }[] = [
  { id: "roblox", icon: "items/app-roblox.png" },
  { id: "discord", icon: "items/app-discord.png" },
  { id: "tiktok", icon: "items/app-tiktok.png" },
];
const LAUNCH_LABEL: Record<AppId, string> = { roblox: "ROBLOX", discord: "DISCORD", tiktok: "TIKTOK" };

// Konfeti jatuh pelan dan balon yang naik (posisi tetap supaya tidak berubah tiap render)
const CONFETTI = Array.from({ length: 22 }, (_, i) => ({
  left: ((i * 47 + 5) % 96) + 2,
  size: 0.4 + ((i * 5) % 4) * 0.12,
  dur: 9 + ((i * 7) % 8),
  delay: -((i * 2.9) % 14),
  c: ["#ff6f8f", "#f2c66f", "#7ec8ff", "#7dff9c", "#c07bff"][i % 5],
}));
const BALLOONS = [
  { left: 7, dur: 17, delay: 0, c: "#ff6f8f" },
  { left: 21, dur: 21, delay: -7, c: "#7ec8ff" },
  { left: 37, dur: 16, delay: -3, c: "#f2c66f" },
  { left: 63, dur: 19, delay: -10, c: "#7dff9c" },
  { left: 79, dur: 18, delay: -13, c: "#c07bff" },
  { left: 91, dur: 22, delay: -5, c: "#ff9a5a" },
];
const IDLE_X = 28;

type Props = {
  intro: boolean; // tampilkan layar pembuka (hanya pertama kali)
  ready: boolean; // dialog pembuka sudah selesai
  talking: boolean; // sedang ada dialog
  rooms: number; // jumlah ruangan Roblox yang selesai (0 sampai 2)
  tiktokOpen: boolean;
  tiktokSeen: boolean;
  discordOpen: boolean; // terbuka setelah ruangan 1 dan 2 selesai
  discordDone: boolean;
  onIntroDone: () => void;
  onOpen: (app: AppId) => void;
};

export default function Home({ intro, ready, talking, rooms, tiktokOpen, tiktokSeen, discordOpen, discordDone, onIntroDone, onOpen }: Props) {
  const [boot, setBoot] = useState(intro);
  const [hover, setHover] = useState<AppId | null>(null);
  const [shake, setShake] = useState<AppId | null>(null);
  const [tease, setTease] = useState<string | null>(null);
  const [mx, setMx] = useState(IDLE_X);
  const [launch, setLaunch] = useState<{ id: AppId; x: number; y: number } | null>(null);
  const [popped, setPopped] = useState<number[]>([]);

  const rootRef = useRef<HTMLDivElement>(null);
  const fxRef = useRef<HTMLDivElement>(null);
  const tiles = useRef<Partial<Record<AppId, HTMLButtonElement | null>>>({});
  const timers = useRef<number[]>([]);
  const pops = useRef(0);
  const hoverRef = useRef<AppId | null>(null);
  const lastSpark = useRef(0);
  const bootDone = useRef(false);
  const cb = useRef({ onIntroDone, onOpen });
  useEffect(() => {
    cb.current = { onIntroDone, onOpen };
  });
  const later = (fn: () => void, ms: number) => {
    const id = window.setTimeout(fn, ms);
    timers.current.push(id);
    return id;
  };
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const finishBoot = () => {
    if (bootDone.current) return;
    bootDone.current = true;
    setBoot(false);
    cb.current.onIntroDone();
  };
  useEffect(() => {
    if (!intro) return;
    const t = window.setTimeout(finishBoot, 2300);
    return () => window.clearTimeout(t);
  }, [intro]);

  const active = ready && !talking && !launch && !boot;
  const pct = (el: Element | null) => {
    const root = rootRef.current?.getBoundingClientRect();
    if (!el || !root || !root.width) return { x: 50, y: 50 };
    const r = el.getBoundingClientRect();
    return { x: ((r.left + r.width / 2 - root.left) / root.width) * 100, y: ((r.top + r.height / 2 - root.top) / root.height) * 100 };
  };

  const status = (id: AppId) => {
    if (id === "roblox") return { locked: false, done: rooms >= 2, badge: rooms >= 2 ? "✓" : "!", sub: `${rooms}/2 RUANGAN` };
    if (id === "discord") {
      if (!discordOpen) return { locked: true, done: false, badge: "🔒", sub: "TERKUNCI" };
      return { locked: false, done: discordDone, badge: discordDone ? "✓" : "NEW", sub: discordDone ? "SELESAI" : "BARU" };
    }
    if (!tiktokOpen) return { locked: true, done: false, badge: "🔒", sub: "TERKUNCI" };
    return { locked: false, done: tiktokSeen, badge: tiktokSeen ? "✓" : "NEW", sub: tiktokSeen ? "DILIHAT" : "BARU" };
  };
  const hintFor = (id: AppId) => {
    if (id === "tiktok" && !tiktokOpen) return APPS.tiktokLocked;
    if (id === "discord" && !discordOpen) return APPS.discordLocked;
    return APPS[id].hint;
  };

  const enter = (id: AppId) => {
    if (!active) return;
    sfx.hover();
    hoverRef.current = id;
    setHover(id);
    setMx(pct(tiles.current[id] ?? null).x);
  };
  const leave = (e: RPointerEvent<HTMLButtonElement>) => {
    hoverRef.current = null;
    setHover(null);
    e.currentTarget.style.setProperty("--rx", "0deg");
    e.currentTarget.style.setProperty("--ry", "0deg");
    later(() => {
      if (hoverRef.current === null) setMx(IDLE_X); // kembali ke posisi diam kalau kursor tidak di app lain
    }, 900);
  };
  const tilt = (e: RPointerEvent<HTMLButtonElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    if (!r.width) return;
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    e.currentTarget.style.setProperty("--ry", `${(px * 22).toFixed(1)}deg`);
    e.currentTarget.style.setProperty("--rx", `${(-py * 22).toFixed(1)}deg`);
  };
  const press = (id: AppId) => {
    if (!active) return;
    const st = status(id);
    if (st.locked) {
      sfx.rattle();
      setShake(id);
      later(() => setShake(null), 600);
      setTease(pick(id === "discord" ? DISCORD_TEASE : APP_TEASE));
      later(() => setTease(null), 2600);
      return;
    }
    const c = pct(tiles.current[id] ?? null);
    sfx.launch();
    hoverRef.current = null;
    setHover(null);
    setLaunch({ id, x: c.x, y: c.y });
    spawnBits(fxRef.current, c.x, c.y, 22, "burst");
    later(() => cb.current.onOpen(id), 1900);
  };

  const onMove = (e: RPointerEvent) => {
    const now = performance.now();
    if (now - lastSpark.current < 70) return;
    lastSpark.current = now;
    const r = rootRef.current?.getBoundingClientRect();
    if (!r || !r.width) return;
    spawnBits(fxRef.current, ((e.clientX - r.left) / r.width) * 100, ((e.clientY - r.top) / r.height) * 100, 1, "spark");
  };

  const popBalloon = (i: number, e: RMouseEvent<HTMLButtonElement>) => {
    const c = pct(e.currentTarget);
    spawnBits(fxRef.current, c.x, c.y, 16, "burst");
    sfx.pop();
    setPopped((p) => [...p, i]);
    later(() => setPopped((p) => p.filter((n) => n !== i)), 3500);
    pops.current += 1;
    if (pops.current === 5) {
      setTease(BALLOON_EASTER);
      later(() => setTease(null), 3800);
    }
  };
  const poke = () => {
    setTease(pick(POKE_LINES));
    later(() => setTease(null), 2200);
  };

  const bubble = tease ?? (hover && active ? hintFor(hover) : null);

  return (
    <div
      ref={rootRef}
      className={`g-scene hl-home hl-cursor ${launch ? "is-launching" : ""}`}
      style={{ backgroundImage: `url(${asset("bg/home.png")})` }}
      onPointerMove={onMove}
    >
      <div className="hl-confetti">
        {CONFETTI.map((c, n) => (
          <i key={n} style={{ left: `${c.left}%`, width: `${c.size}em`, height: `${c.size}em`, background: c.c, animationDuration: `${c.dur}s`, animationDelay: `${c.delay}s` }} />
        ))}
      </div>
      <div className="hl-balloons">
        {BALLOONS.map((b, i) =>
          popped.includes(i) ? null : (
            <button
              key={i}
              className="hl-balloon"
              aria-label="balon"
              style={{ left: `${b.left}%`, animationDuration: `${b.dur}s`, animationDelay: `${b.delay}s`, "--c": b.c } as CSSProperties}
              onClick={(e) => popBalloon(i, e)}
            >
              <b />
            </button>
          ),
        )}
      </div>

      <div className="hl-banner" aria-label={HOME_BANNER}>
        {HOME_BANNER.split("").map((ch, n) => (
          <span key={n} style={{ "--i": n } as CSSProperties}>{ch === " " ? "\u00A0" : ch}</span>
        ))}
      </div>
      <div className="hl-prog">
        <em>PROGRES</em>
        {[rooms >= 1, rooms >= 2, tiktokSeen, discordDone].map((on, n) => (
          <i key={n} className={on ? "on" : ""}>★</i>
        ))}
      </div>

      <div className="hl-apps">
        {APP_LIST.map(({ id, icon }) => {
          const st = status(id);
          return (
            <button
              key={id}
              ref={(el) => { tiles.current[id] = el; }}
              className={`hl-app ${st.locked ? "is-locked" : ""} ${st.done ? "is-done" : ""} ${hover === id && active ? "is-hover" : ""} ${shake === id ? "is-shake" : ""} ${active && !st.locked ? "is-ready" : ""}`}
              onClick={() => press(id)}
              onPointerEnter={() => enter(id)}
              onPointerLeave={leave}
              onPointerMove={tilt}
            >
              <span className="hl-tile">
                <img src={asset(icon)} alt="" draggable={false} />
                <b className={`hl-badge ${st.badge === "NEW" ? "new" : ""} ${st.badge === "✓" ? "ok" : ""}`}>{st.badge}</b>
              </span>
              <span className="hl-name">{APPS[id].label}</span>
              <small className="hl-sub">{st.sub}</small>
            </button>
          );
        })}
      </div>

      <Mascot x={mx} bottom={19} height={27} side bubble={bubble} canPoke={active} onPoke={poke} />
      <div className="hl-fx" ref={fxRef} />

      {launch && (
        <div className={`hl-launch ${launch.id}`} style={{ "--cx": `${launch.x}%`, "--cy": `${launch.y}%` } as CSSProperties}>
          <img src={asset(APP_LIST.find((a) => a.id === launch.id)!.icon)} alt="" draggable={false} />
          <b>MEMBUKA {LAUNCH_LABEL[launch.id]}...</b>
          <div className="hl-bar"><i /></div>
        </div>
      )}

      {boot && (
        <div className="hl-boot" onClick={finishBoot}>
          <h1>{BOOT_TITLE}</h1>
          <div className="hl-bar"><i /></div>
          <p>{BOOT_SUB}</p>
        </div>
      )}
    </div>
  );
}
