import React from "react";
import { createRoot } from "react-dom/client";
import {
  CloseOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
  InfoCircleFilled,
} from "@ant-design/icons";
import styles from "./file-toast.module.scss";

type FileToastType = "error" | "info";

function FileToastItem({
  text,
  type,
  onClose,
}: {
  text: string;
  type: FileToastType;
  onClose: () => void;
}) {
  return (
    <div className={styles.item} role="alert" aria-live="polite">
      <span className={`${styles.icon} ${styles["icon-desktop"]}`} aria-hidden>
        <InfoCircleFilled />
        <span className={styles["icon-desktop-glyph"]}>i</span>
      </span>
      <span
        className={`${styles.icon} ${styles["icon-mobile"]} ${
          type === "error" ? styles["icon-error"] : styles["icon-info"]
        }`}
        aria-hidden
      >
        {type === "error" ? (
          <CloseCircleOutlined />
        ) : (
          <ExclamationCircleOutlined />
        )}
      </span>
      <span className={styles.text}>{text}</span>
      <button
        type="button"
        className={styles.close}
        onClick={onClose}
        aria-label="Close"
      >
        <CloseOutlined />
      </button>
    </div>
  );
}

let containerDiv: HTMLDivElement | null = null;
let containerRoot: ReturnType<typeof createRoot> | null = null;
const toasts: { id: number; text: string; type: FileToastType }[] = [];
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
          type={t.type}
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

export function showFileToast(
  text: string,
  delay = 4000,
  type: FileToastType = "error",
) {
  const id = ++idCounter;
  toasts.push({ id, text, type });
  renderToasts();
  setTimeout(() => removeToast(id), delay);
}
