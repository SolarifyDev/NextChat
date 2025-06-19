import { Path } from "@/app/constant";
import ArrowLeftIcon from "../../../icons/arrow-left.svg";
import EditPhoto from "../../../icons/edit-photo.svg";
import ArrowRightIcon from "../../../icons/arrow-right.svg";
import NoAvatar from "../../../icons/no-avatar.png";

import { useNavigate } from "react-router-dom";

import styles from "./add-or-update-kid.module.scss";
import clsx from "clsx";
import { Button, Input } from "antd";
import { useTranslation } from "react-i18next";
import { IType, useKidStore } from "@/app/store/kid";
import { AiKidVoiceType } from "@/app/client/smarties";
import { clone } from "lodash-es";
import { useDebounceFn } from "ahooks";
import { showToast } from "../../ui-lib";

export function AddOrUpdateKid() {
  const navigate = useNavigate();

  const { t } = useTranslation();

  const kidStore = useKidStore();

  const { run: handleUpdateKidFun } = useDebounceFn(
    () => {
      kidStore.handleUpdateKid(() => navigate(Path.AIKid));
    },
    {
      wait: 300,
    },
  );

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
            onClick={() => navigate(Path.AIKid)}
          >
            <ArrowLeftIcon />
          </div>
          <div className={styles.title}>
            {kidStore.type === IType.Add
              ? t("AddOrUpdateAiKid.Create")
              : t("AddOrUpdateAiKid.Edit")}{" "}
            My AI Kid
          </div>
        </div>

        {/* 中间内容区域 - 可滚动 */}
        <div className={styles.content}>
          <div
            className={styles.avatar}
            onClick={() => {
              const fileInput = document.createElement("input");
              fileInput.type = "file";
              fileInput.accept = "image/png, image/jpeg";
              fileInput.onchange = (event: any) => {
                const files = event.target.files;
                const validImageTypes = ["image/png", "image/jpeg"];

                if (files && files.length > 0) {
                  const file = files[0];

                  if (validImageTypes.includes(file.type)) {
                    const newNotSaveKid = clone(kidStore.notSavekid);

                    if (newNotSaveKid) {
                      newNotSaveKid.avatarUrl = file;
                      kidStore.handleChangeKid(newNotSaveKid, false);
                    }
                  } else {
                    showToast(t("AddOrUpdateAiKid.NotImageTypeError"));
                  }
                }
              };
              fileInput.click();
            }}
          >
            {typeof kidStore.notSavekid?.avatarUrl === "string" ? (
              <>
                <img
                  src={kidStore.notSavekid?.avatarUrl}
                  alt="Logo"
                  style={{
                    width: 114,
                    height: 114,
                    objectFit: "cover",
                    userSelect: "none",
                    pointerEvents: "none",
                    borderRadius: "50%",
                  }}
                />
              </>
            ) : kidStore.notSavekid?.avatarUrl instanceof File ? (
              <>
                <img
                  src={URL.createObjectURL(kidStore.notSavekid.avatarUrl)}
                  alt="Logo"
                  style={{
                    width: 114,
                    height: 114,
                    objectFit: "cover",
                    userSelect: "none",
                    pointerEvents: "none",
                    borderRadius: "50%",
                  }}
                />
              </>
            ) : (
              <img
                src={NoAvatar.src}
                alt="Logo"
                style={{
                  width: 114,
                  height: 114,
                  objectFit: "cover",
                  userSelect: "none",
                  pointerEvents: "none",
                  borderRadius: "50%",
                }}
              />
            )}

            <div className={clsx("no-dark", styles.avatarBadge)}>
              <EditPhoto />
            </div>
          </div>

          <div className={styles.card}>
            <div className={styles.cardRow}>
              <div className={styles.cardTitle}>
                {t("AddOrUpdateAiKid.Name")}
              </div>
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
                  value={kidStore.notSavekid?.name || ""}
                  onChange={(e) => {
                    const newData = clone(kidStore.notSavekid);
                    if (newData) {
                      kidStore.handleChangeKid(
                        {
                          ...newData,
                          name: e.target.value,
                        },
                        false,
                      );
                    }
                  }}
                  placeholder={t("AddOrUpdateAiKid.InputName")}
                />
              </div>
            </div>
            <div className={styles.cardRow}>
              <div className={styles.cardTitle}>
                {t("AddOrUpdateAiKid.VoicePreference")}
              </div>
              <div
                className=""
                style={{
                  display: "flex",
                  justifyContent: "end",
                  alignItems: "center",
                  flexGrow: 0,
                  minWidth: 0,
                  flex: 1,
                  textAlign: "right",
                }}
                onClick={() => {
                  navigate(Path.SelectVoice);
                }}
              >
                <div className={styles.cardText}>
                  {kidStore.notSavekid
                    ? kidStore.notSavekid.voice === AiKidVoiceType.Male
                      ? t("SelectVoice.MatureMale")
                      : t("SelectVoice.GentleFemale")
                    : t("AddOrUpdateAiKid.CreateCustomVoice")}
                </div>
                <div
                  style={{
                    display: "flex",
                  }}
                >
                  <ArrowRightIcon />
                </div>
              </div>
            </div>
          </div>

          {/* <div className={styles.card}>
            <div className={styles.cardRow}>
              <div className={styles.cardTitle}>
                {t("AddOrUpdateAiKid.AbilitySettings")}
              </div>
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

                  <div className={styles.cardTitle}>
                    {t("AddOrUpdateAiKid.Polish")}
                  </div>
                </div>
              </div>
            </div>
            <div className={styles.textClamp}>
              你是一家粵菜餐廳的老闆。你對粵菜有著執著與熱愛，致力於將最正宗的粵菜帶給每一位食客
            </div>
          </div>

          <div className={styles.card}>
            <div className={styles.cardRow}>
              {t("AddOrUpdateAiKid.Introduction")}
            </div>
            <div className={styles.textClamp}>
              <Input.TextArea
                className={clsx(styles.Input, styles.textLeft)}
                style={{
                  paddingLeft: "0px",
                  paddingRight: "0px",
                }}
                autoSize={{
                  minRows: 1,
                  maxRows: 2,
                }}
                variant="borderless"
                placeholder={t("AddOrUpdateAiKid.IntroduceYourAiKid")}
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
          </div> */}

          <div className={styles.card}>
            <div className={styles.cardRow}>
              {t("AddOrUpdateAiKid.OpeningLine")}
            </div>
            <div className={styles.textClamp}>
              <Input.TextArea
                className={clsx(styles.Input, styles.textLeft)}
                value={kidStore.notSavekid?.greeting || ""}
                onChange={(e) => {
                  const newData = clone(kidStore.notSavekid);
                  if (newData) {
                    kidStore.handleChangeKid(
                      {
                        ...newData,
                        greeting: e.target.value,
                      },
                      false,
                    );
                  }
                }}
                style={{
                  paddingLeft: "0px",
                  paddingRight: "0px",
                }}
                autoSize={{
                  minRows: 1,
                  maxRows: 2,
                }}
                variant="borderless"
                placeholder={t("AddOrUpdateAiKid.OpeningLineDescription")}
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
          <Button
            type="link"
            size="large"
            loading={kidStore.isFetching}
            className={styles.saveButton}
            onClick={() => {
              handleUpdateKidFun();
            }}
          >
            {kidStore.type === IType.Add
              ? t("AddOrUpdateAiKid.CreateMyAiKid")
              : t("AddOrUpdateAiKid.Save")}
          </Button>
        </div>
      </div>
    </>
  );
}
