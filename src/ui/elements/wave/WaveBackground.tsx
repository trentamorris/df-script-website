import React from "react";
import type { WaveBackgroundProps } from "./types";
import { useCanvasMouse } from "../galaxy/useCanvasMouse";

// High-fidelity WebGL Ocean Shader replicating aerial turbulent ocean foam
// Features deep-water oceanic absorption gradients, calm cerulean pools, 
// authentic Voronoi cellular foam webbing with bubble micro-clusters, and
// dynamic multi-ripple fluid wave physics that react naturally to hand/cursor sweeps.
const VERTEX_SHADER_SOURCE = `
attribute vec2 a_position;
varying vec2 v_uv;

void main() {
  v_uv = a_position * 0.5 + 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

const FRAGMENT_SHADER_SOURCE = `
precision highp float;

#define MAX_RIPPLES 16

uniform vec2 u_resolution;
uniform float u_time;
uniform vec2 u_mouse;
uniform float u_repel_strength;
uniform vec3 u_ripples[MAX_RIPPLES]; // xy: position in NDC/aspect coords, z: ripple age/progress
uniform int u_active_ripples;
varying vec2 v_uv;

// 2D Hash function
vec2 hash2(vec2 p) {
  p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
  return -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
}

// Simplex / Gradient Noise
float noise(vec2 p) {
  const float K1 = 0.366025404; // (sqrt(3)-1)/2;
  const float K2 = 0.211324865; // (3-sqrt(3))/6;

  vec2 i = floor(p + (p.x + p.y) * K1);
  vec2 a = p - i + (i.x + i.y) * K2;
  vec2 o = step(a.yx, a.xy);
  vec2 b = a - o + K2;
  vec2 c = a - 1.0 + 2.0 * K2;

  vec3 h = max(0.5 - vec3(dot(a, a), dot(b, b), dot(c, c)), 0.0);
  vec3 n = h * h * h * h * vec3(dot(a, hash2(i + 0.0)), dot(b, hash2(i + o)), dot(c, hash2(i + 1.0)));

  return dot(n, vec3(70.0));
}

// Smooth Fractal Brownian Motion for gentle water swells and currents
float fbm(vec2 p) {
  float f = 0.0;
  float amp = 0.5;
  mat2 rot = mat2(1.6, 1.2, -1.2, 1.6);
  for (int i = 0; i < 4; i++) {
    f += amp * noise(p);
    p = rot * p * 1.6;
    amp *= 0.5;
  }
  return f;
}

