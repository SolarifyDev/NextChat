import { useNavigate } from "react-router-dom";
import AidHelpIcon from "../../../icons/kid-help.svg";
import CreateKidIcon from "../../../icons/create-kid.svg";
import CallIcon from "../../../icons/call.svg";
import KidEditIcon from "../../../icons/kid-edit.svg";
import { Path } from "@/app/constant";

import styles from "./kid.module.scss";
import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import { IType, useKidStore } from "@/app/store/kid";
import { Spin } from "antd";
import clsx from "clsx";
import { useOmeStore } from "@/app/store/ome";
import { StaticImageData } from "next/image";
import OneP from "../../../icons/1P.png";
import TwoM from "../../../icons/2M.png";
import ThreeM from "../../../icons/3M.png";
import FourM from "../../../icons/4M.png";
import FiveM from "../../../icons/5M.png";
import SixM from "../../../icons/6M.png";
import FourPC from "../../../icons/4PC.png";
import FourPB from "../../../icons/4PB.png";
import NewsMinimalist from "../../../icons/News Minimalist.png";
import HrAi from "../../../icons/HR AI.png";
import { MessageEnum } from "@/app/enum";

interface KidLever {
  name: string;
  url: string;
  description: string;
  icon: StaticImageData;
}

// 生成所有大小写组合
function generateCasePermutations(str: string): string[] {
  const results: string[] = [];

  function helper(current: string, index: number) {
    if (index === str.length) {
      results.push(current);
      return;
    }

    const char = str[index];

    // 非字母保持原样
    if (!/[a-zA-Z]/.test(char)) {
      helper(current + char, index + 1);
    } else {
      helper(current + char.toLowerCase(), index + 1);
      helper(current + char.toUpperCase(), index + 1);
    }
  }

  helper("", 0);
  return results;
}

// 你原来的压缩方法
const gzipToBase64 = async (input: string) => {
  const uint8Array = new TextEncoder().encode(input);
  const compressedStream = new Response(
    new Blob([uint8Array]).stream().pipeThrough(new CompressionStream("gzip")),
  ).arrayBuffer();
  const compressedUint8Array = new Uint8Array(await compressedStream);
  return btoa(String.fromCharCode(...compressedUint8Array));
};

