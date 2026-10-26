import type { BaseBubble } from "./types";

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
 * Calculates hydrodynamic fluid deflection force with a subtle vortex/eddy effect.
 */
export function calculateFluidRepulsionForce(
  bubbleX: number,
  bubbleY: number,
  mouseX: number,
  mouseY: number,
  repelRadius: number,
  repelStrength: number,
  swirlAngle = 0.45
): { fx: number; fy: number } {
  const dx = bubbleX - mouseX;
  const dy = bubbleY - mouseY;
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
 * Updates bubble velocity and position with fluid buoyancy/spring physics in-place.
 */
export function applyFluidPhysics(
  bubble: BaseBubble,
  targetX: number,
  targetY: number,
  fx: number,
  fy: number,
  springK = 0.045,
  friction = 0.88
): void {
  const springX = (targetX - bubble.x) * springK;
  const springY = (targetY - bubble.y) * springK;

  bubble.vx = (bubble.vx + springX + fx) * friction;
  bubble.vy = (bubble.vy + springY + fy) * friction;

  bubble.x += bubble.vx;
  bubble.y += bubble.vy;
}

/**
 * Draws a sea foam bubble with luminous fluid rim, subtle specular highlight, and soft glow.
 */
export function drawFoamBubble(
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
    ctx.shadowBlur = size * 3;
    ctx.shadowColor = color;
  }

  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, Math.max(0.6, size), 0, Math.PI * 2);
  ctx.fill();

  // Subtle interior specular bubble highlight for bubbles >= 2px
  if (size >= 2) {
    ctx.fillStyle = "rgba(255, 255, 255, 0.75)";
    ctx.beginPath();
    ctx.arc(x - size * 0.3, y - size * 0.3, size * 0.32, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}
