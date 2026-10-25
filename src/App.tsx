import { FormEvent, useEffect, useRef, useState } from "react";
import { spawnBits } from "./fx";
import Game from "./Game";
import "./intro.css";
import { isMuted, rain, setMuted, sfx, track } from "./sfx";

/* ------------------------------------------------------------------ *
 *  EDIT DI SINI: PIN, teks dialog, dan isi surat
 * ------------------------------------------------------------------ */

// PIN dari kartu ucapan (tanggal 25 Jan 2026). Hanya angka, tanpa "/".
// Beberapa format penulisan diterima supaya tidak gagal karena beda format.
const VALID_PINS = ["01252026", "012526", "25012026", "250126"];
const PIN_LENGTH = 8;

const INTRO_MESSAGE = "H-hai Babe... Aku bikin website ini, spesial buat kamu.";
const PROMPT_MESSAGE =
  "Hai sayangku, welcome... this is ur present from me";
const RETRY_MESSAGE =
  "Hayo coba di inget inget..";
const WRONG_MESSAGE = "Cek lagi bujang";
const RIGHT_MESSAGE = "Yeay, kebuka! That date is our first meet in discord.";
const LETTER_MESSAGE = "Ini surat buat kamu. Selamat ulang tahun!";

const LETTER_TITLE = "Untuk kamu";
const LETTER_PARAGRAPHS = [
  "Selamat ulang tahun!",
  "Kalo kamu berhasil nemuin surat ini, berarti kamu udah nerima hadiah dari akuu, hehe aku kerjain ini kurang lebih dua minggu, I hope u like it babe.",
  "Dear my favorite lesbians, Happy birthdayyyyyy!!!, Congrats for become 20s...",

];
const LETTER_SIGNATURE = "- Yudikk";

// Musik pengantar (layar awal, PIN, dan surat). Kosongkan src untuk memakai melodi kotak musik bawaan.
// Untuk memakai lagu sendiri: taruh mp3 di public/audio/, lalu isi misalnya src: "audio/intro.mp3".
const INTRO_MUSIC = { src: "audio/intro.mp3", variant: 8 };

/* ------------------------------------------------------------------ */

function PixelHeart({ className = "" }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      viewBox="0 0 14 12"
      shapeRendering="crispEdges"
    >
      <path
        fill="currentColor"
        d="M2 0h3v1h2v1h1V1h2V0h3v1h1v4h-1v2h-2v2H9v2H7v1H6v-1H5V9H3V7H1V5H0V1h2z"
      />
    </svg>
  );
}

type CharacterPose = "idle" | "tease" | "incorrect" | "correct" | "shy";

// Sprite PNG transparan. Taruh di folder public/sprites/ (idle.png, tease.png, ...).
// Kalau folder berbeda, cukup ubah SPRITE_BASE.
const SPRITE_BASE = `${import.meta.env.BASE_URL}sprites/`;
const SPRITE_POSES: CharacterPose[] = [
  "idle",
  "tease",
  "incorrect",
  "correct",
  "shy",
];
const SPRITES: Record<CharacterPose, string> = {
  idle: `${SPRITE_BASE}idle.png`,
  tease: `${SPRITE_BASE}tease.png`,
  incorrect: `${SPRITE_BASE}incorrect.png`,
  correct: `${SPRITE_BASE}correct.png`,
  shy: `${SPRITE_BASE}shy.png`,
};

const POSE_LABEL: Record<CharacterPose, string> = {
  idle: "INFORM / GUIDE",
  tease: "TEASING / SARCASTIC",
  incorrect: "PANIC / ANNOYED",
  correct: "OVERJOYED",
  shy: "SWEET / SALTING",
};

function ArchitectSprite({ pose }: { pose: CharacterPose }) {
  return (
    <img
      className={`architect architect-${pose}`}
      src={SPRITES[pose]}
      alt=""
      draggable={false}
    />
  );
}

function useTypewriter(text: string, speed: number, tick = false) {
  const [typed, setTyped] = useState("");

  useEffect(() => {
    setTyped("");
    if (!text) return;
    let index = 0;
    const interval = window.setInterval(() => {
      index += 1;
      setTyped(text.slice(0, index));
      // bunyi ketikan pelan: tiap 3 huruf, spasi dilewati
      if (tick && index % 3 === 0 && text[index - 1] !== " ") sfx.blip();
      if (index >= text.length) window.clearInterval(interval);
    }, speed);
    return () => window.clearInterval(interval);
  }, [text, speed, tick]);

  return typed;
}

