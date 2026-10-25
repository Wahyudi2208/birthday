/* =====================================================================
 *  ISI APP DISCORD (adegan terakhir)
 *  Cukup edit file ini. Tidak perlu menyentuh Discord.tsx.
 *  Semua tulisan bertanda [GANTI] adalah PLACEHOLDER: adegannya sudah
 *  bisa dijalankan, tinggal kamu ganti isinya dengan kata-katamu sendiri.
 *  (Kalau masih ada [GANTI] yang tersisa, console browser menampilkan peringatan.)
 *
 *  ALUR ADEGAN
 *    1. Layar "Menghubungkan..." lalu "Terhubung"
 *    2. Dua avatar berdiri saling menghadap. Mereka ngobrol lewat BUBBLE
 *       di atas kepala (SCRIPT). Klik layar untuk lanjut ke bubble berikutnya.
 *    3. Kalau sebuah bubble punya  memory:  maka setelah teksnya selesai,
 *       kata kuncinya menyala, layar membeku dan meredup, lalu muncul
 *       "potongan memori": foto, judul lagu, dan lirik baris per baris.
 *       Setelah itu obrolan lanjut ke bubble berikutnya.
 *    4. Setelah bubble terakhir, muncul kartu penutup (ENDING).
 *
 *  CARA MENGUBAH OBROLAN  (SCRIPT)
 *    Satu baris { who: "...", text: "..." } = satu bubble.
 *      who: "architect" -> avatar cowok (kiri)
 *           "kamu"      -> avatar cewe (kanan)
 *      text: isi bubble. USAHAKAN MAKS ~40 HURUF per bubble.
 *            Kalimat panjang? Pecah jadi beberapa baris (bubble) berurutan.
 *    Tambah bubble : copy satu baris lengkap dengan koma, tempel di bawahnya.
 *    Hapus bubble  : hapus satu baris utuh.
 *    Urutan        : dari baris paling ATAS sampai paling BAWAH.
 *    Saran: pakai kutipan chat asli kalian, supaya dia langsung mengenalinya.
 *
 *  CARA MEMUNCULKAN LAGU DI KATA TERTENTU
 *    Tambahkan dua hal di baris bubble-nya:
 *      key:    "aku ngertiin kamu"   -> potongan kata yang menyala. HARUS persis
 *                                       sama dengan sebagian isi text (huruf besar/kecil sama).
 *      memory: "memori-1"            -> nama memori di daftar MEMORIES di bawah.
 *    Contoh:
 *      { who: "architect", text: "Aku ngertiin kamu, kok.", key: "ngertiin kamu", memory: "memori-1" },
 *    Tidak mau ada lagu di bubble itu? Hapus key dan memory.
 *
 *  CARA MENAMBAH / MENGUBAH LAGU  (MEMORIES)
 *    Satu blok = satu potongan memori. Nama blok ("memori-1") bebas, asal
 *    sama dengan yang ditulis di  memory:  pada SCRIPT.
 *      title   : judul lagu (diketik di layar)
 *      artist  : nama penyanyi
 *      src     : file mp3 di folder public/audio/, contoh "audio/perfect.mp3".
 *                Kosongkan ("") untuk tes: yang terdengar melodi chiptune sementara,
 *                lirik tetap berjalan sesuai jam. Kalau file tidak ketemu, otomatis begitu juga.
 *      from    : (opsional) mulai dari detik ke-berapa di mp3. Contoh 62 = mulai di menit 1:02.
 *                Dipakai supaya langsung ke bagian reff tanpa harus memotong file.
 *      seconds : berapa detik potongan memori ini berlangsung (WAJIB, contoh 25).
 *                Setelah waktu ini habis, lagu fade out dan obrolan lanjut.
 *      photo   : (opsional) foto kenangan, taruh di public/photos/, contoh "photos/discord-1.jpg".
 *                Kosong / file hilang = muncul kotak "FOTO" sebagai pengganti.
 *      caption : (opsional) tulisan kecil di bawah foto.
 *      variant : (opsional) 0 sampai 6 = pilihan melodi sementara kalau src kosong.
 *      lines   : LIRIK yang ditampilkan. Satu baris { at: detik, text: "..." }.
 *                at = detik ke berapa baris itu muncul, dihitung SEJAK potongan mulai
 *                (bukan sejak awal mp3). Dengarkan lagunya lalu catat waktunya.
 *
 *  SARAN SOAL LIRIK & HAK CIPTA
 *    Cukup 1 sampai 2 baris reff per lagu. Jangan mengetik lirik penuh.
 *    Dan jangan sebar link website ini ke orang lain, karena file mp3 lagu artis ikut ter-host.
 *
 *  HATI-HATI SAAT MENGETIK
 *    - Teks harus di dalam tanda kutip "..."
 *    - Kalau teksmu mengandung tanda kutip, tulis dengan \"  atau pakai '...'
 *    - Setiap baris / blok diakhiri koma
 * ===================================================================== */

