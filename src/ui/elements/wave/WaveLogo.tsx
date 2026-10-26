import React from "react";
import type { WaveLogoBubble, WaveLogoProps } from "./types";
import { getRandomFoamColor } from "./constants";
import {
  calculateFluidRepulsionForce,
  applyFluidPhysics,
  drawFoamBubble,
  setupHiDpiCanvas,
} from "./utils";
import { useCanvasMouse } from "../galaxy/useCanvasMouse";

export function WaveLogo({
  text = "df-script",
  className = "",
  repelRadius = 55,
  repelStrength = 0.18,
  triggerPulse,
  enableFilaments = true,
  enableTransform = true,
  minScale = 0.4,
  maxScale = 2.4,
  skipIntro = false,
}: WaveLogoProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const mouseStateRef = useCanvasMouse(canvasRef, false);
  const lastTriggerRef = React.useRef<number | undefined>(triggerPulse);
  const pulseBubblesRef = React.useRef<() => void>(() => { });

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
    const bubbles: WaveLogoBubble[] = [];
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

      bubbles.length = 0;
      startTime = null;

      const centerTargetX = rect.left + logoWidth / 2;
      const centerTargetY = rect.top + logoHeight / 2;

      // Natural seafoam sampling: 2.2px step optimized for smooth 60fps physics
      const step = 2.2;
      for (let y = 0; y < logoHeight; y += step) {
        for (let x = 0; x < logoWidth; x += step) {
          const index = (Math.floor(y) * logoWidth + Math.floor(x)) * 4;
          const alpha = data[index + 3];

          if (alpha > 35) {
            const isCore = alpha > 150;
            // Natural jitter mimics froth gathering along surface water tension
            const jitter = isCore ? 0.6 : 1.6;

            const localOffsetX = x - logoWidth / 2 + (Math.random() - 0.5) * jitter;
            const localOffsetY = y - logoHeight / 2 + (Math.random() - 0.5) * jitter;
            const originZ = (Math.random() - 0.5) * (isCore ? 4 : 10);

            const waveAngle = Math.PI * 0.75 + (Math.random() - 0.5) * 0.5;
            const disperseRadius = Math.max(canvasW, canvasH) * (0.55 + Math.random() * 0.5);
            const startX = centerTargetX + Math.cos(waveAngle) * disperseRadius;
            const startY = centerTargetY + Math.sin(waveAngle) * disperseRadius;
            const startZ = (Math.random() - 0.5) * 200;

            const normalizedX = x / logoWidth;
            const buildDelay = normalizedX * 380 + Math.random() * 180;
            const buildDuration = 700 + Math.random() * 300;

            const targetX = centerTargetX + localOffsetX;
            const targetY = centerTargetY + localOffsetY;

            // Authentic seafoam colors: predominantly pure crisp white, with translucent aqua margins
            const bubbleColor = isCore
              ? Math.random() < 0.94
                ? "#ffffff"
                : "#f0fdfa"
              : Math.random() < 0.75
                ? "#ffffff"
                : getRandomFoamColor();

            // Varied bubble diameters mimicking real frothy ocean foam (micro-bubbles + cluster nodes)
            const randVal = Math.random();
            const bubbleSize = isCore
              ? randVal < 0.65
                ? 0.9 + Math.random() * 0.7
                : 1.6 + Math.random() * 0.9
              : 0.6 + Math.random() * 0.8;

            bubbles.push({
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
              size: bubbleSize,
              color: bubbleColor,
              hasGlow: isCore && randVal > 0.6,
              baseAlpha: isCore ? 0.92 : 0.55 + Math.random() * 0.35,
              phase: Math.random() * Math.PI * 2,
              wobbleSpeed: 0.0012 + Math.random() * 0.0015,
              wobbleAmp: isCore ? 0.35 + Math.random() * 0.6 : 0.8 + Math.random() * 1.2,
            });
          }
        }
      }

      if (enableFilaments) {
        const connectionRadiusSq = 14 * 14;
        for (let i = 0; i < bubbles.length; i++) {
          const b1 = bubbles[i];
          b1.neighbors = [];
          for (let j = i + 1; j < bubbles.length; j++) {
            const b2 = bubbles[j];
            const dx = b1.localOffsetX - b2.localOffsetX;
            const dy = b1.localOffsetY - b2.localOffsetY;
            if (dx * dx + dy * dy < connectionRadiusSq) {
              b1.neighbors.push(b2);
              if (b1.neighbors.length >= 2) break;
            }
          }
        }
      }
    };

    pulseBubblesRef.current = () => {
      for (let i = 0; i < bubbles.length; i++) {
        const b = bubbles[i];
        // Radial ripple outward from center
        const dx = b.localOffsetX;
        const dy = b.localOffsetY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const delay = dist * 1.2;

        setTimeout(() => {
          b.burstProgress = 0;
          b.burstDuration = 320 + Math.random() * 260;
          b.burstScale = 1.35 + Math.random() * 0.9;
          const angle = Math.atan2(dy, dx) + (Math.random() - 0.5) * 0.4;
          const kick = 1.4 + Math.random() * 2.2;
          b.vx += Math.cos(angle) * kick;
          b.vy += Math.sin(angle) * kick - 1.2; // Slight upward splash
        }, delay);
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
      const fov = 650;

      const mouse = mouseStateRef.current;

      for (let i = 0; i < bubbles.length; i++) {
        const b = bubbles[i];

        let progress = 1;
        if (!skipIntro && elapsed < b.buildDelay + b.buildDuration) {
          if (elapsed < b.buildDelay) {
            progress = 0;
          } else {
            const rawProgress = (elapsed - b.buildDelay) / b.buildDuration;
            progress = Math.sin((rawProgress * Math.PI) / 2);
          }
        }

        const timeFactor = time * b.wobbleSpeed + b.phase;

        // Dynamic fluid wave: amplitude increases naturally when interacting
        const waveFrequency = 0.018;
        const waveSpeed = 0.0022;

        // Measure distance to cursor for local wave swell
        let interactionWaveBoost = 1.0;
        let wavePushY = 0;
        if (mouse.isHovered) {
          const dxMouse = (centerTargetX + b.localOffsetX) - mouse.mouseX;
          const dyMouse = (centerTargetY + b.localOffsetY) - mouse.mouseY;
          const distToMouseSq = dxMouse * dxMouse + dyMouse * dyMouse;
          const hoverWaveRadius = 140;
          if (distToMouseSq < hoverWaveRadius * hoverWaveRadius) {
            const prox = 1 - Math.sqrt(distToMouseSq) / hoverWaveRadius;
            interactionWaveBoost += prox * 1.8;
            // Upward water swell / ripple crest around cursor
            wavePushY = Math.sin(prox * Math.PI) * 5.0;
          }
        }

        const waveElevation = Math.sin(b.localOffsetX * waveFrequency - time * waveSpeed) * (3.8 * interactionWaveBoost) - wavePushY;
        const driftX = Math.cos(timeFactor) * b.wobbleAmp;
        const driftY = Math.sin(timeFactor * 1.3) * b.wobbleAmp + waveElevation;

        const rotatedTargetX = b.localOffsetX + driftX;
        const rotatedTargetY = b.localOffsetY + driftY;
        const rotatedTargetZ = b.originZ;

        let rx = rotatedTargetX * cosYaw - rotatedTargetZ * sinYaw;
        let rz = rotatedTargetX * sinYaw + rotatedTargetZ * cosYaw;
        let ry = rotatedTargetY * cosPitch - rz * sinPitch;
        rz = rotatedTargetY * sinPitch + rz * cosPitch;

        const finalX = rx * cosRoll - ry * sinRoll;
        const finalY = rx * sinRoll + ry * cosRoll;

        const perspZ = rz * g.scale;
        const scaleProj = (fov / (fov + perspZ)) * g.scale;
        const screenTargetX = centerTargetX + finalX * scaleProj;
        const screenTargetY = centerTargetY + finalY * scaleProj;

        let currentTargetX: number;
        let currentTargetY: number;

        if (progress >= 1) {
          currentTargetX = screenTargetX;
          currentTargetY = screenTargetY;
        } else {
          currentTargetX = b.startX + (screenTargetX - b.startX) * progress;
          currentTargetY = b.startY + (screenTargetY - b.startY) * progress;
        }

        const { fx, fy } = calculateFluidRepulsionForce(
          b.x,
          b.y,
          mouse.mouseX,
          mouse.mouseY,
          repelRadius,
          repelStrength
        );

        applyFluidPhysics(b, currentTargetX, currentTargetY, fx, fy, 0.05, 0.88);

        b.projX = b.x;
        b.projY = b.y;
        b.projZ = perspZ;
        b.projScale = scaleProj;

        let currentSize = b.size * scaleProj;
        if (b.burstProgress !== undefined && b.burstDuration) {
          b.burstProgress += dt * 1000;
          if (b.burstProgress < b.burstDuration) {
            const burstT = b.burstProgress / b.burstDuration;
            currentSize *= Math.sin(burstT * Math.PI) * (b.burstScale || 1.3);
          } else {
            b.burstProgress = undefined;
          }
        }

        const alpha = b.baseAlpha * Math.min(1, Math.max(0.15, scaleProj * 0.95)) * progress;
        drawFoamBubble(ctx, b.x, b.y, currentSize, b.color, alpha, b.hasGlow);
      }

      // Foam filaments
      if (enableFilaments) {
        ctx.save();
        ctx.lineWidth = 0.5;
        for (let i = 0; i < bubbles.length; i += 3) {
          const b = bubbles[i];
          if (!b.neighbors || !b.projX || !b.projY) continue;

          for (let j = 0; j < b.neighbors.length; j++) {
            const n = b.neighbors[j];
            if (!n.projX || !n.projY) continue;

            const dx = b.projX - n.projX;
            const dy = b.projY - n.projY;
            const distSq = dx * dx + dy * dy;

            if (distSq < 130) {
              const alpha = (1 - distSq / 130) * 0.25;
              ctx.strokeStyle = `rgba(204, 251, 241, ${alpha})`;
              ctx.beginPath();
              ctx.moveTo(b.projX, b.projY);
              ctx.lineTo(n.projX, n.projY);
              ctx.stroke();
            }
          }
        }
        ctx.restore();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
    };
  }, [text, repelRadius, repelStrength, enableFilaments, skipIntro]);

  React.useEffect(() => {
    if (triggerPulse !== undefined && triggerPulse !== lastTriggerRef.current) {
      lastTriggerRef.current = triggerPulse;
      pulseBubblesRef.current?.();
    }
  }, [triggerPulse]);

  return (
    <div
      ref={containerRef}
      className={`relative inline-block select-none cursor-pointer ${className}`}
      onClick={() => pulseBubblesRef.current?.()}
      style={{
        width: "100%",
        maxWidth: "460px",
        height: "110px",
      }}
    >
      <canvas
        ref={canvasRef}
        className="fixed inset-0 pointer-events-none z-10"
      />
    </div>
  );
}