// Kunang-kunang emas dan hati kecil yang melayang pelan: membuat ruangan terasa hidup.
function AmbientLife() {
  return (
    <div className="life" aria-hidden="true">
      {Array.from({ length: 12 }, (_, i) => (
        <i className="spark" key={i} />
      ))}
      {Array.from({ length: 5 }, (_, i) => (
        <PixelHeart className="life-heart" key={`h${i}`} />
      ))}
    </div>
  );
}

function RoomBackdrop() {
  return (
    <div className="room-backdrop" aria-hidden="true">
      <div className="rain-window">
        <span className="moon" />
        <span className="window-glow" />
        <i className="rain rain-one" />
        <i className="rain rain-two" />
        <i className="rain rain-three" />
        <i className="rain rain-four" />
        <i className="rain rain-five" />
      </div>
      <div className="curtain curtain-left" />
      <div className="curtain curtain-right" />
      <div className="wall-shelf">
        <span className="book book-one" />
        <span className="book book-two" />
        <span className="book book-three" />
        <span className="plant-pot" />
        <span className="plant-leaf leaf-one" />
        <span className="plant-leaf leaf-two" />
        <span className="plant-leaf leaf-three" />
      </div>
      <div className="floor-lamp">
        <span className="lamp-shade" />
        <span className="lamp-light" />
      </div>
      <div className="side-table">
        <span className="birthday-cake">
          <i className="cake-icing" />
          <i className="cake-candle" />
          <i className="cake-flame" />
        </span>
        <span className="mug" />
      </div>
      <div className="sofa">
        <span />
        <i />
      </div>
      <div className="floor-rug" />
      <span className="ambient-pixel pixel-one" />
      <span className="ambient-pixel pixel-two" />
      <span className="ambient-pixel pixel-three" />
    </div>
  );
}