export type Who = "architect" | "kamu";
export type Beat = {
  who: Who;
  text: string;
  key?: string; // potongan kata di text yang menyala saat memicu memori
  memory?: string; // nama memori di MEMORIES, diputar setelah bubble ini selesai
};
export type Memory = {
  title: string;
  artist: string;
  src: string;
  from?: number;
  seconds: number;
  photo?: string;
  caption?: string;
  variant?: number;
  lines: { at: number; text: string }[];
};

// ---- Nama yang tampil di bawah masing-masing avatar ----
export const NAMES: Record<Who, string> = {
  architect: "THE ARCHITECT",
  kamu: "Ruby",
};

// ---- Nama channel di bagian atas layar ----
export const CHANNEL = "ruang-ngobrol";

// ---- Layar pembuka ----
export const CONNECT = { connecting: "MENGHUBUNGKAN...", connected: "TERHUBUNG" };

// ---- Obrolan ----
export const SCRIPT: Beat[] = [
  { who: "architect", text: "Halooo, yuk pindah ke discord, tempat kita sering voice chat." },
  { who: "kamu", text: "Iya ayokkk, Hmm kita mau ngobrolin apa??." },
  { who: "architect", text: "Hmm bahas apa ya yajugaa, oiya dulu kita ternyata matching ya our taste music." },
  { who: "kamu", text: "Iya lagi, dulu aku nanya artis favorite kamu, trus kamu jawab kamu suka laufey(sesuailah sama orangnya)." },
  { who: "architect", text: "Haha betulll, aku paling suka lagu Valentine.", key: "Valentine", memory: "memori-1"},
  { who: "kamu", text: "Laufey bingits nih yee." },
  { who: "architect", text: "Ya dongg, kan aku soft boy, sop buntut." },
  { who: "kamu", text: "kalo aku suka lagu Rayuan Perempuan Gila.", key: "Rayuan Perempuan Gila", memory: "memori-2" },
  { who: "architect", text: "And aku juga selalu merhatiin repost an kamu, notes kamu, ya hanya untuk tau apakah kamu lagi baik baik aja." },
];

// ---- Potongan memori (lagu + foto + lirik) ----
export const MEMORIES: Record<string, Memory> = {
  "memori-1": {
    title: "Valentine",
    artist: "Laufey",
    src: "audio/valentine.mp3", // contoh nanti: "audio/lagu-discord-1.mp3"
    from: 0,
    seconds: 50,
    photo: "photos/laufey.jpg",
    caption: "My Valentine",
    variant: 3,
    lines: [
      { at: 1, text: "After almost i never fall for a girl, idk why i fall for u at the first time" },
      { at: 5, text: "and suddenly i know that u my valentine" },
    ],
  },
  "memori-2": {
    title: "Rayuan Perempuan Gila",
    artist: "Nadin Amizah",
    src: "audio/nadin2.mp3",
    seconds: 14,
    photo: "photos/nadin.jpg",
    caption: "My Lovely Lesbians",
    variant: 4,
    lines: [
      { at: 2, text: "I know u like this song because u always doubt ur self and feel dont deserved to be love" },
      { at: 7, text: "But I came to show u that, u deserve to be loved and i love you" },
    ],
  },
};

// ---- Kartu penutup (setelah obrolan terakhir) ----
export const ENDING = {
  title: "U deserve to be loved babe",
  lines: ["And wherever u doubt urself, remember that i will be loving u."],
  button: "KEMBALI KE HOME",
};
