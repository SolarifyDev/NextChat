import { useNavigate } from "react-router-dom";
import AidHelpIcon from "../../../icons/kid-help.svg";
import CreateKidIcon from "../../../icons/create-kid.svg";
import { Path } from "@/app/constant";

import styles from "./kid.module.scss";
import { useTranslation } from "react-i18next";

export function Kid() {
  const navigate = useNavigate();

  const { t } = useTranslation();

  return (
    <div className={styles["container"]}>
      <div className={styles["centerContent"]}>
        <AidHelpIcon />
        <div className={styles["noKidText"]}>{t("Kid.NoKidText")}</div>
        <div className={styles["instructionText"]}>
          {t("Kid.InstructionText")}
        </div>
        <div
          className={styles["createButton"]}
          onClick={() => {
            navigate(Path.AddOrUpdateKid);
          }}
        >
          <CreateKidIcon />
          {t("Kid.Create")}
        </div>
      </div>

      {[
        1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20,
      ].map((item, index) => {
        return (
          <div key={index} className={styles["listItem"]}>
            <div className={styles["avatar"]}>123</div>
            <div className={styles["content"]}>
              <div className={styles["name"]}>NANCY.Y NANCY.Y NAN</div>
              <div className={styles["message"]}>
                早上好！很高興能為您提供支持。最近的輿情動態對餐飲行業影響早上好！很高興能為您提供支持。最近的輿情動態對餐飲行業影響早上好！很高興能為您提供支持。最近的輿情動態對餐飲行業影響早上好！很高興能為您提供支持。最近的輿情動態對餐飲行業影響早上好！很高興能為您提供支持。最近的輿情動態對餐飲行業影響
              </div>
            </div>
            <div className={styles["actions"]}>
              <div className={styles["actionButton"]}>1</div>
              <div className={styles["actionButton"]}>2</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
