// Universal spectral star palette:
// Luminous core whites, electric blues, cyan starlight, and warm stellar amber/gold dust
export const COSMIC_STAR_PALETTE: readonly string[] = [
  "#ffffff",
  "#ffffff",
  "#eff6ff",
  "#dbeafe",
  "#bfdbfe",
  "#93c5fd",
  "#60a5fa",
  "#fef08a", // warm stellar amber
  "#fed7aa", // warm interstellar dust
  "#fbcfe8", // soft ionized nebula tint
];

export function getRandomStarColor(): string {
  const index = Math.floor(Math.random() * COSMIC_STAR_PALETTE.length);
  return COSMIC_STAR_PALETTE[index];
}
