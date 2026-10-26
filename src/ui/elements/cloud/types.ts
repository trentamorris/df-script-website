export interface BaseCloudParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  hasGlow: boolean;
}

export interface CloudLogoParticle extends BaseCloudParticle {
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
  neighbors?: CloudLogoParticle[];
}

export interface CloudLogoProps {
  text?: string;
  className?: string;
  repelRadius?: number;
  repelStrength?: number;
  triggerPulse?: number;
  enableVaporFilaments?: boolean;
  enableTransform?: boolean;
  minScale?: number;
  maxScale?: number;
  skipIntro?: boolean;
}

export interface CloudBackgroundProps {
  className?: string;
  repelStrength?: number;
  windSpeed?: number;
}
