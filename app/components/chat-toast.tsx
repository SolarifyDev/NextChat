import { useState, useCallback, useRef, useEffect } from "react";
import styles from "./chat-toast.module.scss";

/* ─────────────────────────────────────────────
   Toast Notification System
   - 新消息从顶部插入，旧消息下移
   - 默认3秒自动消失
   - 点击 × 立即关闭
   - 支持 info / success / warning / error 类型
   - showProgress 控制底部进度条（默认关闭）
   ───────────────────────────────────────────── */

type ToastType = "info" | "success" | "warning" | "error";

interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
  duration: number;
  removing: boolean;
}

interface ToastContainerProps {
  defaultDuration?: number;
  showProgress?: boolean;
}

// ==================== 图标 SVG ====================
const iconMap: Record<ToastType, JSX.Element> = {
  info: (
    <svg width="11" height="11" viewBox="0 0 16 16" fill="none">
      <path d="M8 4V5" stroke="white" strokeWidth="2" strokeLinecap="round" />
      <path d="M8 7V12" stroke="white" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  success: (
    <svg width="11" height="11" viewBox="0 0 16 16" fill="none">
      <path
        d="M3 8.5L6.5 12L13 4"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  warning: (
    <svg width="11" height="11" viewBox="0 0 16 16" fill="none">
      <path d="M8 4V9" stroke="white" strokeWidth="2" strokeLinecap="round" />
      <path d="M8 11V12" stroke="white" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  error: (
    <svg width="11" height="11" viewBox="0 0 16 16" fill="none">
      <path
        d="M4 4L12 12M12 4L4 12"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  ),
};

// 图标样式映射
const iconStyleMap: Record<ToastType, string> = {
  info: styles.iconInfo,
  success: styles.iconSuccess,
  warning: styles.iconWarning,
  error: styles.iconError,
};

// 进度条样式映射
const progressStyleMap: Record<ToastType, string> = {
  info: styles.progressInfo,
  success: styles.progressSuccess,
  warning: styles.progressWarning,
  error: styles.progressError,
};

// ==================== 全局调用 ====================
let toastIdCounter = 0;
let globalAddToast:
  | ((message: string, type: ToastType, duration?: number) => number)
  | null = null;

export const toast = {
  info: (msg: string, duration?: number) =>
    globalAddToast?.(msg, "info", duration),
  success: (msg: string, duration?: number) =>
    globalAddToast?.(msg, "success", duration),
  warning: (msg: string, duration?: number) =>
    globalAddToast?.(msg, "warning", duration),
  error: (msg: string, duration?: number) =>
    globalAddToast?.(msg, "error", duration),
};

// ==================== 组件 ====================
export function ToastContainer({
  defaultDuration = 3000,
  showProgress = false,
}: ToastContainerProps) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timersRef = useRef<Record<number, ReturnType<typeof setTimeout>>>({});

  const removeToast = useCallback((id: number) => {
    setToasts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, removing: true } : t)),
    );
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
      if (timersRef.current[id]) {
        clearTimeout(timersRef.current[id]);
        delete timersRef.current[id];
      }
    }, 300);
  }, []);

  const addToast = useCallback(
    (message: string, type: ToastType = "info", duration?: number) => {
      const id = ++toastIdCounter;
      const dur = duration ?? defaultDuration;
      setToasts((prev) => [
        { id, message, type, duration: dur, removing: false },
        ...prev,
      ]);
      timersRef.current[id] = setTimeout(() => removeToast(id), dur);
      return id;
    },
    [defaultDuration, removeToast],
  );

  useEffect(() => {
    globalAddToast = addToast;
    return () => {
      globalAddToast = null;
    };
  }, [addToast]);

  useEffect(() => {
    return () => {
      Object.values(timersRef.current).forEach(clearTimeout);
    };
  }, []);

  return (
    <div className={styles.container}>
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`${styles.item} ${t.removing ? styles.removing : ""}`}
        >
          <span className={`${styles.icon} ${iconStyleMap[t.type]}`}>
            {iconMap[t.type]}
          </span>
          <span className={styles.message}>{t.message}</span>
          <button className={styles.close} onClick={() => removeToast(t.id)}>
            ×
          </button>
          {showProgress && !t.removing && (
            <div
              className={`${styles.progress} ${progressStyleMap[t.type]}`}
              style={{ animationDuration: `${t.duration}ms` }}
            />
          )}
        </div>
      ))}
    </div>
  );
}
