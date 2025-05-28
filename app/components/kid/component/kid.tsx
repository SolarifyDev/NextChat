import clsx from "clsx";
import styles from "./kid.module.scss";
import { useEffect, useState } from "react";
import { Path } from "@/app/constant";

import ArrowLeftIcon from "../../../icons/arrow-left.svg";
import AddKidIcon from "../../../icons/add-kid.svg";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useOmeStore } from "@/app/store/ome";
import { useUpdateEffect } from "ahooks";

export function Kid() {
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

  useUpdateEffect(() => {
    switch (activeTab) {
      case 0:
        navigate(Path.Chat);
        break;
      case 1:
        navigate(Path.AIKid);
        break;
    }
  }, [activeTab]);

  useEffect(() => {
    setActiveTab(location.pathname === "/chat" ? 0 : 1);
  }, []);

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
            onClick={() => navigate(Path.Home)}
          >
            <ArrowLeftIcon />
          </div>
          <div className={styles["tab-nav"]}>
            {tabs.map((tab, index) => (
              <button
                key={index}
                onClick={() => setActiveTab(index)}
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
              visibility: activeTab !== 0 ? "visible" : "hidden",
            }}
          >
            <AddKidIcon />
          </div>
        </div>
        <div className={styles["tab-content"]}>
          <Outlet />
        </div>
      </div>
    </>
  );
}
