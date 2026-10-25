/** Memunculkan partikel kecil (konfeti / percikan kursor) langsung di DOM, tanpa re-render React.
 *  box = elemen pembungkus (position:absolute, inset:0). x,y dalam persen layar. */
const COLORS = ["#ff6f8f", "#f2c66f", "#7ec8ff", "#7dff9c", "#c07bff", "#ff9a5a", "#fff1cf"];

export function spawnBits(box: HTMLElement | null, x: number, y: number, n: number, mode: "burst" | "spark") {
  if (!box) return;
  // batasi jumlah supaya tidak berat kalau kursor digerakkan terus
  while (box.childElementCount > 60) box.firstElementChild?.remove();
  for (let k = 0; k < n; k++) {
    const s = document.createElement("i");
    s.className = `hl-bit ${mode}`;
    const ang = Math.random() * Math.PI * 2;
    const dist = mode === "burst" ? 3 + Math.random() * 7 : 0.4 + Math.random() * 1.4;
    s.style.left = `${x}%`;
    s.style.top = `${y}%`;
    s.style.setProperty("--dx", `${(Math.cos(ang) * dist).toFixed(2)}em`);
    s.style.setProperty("--dy", `${(Math.sin(ang) * dist - (mode === "burst" ? 2.5 : 0)).toFixed(2)}em`);
    s.style.background = COLORS[Math.floor(Math.random() * COLORS.length)];
    s.addEventListener("animationend", () => s.remove());
    box.appendChild(s);
  }
}
