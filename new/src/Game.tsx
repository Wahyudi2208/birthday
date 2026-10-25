import { useCallback, useEffect, useRef, useState, type PointerEvent as RPointerEvent } from "react";
import "./game.css";
import { music, setMuted, sfx } from "./sfx";

/* ------------------------------------------------------------------ *
 *  EDIT DI SINI: teks dialog dan lagu
 * ------------------------------------------------------------------ */
const ME = "THE ARCHITECT";
// Lagu untuk radio: taruh mp3 di public/audio/ lalu isi, contoh "audio/lagu.mp3".
// Kosong = tetap pakai musik chiptune bawaan.
const MUSIC_SRC = "audio/love.mp3";

type Line = { who: string; text: string; pose?: string };

const HOME_LINES: Line[] = [
  { who: ME, text: "Hei babe! Sebelum kita rayain ulang tahun kamu..." },
  { who: ME, text: "...yuk kita mampir dulu ke kenangan-kenangan kita." },
  { who: ME, text: "Dua app lain masih kekunci. Kita mulai dari Roblox dulu ya, klik aja!" },
];
const LOBBY_LINES: Line[] = [
  { who: ME, text: "Ini lobby Roblox-nya. Pintu pertama udah kebuka, yang lain nanti ya." },
];
const NERD_LINES: Line[] = [
  { who: ME, pose: "nerd", text: "Let's move into our first game on Roblox, tempat kita pertama ketemu." },
  { who: ME, pose: "nerd", text: "Anw, dulu aku pro player di game ini. Aku ketemu Kim duluan, terus Kim yang ngenalin kamu ke aku. Thanks, Kim." },
  { who: ME, pose: "nerd", text: "Okay, let's get inside!" },
];
const ROOM_START: Line[] = [
  { who: ME, pose: "guide", text: "Nah, ini ruangannya. Coba nyalain radionya dulu... ada yang pengen aku ceritain." },
];
const RADIO_LINES: Line[] = [
  { who: ME, pose: "guide", text: "Dulu pas pertama kenal, kesan pertamaku: kamu cowok yang polos banget." },
  { who: ME, pose: "guide", text: "Dan waktu itu kamu nyamar jadi cowok... namanya Felix." },
  { who: ME, pose: "guide", text: "Sampai akhirnya kamu reveal di Discord. Aku masih inget kagetnya." },
  { who: ME, pose: "guide", text: "(GANTI: kata-kata manis kamu di sini.)" },
];
const ITEMS_START: Line[] = [
  { who: ME, pose: "guide", text: "Sekarang ambil dua barang di ruangan ini: senter dan bandages." },
];
const ITEMS_DONE: Line[] = [
  { who: ME, pose: "guide", text: "Dua hal yang kamu ambil, senter dan bandages, dulu sering banget kamu minta ke aku di game ini." },
  { who: ME, pose: "guide", text: "Yuk keluar. Pintunya di sebelah kanan." },
];
const BEAR_LINES: Line[] = [
  { who: "BERUANG", pose: "protect", text: "GRAAAAHHH!!" },
  { who: ME, pose: "protect", text: "Awas! Di belakangku! Cepat, pakai senternya, arahin ke beruangnya!" },
];
const HURT_LINES: Line[] = [
  { who: ME, pose: "hurt", text: "Aduh... gapapa, cuma kena dikit. Beruangnya takut cahaya, ternyata." },
  { who: ME, pose: "hurt", text: "Tolong pakai bandages-nya ya, babe." },
];
const HEAL_LINES: Line[] = [
  { who: ME, pose: "guide", text: "Makasih ya. Udah enakan. Nah, pintunya udah kebuka." },
];
const REWARD_LINES = [
  "(GANTI: hadiah pintu 1, lagu atau kata-kata.)",
  "Terima kasih udah selalu ada, dari game pertama kita.",
];
/* ------------------------------------------------------------------ */

type Scene = "home" | "lobby" | "room";
type Phase = "explore" | "radio" | "items" | "exit" | "bear" | "light" | "flee" | "hurt" | "healed" | "end";
type Dlg = { lines: Line[]; i: number; done?: () => void };

const sprite = (n: string) => `${import.meta.env.BASE_URL}sprites/${n}.png`;
const ALL_SPRITES = ["chibi", "guide", "nerd", "protect", "hurt", "bear-attack", "bear-flee"];
const DEFAULT_POSE: Record<Phase, string> = {
  explore: "guide", radio: "guide", items: "guide", exit: "guide",
  bear: "protect", light: "protect", flee: "protect", hurt: "hurt", healed: "guide", end: "guide",
};
const LIGHT_MS = 2000;
const asset = (p: string) => `${import.meta.env.BASE_URL}${p}`;
const bg = (n: string) => ({ backgroundImage: `url(${asset(`bg/${n}.png`)})` });
const EXTRA_ASSETS = ["bg/room.png", "bg/lobby.png", "bg/home.png", "items/radio.png", "items/senter.png", "items/bandages.png", "items/app-roblox.png", "items/app-discord.png", "items/app-tiktok.png"];
// Posisi pintu di lobby (persen dari layar), mengikuti gambar bg/lobby.png
const LOBBY_DOORS = [{ n: 1, l: 19.4, w: 13.4 }, { n: 2, l: 43.7, w: 12.6 }, { n: 3, l: 67.4, w: 13.3 }];

