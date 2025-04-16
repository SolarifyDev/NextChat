import React, { Fragment, useEffect, useMemo, useRef, useState } from "react";

import styles from "./home.module.scss";

import { IconButton } from "./button";
import ChatGptIcon from "../icons/chatgpt.svg";
import AddIcon from "../icons/add.svg";
import DeleteIcon from "../icons/delete.svg";
import MaskIcon from "../icons/mask.svg";
import McpIcon from "../icons/mcp.svg";
import DragIcon from "../icons/drag.svg";
import DiscoveryIcon from "../icons/discovery.svg";
import SettingsIcon from "../icons/settings.svg";
import PhoneIcon from "../icons/phone.svg";
import ArrowLeftIcon from "../icons/arrow-left.svg";

import { useAppConfig } from "../store";

import {
  DEFAULT_SIDEBAR_WIDTH,
  MAX_SIDEBAR_WIDTH,
  MIN_SIDEBAR_WIDTH,
  NARROW_SIDEBAR_WIDTH,
  Path,
} from "../constant";

import { Link, useNavigate } from "react-router-dom";
import { isIOS, useMobileScreen } from "../utils";
import dynamic from "next/dynamic";
import { Selector, showConfirm } from "./ui-lib";
import clsx from "clsx";
import { isMcpEnabled } from "../mcp/actions";
import { useNewChatStore } from "../store/new-chat";
import { useTranslation } from "react-i18next";
import { useDebounceFn } from "ahooks";
import { useOmeStore } from "../store/ome";
import { MessageEnum } from "../enum";
import { Button } from "antd";

const ChatList = dynamic(async () => (await import("./chat-list")).ChatList, {
  loading: () => null,
});

export function useHotKey() {
  const chatStore = useNewChatStore();

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.altKey || e.ctrlKey) {
        if (e.key === "ArrowUp") {
          chatStore.nextSession(-1);
        } else if (e.key === "ArrowDown") {
          chatStore.nextSession(1);
        }
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });
}

export function useDragSideBar() {
  const limit = (x: number) => Math.min(MAX_SIDEBAR_WIDTH, x);

  const config = useAppConfig();
  const startX = useRef(0);
  const startDragWidth = useRef(config.sidebarWidth ?? DEFAULT_SIDEBAR_WIDTH);
  const lastUpdateTime = useRef(Date.now());

  const toggleSideBar = () => {
    config.update((config) => {
      if (config.sidebarWidth < MIN_SIDEBAR_WIDTH) {
        config.sidebarWidth = DEFAULT_SIDEBAR_WIDTH;
      } else {
        config.sidebarWidth = NARROW_SIDEBAR_WIDTH;
      }
    });
  };

  const onDragStart = (e: MouseEvent) => {
    // Remembers the initial width each time the mouse is pressed
    startX.current = e.clientX;
    startDragWidth.current = config.sidebarWidth;
    const dragStartTime = Date.now();

    const handleDragMove = (e: MouseEvent) => {
      if (Date.now() < lastUpdateTime.current + 20) {
        return;
      }
      lastUpdateTime.current = Date.now();
      const d = e.clientX - startX.current;
      const nextWidth = limit(startDragWidth.current + d);
      config.update((config) => {
        if (nextWidth < MIN_SIDEBAR_WIDTH) {
          config.sidebarWidth = NARROW_SIDEBAR_WIDTH;
        } else {
          config.sidebarWidth = nextWidth;
        }
      });
    };

    const handleDragEnd = () => {
      // In useRef the data is non-responsive, so `config.sidebarWidth` can't get the dynamic sidebarWidth
      window.removeEventListener("pointermove", handleDragMove);
      window.removeEventListener("pointerup", handleDragEnd);

      // if user click the drag icon, should toggle the sidebar
      const shouldFireClick = Date.now() - dragStartTime < 300;
      if (shouldFireClick) {
        toggleSideBar();
      }
    };

    window.addEventListener("pointermove", handleDragMove);
    window.addEventListener("pointerup", handleDragEnd);
  };

  const isMobileScreen = useMobileScreen();
  const shouldNarrow =
    !isMobileScreen && config.sidebarWidth < MIN_SIDEBAR_WIDTH;

  useEffect(() => {
    const barWidth = shouldNarrow
      ? NARROW_SIDEBAR_WIDTH
      : limit(config.sidebarWidth ?? DEFAULT_SIDEBAR_WIDTH);
    const sideBarWidth = isMobileScreen ? "100vw" : `${barWidth}px`;
    document.documentElement.style.setProperty("--sidebar-width", sideBarWidth);
  }, [config.sidebarWidth, isMobileScreen, shouldNarrow]);

  return {
    onDragStart,
    shouldNarrow,
  };
}

