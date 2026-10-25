import { useEffect, useRef, useState } from "react";
import { MASCOT_FACES } from "./lobby-data";
import { sfx } from "./sfx";

/** Avatar chibi yang berjalan ke posisi x (persen lebar layar) dengan bunyi langkah.
 *  pose "chibi" = kecil dan bisa berjalan. Pose lain ("nerd", "guide") = sosok besar
 *  yang muncul di kiri saat dialog khusus, tanpa berjalan. */
const SPEED = 24; // persen layar per detik
export const walkTime = (a: number, b: number) => Math.max(0.35, Math.abs(a - b) / SPEED);
const sprite = (n: string) => `${import.meta.env.BASE_URL}sprites/${n}.png`;

type Props = {
  x: number;
  bottom?: number;
  height?: number;
  pose?: string;
  bubble?: string | null;
  side?: boolean; // gelembung di samping (bukan di atas kepala)
  away?: boolean; // berjalan masuk ke pintu: mengecil lalu menghilang
  canPoke?: boolean;
  onPoke?: () => void;
};

export default function Mascot({ x, bottom = 21, height = 28, pose = "chibi", bubble, side = false, away = false, canPoke = true, onPoke }: Props) {
  const big = pose !== "chibi";
  const defaultFacing = MASCOT_FACES === "kanan" ? "right" : "left";
  const prev = useRef(x);
  const [dur, setDur] = useState(0);
  const [walking, setWalking] = useState(false);
  const [facing, setFacing] = useState<"left" | "right">(defaultFacing);
  const [hop, setHop] = useState(false);
  const hopTimer = useRef<number>(undefined);

  useEffect(() => {
    if (x === prev.current) return;
    const d = walkTime(prev.current, x);
    setFacing(x < prev.current ? "left" : "right");
    prev.current = x;
    setDur(d);
    setWalking(true);
    const step = window.setInterval(() => sfx.step(), 260);
    const end = window.setTimeout(() => {
      setWalking(false);
      window.clearInterval(step);
    }, d * 1000);
    return () => {
      window.clearInterval(step);
      window.clearTimeout(end);
    };
  }, [x]);
  useEffect(() => () => window.clearTimeout(hopTimer.current), []);

  const poke = () => {
    if (!canPoke || big) return;
    sfx.pop();
    setHop(true);
    window.clearTimeout(hopTimer.current);
    hopTimer.current = window.setTimeout(() => setHop(false), 450);
    onPoke?.();
  };

  const flip = facing !== defaultFacing;
  const h = big ? 62 : away ? height * 0.6 : height;
  return (
    <div
      className={`mc ${big ? "big" : ""} ${away ? "away" : ""}`}
      style={{
        left: `${big ? 15 : x}%`,
        bottom: `${big ? 20 : bottom}%`,
        height: `${h}%`,
        transition: big ? "none" : `left ${dur}s linear, height 1s linear`,
      }}
    >
      <div className="mc-c" key={big ? pose : "chibi"}>
        {bubble && !away && <div className={`mc-bubble ${side ? "side" : ""}`}>{bubble}</div>}
        <img
          className={`mc-img ${walking ? "walking" : ""} ${hop ? "hop" : ""} ${canPoke && !big ? "pokable" : ""}`}
          style={flip && !big ? { scale: "-1 1" } : undefined}
          src={sprite(pose)}
          alt=""
          draggable={false}
          onClick={poke}
        />
      </div>
    </div>
  );
}
