import React from "react";
import type { CloudBackgroundProps } from "./types";
import { useCanvasMouse } from "../galaxy/useCanvasMouse";

// High-Fidelity Cotton Candy Sunset Cumulus WebGL Shader
// Features authentic volumetric 3D cloud fractals, pastel cerulean blue sky,
// sunlit warm creamy-peach highlights, cotton-candy pink midtones, 
// and atmospheric lilac-violet crevice shadowing with natural wind and cursor breeze.
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

#define MAX_GUSTS 16

uniform vec2 u_resolution;
uniform float u_time;
uniform vec2 u_mouse;
uniform float u_repel_strength;
uniform vec3 u_gusts[MAX_GUSTS];
uniform int u_active_gusts;
varying vec2 v_uv;

vec2 hash2(vec2 p) {
  p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
  return -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
}

// Smooth value/gradient noise
float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);

  return mix(
    mix(dot(hash2(i + vec2(0.0, 0.0)), f - vec2(0.0, 0.0)),
        dot(hash2(i + vec2(1.0, 0.0)), f - vec2(1.0, 0.0)), u.x),
    mix(dot(hash2(i + vec2(0.0, 1.0)), f - vec2(0.0, 1.0)),
        dot(hash2(i + vec2(1.0, 1.0)), f - vec2(1.0, 1.0)), u.x),
    u.y
  );
}

// Low-frequency billowy cumulus base
float billowNoise(vec2 p) {
  return 1.0 - abs(noise(p));
}

float fbmBillow(vec2 p) {
  float v = 0.0;
  float amp = 0.55;
  mat2 rot = mat2(0.8, -0.6, 0.6, 0.8);
  for (int i = 0; i < 4; i++) {
    v += amp * billowNoise(p);
    p = rot * p * 1.8;
    amp *= 0.45;
  }
  return v;
}

