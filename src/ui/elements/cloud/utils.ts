import type { BaseCloudParticle } from "./types";

/**
 * Sets up HiDPI / Retina device pixel ratio scaling on an HTML5 canvas.
 */
export function setupHiDpiCanvas(
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
): void {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.floor(width * dpr);
  canvas.height = Math.floor(height * dpr);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.scale(dpr, dpr);
}

/**
 * Calculates aerodynamic wind & cursor repulsion force with soft vapor dispersion.
 */
export function calculateVaporRepulsionForce(
  particleX: number,
  particleY: number,
  mouseX: number,
  mouseY: number,
  repelRadius: number,
  repelStrength: number,
  swirlAngle = 0.35
): { fx: number; fy: number } {
  const dx = particleX - mouseX;
  const dy = particleY - mouseY;
  const distSq = dx * dx + dy * dy;
  const radiusSq = repelRadius * repelRadius;

  if (distSq >= radiusSq || distSq === 0) {
    return { fx: 0, fy: 0 };
  }

  const dist = Math.sqrt(distSq);
  const force = Math.pow((repelRadius - dist) / repelRadius, 1.4);
  const angle = Math.atan2(dy, dx) + swirlAngle;

  return {
    fx: Math.cos(angle) * force * repelStrength,
    fy: Math.sin(angle) * force * repelStrength,
  };
}

/**
 * Updates cloud vapor particle velocity and position with soft floating physics in-place.
 */
export function applyVaporPhysics(
  particle: BaseCloudParticle,
  targetX: number,
  targetY: number,
  fx: number,
  fy: number,
  springK = 0.038,
  friction = 0.89
): void {
  const springX = (targetX - particle.x) * springK;
  const springY = (targetY - particle.y) * springK;

  particle.vx = (particle.vx + springX + fx) * friction;
  particle.vy = (particle.vy + springY + fy) * friction;

  particle.x += particle.vx;
  particle.y += particle.vy;
}

/**
 * Draws an ethereal cloud puff particle with soft volumetric gradient and halo.
 */
export function drawCloudParticle(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  color: string,
  alpha: number,
  hasGlow: boolean
): void {
  if (alpha <= 0.01) return;

  ctx.save();
  ctx.globalAlpha = Math.min(1, Math.max(0, alpha));

  if (hasGlow && size > 1.2) {
    ctx.shadowBlur = size * 3.5;
    ctx.shadowColor = color;
  }

  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, Math.max(0.6, size), 0, Math.PI * 2);
  ctx.fill();

  // Soft internal sunlit cream sheen for prominent cloud puffs
  if (size >= 2.2) {
    ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
    ctx.beginPath();
    ctx.arc(x - size * 0.25, y - size * 0.25, size * 0.35, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}
