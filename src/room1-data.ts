/* =====================================================================
 *  ISI RUANGAN 1: SURVIVE BIKINI BOTTOM
 *  Cukup edit file ini. Semua tulisan bertanda [GANTI] adalah draf.
 *
 *  URUTAN RUANGAN INI
 *    1. Layar hitam dengan judul (TITLE)
 *    2. Avatar berjalan masuk, lampu berkedip, lalu bicara (INTRO)
 *    3. Klik RADIO. Radio menyala dan memutar 3 kenangan satu per satu
 *       (MEMORIES). Tiap kenangan punya kartu di layar + ucapan avatar.
 *       Setelah itu avatar bilang kata-kata manis (SWEET_LINES)
 *    4. Ambil SENTER dan BANDAGES (ITEMS_START, ITEMS_DONE)
 *    5. Klik pintu keluar. Beruang mendekat bertahap (BEAR_FAR, BEAR_NEAR),
 *       lalu menyerang (BEAR_ATTACK)
 *    6. Mini-game: arahkan senter (mouse) ke beruang sampai penuh
 *    7. Beruang kabur. BARU SETELAH ITU avatar terlihat terluka (HURT_LINES)
 *    8. Klik tombol bandages, avatar dirawat (HEAL_LINES)
 *    9. Avatar dan kamu berjalan ke pintu, lalu hadiah (REWARD_TITLE, REWARD_LINES)
 *
 *  CARA MENGUBAH UCAPAN AVATAR
 *    Satu baris { text: "...", mood: "..." } = satu kotak dialog.
 *    Tambah ucapan : copy satu baris lengkap dengan koma, tempel di bawahnya.
 *    Hapus ucapan  : hapus satu baris utuh.
 *    mood = ekspresi wajah avatar. Pilihan: "neutral" | "happy" | "shy" | "surprised"
 *    (jangan pakai "mimic" di ruangan ini, itu khusus ruangan The Mimic)
 *
 *  CARA MENGUBAH KARTU KENANGAN  (bagian MEMORIES)
 *    Ada 3 jenis kartu, urutannya sesuai urutan di bawah:
 *      kind: "stamp"   -> kartu stempel besar. Pakai: label, big, text
 *      kind: "chat"    -> gelembung chat game. Pakai: label, name, text
 *      kind: "discord" -> kotak Discord, nama lama dicoret lalu diganti nama
 *                         asli. Pakai: label, name, real, text
 *    Arti tiap isian:
 *      label : tulisan kecil di bagian atas kartu
 *      big   : kata besar di stempel
 *      name  : nama yang tampil (contoh "Felix")
 *      real  : nama asli yang menggantikan name (khusus discord)
 *      text  : isi kalimatnya
 *      says  : ucapan avatar saat kartu ini muncul (lihat cara ubah ucapan)
 *    Tambah kartu: copy satu blok { ... } lengkap dengan koma, tempel di bawahnya.
 *    Hapus kartu : hapus satu blok utuh.
 *
 *  CARA MENAMBAH LAGU
 *    1. Taruh mp3 di folder  public/audio/
 *    2. Isi misalnya  RADIO_MUSIC = "audio/lagu.mp3"
 *    Kalau dikosongkan, yang terdengar melodi chiptune sementara.
 *
 *  YANG LAIN
 *    LIGHT_MS : berapa lama (milidetik) cahaya harus mengenai beruang. 2500 =
 *               2,5 detik. Makin besar makin lama/susah. Disarankan 2000 sampai 4000.
 *    LIGHT_RADIUS : lebar lingkaran cahaya senter (satuan bebas, 6 = pas).
 *               Makin kecil makin susah.
 *
 *  HATI-HATI: teks harus di dalam tanda kutip "..." dan tiap baris berakhir koma.
 * ===================================================================== */
import type { Say } from "./memories-data";

export type Memory = {
  kind: "stamp" | "chat" | "discord";
  label: string;
  big?: string;
  name?: string;
  real?: string;
  text: string;
  says: Say[];
};

// ---- Lagu (kosong = melodi sementara) ----
export const ROOM_MUSIC = ""; // lagu tenang waktu masuk ruangan, contoh "audio/room-1.mp3"
export const RADIO_MUSIC = "audio/love.mp3"; // lagu dari radio, contoh "audio/lagu.mp3"

// ---- Pengaturan mini-game senter ----
export const LIGHT_MS = 2500;
export const LIGHT_RADIUS = 6;

// ---- Layar judul ----
export const TITLE = "SURVIVE BIKINI BOTTOM";
export const TITLE_SUB = "RUANGAN 1 · TEMPAT KITA PERTAMA KETEMU";