// Density function sampled for finite-difference normal calculation
float getCloudDensity(vec2 p) {
  // Broad structural cluster shaping (creates clear sky regions)
  float macroMask = noise(p * 0.45);
  float billows = fbmBillow(p * 0.85);

  float d = billows + macroMask * 0.35 - 0.25;
  return clamp(d, 0.0, 1.0);
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution.xy;
  float aspect = u_resolution.x / u_resolution.y;
  vec2 p = (uv - 0.5) * vec2(aspect, 1.0) * 2.2;

  // Atmospheric wind gust & cursor interaction displacement
  vec2 gustOffset = vec2(0.0);
  float gustDisplacement = 0.0;

  for (int i = 0; i < MAX_GUSTS; i++) {
    if (i >= u_active_gusts) break;
    vec3 gust = u_gusts[i];
    vec2 gustPos = gust.xy * 2.2;
    float age = gust.z;

    if (age > 0.0 && age < 1.0) {
      vec2 delta = p - gustPos;
      float d = length(delta);
      float gustRadius = age * 1.4;
      float ringDist = abs(d - gustRadius);

      float envelope = (1.0 - age) * (1.0 - age) * exp(-ringDist * 10.0) * exp(-d * 0.8);
      float phase = sin((d - gustRadius) * 20.0);
      float wave = envelope * phase;
      gustDisplacement += wave;

      if (d > 0.001) {
        gustOffset += (delta / d) * wave * 0.06;
      }
    }
  }

  // Mouse repulsion & interaction
  vec2 mouseP = (u_mouse / u_resolution.xy - 0.5) * vec2(aspect, 1.0) * 2.2;
  mouseP.y = -mouseP.y;
  vec2 toMouse = p - mouseP;
  float mouseDist = length(toMouse);
  p += normalize(toMouse + 0.0001) * exp(-mouseDist * 3.5) * u_repel_strength * 0.15 + gustOffset;

  // Gentle wind drift
  float t = u_time * 0.035;
  vec2 wind = vec2(t * 0.1, t * 0.04);
  vec2 pos = p - wind;

  // Domain warping for soft vapor edges
  float warp = noise(pos * 1.1);
  pos += vec2(warp * 0.18, -warp * 0.14);

  // Sample density
  float density = getCloudDensity(pos);

  // Realistic directional lighting (Normal gradient estimation)
  vec2 eps = vec2(0.015, 0.0);
  float nx = getCloudDensity(pos + eps.xy) - getCloudDensity(pos - eps.xy);
  float ny = getCloudDensity(pos + eps.yx) - getCloudDensity(pos - eps.yx);
  vec3 normal = normalize(vec3(-nx, -ny, 0.045));

  // Sun direction: upper-right, warm grazing light
  vec3 sunDir = normalize(vec3(0.55, 0.75, 0.35));
  float diffuse = max(dot(normal, sunDir), 0.0);

  // Soft sky gradient (Vibrant cerulean to pale azure)
  vec3 zenithSky = vec3(0.18, 0.58, 0.92);
  vec3 horizonSky = vec3(0.56, 0.82, 0.96);
  vec3 sky = mix(horizonSky, zenithSky, uv.y);

  // Reference Palette
  vec3 shadowViolet = vec3(0.70, 0.62, 0.82); // Muted underside ambient lilac
  vec3 pinkMidtone  = vec3(0.96, 0.68, 0.80); // Bubblegum pink transition
  vec3 peachSunlit  = vec3(1.00, 0.88, 0.84); // Warm illuminated peach crests
  vec3 creamPeak    = vec3(1.00, 0.98, 0.96); // Pure sunlit crests

  // Composite 3D cloud shading
  vec3 cloudColor = mix(shadowViolet, pinkMidtone, smoothstep(0.1, 0.55, diffuse));
  cloudColor = mix(cloudColor, peachSunlit, smoothstep(0.45, 0.85, diffuse));
  cloudColor = mix(cloudColor, creamPeak, smoothstep(0.80, 1.0, diffuse) * density);

  // Subtle wave accent on gusts
  cloudColor += vec3(0.08, 0.05, 0.10) * gustDisplacement;

  // Cloud coverage edge cutout (keeps center / sky pockets distinct)
  float coverage = smoothstep(0.28, 0.75, density);

  vec3 finalColor = mix(sky, cloudColor, coverage);

  gl_FragColor = vec4(finalColor, 1.0);
}
`;

export function CloudBackground({
  className = "",
  repelStrength = 1.0,
}: CloudBackgroundProps) {
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
        console.error("Cloud shader compile error:", gl.getShaderInfoLog(shader));
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
      console.error("Cloud program link error:", gl.getProgramInfoLog(program));
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
    const uGustsLoc = gl.getUniformLocation(program, "u_gusts");
    const uActiveGustsLoc = gl.getUniformLocation(program, "u_active_gusts");

    interface Gust {
      x: number;
      y: number;
      age: number;
    }
    const MAX_GUSTS = 16;
    const gusts: Gust[] = [];
    const gustData = new Float32Array(MAX_GUSTS * 3);
    let lastGustTime = 0;
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

      // Track mouse movement to spawn natural wind gusts through clouds
      if (mouse.isHovered && mouse.mouseX >= 0 && mouse.mouseY >= 0) {
        const dx = mouse.mouseX - lastMouseX;
        const dy = mouse.mouseY - lastMouseY;
        const distMoved = Math.sqrt(dx * dx + dy * dy);

        if (distMoved > 8 && now - lastGustTime > 30) {
          const aspect = canvas.width / canvas.height;
          const normX = ((mouse.mouseX * dpr) / canvas.width - 0.5) * aspect;
          const normY = -((mouse.mouseY * dpr) / canvas.height - 0.5);

          gusts.push({
            x: normX,
            y: normY,
            age: 0.001,
          });

          if (gusts.length > MAX_GUSTS) {
            gusts.shift();
          }

          lastGustTime = now;
          lastMouseX = mouse.mouseX;
          lastMouseY = mouse.mouseY;
        }
      } else {
        lastMouseX = -9999;
        lastMouseY = -9999;
      }

      // Update gust ages
      for (let i = gusts.length - 1; i >= 0; i--) {
        gusts[i].age += dt * 0.5; // Smooth ~2.0s gust dispersion lifespan
        if (gusts[i].age >= 1.0) {
          gusts.splice(i, 1);
        }
      }

      gl.useProgram(program);
      gl.uniform2f(uResolutionLoc, canvas.width, canvas.height);
      gl.uniform1f(uTimeLoc, elapsed);
      gl.uniform2f(uMouseLoc, mouse.mouseX * dpr, mouse.mouseY * dpr);
      gl.uniform1f(uRepelLoc, mouse.isHovered ? repelStrength : 0.0);

      // Re-use preallocated Float32Array to avoid garbage collection overhead
      gustData.fill(0);
      const activeCount = gusts.length;
      for (let i = 0; i < activeCount; i++) {
        gustData[i * 3 + 0] = gusts[i].x;
        gustData[i * 3 + 1] = gusts[i].y;
        gustData[i * 3 + 2] = gusts[i].age;
      }
      gl.uniform3fv(uGustsLoc, gustData);
      gl.uniform1i(uActiveGustsLoc, activeCount);

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