export function SideBarContainer(props: {
  children: React.ReactNode;
  onDragStart: (e: MouseEvent) => void;
  shouldNarrow: boolean;
  className?: string;
  isFromApp?: boolean;
}) {
  const isMobileScreen = useMobileScreen();
  const isIOSMobile = useMemo(
    () => isIOS() && isMobileScreen,
    [isMobileScreen],
  );
  const {
    children,
    className,
    isFromApp = false,
    onDragStart,
    shouldNarrow,
  } = props;
  return (
    <div
      className={clsx(styles.sidebar, className, {
        [styles["narrow-sidebar"]]: shouldNarrow,
      })}
      style={{
        // #3016 disable transition on ios mobile screen
        transition: isMobileScreen && isIOSMobile ? "none" : undefined,
        backgroundColor: isFromApp ? "#FAFAFF" : "",
        paddingTop: isFromApp ? "0px" : undefined,
        paddingBottom: isFromApp ? "0px" : undefined,
      }}
    >
      {children}
      {!isFromApp && (
        <div
          className={styles["sidebar-drag"]}
          onPointerDown={(e) => onDragStart(e as any)}
        >
          <DragIcon />
        </div>
      )}
    </div>
  );
}

export function SideBarHeader(props: {
  title?: string | React.ReactNode;
  subTitle?: string | React.ReactNode;
  logo?: React.ReactNode;
  children?: React.ReactNode;
  shouldNarrow?: boolean;
}) {
  const { title, subTitle, logo, children, shouldNarrow } = props;
  return (
    <Fragment>
      <div
        className={clsx(styles["sidebar-header"], {
          [styles["sidebar-header-narrow"]]: shouldNarrow,
        })}
        data-tauri-drag-region
      >
        <div className={styles["sidebar-title-container"]}>
          <div className={styles["sidebar-title"]} data-tauri-drag-region>
            {title}
          </div>
          <div className={styles["sidebar-sub-title"]}>{subTitle}</div>
        </div>
        <div className={clsx(styles["sidebar-logo"], "no-dark")}>{logo}</div>
      </div>
      {children}
    </Fragment>
  );
}

