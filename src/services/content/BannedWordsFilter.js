export const BANNED_PHRASES = [
  "Menariknya,",
  "Yuk,",
  "Siapa sangka,",
  "Ternyata,",
  "Tahukah kamu?",
  "Kesimpulannya,",
  "Secara keseluruhan,",
  "Tidak bisa dipungkiri"
];

export function hasBannedWords(text) {
  if (!text) return false;
  const lowerText = text.toLowerCase();
  
  for (const phrase of BANNED_PHRASES) {
    if (lowerText.includes(phrase.toLowerCase())) {
      return true;
    }
  }
  return false;
}
