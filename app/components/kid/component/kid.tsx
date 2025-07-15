import { useNavigate } from "react-router-dom";
import AidHelpIcon from "../../../icons/kid-help.svg";
import CreateKidIcon from "../../../icons/create-kid.svg";
import CallIcon from "../../../icons/call.svg";
import KidEditIcon from "../../../icons/kid-edit.svg";
import DeepIcon from "../../../icons/deep.png";
import { Path } from "@/app/constant";

import styles from "./kid.module.scss";
import { useTranslation } from "react-i18next";
import { useEffect } from "react";
import { IType, useKidStore } from "@/app/store/kid";
import { Spin } from "antd";
import clsx from "clsx";
import { useOmeStore } from "@/app/store/ome";
import { StaticImageData } from "next/image";
import OneP from "../../../icons/1P.jpeg";
import TwoM from "../../../icons/2M.jpeg";
import ThreeM from "../../../icons/3M.jpeg";
import FourM from "../../../icons/4M.jpeg";
import FiveM from "../../../icons/5M.jpeg";
import SixM from "../../../icons/6M.jpeg";
import FourPC from "../../../icons/4PC.jpeg";
import FourPB from "../../../icons/4PB.jpeg";

interface TeamLever {
  name: string;
  url: string;
  description: string;
  icon: StaticImageData;
}

const data: TeamLever[] = [
  {
    name: "1P",
    url: "https://ai-studio.solarifyai.com/chat/ZlUhd7wPT5toGu4w",
    description: "我是1P執行者，通過合作完成任務",
    icon: OneP,
  },
  {
    name: "2M",
    url: "https://ai-studio.solarifyai.com/chat/LMbjcrcjcUXIqFWj",
    description: "我是2M初級管理者，通過採集資訊制定計劃",
    icon: TwoM,
  },
  {
    name: "3M",
    url: "https://ai-studio.solarifyai.com/chat/UJ21XpGMb1iTIBFI",
    description: "我是3M中級管理者，通過策略性得尋找和解決問題",
    icon: ThreeM,
  },
  {
    name: "4M",
    url: "https://ai-studio.solarifyai.com/chat/0OlFDW0LRJwIpYQz",
    description: "我是4M高級管理層，通過構建標準推進組織營運",
    icon: FourM,
  },
  {
    name: "5M",
    url: "https://ai-studio.solarifyai.com/chat/OSWxFGpde5RHcP16",
    description: "我是5M決策者，通過資源的合理分配投資",
    icon: FiveM,
  },
  {
    name: "6M",
    url: "https://ai-studio.solarifyai.com/chat/TKbaJembu1qiNrtV",
    description: "我是6M戰略決策者，通過願景和戰略佈局",
    icon: SixM,
  },
  {
    name: "4PC",
    url: "https://ai-studio.solarifyai.com/chat/w6psxCl0cN90OZn6",
    description: "我是4PC市場定位專家，針對個人消費者需求",
    icon: FourPC,
  },
  {
    name: "4PB",
    url: "https://ai-studio.solarifyai.com/chat/SPzkVHRDci9yHMPw",
    description: "我是4PB市場定位專家，專注企業客人服務",
    icon: FourPB,
  },
];

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

  const { isFromApp } = useOmeStore();

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
      ) : kids.length > 0 || true ? (
        <div>
          {kids?.map((item, index) => {
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
                      handleChangeKid(item, true, () =>
                        navigate(Path.Realtime),
                      );
                    }}
                  >
                    <CallIcon />
                  </div>
                </div>
              </div>
            );
          })}

          {!isFromApp && (
            <div
              className={styles["listItem"]}
              style={{
                cursor: "pointer",
              }}
              onClick={() => {
                window.open("http://47.238.241.114:3000/chat", "_blank");
              }}
            >
              <div className={styles["avatar"]}>
                <img
                  src={DeepIcon.src as string}
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
                <div className={styles["name"]}>Deep Research</div>
                <div className={styles["message"]}>
                  你好，我是市場調研專家，你想要的任何諮詢，隨時問我！
                </div>
              </div>
            </div>
          )}
          {!isFromApp && (
            <div
              className={styles["listItem-A"]}
              style={{
                borderTop: "2px",
                borderStyle: "solid",
                borderColor: "#EAEAEA",
                borderBottom: "0",
                borderLeft: "0",
                borderRight: "0",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <div
                className={styles["name"]}
                style={{
                  fontSize: "24px",
                  padding: "10px 20px",
                }}
              >
                層級數字員工團隊
              </div>

              {data.map((item, index) => (
                <div
                  className={styles["listItem"]}
                  style={{
                    padding: "10px 20px",
                    cursor: "pointer",
                  }}
                  key={index}
                  onClick={() => {
                    window.open(item.url, "_blank");
                  }}
                >
                  <div className={styles["avatar"]}>
                    <img
                      src={item.icon.src as string}
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
                    <div className={styles["message"]}>{item.description}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
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
