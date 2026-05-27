import { useState, useEffect, useRef, useCallback, RefObject } from "react";

type OnFileDropCallback = (files: File[], rejectedFiles: File[]) => void;

const DEFAULT_ACCEPT = [
  ".doc",
  ".docx",
  ".xlsx",
  ".ppt",
  ".pptx",
  ".jpg",
  ".png",
  ".txt",
  ".pdf",
];

/**
 * 监听指定容器区域的文件拖拽事件，返回遮罩是否可见
 * @param containerRef 需要监听拖拽的容器 ref
 * @param onFileDrop 文件放下时的回调（仅接收合法文件）
 * @param accept 允许的文件扩展名列表，默认为常用文档/图片类型
 * @returns visible 是否显示上传遮罩
 */
export function useDragOverlay(
  containerRef: RefObject<HTMLElement | null>,
  onFileDrop?: OnFileDropCallback,
  accept: string[] = DEFAULT_ACCEPT,
  enabled = true,
): boolean {
  const [visible, setVisible] = useState<boolean>(false);
  const counter = useRef<number>(0);

  const stableCallback = useCallback(
    (files: File[], rejectedFiles: File[]) =>
      onFileDrop?.(files, rejectedFiles),
    [onFileDrop],
  );

  useEffect(() => {
    const el = containerRef.current;
    if (!el || !enabled) {
      counter.current = 0;
      setVisible(false);
      return;
    }

    const enter = (e: DragEvent): void => {
      e.preventDefault();
      counter.current++;
      if (e.dataTransfer?.types.includes("Files")) {
        setVisible(true);
      }
    };

    const leave = (e: DragEvent): void => {
      e.preventDefault();
      counter.current--;
      if (counter.current === 0) {
        setVisible(false);
      }
    };

    const drop = (e: DragEvent): void => {
      e.preventDefault();
      counter.current = 0;
      setVisible(false);

      const allFiles = [...(e.dataTransfer?.files ?? [])];
      if (allFiles.length === 0) return;

      const lowerAccept = accept.map((ext) => ext.toLowerCase());

      const validFiles: File[] = [];
      const rejectedFiles: File[] = [];

      allFiles.forEach((file) => {
        const ext = "." + file.name.split(".").pop()?.toLowerCase();
        if (lowerAccept.includes(ext)) {
          validFiles.push(file);
        } else {
          rejectedFiles.push(file);
        }
      });

      if (validFiles.length > 0 || rejectedFiles.length > 0) {
        stableCallback(validFiles, rejectedFiles);
      }
    };

    const over = (e: DragEvent): void => {
      e.preventDefault();
    };

    el.addEventListener("dragenter", enter);
    el.addEventListener("dragleave", leave);
    el.addEventListener("drop", drop);
    el.addEventListener("dragover", over);

    return () => {
      el.removeEventListener("dragenter", enter);
      el.removeEventListener("dragleave", leave);
      el.removeEventListener("drop", drop);
      el.removeEventListener("dragover", over);
    };
  }, [containerRef, stableCallback, accept, enabled]);

  return visible;
}
