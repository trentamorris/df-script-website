export interface BaseStar {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  hasGlow: boolean;
}

export interface GalaxyLogoStar extends BaseStar {
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
  projX?: number;
  projY?: number;
  projZ?: number;
  projScale?: number;
  baseAlpha: number;
  phase: number;
  speed: number;
  driftRadius: number;
  glistenProgress?: number;
  glistenDuration?: number;
  glistenScale?: number;
}

export interface GalaxyBgStar extends BaseStar {
  baseX: number;
  baseY: number;
  radius: number;
  armAngle: number;
  orbitalSpeed: number;
  alpha: number;
  phase: number;
  glistenProgress?: number;
  glistenDuration?: number;
}


export interface NebulaCloud {
  xFactor: number;
  yFactor: number;
  baseRadius: number;
  colorStop0: string;
  colorStop1: string;
  phase: number;
  driftSpeed: number;
}

export interface GalaxyLogoProps {
  text?: string;
  className?: string;
  repelRadius?: number;
  repelStrength?: number;
  triggerPulse?: number;
}

export interface ShootingStar {
  x: number;
  y: number;
  dx: number;
  dy: number;
  length: number;
  speed: number;
  thickness: number;
  alpha: number;
  maxAlpha: number;
  life: number;
  maxLife: number;
  color: string;
  isBolide?: boolean;
}

export interface GalaxyBackgroundProps {
  spiralArms?: number;
  starCount?: number;
  repelRadius?: number;
  repelStrength?: number;
  rotationSpeed?: number;
  className?: string;
  enableShootingStars?: boolean;
  enableNebula?: boolean;
}


