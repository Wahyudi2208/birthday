/* =====================================================================
 *  ISI HOME SCREEN + LOBBY ROBLOX
 *  Semua tulisan di layar home (3 app) dan lobby (2 pintu) ada di sini.
 *
 *  CARA MENGUBAH UCAPAN AVATAR  (HOME_LINES, LOBBY_LINES, dst.)
 *    Satu baris { text: "...", mood: "..." } = satu kotak dialog.
 *    Tambah ucapan : copy satu baris lengkap dengan koma, tempel di bawahnya.
 *    Hapus ucapan  : hapus satu baris utuh.
 *    mood = ekspresi wajah avatar: "neutral" | "happy" | "shy" | "surprised"
 *
 *  CARA MENGUBAH TULISAN KECIL (gelembung bicara avatar saat kursor
 *    diarahkan ke app/pintu). Isinya cuma teks di dalam tanda kutip "...".
 *    Untuk daftar acak (POKE_LINES, dst.) avatar memilih satu secara acak.
 *    Tambah satu: tulis "kalimat baru", di baris baru (jangan lupa koma).
 *
 *  HATI-HATI: teks harus di dalam tanda kutip "..." dan diakhiri koma.
 * ===================================================================== */
import type { Say } from "./memories-data";

// Ucapan yang boleh mengganti sosok avatar jadi besar (pose "nerd" / "guide")
export type PoseSay = Say & { pose?: "nerd" | "guide" };

// ---- Layar pembuka (muncul sekali di awal) ----
export const BOOT_TITLE = "A LITTLE BIRTHDAY QUEST";
export const BOOT_SUB = "memuat kenangan...";

// ---- Spanduk di home ----
export const HOME_BANNER = "HAPPY BIRTHDAY!";

// ---- Arah hadap gambar chibi: "kanan" atau "kiri" ----
// Kalau avatar terlihat berjalan mundur, ganti nilainya.
export const MASCOT_FACES: "kanan" | "kiri" = "kanan";

// ---- Dialog home ----
export const HOME_LINES: Say[] = [
  { text: "Hei babe! Sebelum kita rayain ulang tahun kamu...", mood: "happy" },
  { text: "...yuk mampir dulu ke kenangan-kenangan kita.", mood: "shy" },
  { text: "Arahin kursor ke tiap app, nanti aku kasih tau isinya. Kalau ada balon lewat, pecahin aja!", mood: "happy" },
  { text: "Dua app lain masih kekunci. Kita mulai dari Roblox dulu ya, klik aja!", mood: "neutral" },
];
export const AFTER_TIKTOK: Say[] = [
  { text: "Itu tadi album kenangan kita. Masih ada yang lain, nanti kita buka ya!", mood: "happy" },
];

// ---- Dialog lobby (dipilih sesuai progres) ----
export const LOBBY_FIRST: Say[] = [
  { text: "Ini lobby Roblox-nya. Pintu pertama udah kebuka, yang lain nanti ya.", mood: "happy" },
  { text: "Arahin kursor ke pintu buat lihat isinya, terus klik buat masuk.", mood: "neutral" },
];
export const LOBBY_ROOM1_DONE: Say[] = [
  { text: "Pintu kedua juga udah kebuka! Pilih aja mau masuk yang mana.", mood: "happy" },
];
export const LOBBY_ALL_DONE: Say[] = [
  { text: "Dua-duanya udah beres! Balik ke home yuk, masih ada album TikTok buat kamu.", mood: "happy" },
];

// ---- Dialog sebelum masuk ruangan 2 ----
export const MIMIC_LINES: PoseSay[] = [
  { text: "Pintu kedua: game kesukaan kamu, The Mimic. Siap-siap ya, di dalam ada yang bisa niru siapa aja.", mood: "surprised", pose: "guide" },
];
// Setelah ruangan 2 selesai
export const AFTER_MIMIC: Say[] = [
  { text: "Dua ruangan udah kebuka. Sisanya masih kekunci, nanti ya!", mood: "happy" },
];

// ---- Tiga app di home ----
export const APPS = {
  roblox: { label: "ROBLOX", hint: "Roblox: tempat kita pertama ketemu. Yuk masuk!" },
  discord: { label: "DISCORD", hint: "Discord: tempat kita ngobrol." },
  discordLocked: "Discord: baru kebuka kalau dua ruangan Roblox udah selesai.",
  tiktok: { label: "TIKTOK", hint: "TikTok: album kenangan kita." },
  tiktokLocked: "TikTok: baru kebuka kalau Roblox udah selesai.",
};
// Dipilih acak saat app yang terkunci diklik
export const APP_TEASE: string[] = [
  "Eits, ini masih kekunci. Sabar ya, babe~",
  "Belum waktunya! Selesaiin yang lain dulu.",
  "Kuncinya belum ada di aku. Hehe.",
];

// Dipilih acak saat Discord yang terkunci diklik  [DRAF dari Claude, bebas diganti]
export const DISCORD_TEASE: string[] = [
  "Discord masih kekunci. Selesaiin dua ruangan Roblox dulu ya.",
  "Yang ini belum bisa dibuka. Sabar, babe~",
];
// Setelah adegan Discord selesai dan kembali ke home  [DRAF dari Claude, bebas diganti]
export const AFTER_DISCORD: Say[] = [
  { text: "Itu tadi ruang ngobrol kita. Makasih udah mampir ke semua kenangan ini, babe.", mood: "happy" },
];

// ---- Dua pintu di lobby ----
export const DOORS = {
  1: { name: "SURVIVE BIKINI BOTTOM", hint: "Tempat kita pertama ketemu" },
  2: { name: "THE MIMIC", hint: "Game kesukaan kamu" },
  locked: { name: "???", hint: "Selesaikan ruangan 1 dulu" },
};
export const DOOR_TEASE: string[] = [
  "Pintu ini masih dikunci. Selesaiin ruangan 1 dulu ya.",
  "Dirantai kenceng banget. Kayaknya butuh kunci dari ruangan 1.",
];

// ---- Kalau avatar diklik (acak) ----
export const POKE_LINES: string[] = [
  "Eh, geli!",
  "Hai babe~",
  "Hehe, kenapa?",
  "Jangan diklik terus, nanti aku pusing.",
  "Aku di sini kok.",
];

// ---- Kejutan kecil: setelah memecahkan 5 balon ----
export const BALLOON_EASTER = "Wah, hobi banget mecahin balon. Awas habis, nanti ulang tahunnya sepi!";
