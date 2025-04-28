"use client";

require("../polyfill");

import { useEffect, useState } from "react";
import styles from "./home.module.scss";

import BotIcon from "../icons/bot.svg";
import LoadingIcon from "../icons/three-dots.svg";

import { getCSSVar, useMobileScreen } from "../utils";

import dynamic from "next/dynamic";
import { Path, SlotID } from "../constant";
import ErrorBoundary from "./error";

import {
  HashRouter as Router,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import { SideBar } from "./sidebar";
import { useAppConfig } from "../store/config";
import { AuthPage } from "./auth";
import { getClientConfig } from "../config/client";
import { type ClientApi, getClientApi } from "../client/api";
import { useAccessStore } from "../store";
import clsx from "clsx";
import { initializeMcpSystem, isMcpEnabled } from "../mcp/actions";
import isEmpty from "lodash-es/isEmpty";
import { useNewChatStore } from "../store/new-chat";
import "../locales/i18n";
import { useOmeStore } from "../store/ome";
import i18next from "i18next";
import { MessageEnum } from "../enum";
import { isNil } from "lodash-es";

export function Loading(props: { noLogo?: boolean }) {
  return (
    <div className={clsx("no-dark", styles["loading-content"])}>
      {!props.noLogo && <BotIcon />}
      <LoadingIcon />
    </div>
  );
}

const Artifacts = dynamic(async () => (await import("./artifacts")).Artifacts, {
  loading: () => <Loading noLogo />,
});

const Settings = dynamic(async () => (await import("./settings")).Settings, {
  loading: () => <Loading noLogo />,
});

const Chat = dynamic(async () => (await import("./chat")).Chat, {
  loading: () => <Loading noLogo />,
});

const NewChat = dynamic(async () => (await import("./new-chat")).NewChat, {
  loading: () => <Loading noLogo />,
});

const MaskPage = dynamic(async () => (await import("./mask")).MaskPage, {
  loading: () => <Loading noLogo />,
});

const PluginPage = dynamic(async () => (await import("./plugin")).PluginPage, {
  loading: () => <Loading noLogo />,
});

const SearchChat = dynamic(
  async () => (await import("./search-chat")).SearchChatPage,
  {
    loading: () => <Loading noLogo />,
  },
);

const Sd = dynamic(async () => (await import("./sd")).Sd, {
  loading: () => <Loading noLogo />,
});

const McpMarketPage = dynamic(
  async () => (await import("./mcp-market")).McpMarketPage,
  {
    loading: () => <Loading noLogo />,
  },
);

const RealTimeAdio = dynamic(
  async () => (await import("./realtime-audio")).RealTimeAdio,
  {
    loading: () => null,
  },
);

const Test = dynamic(async () => (await import("./test-copy")).Index, {
  loading: () => null,
});

const Test1 = dynamic(async () => (await import("./test")).Index, {
  loading: () => null,
});

export function useSwitchTheme() {
  const config = useAppConfig();

  useEffect(() => {
    document.body.classList.remove("light");
    document.body.classList.remove("dark");

    if (config.theme === "dark") {
      document.body.classList.add("dark");
    } else if (config.theme === "light") {
      document.body.classList.add("light");
    }

    const metaDescriptionDark = document.querySelector(
      'meta[name="theme-color"][media*="dark"]',
    );
    const metaDescriptionLight = document.querySelector(
      'meta[name="theme-color"][media*="light"]',
    );

    if (config.theme === "auto") {
      metaDescriptionDark?.setAttribute("content", "#151515");
      metaDescriptionLight?.setAttribute("content", "#fafafa");
    } else {
      const themeColor = getCSSVar("--theme-color");
      metaDescriptionDark?.setAttribute("content", themeColor);
      metaDescriptionLight?.setAttribute("content", themeColor);
    }
  }, [config.theme]);
}

function useHtmlLang() {
  const { language } = useOmeStore();
  useEffect(() => {
    const isoLangString: Record<string, string> = {
      cn: "zh-Hans",
      tw: "zh-Hant",
    };

    const lang = isoLangString[language] ?? language;
    const htmlLang = document.documentElement.lang;

    if (lang !== htmlLang) {
      document.documentElement.lang = lang;
    }
  }, []);
}

const useHasHydrated = () => {
  const [hasHydrated, setHasHydrated] = useState<boolean>(false);

  useEffect(() => {
    setHasHydrated(true);
  }, []);

  return hasHydrated;
};

const loadAsyncGoogleFont = () => {
  const linkEl = document.createElement("link");
  const proxyFontUrl = "/google-fonts";
  const remoteFontUrl = "https://fonts.googleapis.com";
  const googleFontUrl =
    getClientConfig()?.buildMode === "export" ? remoteFontUrl : proxyFontUrl;
  linkEl.rel = "stylesheet";
  linkEl.href =
    googleFontUrl +
    "/css2?family=" +
    encodeURIComponent("Noto Sans:wght@300;400;700;900") +
    "&display=swap";
  document.head.appendChild(linkEl);
};

export function WindowContent(props: { children: React.ReactNode }) {
  return (
    <div className={styles["window-content"]} id={SlotID.AppBody}>
      {props?.children}
    </div>
  );
}

function Screen() {
  const config = useAppConfig();
  const location = useLocation();
  const omeStore = useOmeStore();
  const isArtifact = location.pathname.includes(Path.Artifacts);
  const isHome = location.pathname === Path.Home;
  const isAuth = location.pathname === Path.Auth;
  const isSd = location.pathname === Path.Sd;
  const isSdNew = location.pathname === Path.SdNew;

  const isMobileScreen = useMobileScreen();
  const shouldTightBorder =
    getClientConfig()?.isApp || (config.tightBorder && !isMobileScreen);

  // useEffect(() => {
  //   loadAsyncGoogleFont();
  // }, []);

  useEffect(() => {
    const linkEl = document.createElement("link");
    const googleFontUrl =
      "https://fonts.googleapis.com/css2?family=Noto+Sans:wght@300;400;700;900&display=swap";
    linkEl.rel = "stylesheet";
    linkEl.href = googleFontUrl;
    document.head.appendChild(linkEl);
  }, []);

  if (isArtifact) {
    return (
      <Routes>
        <Route path="/artifacts/:id" element={<Artifacts />} />
      </Routes>
    );
  }
  const renderContent = () => {
    if (isAuth) return <AuthPage />;
    if (isSd) return <Sd />;
    if (isSdNew) return <Sd />;
    return (
      <>
        <SideBar
          className={clsx({
            [styles["sidebar-show"]]: isHome,
          })}
        />
        <WindowContent>
          <Routes>
            <Route path={Path.Home} element={<Chat />} />
            <Route path={Path.NewChat} element={<NewChat />} />
            <Route path={Path.Masks} element={<MaskPage />} />
            <Route path={Path.Plugins} element={<PluginPage />} />
            <Route path={Path.SearchChat} element={<SearchChat />} />
            <Route path={Path.Chat} element={<Chat />} />
            <Route path={Path.Settings} element={<Settings />} />
            <Route path={Path.McpMarket} element={<McpMarketPage />} />
            <Route path={Path.RealTimeAdio} element={<RealTimeAdio />} />
            <Route path={Path.Test} element={<Test />} />
            <Route path={Path.Test1} element={<Test1 />} />
          </Routes>
        </WindowContent>
      </>
    );
  };

  return (
    <div
      className={clsx(styles.container, {
        [styles["tight-container"]]: shouldTightBorder,
        [styles["rtl-screen"]]: omeStore.language === "ar",
      })}
    >
      {renderContent()}
    </div>
  );
}

export function useLoadData() {
  const config = useAppConfig();

  const api: ClientApi = getClientApi(config.modelConfig.providerName);

  useEffect(() => {
    (async () => {
      const models = await api.llm.models();
      config.mergeModels(models);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

export function Home() {
  useSwitchTheme();
  useLoadData();
  // useHtmlLang();

  const appConfig = useAppConfig();

  const omeStore = useOmeStore();

  useEffect(() => {
    console.log("[Config] got config from build time", getClientConfig());
    useAccessStore.getState().fetch();

    const initMcp = async () => {
      try {
        const enabled = await isMcpEnabled();
        if (enabled) {
          console.log("[MCP] initializing...");
          await initializeMcpSystem();
          console.log("[MCP] initialized");
        }
      } catch (err) {
        console.error("[MCP] failed to initialize:", err);
      }
    };
    initMcp();
  }, []);

  useEffect(() => {
    const handleMessage = (event: any) => {
      const data = event.data;

      if (isEmpty(data) || (typeof data === "string" && data === "")) return;

      if (window.ReactNativeWebView) {
        try {
          const params = JSON.parse(data);

          if (!isEmpty(params?.from)) {
            omeStore.setFrom(params.from ?? "");
          }
          if (!isEmpty(params?.ometoken)) {
            omeStore.setToken(params?.ometoken ?? "");
          }
          if (!isEmpty(params?.omeUserId)) {
            omeStore.setUserId(params?.omeUserId ?? "");
          }
          if (!isEmpty(params?.omeUserName)) {
            omeStore.setUserName(params?.omeUserName ?? "");
          }
          omeStore.setIsFromApp(true);
          useNewChatStore.getState().setIsDown(true);
          if (!isEmpty(params?.lanauge)) {
            omeStore.setLanguage(params?.lanauge);
          }
        } catch {}
      } else {
        if (
          !event.origin.includes("omeoffice") &&
          !event.origin.includes("localhost")
        ) {
          return; // 如果不是信任的源，忽略消息
        }

        if (!isEmpty(event?.data?.ometoken)) {
          console.log(
            "[OmeToken] got ometoken from iframe",
            event.data.ometoken,
          );
          omeStore.setToken(event.data.ometoken);
          useNewChatStore.getState().setIsDown(true);
        }

        if (!isEmpty(event?.data?.omeUserId)) {
          omeStore.setUserId(event?.data?.omeUserId);
        }

        if (!isEmpty(event?.data?.omeUserName)) {
          omeStore.setUserName(event?.data?.omeUserName);
        }
        omeStore.setIsFromApp(false);
      }
    };

    window.addEventListener("message", handleMessage);

    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, []);

  useEffect(() => {
    try {
      if (localStorage.getItem("lang")) {
        localStorage.removeItem("lang");
        console.log("lang 已从 localStorage 中删除");
      }
    } catch {}
  }, []);

  useEffect(() => {
    if (appConfig._hasHydrated) {
      if (window.ReactNativeWebView) {
        try {
          const message = {
            data: {},
            msg: "omemetis is ready",
            type: MessageEnum.Send,
          };
          window.ReactNativeWebView.postMessage(JSON.stringify(message));
        } catch {}
      } else {
        window.parent.postMessage("omemetis is ready", "*");
      }

      appConfig.setDefaultModel();
    }
  }, [appConfig._hasHydrated]);

  useEffect(() => {
    localStorage.setItem("metis_lanuage", omeStore.language);
    i18next.changeLanguage(omeStore.language);

    const isoLangString: Record<string, string> = {
      cn: "zh-Hans",
      tw: "zh-Hant",
    };

    const lang = isoLangString[omeStore.language] ?? omeStore.language;
    const htmlLang = document.documentElement.lang;

    if (lang !== htmlLang) {
      document.documentElement.lang = lang;
    }
  }, [omeStore.language]);

  if (!useHasHydrated() || isNil(omeStore.isFromApp)) {
    return <Loading />;
  }

  return (
    <ErrorBoundary>
      <Router>
        <Screen />
      </Router>
    </ErrorBoundary>
  );
}
