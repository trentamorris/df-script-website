import React from "react";
import type { GalaxyLogoStar, GalaxyLogoProps } from "./types";
import { getRandomStarColor } from "./constants";
import {
  calculateRepulsionForce,
  applySpringPhysics,
  drawStarParticle,
  setupHiDpiCanvas,
} from "./utils";
import { useCanvasMouse } from "./useCanvasMouse";

export function GalaxyLogo({
  text = "df-script",
  className = "",
  repelRadius = 90,
  repelStrength = 0.6,
}: GalaxyLogoProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const mouseStateRef = useCanvasMouse(canvasRef, true);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    const stars: GalaxyLogoStar[] = [];

    const initScene = () => {
      const rect = container.getBoundingClientRect();
      const width = Math.max(rect.width, 360);
      const height = Math.max(rect.height, 120);

      setupHiDpiCanvas(canvas, ctx, width, height);

      // Create an offscreen canvas to sample text pixel positions accurately
      const offscreen = document.createElement("canvas");
      offscreen.width = width;
      offscreen.height = height;
      const offCtx = offscreen.getContext("2d");
      if (!offCtx) return;

      let fontSize = Math.min(Math.round(height * 0.72), 96);
      offCtx.font = `700 ${fontSize}px Outfit, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
      const textWidth = offCtx.measureText(text).width;
      const targetMaxWidth = width * 0.92;

      if (textWidth > targetMaxWidth) {
        fontSize = Math.floor(fontSize * (targetMaxWidth / textWidth));
        offCtx.font = `700 ${fontSize}px Outfit, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
      }

      offCtx.textAlign = "center";
      offCtx.textBaseline = "middle";
      offCtx.fillStyle = "#ffffff";
      offCtx.fillText(text, width / 2, height / 2 + 2);

      const imgData = offCtx.getImageData(0, 0, width, height);
      const data = imgData.data;

      stars.length = 0;

      // Crisp 3px sampling grid
      const step = 3;
      for (let y = 0; y < height; y += step) {
        for (let x = 0; x < width; x += step) {
          const index = (y * width + x) * 4;
          const alpha = data[index + 3];

          if (alpha > 35) {
            const originX = x + (Math.random() - 0.5) * 1.4;
            const originY = y + (Math.random() - 0.5) * 1.4;
            const isBrightStar = Math.random() < 0.15;

            stars.push({
              originX,
              originY,
              x: originX,
              y: originY,
              vx: 0,
              vy: 0,
              size: isBrightStar ? 1.6 + Math.random() * 1.3 : 0.8 + Math.random() * 0.9,
              baseAlpha: isBrightStar ? 0.95 + Math.random() * 0.05 : 0.45 + (alpha / 255) * 0.5,
              color: getRandomStarColor(),
              hasGlow: isBrightStar,
              phase: Math.random() * Math.PI * 2,
              speed: 0.02 + Math.random() * 0.03,
              driftRadius: 0.35 + Math.random() * 0.55,
              glistenIntensity: 0,
            });
          }
        }
      }

      // Ambient cosmic stardust around the letters
      const ambientCount = Math.floor(stars.length * 0.06);
      for (let i = 0; i < ambientCount; i++) {
        const ref = stars[Math.floor(Math.random() * stars.length)];
        if (!ref) continue;
        const angle = Math.random() * Math.PI * 2;
        const dist = 5 + Math.random() * 16;

        stars.push({
          originX: ref.originX + Math.cos(angle) * dist,
          originY: ref.originY + Math.sin(angle) * dist,
          x: ref.originX,
          y: ref.originY,
          vx: 0,
          vy: 0,
          size: 0.5 + Math.random() * 0.7,
          baseAlpha: 0.18 + Math.random() * 0.25,
          color: Math.random() < 0.5 ? "#93c5fd" : "#ffffff",
          hasGlow: false,
          phase: Math.random() * Math.PI * 2,
          speed: 0.015 + Math.random() * 0.02,
          driftRadius: 0.7 + Math.random() * 0.8,
          glistenIntensity: 0,
        });
      }
    };

    initScene();

    const handleResize = () => initScene();
    window.addEventListener("resize", handleResize);

    let time = 0;
    let ticksSinceLastGlisten = 0;
    let nextGlistenInterval = 80 + Math.random() * 120; // glistens every 1.5 - 3.5s

    const render = () => {
      time += 0.025;
      ticksSinceLastGlisten++;

      // Trigger a random glisten flare on a prominent star
      if (stars.length > 0 && ticksSinceLastGlisten > nextGlistenInterval) {
        ticksSinceLastGlisten = 0;
        nextGlistenInterval = 90 + Math.random() * 150;
        const luckyIndex = Math.floor(Math.random() * stars.length);
        if (stars[luckyIndex]) {
          stars[luckyIndex].glistenIntensity = 1.0;
        }
      }

      const rect = container.getBoundingClientRect();
      const width = Math.max(rect.width, 360);
      const height = Math.max(rect.height, 120);

      ctx.clearRect(0, 0, width, height);

      const { mouseX, mouseY, isHovered } = mouseStateRef.current;
      const len = stars.length;

      for (let i = 0; i < len; i++) {
        const p = stars[i];

        // Cosmic drift target
        const targetX = p.originX + Math.cos(time * p.speed + p.phase) * p.driftRadius;
        const targetY = p.originY + Math.sin(time * p.speed + p.phase) * p.driftRadius;

        // Dispersion force calculation
        const force = isHovered
          ? calculateRepulsionForce(p.x, p.y, mouseX, mouseY, repelRadius, repelStrength * 16, 0.38)
          : { fx: 0, fy: 0 };

        applySpringPhysics(p, targetX, targetY, force.fx, force.fy, 0.07, 0.84);

        // Decay glisten flare
        if (p.glistenIntensity > 0) {
          p.glistenIntensity -= 0.035;
          if (p.glistenIntensity < 0) p.glistenIntensity = 0;
        }

        // Twinkle factor & draw
        const twinkle = 0.88 + 0.12 * Math.sin(time * 1.6 + p.phase);
        const effectiveAlpha = Math.min(1, p.baseAlpha * twinkle + p.glistenIntensity * 0.7);

        drawStarParticle(ctx, p, effectiveAlpha);

        // If glisten is active, draw a refined 4-pointed diamond glint
        if (p.glistenIntensity > 0.1) {
          const flareSize = p.size * (3 + p.glistenIntensity * 4.5);
          ctx.save();
          ctx.strokeStyle = "#ffffff";
          ctx.lineWidth = 1;
          ctx.globalAlpha = p.glistenIntensity * 0.85;

          // Cross glint arms
          ctx.beginPath();
          ctx.moveTo(p.x - flareSize, p.y);
          ctx.lineTo(p.x + flareSize, p.y);
          ctx.moveTo(p.x, p.y - flareSize);
          ctx.lineTo(p.x, p.y + flareSize);
          ctx.stroke();

          // Subtle diagonal secondary flare
          const diag = flareSize * 0.45;
          ctx.lineWidth = 0.7;
          ctx.beginPath();
          ctx.moveTo(p.x - diag, p.y - diag);
          ctx.lineTo(p.x + diag, p.y + diag);
          ctx.moveTo(p.x + diag, p.y - diag);
          ctx.lineTo(p.x - diag, p.y + diag);
          ctx.stroke();
          ctx.restore();
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };


    render();

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [text, repelRadius, repelStrength, mouseStateRef]);

  return (
    <div
      ref={containerRef}
      className={`relative w-full max-w-2xl h-24 sm:h-32 md:h-36 flex items-center justify-center select-none ${className}`}
    >
      <canvas ref={canvasRef} className="w-full h-full cursor-pointer block" />
    </div>
  );
}
