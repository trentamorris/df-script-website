import type { BaseStar } from "./types";

/**
 * Sets up HiDPI / Retina device pixel ratio scaling on an HTML5 canvas.
 */
export function setupHiDpiCanvas(
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
): void {
  const dpr = window.devicePixelRatio || 1;
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.scale(dpr, dpr);
}

/**
 * Calculates mouse deflection force with a subtle cosmic swirling vector.
 */
export function calculateRepulsionForce(
  starX: number,
  starY: number,
  mouseX: number,
  mouseY: number,
  repelRadius: number,
  repelStrength: number,
  swirlAngle = 0.38
): { fx: number; fy: number } {
  const dx = starX - mouseX;
  const dy = starY - mouseY;
  const distSq = dx * dx + dy * dy;
  const radiusSq = repelRadius * repelRadius;

  if (distSq >= radiusSq || distSq === 0) {
    return { fx: 0, fy: 0 };
  }

  const dist = Math.sqrt(distSq);
  const force = (repelRadius - dist) / repelRadius;
  const angle = Math.atan2(dy, dx) + swirlAngle;

  return {
    fx: Math.cos(angle) * force * repelStrength,
    fy: Math.sin(angle) * force * repelStrength,
  };
}

/**
 * Updates star velocity and position with spring return and friction damping in-place.
 */
export function applySpringPhysics(
  star: BaseStar,
  targetX: number,
  targetY: number,
  fx: number,
  fy: number,
  spring: number,
  friction: number
): void {
  star.vx = (star.vx + fx + (targetX - star.x) * spring) * friction;
  star.vy = (star.vy + fy + (targetY - star.y) * spring) * friction;
  star.x += star.vx;
  star.y += star.vy;
}

/**
 * Renders a single glowing star particle to the canvas context.
 */
export function drawStarParticle(
  ctx: CanvasRenderingContext2D,
  star: BaseStar,
  alpha: number
): void {
  ctx.save();
  ctx.fillStyle = star.color;
  ctx.globalAlpha = alpha > 1 ? 1 : alpha < 0 ? 0 : alpha;

  if (star.hasGlow) {
    ctx.shadowColor = star.color;
    ctx.shadowBlur = star.size * 3.5;
  }

  ctx.beginPath();
  ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}