function DialogBox({ line, onAdvance }: { line: Line; onAdvance: () => void }) {
  const [n, setN] = useState(0);
  const i = useRef(0);
  useEffect(() => {
    i.current = 0;
    setN(0);
    const t = window.setInterval(() => {
      i.current += 1;
      setN(i.current);
      if (i.current % 2 === 0) sfx.blip();
      if (i.current >= line.text.length) window.clearInterval(t);
    }, 30);
    return () => window.clearInterval(t);
  }, [line.text]);
  const full = n >= line.text.length;
  const click = () => {
    if (!full) {
      i.current = line.text.length;
      setN(line.text.length);
    } else {
      sfx.click();
      onAdvance();
    }
  };
  return (
    <div className="g-dialog" onClick={click}>
      <div className="g-who">{line.who}</div>
      <p>{line.text.slice(0, n)}</p>
      {full && <span className="g-next">▶</span>}
    </div>
  );
}

export default function Game() {
  const [scene, setScene] = useState<Scene>("home");
  const [phase, setPhase] = useState<Phase>("explore");
  const [d, setD] = useState<Dlg | null>(null);
  const [homeReady, setHomeReady] = useState(false);
  const [got, setGot] = useState<string[]>([]);
  const [prog, setProg] = useState(0);
  const [muted, setMutedState] = useState(false);
  const [cleared, setCleared] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);
  const bearRef = useRef<HTMLImageElement>(null);
  const overBear = useRef(false);
  const progRef = useRef(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const say = useCallback((lines: Line[], done?: () => void) => setD({ lines, i: 0, done }), []);
  const advance = () => {
    if (!d) return;
    if (d.i < d.lines.length - 1) return setD({ ...d, i: d.i + 1 });
    const cb = d.done;
    setD(null);
    cb?.();
  };

  useEffect(() => {
    ALL_SPRITES.forEach((n) => (new Image().src = sprite(n)));
    EXTRA_ASSETS.forEach((p) => (new Image().src = asset(p)));
    music.start();
    say(HOME_LINES, () => setHomeReady(true));
    return () => {
      music.stop();
      audioRef.current?.pause();
    };
  }, [say]);

  // Semua item terambil -> dialog -> pintu keluar aktif
  useEffect(() => {
    if (phase === "items" && got.length === 2) say(ITEMS_DONE, () => setPhase("exit"));
  }, [got, phase, say]);

  // Mini-game senter: tahan cahaya di beruang 2 detik
  useEffect(() => {
    if (phase !== "light") return;
    const t = window.setInterval(() => {
      if (!overBear.current) return;
      progRef.current = Math.min(LIGHT_MS, progRef.current + 50);
      setProg(progRef.current / (LIGHT_MS / 100));
      if (progRef.current >= LIGHT_MS) {
        window.clearInterval(t);
        setPhase("flee");
      }
    }, 50);
    return () => window.clearInterval(t);
  }, [phase]);

  // Beruang kabur -> baru kelihatan avatar terluka
  useEffect(() => {
    if (phase !== "flee") return;
    sfx.whimper();
    const t = window.setTimeout(() => {
      setPhase("hurt");
      sfx.hit();
      say(HURT_LINES);
    }, 1500);
    return () => window.clearTimeout(t);
  }, [phase, say]);

  const openRoblox = () => {
    if (!homeReady || d) return;
    sfx.click();
    setScene("lobby");
    say(LOBBY_LINES);
  };
  const clickDoor = (n: number) => {
    if (d) return;
    if (n !== 1) return sfx.locked();
    sfx.door();
    say(NERD_LINES, () => {
      setScene("room");
      setPhase("explore");
      setGot([]);
      say(ROOM_START);
    });
  };
  const clickRadio = () => {
    if (phase !== "explore" || d) return;
    sfx.click();
    setPhase("radio");
    if (MUSIC_SRC) {
      music.stop();
      const a = new Audio(import.meta.env.BASE_URL + MUSIC_SRC);
      a.muted = muted;
      a.play().catch(() => {});
      audioRef.current = a;
    }
    say(RADIO_LINES, () => {
      setPhase("items");
      say(ITEMS_START);
    });
  };
  const collect = (name: string) => {
    if (phase !== "items" || d || got.includes(name)) return;
    sfx.pickup();
    setGot((g) => [...g, name]);
  };
  const clickExit = () => {
    if (phase !== "exit" || d) return;
    sfx.door();
    audioRef.current?.pause();
    music.stop();
    sfx.growl();
    setPhase("bear");
    say(BEAR_LINES, () => {
      progRef.current = 0;
      setProg(0);
      setPhase("light");
    });
  };
  const applyBandage = () => {
    if (phase !== "hurt" || d) return;
    sfx.pickup();
    setPhase("healed");
    say(HEAL_LINES, () => {
      sfx.win();
      setPhase("end");
      setCleared(true);
      music.start();
    });
  };
  const backToLobby = () => {
    sfx.click();
    setScene("lobby");
    say(LOBBY_LINES);
  };
  const toggleMute = () => {
    const m = !muted;
    setMutedState(m);
    setMuted(m);
    if (audioRef.current) audioRef.current.muted = m;
    if (!m && phase !== "radio" && phase !== "items") music.start();
  };
  const onMove = (e: RPointerEvent) => {
    const s = stageRef.current;
    if (!s) return;
    const r = s.getBoundingClientRect();
    s.style.setProperty("--lx", `${e.clientX - r.left}px`);
    s.style.setProperty("--ly", `${e.clientY - r.top}px`);
    const b = bearRef.current?.getBoundingClientRect();
    overBear.current = !!b && e.clientX > b.left && e.clientX < b.right && e.clientY > b.top && e.clientY < b.bottom;
  };

  const line = d ? d.lines[d.i] : null;
  const pose = line?.pose ?? (scene === "room" ? DEFAULT_POSE[phase] : "chibi");
  const hot = (on: boolean) => (on && !d ? "g-hot" : "");

  return (
    <div className="g-root">
      <div className="g-stage" ref={stageRef} onPointerMove={onMove}>
        {scene === "home" && (
          <div className="g-scene" style={bg("home")}>
            <div className="g-clock">HAPPY BIRTHDAY!</div>
            <div className="g-apps">
              <button className={`g-app ${homeReady ? "g-hot" : ""}`} disabled={!homeReady} onClick={openRoblox}>
                <i><img src={asset("items/app-roblox.png")} alt="" /></i><span>ROBLOX</span>
              </button>
              <button className="g-app" disabled><i><img src={asset("items/app-discord.png")} alt="" /></i><span>DISCORD 🔒</span></button>
              <button className="g-app" disabled><i><img src={asset("items/app-tiktok.png")} alt="" /></i><span>TIKTOK 🔒</span></button>
            </div>
          </div>
        )}

        {scene === "lobby" && (
          <div className="g-scene" style={bg("lobby")}>
            <div className="g-clock">ROBLOX LOBBY</div>
            {LOBBY_DOORS.map(({ n, l, w }) => (
              <button key={n} className={`g-ldoor ${n === 1 ? `is-open ${hot(true)}` : "is-locked"}`} style={{ left: `${l}%`, width: `${w}%` }} onClick={() => clickDoor(n)}>
                <span>{n === 1 ? `${cleared ? "✓ " : ""}1 SURVIVE BIKINI BOTTOM` : "🔒 ???"}</span>
              </button>
            ))}
          </div>
        )}

        {scene === "room" && (
          <div className="g-scene" style={bg("room")}>
            <button className={`g-item g-radio ${hot(phase === "explore")}`} onClick={clickRadio}><img src={asset("items/radio.png")} alt="" /><small>RADIO</small></button>
            {!got.includes("senter") && (
              <button className={`g-item g-senter ${hot(phase === "items")}`} disabled={phase !== "items"} onClick={() => collect("senter")}><img src={asset("items/senter.png")} alt="" /><small>SENTER</small></button>
            )}
            {!got.includes("bandages") && (
              <button className={`g-item g-bandages ${hot(phase === "items")}`} disabled={phase !== "items"} onClick={() => collect("bandages")}><img src={asset("items/bandages.png")} alt="" /><small>BANDAGES</small></button>
            )}
            <button className={`g-exit ${hot(phase === "exit")}`} onClick={clickExit} aria-label="Pintu keluar" />

            {(phase === "bear" || phase === "light" || phase === "flee") && (
              <img ref={bearRef} className={`g-bear ${phase === "flee" ? "is-flee" : ""}`} src={sprite(phase === "flee" ? "bear-flee" : "bear-attack")} alt="" draggable={false} />
            )}
            {phase === "light" && (
              <>
                <div className="g-dark" />
                <div className="g-meter">
                  <span>ARAHKAN SENTER KE BERUANG (TAHAN)</span>
                  <div><i style={{ width: `${prog}%` }} /></div>
                </div>
              </>
            )}
            {phase === "hurt" && !d && <button className="g-bandage-btn g-hot" onClick={applyBandage}>🩹 PAKAI BANDAGES</button>}
            {phase === "end" && (
              <div className="g-reward">
                <h2>PINTU 1 TERBUKA</h2>
                {REWARD_LINES.map((t, k) => <p key={k}>{t}</p>)}
                <button onClick={backToLobby}>[ KEMBALI KE LOBBY ▶ ]</button>
              </div>
            )}
          </div>
        )}

        <img key={pose} className={`g-sprite g-pose-${pose}`} src={sprite(pose)} alt="" draggable={false} />
        {line && <DialogBox line={line} onAdvance={advance} />}
        <button className="g-mute" onClick={toggleMute}>{muted ? "🔇" : "🔊"}</button>
      </div>
      <div className="g-warn">Buka website ini di laptop ya, babe 💻</div>
    </div>
  );
}
