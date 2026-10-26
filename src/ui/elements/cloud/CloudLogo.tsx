import React from "react";
import type { CloudLogoParticle, CloudLogoProps } from "./types";
import { getRandomCloudColor } from "./constants";
import {
  calculateVaporRepulsionForce,
  applyVaporPhysics,
  drawCloudParticle,
  setupHiDpiCanvas,
} from "./utils";
import { useCanvasMouse } from "../galaxy/useCanvasMouse";

export function CloudLogo({
  text = "df-script",
  className = "",
  repelRadius = 60,
  repelStrength = 0.22,
  triggerPulse,
  enableVaporFilaments = true,
  enableTransform = true,
  minScale = 0.4,
  maxScale = 2.4,
  skipIntro = false,
}: CloudLogoProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const mouseStateRef = useCanvasMouse(canvasRef, false);
  const lastTriggerRef = React.useRef<number | undefined>(triggerPulse);
  const pulseParticlesRef = React.useRef<() => void>(() => { });

  const gestureRef = React.useRef({
    isInteracting: false,
    dragDistance: 0,
    yaw: 0,
    pitch: 0,
    roll: 0,
    scale: 1,
    targetYaw: 0,
    targetPitch: 0,
    targetRoll: 0,
    targetScale: 1,
    vyaw: 0,
    vpitch: 0,
    vroll: 0,
    vscale: 0,
    lastTimestamp: 0,
    pointers: new Map<number, { x: number; y: number }>(),
    lastPointerX: 0,
    lastPointerY: 0,
    initialPinchDist: 0,
    initialPinchAngle: 0,
    startScale: 1,
    startRoll: 0,
  });

  React.useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    const particles: CloudLogoParticle[] = [];
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

      const offscreen = document.createElement("canvas");
      offscreen.width = logoWidth;
      offscreen.height = logoHeight;
      const offCtx = offscreen.getContext("2d");
      if (!offCtx) return;

      let fontSize = Math.min(Math.round(logoHeight * 0.72), 96);
      offCtx.font = `800 ${fontSize}px Outfit, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
      const textWidth = offCtx.measureText(text).width;
      const targetMaxWidth = logoWidth * 0.92;

      if (textWidth > targetMaxWidth) {
        fontSize = Math.floor(fontSize * (targetMaxWidth / textWidth));
        offCtx.font = `800 ${fontSize}px Outfit, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
      }

      offCtx.textAlign = "center";
      offCtx.textBaseline = "middle";
      offCtx.fillStyle = "#ffffff";
      offCtx.fillText(text, logoWidth / 2, logoHeight / 2 + 2);

      const imgData = offCtx.getImageData(0, 0, logoWidth, logoHeight);
      const data = imgData.data;

      particles.length = 0;
      startTime = null;

      const centerTargetX = rect.left + logoWidth / 2;
      const centerTargetY = rect.top + logoHeight / 2;

      // Volumetric cloud vapor sampling: soft puff distribution
      const step = 1.8;
      for (let y = 0; y < logoHeight; y += step) {
        for (let x = 0; x < logoWidth; x += step) {
          const index = (Math.floor(y) * logoWidth + Math.floor(x)) * 4;
          const alpha = data[index + 3];

          if (alpha > 35) {
            const isCore = alpha > 150;
            // Puffy vapor jitter mimicking cumulus cloud edges
            const jitter = isCore ? 0.8 : 2.2;

            const localOffsetX = x - logoWidth / 2 + (Math.random() - 0.5) * jitter;
            const localOffsetY = y - logoHeight / 2 + (Math.random() - 0.5) * jitter;
            const originZ = (Math.random() - 0.5) * (isCore ? 6 : 14);

            // Natural cloud drift angle
            const windAngle = -Math.PI * 0.25 + (Math.random() - 0.5) * 0.6;
            const disperseRadius = Math.max(canvasW, canvasH) * (0.55 + Math.random() * 0.5);
            const startX = centerTargetX + Math.cos(windAngle) * disperseRadius;
            const startY = centerTargetY + Math.sin(windAngle) * disperseRadius;
            const startZ = (Math.random() - 0.5) * 200;

            const normalizedX = x / logoWidth;
            const buildDelay = normalizedX * 360 + Math.random() * 200;
            const buildDuration = 750 + Math.random() * 320;

            const targetX = centerTargetX + localOffsetX;
            const targetY = centerTargetY + localOffsetY;

            // Cotton candy cloud colors: pure sunlit cream in the core, pastel rose/peach/lilac on edges
            const particleColor = isCore
              ? Math.random() < 0.88
                ? "#fff8f6" // warm sunlit cream
                : "#fef2f2" // soft rose white
              : Math.random() < 0.6
                ? "#fff5f5"
                : getRandomCloudColor();

            // Varied vapor puff diameters (soft billows + dense core nodes)
            const randVal = Math.random();
            const puffSize = isCore
              ? randVal < 0.6
                ? 0.9 + Math.random() * 0.7
                : 1.6 + Math.random() * 1.0
              : 0.6 + Math.random() * 0.8;

            particles.push({
              originX: targetX,
              originY: targetY,
              originZ,
              localOffsetX,
              localOffsetY,
              startX,
              startY,
              startZ,
              buildDelay: skipIntro ? 0 : buildDelay,
              buildDuration: skipIntro ? 0 : buildDuration,
              x: skipIntro ? targetX : startX,
              y: skipIntro ? targetY : startY,
              z: skipIntro ? originZ : startZ,
              vx: 0,
              vy: 0,
              size: puffSize,
              color: particleColor,
              hasGlow: isCore && randVal > 0.5,
              baseAlpha: isCore ? 0.94 : 0.60 + Math.random() * 0.32,
              phase: Math.random() * Math.PI * 2,
              wobbleSpeed: 0.0010 + Math.random() * 0.0014,
              wobbleAmp: isCore ? 0.4 + Math.random() * 0.6 : 0.9 + Math.random() * 1.3,
            });
          }
        }
      }

      if (enableVaporFilaments) {
        const connectionRadiusSq = 15 * 15;
        for (let i = 0; i < particles.length; i++) {
          const p1 = particles[i];
          p1.neighbors = [];
          for (let j = i + 1; j < particles.length; j++) {
            const p2 = particles[j];
            const dx = p1.localOffsetX - p2.localOffsetX;
            const dy = p1.localOffsetY - p2.localOffsetY;
            if (dx * dx + dy * dy < connectionRadiusSq) {
              p1.neighbors.push(p2);
              if (p1.neighbors.length >= 2) break;
            }
          }
        }
      }
    };

    pulseParticlesRef.current = () => {
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.burstProgress = 0;
        p.burstDuration = 340 + Math.random() * 260;
        p.burstScale = 1.35 + Math.random() * 1.0;
        const angle = Math.random() * Math.PI * 2;
        const kick = 1.2 + Math.random() * 2.8;
        p.vx += Math.cos(angle) * kick;
        p.vy += Math.sin(angle) * kick;
      }
    };

    initScene();

    const resizeObserver = new ResizeObserver(() => {
      initScene();
    });
    resizeObserver.observe(container);

    const render = (time: number) => {
      if (!startTime) startTime = time;
      const elapsed = time - startTime;

      ctx.clearRect(0, 0, canvasW, canvasH);

      const rect = container.getBoundingClientRect();
      const centerTargetX = rect.left + rect.width / 2;
      const centerTargetY = rect.top + rect.height / 2;

      const g = gestureRef.current;
      const dt = g.lastTimestamp ? Math.min((time - g.lastTimestamp) / 1000, 0.1) : 0.016;
      g.lastTimestamp = time;

      if (!g.isInteracting) {
        const kSpring = 24.0;
        const damping = 8.0;

        const fYaw = -kSpring * g.yaw - damping * g.vyaw;
        g.vyaw += fYaw * dt;
        g.yaw += g.vyaw * dt;

        const fPitch = -kSpring * g.pitch - damping * g.vpitch;
        g.vpitch += fPitch * dt;
        g.pitch += g.vpitch * dt;

        const fRoll = -kSpring * g.roll - damping * g.vroll;
        g.vroll += fRoll * dt;
        g.roll += g.vroll * dt;

        const fScale = -kSpring * (g.scale - 1) - damping * g.vscale;
        g.vscale += fScale * dt;
        g.scale += g.vscale * dt;
      }

      const cosYaw = Math.cos(g.yaw);
      const sinYaw = Math.sin(g.yaw);
      const cosPitch = Math.cos(g.pitch);
      const sinPitch = Math.sin(g.pitch);
      const cosRoll = Math.cos(g.roll);
      const sinRoll = Math.sin(g.roll);
      const currentScale = g.scale;

      const mouse = mouseStateRef.current;
      const isMouseActive = mouse.isHovered && mouse.mouseX >= 0 && mouse.mouseY >= 0;

      // Pass 1: Physical simulation and 3D projection
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        if (elapsed < p.buildDelay) continue;

        const buildAge = elapsed - p.buildDelay;
        const isBuilding = buildAge < p.buildDuration;
        const buildFactor = isBuilding
          ? 1 - Math.pow(1 - buildAge / p.buildDuration, 3)
          : 1;

        const wobble = Math.sin(time * p.wobbleSpeed + p.phase) * p.wobbleAmp;

        let tx = p.localOffsetX;
        let ty = p.localOffsetY + wobble;
        let tz = p.originZ;

        // 3D rotation & scale transform
        let x1 = tx * cosYaw - tz * sinYaw;
        let z1 = tx * sinYaw + tz * cosYaw;

        let y2 = ty * cosPitch - z1 * sinPitch;
        let z2 = ty * sinPitch + z1 * cosPitch;

        let x3 = x1 * cosRoll - y2 * sinRoll;
        let y3 = x1 * sinRoll + y2 * cosRoll;

        tx = x3 * currentScale;
        ty = y3 * currentScale;
        tz = z2 * currentScale;

        const fov = 450;
        const projScale = fov / (fov + tz);
        const finalTargetX = centerTargetX + tx * projScale;
        const finalTargetY = centerTargetY + ty * projScale;

        if (isBuilding) {
          p.x = p.startX + (finalTargetX - p.startX) * buildFactor;
          p.y = p.startY + (finalTargetY - p.startY) * buildFactor;
        } else {
          let fx = 0;
          let fy = 0;

          if (isMouseActive) {
            const force = calculateVaporRepulsionForce(
              p.x,
              p.y,
              mouse.mouseX,
              mouse.mouseY,
              repelRadius,
              repelStrength
            );
            fx = force.fx;
            fy = force.fy;
          }

          applyVaporPhysics(p, finalTargetX, finalTargetY, fx, fy);
        }

        p.projX = p.x;
        p.projY = p.y;
        p.projScale = projScale;
      }

      // Pass 2: Draw vapor filaments between neighbor puffs
      if (enableVaporFilaments) {
        ctx.save();
        for (let i = 0; i < particles.length; i++) {
          const p1 = particles[i];
          if (!p1.neighbors || p1.projX === undefined || p1.projY === undefined) continue;

          for (let n = 0; n < p1.neighbors.length; n++) {
            const p2 = p1.neighbors[n];
            if (p2.projX === undefined || p2.projY === undefined) continue;

            const dx = p1.projX - p2.projX;
            const dy = p1.projY - p2.projY;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < 18) {
              const filamentAlpha = (1 - dist / 18) * 0.22;
              ctx.strokeStyle = `rgba(255, 235, 240, ${filamentAlpha})`;
              ctx.lineWidth = 0.65;
              ctx.beginPath();
              ctx.moveTo(p1.projX, p1.projY);
              ctx.lineTo(p2.projX, p2.projY);
              ctx.stroke();
            }
          }
        }
        ctx.restore();
      }

      // Pass 3: Draw cloud particles
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        if (p.projX === undefined || p.projY === undefined) continue;

        let curSize = p.size * (p.projScale || 1);
        let curAlpha = p.baseAlpha;

        if (p.burstProgress !== undefined && p.burstDuration !== undefined) {
          p.burstProgress += 16;
          const tBurst = p.burstProgress / p.burstDuration;
          if (tBurst < 1.0) {
            const scalePeak = p.burstScale || 1.35;
            const burstScale =
              tBurst < 0.2
                ? 1.0 + (scalePeak - 1.0) * (tBurst / 0.2)
                : scalePeak - (scalePeak - 1.0) * ((tBurst - 0.2) / 0.8);
            curSize *= burstScale;
            curAlpha = Math.min(1, curAlpha * 1.3);
          } else {
            p.burstProgress = undefined;
          }
        }

        drawCloudParticle(
          ctx,
          p.projX,
          p.projY,
          curSize,
          p.color,
          curAlpha,
          p.hasGlow
        );
      }

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    const handleResize = () => {
      initScene();
    };

    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
      resizeObserver.disconnect();
    };
  }, [
    text,
    repelRadius,
    repelStrength,
    enableVaporFilaments,
    enableTransform,
    skipIntro,
  ]);

  React.useEffect(() => {
    if (triggerPulse !== undefined && triggerPulse !== lastTriggerRef.current) {
      lastTriggerRef.current = triggerPulse;
      pulseParticlesRef.current();
    }
  }, [triggerPulse]);

  return (
    <div
      ref={containerRef}
      className={`relative inline-block w-full max-w-[500px] h-[100px] sm:h-[120px] md:h-[140px] pointer-events-auto touch-none select-none ${className}`}
    >
      <canvas
        ref={canvasRef}
        className="fixed inset-0 pointer-events-none z-10"
      />
    </div>
  );
}
