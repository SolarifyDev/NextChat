import React, { ReactNode, useState } from "react";
import styles from "./tab.module.scss";
import clsx from "clsx";

// Tab项的类型定义
export interface TabItem {
  title: string;
  component: ReactNode;
}

// TabComponent的Props类型定义
export interface TabComponentProps {
  tabs: TabItem[];
  header: ReactNode;
  defaultTab?: number;
  showScrollbar?: boolean;
}

export function TabComponent({
  tabs,
  header = <></>,
  defaultTab = 0,
  showScrollbar = true,
}: TabComponentProps) {
  const [activeTab, setActiveTab] = useState<number>(defaultTab);

  return (
    <div
      className={clsx(styles["tab-container"], {
        [styles["show-scrollbar"]]: showScrollbar,
        [styles["hide-scrollbar"]]: !showScrollbar,
      })}
    >
      {header && header}
      {/* Tab 标题栏 */}
      <div className={styles["tab-header"]}>
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
      </div>

      {/* Tab 内容区域 */}
      <div className={styles["tab-content"]}>
        {tabs[activeTab] && (
          <div className={styles["tab-panel"]}>{tabs[activeTab].component}</div>
        )}
      </div>
    </div>
  );
}
