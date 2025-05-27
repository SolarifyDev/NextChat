import { Path } from "@/app/constant";
import ArrowLeftIcon from "../../../icons/arrow-left.svg";
import EditPhoto from "../../../icons/edit-photo.svg";
import ArrowRightIcon from "../../../icons/arrow-right.svg";
import MagicPenIcon from "../../../icons/magic-pen.svg";

import { useNavigate } from "react-router-dom";

import styles from "./add-or-update-kid.module.scss";
import clsx from "clsx";
import { Input } from "antd";
import { showToast } from "../../ui-lib";

export function AddOrUpdateKid() {
  const navigate = useNavigate();

  return (
    <>
      <div
        className={clsx(styles.container, {
          [styles["show-scrollbar"]]: false,
          [styles["hide-scrollbar"]]: true,
        })}
      >
        {/* 顶部导航栏 - 固定高度 */}
        <div className={styles.header}>
          <div
            className={styles.backButton}
            onClick={() => navigate(Path.Home)}
          >
            <ArrowLeftIcon />
          </div>
          <div className={styles.title}>编辑My AI Kid</div>
        </div>

        {/* 中间内容区域 - 可滚动 */}
        <div className={styles.content}>
          <div
            className={styles.avatar}
            onClick={() => {
              showToast("556");
              const fileInput = document.createElement("input");
              fileInput.type = "file";
              fileInput.accept = "image/png, image/jpeg";
              fileInput.onchange = (event: any) => {
                const files = event.target.files;
                const validImageTypes = ["image/png", "image/jpeg"];

                showToast(files.length.toString());
              };
              fileInput.click();
            }}
          >
            <div className={styles.avatarBadge}>
              <EditPhoto />
            </div>
          </div>

          <div className={styles.card}>
            <div className={styles.cardRow}>
              <div className={styles.cardTitle}>名称</div>
              <div style={{ width: "100%" }}>
                <Input
                  className={clsx(styles.Input, styles.textRight)}
                  type="text"
                  variant="borderless"
                  onKeyDown={(e) => {
                    if (
                      e.key === "Enter" &&
                      e.target instanceof HTMLInputElement
                    ) {
                      e.target.blur();
                    }
                  }}
                />
              </div>
            </div>
            <div className={styles.cardRow}>
              <div className={styles.cardTitle}>音色偏好</div>
              <div
                className=""
                style={{
                  width: "100%",
                  display: "flex",
                  justifyContent: "end",
                  alignItems: "center",
                  flexGrow: 0,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    cursor: "pointer",
                  }}
                  onClick={() => {}}
                >
                  <div className={styles.cardTitle}>成熟優雅</div>

                  <ArrowRightIcon />
                </div>
              </div>
            </div>
          </div>

          <div className={styles.card}>
            <div className={styles.cardRow}>
              <div className={styles.cardTitle}>能力设定</div>
              <div
                className=""
                style={{
                  width: "100%",
                  display: "flex",
                  justifyContent: "end",
                  alignItems: "center",
                  flexGrow: 0,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    cursor: "pointer",
                    color: "#28B446",
                    gap: "3px",
                  }}
                  onClick={() => {}}
                >
                  <MagicPenIcon />

                  <div className={styles.cardTitle}>润色</div>
                </div>
              </div>
            </div>
            <div className={styles.textClamp}>
              你是一家粵菜餐廳的老闆。你對粵菜有著執著與熱愛，致力於將最正宗的粵菜帶給每一位食客
            </div>
          </div>

          <div className={styles.card}>
            <div className={styles.cardRow}>介绍</div>
            <div className={styles.textClamp}>
              <Input.TextArea
                className={clsx(styles.Input, styles.textLeft)}
                style={{
                  padding: "0",
                }}
                autoSize={{
                  minRows: 1,
                  maxRows: 2,
                }}
                variant="borderless"
                placeholder="介紹你的AI KID"
                onKeyDown={(e) => {
                  if (
                    e.key === "Enter" &&
                    e.target instanceof HTMLTextAreaElement
                  ) {
                    e.target.blur();
                  }
                }}
              />
            </div>
          </div>

          <div className={styles.card}>
            <div className={styles.cardRow}>开场白</div>
            <div className={styles.textClamp}>
              <Input.TextArea
                className={clsx(styles.Input, styles.textLeft)}
                style={{
                  padding: "0",
                }}
                autoSize={{
                  minRows: 1,
                  maxRows: 2,
                }}
                variant="borderless"
                placeholder="将作为开启聊天的第一句话"
                onKeyDown={(e) => {
                  if (
                    e.key === "Enter" &&
                    e.target instanceof HTMLTextAreaElement
                  ) {
                    e.target.blur();
                  }
                }}
              />
            </div>
          </div>

          <div className={styles.card}>
            <div className={styles.cardRow}>开场白</div>
            <div className={styles.textClamp}>
              <Input.TextArea
                className={clsx(styles.Input, styles.textLeft)}
                style={{
                  padding: "0",
                }}
                autoSize={{
                  minRows: 1,
                  maxRows: 2,
                }}
                variant="borderless"
                placeholder="将作为开启聊天的第一句话"
                onKeyDown={(e) => {
                  if (
                    e.key === "Enter" &&
                    e.target instanceof HTMLTextAreaElement
                  ) {
                    e.target.blur();
                  }
                }}
              />
            </div>
          </div>
        </div>

        {/* 底部按钮 - 固定在底部 */}
        <div className={styles.footer}>
          <div className={styles.saveButton}>保存</div>
        </div>
      </div>
    </>
  );
}
