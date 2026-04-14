import React from "react";
import NextImage from "next/image";
import DragOverlayImage from "../icons/Frame 1597883581.png";
import styles from "./upload-overlay.module.scss";

const UploadOverlay: React.FC = () => {
  return (
    <div className={styles.overlay}>
      <div className={styles.dropZone}>
        <div className={styles.icon}>
          <NextImage src={DragOverlayImage} alt="" priority />
        </div>
      </div>
    </div>
  );
};

export default UploadOverlay;
