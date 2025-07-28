import { useEffect, useRef, useState } from "react";

export function useInteractionMonitor(
  onReport?: (interacted: boolean) => void,
) {
  const [isActive, setIsActive] = useState(true);
  const [countdown, setCountdown] = useState(60);
  const [totalInteractedTime, setTotalInteractedTime] = useState(0); // 👈 总交互时长（秒）

  const interactedRef = useRef(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);

  const markInteracted = () => {
    if (isActive) {
      interactedRef.current = true;
    }
  };

  const startMonitor = () => {
    stopMonitor();
    interactedRef.current = false;
    setCountdown(60);

    countdownRef.current = setInterval(() => {
      setCountdown((prev) => {
        const next = prev - 1;
        return next <= 0 ? 60 : next;
      });
    }, 1000);

    timerRef.current = setInterval(() => {
      const interacted = interactedRef.current;

      // 👇 如果有交互，就累计60秒
      if (interacted) {
        setTotalInteractedTime((prev) => {
          const updated = prev + 60;
          return updated;
        });
      }

      if (onReport) {
        onReport(interacted); // 🔔 回调给外部
      }
      interactedRef.current = false;
    }, 60 * 1000);
  };

  const stopMonitor = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);
    timerRef.current = null;
    countdownRef.current = null;
  };

  const handleVisibilityChange = () => {
    const visible = document.visibilityState === "visible";
    setIsActive(visible);
    if (visible) {
      startMonitor();
    } else {
      stopMonitor();
    }
  };

  const getCurrentInteractedMs = (isAll = false) => {
    return (
      totalInteractedTime * 1000 +
      (isAll ? (interactedRef.current ? (60 - countdown) * 1000 : 0) : 0)
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

  return {
    getCurrentInteractedMs,
  };
}
