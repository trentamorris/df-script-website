export interface Particle {
  x: number;
  y: number;
  baseX: number;
  baseY: number;
  vx: number;
  vy: number;
}

export interface MouseState {
  x: number;
  y: number;
  active: boolean;
}

export interface MagneticParticlesProps {
  spacing?: number;
  forceRadius?: number;
  ease?: number;
  friction?: number;
  repelStrength?: number;
}