function App() {
  const [pin, setPin] = useState("");
  const [hasStarted, setHasStarted] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [status, setStatus] = useState<"idle" | "error" | "success">("idle");
  const [stage, setStage] = useState<"pin" | "letter" | "game">(typeof window !== "undefined" && (new URLSearchParams(window.location.search).has("finale") || new URLSearchParams(window.location.search).has("dev")) ? "game" : "pin");
  const [canContinue, setCanContinue] = useState(false);
  const [muted, setMutedState] = useState(isMuted);
  const fxRef = useRef<HTMLDivElement>(null);

  // Preload semua pose supaya pergantian pose tidak berkedip.
  useEffect(() => {
    SPRITE_POSES.forEach((pose) => {
      const image = new Image();
      image.src = SPRITES[pose];
    });
  }, []);

  // Setelah PIN benar, tahan sebentar untuk reaksi karakter lalu buka surat.
  useEffect(() => {
    if (status !== "success") return;
    const timeout = window.setTimeout(() => setStage("letter"), 2200);
    return () => window.clearTimeout(timeout);
  }, [status]);

  // Tombol lanjut muncul setelah semua paragraf surat selesai muncul.
  useEffect(() => {
    if (stage !== "letter") return;
    // bunyi lembut setiap paragraf surat muncul, dan ping saat tombol lanjut muncul
    const ids: number[] = [];
    for (let i = 0; i <= LETTER_PARAGRAPHS.length; i++) ids.push(window.setTimeout(() => sfx.pop(), i * 900 + 120));
    ids.push(window.setTimeout(() => sfx.page(), 200));
    ids.push(
      window.setTimeout(() => {
        setCanContinue(true);
        sfx.ping();
      }, (LETTER_PARAGRAPHS.length + 1) * 900 + 800),
    );
    return () => ids.forEach((id) => window.clearTimeout(id));
  }, [stage]);

  // Masuk ke game: hujan dan musik pengantar berhenti (Game menyalakan musiknya sendiri).
  useEffect(() => {
    if (stage !== "game") return;
    rain.stop();
    track.stop();
  }, [stage]);

  const dialogueText =
    stage === "letter"
      ? LETTER_MESSAGE
      : status === "success"
        ? RIGHT_MESSAGE
        : status === "error"
          ? WRONG_MESSAGE
          : attempts > 0
            ? RETRY_MESSAGE
            : PROMPT_MESSAGE;

  const typedMessage = useTypewriter(hasStarted ? dialogueText : "", 34, true);
  const typedIntro = useTypewriter(INTRO_MESSAGE, 42);

  const startExperience = () => {
    // klik pertama = izin browser untuk bersuara
    setHasStarted(true);
    sfx.launch();
    if (!isMuted()) {
      rain.start();
      track.play(INTRO_MUSIC.src || undefined, INTRO_MUSIC.variant);
    }
  };

  const toggleMute = () => {
    const m = !muted;
    setMutedState(m);
    setMuted(m);
    if (!m && hasStarted && stage !== "game") {
      rain.start();
      track.play(INTRO_MUSIC.src || undefined, INTRO_MUSIC.variant);
    }
    if (m) track.stop();
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (status === "success") return;
    const ok = VALID_PINS.includes(pin);
    setAttempts((count) => count + 1);
    setStatus(ok ? "success" : "error");
    if (ok) {
      sfx.win();
      spawnBits(fxRef.current, 50, 55, 28, "burst");
      window.setTimeout(() => {
        sfx.door();
        spawnBits(fxRef.current, 50, 45, 20, "burst");
      }, 900);
    } else {
      sfx.locked();
      window.setTimeout(() => sfx.whimper(), 120);
    }
  };

  const characterPose: CharacterPose =
    stage === "letter"
      ? "shy"
      : status === "error"
        ? "incorrect"
        : status === "success"
          ? "correct"
          : pin.length > 0
            ? "tease"
            : "idle";

  if (stage === "game") return <Game />;

  return (
    <main className="visual-novel">
      <div
        className={`lockscreen-scene ${hasStarted ? "" : "is-obscured"}`}
        aria-hidden={!hasStarted}
      >
        <RoomBackdrop />
        <AmbientLife />
        {stage === "letter" && (
          <div className="confetti" aria-hidden="true">
            {Array.from({ length: 18 }, (_, i) => (
              <i key={i} />
            ))}
          </div>
        )}
        <div className="scene-vignette" aria-hidden="true" />
        <div className="vn-fx" ref={fxRef} aria-hidden="true" />

        <header className="game-header">
          <span className="night-label">BIRTHDAY NIGHT</span>
          <div className="clock-block">
            <time>12:00 PM</time>
            <span>HAPPY BIRTHDAY!</span>
          </div>
          <div className="header-status">
            <span className="signal" aria-hidden="true">
              <i />
              <i />
              <i />
            </span>
            <span className="battery" aria-label="Battery 70 percent">
              <i />
            </span>
          </div>
        </header>

        <section className="game-stage" aria-label="Birthday visual novel lock screen">
          <div
            className="character-anchor"
            data-sprite-state={characterPose}
            aria-label={`The Architect character, ${characterPose} pose`}
          >
            <div className="character-sprite" key={characterPose}>
              <ArchitectSprite pose={characterPose} />
            </div>
            <div className="character-name">
              <span>THE ARCHITECT</span>
              <small>{POSE_LABEL[characterPose]}</small>
            </div>
          </div>

          <div className="interaction-stack">
            <div className={`dialogue ${stage === "letter" ? "is-compact" : ""}`}>
              <div className="speaker">
                <PixelHeart className="speaker-heart" />
                <span>THE ARCHITECT</span>
              </div>
              <p>
                {typedMessage}
                <span className="cursor" aria-hidden="true" />
              </p>
              <span className="dialogue-arrow" aria-hidden="true" />
            </div>

            {stage === "pin" ? (
              <form
                className={`pin-card ${
                  status === "error" ? `is-error shake-${attempts % 2}` : ""
                } ${status === "success" ? "is-success" : ""}`}
                onSubmit={handleSubmit}
              >
                <div className="form-heading">
                  <div>
                    <span className="eyebrow">LOCKED MEMORY</span>
                    <label htmlFor="pin">SECRET PIN</label>
                  </div>
                  <span className="pin-count">
                    {pin.length}/{PIN_LENGTH}
                  </span>
                </div>

                <div className="pin-input-wrap">
                  <input
                    id="pin"
                    aria-describedby="pin-hint pin-status"
                    aria-label="Secret PIN dari kartu ucapan"
                    autoComplete="off"
                    autoFocus
                    disabled={status === "success"}
                    inputMode="numeric"
                    maxLength={PIN_LENGTH}
                    type="password"
                    value={pin}
                    onChange={(event) => {
                      const next = event.target.value.replace(/\D/g, "").slice(0, PIN_LENGTH);
                      // nada naik tiap digit, turun pelan saat dihapus
                      if (next.length > pin.length) sfx.heal(next.length - 1);
                      else if (next.length < pin.length) sfx.hover();
                      setPin(next);
                      if (status === "error") setStatus("idle");
                    }}
                  />
                  <div className="pin-dots" aria-hidden="true">
                    {Array.from({ length: PIN_LENGTH }, (_, index) => (
                      <span
                        className={index < pin.length ? "is-filled" : ""}
                        key={index}
                      />
                    ))}
                  </div>
                </div>

                <button type="submit" disabled={status === "success"}>
                  <span>{status === "success" ? "UNLOCKED!" : "UNLOCK"}</span>
                  <i aria-hidden="true">▶</i>
                </button>

                <p className="hint" id="pin-hint">
                  Petunjuk: Tanggal Pertama/Kedua aku join discord mabar roblox 💐
                </p>
                <p className="status" id="pin-status" aria-live="polite">
                  {status === "error" && "PIN belum tepat. Coba lagi!"}
                  {status === "success" && "Benar! Memori terbuka."}
                </p>
              </form>
            ) : (
              <article className="letter-card" aria-label="Surat ulang tahun">
                <div className="letter-heading">
                  <span className="eyebrow">MEMORY UNLOCKED</span>
                  <h2>{LETTER_TITLE}</h2>
                </div>
                <div className="letter-body">
                  {LETTER_PARAGRAPHS.map((paragraph, index) => (
                    <p key={index} style={{ animationDelay: `${index * 900}ms` }}>
                      {paragraph}
                    </p>
                  ))}
                  <p
                    className="letter-signature"
                    style={{ animationDelay: `${LETTER_PARAGRAPHS.length * 900}ms` }}
                  >
                    {LETTER_SIGNATURE}
                  </p>
                </div>
                {canContinue && (
                  <button className="start-button" type="button" onClick={() => { sfx.launch(); setStage("game"); }}>
                    [ LANJUT KE KENANGAN ▶ ]
                  </button>
                )}
              </article>
            )}
          </div>
        </section>

        <footer className="game-footer">
          <span>♥ A LITTLE BIRTHDAY QUEST</span>
          <div
            className={`quest-progress ${stage === "letter" ? "is-chapter-two" : ""}`}
            aria-label="Quest progress"
          >
            <i />
            <i />
            <i />
          </div>
          <span>{stage === "letter" ? "CHAPTER 02" : "CHAPTER 01"}</span>
        </footer>
      </div>

      {!hasStarted && (
        <section className="intro-overlay" aria-label="Birthday game introduction">
          <div className="intro-stars" aria-hidden="true">
            {Array.from({ length: 26 }, (_, i) => (
              <i key={i} />
            ))}
          </div>
          <div className="intro-title" aria-hidden="true">
            <small>♥ A LITTLE ♥</small>
            <h1>BIRTHDAY QUEST</h1>
          </div>
          <div className="intro-frame">
            <div
              className="intro-character"
              aria-label="The Architect tersipu malu sambil menggaruk belakang kepala"
            >
              <ArchitectSprite pose="shy" />
              <span className="intro-shadow" aria-hidden="true" />
            </div>
            <div className="intro-content">
              <div className="intro-dialogue">
                <div className="intro-speaker">
                  <span>THE ARCHITECT</span>
                  <i aria-hidden="true" />
                </div>
                <p>
                  {typedIntro}
                  <span className="cursor" aria-hidden="true" />
                </p>
                <span className="dialogue-arrow" aria-hidden="true" />
              </div>
              <button
                className="start-button"
                type="button"
                onClick={startExperience}
              >
                [ CLICK HERE TO START ]
              </button>
              <span className="intro-hint">A TINY QUEST MADE WITH LOVE</span>
              <span className="intro-hint intro-sound">♪ NYALAKAN SUARA · PAKAI HEADSET LEBIH ENAK</span>
            </div>
          </div>
        </section>
      )}

      <button className="vn-mute" type="button" onClick={toggleMute} aria-label={muted ? "Nyalakan suara" : "Matikan suara"}>
        {muted ? "🔇" : "🔊"}
      </button>
    </main>
  );
}

export default App;
