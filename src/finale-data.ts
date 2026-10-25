import type { Say } from "./memories-data";

/* =====================================================================
 *  ISI RUANGAN PERAYAAN (finale)
 *  Cukup edit file ini. Tidak perlu menyentuh Finale.tsx.
 *  Semua tulisan bertanda [GANTI] adalah PLACEHOLDER yang masih berupa draf.
 *
 *  ALUR
 *    1. Ruangan pesta: dialog pembuka, lalu klik tiap lilin untuk menyalakan.
 *    2. Semua lilin menyala -> "make a wish" -> tiup lilin (klik tiap lilin, atau pakai mic).
 *    3. Semua lilin padam -> konfeti -> LAGU ULANG TAHUN (SONG_BIRTHDAY).
 *    4. Tirai menutup -> panggung -> The Architect menyanyi (SONG_STAGE) dengan wajah idola.
 *    5. Kartu penutup (ENDING) -> kembali ke home.
 *
 *  GANTI FOTO IDOLA
 *    Taruh foto di public/photos/idol.jpg (timpa file lama). Kalau posisi wajahnya
 *    kurang pas di kepala karakter, atur FACE_CROP di bawah.
 *
 *  GANTI LAGU
 *    src     : file mp3 di public/audio/, contoh "audio/lagu.mp3". Kosong ("") = melodi chiptune sementara.
 *    from    : mulai dari detik ke-berapa di mp3 (opsional).
 *    seconds : lama bagian ini berlangsung (WAJIB). Setelah habis, lagu fade out dan adegan lanjut.
 *    lines   : lirik. { at: detik, text } dihitung sejak bagian ini mulai (bukan sejak awal mp3).
 *    variant : melodi cadangan kalau src kosong. 7 = Happy Birthday, 0-6 = melodi lain.
 *    Saran hak cipta: cukup 1 sampai 2 baris reff per lagu.
 * ===================================================================== */

export type SongCfg = {
  title: string;
  artist: string;
  src: string;
  from?: number;
  seconds: number;
  variant: number;
  lines: { at: number; text: string }[];
};

// ---- Lilin: posisi dasar tiap lilin di atas kue, dalam persen gambar kue [x, y]. Tambah/hapus baris = ubah jumlah lilin.
export const CANDLES: [number, number][] = [
  [30, 16],
  [40, 12],
  [50, 15],
  [60, 12],
  [70, 16],
];

// ---- Dialog (avatar The Architect bicara di kotak bawah)  [DRAF dari Claude, bebas diganti]
export const LEAD_SAYS: Say[] = [
  { text: "Babe, tunggu sebentar. Semua app udah kamu selesaiin, dan masih ada satu hal lagi.", mood: "happy" },
  { text: "Ikut aku ya.", mood: "shy" },
];
export const PARTY_INTRO: Say[] = [
  { text: "Surprise! Ini ruangan yang aku siapin khusus buat kamu.", mood: "happy" },
  { text: "Roblox, TikTok, sampai Discord udah kamu lewatin. Berarti sekarang waktunya dirayain.", mood: "happy" },
  { text: "Kuenya udah ada. Nyalain dulu lilinnya satu-satu ya. Tinggal klik lilinnya.", mood: "neutral" },
];
export const WISH_SAYS: Say[] = [
  { text: "Cantik banget lilinnya. Sekarang pejamin mata, terus make a wish.", mood: "shy" },
  { text: "Udah? Kalau udah, tiup semua lilinnya. Klik lilinnya, atau tiup beneran ke mic kalau mau.", mood: "happy" },
];
export const CHEER_SAYS: Say[] = [
  { text: "Yeay! Selamat ulang tahun, babe! Semoga kamu dapat femboy yang bisa hamil.", mood: "happy" },
  { text: "Sekarang dengerin lagu ulang tahunnya dulu ya.", mood: "happy" },
];
export const STAGE_SAYS: Say[] = [
  { text: "Eh, tunggu. Masih ada satu penampilan lagi.", mood: "surprised" },
  { text: "Aku mau nyanyi buat kamu. Tapi aku tahu kamu lebih suka lihat dia, jadi wajahnya aku pinjem sebentar ya.", mood: "shy" },
  { text: "Siap? Lihat ke panggung, babe.", mood: "happy" },
];
export const AFTER_FINALE: Say[] = [
  { text: "Selamat ulang tahun sekali lagi, babe. Aku sayang kamu.", mood: "happy" },
];

