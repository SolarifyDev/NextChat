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
  useNavigate,
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
import "../locales/i18n";
import { useOmeStore } from "../store/ome";
import i18next from "i18next";
import { MessageEnum } from "../enum";
import { isNil } from "lodash-es";
import { LiveAPIProvider } from "../contexts/LiveAPIContext";
import UserActivityMonitor from "../hook/use-activity";
import { useInteractionMonitor } from "../hook/use-interaction-monitor";
import { trackEvent } from "../utils/ga";
import { PostGetToken } from "../client/smarties";
import { useEnhanceChatStore } from "../store/enhance-chat";

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
  loading: () => null,
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
  { loading: () => <Loading noLogo /> },
);

const Sd = dynamic(async () => (await import("./sd")).Sd, {
  loading: () => <Loading noLogo />,
});

const McpMarketPage = dynamic(
  async () => (await import("./mcp-market")).McpMarketPage,
  { loading: () => <Loading noLogo /> },
);

const HomeTab = dynamic(async () => (await import("./home-tab")).HomeTab, {
  loading: () => null,
});

const SelectVoice = dynamic(
  async () => (await import("./kid/component/select-voice")).SelectVoice,
  { loading: () => null },
);

const AddOrUpdateKid = dynamic(
  async () =>
    (await import("./kid/component/add-or-update-kid")).AddOrUpdateKid,
  { loading: () => null },
);

const Kid = dynamic(async () => (await import("./kid/component/kid")).Kid, {
  loading: () => null,
});

