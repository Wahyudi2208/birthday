import { useCallback, useEffect, useRef, useState } from "react";
import "./game.css";
import Discord from "./Discord";
import Finale from "./Finale";
import { AFTER_FINALE, LEAD_SAYS } from "./finale-data";
import Home, { type AppId } from "./Home";
import Lobby from "./Lobby";
import Memories, { TalkBox } from "./Memories";
import Mimic from "./Mimic";
import Room1 from "./Room1";
import { AFTER_DISCORD, AFTER_MIMIC, AFTER_TIKTOK, HOME_LINES, LOBBY_ALL_DONE, LOBBY_FIRST, LOBBY_ROOM1_DONE, MIMIC_LINES, type PoseSay } from "./lobby-data";
import { ENTRY_LINES } from "./room1-data";
import { isMuted, music, setMuted, sfx } from "./sfx";

/* ------------------------------------------------------------------ *
 *  Game.tsx = pengatur alur: home -> lobby -> ruangan 1 / ruangan 2 / TikTok.
 *  Teks home + lobby ada di lobby-data.ts, ruangan 1 di room1-data.ts,
 *  ruangan 2 di mimic-data.ts.
 * ------------------------------------------------------------------ */

type Scene = "home" | "lobby" | "room" | "tiktok" | "mimic" | "discord" | "finale";
type Dlg = { lines: PoseSay[]; i: number; done?: () => void };

const sprite = (n: string) => `${import.meta.env.BASE_URL}sprites/${n}.png`;
const asset = (p: string) => `${import.meta.env.BASE_URL}${p}`;
const ALL_SPRITES = ["chibi", "nerd", "guide"];
const EXTRA_ASSETS = ["bg/room.png", "bg/lobby.png", "bg/home.png", "items/app-roblox.png", "items/app-discord.png", "items/app-tiktok.png", "bg/discord.png", "bg/party.png", "bg/stage.png", "items/cake.png"];
// Buka website dengan ?finale di alamatnya untuk langsung masuk ruangan perayaan (tanpa PIN). Untuk testing saja.
const QS = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : new URLSearchParams();
const FINALE_TEST = QS.has("finale");
const FINALE_START = QS.get("finale") || "party"; // ?finale=warung | song | stage | gacha | voice | end
const DEV_FAST = FINALE_TEST || QS.has("dev"); // ?dev = lewati PIN, surat, dan intro (sekaligus membuka semua app)
// Urutan terkunci (default): Roblox ruangan 1 -> TikTok + pintu 2 -> Roblox ruangan 2 -> Discord -> finale.
// Semua app/pintu terbuka HANYA kalau alamat memakai ?dev atau ?unlock (untuk testing). Tidak perlu ubah angka lagi.
const DEV_UNLOCK_ALL = QS.has("dev") || QS.has("unlock");
const ZOOM_MS = 1250; // lama zoom masuk pintu sebelum pindah ruangan (samakan dengan animasi di lobby.css)

