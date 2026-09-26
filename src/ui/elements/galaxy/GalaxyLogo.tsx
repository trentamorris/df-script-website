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
        });
      }

    };

    initScene();

    const handleResize = () => initScene();
    window.addEventListener("resize", handleResize);

    let time = 0;
    let ticksSinceLastGlisten = 0;
    // Glisten occurs frequently but naturally (every 0.35s - 0.8s)
    let nextGlistenInterval = 20 + Math.random() * 30;

    const render = () => {
      time += 0.025;
      ticksSinceLastGlisten++;

      // Trigger 1 to 2 concurrent smooth glistening stars
      if (stars.length > 0 && ticksSinceLastGlisten > nextGlistenInterval) {
        ticksSinceLastGlisten = 0;
        nextGlistenInterval = 20 + Math.random() * 32;
        const glistenBatch = Math.random() < 0.45 ? 2 : 1;
        for (let b = 0; b < glistenBatch; b++) {
          const luckyIndex = Math.floor(Math.random() * stars.length);
          const candidate = stars[luckyIndex];
          if (candidate && (!candidate.glistenProgress || candidate.glistenProgress >= 1)) {
            candidate.glistenProgress = 0.01;
            candidate.glistenDuration = 32 + Math.floor(Math.random() * 20); // 32-52 frames smooth lifecycle
          }
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

        // Decay glisten flare via smooth bell-curve intensity using sin^1.6(progress * PI)
        let glistenCurve = 0;
        if (p.glistenProgress !== undefined && p.glistenProgress < 1) {
          const step = 1 / (p.glistenDuration || 35);
          p.glistenProgress += step;
          if (p.glistenProgress >= 1) {
            p.glistenProgress = undefined;
          } else {
            glistenCurve = Math.pow(Math.sin(p.glistenProgress * Math.PI), 1.6);
          }
        }


        // Twinkle factor & draw
        const twinkle = 0.88 + 0.12 * Math.sin(time * 1.6 + p.phase);
        const effectiveAlpha = Math.min(1, p.baseAlpha * twinkle + glistenCurve * 0.7);

        drawStarParticle(ctx, p, effectiveAlpha);

        // If glisten is active, draw a natural soft optical diffraction flare
        if (glistenCurve > 0.05) {
          const flareLength = p.size * (3.5 + glistenCurve * 6.5);
          ctx.save();
          ctx.strokeStyle = "#ffffff";
          ctx.lineWidth = 0.8;
          ctx.globalAlpha = glistenCurve * 0.75;

          // Main vertical and horizontal diffraction spikes
          ctx.beginPath();
          ctx.moveTo(p.x - flareLength, p.y);
          ctx.lineTo(p.x + flareLength, p.y);
          ctx.moveTo(p.x, p.y - flareLength);
          ctx.lineTo(p.x, p.y + flareLength);
          ctx.stroke();

          // Soft diagonal micro-diffraction rays
          const diag = flareLength * 0.35;
          ctx.lineWidth = 0.5;
          ctx.globalAlpha = glistenCurve * 0.45;
          ctx.beginPath();
          ctx.moveTo(p.x - diag, p.y - diag);
          ctx.lineTo(p.x + diag, p.y + diag);
          ctx.moveTo(p.x + diag, p.y - diag);
          ctx.lineTo(p.x - diag, p.y + diag);
          ctx.stroke();

          // Central core glow
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * (1 + glistenCurve * 0.8), 0, Math.PI * 2);
          ctx.fillStyle = "#ffffff";
          ctx.globalAlpha = glistenCurve * 0.8;
          ctx.fill();

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
