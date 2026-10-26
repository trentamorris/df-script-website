import React from "react";

export interface CanvasMouseState {
  mouseX: number;
  mouseY: number;
  prevMouseX: number;
  prevMouseY: number;
  mouseVx: number;
  mouseVy: number;
  speed: number;
  lastMoved: number;
  isHovered: boolean;
}

/**
 * Tracks mouse position, velocity and active state for canvas interactions.
 * If localToCanvas is true, coordinates are calculated relative to the canvas bounding rect.
 */
export function useCanvasMouse(
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  localToCanvas = false
): React.MutableRefObject<CanvasMouseState> {
  const mouseStateRef = React.useRef<CanvasMouseState>({
    mouseX: -9999,
    mouseY: -9999,
    prevMouseX: -9999,
    prevMouseY: -9999,
    mouseVx: 0,
    mouseVy: 0,
    speed: 0,
    lastMoved: 0,
    isHovered: false,
  });

  React.useEffect(() => {
    let lastTime = performance.now();

    const handleMouseMove = (e: MouseEvent) => {
      const now = performance.now();
      const dt = Math.max(0.005, (now - lastTime) / 1000);
      lastTime = now;

      const state = mouseStateRef.current;
      let currX = e.clientX;
      let currY = e.clientY;
      if (localToCanvas && canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect();
        currX -= rect.left;
        currY -= rect.top;
      }

      if (state.prevMouseX > -9000) {
        const rawVx = (currX - state.prevMouseX) / (dt * 60);
        const rawVy = (currY - state.prevMouseY) / (dt * 60);
        state.mouseVx += (rawVx - state.mouseVx) * 0.4;
        state.mouseVy += (rawVy - state.mouseVy) * 0.4;
        state.speed = Math.hypot(state.mouseVx, state.mouseVy);
      }
      state.prevMouseX = currX;
      state.prevMouseY = currY;
      state.mouseX = currX;
      state.mouseY = currY;
      state.lastMoved = now;
      state.isHovered = true;
    };

    const handleMouseLeave = () => {
      const state = mouseStateRef.current;
      state.isHovered = false;
      state.mouseX = -9999;
      state.mouseY = -9999;
      state.prevMouseX = -9999;
      state.prevMouseY = -9999;
      state.mouseVx = 0;
      state.mouseVy = 0;
      state.speed = 0;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        const touch = e.touches[0];
        const now = performance.now();
        const dt = Math.max(0.001, Math.min(0.1, (now - lastTime) / 1000));
        lastTime = now;

        const state = mouseStateRef.current;
        let currX = touch.clientX;
        let currY = touch.clientY;
        if (localToCanvas && canvasRef.current) {
          const rect = canvasRef.current.getBoundingClientRect();
          currX -= rect.left;
          currY -= rect.top;
        }

        if (state.prevMouseX === -9999) {
          state.prevMouseX = currX;
          state.prevMouseY = currY;
          state.mouseVx = 0;
          state.mouseVy = 0;
          state.speed = 0;
        } else {
          const rawVx = (currX - state.prevMouseX) / (dt * 60);
          const rawVy = (currY - state.prevMouseY) / (dt * 60);
          state.mouseVx += (rawVx - state.mouseVx) * 0.45;
          state.mouseVy += (rawVy - state.mouseVy) * 0.45;
          state.speed = Math.hypot(state.mouseVx, state.mouseVy);
          state.prevMouseX = currX;
          state.prevMouseY = currY;
        }

        state.mouseX = currX;
        state.mouseY = currY;
        state.isHovered = true;
      }
    };

    const handleTouchEnd = () => {
      const state = mouseStateRef.current;
      state.isHovered = false;
      state.mouseX = -9999;
      state.mouseY = -9999;
    };

    const target = localToCanvas ? canvasRef.current : window;
    if (!target) return;

    target.addEventListener("mousemove", handleMouseMove as EventListener);
    target.addEventListener("mouseleave", handleMouseLeave as EventListener);
    target.addEventListener("touchstart", handleTouchMove as EventListener, { passive: true });
    target.addEventListener("touchmove", handleTouchMove as EventListener, { passive: true });
    target.addEventListener("touchend", handleTouchEnd as EventListener, { passive: true });
    target.addEventListener("touchcancel", handleTouchEnd as EventListener, { passive: true });
    window.addEventListener("blur", handleMouseLeave);

    return () => {
      target.removeEventListener("mousemove", handleMouseMove as EventListener);
      target.removeEventListener("mouseleave", handleMouseLeave as EventListener);
      target.removeEventListener("touchstart", handleTouchMove as EventListener);
      target.removeEventListener("touchmove", handleTouchMove as EventListener);
      target.removeEventListener("touchend", handleTouchEnd as EventListener);
      target.removeEventListener("touchcancel", handleTouchEnd as EventListener);
      window.removeEventListener("blur", handleMouseLeave);
    };
  }, [canvasRef, localToCanvas]);

  return mouseStateRef;
}