export function SideBarBody(props: {
  children: React.ReactNode;
  onClick?: (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
}) {
  const { onClick, children } = props;
  return (
    <div className={styles["sidebar-body"]} onClick={onClick}>
      {children}
    </div>
  );
}

export function SideBarTail(props: {
  primaryAction?: React.ReactNode;
  secondaryAction?: React.ReactNode;
}) {
  const { primaryAction, secondaryAction } = props;

  return (
    <div className={styles["sidebar-tail"]}>
      <div className={styles["sidebar-actions"]}>{primaryAction}</div>
      <div className={styles["sidebar-actions"]}>{secondaryAction}</div>
    </div>
  );
}

export function SideBar(props: { className?: string }) {
  const { t } = useTranslation();

  const DISCOVERY = [
    // { name: Locale.Plugin.Name, path: Path.Plugins },
    { name: t("Plugin.Name"), path: Path.Plugins },
    // { name: "Stable Diffusion", path: Path.Sd },
    // { name: Locale.SearchChat.Page.Title, path: Path.SearchChat },
    { name: t("SearchChat.Page.Title"), path: Path.SearchChat },
  ];

  useHotKey();
  const { onDragStart, shouldNarrow } = useDragSideBar();
  const [showDiscoverySelector, setshowDiscoverySelector] = useState(false);
  const navigate = useNavigate();
  const config = useAppConfig();
  const chatStore = useNewChatStore();
  const omeStore = useOmeStore();
  const [mcpEnabled, setMcpEnabled] = useState(false);

  const { getSession } = useNewChatStore();

  const { run: addConversation } = useDebounceFn(
    () => {
      chatStore.newSession(undefined, () => navigate(Path.Chat));
    },
    { wait: 300 },
  );

  const { run: quitMetis } = useDebounceFn(
    () => {
      if (window.ReactNativeWebView) {
        try {
          const message = {
            data: {},
            msg: "quit",
            type: MessageEnum.Quit,
          };
          window.ReactNativeWebView.postMessage(JSON.stringify(message));
        } catch {}
      }
    },
    { wait: 300 },
  );

  useEffect(() => {
    // 检查 MCP 是否启用
    const checkMcpStatus = async () => {
      const enabled = await isMcpEnabled();
      setMcpEnabled(enabled);
      console.log("[SideBar] MCP enabled:", enabled);
    };
    checkMcpStatus();
  }, []);

  useEffect(() => {
    if (chatStore.isDown) {
      getSession();
    }
  }, [chatStore.isDown]);

  return (
    <SideBarContainer
      onDragStart={!omeStore.isFromApp ? onDragStart : () => {}}
      shouldNarrow={shouldNarrow}
      isFromApp={omeStore.isFromApp!}
      {...props}
    >
      {!omeStore.isFromApp ? (
        <SideBarHeader
          title="NextChat"
          subTitle="Build your own AI assistant."
          logo={<ChatGptIcon />}
          shouldNarrow={shouldNarrow}
        >
          <div className={styles["sidebar-header-bar"]}>
            <IconButton
              icon={<MaskIcon />}
              // text={shouldNarrow ? undefined : Locale.Mask.Name}
              text={shouldNarrow ? undefined : t("Mask.Name")}
              className={styles["sidebar-bar-button"]}
              onClick={() => {
                if (config.dontShowMaskSplashScreen !== true) {
                  navigate(Path.NewChat, { state: { fromHome: true } });
                } else {
                  navigate(Path.Masks, { state: { fromHome: true } });
                }
              }}
              shadow
            />
            {mcpEnabled && (
              <IconButton
                icon={<McpIcon />}
                // text={shouldNarrow ? undefined : Locale.Mcp.Name}
                text={shouldNarrow ? undefined : t("Mcp.Name")}
                className={styles["sidebar-bar-button"]}
                onClick={() => {
                  navigate(Path.McpMarket, { state: { fromHome: true } });
                }}
                shadow
              />
            )}
            <IconButton
              icon={<DiscoveryIcon />}
              // text={shouldNarrow ? undefined : Locale.Discovery.Name}
              text={shouldNarrow ? undefined : t("Discovery.Name")}
              className={styles["sidebar-bar-button"]}
              onClick={() => setshowDiscoverySelector(true)}
              shadow
            />
          </div>
          {showDiscoverySelector && (
            <Selector
              items={[
                ...DISCOVERY.map((item) => {
                  return {
                    title: item.name,
                    value: item.path,
                  };
                }),
              ]}
              onClose={() => setshowDiscoverySelector(false)}
              onSelection={(s) => {
                navigate(s[0], { state: { fromHome: true } });
              }}
            />
          )}
        </SideBarHeader>
      ) : (
        <div
          style={{
            textAlign: "center",
            fontWeight: 600,
            fontSize: "16px",
            position: "relative",
          }}
        >
          <div
            style={{
              position: "absolute",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              top: "50%",
              transform: "translateY(-50%)",
            }}
            onClick={() => quitMetis()}
          >
            <ArrowLeftIcon />
          </div>
          <p>{t("Home.History")}</p>
        </div>
      )}

      <SideBarBody
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            navigate(Path.Home);
          }
        }}
      >
        <ChatList narrow={shouldNarrow} isFromApp={omeStore.isFromApp!} />
      </SideBarBody>

      <Button
        style={{
          marginTop: "10px",
        }}
        onClick={() => navigate(Path.Test1)}
      >
        通话
      </Button>

      {omeStore.isFromApp ? (
        <div
          style={{
            width: "100%",
            display: "flex",
            justifyContent: "center",
            paddingBottom: "8px",
          }}
        >
          <div
            style={{
              backgroundColor: "#FFFFFF",
              border: "1px solid #28B446",
              color: "#28B446",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              padding: "4px 16px",
              borderRadius: 33,
              fontSize: 16,
              marginTop: 8,
            }}
            onClick={() => addConversation()}
          >
            <PhoneIcon />{" "}
            {/* <div>{shouldNarrow ? undefined : Locale.Home.NewChat}</div> */}
            <div>{shouldNarrow ? undefined : t("Home.NewChat")}</div>
          </div>
        </div>
      ) : (
        <SideBarTail
          primaryAction={
            <>
              {/* 手机场景 */}
              <div className={clsx(styles["sidebar-action"], styles.mobile)}>
                <IconButton
                  icon={<DeleteIcon />}
                  onClick={async () => {
                    // if (await showConfirm(Locale.Home.DeleteChat)) {
                    if (await showConfirm(t("Home.DeleteChat"))) {
                      chatStore.deleteSession(chatStore.currentSessionIndex);
                    }
                  }}
                />
              </div>
              <div className={styles["sidebar-action"]}>
                <Link to={Path.Settings}>
                  <IconButton
                    // aria={Locale.Settings.Title}
                    aria={t("Settings.Title")}
                    icon={<SettingsIcon />}
                    shadow
                  />
                </Link>
              </div>
            </>
          }
          secondaryAction={
            <IconButton
              icon={<AddIcon />}
              // text={shouldNarrow ? undefined : Locale.Home.NewChat}
              text={shouldNarrow ? undefined : t("Home.NewChat")}
              onClick={() => {
                if (config.dontShowMaskSplashScreen) {
                  chatStore.newSession(undefined, () => navigate(Path.Chat));
                } else {
                  navigate(Path.NewChat);
                }
              }}
              shadow
            />
          }
        />
      )}
    </SideBarContainer>
  );
}
