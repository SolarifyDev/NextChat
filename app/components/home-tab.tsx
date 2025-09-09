import clsx from "clsx";
import styles from "./home-tab.module.scss";
import { useEffect, useState } from "react";
import { Path } from "@/app/constant";

import ArrowLeftIcon from "../icons/arrow-left.svg";
import HistoryIcon from "../icons/new-history.svg";
import AddKidIcon from "../icons/add-kid.svg";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useOmeStore } from "@/app/store/ome";
import { useNewChatStore } from "../store/new-chat";
import { isEmpty, isNil } from "lodash";
import { MessageEnum } from "../enum";

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

  const chatStore = useNewChatStore();

  useEffect(() => {
    if (omeStore.isFromApp) {
      setActiveTab(
        location.pathname === Path.Chat ||
          (location.pathname === Path.Home &&
            !isNil(omeStore.isShowHome) &&
            !omeStore.isShowHome)
          ? 0
          : location.pathname === Path.AIKid
          ? 1
          : -1,
      );
    } else {
      setActiveTab(
        location.pathname === Path.Chat ||
          (location.pathname === Path.Home &&
            !isEmpty(chatStore.currentSessionParams.id))
          ? 0
          : location.pathname === Path.AIKid
          ? 1
          : -1,
      );
    }
  }, [
    location.pathname,
    omeStore.isShowHome,
    omeStore.isFromApp,
    chatStore.currentSessionParams.id,
  ]);

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
            className={clsx(styles["tab-left-button"], "no-dark")}
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
            className={clsx(styles["tab-right-button"], "no-dark")}
            style={{
              visibility: activeTab !== 0 && false ? "visible" : "hidden",
            }}
            onClick={() => {
              navigate(activeTab < 1 ? Path.Home : Path.AddOrUpdateKid);

              if (activeTab < 1 && omeStore.isFromApp) {
                // 用这个字段在手机端显示历史界面
                omeStore.setIsShowHome(true);
              }
            }}
          >
            {activeTab < 1 ? <HistoryIcon /> : <AddKidIcon />}
          </div>
        </div>
        <div className={styles["tab-content"]}>
          <Outlet />
        </div>
      </div>
    </>
  );
}
