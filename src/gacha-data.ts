import type { Say } from "./memories-data";

/* =====================================================================
 *  GACHA HADIAH (tahap 1)
 *  Cukup edit file ini untuk mengisi kartu, teks, dan aturan gacha.
 *  Semua tulisan bertanda [GANTI] adalah PLACEHOLDER.
 *
 *  CARA ISI KARTU
 *    1. Taruh foto di public/photos/gacha/ (JPG/PNG, potret lebih bagus, bagian tengah-atas yang paling terlihat).
 *    2. Edit baris kartu di CARDS: tier, photo, name, stats (3 angka 0-100), note.
 *    3. Foto yang belum ada otomatis tampil sebagai kotak "?" supaya alurnya tetap bisa dites.
 *
 *  ATURAN GACHA
 *    Jumlah tarikan = bintang progres yang sudah didapat + 1 bonus dari warung ketoprak (dihitung di Finale.tsx).
 *    Tarikan TERAKHIR selalu kartu SECRET (tidak ada di pool acak).
 *    ODDS    : bobot tier untuk tarikan acak (bukan persen, bebas diubah).
 *    PITY    : kalau sudah sebanyak ini tarikan berturut-turut common, tarikan berikutnya pasti rare ke atas.
 *    Kartu yang sudah keluar tidak keluar lagi (kecuali pool habis).
 *    Setelah tiket habis, album terbuka penuh: kartu yang belum keluar tetap bisa dilihat (redup).
 * ===================================================================== */

export type Tier = "common" | "rare" | "epic" | "legendary" | "secret";
export type GachaCard = { id: string; tier: Tier; photo: string; name: string; stats: [number, number, number]; note: string };

export const TICKETS = 5; // cadangan saja. Jumlah asli dihitung di Finale: bintang progres (maks 4) + 1 bonus kalau ketoprak habis
export const PITY = 3;
export const ODDS: Record<Exclude<Tier, "secret">, number> = { common: 55, rare: 28, epic: 12, legendary: 5 };
export const STAT_LABELS: [string, string, string] = ["AURA", "IMUT", "KALEM"]; // [GANTI] bebas, misal "KETOPRAK"

// Tampilan tiap tier (frame kartu diwarnai lewat filter CSS dari satu frame dasar)
export const TIER_STYLE: Record<Tier, { label: string; color: string; filter: string; hint: string }> = {
  common: { label: "COMMON", color: "#d5dae3", filter: "grayscale(0.9) brightness(1.1)", hint: "#d5dae3" },
  rare: { label: "RARE", color: "#6db6ff", filter: "hue-rotate(185deg) saturate(1.25)", hint: "#6db6ff" },
  epic: { label: "EPIC", color: "#c18bff", filter: "hue-rotate(255deg) saturate(1.25)", hint: "#c18bff" },
  legendary: { label: "LEGENDARY", color: "#ffd24a", filter: "saturate(1.8) brightness(1.18)", hint: "#ffd24a" },
  secret: { label: "SECRET", color: "#ff7ac0", filter: "hue-rotate(310deg) saturate(1.5) brightness(0.92)", hint: "#ff7ac0" },
};

// Letak bagian-bagian di gambar items/card-frame.png (pecahan 0-1). Dihasilkan dari gambar Gemini; biasanya tidak perlu diubah.
export const CARD_FRAME = {
  aspect: 810 / 1098,
  photo: { x: 0.12, y: 0.07, w: 0.79, h: 0.6 },
  plate: { x: 0.02, y: 0.044, w: 0.4, h: 0.078 },
  panel: { x: 0.105, y: 0.712, w: 0.812, h: 0.22 },
};

// ---- Dialog (avatar The Architect)  [DRAF dari Claude, bebas diganti]
export const GIFT_INTRO: Say[] = [
  { text: "Satu lagi, babe. Ada hadiah buat kamu.", mood: "happy" },
  { text: "Buka aja. Klik kotaknya.", mood: "shy" },
];
export const MACHINE_SAYS: Say[] = [
  { text: "Jreng! Mesin gacha spesial buat kamu.", mood: "happy" },
  { text: "Kamu punya {n} tiket. Tarik satu-satu ya, isinya rahasia.", mood: "neutral" },
  { text: "Tiket terakhir… nanti kamu tahu sendiri.", mood: "shy" },
];
export const SECRET_SAYS: Say[] = [
  { text: "Nah, itu kartu paling langka. Limited edition, cuma ada satu di dunia.", mood: "shy" },
  { text: "Iya, itu aku. Jangan dijual ya, babe.", mood: "happy" },
];
export const ALBUM_SAYS: Say[] = [{ text: "Ini semua koleksinya. Yang redup belum keluar, tapi tetap boleh kamu lihat.", mood: "happy" }];

// ---- Kartu  [GANTI] nama, stat, komentar, dan foto. Urutan di sini = nomor seri.
export const CARDS: GachaCard[] = [
  { id: "c1", tier: "common", photo: "photos/gacha/1.jpg", name: "Leon SKibidi", stats: [40, 55, 60], note: "Femboy berotot." },
  { id: "c2", tier: "common", photo: "photos/gacha/2.jpg", name: "Halland", stats: [45, 50, 58], note: "Femboy Pemain Bola." },
  { id: "c3", tier: "common", photo: "photos/gacha/3.jpg", name: "Speed Kawai", stats: [50, 48, 52], note: "Cute Gyat Speed." },
  { id: "c4", tier: "common", photo: "photos/gacha/4.jpg", name: "Aduh Kamera Depan", stats: [42, 60, 47], note: "Kamera depan kyut." },
  { id: "c5", tier: "common", photo: "photos/gacha/5.jpg", name: "Grandpa Oni Chan >//<", stats: [55, 45, 50], note: "KAWAIIII." },
  { id: "r1", tier: "rare", photo: "photos/gacha/6.jpg", name: "Supradi Anjarwati", stats: [68, 72, 65], note: "Femboy Vintage." },
  { id: "r2", tier: "rare", photo: "photos/gacha/7.jpg", name: "Windah Cosplay", stats: [70, 66, 74], note: "ARA ARA >///<." },
  { id: "r3", tier: "rare", photo: "photos/gacha/8.jpg", name: "Bahlila JKT 48", stats: [75, 70, 68], note: "Boros bensin ini." },
  { id: "r4", tier: "rare", photo: "photos/gacha/9.jpg", name: "Rossalia Syahroni", stats: [72, 78, 70], note: "Syahroni chann." },
  { id: "e1", tier: "epic", photo: "photos/gacha/10.jpg", name: "Mimi Peri", stats: [86, 88, 84], note: "Femboy Vintage 2." },
  { id: "e2", tier: "epic", photo: "photos/gacha/11.jpg", name: "Sister hong", stats: [90, 85, 88], note: "Femboy melegenda china." },
  { id: "l1", tier: "legendary", photo: "photos/gacha/12.jpg", name: "Sister hong 2", stats: [97, 95, 96], note: "Femboy internasional" },
  { id: "secret", tier: "secret", photo: "photos/gacha/secret.jpg", name: "THE ARCHITECT", stats: [99, 99, 99], note: "Limited edition. Cuma ada satu di dunia." },
];

const left = CARDS.filter((c) => c.name.includes("[GANTI]")).length;
if (left) console.warn(`[Gacha] Masih ada ${left} kartu dengan nama [GANTI] di gacha-data.ts`);
