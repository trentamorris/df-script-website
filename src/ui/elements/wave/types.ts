export interface BaseBubble {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  hasGlow: boolean;
}

export interface WaveLogoBubble extends BaseBubble {
  originX: number;
  originY: number;
  originZ: number;
  localOffsetX: number;
  localOffsetY: number;
  z: number;
  startX: number;
  startY: number;
  startZ: number;
  buildDelay: number;
  buildDuration: number;
  baseAlpha: number;
  phase: number;
  wobbleSpeed: number;
  wobbleAmp: number;
  burstProgress?: number;
  burstDuration?: number;
  burstScale?: number;
  projX?: number;
  projY?: number;
  projZ?: number;
  projScale?: number;
  neighbors?: WaveLogoBubble[];
}

export interface WaveWaterParticle extends BaseBubble {
  baseX: number;
  baseY: number;
  waveOffset: number;
  amplitude: number;
  frequency: number;
  speed: number;
  alpha: number;
  phase: number;
  depth: number;
}

export interface CausticBand {
  yPosFactor: number;
  speed: number;
  thickness: number;
  color: string;
  phase: number;
  amplitude: number;
}

export interface WaveLogoProps {
  text?: string;
  className?: string;
  repelRadius?: number;
  repelStrength?: number;
  triggerPulse?: number;
  enableFilaments?: boolean;
  enableTransform?: boolean;
  minScale?: number;
  maxScale?: number;
  skipIntro?: boolean;
}

export interface WaveBackgroundProps {
  waveCount?: number;
  particleCount?: number;
  repelRadius?: number;
  repelStrength?: number;
  speed?: number;
  className?: string;
  enableCaustics?: boolean;
  enableFoamSpray?: boolean;
}
