"use client";

import { useEffect, useState } from "react";
import BrowserLogger from "@arms/js-sdk";

export const ArmsProvider = () => {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    async function initARMS() {
      try {
        const res = await fetch("/api/arms");
        const config = await res.json();

        BrowserLogger.singleton({
          pid: config.pid,
          environment: config.environment || "pre",
          appType: "web",
          sendResource: true,
          enableLinkTrace: true,
          behavior: true,
          enableSPA: true,
          useFmp: true,
          imgUrl: "https://arms-retcode.aliyuncs.com/r.png?",
        });

        setLoaded(true);
      } catch (err) {
        console.error("ARMS 初始化失败");
      }
    }

    initARMS();
  }, []);

  if (!loaded) return <></>;

  return <></>;
};
