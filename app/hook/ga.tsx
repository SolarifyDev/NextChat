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
