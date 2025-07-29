"use client";

import { useState } from "react";
import ReactGA from "react-ga4";

export const GaProvider = () => {
  const [gaId, setGaId] = useState<string>("");

  ReactGA.initialize("G-47X0RQPPKG");

  // useEffect(() => {
  //   async function initGA() {
  //     try {
  //       const res = await fetch("/api/ga");
  //       const config = await res.json();

  //       console.log(config, "config");
  //       ReactGA.initialize(config?.gaId);

  //       setGaId(config?.gaId || "");
  //     } catch (err) {
  //       console.error("ARMS 初始化失败");
  //     }
  //   }

  //   initGA();
  // }, []);

  return (
    <>
      {/* {gaId && (
        <>
          <GoogleAnalytics gaId={gaId} />
        </>
      )} */}
    </>
  );
};
