import type { Say } from "./memories-data";

/* =====================================================================
 *  WARUNG KETOPRAK (tahap 2)
 *  Cukup edit file ini untuk mengubah teks, pilihan, dan aturan makan.
 *
 *  ALUR
 *    1. Dialog pembuka -> panel PESAN (pilih sambal dan isian).
 *    2. The Architect jadi abang: ngulek bumbu -> menyajikan.
 *    3. Tekan SUAP berkali-kali. Kalau sambal pedas, di suapan tertentu Ruby kepedasan
 *       dan harus tekan ES TEH. Setelah BITES suapan, Ruby kenyang.
 *    4. Dialog penutup -> bonus +1 tiket gacha -> lanjut ke panggung.
 * ===================================================================== */

export const BITES = 6; // jumlah suapan sampai kenyang

export type SambalOpt = { label: string; sub: string; line: string };
export const SAMBAL: SambalOpt[] = [
  { label: "TANPA", sub: "aman", line: "Tanpa sambal. Aman, babe." },
  { label: "LEVEL 1", sub: "sedikit", line: "Level 1, cukup buat nambah rasa." },
  { label: "LEVEL 2", sub: "sedang", line: "Level 2. Lumayan pedas nanti, lho." },
  { label: "LEVEL 3", sub: "nekat", line: "Level 3?! Berani juga kamu. Es teh udah aku siapin." },
];
// Di suapan ke-berapa Ruby kepedasan, menurut level sambal yang dipilih (index = level)
export const SPICY_AT: number[][] = [[], [], [3], [2, 4]];

export type Ingredient = { id: string; label: string; icon: string };
export const INGREDIENTS: Ingredient[] = [
  { id: "tahu", label: "TAHU", icon: "items/kt-tahu.png" },
  { id: "lontong", label: "LONTONG", icon: "items/kt-lontong.png" },
  { id: "bihun", label: "BIHUN", icon: "items/kt-bihun.png" },
  { id: "tauge", label: "TAUGE", icon: "items/kt-tauge.png" },
  { id: "kerupuk", label: "KERUPUK", icon: "items/kt-kerupuk.png" },
];

// ---- Dialog (avatar The Architect, di sini jadi abang ketoprak)  [DRAF dari Claude, bebas diganti]
export const INTRO_SAYS: Say[] = [
  { text: "Babe, kamu pasti laper habis nyanyi lagu ulang tahun tadi. Kita mampir ke warung ketoprak dulu ya.", mood: "happy" },
  { text: "Hari ini aku yang jadi abangnya. Silakan pesan, Neng.", mood: "shy" },
];
export const COOK_SAYS: Say[] = [{ text: "Siap! Bumbu kacangnya aku ulek dulu, tunggu sebentar.", mood: "happy" }];
export const SERVE_SAYS: Say[] = [{ text: "Pesanan datang! Silakan makan, Neng. Tekan SUAP buat nyuap.", mood: "happy" }];
export const DONE_SAYS: Say[] = [
  { text: "Kenyang? Alhamdulillah. Ketoprak buatan aku emang nggak ada duanya.", mood: "happy" },
  { text: "Karena kamu habis, ada bonus buat kamu: satu tiket gacha tambahan. Dipakai nanti ya.", mood: "shy" },
];

// ---- Teks gelembung di atas Ruby
export const BUBBLE_SPICY = "PEDESSS!!";
export const BUBBLE_COOL = "Aaah… lega.";
export const REWARD_TEXT = "+1 TIKET GACHA";

// ---- Ukuran tiap pose Ruby (persen tinggi layar). Sprite makan dari Gemini beda skala, jadi disetel manual.
export const RUBY_H: Record<"idle" | "wait" | "scoop" | "spicy" | "drink" | "full", number> = {
  idle: 50,
  wait: 52,
  scoop: 52,
  spicy: 49,
  drink: 49,
  full: 49,
};
