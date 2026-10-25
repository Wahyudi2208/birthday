/* =====================================================================
 *  ISI RUANGAN 2: THE MIMIC  ("Mana yang asli?")
 *  Cukup edit file ini. Semua tulisan bertanda [GANTI] adalah draf.
 *
 *  URUTAN RUANGAN INI
 *    1. Judul ruangan (TITLE) muncul di layar hitam
 *    2. Avatar masuk lorong, bicara (OPENING_1)
 *    3. Lampu berkedip dan ada bayangan lewat di balik pintu geser
 *    4. Avatar kaget (OPENING_2), lalu muncul DUA avatar dan Mimic bicara
 *       (MIMIC_INTRO, SPLIT_ARGUE)
 *    5. Pertanyaan 1..N. Tiap benar: kalimat manis (sweet), lalu ejekan Mimic (TAUNTS)
 *    6. Setelah pertanyaan terakhir benar: Mimic ketahuan, bicara (REVEAL_MIMIC),
 *       menghilang, avatar bicara (REVEAL_LINES), lalu berjalan ke pintu keluar
 *    7. Hadiah (REWARD_TITLE dan REWARD_LINES)
 *
 *  CARA MENGISI / MENAMBAH PERTANYAAN  (bagian QUESTIONS)
 *    Satu blok { ... } = satu pertanyaan. Isinya:
 *      q     : pertanyaan yang tampil di atas layar
 *      real  : jawaban BENAR (diucapkan avatar asli)
 *      fake  : jawaban PALSU (diucapkan Mimic). Buat yang masuk akal, supaya
 *              dia benar-benar harus berpikir.
 *      sweet : kalimat manis dari avatar asli setelah dia menjawab benar
 *    Tambah pertanyaan: copy satu blok lengkap dengan koma, tempel di bawahnya.
 *    Hapus pertanyaan : hapus satu blok utuh. Disarankan 3 sampai 5 pertanyaan.
 *
 *  KEDEKATAN MIMIC (MAX_STRIKES)
 *    Mimic makin dekat tiap salah jawab dan TIDAK direset ketika pindah
 *    pertanyaan. Kalau salah sebanyak MAX_STRIKES kali, Mimic menerkam
 *    (lalu mundur satu langkah dan pertanyaan diulang). Makin kecil angkanya,
 *    makin susah. Disarankan 4.
 *
 *  YANG LAIN
 *    who    : nama di kotak dialog. Pakai "MIMIC" untuk suara Mimic.
 *    mood   : "neutral" | "happy" | "shy" | "surprised" | "mimic"
 *             (ekspresi wajah avatar; "mimic" = potret Mimic)
 *    TAUNTS : ejekan Mimic setelah pertanyaan ke-1, ke-2, dst (urutan = urutan
 *             pertanyaan). Boleh dikosongkan [] untuk melewatinya.
 *    MIMIC_MUSIC : mp3 di public/audio/ (kosong = melodi tegang sementara)
 *
 *  HATI-HATI: teks harus di dalam tanda kutip "..." dan tiap baris berakhir koma.
 * ===================================================================== */
import type { Say } from "./memories-data";

export type Question = { q: string; real: string; fake: string; sweet: string };

export const MIMIC_MUSIC = ""; // contoh: "audio/mimic.mp3"
export const MAX_STRIKES = 4;

export const TITLE = "THE MIMIC";
export const TITLE_SUB = "RUANGAN 2 · SIAPA YANG ASLI?";

// Avatar sendirian di lorong
export const OPENING_1: Say[] = [
  { text: "Wah, lorongnya gelap banget... seremnya persis kayak di game.", mood: "neutral" },
  { text: "Dulu kamu selalu ngajakin aku main game ini, kamu dulu jago banget.", mood: "happy" },
];

// Setelah lampu berkedip dan ada bayangan lewat
export const OPENING_2: Say[] = [
  { text: "Barusan... ada bayangan lewat di balik pintu geser. Kamu lihat juga? siapa itu bejir? mayor Teddy kah", mood: "surprised" },
];

// Mimic muncul dan menggandakan avatar
export const MIMIC_INTRO: Say[] = [
  { who: "MIMIC", text: "Hehehe... aku bisa jadi siapa aja. Wajahnya, suaranya, semuanya.", mood: "mimic" },
  { who: "MIMIC", text: "Coba kita lihat, seberapa kenal kamu sama dia?", mood: "mimic" },
];

// Kedua avatar saling klaim
export const SPLIT_ARGUE: Say[] = [
  { who: "AVATAR A", text: "Jangan percaya dia! Aku yang asli.", mood: "surprised" },
  { who: "AVATAR B", text: "Bohong! Akulah yang asli. Dengerin aku.", mood: "surprised" },
  { who: "MIMIC", text: "Jawab pertanyaanku. Yang asli pasti tahu jawabannya.", mood: "mimic" },
];

export const QUESTIONS: Question[] = [
  {
    q: "Apa gorengan kesukaan aku?",
    real: "Tempe mendoan dong enak bejir.",
    fake: "Tahu isi bakso weunak.",
    sweet: "Ciee inget nih yee :P.",
  },
  {
    q: "Rencana first date kita?",
    real: "Berak depan barista.",
    fake: "Korek korek tai bareng.",
    sweet: "Asikkk, MANAA AYO BERAK DEPAN BARISTA.",
  },
  {
    q: "Seberapa badung aku?",
    real: "Badung bin maut.",
    fake: "Anak baik ini, kalem.",
    sweet: "LOHH KOK BUKAN YANG ANAK BAIK, KALEM???.",
  },
];

// Ejekan Mimic setelah tiap jawaban benar (kecuali yang terakhir)
export const TAUNTS: Say[][] = [
  [{ who: "MIMIC", text: "Hmph. Beruntung aja.", mood: "mimic" }],
  [{ who: "MIMIC", text: "Pake Chat GPT pasti nih...", mood: "mimic" }],
];

// Diucapkan avatar asli saat salah pilih (dipilih acak)
export const WRONG_LINES: string[] = [
  "Kok salah, hmph bete deh.",
  "HIDUP JOKOWI eh salah babeeee.",
  "HAYOLOOO.",
];

// Setelah salah sebanyak MAX_STRIKES kali dan Mimic menerkam
export const LUNGE_LINES: Say[] = [
  { text: "Yah gagal deh, yuk ulang.", mood: "surprised" },
];

// Mimic ketahuan dan bicara sebelum menghilang
export const REVEAL_MIMIC: Say[] = [
  { who: "MIMIC", text: "Kok bisa... kamu kenal dia sebaik itu...", mood: "mimic" },
  { who: "MIMIC", text: "Baiklah. Untuk kali ini, kamu menang.", mood: "mimic" },
];

// Avatar asli bicara setelah Mimic hilang
export const REVEAL_LINES: Say[] = [
  { text: "Tuh, Mimic-nya kabur. Berarti kamu beneran kenal aku.", mood: "happy" },
  { text: "Pintunya udah kebuka. Yuk keluar.", mood: "shy" },
];

export const REWARD_TITLE = "PINTU 2 TERBUKA";
export const REWARD_LINES: string[] = [
  "Something that make i feel safe arround u, how u remember small things about me, i feel seens, thankyou my lesbians GF.",
  "Makasih udah kenal aku sebaik ini.",
];
