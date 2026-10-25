import type { Say } from "./memories-data";

/* =====================================================================
 * TIPE DATA PESAN SUARA
 * ===================================================================== */

export type VoiceMood =
  | "happy"
  | "shy"
  | "neutral"
  | "surprised";

export type VoiceLine = {
  at: number;
  text: string;
  mood: VoiceMood;
};

export type VoiceData = {
  src: string;
  seconds: number;
  lines: VoiceLine[];
};

/* =====================================================================
 * PESAN SUARA
 * ===================================================================== */

export const VOICE: VoiceData = {
  src: "audio/pesansuara.mp4",

  // Digunakan jika audio gagal dimuat dan berpindah ke mode simulasi teks.
  // Subtitle terakhir dimulai pada detik ke-245.
  seconds: 250,

  lines: [
    {
      at: 0,
      text: "Halo...",
      mood: "happy",
    },

    {
      at: 3,
      text: "Congratulation!!! Kalau kamu denger suara aku, berarti apa artinya??",
      mood: "happy",
    },

    {
      at: 8,
      text: "Kamu sudah menamatkan gamenya. CONGRATULATIONSSSS, LETSGOOOOO!",
      mood: "happy",
    },

    {
      at: 15,
      text: "Happy birthday of course. Once again ya babe, happy birthday to you.",
      mood: "happy",
    },

    {
      at: 20,
      text: "Selamat ulang tahun sayang. Selamat ulang tahun ya.",
      mood: "shy",
    },

    {
      at: 25,
      text: "Aku mau minta maaf dulu, karena aplikasinya baru kelar semingguan.",
      mood: "shy",
    },

    {
      at: 32,
      text: "Dan aku baru ngirim ini seminggu setelah birthday kamu.",
      mood: "shy",
    },

    {
      at: 40,
      text: "Dan juga aku minta maaf, aku belum bisa hadir ke Bekasi. Someday yaaa.",
      mood: "neutral",
    },

    {
      at: 60,
      text: "Selamat ulang tahun babe. Awesome banget kamu sekarang sudah umur 20 tahun.",
      mood: "happy",
    },

    {
      at: 72,
      text: "Aku berdoa buat kamu. Semoga diberikan kesehatan dan kesabaran menjalani hidup.",
      mood: "neutral",
    },

    {
      at: 80,
      text: "Semoga hari-hari kamu jadi lebih baik lagi.",
      mood: "neutral",
    },

    {
      at: 85,
      text: "I hope the world will be kind to you, and you become even prettier than usual.",
      mood: "happy",
    },

    {
      at: 92,
      text: "I hope you smile more and enjoy your life, your work, and every decision you make.",
      mood: "happy",
    },

    {
      at: 99,
      text: "And I hope you'll be fine, no matter how hard the world can be.",
      mood: "neutral",
    },

    {
      at: 109,
      text: "I hope you'll always be nice to yourself. Please never doubt yourself, babe.",
      mood: "shy",
    },

    {
      at: 119,
      text: "And wherever you feel you need help, please don't keep it all to yourself.",
      mood: "neutral",
    },

    {
      at: 123,
      text: "And if you want someone to talk to, feel free to call me babe. I'll be there for you.",
      mood: "happy",
    },

    {
      at: 140,
      text: "I want to say that I love you, and thank you for staying in my life.",
      mood: "shy",
    },

    {
      at: 151,
      text: "And thank you for becoming my girl. Walaupun HTS. HAHAHAH.",
      mood: "surprised",
    },

    {
      at: 159,
      text: "I don't care. I love you and I feel safe around you.",
      mood: "shy",
    },

    {
      at: 171,
      text: "You make me stronger. Kamu juga selalu mau dengerin kekurangan aku.",
      mood: "shy",
    },

    {
      at: 178,
      text: "Kamu buat aku nyaman sayang. Love you.",
      mood: "shy",
    },

    {
      at: 179,
      text: "Bahkan di fase terendah aku, kamu tetap ada.",
      mood: "shy",
    },

    {
      at: 188,
      text: "Dan...",
      mood: "neutral",
    },

    {
      at: 192,
      text: "Aku berharap kita tetap bareng sampai suatu hari nanti kita benar-benar bersama.",
      mood: "shy",
    },

    {
      at: 202,
      text: "Let's hope it. Hahahaha.",
      mood: "happy",
    },

    {
      at: 207,
      text: "Disaat kita ada konflik, just make sure kita komunikasikan yaaaa.",
      mood: "neutral",
    },

    {
      at: 219,
      text: "TUH KAN JADI NGELANTURRRR HUAAAAA.",
      mood: "surprised",
    },

    {
      at: 223,
      text: "Aku ga terbiasa word of affirmation huaaaaa.",
      mood: "surprised",
    },

    {
      at: 232,
      text: "Once again babe...",
      mood: "happy",
    },

    {
      at: 236,
      text: "HAPPYYYYY BIRTHDAYYYYYYYYYY!",
      mood: "happy",
    },

    {
      at: 238,
      text: "Happy Birthday my favorite lesbian.",
      mood: "happy",
    },

    {
      at: 242,
      text: "HAPPY BIRTHDAYYYY BABAYYYYY ❤️",
      mood: "happy",
    },
  ],
};

/* =====================================================================
 * DIALOG PEMBUKA
 * ===================================================================== */

export const VOICE_INTRO: Say[] = [
  {
    text: "Satu lagi, babe. Yang ini bukan dari mesin gacha.",
    mood: "shy",
  },
  {
    text: "Pakai headset kalau bisa ya. Klik kasetnya.",
    mood: "happy",
  },
];

/* =====================================================================
 * UI TEXT
 * ===================================================================== */

export const HINT_PLAY = "KLIK KASET UNTUK MEMUTAR";
export const BTN_REPLAY = "↻ PUTAR ULANG";
export const BTN_NEXT = "LANJUT ▶";

/* =====================================================================
 * DEV WARNING
 * ===================================================================== */

const left = VOICE.lines.filter((line) =>
  line.text.includes("[GANTI]")
).length;

if (left > 0) {
  console.warn(
    `[VoiceNote] Masih ada ${left} teks [GANTI] di voice-data.ts`
  );
}