/* =====================================================================
 *  FILE INI ADALAH TEMPAT KAMU MENGISI SEMUA ISI ALBUM KENANGAN (TikTok).
 *  Kamu cukup mengedit file ini. Tidak perlu menyentuh Memories.tsx.
 *
 *  CARA MENAMBAH FOTO
 *    1. Taruh fotomu di folder  public/photos/
 *    2. Beri nama sederhana, contoh: moment-1.jpg, moment-2.jpg ...
 *    3. Di momen yang sesuai, isi  photo: "photos/moment-1.jpg"
 *       (tanpa "public/" di depannya, dan huruf besar/kecil harus sama)
 *    Kalau fotonya belum ada, buku menampilkan kotak "FOTO 1" sebagai
 *    pengganti, jadi tidak error.
 *
 *  CARA MENAMBAH MUSIK
 *    1. Taruh mp3 di folder  public/audio/
 *    2. Isi  music: "audio/nama-lagu.mp3"  di momen yang sesuai
 *    Musik berganti otomatis (fade in/out) tiap ganti halaman.
 *    Kalau file mp3 belum ada, yang terdengar melodi chiptune sementara.
 *    Ingin tanpa musik tambahan di satu momen? Biarkan music: "" (kosong).
 *
 *  CARA MENAMBAH / MENGHAPUS MOMEN
 *    - Tambah  : copy satu blok { ... }, lengkap dengan koma di ujungnya,
 *                tempel di bawah blok terakhir, lalu ganti isinya.
 *    - Hapus   : hapus satu blok { ... } utuh.
 *    - Urutan  : album dibuka dari momen paling ATAS sampai paling BAWAH.
 *                Susun dari yang paling lama ke yang paling baru.
 *
 *  CARA MENGUBAH UCAPAN AVATAR  (bagian "says")
 *    Tiap momen punya daftar ucapan. Satu ucapan = satu kotak dialog.
 *    Tambah ucapan: copy satu baris { text: "...", mood: "..." }, tempel di bawahnya.
 *    "mood" = ekspresi wajah avatar saat mengucapkannya. Pilihan:
 *         "neutral"   -> tenang
 *         "happy"     -> senang
 *         "shy"       -> malu
 *         "surprised" -> kaget
 *    Mood boleh dihilangkan (otomatis "neutral").
 *
 *  HATI-HATI SAAT MENGETIK
 *    - Teks harus di dalam tanda kutip "..."
 *    - Kalau teksmu mengandung tanda kutip, tulis dengan \"  atau pakai '...'
 *    - Setiap baris / blok diakhiri koma
 * ===================================================================== */

export type Mood = "neutral" | "happy" | "shy" | "surprised" | "mimic"; // "mimic" khusus ruangan The Mimic
export type Say = { text: string; mood?: Mood; who?: string }; // who = nama di kotak dialog (opsional)
export type Moment = {
  date: string; // tulisan di halaman kanan (bebas, contoh "25 Januari 2025")
  title: string; // judul momen
  photo: string; // lokasi foto di folder public/
  caption: string; // deskripsi singkat di halaman kanan
  music: string; // lokasi mp3 di folder public/ ("" = pakai melodi sementara)
  says: Say[]; // ucapan avatar saat halaman ini terbuka
};

// Nama yang tampil di kotak dialog
export const SPEAKER = "THE ARCHITECT";

// Musik saat pembukaan (sebelum halaman pertama terbuka). "" = melodi sementara.
export const INTRO_MUSIC = "";

// Ucapan pembuka, sebelum halaman pertama
export const INTRO_SAYS: Say[] = [
  { text: "Ini album kenangan kita, babe. Aku susun dari yang paling awal sampai yang terbaru.", mood: "happy" },
  { text: "Pelan-pelan aja ya, Kita buka satu-satu.", mood: "shy" },
];

// ---- ISI MOMEN (GANTI SEMUA TULISAN "[GANTI]" ) ----
export const MOMENTS: Moment[] = [
  {
    date: "23 January 2026",
    title: "Pertama Ketemu",
    photo: "photos/moment-1.png",
    caption: "Pertama kali kita ketemu di Survive Bikini Bottom, Roblox., EMM aku ga terlalu inget sih detail nya, cuman yang aku inget, kamu nub banget HAHAHAH",
    music: "audio/moment-1.mp3",
    says: [
      { text: "Momen pertama: waktu kita ketemu di game itu.", mood: "neutral" },
      { text: "Abis itu kita pindah ke map cozy.", mood: "happy" },
    ],
  },
  {
    date: "23 Maret 2026",
    title: "When life gave u tangerines",
    photo: "photos/moment-2.jpg",
    caption: "Moment Awal kedeketan kita makin intens, aku cukup kaget sih, kamu suka banget sama film ini, I think i know why. BECAUSE U LESBIANS",
    music: "audio/moment-2.mp3",
    says: [
      { text: "Disini entah mengapa kamu seneng banget saat aku bilang nonton Film yang kamu rekomendasiin", mood: "surprised" },
      { text: "Tapi berkat moment ini juga kita makin dekat, muachhhh.", mood: "shy" },
    ],
  },
  {
    date: "30 Maret 2026",
    title: "Konten pertama kita di Tiktok",
    photo: "photos/moment-3.png",
    caption: "Ciyud Ngaburuyud. Aku inget banget lagi, orang orang pada nanyain kamu, (itu cewe cakep banget Yud), Go public ni yeee, semua orang kaget hahaha, mereka ga espek kita bakal sedeket ini",
    music: "audio/moment-3.mp3",
    says: [
      { text: "Moment pertama kita mulai go public, HTS JAYA JAYA.", mood: "happy" }
    ],
  },
  {
    date: "7 April 2026",
    title: "Sakit aku kambuh",
    photo: "photos/moment-4.jpeg",
    caption: "In Another life?? Moment dimana aku lagi di fase terendah dalam hidup aku, dimana sakit yang aku derita dari dulu kambuh dan aku bener bener alone sebelumnya, gada yang pernah tau aku sakit, but, with u i could finally feels safe, I love u babe",
    music: "audio/moment-4.mp3",
    says: [{ text: "Disini aku mulai fall deeper, karna cuman kamu orang yang aku ceritain tentang sakit aku.", mood: "neutral" }],
  },
  {
    date: "26 Agustus 2026",
    title: "Confession",
    photo: "photos/moment-5.jpg",
    caption: "Kita sempat break, sebelum akhirnya balikan, HTS JAYA JAYA. And until now, i'm still loving you, and here we are, we celebrate ur birthday, even though the best gift is if i show up di Bekasi sambil ngangetin kamu, tpi belum kesampaian, Someday yaaaa",
    music: "audio/moment-5.mp3",
    says: [
      { text: "Well, Here we are babe.", mood: "shy" },
      { text: "Dan sampai hari ini, aku masih di sini.", mood: "happy" },
    ],
  },
];

// Hadiah setelah momen terakhir (tiap string = satu paragraf)
export const REWARD_TITLE = "HAPPY BIRTHDAY!";
export const REWARD_LINES: string[] = [
  "And just so u know, i love u more than ever, tapi ga diatas Ada wong sih.",
  "Terima kasih udah jadi bagian dari semua momen ini.",
];
