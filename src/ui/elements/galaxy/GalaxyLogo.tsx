import React from "react";
import type { GalaxyLogoStar, GalaxyLogoProps } from "./types";
import { getRandomStarColor } from "./constants";
import {
  calculateRepulsionForce,
  applySpringPhysics,
  setupHiDpiCanvas,
} from "./utils";
import { useCanvasMouse } from "./useCanvasMouse";

export function GalaxyLogo({
  text = "df-script",
  className = "",
  repelRadius = 75,
  repelStrength = 0.4,
  triggerPulse,
}: GalaxyLogoProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const mouseStateRef = useCanvasMouse(canvasRef, false);
  const lastTriggerRef = React.useRef<number | undefined>(triggerPulse);
  const pulseStarsRef = React.useRef<() => void>(() => {});
  const retriggerIntroRef = React.useRef<() => void>(() => {});

  // Subtle 3D tilt angles for mouse hover (fixed orientation, no free spinning)
  const tiltRef = React.useRef({
    pitch: 0,
    yaw: 0,
    targetPitch: 0,
    targetYaw: 0,
  });

  React.useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    const stars: GalaxyLogoStar[] = [];
    let startTime: number | null = null;
    let canvasW = window.innerWidth;
    let canvasH = window.innerHeight;

    const setupCanvasResolution = () => {
      canvasW = window.innerWidth;
      canvasH = window.innerHeight;
      setupHiDpiCanvas(canvas, ctx, canvasW, canvasH);
    };

    const initScene = () => {
      setupCanvasResolution();

      const rect = container.getBoundingClientRect();
      const logoWidth = Math.max(rect.width, 360);
      const logoHeight = Math.max(rect.height, 120);

      // Create an offscreen canvas to sample text pixel positions accurately
      const offscreen = document.createElement("canvas");
      offscreen.width = logoWidth;
      offscreen.height = logoHeight;
      const offCtx = offscreen.getContext("2d");
      if (!offCtx) return;

      let fontSize = Math.min(Math.round(logoHeight * 0.72), 96);
      offCtx.font = `700 ${fontSize}px Outfit, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
      const textWidth = offCtx.measureText(text).width;
      const targetMaxWidth = logoWidth * 0.92;

      if (textWidth > targetMaxWidth) {
        fontSize = Math.floor(fontSize * (targetMaxWidth / textWidth));
        offCtx.font = `700 ${fontSize}px Outfit, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
      }

      offCtx.textAlign = "center";
      offCtx.textBaseline = "middle";
      offCtx.fillStyle = "#ffffff";
      offCtx.fillText(text, logoWidth / 2, logoHeight / 2 + 2);

      const imgData = offCtx.getImageData(0, 0, logoWidth, logoHeight);
      const data = imgData.data;

      stars.length = 0;
      startTime = null;

      // Center of the container box
      const centerTargetX = rect.left + logoWidth / 2;
      const centerTargetY = rect.top + logoHeight / 2;

      // Crisp 3px sampling grid
      const step = 3;
      for (let y = 0; y < logoHeight; y += step) {
        for (let x = 0; x < logoWidth; x += step) {
          const index = (y * logoWidth + x) * 4;
          const alpha = data[index + 3];

          if (alpha > 35) {
            // Local offsets relative to container center
            const localOffsetX = x - logoWidth / 2 + (Math.random() - 0.5) * 1.4;
            const localOffsetY = y - logoHeight / 2 + (Math.random() - 0.5) * 1.4;
            const originZ = (Math.random() - 0.5) * 20;

            // Astra Intro Formation: starts far outside the entire browser window
            const spiralAngle = Math.random() * Math.PI * 4;
            const disperseRadius = Math.max(canvasW, canvasH) * (0.65 + Math.random() * 0.6);
            const startX = centerTargetX + Math.cos(spiralAngle) * disperseRadius;
            const startY = centerTargetY + Math.sin(spiralAngle) * disperseRadius * 0.75;
            const startZ = (Math.random() - 0.5) * 350;

            // Staggered convergence wave across the word length
            const normalizedX = x / logoWidth;
            const buildDelay = normalizedX * 450 + Math.random() * 280;
            const buildDuration = 950 + Math.random() * 450;

            const isBrightStar = Math.random() < 0.15;

            stars.push({
              originX: centerTargetX + localOffsetX,
              originY: centerTargetY + localOffsetY,
              originZ,
              localOffsetX,
              localOffsetY,
              startX,
              startY,
              startZ,
              buildDelay,
              buildDuration,
              x: startX,
              y: startY,
              z: startZ,
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
      const ambientCount = Math.floor(stars.length * 0.08);
      for (let i = 0; i < ambientCount; i++) {
        const ref = stars[Math.floor(Math.random() * stars.length)];
        if (!ref) continue;
        const angle = Math.random() * Math.PI * 2;
        const dist = 6 + Math.random() * 22;

        const localOffsetX = ref.localOffsetX + Math.cos(angle) * dist;
        const localOffsetY = ref.localOffsetY + Math.sin(angle) * dist;
        const originZ = (Math.random() - 0.5) * 60;

        const spiralAngle = Math.random() * Math.PI * 4;
        const disperseRadius = Math.max(canvasW, canvasH) * (0.7 + Math.random() * 0.55);
        const startX = centerTargetX + Math.cos(spiralAngle) * disperseRadius;
        const startY = centerTargetY + Math.sin(spiralAngle) * disperseRadius * 0.75;
        const startZ = (Math.random() - 0.5) * 380;

        stars.push({
          originX: centerTargetX + localOffsetX,
          originY: centerTargetY + localOffsetY,
          originZ,
          localOffsetX,
          localOffsetY,
          startX,
          startY,
          startZ,
          buildDelay: Math.random() * 500,
          buildDuration: 1100 + Math.random() * 450,
          x: startX,
          y: startY,
          z: startZ,
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

    // ResizeObserver tracks container movement from sidebar expand/collapse in real time
    const resizeObserver = new ResizeObserver(() => {
      setupCanvasResolution();
    });
    resizeObserver.observe(container);
    window.addEventListener("resize", setupCanvasResolution);

    // Retrigger intro gathering on logo click for interactive delight
    retriggerIntroRef.current = () => {
      if (stars.length === 0) return;
      startTime = performance.now();
      const rect = container.getBoundingClientRect();
      const centerTargetX = rect.left + rect.width / 2;
      const centerTargetY = rect.top + rect.height / 2;

      for (let i = 0; i < stars.length; i++) {
        const s = stars[i];
        const spiralAngle = Math.random() * Math.PI * 4;
        const disperseRadius = Math.max(canvasW, canvasH) * (0.65 + Math.random() * 0.55);
        s.startX = centerTargetX + Math.cos(spiralAngle) * disperseRadius;
        s.startY = centerTargetY + Math.sin(spiralAngle) * disperseRadius * 0.75;
        s.startZ = (Math.random() - 0.5) * 350;
        s.x = s.startX;
        s.y = s.startY;
        s.z = s.startZ;
        s.buildDelay = Math.random() * 320;
        s.buildDuration = 900 + Math.random() * 400;
      }
    };

    // Trigger dramatic constellation pulse on copy
    pulseStarsRef.current = () => {
      if (stars.length === 0) return;
      const count = 8 + Math.floor(Math.random() * 4);
      for (let i = 0; i < count; i++) {
        const segmentStart = Math.floor((i / count) * stars.length);
        const segmentEnd = Math.floor(((i + 1) / count) * stars.length);
        const index = segmentStart + Math.floor(Math.random() * Math.max(1, segmentEnd - segmentStart));
        const s = stars[index];
        if (s) {
          s.glistenProgress = 0.01;
          s.glistenDuration = 45 + Math.floor(Math.random() * 25);
          s.glistenScale = 1.25;
        }
      }
    };

    let time = 0;
    let ticksSinceLastGlisten = 0;
    let nextGlistenInterval = 20 + Math.random() * 30;

    const render = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsedMs = timestamp - startTime;

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
            candidate.glistenDuration = 32 + Math.floor(Math.random() * 20);
          }
        }
      }

      // Read live container bounding box every frame so sidebar animation is 100% fluid
      const rect = container.getBoundingClientRect();
      const currentCenterX = rect.left + rect.width / 2;
      const currentCenterY = rect.top + rect.height / 2;

      ctx.clearRect(0, 0, canvasW, canvasH);

      const { mouseX, mouseY, isHovered } = mouseStateRef.current;
      const tilt = tiltRef.current;

      // Proximity detection to logo
      const isLogoHovered = isHovered &&
        mouseX >= rect.left - 40 &&
        mouseX <= rect.right + 40 &&
        mouseY >= rect.top - 30 &&
        mouseY <= rect.bottom + 30;

      // Astra Hover Behavior: subtle camera parallax tilt
      if (isLogoHovered) {
        const normX = (mouseX - currentCenterX) / (rect.width * 0.5);
        const normY = (mouseY - currentCenterY) / (rect.height * 0.5);
        tilt.targetYaw = Math.max(-0.14, Math.min(0.14, normX * 0.12));
        tilt.targetPitch = Math.max(-0.12, Math.min(0.12, -normY * 0.10));
      } else {
        tilt.targetYaw = 0;
        tilt.targetPitch = 0;
      }

      tilt.yaw += (tilt.targetYaw - tilt.yaw) * 0.08;
      tilt.pitch += (tilt.targetPitch - tilt.pitch) * 0.08;

      const cosYaw = Math.cos(tilt.yaw);
      const sinYaw = Math.sin(tilt.yaw);
      const cosPitch = Math.cos(tilt.pitch);
      const sinPitch = Math.sin(tilt.pitch);

      const cameraFov = 460;
      const len = stars.length;

      // 1. Calculate physics, dynamic container anchoring, and 3D camera projection
      for (let i = 0; i < len; i++) {
        const p = stars[i];

        // Dynamically update star origin with live container center (follows sidebar expansion/collapse instantly)
        const currentOriginX = currentCenterX + p.localOffsetX;
        const currentOriginY = currentCenterY + p.localOffsetY;

        // Intro build animation progression
        const starAge = elapsedMs - p.buildDelay;
        let assembleProgress = 1;
        if (starAge < 0) {
          assembleProgress = 0;
        } else if (starAge < p.buildDuration) {
          const t = starAge / p.buildDuration;
          assembleProgress = 1 - Math.pow(1 - t, 3);
        }

        const spiralRotation = (1 - assembleProgress) * 1.6;
        const currentTargetX = p.startX + (currentOriginX - p.startX) * assembleProgress;
        const currentTargetY = p.startY + (currentOriginY - p.startY) * assembleProgress;
        const currentTargetZ = p.startZ + (p.originZ - p.startZ) * assembleProgress;

        const rotCos = Math.cos(spiralRotation);
        const rotSin = Math.sin(spiralRotation);
        const relToDestX = currentTargetX - currentOriginX;
        const relToDestY = currentTargetY - currentOriginY;

        const assembledX = currentOriginX + relToDestX * rotCos - relToDestY * rotSin;
        const assembledY = currentOriginY + relToDestX * rotSin + relToDestY * rotCos;

        const driftX = assembledX + Math.cos(time * p.speed + p.phase) * p.driftRadius * assembleProgress;
        const driftY = assembledY + Math.sin(time * p.speed + p.phase) * p.driftRadius * assembleProgress;

        // Cursor dispersion force on hover
        const force = isLogoHovered && assembleProgress > 0.8
          ? calculateRepulsionForce(p.x, p.y, mouseX, mouseY, repelRadius, repelStrength * 12, 0.35)
          : { fx: 0, fy: 0 };

        applySpringPhysics(p, driftX, driftY, force.fx, force.fy, 0.06, 0.86);

        // Center relative coords for 3D tilt
        const relX = p.x - currentCenterX;
        const relY = p.y - currentCenterY;
        const relZ = currentTargetZ;

        // 3D camera tilt
        const x1 = relX * cosYaw - relZ * sinYaw;
        const z1 = relX * sinYaw + relZ * cosYaw;

        const y2 = relY * cosPitch - z1 * sinPitch;
        const z2 = relY * sinPitch + z1 * cosPitch;

        // Perspective projection
        const depth = cameraFov + z2;
        const scale = cameraFov / Math.max(30, depth);

        p.projX = currentCenterX + x1 * scale;
        p.projY = currentCenterY + y2 * scale;
        p.projZ = z2;
        p.projScale = scale;

        // Glisten flare progression
        if (p.glistenProgress !== undefined && p.glistenProgress < 1) {
          const step = 1 / (p.glistenDuration || 35);
          p.glistenProgress += step;
          if (p.glistenProgress >= 1) {
            p.glistenProgress = undefined;
            p.glistenScale = undefined;
          }
        }
      }

      // 2. Depth sort back-to-front
      stars.sort((a, b) => (b.projZ ?? 0) - (a.projZ ?? 0));

      // 3. Render luminous stars
      ctx.save();
      ctx.globalCompositeOperation = "lighter";

      for (let i = 0; i < len; i++) {
        const p = stars[i];
        if (p.projX === undefined || p.projY === undefined || p.projScale === undefined) continue;

        const scale = p.projScale;
        const renderSize = Math.max(0.4, p.size * scale);

        let glistenCurve = 0;
        if (p.glistenProgress !== undefined && p.glistenProgress < 1) {
          glistenCurve = Math.pow(Math.sin(p.glistenProgress * Math.PI), 1.6);
        }

        const twinkle = 0.88 + 0.12 * Math.sin(time * 1.6 + p.phase);

        // Proximity illumination on hover
        let hoverGlow = 0;
        if (isLogoHovered) {
          const dx = p.projX - mouseX;
          const dy = p.projY - mouseY;
          const dist = Math.hypot(dx, dy);
          if (dist < repelRadius * 1.4) {
            hoverGlow = (1 - dist / (repelRadius * 1.4)) * 0.35;
          }
        }

        const depthAlpha = Math.min(1.2, Math.max(0.3, (p.projZ! + 150) / 250));
        const effectiveAlpha = Math.min(
          1,
          p.baseAlpha * twinkle * depthAlpha + hoverGlow + glistenCurve * 0.7
        );

        // Render point star
        ctx.beginPath();
        ctx.arc(p.projX, p.projY, renderSize * (1 + hoverGlow * 0.5), 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = effectiveAlpha;
        ctx.fill();

        // Core glow for prominent or hovered stars
        if (p.hasGlow || hoverGlow > 0.1) {
          ctx.beginPath();
          ctx.arc(p.projX, p.projY, renderSize * (2.2 + hoverGlow * 1.2), 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          ctx.globalAlpha = effectiveAlpha * (0.28 + hoverGlow * 0.3);
          ctx.fill();
        }

        // Diffraction flare when glisten is active: elegant 4-pointed diamond star
        if (glistenCurve > 0.05) {
          const flareMult = p.glistenScale ?? 1;
          const outerR = renderSize * (3.4 + glistenCurve * 5.6) * flareMult;
          const waistR = Math.max(1.2, renderSize * (0.95 + glistenCurve * 0.55) * flareMult);

          ctx.save();

          // 1. Soft radiant cosmic aura
          const auraRadius = outerR * 0.85;
          const grad = ctx.createRadialGradient(p.projX, p.projY, 0, p.projX, p.projY, auraRadius);
          grad.addColorStop(0, "rgba(255, 255, 255, " + (glistenCurve * 0.85) + ")");
          grad.addColorStop(0.38, "rgba(186, 230, 253, " + (glistenCurve * 0.32) + ")");
          grad.addColorStop(1, "rgba(56, 189, 248, 0)");
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(p.projX, p.projY, auraRadius, 0, Math.PI * 2);
          ctx.fill();

          // 2. Curvilinear 4-pointed diamond star (pinched concave curves)
          ctx.beginPath();
          ctx.moveTo(p.projX, p.projY - outerR);
          ctx.quadraticCurveTo(p.projX + waistR, p.projY - waistR, p.projX + outerR, p.projY);
          ctx.quadraticCurveTo(p.projX + waistR, p.projY + waistR, p.projX, p.projY + outerR);
          ctx.quadraticCurveTo(p.projX - waistR, p.projY + waistR, p.projX - outerR, p.projY);
          ctx.quadraticCurveTo(p.projX - waistR, p.projY - waistR, p.projX, p.projY - outerR);
          ctx.closePath();

          ctx.fillStyle = "#ffffff";
          ctx.globalAlpha = Math.min(1, glistenCurve * 0.95);
          ctx.fill();

          // 3. Dense luminous central core
          ctx.beginPath();
          ctx.arc(p.projX, p.projY, renderSize * (1.1 + glistenCurve * 0.8), 0, Math.PI * 2);
          ctx.fillStyle = "#ffffff";
          ctx.globalAlpha = glistenCurve;
          ctx.fill();

          ctx.restore();
        }
      }

      ctx.restore();

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", setupCanvasResolution);
      cancelAnimationFrame(animationFrameId);
    };
  }, [text, repelRadius, repelStrength, mouseStateRef]);

  React.useEffect(() => {
    if (triggerPulse !== undefined && triggerPulse !== lastTriggerRef.current) {
      lastTriggerRef.current = triggerPulse;
      pulseStarsRef.current();
    }
  }, [triggerPulse]);

  return (
    <div
      ref={containerRef}
      onClick={() => retriggerIntroRef.current()}
      className={`relative w-full max-w-2xl h-24 sm:h-32 md:h-36 flex items-center justify-center select-none cursor-pointer group ${className}`}
      title="Click constellation to reassemble"
    >
      <canvas
        ref={canvasRef}
        className="fixed inset-0 w-screen h-screen pointer-events-none z-10 block"
      />
    </div>
  );
}
