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
import { useOmeStore } from "@/app/store/ome";
import { StaticImageData } from "next/image";
// import OneP from "../../../icons/1P.png";
// import TwoM from "../../../icons/2M.png";
// import ThreeM from "../../../icons/3M.png";
// import FourM from "../../../icons/4M.png";
// import FiveM from "../../../icons/5M.png";
// import SixM from "../../../icons/6M.png";
// import FourPC from "../../../icons/4PC.png";
// import FourPB from "../../../icons/4PB.png";
// import NewsMinimalist from "../../../icons/News Minimalist.png";
// import HrAi from "../../../icons/HR AI.png";
import { MessageEnum } from "@/app/enum";
import { AiKidSystemSource } from "@/app/client/smarties";

interface KidLever {
  name: string;
  url: string;
  description: string;
  icon: StaticImageData;
}

// const hierarchicalData: KidLever[] = [
//   {
//     name: "1P",
//     url: "https://ai-studio.solarifyai.com/chat/ZlUhd7wPT5toGu4w",
//     description: "我是1P執行者，通過合作完成任務",
//     icon: OneP,
//   },
//   {
//     name: "2M",
//     url: "https://ai-studio.solarifyai.com/chat/LMbjcrcjcUXIqFWj",
//     description: "我是2M初級管理者，通過採集資訊制定計劃",
//     icon: TwoM,
//   },
//   {
//     name: "3M",
//     url: "https://ai-studio.solarifyai.com/chat/UJ21XpGMb1iTIBFI",
//     description: "我是3M中級管理者，通過策略性得尋找和解決問題",
//     icon: ThreeM,
//   },
//   {
//     name: "4M",
//     url: "https://ai-studio.solarifyai.com/chat/0OlFDW0LRJwIpYQz",
//     description: "我是4M高級管理層，通過構建標準推進組織營運",
//     icon: FourM,
//   },
//   {
//     name: "5M",
//     url: "https://ai-studio.solarifyai.com/chat/OSWxFGpde5RHcP16",
//     description: "我是5M決策者，通過資源的合理分配投資",
//     icon: FiveM,
//   },
//   {
//     name: "6M",
//     url: "https://ai-studio.solarifyai.com/chat/TKbaJembu1qiNrtV",
//     description: "我是6M戰略決策者，通過願景和戰略佈局",
//     icon: SixM,
//   },
//   {
//     name: "4PC",
//     url: "https://ai-studio.solarifyai.com/chat/w6psxCl0cN90OZn6",
//     description: "我是4PC市場定位專家，針對個人消費者需求",
//     icon: FourPC,
//   },
//   {
//     name: "4PB",
//     url: "https://ai-studio.solarifyai.com/chat/SPzkVHRDci9yHMPw",
//     description: "我是4PB市場定位專家，專注企業客人服務",
//     icon: FourPB,
//   },
// ];

// const toolData: KidLever[] = [
//   // {
//   //   name: "Deep Research",
//   //   url: "http://47.238.241.114:3000/chat",
//   //   description: "你好，我是市場調研專家，你想要的任何諮詢，隨時問我！",
//   //   icon: DeepReSearch,
//   // },
//   {
//     name: "新闻速递",
//     url: "http://47.238.241.114:9000/",
//     description:
//       "你好，我是智能新聞助手，幫你快速發現和整理世界各地的新鮮資訊，隨時為你服務",
//     icon: NewsMinimalist,
//   },
//   {
//     name: "AI HR",
//     url: `https://metis-ai-kid.testomenow.com/chatbot?token=HRhnj6GwltwSzJNY`,
//     description: "我是AI HR，專注於人力資源自助服務，幫你即時解答HR相關問題。",
//     icon: HrAi,
//   },
// ];

// 你原来的压缩方法
const gzipToBase64 = async (input: string) => {
  const uint8Array = new TextEncoder().encode(input);
  const compressedStream = new Response(
    new Blob([uint8Array]).stream().pipeThrough(new CompressionStream("gzip")),
  ).arrayBuffer();
  const compressedUint8Array = new Uint8Array(await compressedStream);
  return btoa(String.fromCharCode(...compressedUint8Array));
};