const Realtime = dynamic(
  async () => (await import("./kid/component/realtime")).Realtime,
  { loading: () => null },
);

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
  const navigate = useNavigate();
  const omeStore = useOmeStore();
  const chatStore = useEnhanceChatStore();
  const isArtifact = location.pathname.includes(Path.Artifacts);
  const isHome = location.pathname === Path.Home;
  const isAuth = location.pathname === Path.Auth;
  const isSd = location.pathname === Path.Sd;
  const isSdNew = location.pathname === Path.SdNew;

  const isMobileScreen = useMobileScreen();
  const shouldTightBorder =
    getClientConfig()?.isApp || (config.tightBorder && !isMobileScreen);

  useEffect(() => {
    let monitor: UserActivityMonitor;

    if (omeStore.from === "omelinkapp") {
      monitor = new UserActivityMonitor({
        timeout: 30 * 60 * 1000,
        gaEventName: "exit_app_timestamp",
        userId: omeStore.userId,
        debug: false,
        eventUuid: omeStore.eventUuid,
      });
    }

    return () => {
      if (monitor) monitor.destroy();
    };
  }, []);

  const { getCurrentInteractedMs } = useInteractionMonitor((interacted) => {
    console.log("📤 上传行为埋点 => ", interacted ? "活跃" : "无操作");

    if (omeStore.from === "omelinkapp") {
      trackEvent("app_is_active", {
        isActive: interacted,
        userId: omeStore.userId,
        metis_event_id: omeStore.eventUuid,
      });
    }
  });

  // 传递切换事件给父
  useEffect(() => {
    try {
      if (window?.ReactNativeWebView) {
        const message = {
          data: { path: location.pathname },
          msg: "pathname",
          type: MessageEnum.Path,
        };
        window.ReactNativeWebView.postMessage(JSON.stringify(message));
      }
    } catch {}
  }, [location.pathname]);

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

  useEffect(() => {
    if (chatStore._hasHydrated && omeStore.isFromApp) {
      chatStore.newSession(undefined, () => {
        if (omeStore.isFromApp) {
          omeStore.setIsShowHome(false);
        }

        if (location.pathname !== Path.Home) return;

        navigate(Path.Chat);
      });
    }
  }, [omeStore.isFromApp, chatStore._hasHydrated]);

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
            [styles["sidebar-show"]]: omeStore.isFromApp
              ? omeStore.isShowHome && isHome
              : isHome,
          })}
          getCurrentInteractedMs={getCurrentInteractedMs}
        />
        <WindowContent>
          <Routes>
            {/* <Route path={Path.Home} element={<Chat />} /> */}
            <Route path={Path.NewChat} element={<NewChat />} />
            <Route path={Path.Masks} element={<MaskPage />} />
            <Route path={Path.Plugins} element={<PluginPage />} />
            <Route path={Path.SearchChat} element={<SearchChat />} />
            {/* <Route path={Path.Chat} element={<Chat />} /> */}
            <Route path={Path.Settings} element={<Settings />} />
            <Route path={Path.McpMarket} element={<McpMarketPage />} />
            <Route path={Path.SelectVoice} element={<SelectVoice />} />
            <Route path={Path.AddOrUpdateKid} element={<AddOrUpdateKid />} />
            <Route
              path={Path.Realtime}
              element={
                <LiveAPIProvider>
                  <Realtime />
                </LiveAPIProvider>
              }
            />

            <Route element={<HomeTab />}>
              <Route path={Path.Home} element={<Chat />} />
              <Route path={Path.AIKid} element={<Kid />} />
              <Route path={Path.Chat} element={<Chat />} />
            </Route>
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
    if (useAccessStore.getState()._hasHydrated) {
      useAccessStore.getState().fetch();
    }
  }, [useAccessStore.getState()._hasHydrated]);

  useEffect(() => {
    const handleMessage = async (event: any) => {
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
          if (!isEmpty(params?.ticket)) {
            omeStore.setTicket(params?.ticket ?? "");

            try {
              const res = await fetch("/api/omeAccount");
              const config = await res.json();

              omeStore.setClient(
                config?.clientId || "",
                config?.clientSecret || "",
                config?.score || "",
              );
            } catch {
              const message = {
                data: {},
                msg: "quit",
                type: MessageEnum.Quit,
              };

              window.ReactNativeWebView.postMessage(JSON.stringify(message));
            }

            await PostGetToken("get", {
              grant_type: "ticket",
              ticket: params?.ticket ?? "",
            })
              .then((res) => {
                omeStore.setToken(res.access_token ?? "");
                omeStore.setRefreshToken(res.refresh_token ?? "");

                omeStore.setIsFromApp(true);
                useEnhanceChatStore.getState().setIsDown(true);
              })
              .catch(() => {
                const message = {
                  data: {},
                  msg: "quit",
                  type: MessageEnum.Quit,
                };

                window.ReactNativeWebView.postMessage(JSON.stringify(message));
              });
          } else {
            omeStore.setIsFromApp(true);
            useEnhanceChatStore.getState().setIsDown(true);
          }
          if (!isEmpty(params?.lanauge)) {
            omeStore.setLanguage(params?.lanauge);
          }
          if (!isEmpty(params?.eventUuid)) {
            omeStore.setEventUuid(params.eventUuid);
          }
        } catch {}
      } else {
        if (
          !event.origin.includes("omeoffice") &&
          !event.origin.includes("localhost")
        ) {
          return; // 如果不是信任的源，忽略消息
        }

        // if (!isEmpty(event?.data?.ometoken)) {
        //   console.log(
        //     "[OmeToken] got ometoken from iframe",
        //     event.data.ometoken,
        //   );
        //   omeStore.setToken(event.data.ometoken);
        //   useEnhanceChatStore.getState().setIsDown(true);
        // }

        // if (!isEmpty(event?.data?.omeUserId)) {
        //   omeStore.setUserId(event?.data?.omeUserId);
        // }

        // if (!isEmpty(event?.data?.omeUserName)) {
        //   omeStore.setUserName(event?.data?.omeUserName);
        // }

        // omeStore.setFrom("omeoffice web");

        // omeStore.setIsFromApp(false);

        console.log("metis开始检测");

        if (
          !isEmpty(event?.data?.omeUserId) &&
          !isEmpty(event?.data?.omeUserName)
        ) {
          console.log("metis进来了");

          omeStore.setUserId(event?.data?.omeUserId);
          omeStore.setUserName(event?.data?.omeUserName);
          omeStore.setFrom("omeoffice web");
          omeStore.setIsFromApp(false);
          useEnhanceChatStore.getState().setIsDown(true);
        }
      }
    };

    (window as any).receiveFromNative = (response: string) => {
      try {
        const data = JSON.parse(response);

        if (isEmpty(data) || (typeof response === "string" && response === ""))
          return;

        if (!isEmpty(data?.from)) {
          omeStore.setFrom(data.from ?? "");
        }
        if (!isEmpty(data?.ometoken)) {
          omeStore.setToken(data?.ometoken ?? "");
        }
        if (!isEmpty(data?.omeUserId)) {
          omeStore.setUserId(data?.omeUserId ?? "");
        }
        if (!isEmpty(data?.omeUserName)) {
          omeStore.setUserName(data?.omeUserName ?? "");
        }
        omeStore.setIsFromApp(true);
        useEnhanceChatStore.getState().setIsDown(true);

        if (!isEmpty(data?.lanauge)) {
          omeStore.setLanguage(data?.lanauge);
        }
      } catch (error) {
        const message = { data: {}, msg: "quit", type: MessageEnum.Quit };

        if (window?.webkit?.messageHandlers?.nativeListener) {
          window?.webkit?.messageHandlers?.nativeListener.postMessage(
            JSON.stringify(message),
          );
        }
      }
    };

    window.addEventListener("message", handleMessage);

    return () => {
      window.removeEventListener("message", handleMessage);

      if ((window as any).receiveFromNative) {
        delete (window as any).receiveFromNative;
      }
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
      const message = {
        data: {},
        msg: "omemetis is ready",
        type: MessageEnum.Send,
      };

      if (window.ReactNativeWebView) {
        try {
          window.ReactNativeWebView.postMessage(JSON.stringify(message));
        } catch {}
      } else if (window?.webkit?.messageHandlers?.nativeListener) {
        window?.webkit?.messageHandlers?.nativeListener.postMessage(
          JSON.stringify(message),
        );
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
