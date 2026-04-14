import React from "react";
import { createRoot } from "react-dom/client";
import styles from "./file-toast.module.scss";

function FileToastItem({
  text,
  onClose,
}: {
  text: string;
  onClose: () => void;
}) {
  return (
    <div className={styles.item} role="alert" aria-live="polite">
      <span className={styles.icon} aria-hidden>
        !
      </span>
      <span className={styles.text}>{text}</span>
      <button className={styles.close} onClick={onClose} aria-label="Close">
        x
      </button>
    </div>
  );
}

let containerDiv: HTMLDivElement | null = null;
let containerRoot: ReturnType<typeof createRoot> | null = null;
const toasts: { id: number; text: string }[] = [];
let idCounter = 0;

function renderToasts() {
  if (!containerDiv) {
    containerDiv = document.createElement("div");
    document.body.appendChild(containerDiv);
    containerRoot = createRoot(containerDiv);
  }

  containerRoot!.render(
    <div className={styles.container} role="status" aria-live="polite">
      {toasts.map((t) => (
        <FileToastItem
          key={t.id}
          text={t.text}
          onClose={() => removeToast(t.id)}
        />
      ))}
    </div>,
  );
}

function removeToast(id: number) {
  const idx = toasts.findIndex((t) => t.id === id);
  if (idx >= 0) toasts.splice(idx, 1);
  renderToasts();
}

export function showFileToast(text: string, delay = 4000) {
  const id = ++idCounter;
  toasts.push({ id, text });
  renderToasts();
  setTimeout(() => removeToast(id), delay);
}
