import clsx from "clsx";
import styles from "./home-tab.module.scss";
import { useEffect, useState } from "react";
import { Path } from "@/app/constant";

import ArrowLeftIcon from "../icons/arrow-left.svg";
import AddKidIcon from "../icons/add-kid.svg";
import MeitsHistoryIcon from "../icons/metis-history.svg";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useOmeStore } from "@/app/store/ome";
import { MessageEnum } from "../enum";
import { useEnhanceChatStore } from "../store/enhance-chat";
import { isNil } from "lodash";

export function HomeTab() {
  const tabs = [
    {
      title: "METIS",
    },
    {
      title: "My AI Kid",
    },
  ];

  const showScrollbar = false;
  const [activeTab, setActiveTab] = useState<number>(0);

  const navigate = useNavigate();

  const location = useLocation();

  const omeStore = useOmeStore();

  const chatStore = useEnhanceChatStore();

  useEffect(() => {
    setActiveTab(
      location.pathname === Path.Chat ||
        (location.pathname === Path.Home &&
          (chatStore.sessionId > 0 || !isNil(chatStore.currentSession)))
        ? 0
        : location.pathname === Path.AIKid
        ? 1
        : -1,
    );
  }, [location.pathname, chatStore.sessionId, chatStore.currentSession]);

  return (
    <>
      <div
        className={clsx(styles["tab-container"], {
          [styles["show-scrollbar"]]: showScrollbar,
          [styles["hide-scrollbar"]]: !showScrollbar,
        })}
      >
        <div className={styles["tab-header"]}>
          <div
            className={styles["tab-left-button"]}
            style={{
              visibility: omeStore.isFromApp ? "visible" : "hidden",
            }}
            onClick={() => {
              if (omeStore.isFromApp) {
                const message = {
                  data: {},
                  msg: "quit",
                  type: MessageEnum.Quit,
                };
                if (window?.ReactNativeWebView) {
                  window.ReactNativeWebView.postMessage(
                    JSON.stringify(message),
                  );
                } else if (
                  (window as any)?.webkit?.messageHandlers?.nativeListener
                ) {
                  (
                    window as any
                  )?.webkit?.messageHandlers?.nativeListener.postMessage(
                    JSON.stringify(message),
                  );
                }
              } else {
                navigate(Path.Home);
              }
            }}
          >
            <ArrowLeftIcon />
          </div>
          <div className={styles["tab-nav"]}>
            {tabs.map((tab, index) => (
              <button
                key={index}
                onClick={() => {
                  setActiveTab(index);

                  switch (index) {
                    case 0:
                      navigate(Path.Chat);
                      break;
                    case 1:
                      navigate(Path.AIKid);
                      break;
                  }
                }}
                className={clsx(styles["tab-button"], {
                  [styles["active"]]: activeTab === index,
                })}
              >
                {tab.title}
              </button>
            ))}
          </div>
          <div
            className={styles["tab-right-button"]}
            style={{
              visibility:
                activeTab === 0 && omeStore.isFromApp ? "visible" : "hidden",
            }}
            onClick={() => {
              if (omeStore.isFromApp) {
                if (activeTab === 0) {
                  omeStore.setIsShowHome(true);
                }
                navigate(activeTab === 0 ? Path.Home : Path.AddOrUpdateKid);
              }
            }}
          >
            {activeTab > -1 ? (
              activeTab === 0 ? (
                <MeitsHistoryIcon />
              ) : (
                <AddKidIcon />
              )
            ) : (
              <></>
            )}
          </div>
        </div>
        <div className={styles["tab-content"]}>
          <Outlet />
        </div>
      </div>
    </>
  );
}
