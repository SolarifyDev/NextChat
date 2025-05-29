import { useNavigate } from "react-router-dom";
import AidHelpIcon from "../../../icons/kid-help.svg";
import CreateKidIcon from "../../../icons/create-kid.svg";
import CallIcon from "../../../icons/call.svg";
import KidEditIcon from "../../../icons/kid-edit.svg";
import { Path } from "@/app/constant";

import styles from "./kid.module.scss";
import { useTranslation } from "react-i18next";
import { useEffect } from "react";
import { IType, useKidStore } from "@/app/store/kid";
import { Spin } from "antd";
import clsx from "clsx";

export function Kid() {
  const navigate = useNavigate();

  const { t } = useTranslation();

  const {
    isLoading,
    kids,
    getKids,
    handleChangeType,
    handleChangeKid,
    handleChangeCurrentKidIndex,
  } = useKidStore();

  useEffect(() => {
    getKids();
  }, []);

  return (
    <div className={styles["container"]}>
      {isLoading ? (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Spin />
        </div>
      ) : kids.length > 0 ? (
        kids.map((item, index) => {
          return (
            <div key={index} className={styles["listItem"]}>
              <div className={styles["avatar"]}>
                <img
                  src={item.avatarUrl as string}
                  alt="Logo"
                  style={{
                    width: 48,
                    height: 48,
                    objectFit: "cover",
                    userSelect: "none",
                    pointerEvents: "none",
                    borderRadius: "50%",
                  }}
                />
              </div>
              <div className={styles["content"]}>
                <div className={styles["name"]}>{item.name}</div>
                <div className={styles["message"]}>{item.greeting}</div>
              </div>
              <div className={styles["actions"]}>
                <div
                  className={clsx("no-dark", styles["actionButton"])}
                  onClick={() => {
                    handleChangeType(IType.Edit);
                    // handleChangeCurrentKidIndex(item.id);
                    // navigate(Path.AddOrUpdateKid);
                    handleChangeKid(item, true, () =>
                      navigate(Path.AddOrUpdateKid),
                    );
                  }}
                >
                  <KidEditIcon />
                </div>
                <div
                  className={clsx("no-dark", styles["actionButton"])}
                  onClick={() => {
                    navigate(Path.Realtime);
                  }}
                >
                  <CallIcon />
                </div>
              </div>
            </div>
          );
        })
      ) : (
        <div className={styles["centerContent"]}>
          <AidHelpIcon />
          <div className={styles["noKidText"]}>{t("Kid.NoKidText")}</div>
          <div className={styles["instructionText"]}>
            {t("Kid.InstructionText")}
          </div>
          <div
            className={styles["createButton"]}
            style={{
              visibility: "hidden",
            }}
            onClick={() => {
              navigate(Path.AddOrUpdateKid);
            }}
          >
            <CreateKidIcon />
            {t("Kid.Create")}
          </div>
        </div>
      )}
    </div>
  );
}