export default function Game() {
  const [scene, setScene] = useState<Scene>(FINALE_TEST ? "finale" : "home");
  const [d, setD] = useState<Dlg | null>(null);
  const [introDone, setIntroDone] = useState(DEV_FAST);
  const [homeReady, setHomeReady] = useState(DEV_FAST);
  const [muted, setMutedState] = useState(isMuted); // ikut pilihan mute dari layar PIN
  const [cleared, setCleared] = useState(false);
  const [cleared2, setCleared2] = useState(false);
  const [tiktokSeen, setTiktokSeen] = useState(false);
  const [discordDone, setDiscordDone] = useState(false);
  const [finaleSeen, setFinaleSeen] = useState(false);
  const [fStart, setFStart] = useState(FINALE_START);
  const [fKey, setFKey] = useState(0);
  const [entering, setEntering] = useState<1 | 2 | null>(null);
  const timers = useRef<number[]>([]);

  const later = useCallback((fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms));
  }, []);
  const say = useCallback((lines: PoseSay[], done?: () => void) => setD({ lines, i: 0, done }), []);
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
    if (!FINALE_TEST) music.start();
    return () => {
      music.stop();
      timers.current.forEach(clearTimeout);
      timers.current = [];
    };
  }, []);
  // dialog pembuka dimulai setelah layar pembuka selesai
  useEffect(() => {
    if (introDone) say(HOME_LINES, () => setHomeReady(true));
  }, [introDone, say]);

  // Semua selesai (Roblox 2 ruangan, TikTok, Discord): setelah dialog di home habis, masuk ruangan perayaan
  const allDone = cleared && cleared2 && tiktokSeen && discordDone;
  useEffect(() => {
    if (!allDone || finaleSeen || scene !== "home" || d || !homeReady) return;
    const t = window.setTimeout(
      () =>
        say(LEAD_SAYS, () => {
          music.stop();
          setFinaleSeen(true);
          setScene("finale");
        }),
      900,
    );
    return () => window.clearTimeout(t);
  }, [allDone, finaleSeen, scene, d, homeReady, say]);

  const tiktokOpen = DEV_UNLOCK_ALL || cleared;
  const door2Open = DEV_UNLOCK_ALL || cleared; // pintu 2 terbuka setelah ruangan 1 selesai
  const discordOpen = DEV_UNLOCK_ALL || (cleared && cleared2); // Discord = finale, terbuka setelah ruangan 1 dan 2
  const lobbyLines = () => (cleared && cleared2 ? LOBBY_ALL_DONE : cleared ? LOBBY_ROOM1_DONE : LOBBY_FIRST);

  const openApp = (app: AppId) => {
    if (app === "tiktok") {
      music.stop();
      setTiktokSeen(true);
      setScene("tiktok");
    } else if (app === "discord") {
      music.stop(); // adegan Discord memakai musik memorinya sendiri
      setScene("discord");
    } else {
      setScene("lobby");
      say(lobbyLines());
    }
  };
  const closeTikTok = () => {
    music.start();
    setScene("home");
    say(AFTER_TIKTOK);
  };
  const closeDiscord = () => {
    music.start();
    setScene("home");
    if (discordDone) say(AFTER_DISCORD);
  };
  const closeFinale = () => {
    music.start();
    setScene("home");
    say(AFTER_FINALE);
  };
  const closeMimic = () => {
    music.start();
    setCleared2(true);
    setScene("lobby");
    say(AFTER_MIMIC);
  };
  const closeRoom = () => {
    music.start();
    setScene("lobby");
    say(cleared2 ? LOBBY_ALL_DONE : LOBBY_ROOM1_DONE);
  };
  const toHome = () => {
    if (d) return;
    setScene("home");
  };
  // Pintu diklik di lobby. Dialog dulu, lalu zoom ke pintu, lalu pindah ruangan.
  const onDoor = (n: 1 | 2) => {
    if (d || entering) return;
    if (n === 2 && !door2Open) return sfx.locked();
    sfx.door();
    const lines: PoseSay[] =
      n === 1 ? ENTRY_LINES.map((l) => ({ text: l.text, mood: "happy" as const, pose: "nerd" as const })) : MIMIC_LINES;
    say(lines, () => {
      music.stop(); // ruangan punya musiknya sendiri
      setEntering(n);
      later(() => {
        setEntering(null);
        setScene(n === 1 ? "room" : "mimic");
      }, ZOOM_MS);
    });
  };
  const toggleMute = () => {
    const m = !muted;
    setMutedState(m);
    setMuted(m);
    if (!m && (scene === "home" || scene === "lobby")) music.start();
  };

  const line = d ? d.lines[d.i] : null;
  const sideScene = scene === "home" || scene === "lobby";
  const rooms = (cleared ? 1 : 0) + (cleared2 ? 1 : 0);

  return (
    <div className="g-root">
      <div className="g-stage">
        {scene === "home" && (
          <Home
            intro={!introDone}
            ready={homeReady}
            talking={!!d}
            rooms={rooms}
            tiktokOpen={tiktokOpen}
            tiktokSeen={tiktokSeen}
            discordOpen={discordOpen}
            discordDone={discordDone}
            onIntroDone={() => setIntroDone(true)}
            onOpen={openApp}
          />
        )}
        {scene === "lobby" && (
          <Lobby
            door2Open={door2Open}
            cleared={cleared}
            cleared2={cleared2}
            talking={!!d}
            entering={entering}
            pose={line?.pose ?? "chibi"}
            onDoor={onDoor}
            onHome={toHome}
          />
        )}
        {scene === "room" && <Room1 onBack={closeRoom} onCleared={() => setCleared(true)} />}
        {scene === "tiktok" && <Memories onBack={closeTikTok} />}
        {scene === "mimic" && <Mimic onBack={closeMimic} />}
        {scene === "discord" && <Discord onBack={closeDiscord} onDone={() => setDiscordDone(true)} />}
        {scene === "finale" && <Finale key={fKey} start={fStart} onBack={closeFinale} stars={FINALE_TEST ? undefined : [cleared, cleared2, tiktokSeen, discordDone].filter(Boolean).length} />}
        {FINALE_TEST && scene === "finale" && (
          <div className="g-devjump">
            {(
              [["party", "PESTA"], ["song", "LAGU"], ["warung", "WARUNG"], ["stage", "PANGGUNG"], ["gacha", "GACHA"], ["voice", "SUARA"], ["end", "ENDING"]] as const
            ).map(([k, l]) => (
              <button key={k} className={fStart === k ? "on" : ""} onClick={() => { setFStart(k); setFKey((n) => n + 1); }}>{l}</button>
            ))}
          </div>
        )}
        {sideScene && line && <TalkBox line={line} onAdvance={advance} />}
        <button className="g-mute" onClick={toggleMute}>{muted ? "🔇" : "🔊"}</button>
      </div>
      <div className="g-warn">Buka website ini di laptop ya, babe 💻</div>
    </div>
  );
}
