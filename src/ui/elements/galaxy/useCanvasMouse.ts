import React from "react";

export interface CanvasMouseState {
  mouseX: number;
  mouseY: number;
  isHovered: boolean;
}

/**
 * Tracks mouse position and active state for canvas interactions.
 * If localToCanvas is true, coordinates are calculated relative to the canvas bounding rect.
 */
export function useCanvasMouse(
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  localToCanvas = false
): React.MutableRefObject<CanvasMouseState> {
  const mouseStateRef = React.useRef<CanvasMouseState>({
    mouseX: -9999,
    mouseY: -9999,
    isHovered: false,
  });


  React.useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const state = mouseStateRef.current;
      if (localToCanvas && canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect();
        state.mouseX = e.clientX - rect.left;
        state.mouseY = e.clientY - rect.top;
      } else {
        state.mouseX = e.clientX;
        state.mouseY = e.clientY;
      }
      state.isHovered = true;
    };

    const handleMouseLeave = () => {
      const state = mouseStateRef.current;
      state.isHovered = false;
      state.mouseX = -9999;
      state.mouseY = -9999;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        const touch = e.touches[0];
        const state = mouseStateRef.current;
        if (localToCanvas && canvasRef.current) {
          const rect = canvasRef.current.getBoundingClientRect();
          state.mouseX = touch.clientX - rect.left;
          state.mouseY = touch.clientY - rect.top;
        } else {
          state.mouseX = touch.clientX;
          state.mouseY = touch.clientY;
        }
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