// 新方法：自动找不含 + 或 - 的 base64
const compressWithoutPlusOrMinus = async (input: string) => {
  const combos = generateCasePermutations(input);

  for (const combo of combos) {
    const b64 = await gzipToBase64(combo);

    // ⚠ 注意：base64 只会产生 "+" 不会产生 "-"（除非你 URL-safe 转换）
    // 所以这里一起判断
    if (!b64.includes("+") && !b64.includes("-")) {
      return { input: combo, base64: b64 };
    }
  }

  // 全部都含 + 或 -，返回最后一个
  const last = await gzipToBase64(combos[combos.length - 1]);
  return { input: combos[combos.length - 1], base64: last };
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

  const { isFromApp, userId, userName, from, language } = useOmeStore();

  const hierarchicalData: KidLever[] = [
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

  // const toolData: KidLever[] = useMemo(async () => {
  //   return [
  //     // {
  //     //   name: "Deep Research",
  //     //   url: "http://47.238.241.114:3000/chat",
  //     //   description: "你好，我是市場調研專家，你想要的任何諮詢，隨時問我！",
  //     //   icon: DeepReSearch,
  //     // },
  //     {
  //       name: "新闻速递",
  //       url: "http://47.238.241.114:9000/",
  //       description:
  //         "你好，我是智能新聞助手，幫你快速發現和整理世界各地的新鮮資訊，隨時為你服務",
  //       icon: NewsMinimalist,
  //     },
  //     {
  //       name: "AI HR",
  //       url: `https://metis-ai-kid.testomenow.com/chatbot?token=HRhnj6GwltwSzJNY&userId=${await compressWithPako(
  //         userName ? userName.toUpperCase() : "",
  //       )}&from=${await compressWithPako(from)}`,
  //       description:
  //         "我是AI HR，專注於人力資源自助服務，幫你即時解答HR相關問題。",
  //       icon: HrAi,
  //     },
  //   ];
  // }, [userName, userId, from]);

  const [toolData, setToolData] = useState<KidLever[]>([]);

  useEffect(() => {
    async function buildToolData() {
      const encodedUserName = await compressWithoutPlusOrMinus(
        userName ? userName.toUpperCase() : "",
      );
      const encodedFrom = await compressWithoutPlusOrMinus(from);

      setToolData([
        {
          name: "新闻速递",
          url: "http://47.238.241.114:9000/",
          description:
            "你好，我是智能新聞助手，幫你快速發現和整理世界各地的新鮮資訊，隨時為你服務",
          icon: NewsMinimalist,
        },
        {
          name: "AI HR",
          url: `https://metis-ai-kid.testomenow.com/chatbot?token=HRhnj6GwltwSzJNY&userId=${encodedUserName.base64}&from=${encodedFrom.base64}`,
          description:
            "我是AI HR，專注於人力資源自助服務，幫你即時解答HR相關問題。",
          icon: HrAi,
        },
      ]);
    }

    buildToolData();
  }, [userName, from]);

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
                  <div
                    style={{
                      width: "100%",
                      color: "rgba(158, 157, 176, 1)",
                      display: "flex",
                      fontSize: "12px",
                    }}
                  >
                    {language !== "cn" && language !== "tw"
                      ? "AI-generated content"
                      : "內容由AI生成"}
                  </div>
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

          {(!isFromApp || from.includes("omeoffice")) &&
            toolData.map((item, index) => (
              <div
                className={styles["listItem"]}
                style={{
                  cursor: "pointer",
                }}
                key={index}
                onClick={() => {
                  try {
                    const message = {
                      data: {
                        url: item.url,
                      },
                      type: MessageEnum.Navigate,
                      msg: "navigate",
                    };

                    if (window?.ReactNativeWebView) {
                      window.ReactNativeWebView.postMessage(
                        JSON.stringify(message),
                      );
                    } else if (
                      window?.webkit?.messageHandlers?.nativeListener
                    ) {
                      window?.webkit?.messageHandlers?.nativeListener.postMessage(
                        JSON.stringify(message),
                      );
                    } else {
                      window.open(item.url, "_blank");
                    }
                  } catch {}
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
                  <div
                    style={{
                      width: "100%",
                      color: "rgba(158, 157, 176, 1)",
                      display: "flex",
                      fontSize: "12px",
                    }}
                  >
                    {language !== "cn" && language !== "tw"
                      ? "AI-generated content"
                      : "內容由AI生成"}
                  </div>
                </div>
              </div>
            ))}

          {(!isFromApp || from.includes("omeoffice")) &&
            hierarchicalData.map((item, index) => (
              <div
                className={styles["listItem"]}
                style={{
                  cursor: "pointer",
                }}
                key={index}
                onClick={() => {
                  try {
                    const message = {
                      data: {
                        url: item.url,
                      },
                      type: MessageEnum.Navigate,
                      msg: "navigate",
                    };

                    if (window?.ReactNativeWebView) {
                      window.ReactNativeWebView.postMessage(
                        JSON.stringify(message),
                      );
                    } else if (
                      window?.webkit?.messageHandlers?.nativeListener
                    ) {
                      window?.webkit?.messageHandlers?.nativeListener.postMessage(
                        JSON.stringify(message),
                      );
                    } else {
                      window.open(item.url, "_blank");
                    }
                  } catch {}
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
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    <div className={styles["name-A"]}>{item.name} </div>
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
                  </div>

                  <div className={styles["message"]}>{item.description}</div>
                  <div
                    style={{
                      width: "100%",
                      color: "rgba(158, 157, 176, 1)",
                      display: "flex",
                      fontSize: "12px",
                    }}
                  >
                    {language !== "cn" && language !== "tw"
                      ? "AI-generated content"
                      : "內容由AI生成"}
                  </div>
                </div>
              </div>
            ))}
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
