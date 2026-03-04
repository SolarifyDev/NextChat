import React from "react";
import styles from "./upload-overlay.module.scss";

interface UploadOverlayProps {
  /** 遮罩标题 */
  title?: string;
  /** 自定义描述文字，不传则自动根据 acceptFormats 生成 */
  description?: string;
  /** 支持的文件格式列表 */
  acceptFormats?: string[];
}

const defaultFormats = [
  "pdf",
  "doc",
  "docx",
  "xlsx",
  "ppt",
  "pptx",
  "txt",
  "jpg",
  "png",
  "csv",
  "json",
];

const UploadOverlay: React.FC<UploadOverlayProps> = ({
  title = "文件拖动到此处即可上传",
  description,
  acceptFormats = defaultFormats,
}) => {
  return (
    <div className={styles.overlay}>
      <div className={styles.dropZone}>
        {/* 文件夹图标 */}
        <svg
          className={styles.icon}
          width="64"
          height="64"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#1890ff"
          strokeWidth="1.5"
        >
          <path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
        </svg>

        <p className={styles.title}>{title}</p>

        <p className={styles.description}>
          {description ?? `支持的文件格式：${acceptFormats.join("、")}`}
        </p>
      </div>
    </div>
  );
};

export default UploadOverlay;