// ---- Lagu 1: lagu ulang tahun setelah lilin padam. src kosong = melodi Happy Birthday chiptune bawaan.
export const SONG_BIRTHDAY: SongCfg = {
  title: "Happy Birthday",
  artist: "",
  src: "audio/nadin.mp3",
  seconds: 20,
  variant: 7,
  lines: [
    { at: 0, text: "Happy 20s Birthday babe, i love u." },
  ],
};

// ---- Lagu 2: penampilan The Architect di panggung  [GANTI] judul, artis, src, dan lirik
export const SONG_STAGE: SongCfg = {
  title: "Happy birthday Kitten",
  artist: "Alpha sigma",
  src: "audio/sigma.mp3", // contoh: "audio/lagu-panggung.mp3"
  from: 0,
  seconds: 30,
  variant: 4,
  lines: [
    { at: 2, text: "Happy birthday to you, AUUUU" },
    { at: 8, text: "Happy birthday to you, awuuuuu" },
    { at: 14, text: "Happy birthday prettiest one under the moon" },
    { at: 20, text: "Woo Happy birthday to youuuuu" },
    { at: 26, text: "If i have 1 wish tonight, i spend every full moon by yourside" },
  ],
};

export const ENDING_TITLE = "THE END?";

export const ENDING_LINES = [
  "Makasih udah sampai sejauh ini.",
  "Makasih karena sudah hadir di hidup aku.",
  "Semoga dunia selalu baik sama kamu.",
  "Dan semoga suatu hari nanti semua doa kita menemukan jalannya.",
  "Happy Birthday, Babe. ❤️",
];

export const ENDING_BUTTON = "[ SEE YOU AGAIN ▶ ]";

// ---- Foto idola yang ditempel di wajah karakter
export const IDOL_PHOTO = "photos/idol.jpg";
// Bagian foto yang dipakai sebagai wajah, dalam pecahan 0-1 dari ukuran foto (x, y, lebar, tinggi).
// Rasio lebar:tinggi sebaiknya sekitar 0.75. Pas untuk foto close-up menghadap depan.
export const FACE_CROP = { x: 0.356, y: 0.174, w: 0.302, h: 0.397 };
export const FACE_PIXELS = { w: 28, h: 37 }; // makin kecil = makin kotak-kotak ala pixel art

// ---- Posisi area wajah di tiap pose sprite panggung (dalam persen gambar sprite).
// Dihasilkan otomatis dari kotak hijau di gambar Gemini. Biasanya tidak perlu diubah.
// rot = kemiringan kepala (derajat, CSS). scale = pembesar sedikit supaya tidak ada tepi kulit yang tersisa.
export const FACE_SPOT: Record<"a" | "b" | "c", { cx: number; cy: number; w: number; h: number; rot: number }> = {
  a: { cx: 58.4, cy: 21.05, w: 15.07, h: 18.6, rot: 0.8 },
  b: { cx: 52.92, cy: 19.67, w: 15.08, h: 16.17, rot: 19.7 },
  c: { cx: 65.54, cy: 25.16, w: 19.63, h: 20.71, rot: 27.7 },
};
export const FACE_SCALE = 1.12;
export const SPRITE_ASPECT = 596 / 634; // lebar / tinggi sprite panggung

// true = tombol "LEWATI" muncul saat lagu berjalan (untuk testing). Ganti false sebelum dikirim.
export const DEV_SKIP_BUTTON = true;

// Peringatan di console kalau masih ada [GANTI]
const leftovers = [SONG_STAGE.title, SONG_STAGE.artist, ...SONG_STAGE.lines.map((l) => l.text), ...ENDING_LINES].filter((t) => t.includes("[GANTI]"));
if (leftovers.length) console.warn(`[Finale] Masih ada ${leftovers.length} teks [GANTI] di finale-data.ts`);
