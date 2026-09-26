import React from "react";
import type { GalaxyBgStar, GalaxyBackgroundProps, ShootingStar, NebulaCloud } from "./types";

import { getRandomStarColor } from "./constants";
import {
  calculateRepulsionForce,
  applySpringPhysics,
  drawStarParticle,
  setupHiDpiCanvas,
} from "./utils";
import { useCanvasMouse } from "./useCanvasMouse";

export function GalaxyBackground({
  spiralArms = 3,
  starCount = 580,
  repelRadius = 130,
  repelStrength = 0.35,
  rotationSpeed = 0.0008,
  className = "",
  enableShootingStars = true,
  enableNebula = true,
}: GalaxyBackgroundProps) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const mouseStateRef = useCanvasMouse(canvasRef, false);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = window.innerWidth;
    let height = window.innerHeight;

    const stars: GalaxyBgStar[] = [];
    const shootingStars: ShootingStar[] = [];

    // Faint atmospheric interstellar nebula dust clouds drifting in deep space
    const nebulae: NebulaCloud[] = [
      {
        xFactor: 0.28,
        yFactor: 0.35,
        baseRadius: 280,
        colorStop0: "rgba(56, 189, 248, 0.045)",
        colorStop1: "rgba(30, 58, 138, 0.0)",
        phase: 0,
        driftSpeed: 0.0008,
      },
      {
        xFactor: 0.72,
        yFactor: 0.62,
        baseRadius: 340,
        colorStop0: "rgba(168, 85, 247, 0.035)",
        colorStop1: "rgba(88, 28, 135, 0.0)",
        phase: Math.PI * 0.7,
        driftSpeed: 0.0006,
      },
      {
        xFactor: 0.55,
        yFactor: 0.22,
        baseRadius: 240,
        colorStop0: "rgba(14, 165, 233, 0.03)",
        colorStop1: "rgba(15, 23, 42, 0.0)",
        phase: Math.PI * 1.4,
        driftSpeed: 0.001,
      },
    ];

    const spawnShootingStar = () => {
      const edge = Math.floor(Math.random() * 4);
      let startX = 0;
      let startY = 0;
      let angle = 0;

      if (edge === 0) {
        startX = Math.random() * width;
        startY = -30;
        angle = (Math.PI * 0.15) + Math.random() * (Math.PI * 0.7);
      } else if (edge === 1) {
        startX = width + 30;
        startY = Math.random() * height;
        angle = (Math.PI * 0.65) + Math.random() * (Math.PI * 0.7);
      } else if (edge === 2) {
        startX = Math.random() * width;
        startY = height + 30;
        angle = -(Math.PI * 0.15) - Math.random() * (Math.PI * 0.7);
      } else {
        startX = -30;
        startY = Math.random() * height;
        angle = -(Math.PI * 0.35) + Math.random() * (Math.PI * 0.7);
      }

      // ~18% chance of spawning a dramatic, bright Super-Bolide Fireball Meteor
      const isBolide = Math.random() < 0.18;
      const speed = isBolide ? 11 + Math.random() * 7 : 4.5 + Math.random() * 9.5;
      const length = isBolide ? 180 + Math.random() * 140 : 45 + Math.random() * 110;
      const thickness = isBolide ? 2.6 + Math.random() * 1.2 : 0.8 + Math.random() * 0.7;
      const maxLife = Math.floor((isBolide ? 50 : 35) + Math.random() * 40);

      const color = isBolide
        ? (Math.random() < 0.5 ? "#ffffff" : "#fef08a")
        : (Math.random() < 0.45 ? "#bae6fd" : Math.random() < 0.75 ? "#ffffff" : "#fef08a");

      shootingStars.push({
        x: startX,
        y: startY,
        dx: Math.cos(angle) * speed,
        dy: Math.sin(angle) * speed,
        length,
        speed,
        thickness,
        alpha: 0,
        maxAlpha: isBolide ? 0.7 + Math.random() * 0.25 : 0.3 + Math.random() * 0.4,
        life: 0,
        maxLife,
        color,
        isBolide,
      });
    };



    const initGalaxy = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      setupHiDpiCanvas(canvas, ctx, width, height);

      stars.length = 0;
      shootingStars.length = 0;
      const centerX = width / 2;
      const centerY = height / 2;
      const maxRadius = Math.hypot(width, height) * 0.58;

      // 1. Sparse spiral arm stars
      const armStarCount = Math.floor(starCount * 0.75);
      for (let i = 0; i < armStarCount; i++) {
        const armIdx = i % spiralArms;
        const armOffset = (armIdx * 2 * Math.PI) / spiralArms;

        const progress = Math.pow(Math.random(), 0.65);
        const r = 40 + progress * (maxRadius - 40);

        const twist = 2.4;
        const spiralTheta = twist * Math.log(r / 35 + 0.1) + armOffset;
        const spread = (0.2 + 0.35 * (r / maxRadius)) * (Math.random() - 0.5) * 2.2;
        const finalAngle = spiralTheta + spread;

        const isHighlight = Math.random() < 0.14;

        stars.push({
          x: centerX + Math.cos(finalAngle) * r,
          y: centerY + Math.sin(finalAngle) * r,
          baseX: centerX + Math.cos(finalAngle) * r,
          baseY: centerY + Math.sin(finalAngle) * r,
          vx: 0,
          vy: 0,
          radius: r,
          armAngle: finalAngle,
          orbitalSpeed: rotationSpeed * (0.8 + 0.8 * (1 - r / maxRadius)),
          size: isHighlight ? 1.6 + Math.random() * 1.3 : 0.7 + Math.random() * 0.9,
          alpha: isHighlight ? 0.45 + Math.random() * 0.35 : 0.14 + Math.random() * 0.24,
          color: getRandomStarColor(),
          hasGlow: isHighlight,
          phase: Math.random() * Math.PI * 2,
        });
      }

      // 2. Field background stars (random cosmic dust)
      const fieldCount = starCount - armStarCount;
      for (let i = 0; i < fieldCount; i++) {
        const x = Math.random() * width;
        const y = Math.random() * height;
        const dx = x - centerX;
        const dy = y - centerY;

        stars.push({
          x,
          y,
          baseX: x,
          baseY: y,
          vx: 0,
          vy: 0,
          radius: Math.hypot(dx, dy),
          armAngle: Math.atan2(dy, dx),
          orbitalSpeed: rotationSpeed * 0.5,
          size: 0.6 + Math.random() * 0.8,
          alpha: 0.10 + Math.random() * 0.22,
          color: Math.random() < 0.3 ? "#7dd3fc" : "#ffffff",
          hasGlow: false,
          phase: Math.random() * Math.PI * 2,
        });
      }
    };

    initGalaxy();

    const handleResize = () => initGalaxy();
    window.addEventListener("resize", handleResize);

    let time = 0;
    let ticksSinceLastShootingStar = 0;
    let ticksSinceLastFlare = 0;
    // Spawn shooting stars roughly every 4 to 8 seconds
    let nextSpawnInterval = 200 + Math.random() * 260;
    // Stellar glistens occur frequently across the vast field (every 0.5s - 1.2s)
    let nextFlareInterval = 30 + Math.random() * 45;

    const render = () => {
      time += 0.02;
      ticksSinceLastShootingStar++;
      ticksSinceLastFlare++;

      if (enableShootingStars && ticksSinceLastShootingStar > nextSpawnInterval) {
        ticksSinceLastShootingStar = 0;
        nextSpawnInterval = 220 + Math.random() * 280;
        spawnShootingStar();
      }

      // Trigger 1 to 3 concurrent peaceful stellar glistens across background stars
      if (stars.length > 0 && ticksSinceLastFlare > nextFlareInterval) {
        ticksSinceLastFlare = 0;
        nextFlareInterval = 20 + Math.random() * 35;
        const count = Math.random() < 0.35 ? 3 : Math.random() < 0.7 ? 2 : 1;
        for (let k = 0; k < count; k++) {
          const luckyIdx = Math.floor(Math.random() * stars.length);
          const candidate = stars[luckyIdx];
          if (candidate && (!candidate.glistenProgress || candidate.glistenProgress >= 1)) {
            candidate.glistenProgress = 0.01;
            candidate.glistenDuration = 36 + Math.floor(Math.random() * 24); // smooth 36-60 frame bloom
          }
        }
      }


      ctx.clearRect(0, 0, width, height);

      const centerX = width / 2;
      const centerY = height / 2;

      // 1. Render slow-breathing cosmic gaseous nebula clouds
      if (enableNebula) {
        const nebLen = nebulae.length;
        for (let n = 0; n < nebLen; n++) {
          const neb = nebulae[n];
          neb.phase += neb.driftSpeed;
          // Organic drift
          const nx = width * neb.xFactor + Math.sin(neb.phase * 0.8) * 35;
          const ny = height * neb.yFactor + Math.cos(neb.phase * 0.7) * 25;
          // Breathing scale
          const nr = neb.baseRadius * (0.88 + 0.12 * Math.sin(neb.phase));

          const nGrad = ctx.createRadialGradient(nx, ny, 0, nx, ny, nr);
          nGrad.addColorStop(0, neb.colorStop0);
          nGrad.addColorStop(1, neb.colorStop1);

          ctx.fillStyle = nGrad;
          ctx.beginPath();
          ctx.arc(nx, ny, nr, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Subtle ambient central cosmic core gradient
      const coreGlow = ctx.createRadialGradient(
        centerX,
        centerY,
        0,
        centerX,
        centerY,
        Math.min(width, height) * 0.52
      );
      coreGlow.addColorStop(0, "rgba(56, 189, 248, 0.05)");
      coreGlow.addColorStop(0.45, "rgba(30, 58, 138, 0.02)");
      coreGlow.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = coreGlow;
      ctx.fillRect(0, 0, width, height);

      const { mouseX, mouseY, isHovered } = mouseStateRef.current;
      const len = stars.length;

      for (let i = 0; i < len; i++) {
        const star = stars[i];

        star.armAngle += star.orbitalSpeed;
        star.baseX = centerX + Math.cos(star.armAngle) * star.radius;
        star.baseY = centerY + Math.sin(star.armAngle) * star.radius;

        const force = isHovered
          ? calculateRepulsionForce(star.x, star.y, mouseX, mouseY, repelRadius, repelStrength * 12, 0.25)
          : { fx: 0, fy: 0 };

        applySpringPhysics(star, star.baseX, star.baseY, force.fx, force.fy, 0.04, 0.88);

        // Decay micro-nova flare via smooth sinusoidal bell curve
        let glistenCurve = 0;
        if (star.glistenProgress !== undefined && star.glistenProgress < 1) {
          const step = 1 / (star.glistenDuration || 40);
          star.glistenProgress += step;
          if (star.glistenProgress >= 1) {
            star.glistenProgress = undefined;
          } else {
            glistenCurve = Math.pow(Math.sin(star.glistenProgress * Math.PI), 1.6);
          }
        }

        // Subtle organic twinkling & hover brightening
        const twinkle = 0.8 + 0.2 * Math.sin(time * 1.4 + star.phase);
        const flareBonus = glistenCurve * 0.7;
        let alpha = star.alpha * twinkle + flareBonus;

        if (isHovered) {
          const dx = star.x - mouseX;
          const dy = star.y - mouseY;
          const distSq = dx * dx + dy * dy;
          if (distSq < repelRadius * repelRadius) {
            alpha += ((repelRadius - Math.sqrt(distSq)) / repelRadius) * 0.25;
          }
        }

        drawStarParticle(ctx, star, alpha);

        // Micro-nova glisten: beautiful 4-pointed diamond star
        if (glistenCurve > 0.05) {
          const outerR = star.size * (3.0 + glistenCurve * 4.8);
          const waistR = Math.max(1.1, star.size * (0.85 + glistenCurve * 0.45));

          ctx.save();

          // Soft cosmic aura
          const auraRadius = outerR * 0.9;
          const grad = ctx.createRadialGradient(star.x, star.y, 0, star.x, star.y, auraRadius);
          grad.addColorStop(0, "rgba(255, 255, 255, " + (glistenCurve * 0.8) + ")");
          grad.addColorStop(0.38, "rgba(186, 230, 253, " + (glistenCurve * 0.3) + ")");
          grad.addColorStop(1, "rgba(56, 189, 248, 0)");
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(star.x, star.y, auraRadius, 0, Math.PI * 2);
          ctx.fill();

          // 4-pointed diamond star with solid waist
          ctx.beginPath();
          ctx.moveTo(star.x, star.y - outerR);
          ctx.quadraticCurveTo(star.x + waistR, star.y - waistR, star.x + outerR, star.y);
          ctx.quadraticCurveTo(star.x + waistR, star.y + waistR, star.x, star.y + outerR);
          ctx.quadraticCurveTo(star.x - waistR, star.y + waistR, star.x - outerR, star.y);
          ctx.quadraticCurveTo(star.x - waistR, star.y - waistR, star.x, star.y - outerR);
          ctx.closePath();

          ctx.fillStyle = "#ffffff";
          ctx.globalAlpha = Math.min(1, glistenCurve * 0.9);
          ctx.fill();

          // Luminous core
          ctx.beginPath();
          ctx.arc(star.x, star.y, star.size * (1.1 + glistenCurve * 0.7), 0, Math.PI * 2);
          ctx.fillStyle = "#ffffff";
          ctx.globalAlpha = glistenCurve * 0.85;
          ctx.fill();

          ctx.restore();
        }
      }


      // Render subtle shooting stars
      if (enableShootingStars && shootingStars.length > 0) {
        for (let i = shootingStars.length - 1; i >= 0; i--) {
          const s = shootingStars[i];
          s.life++;
          s.x += s.dx;
          s.y += s.dy;

          // Smooth fade in and fade out envelope
          const progress = s.life / s.maxLife;
          if (progress < 0.25) {
            s.alpha = (progress / 0.25) * s.maxAlpha;
          } else {
            s.alpha = (1 - (progress - 0.25) / 0.75) * s.maxAlpha;
          }

          if (s.life >= s.maxLife || s.x > width + 100 || s.y > height + 100) {
            shootingStars.splice(i, 1);
            continue;
          }

          // Tail direction vector
          const tailAngle = Math.atan2(s.dy, s.dx) + Math.PI;
          const tailX = s.x + Math.cos(tailAngle) * s.length;
          const tailY = s.y + Math.sin(tailAngle) * s.length;

          const grad = ctx.createLinearGradient(s.x, s.y, tailX, tailY);
          grad.addColorStop(0, `rgba(255, 255, 255, ${s.alpha})`);
          grad.addColorStop(0.25, s.color === "#fef08a" ? `rgba(254, 240, 138, ${s.alpha * 0.85})` : `rgba(186, 230, 253, ${s.alpha * 0.85})`);
          grad.addColorStop(1, "rgba(56, 189, 248, 0)");

          ctx.save();
          ctx.strokeStyle = grad;
          ctx.lineWidth = s.thickness;
          ctx.lineCap = "round";
          ctx.beginPath();
          ctx.moveTo(s.x, s.y);
          ctx.lineTo(tailX, tailY);
          ctx.stroke();

          // Luminous head
          ctx.fillStyle = "#ffffff";
          ctx.shadowColor = s.color;
          ctx.shadowBlur = s.thickness * 4;
          ctx.globalAlpha = s.alpha;
          ctx.beginPath();
          ctx.arc(s.x, s.y, s.thickness * 0.9, 0, Math.PI * 2);
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
  }, [spiralArms, starCount, repelRadius, repelStrength, rotationSpeed, mouseStateRef, enableShootingStars, enableNebula]);



  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 pointer-events-none z-0 w-full h-full ${className}`}
    />
  );
}
