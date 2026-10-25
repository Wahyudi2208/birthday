import { useEffect, useRef, useState } from "react";
import "./voice.css";
import { TalkBox } from "./Memories";
import type { Say } from "./memories-data";
import { sfx } from "./sfx";
import {
  BTN_NEXT,
  BTN_REPLAY,
  HINT_PLAY,
  VOICE,
  VOICE_INTRO,
} from "./voice-data";

/* ------------------------------------------------------------------ *
 * VoiceNote.tsx = kaset berisi pesan suara.
 *
 * Alur:
 * 1. Dialog intro menggunakan TalkBox.
 * 2. Pengguna klik kaset.
 * 3. Audio diputar.
 * 4. Subtitle tampil menggunakan TalkBox.
 * 5. Mood karakter mengikuti mood pada setiap VOICE.lines.
 * ------------------------------------------------------------------ */

const asset = (p: string) => `${import.meta.env.BASE_URL}${p}`;

type Phase = "intro" | "ready" | "play" | "done";

type Dlg = {
  lines: Say[];
  i: number;
  done?: () => void;
};

const BARS = Array.from({ length: 28 }, (_, i) => i);

export default function VoiceNote({
  onDone,
}: {
  onDone: () => void;
}) {
  const [phase, setPhaseS] = useState<Phase>("intro");

  const [dlg, setDlg] = useState<Dlg | null>({
    lines: VOICE_INTRO,
    i: 0,
    done: () => setPhase("ready"),
  });

  const [t, setT] = useState(0);
  const [dur, setDur] = useState(VOICE.seconds);
  const [reel, setReel] = useState(0);
  const [textOnly, setTextOnly] = useState(false);

  const phaseRef = useRef<Phase>("intro");
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const modeRef = useRef<"audio" | "sim">("audio");
  const simStart = useRef(0);
  const tick = useRef<number | undefined>(undefined);
  const timers = useRef<number[]>([]);

  const setPhase = (p: Phase) => {
    phaseRef.current = p;
    setPhaseS(p);
  };

  const advance = () => {
    if (!dlg) return;

    if (dlg.i < dlg.lines.length - 1) {
      setDlg({
        ...dlg,
        i: dlg.i + 1,
      });

      return;
    }

    const callback = dlg.done;

    setDlg(null);
    callback?.();
  };

  const stopAudio = () => {
    window.clearInterval(tick.current);

    const audio = audioRef.current;

    if (audio) {
      audio.onended = null;
      audio.onerror = null;
      audio.pause();
    }

    audioRef.current = null;
  };

  const finish = () => {
    if (phaseRef.current !== "play") return;

    stopAudio();
    setPhase("done");
    sfx.win();
  };

  const startSim = () => {
    modeRef.current = "sim";
    simStart.current = performance.now();

    setTextOnly(true);
    setDur(VOICE.seconds);
  };

  const play = () => {
    if (
      phaseRef.current !== "ready" &&
      phaseRef.current !== "done"
    ) {
      return;
    }

    stopAudio();
    sfx.click();

    setT(0);
    setPhase("play");

    modeRef.current = "audio";
    setTextOnly(false);

    if (VOICE.src) {
      const audio = new Audio(asset(VOICE.src));

      audioRef.current = audio;

      audio.onended = finish;

      // Jika file tidak ditemukan atau rusak,
      // jalankan subtitle menggunakan timer simulasi.
      audio.onerror = startSim;

      audio.onloadedmetadata = () => {
        if (Number.isFinite(audio.duration)) {
          setDur(audio.duration);
        }
      };

      audio.play().catch(startSim);
    } else {
      startSim();
    }

    tick.current = window.setInterval(() => {
      const audio = audioRef.current;

      const currentTime =
        modeRef.current === "audio" && audio
          ? audio.currentTime
          : (performance.now() - simStart.current) / 1000;

      setT(currentTime);

      if (
        modeRef.current === "sim" &&
        currentTime >= VOICE.seconds
      ) {
        finish();
      }
    }, 100);
  };

  // Membuat reel kaset berganti gambar ketika audio berjalan.
  useEffect(() => {
    if (phase !== "play") return;

    const id = window.setInterval(() => {
      setReel((current) => 1 - current);
    }, 300);

    return () => {
      window.clearInterval(id);
    };
  }, [phase]);

  // Preload asset dan cleanup ketika komponen ditutup.
  useEffect(() => {
    [
      "items/cassette-a.png",
      "items/cassette-b.png",
      "bg/gift.png",
    ].forEach((path) => {
      const image = new Image();
      image.src = asset(path);
    });

    return () => {
      timers.current.forEach((timer) => {
        window.clearTimeout(timer);
      });

      stopAudio();
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Dialog pembuka sebelum audio diputar.
  const introLine = dlg ? dlg.lines[dlg.i] : null;

  // Mengambil subtitle terakhir yang timestamp-nya
  // sudah dilewati oleh posisi audio saat ini.
  const subtitle =
    phase === "play"
      ? [...VOICE.lines]
          .filter((voiceLine) => voiceLine.at <= t)
          .pop()
      : undefined;

  const playing = phase === "play";

  const progressPercentage = Math.min(
    100,
    (t / Math.max(1, dur)) * 100
  );

  return (
    <div className="vn-root">
      <div
        className="vn-bg"
        style={{
          backgroundImage: `url(${asset("bg/gift.png")})`,
        }}
      />

      <div className="vn-shade" />

      <div
        className="vn-glow"
        style={{
          opacity: playing ? 1 : 0.55,
        }}
      />

      <button
        className={[
          "vn-cassette",
          phase === "ready" && !dlg ? "hot" : "",
          playing ? "on" : "",
        ]
          .filter(Boolean)
          .join(" ")}
        onClick={play}
        disabled={phase !== "ready"}
        aria-label="Putar kaset"
      >
        <img
          src={asset(
            `items/cassette-${
              playing && reel ? "b" : "a"
            }.png`
          )}
          alt=""
          draggable={false}
        />
      </button>

      <div
        className={`vn-wave ${playing ? "on" : ""}`}
        aria-hidden="true"
      >
        {BARS.map((i) => (
          <i
            key={i}
            style={{
              animationDelay: `${
                ((i * 37) % 11) * -0.09
              }s`,
              animationDuration: `${
                0.5 + ((i * 13) % 7) * 0.08
              }s`,
            }}
          />
        ))}
      </div>

      {(playing || phase === "done") && (
        <div className="vn-prog">
          <u
            style={{
              width: `${
                phase === "done"
                  ? 100
                  : progressPercentage
              }%`,
            }}
          />
        </div>
      )}

      {!dlg && phase === "ready" && (
        <div className="f-hint">
          {HINT_PLAY}
        </div>
      )}

      {/* Subtitle voice note menggunakan TalkBox.
          Mood karakter mengikuti subtitle yang sedang aktif. */}
      {subtitle && (
        <TalkBox
          key={`${subtitle.at}-${subtitle.text}`}
          line={subtitle}
          onAdvance={() => {}}
        />
      )}

      {playing && textOnly && (
        <div className="vn-note">
          mode teks (rekaman belum ada)
        </div>
      )}

      {phase === "done" && !dlg && (
        <div className="vn-btns">
          <button onClick={play}>
            {BTN_REPLAY}
          </button>

          <button
            className="go"
            onClick={() => {
              sfx.click();
              stopAudio();
              onDone();
            }}
          >
            {BTN_NEXT}
          </button>
        </div>
      )}

      {/* TalkBox dialog pembuka */}
      {introLine && (
        <TalkBox
          line={introLine}
          onAdvance={advance}
        />
      )}
    </div>
  );
}