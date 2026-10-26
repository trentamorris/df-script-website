// Cotton Candy Cloud & Pastel Twilight Palette:
// Sunlit golden whites, warm peach highlights, creamy bubblegum pink,
// soft cotton candy rose, dreamy lilac lavender, and atmospheric sky blue.
export const COTTON_CANDY_PALETTE: readonly string[] = [
  "#ffffff", // pure sunlit cloud crest
  "#fff8f6", // warm cream cloud top
  "#fef2f2", // rose white
  "#fce7f3", // pastel pink 100
  "#fbcfe8", // soft pink 200
  "#f472b6", // warm cotton candy pink
  "#e879f9", // twilight fuchsia-lavender
  "#c084fc", // lilac shadow 400
  "#a855f7", // deeper cloud crevice purple
  "#bae6fd", // sky-blue rim refraction
  "#e0f2fe", // airy cerulean mist
];

export function getRandomCloudColor(): string {
  const index = Math.floor(Math.random() * COTTON_CANDY_PALETTE.length);
  return COTTON_CANDY_PALETTE[index];
}
