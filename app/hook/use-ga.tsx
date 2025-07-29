"use client";

import { GoogleAnalytics } from "@next/third-parties/google";
import { useEffect, useState } from "react";

export const GaProvider = () => {
  const [gaId, setGaId] = useState<string>("");

  useEffect(() => {
    async function initGA() {
      try {
        const res = await fetch("/api/ga");
        const config = await res.json();

        console.log(config, "config");

        setGaId(config?.gaId || "");
      } catch (err) {
        console.error("ARMS 初始化失败");
      }
    }

    initGA();
  }, []);

  // 在 GA 初始化后配置 cookie 属性
  useEffect(() => {
    if (gaId && typeof window !== "undefined") {
      let intervalId: NodeJS.Timeout;
      let timeoutId: NodeJS.Timeout;

      const configureGA = () => {
        if (window.gtag) {
          window.gtag("config", gaId, { cookie_flags: "SameSite=None;Secure" });
          console.log("GA configured with custom cookie settings");

          // 成功后清除定时器
          clearInterval(intervalId);
          clearTimeout(timeoutId);
          return true;
        }
        return false;
      };

      // 延迟开始检查
      timeoutId = setTimeout(() => {
        // 先尝试一次
        if (!configureGA()) {
          // 如果失败，每100ms检查一次
          intervalId = setInterval(() => {
            configureGA();
          }, 100);

          // 5秒后停止尝试
          setTimeout(() => {
            clearInterval(intervalId);
            console.warn("GA gtag not available after 5 seconds");
          }, 10000);
        }
      }, 200);

      // 清理函数
      return () => {
        if (intervalId) clearInterval(intervalId);
        if (timeoutId) clearTimeout(timeoutId);
      };
    }
  }, [gaId]);

  return (
    <>
      {gaId && (
        <>
          <GoogleAnalytics gaId={gaId} />
        </>
      )}
    </>
  );
};
