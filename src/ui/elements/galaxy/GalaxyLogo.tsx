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
  repelRadius = 90,
  repelStrength = 0.6,
}: GalaxyLogoProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const mouseStateRef = useCanvasMouse(canvasRef, true);

  // 3D camera angles and velocities for silky Astra-style inertia
  const orbitRef = React.useRef({
    pitch: 0,
    yaw: 0,
    targetPitch: 0,
    targetYaw: 0,
    velPitch: 0,
    velYaw: 0,
    isDragging: false,
    lastMouseX: 0,
    lastMouseY: 0,
  });

  React.useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    const stars: GalaxyLogoStar[] = [];

    // Pointer drag listeners for 3D camera orbit
    const handleMouseDown = (e: MouseEvent) => {
      orbitRef.current.isDragging = true;
      orbitRef.current.lastMouseX = e.clientX;
      orbitRef.current.lastMouseY = e.clientY;
      orbitRef.current.velPitch = 0;
      orbitRef.current.velYaw = 0;
    };

    const handleMouseMoveWindow = (e: MouseEvent) => {
      if (!orbitRef.current.isDragging) return;
      const dx = e.clientX - orbitRef.current.lastMouseX;
      const dy = e.clientY - orbitRef.current.lastMouseY;
      orbitRef.current.lastMouseX = e.clientX;
      orbitRef.current.lastMouseY = e.clientY;

      // Astra sensitivity
      const sensitivity = 0.0055;
      orbitRef.current.targetYaw += dx * sensitivity;
      orbitRef.current.targetPitch += -dy * sensitivity;

      // Store velocity for release inertia
      orbitRef.current.velYaw = dx * sensitivity;
      orbitRef.current.velPitch = -dy * sensitivity;
    };

    const handleMouseUpWindow = () => {
      orbitRef.current.isDragging = false;
    };

    canvas.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mousemove", handleMouseMoveWindow);
    window.addEventListener("mouseup", handleMouseUpWindow);

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
            // 3D depth jitter for volumetric constellation
            const originZ = (Math.random() - 0.5) * 28;
            const isBrightStar = Math.random() < 0.15;

            stars.push({
              originX,
              originY,
              originZ,
              x: originX,
              y: originY,
              z: originZ,
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

      // Ambient cosmic stardust around the letters in 3D space
      const ambientCount = Math.floor(stars.length * 0.08);
      for (let i = 0; i < ambientCount; i++) {
        const ref = stars[Math.floor(Math.random() * stars.length)];
        if (!ref) continue;
        const angle = Math.random() * Math.PI * 2;
        const dist = 6 + Math.random() * 24;

        const originX = ref.originX + Math.cos(angle) * dist;
        const originY = ref.originY + Math.sin(angle) * dist;
        const originZ = (Math.random() - 0.5) * 85;

        stars.push({
          originX,
          originY,
          originZ,
          x: originX,
          y: originY,
          z: originZ,
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
            candidate.glistenDuration = 32 + Math.floor(Math.random() * 20);
          }
        }
      }

      const rect = container.getBoundingClientRect();
      const width = Math.max(rect.width, 360);
      const height = Math.max(rect.height, 120);
      const centerX = width / 2;
      const centerY = height / 2;

      ctx.clearRect(0, 0, width, height);

      const { mouseX, mouseY, isHovered } = mouseStateRef.current;
      const orbit = orbitRef.current;

      // Natural subtle idle yaw rotation
      if (!orbit.isDragging) {
        orbit.targetYaw += 0.0012;

        // Apply release inertia with smooth exponential damping
        orbit.targetYaw += orbit.velYaw;
        orbit.targetPitch += orbit.velPitch;
        orbit.velYaw *= 0.94;
        orbit.velPitch *= 0.94;

        // If hovered and not dragging, apply gentle Astra tilt parallax toward cursor
        if (isHovered) {
          const normX = (mouseX - centerX) / (width * 0.5);
          const normY = (mouseY - centerY) / (height * 0.5);
          orbit.targetYaw += normX * 0.003;
          orbit.targetPitch += -normY * 0.003;
        }
      }

      // Clamp pitch to prevent disorienting flip
      orbit.targetPitch = Math.max(-0.65, Math.min(0.65, orbit.targetPitch));

      // Silky lerp damping toward target angles
      orbit.yaw += (orbit.targetYaw - orbit.yaw) * 0.08;
      orbit.pitch += (orbit.targetPitch - orbit.pitch) * 0.08;

      const cosYaw = Math.cos(orbit.yaw);
      const sinYaw = Math.sin(orbit.yaw);
      const cosPitch = Math.cos(orbit.pitch);
      const sinPitch = Math.sin(orbit.pitch);

      // Camera FOV distance for 3D perspective projection
      const cameraFov = 420;

      const len = stars.length;

      // 1. Calculate physics, drift, and 3D camera projection
      for (let i = 0; i < len; i++) {
        const p = stars[i];

        // Cosmic drift target in local 3D space
        const targetX = p.originX + Math.cos(time * p.speed + p.phase) * p.driftRadius;
        const targetY = p.originY + Math.sin(time * p.speed + p.phase) * p.driftRadius;

        // Dispersion force calculation from cursor hover
        const force = isHovered
          ? calculateRepulsionForce(p.x, p.y, mouseX, mouseY, repelRadius, repelStrength * 16, 0.38)
          : { fx: 0, fy: 0 };

        // Spring physics: stiffness 0.05 and friction 0.88 for crisp, organic cosmic drift
        applySpringPhysics(p, targetX, targetY, force.fx, force.fy, 0.05, 0.88);

        // Center relative coords
        const relX = p.x - centerX;
        const relY = p.y - centerY;
        const relZ = p.originZ;

        // 3D rotation: Yaw around Y axis, Pitch around X axis
        const x1 = relX * cosYaw - relZ * sinYaw;
        const z1 = relX * sinYaw + relZ * cosYaw;

        const y2 = relY * cosPitch - z1 * sinPitch;
        const z2 = relY * sinPitch + z1 * cosPitch;

        // Perspective projection
        const depth = cameraFov + z2;
        const scale = cameraFov / Math.max(30, depth);

        p.projX = centerX + x1 * scale;
        p.projY = centerY + y2 * scale;
        p.projZ = z2;
        p.projScale = scale;

        // Decay glisten flare
        if (p.glistenProgress !== undefined && p.glistenProgress < 1) {
          const step = 1 / (p.glistenDuration || 35);
          p.glistenProgress += step;
          if (p.glistenProgress >= 1) {
            p.glistenProgress = undefined;
          }
        }
      }

      // 2. Depth sort back-to-front for proper 3D layering
      stars.sort((a, b) => (b.projZ ?? 0) - (a.projZ ?? 0));

      // 3. Render 3D stars with luminous additive blend
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
        // Perspective depth modulation on alpha (foreground is brighter, far background softer)
        const depthAlpha = Math.min(1.2, Math.max(0.2, (p.projZ! + 150) / 250));
        const effectiveAlpha = Math.min(1, (p.baseAlpha * twinkle * depthAlpha) + glistenCurve * 0.7);

        // Render point star
        ctx.beginPath();
        ctx.arc(p.projX, p.projY, renderSize, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = effectiveAlpha;
        ctx.fill();

        // Core glow for prominent stars
        if (p.hasGlow) {
          ctx.beginPath();
          ctx.arc(p.projX, p.projY, renderSize * 2.2, 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          ctx.globalAlpha = effectiveAlpha * 0.28;
          ctx.fill();
        }

        // If glisten is active, draw a natural soft optical diffraction flare
        if (glistenCurve > 0.05) {
          const flareLength = renderSize * (3.5 + glistenCurve * 6.5);
          ctx.strokeStyle = "#ffffff";
          ctx.lineWidth = 0.8 * scale;
          ctx.globalAlpha = glistenCurve * 0.85;

          // Main vertical and horizontal diffraction spikes
          ctx.beginPath();
          ctx.moveTo(p.projX - flareLength, p.projY);
          ctx.lineTo(p.projX + flareLength, p.projY);
          ctx.moveTo(p.projX, p.projY - flareLength);
          ctx.lineTo(p.projX + flareLength, p.projY);
          ctx.stroke();

          // Soft diagonal micro-diffraction rays
          const diag = flareLength * 0.35;
          ctx.lineWidth = 0.5 * scale;
          ctx.globalAlpha = glistenCurve * 0.5;
          ctx.beginPath();
          ctx.moveTo(p.projX - diag, p.projY - diag);
          ctx.lineTo(p.projX + diag, p.projY + diag);
          ctx.moveTo(p.projX + diag, p.projY - diag);
          ctx.lineTo(p.projX - diag, p.projY + diag);
          ctx.stroke();

          // Central core glow
          ctx.beginPath();
          ctx.arc(p.projX, p.projY, renderSize * (1 + glistenCurve * 0.8), 0, Math.PI * 2);
          ctx.fillStyle = "#ffffff";
          ctx.globalAlpha = glistenCurve * 0.9;
          ctx.fill();
        }
      }

      ctx.restore();

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      canvas.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mousemove", handleMouseMoveWindow);
      window.removeEventListener("mouseup", handleMouseUpWindow);
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [text, repelRadius, repelStrength, mouseStateRef]);

  return (
    <div
      ref={containerRef}
      className={`relative w-full max-w-2xl h-24 sm:h-32 md:h-36 flex items-center justify-center select-none ${className}`}
    >
      <canvas
        ref={canvasRef}
        className="w-full h-full cursor-grab active:cursor-grabbing block"
      />
    </div>
  );
}
