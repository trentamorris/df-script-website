// Sea foam & Oceanic palette:
// Translucent bubbly whites, seafoam greens, icy aquamarines, and bioluminescent cyans
export const SEA_FOAM_PALETTE: readonly string[] = [
  "#ffffff",
  "#ffffff",
  "#f0fdfa", // crisp seafoam 50
  "#ccfbf1", // seafoam 100
  "#99f6e4", // light turquoise 200
  "#5eead4", // bioluminescent teal 300
  "#2dd4bf", // ocean cyan 400
  "#e0f2fe", // arctic sky foam
  "#bae6fd", // ocean spray light blue
  "#7dd3fc", // azure crest
];

export function getRandomFoamColor(): string {
  const index = Math.floor(Math.random() * SEA_FOAM_PALETTE.length);
  return SEA_FOAM_PALETTE[index];
}
