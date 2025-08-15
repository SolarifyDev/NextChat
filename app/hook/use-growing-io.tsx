"use client";

import { useUpdateEffect } from "ahooks";
import { useEffect, useState } from "react";

export const GrowingIOProvider = () => {
  const [growingIoId, setGrowingIoId] = useState<string>("");

  useEffect(() => {
    async function initGrowingIO() {
      try {
        const res = await fetch("/api/growingio");
        const config = await res.json();

        console.log(config, "config");

        setGrowingIoId(config?.growingId || "");
      } catch (err) {
        console.error("GrowingIO 初始化失败");
      }
    }

    initGrowingIO();
  }, []);

  useUpdateEffect(() => {
    const script = document.createElement("script");
    script.innerHTML = `
      !function(e,t,n,g,i){e[i]=e[i]||function(){(e[i].q=e[i].q||[]).push(arguments)},n=t.createElement("script"),tag=t.getElementsByTagName("script")[0],n.async=1,n.src=('https:'==document.location.protocol?'https://':'http://')+g,tag.parentNode.insertBefore(n,tag)}(window,document,"script","assets.giocdn.com/2.1/gio.js","gio");
      gio('init','${growingIoId}', {});
      gio('send');
    `;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, [growingIoId]);

  return <></>;
};
