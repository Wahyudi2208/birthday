import { FormEvent, useEffect, useState } from "react";
import Game from "./Game";

/* ------------------------------------------------------------------ *
 *  EDIT DI SINI: PIN, teks dialog, dan isi surat
 * ------------------------------------------------------------------ */

// PIN dari kartu ucapan (tanggal 25 Jan 2026). Hanya angka, tanpa "/".
// Beberapa format penulisan diterima supaya tidak gagal karena beda format.
const VALID_PINS = ["01252026", "012526", "25012026", "250126"];
const PIN_LENGTH = 8;

const INTRO_MESSAGE = "H-hai Babe... Aku bikin website ini, spesial buat kamu.";
const PROMPT_MESSAGE =
  "Halo Geulis welcome yaaa, Hmm untuk pin nya kamu ingat ga first time we chat di discord, coba deh masukin tanggalnya";
const RETRY_MESSAGE =
  "Coba lagi ya";
const WRONG_MESSAGE = "Hmm, PIN-nya belum pas. Coba kamu ingat ingat lagi!";
const RIGHT_MESSAGE = "Yeay, kebuka! horeeee, baca pelan pelan ya";
const LETTER_MESSAGE = "Ini surat buat kamu. Selamat ulang tahun my lovely lesbians!";

const LETTER_TITLE = "Untuk kamu";
const LETTER_PARAGRAPHS = [
  "Selamat ulang tahun!",
  "Kalau kamu baca ini, brarti kamu inget tanggal pertama kita chatan di discord.",
  "Aku bikin website ini buat kamu and i hope u like it, Hehe, happy birthday sayang, My beautiful lesbians.",
  "Semoga umur baru ini kasih kamu hari-hari yang tenang, kopi yang enak, dan banyak alasan buat ketawa, dan semoga Bram ga nakal lagi.",
  "WISH U ALL THE BEST HONEY",
];
const LETTER_SIGNATURE = "- The Architect";

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

function useTypewriter(text: string, speed: number) {
  const [typed, setTyped] = useState("");

  useEffect(() => {
    setTyped("");
    if (!text) return;
    let index = 0;
    const interval = window.setInterval(() => {
      index += 1;
      setTyped(text.slice(0, index));
      if (index >= text.length) window.clearInterval(interval);
    }, speed);
    return () => window.clearInterval(interval);
  }, [text, speed]);

  return typed;
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
  const [stage, setStage] = useState<"pin" | "letter" | "game">("pin");
  const [canContinue, setCanContinue] = useState(false);

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
    const t = window.setTimeout(
      () => setCanContinue(true),
      (LETTER_PARAGRAPHS.length + 1) * 900 + 800,
    );
    return () => window.clearTimeout(t);
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

  const typedMessage = useTypewriter(hasStarted ? dialogueText : "", 34);
  const typedIntro = useTypewriter(INTRO_MESSAGE, 42);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (status === "success") return;
    setAttempts((count) => count + 1);
    setStatus(VALID_PINS.includes(pin) ? "success" : "error");
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
        <div className="scene-vignette" aria-hidden="true" />

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
                      setPin(
                        event.target.value.replace(/\D/g, "").slice(0, PIN_LENGTH),
                      );
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
                  Petunjuk: Ada dua tanggal, but try aja dua duanya
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
                  <button className="start-button" type="button" onClick={() => setStage("game")}>
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
                onClick={() => setHasStarted(true)}
              >
                [ CLICK HERE TO START ]
              </button>
              <span className="intro-hint">A TINY QUEST MADE WITH LOVE</span>
            </div>
          </div>
        </section>
      )}
    </main>
  );
}

export default App;
