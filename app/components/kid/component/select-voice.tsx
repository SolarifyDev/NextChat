import { Path } from "@/app/constant";
import { TabComponent, TabItem } from "./tab";
import { useNavigate } from "react-router-dom";
import ArrowLeftIcon from "../../../icons/arrow-left.svg";
import AudioSvg from "../../../icons/audio.svg";
import styles from "./select-voice.module.scss";

import gril from "../../../icons/3d girl Avatar.png";

import NextImage, { StaticImageData } from "next/image";
import { useTranslation } from "react-i18next";

interface VoiceData {
  title: string;
  description: string;
  avatar: StaticImageData;
  type: number;
}

interface VoiceListProps {
  items: VoiceData[];
}

export function SelectVoice() {
  const { t } = useTranslation();

  const data: VoiceData[] = [
    {
      title: t("SelectVoice.MatureMale"),
      description: t("SelectVoice.YoungMale"),
      avatar: gril,
      type: 0,
    },
    {
      title: t("SelectVoice.GentleFemale"),
      description: t("SelectVoice.YoungFemale"),
      avatar: gril,
      type: 1,
    },
  ];

  // 语音项组件的 props 类型
  interface VoiceItemProps {
    item: VoiceData;
  }

  // 抽取通用的语音项组件
  const VoiceItem = ({ item }: VoiceItemProps) => (
    <div className={styles["voice-item"]}>
      <div className={styles["avatar"]}>
        <NextImage src={item.avatar.src} alt="avatar" width={48} height={48} />
      </div>
      <div className={styles["content"]}>
        <div className={styles["info"]}>
          <div className={styles["voice-name"]}>{item.title}</div>
          <div className={styles["voice-type"]}>{item.description}</div>
        </div>
        <div className={styles["actions"]}>
          <div className={styles["audio-icon"]}>
            <AudioSvg />
          </div>
          <div className={styles["selected-text"]}>
            {t("SelectVoice.Selected")}
          </div>
        </div>
      </div>
    </div>
  );

  // 抽取通用的语音列表组件
  const VoiceList = ({ items }: VoiceListProps) => (
    <div
      style={{
        backgroundColor: "white",
        borderRadius: "16px",
        padding: "5px 0",
      }}
    >
      {items.map((item, index) => (
        <VoiceItem key={index} item={item} />
      ))}
    </div>
  );

  // 优化后的 tabsData
  const tabsData: TabItem[] = [
    {
      title: t("SelectVoice.Recommended"),
      component: <VoiceList items={data} />,
    },
    {
      title: t("SelectVoice.Male"),
      component: <VoiceList items={data.filter((item) => item.type === 0)} />,
    },
    {
      title: t("SelectVoice.Female"),
      component: <VoiceList items={data.filter((item) => item.type === 1)} />,
    },
    {
      title: t("SelectVoice.Dialect"),
      component: <></>,
    },
  ];

  const navigate = useNavigate();

  return (
    <>
      <TabComponent
        tabs={tabsData}
        header={
          <div className={styles["voice-selector-header"]}>
            <div
              className={styles["back-button"]}
              onClick={() => navigate(Path.AddOrUpdateKid)}
            >
              <ArrowLeftIcon />
            </div>
            <div className={styles["title"]}>{t("SelectVoice.Title")}</div>
            <div
              className={styles["complete-button"]}
              onClick={() => navigate(Path.AddOrUpdateKid)}
            >
              {t("SelectVoice.Confirm")}
            </div>
          </div>
        }
        defaultTab={0}
        showScrollbar={false}
      />
    </>
  );
}
