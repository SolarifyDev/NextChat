"use client";

import { useEffect, useState } from "react";
import BrowserLogger from "@arms/js-sdk";

export const ArmsProvider = (props: { children: React.ReactNode }) => {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    async function initARMS() {
      try {
        const res = await fetch("/api/arms");
        const config = await res.json();

        const logger = BrowserLogger.singleton({
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

        console.log("ARMS 初始化成功", config);
        (window as any).__bl = logger;
        setLoaded(true);
      } catch (err) {
        console.error("ARMS 初始化失败");
      }
    }

    initARMS();
  }, []);

  if (!loaded) return null;

  return <>{props.children}</>;
};