// ---- Dialog di lobby sebelum masuk ruangan ----
export const ENTRY_LINES: { text: string }[] = [
  { text: "Let's move into our first game on Roblox, tempat kita pertama ketemu." },
  { text: "Anw, dulu aku pro player di game ini. Aku ketemu Kim duluan, terus Kim yang ngenalin kamu ke aku. Thanks, Kim." },
  { text: "Okay, let's get inside!" },
];

// ---- Pembukaan: setelah avatar masuk dan lampu menyala ----
export const INTRO: Say[] = [
  { text: "Nah, ini ruangannya. Gelap banget tadi, untung lampunya mau nyala.", mood: "surprised" },
  { text: "Ada radio di atas bangku itu. Coba nyalain... ada yang pengen aku ceritain.", mood: "happy" },
];

// ---- Kenangan dari radio (urutan = urutan tampil) ----
export const MEMORIES: Memory[] = [
  {
    kind: "stamp",
    label: "KESAN PERTAMA",
    big: "POLOS",
    text: "Si Lian Polos banget jir, ni anak baik banget lagi, kasian nanti masuk discord ternodai sama kita.",
    says: [
      { text: "Dulu pas pertama kenal, kesan pertama kamu ke aku: aku tu cowok yang polos banget.", mood: "happy" },
    ],
  },
  {
    kind: "chat",
    label: "CHAT DI GAME",
    name: "Felix",
    text: "I'm gay, and i like jaden.",
    says: [
      { text: "Dan waktu itu kamu nyamar jadi cowok... namanya Felix.", mood: "neutral" },
      { text: "Mana dulu kamu nyamar jadi cowo trus suka ke Jaden", mood: "shy" },
    ],
  },
  {
    kind: "discord",
    label: "DISCORD",
    name: "Felix",
    real: "Iah Sopiah",
    text: "Welcome Lian, Nama Aku Citra.",
    says: [
      { text: "Sampai akhirnya kamu reveal di Discord. Aku masih inget kagetnya, lah cwe rupanya.", mood: "surprised" },
      { text: "Trus pas kamu denger suara aku dan kita voice chat, kamu ketawa ketawa salting gtu HAHHAHAH.", mood: "shy" },
    ],
  },
];

// ---- Kata-kata manis setelah semua kenangan ----
export const SWEET_LINES: Say[] = [
  { text: "And well, i never imagine that we become closer and here we are.", mood: "shy" },
  { text: "Thankyou babe, for stay and i love u.", mood: "happy" },
];

// ---- Mengambil barang ----
export const ITEMS_START: Say[] = [
  { text: "Sekarang ambil dua barang di ruangan ini: senter dan bandages.", mood: "neutral" },
];
export const ITEMS_DONE: Say[] = [
  { text: "Dua hal yang kamu ambil, senter dan bandages, dulu sering banget kamu minta ke aku di game ini.", mood: "happy" },
  { text: "Yuk keluar. Pintunya di sebelah kanan.", mood: "neutral" },
];

// ---- Beruang (tahap 1: siluet jauh, tahap 2: mendekat, tahap 3: menyerang) ----
export const BEAR_FAR: Say[] = [
  { text: "Tunggu... kamu denger itu? Ada sesuatu di balik pintu.", mood: "surprised" },
];
export const BEAR_NEAR: Say[] = [
  { text: "Itu... beruang?! Dia jalan ke arah kita!", mood: "surprised" },
];
export const BEAR_ATTACK: Say[] = [
  { text: "Awas! Di belakangku! Cepat, pakai senternya, arahin ke beruangnya!", mood: "surprised" },
];
export const ROAR = "GRAAAAHH!!"; // tulisan besar saat beruang menyerang

// ---- Tulisan di mini-game senter ----
export const LIGHT_HINT = "GERAKKAN MOUSE = SENTER. ARAHKAN KE BERUANG!";
export const LIGHT_HIT = "KENA! TAHAN TERUS!";

// ---- Setelah beruang kabur dan avatar terlihat terluka ----
export const HURT_LINES: Say[] = [
  { text: "Aduh... gapapa, cuma kena dikit. Beruangnya takut cahaya, ternyata.", mood: "surprised" },
  { text: "Tolong pakai bandages-nya ya, babe.", mood: "shy" },
];
export const BANDAGE_BUTTON = "PAKAI BANDAGES";

// ---- Setelah dirawat ----
export const HEAL_LINES: Say[] = [
  { text: "Makasih ya. Udah enakan. Kamu selalu ada, dari dulu.", mood: "shy" },
  { text: "Nah, pintunya udah kebuka. Yuk, kita keluar bareng.", mood: "happy" },
];

// ---- Hadiah di akhir ruangan ----
export const REWARD_TITLE = "PINTU 1 TERBUKA";
export const REWARD_LINES: string[] = [
  "Selamat kamu dapat ketoprak, Skuy lanjut ke game satunya.",
  "Terima kasih udah selalu ada, dari game pertama kita.",
];
