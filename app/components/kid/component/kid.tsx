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

  const { language } = useOmeStore();

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
            );

            const handleOpenUrl = async () => {
              if (!externalUrl) return;

              const { userName, from } = useOmeStore.getState();

              let url = externalUrl;

              const encodedUserName = await compressWithoutPlusOrMinus(
                userName ?? "",
              );
              const encodedFrom = await compressWithoutPlusOrMinus(from);

              if (url.includes("https://metis-ai-kid.testomenow.com")) {
                url += `&userId=${encodedUserName}&from=${encodedFrom}&baseUrl=${domian}`;
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