// Voronoi Cellular Network for crisp sea-foam lace and bubble webbing
// Returns: vec2(distance to closest edge filament, distance to cell center)
vec2 voronoiFoam(vec2 x) {
  vec2 n = floor(x);
  vec2 f = fract(x);

  vec2 mg, mr;
  float md = 8.0;
  for (int j = -1; j <= 1; j++) {
    for (int i = -1; i <= 1; i++) {
      vec2 g = vec2(float(i), float(j));
      vec2 o = hash2(n + g) * 0.5 + 0.5;
      vec2 r = g + o - f;
      float d = dot(r, r);
      if (d < md) {
        md = d;
        mr = r;
        mg = g;
      }
    }
  }

  // Second pass: compute distance to cell boundary filaments (produces clean lace webs)
  md = 8.0;
  for (int j = -2; j <= 2; j++) {
    for (int i = -2; i <= 2; i++) {
      vec2 g = mg + vec2(float(i), float(j));
      vec2 o = hash2(n + g) * 0.5 + 0.5;
      vec2 r = g + o - f;
      if (dot(mr - r, mr - r) > 0.00001) {
        md = min(md, dot(0.5 * (mr + r), normalize(r - mr)));
      }
    }
  }

  return vec2(md, length(mr));
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution.xy;
  float aspect = u_resolution.x / u_resolution.y;
  vec2 p = (uv - 0.5) * vec2(aspect, 1.0);

  // --- Natural Hand-Through-Water Fluid Ripple Physics ---
  vec2 rippleOffset = vec2(0.0);
  float rippleDisplacement = 0.0;

  for (int i = 0; i < MAX_RIPPLES; i++) {
    if (i >= u_active_ripples) break;
    vec3 rip = u_ripples[i];
    vec2 ripPos = rip.xy;
    float age = rip.z; // 0.0 (just spawned) -> 1.0 (fully faded)

    if (age > 0.0 && age < 1.0) {
      vec2 delta = p - ripPos;
      float d = length(delta);

      // Realistic hydrodynamic wave expansion
      float waveSpeed = 0.65;
      float waveRadius = age * waveSpeed;
      float ringDist = abs(d - waveRadius);

      // Natural dual-ring capillary wave envelope
      float envelope = (1.0 - age) * (1.0 - age) * exp(-ringDist * 18.0) * exp(-d * 1.5);
      float phase = sin((d - waveRadius) * 44.0);

      float wave = envelope * phase * 0.55; // Softer, lighter ripple displacement
      rippleDisplacement += wave;

      if (d > 0.001) {
        rippleOffset += (delta / d) * wave * 0.020; // Refined, gentle coordinate refraction
      }
    }
  }

  // Gentle cursor wake push (fluid eddy around moving hand - subtle and calm)
  vec2 mouseP = (u_mouse / u_resolution.xy - 0.5) * vec2(aspect, 1.0);
  mouseP.y = -mouseP.y;
  vec2 toMouse = p - mouseP;
  float mouseDist = length(toMouse);
  float mousePush = exp(-mouseDist * 9.0) * u_repel_strength;
  p += normalize(toMouse + 0.0001) * mousePush * 0.005 + rippleOffset * 0.4;

  float t = u_time * 0.045;

  // Oceanic swell currents and fluid domain warp
  vec2 warp1 = vec2(fbm(p * 1.3 + vec2(t * 0.22, t * 0.14)), fbm(p * 1.3 + vec2(-t * 0.18, t * 0.26)));
  vec2 warp2 = vec2(fbm(p * 2.0 + warp1 * 0.45 + vec2(t * 0.1, -t * 0.12)), fbm(p * 2.0 + warp1 * 0.45 + vec2(-t * 0.12, t * 0.1)));
  vec2 oceanCoord = p + warp2 * 0.15;

  // 1. Deep Ocean Palette matching pristine aerial ocean photography
  vec3 abyssalDeep   = vec3(0.008, 0.052, 0.14);   // Deep trench navy
  vec3 deepCobalt    = vec3(0.015, 0.18,  0.38);   // Pure cobalt blue
  vec3 ceruleanBlue  = vec3(0.028, 0.38,  0.64);   // Luminous cerulean
  vec3 sunlitCyan    = vec3(0.05,  0.68,  0.86);   // Tropical sunlit turquoise under foam
  vec3 shallowAqua   = vec3(0.12,  0.82,  0.92);   // Clear shallow rim

  float swell1 = fbm(oceanCoord * 1.1 + vec2(t * 0.08, -t * 0.06));
  float swell2 = fbm(oceanCoord * 2.0 - warp1 * 0.35 + vec2(-t * 0.09, t * 0.07));

  vec3 waterColor = mix(abyssalDeep, deepCobalt, smoothstep(-0.35, 0.3, swell1));
  waterColor = mix(waterColor, ceruleanBlue, smoothstep(-0.1, 0.55, swell2));
  waterColor = mix(waterColor, sunlitCyan, smoothstep(0.2, 0.8, swell1 + swell2 * 0.5) * 0.5);

  // Dynamic light caustics refracting on ripple wavefronts (lighter, subtle glint)
  waterColor += vec3(0.06, 0.16, 0.24) * rippleDisplacement * 1.1;

  // 2. High-Fidelity Sea Foam Webbing & Filament Lace (Matching aerial photo)
  // Clean, expansive open water channels with natural foaming crest fields
  float foamPatchMask = fbm(p * 0.85 - vec2(t * 0.16, t * 0.1));
  foamPatchMask = smoothstep(-0.05, 0.68, foamPatchMask);

  // Primary cellular lace filaments (spiderweb threads branching across swells)
  vec2 cell1 = voronoiFoam(oceanCoord * 7.5 + warp1 * 0.7);
  float edgeDist1 = cell1.x;
  float lace1 = 1.0 - smoothstep(0.012, 0.08, edgeDist1);
  lace1 = pow(lace1, 1.8);

  // Secondary finer micro-lace and bubble filaments
  vec2 cell2 = voronoiFoam(oceanCoord * 15.0 - warp2 * 0.6);
  float edgeDist2 = cell2.x;
  float microLace = 1.0 - smoothstep(0.015, 0.085, edgeDist2);
  microLace = pow(microLace, 2.2);

  // Cellular bubble nodes at filament junctions
  float bubbleCluster = smoothstep(0.3, 0.05, cell1.y) * 0.65;

  // Tertiary soft frothy sea foam spray
  float foamNoise = fbm(oceanCoord * 6.0 + vec2(t * 0.15, -t * 0.1));
  float froth = smoothstep(0.18, 0.7, foamNoise) * 0.45;

  // Combined cellular lace
  float totalFoam = (lace1 * 0.85 + microLace * 0.45 + bubbleCluster * 0.35 + froth * 0.3);
  totalFoam *= foamPatchMask;

  // Dense, churning pure-white breaking crest caps (like the top left of the aerial photo)
  float crestCaps = smoothstep(0.48, 0.82, foamPatchMask + swell1 * 0.3);
  totalFoam += crestCaps * 0.95;

  totalFoam = clamp(totalFoam, 0.0, 1.4);

  // 3. Authentic Oceanic Foam Colors (Pure white crests, glowing aqua translucent edges)
  vec3 foamRimColor  = shallowAqua;
  vec3 foamPureWhite = vec3(0.99, 1.00, 1.00);

  // Underneath the foam, light illuminates the shallow aerated water with cyan glow
  waterColor = mix(waterColor, sunlitCyan, smoothstep(0.05, 0.45, totalFoam) * 0.4);

  // Blend crisp foam
  vec3 foamColor = mix(foamRimColor, foamPureWhite, smoothstep(0.15, 0.75, totalFoam));
  vec3 finalColor = mix(waterColor, foamColor, clamp(totalFoam, 0.0, 0.96));

  // Subtle clean oceanic vignette framing the viewport
  float vignette = smoothstep(1.4, 0.3, length(p * vec2(0.85, 1.0)));
  finalColor = mix(finalColor * 0.78, finalColor, vignette);

  gl_FragColor = vec4(finalColor, 1.0);
}
`;

export function WaveBackground({
  className = "",
  repelStrength = 1.0,
}: WaveBackgroundProps) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const mouseStateRef = useCanvasMouse(canvasRef, false);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext("webgl", {
      alpha: false,
      antialias: true,
      powerPreference: "high-performance",
    });
    if (!gl) return;

    // Helper: Compile shader
    const compileShader = (type: number, source: string) => {
      const shader = gl.createShader(type);
      if (!shader) return null;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error("Shader compile error:", gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    };

    const vertShader = compileShader(gl.VERTEX_SHADER, VERTEX_SHADER_SOURCE);
    const fragShader = compileShader(gl.FRAGMENT_SHADER, FRAGMENT_SHADER_SOURCE);
    if (!vertShader || !fragShader) return;

    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vertShader);
    gl.attachShader(program, fragShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error("Program link error:", gl.getProgramInfoLog(program));
      return;
    }

    gl.useProgram(program);

    // Full-screen quad buffer
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([
        -1.0, -1.0,
        1.0, -1.0,
        -1.0, 1.0,
        -1.0, 1.0,
        1.0, -1.0,
        1.0, 1.0,
      ]),
      gl.STATIC_DRAW
    );

    const aPositionLoc = gl.getAttribLocation(program, "a_position");
    gl.enableVertexAttribArray(aPositionLoc);
    gl.vertexAttribPointer(aPositionLoc, 2, gl.FLOAT, false, 0, 0);

    const uResolutionLoc = gl.getUniformLocation(program, "u_resolution");
    const uTimeLoc = gl.getUniformLocation(program, "u_time");
    const uMouseLoc = gl.getUniformLocation(program, "u_mouse");
    const uRepelLoc = gl.getUniformLocation(program, "u_repel_strength");
    const uRipplesLoc = gl.getUniformLocation(program, "u_ripples");
    const uActiveRipplesLoc = gl.getUniformLocation(program, "u_active_ripples");

    // Ripple state: up to 16 concurrent ripples
    // Each ripple: [normalizedX_aspect, normalizedY, progress (0->1)]
    interface Ripple {
      x: number;
      y: number;
      age: number; // 0 to 1
    }
    const MAX_RIPPLES = 16;
    const ripples: Ripple[] = [];
    const rippleData = new Float32Array(MAX_RIPPLES * 3);
    let lastRippleTime = 0;
    let lastMouseX = -9999;
    let lastMouseY = -9999;

    let animationFrameId: number;
    let startTime: number | null = null;
    let lastFrameTime = performance.now();
    let isRunning = true;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const displayWidth = Math.floor(window.innerWidth * dpr);
      const displayHeight = Math.floor(window.innerHeight * dpr);

      if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
        canvas.width = displayWidth;
        canvas.height = displayHeight;
        gl.viewport(0, 0, displayWidth, displayHeight);
      }
    };

    resize();
    window.addEventListener("resize", resize);

    const render = (now: number) => {
      if (!isRunning) return;

      if (!startTime) startTime = now;
      const elapsed = (now - startTime) * 0.001;
      const dt = Math.min((now - lastFrameTime) * 0.001, 0.1);
      lastFrameTime = now;

      const mouse = mouseStateRef.current;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);

      // Track mouse movement to spawn natural water ripples
      if (mouse.isHovered && mouse.mouseX >= 0 && mouse.mouseY >= 0) {
        const dx = mouse.mouseX - lastMouseX;
        const dy = mouse.mouseY - lastMouseY;
        const distMoved = Math.sqrt(dx * dx + dy * dy);

        // Responsive sweep threshold: creates a continuous wake like trailing a hand through water
        if (distMoved > 8 && now - lastRippleTime > 30) {
          const aspect = canvas.width / canvas.height;
          // Calculate shader coordinate p: (uv - 0.5) * vec2(aspect, 1.0)
          const normX = ((mouse.mouseX * dpr) / canvas.width - 0.5) * aspect;
          const normY = -((mouse.mouseY * dpr) / canvas.height - 0.5); // WebGL flip

          ripples.push({
            x: normX,
            y: normY,
            age: 0.001,
          });

          if (ripples.length > MAX_RIPPLES) {
            ripples.shift();
          }

          lastRippleTime = now;
          lastMouseX = mouse.mouseX;
          lastMouseY = mouse.mouseY;
        }
      } else {
        lastMouseX = -9999;
        lastMouseY = -9999;
      }

      // Update ripple ages
      for (let i = ripples.length - 1; i >= 0; i--) {
        ripples[i].age += dt * 0.55; // Natural ~1.8s ripple dispersion lifespan
        if (ripples[i].age >= 1.0) {
          ripples.splice(i, 1);
        }
      }

      gl.useProgram(program);
      gl.uniform2f(uResolutionLoc, canvas.width, canvas.height);
      gl.uniform1f(uTimeLoc, elapsed);
      gl.uniform2f(uMouseLoc, mouse.mouseX * dpr, mouse.mouseY * dpr);
      gl.uniform1f(uRepelLoc, mouse.isHovered ? repelStrength : 0.0);

      // Re-use preallocated Float32Array to avoid garbage collection overhead
      rippleData.fill(0);
      const activeCount = ripples.length;
      for (let i = 0; i < activeCount; i++) {
        rippleData[i * 3 + 0] = ripples[i].x;
        rippleData[i * 3 + 1] = ripples[i].y;
        rippleData[i * 3 + 2] = ripples[i].age;
      }
      gl.uniform3fv(uRipplesLoc, rippleData);
      gl.uniform1i(uActiveRipplesLoc, activeCount);

      gl.drawArrays(gl.TRIANGLES, 0, 6);

      animationFrameId = requestAnimationFrame(render);
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        isRunning = false;
        cancelAnimationFrame(animationFrameId);
      } else {
        if (!isRunning) {
          isRunning = true;
          lastFrameTime = performance.now();
          animationFrameId = requestAnimationFrame(render);
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    animationFrameId = requestAnimationFrame(render);

    return () => {
      isRunning = false;
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      gl.deleteProgram(program);
      gl.deleteShader(vertShader);
      gl.deleteShader(fragShader);
      gl.deleteBuffer(positionBuffer);
    };
  }, [repelStrength]);

  return (
    <canvas
      ref={canvasRef}
      className={`fixed inset-0 pointer-events-none z-0 ${className}`}
      style={{
        width: "100vw",
        height: "100vh",
      }}
    />
  );
}
