import { useEffect, useRef } from "react";

export function useInteractionMonitor(
  onReport?: (interacted: boolean) => void,
) {
  const interactedRef = useRef(false);
  const rafIdRef = useRef<number | null>(null);
  const cycleStartRef = useRef<number>(0);
  const isActiveRef = useRef(false);
  const totalInteractedTimeRef = useRef(0); // 总交互时长（秒）

  const markInteracted = () => {
    if (isActiveRef.current) {
      interactedRef.current = true;
    }
  };

  const tick = () => {
    if (!isActiveRef.current) return;

    const elapsed = Date.now() - cycleStartRef.current;
    if (elapsed >= 60 * 1000) {
      const interacted = interactedRef.current;

      if (interacted) {
        totalInteractedTimeRef.current += 60;
      }

      if (onReport) {
        onReport(interacted);
      }

      interactedRef.current = false;
      cycleStartRef.current = Date.now();
    }

    rafIdRef.current = requestAnimationFrame(tick);
  };

  const startMonitor = () => {
    stopMonitor();
    interactedRef.current = false;
    cycleStartRef.current = Date.now();
    isActiveRef.current = true;
    rafIdRef.current = requestAnimationFrame(tick);
  };

  const stopMonitor = () => {
    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
    isActiveRef.current = false;
  };

  const handleVisibilityChange = () => {
    if (document.visibilityState === "visible") {
      startMonitor();
    } else {
      stopMonitor();
    }
  };

  const getCurrentInteractedMs = (isAll = false) => {
    const elapsed = Math.min(Date.now() - cycleStartRef.current, 60 * 1000);
    return (
      totalInteractedTimeRef.current * 1000 +
      (isAll ? (interactedRef.current ? elapsed : 0) : 0)
    );
  };

  useEffect(() => {
    window.addEventListener("click", markInteracted);
    window.addEventListener("keydown", markInteracted);
    // window.addEventListener("mousemove", markInteracted);
    window.addEventListener("scroll", markInteracted);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    if (document.visibilityState === "visible") {
      startMonitor();
    }

    return () => {
      stopMonitor();
      window.removeEventListener("click", markInteracted);
      window.removeEventListener("keydown", markInteracted);
      // window.removeEventListener("mousemove", markInteracted);
      window.removeEventListener("scroll", markInteracted);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  return { getCurrentInteractedMs };
}