// 优化后的方法：边生成边检查，找到就立即返回
const compressWithoutPlusOrMinus = async (input: string) => {
  // 递归生成并立即检查
  async function tryPermutation(
    current: string,
    index: number,
  ): Promise<{ input: string; base64: string } | null> {
    // 递归终点：生成完整字符串，立即压缩并检查
    if (index === input.length) {
      const b64 = await gzipToBase64(current);

      // ⚠ 注意：base64 只会产生 "+" 不会产生 "-"（除非你 URL-safe 转换）
      // 所以这里一起判断
      if (!b64.includes("+") && !b64.includes("-")) {
        return { input: current, base64: b64 };
      }
      return null;
    }

    const char = input[index];

    // 非字母保持原样
    if (!/[a-zA-Z]/.test(char)) {
      return await tryPermutation(current + char, index + 1);
    }

    // 先尝试小写
    const lowerResult = await tryPermutation(
      current + char.toLowerCase(),
      index + 1,
    );
    if (lowerResult) return lowerResult; // 找到了就立即返回

    // 小写不行，再尝试大写
    const upperResult = await tryPermutation(
      current + char.toUpperCase(),
      index + 1,
    );
    if (upperResult) return upperResult;

    return null;
  }

  // 开始尝试
  const result = await tryPermutation("", 0);

  // 如果所有组合都含 + 或 -，返回原始字符串的压缩结果
  if (!result) {
    const fallbackBase64 = await gzipToBase64(input);
    return { input, base64: fallbackBase64 };
  }

  return result;
};

async function decodeBase64AndDecompress(base64String: string) {
  try {
    const binaryString = atob(base64String);
    const compressedUint8Array = Uint8Array.from(binaryString, (char) =>
      char.charCodeAt(0),
    );
    const decompressedStream = new Response(
      compressedUint8Array,
    ).body?.pipeThrough(new DecompressionStream("gzip"));
    const decompressedArrayBuffer = await new Response(
      decompressedStream,
    ).arrayBuffer();
    return new TextDecoder().decode(decompressedArrayBuffer);
  } catch {
    return undefined;
  }
}

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
      ) : kids.length > 0 || true ? (
        <div>
          {kids?.map((item, index) => {
            const {
              systemSource,
              avatarUrl,
              name,
              description,
              greeting,
              externalUrl,
              domian,
            } = item;

            const renderAvatar = () => (
              <div className={styles["avatar"]}>
                <img
                  src={avatarUrl as string}
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
            );

            const renderContent = (text: string, isOfficial = false) => (
              <div className={styles["content"]}>
                <div style={{ display: "flex", alignItems: "center" }}>
                  <div
                    className={isOfficial ? styles["name-A"] : styles["name"]}
                  >
                    {name}
                  </div>
                  {isOfficial && (
                    <span
                      style={{
                        color: "white",
                        backgroundColor: "oklch(75% 0.183 55.934)",
                        padding: "2px 6px",
                        borderRadius: "10px",
                        fontSize: "12px",
                        fontWeight: "bold",
                      }}
                    >
                      OFFICIAL
                    </span>
                  )}
                </div>
                <div className={styles["message"]}>{text}</div>
              </div>
            );

            const handleOpenUrl = async () => {
              if (!externalUrl) return;

              const { userName, from } = useOmeStore.getState();

              let url = externalUrl;

              if (url.includes("https://metis-ai-kid.testomenow.com")) {
                const encodedUserName =
                  await compressWithoutPlusOrMinus(userName);

                const encodedFrom = await compressWithoutPlusOrMinus(from);
                url += `&userId=${encodedUserName.base64}&from=${encodedFrom.base64}&baseUrl=${domian}`;
              }

              try {
                const message = {
                  data: { url },
                  type: MessageEnum.Navigate,
                  msg: "navigate",
                };

                if (window?.ReactNativeWebView) {
                  window.ReactNativeWebView.postMessage(
                    JSON.stringify(message),
                  );
                } else if (window?.webkit?.messageHandlers?.nativeListener) {
                  window.webkit.messageHandlers.nativeListener.postMessage(
                    JSON.stringify(message),
                  );
                } else {
                  window.open(url, "_blank");
                }
              } catch {}
            };

            switch (systemSource) {
              case AiKidSystemSource.SmartTalk:
                return (
                  <div key={index} className={styles["listItem"]}>
                    {renderAvatar()}
                    {renderContent(greeting ?? "")}
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

              case AiKidSystemSource.ToolAgent:
                return (
                  <div
                    key={index}
                    className={styles["listItem"]}
                    style={{ cursor: "pointer" }}
                    onClick={handleOpenUrl}
                  >
                    {renderAvatar()}
                    {renderContent(description ?? "")}
                  </div>
                );

              case AiKidSystemSource.DifyLevelAgent:
                return (
                  <div
                    key={index}
                    className={styles["listItem"]}
                    style={{ cursor: "pointer" }}
                    onClick={handleOpenUrl}
                  >
                    {renderAvatar()}
                    {renderContent(description ?? "", true)}
                  </div>
                );

              default:
                return null;
            }
          })}
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
