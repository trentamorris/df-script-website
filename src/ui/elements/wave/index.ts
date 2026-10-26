export { WaveLogo } from "./WaveLogo";
export { WaveBackground } from "./WaveBackground";
export { SEA_FOAM_PALETTE, getRandomFoamColor } from "./constants";
export {
  setupHiDpiCanvas,
  calculateFluidRepulsionForce,
  applyFluidPhysics,
  drawFoamBubble,
} from "./utils";
export type {
  BaseBubble,
  WaveLogoBubble,
  WaveWaterParticle,
  WaveLogoProps,
  WaveBackgroundProps,
  CausticBand,
} from "./types";
