import { useDebouncedCallback } from "use-debounce";
import {
  ExclamationCircleOutlined,
  FileExcelFilled,
  LeftCircleFilled,
  FilePdfFilled,
  FilePptFilled,
  RightCircleFilled,
  FileTextFilled,
  FileUnknownFilled,
  FileWordFilled,
  PlusOutlined,
} from "@ant-design/icons";
import React, {
  Fragment,
  RefObject,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import BrainIcon from "../icons/brain.svg";
import RenameIcon from "../icons/rename.svg";
import EditIcon from "../icons/rename.svg";
import ReturnIcon from "../icons/return.svg";
import CopyIcon from "../icons/copy.svg";
import SpeakIcon from "../icons/speak.svg";
import SpeakStopIcon from "../icons/speak-stop.svg";
import LoadingIcon from "../icons/three-dots.svg";
import LoadingButtonIcon from "../icons/loading.svg";
import PromptIcon from "../icons/prompt.svg";
import MaskIcon from "../icons/mask.svg";
import MaxIcon from "../icons/max.svg";
import MinIcon from "../icons/min.svg";
import ResetIcon from "../icons/reload.svg";
import ReloadIcon from "../icons/reload.svg";
import BreakIcon from "../icons/break.svg";
import SettingsIcon from "../icons/chat-settings.svg";
import DeleteIcon from "../icons/clear.svg";
import PinIcon from "../icons/pin.svg";
import ConfirmIcon from "../icons/confirm.svg";
import CloseIcon from "../icons/close.svg";
import CancelIcon from "../icons/cancel.svg";
import { CloseCircleFilled } from "@ant-design/icons";

import LightIcon from "../icons/light.svg";
import DarkIcon from "../icons/dark.svg";
import AutoIcon from "../icons/auto.svg";
import BottomIcon from "../icons/bottom.svg";
import AppBottomIcon from "../icons/app-bottom.svg";
import StopIcon from "../icons/pause.svg";
import AppStopIcon from "../icons/app-pause.svg";
import RobotIcon from "../icons/robot.svg";
import SizeIcon from "../icons/size.svg";
import QualityIcon from "../icons/hd.svg";
import StyleIcon from "../icons/palette.svg";
import PluginIcon from "../icons/plugin.svg";
import ShortcutkeyIcon from "../icons/shortcutkey.svg";
import McpToolIcon from "../icons/tool.svg";
import HeadphoneIcon from "../icons/headphone.svg";
import ArrowLeftIcon from "../icons/arrow-left.svg";
import AppRobot from "../icons/app-robot.svg";
import SearchOnlineIcon from "../icons/search-online.svg";
import AppSearchOnlineIcon from "../icons/search-online-app.svg";
import SendWhiteIcon from "../icons/send-white.svg";
import MetisIcon from "../icons/metis.png";
import SendIcon from "../icons/green-send.png";
import AppFaqIcon from "../icons/faq-app.svg";
import FaqIcon from "../icons/faq.svg";
import YuYinIcon from "../icons/yuyin.svg";

import NextImage from "next/image";

import {
  // BOT_HELLO,
  ChatMessage,
  createMessage,
  // DEFAULT_TOPIC,
  ModelType,
  SubmitKey,
  Theme,
  useAccessStore,
  useAppConfig,
  usePluginStore,
} from "../store";

import {
  copyToClipboard,
  getMessageFiles,
  getMessageImages,
  getMessageTextContent,
  isDalle3,
  isVisionModel,
  safeLocalStorage,
  getModelSizes,
  supportsCustomSize,
  useMobileScreen,
  selectOrCopy,
  showPlugins,
} from "../utils";

import {
  isImageFile,
  MAX_FILE_SIZE,
  ALLOWED_FILE_ACCEPT,
} from "@/app/utils/chat";
import { Attachment } from "../client/api";

import dynamic from "next/dynamic";

import { ChatControllerPool } from "../client/controller";
import { DalleQuality, DalleStyle, ModelSize } from "../typing";
import { Prompt, usePromptStore } from "../store/prompt";

import { IconButton } from "./button";
import styles from "./chat.module.scss";

import {
  List,
  ListItem,
  Modal,
  Selector,
  showConfirm,
  showPrompt,
  showToast,
} from "./ui-lib";
import { useNavigate } from "react-router-dom";
import {
  CHAT_PAGE_SIZE,
  DEFAULT_TTS_ENGINE,
  ModelProvider,
  Path,
  REQUEST_TIMEOUT_MS,
  ServiceProvider,
  UNFINISHED_INPUT,
} from "../constant";
import { Avatar } from "./emoji";
import { ContextPrompts, MaskAvatar, MaskConfig } from "./mask";
import { useMaskStore } from "../store/mask";
import { ChatCommandPrefix, useChatCommand, useCommand } from "../command";
import { prettyObject } from "../utils/format";
import { ExportMessageModal } from "./exporter";
import { getClientConfig } from "../config/client";
import { useAllModels } from "../utils/hooks";
import { ClientApi, MultimodalContent } from "../client/api";
import { createTTSPlayer } from "../utils/audio";
import { MsEdgeTTS, OUTPUT_FORMAT } from "../utils/ms_edge_tts";

import { isEmpty, isNil } from "lodash-es";
import { getModelProvider, nameLocales } from "../utils/model";
import { RealtimeChat } from "@/app/components/realtime-chat";
import clsx from "clsx";
import { getAvailableClientsCount, isMcpEnabled } from "../mcp/actions";
import { nanoid } from "nanoid";
import { TextAreaRef } from "antd/es/input/TextArea";
import { Input } from "antd";
import { useTranslation } from "react-i18next";
import { useOmeStore } from "../store/ome";
import { useDebounceFn } from "ahooks";
import {
  getBotHello,
  getDefaultTopic,
  useEnhanceChatStore,
} from "../store/enhance-chat";
import VoiceChatButton from "./voice";
import {
  getHeaders,
  PostAttachmentUpload,
  QuestionInputType,
} from "../client/smarties";
import { useDragOverlay } from "../hook/use-drag-overlay";
import UploadOverlay from "./upload-overlay";

const localStorage = safeLocalStorage();

const ttsPlayer = createTTSPlayer();
const MAX_ATTACHMENTS_COUNT = 20;
const MAX_ATTACHMENTS_TOTAL_SIZE = 50 * 1024 * 1024;

const Markdown = dynamic(async () => (await import("./markdown")).Markdown, {
  loading: () => <LoadingIcon />,
});

const MCPAction = () => {
  const navigate = useNavigate();
  const [count, setCount] = useState<number>(0);
  const [mcpEnabled, setMcpEnabled] = useState(false);

  useEffect(() => {
    const checkMcpStatus = async () => {
      const enabled = await isMcpEnabled();
      setMcpEnabled(enabled);
      if (enabled) {
        const count = await getAvailableClientsCount();
        setCount(count);
      }
    };
    checkMcpStatus();
  }, []);

  if (!mcpEnabled) return null;

  return (
    <ChatAction
      onClick={() => navigate(Path.McpMarket)}
      text={`MCP${count ? ` (${count})` : ""}`}
      icon={<McpToolIcon />}
    />
  );
};

export function SessionConfigModel(props: { onClose: () => void }) {
  const { t } = useTranslation();

  const chatStore = useEnhanceChatStore();
  const session = chatStore.currentSession!;
  const maskStore = useMaskStore();
  const navigate = useNavigate();

  return (
    <div className="modal-mask">
      <Modal
        // title={Locale.Context.Edit}
        title={t("Context.Edit")}
        onClose={() => props.onClose()}
        actions={[
          <IconButton
            key="reset"
            icon={<ResetIcon />}
            bordered
            // text={Locale.Chat.Config.Reset}
            text={t("Chat.Config.Reset")}
            onClick={async () => {
              // if (await showConfirm(Locale.Memory.ResetConfirm)) {
              if (await showConfirm(t("Memory.ResetConfirm"))) {
                chatStore.updateTargetSession(
                  (session) => (session.memoryPrompt = ""),
                  true,
                );
              }
            }}
          />,
          <IconButton
            key="copy"
            icon={<CopyIcon />}
            bordered
            // text={Locale.Chat.Config.SaveAs}
            text={t("Chat.Config.SaveAs")}
            onClick={() => {
              navigate(Path.Masks);
              setTimeout(() => {
                maskStore.create(session.mask);
              }, 500);
            }}
          />,
        ]}
      >
        <MaskConfig
          mask={session.mask}
          updateMask={(updater) => {
            const mask = { ...session.mask };
            updater(mask);
            chatStore.updateTargetSession((session) => (session.mask = mask));
          }}
          shouldSyncFromGlobal
          extraListItems={
            session.mask.modelConfig.sendMemory ? (
              <ListItem
                className="copyable"
                // title={`${Locale.Memory.Title} (${session.lastSummarizeIndex} of ${session.messages.length})`}
                title={`${t("Memory.Title")} (${
                  session.lastSummarizeIndex
                } of ${session.messages.length})`}
                // subTitle={session.memoryPrompt || Locale.Memory.EmptyContent}
                subTitle={session.memoryPrompt || t("Memory.EmptyContent")}
              ></ListItem>
            ) : (
              <></>
            )
          }
        ></MaskConfig>
      </Modal>
    </div>
  );
}

function PromptToast(props: {
  showToast?: boolean;
  showModal?: boolean;
  setShowModal: (_: boolean) => void;
}) {
  const { t } = useTranslation();

  const chatStore = useEnhanceChatStore();
  const session = chatStore.currentSession!;
  const context = session?.mask?.context;

  return (
    <div className={styles["prompt-toast"]} key="prompt-toast">
      {props.showToast && context?.length > 0 && (
        <div
          className={clsx(styles["prompt-toast-inner"], "clickable")}
          role="button"
          onClick={() => props.setShowModal(true)}
        >
          <BrainIcon />
          <span className={styles["prompt-toast-content"]}>
            {/* {Locale.Context.Toast(context.length)} */}
            {t("Context.Toast", { x: context.length })}
          </span>
        </div>
      )}
      {props.showModal && (
        <SessionConfigModel
          onClose={() => {
            props.setShowModal(false);
            chatStore.updateTargetSession((session) => {}, true);
          }}
        />
      )}
    </div>
  );
}

function useSubmitHandler() {
  const config = useAppConfig();
  const submitKey = config.submitKey;
  const isComposing = useRef(false);

  useEffect(() => {
    const onCompositionStart = () => {
      isComposing.current = true;
    };
    const onCompositionEnd = () => {
      isComposing.current = false;
    };

    window.addEventListener("compositionstart", onCompositionStart);
    window.addEventListener("compositionend", onCompositionEnd);

    return () => {
      window.removeEventListener("compositionstart", onCompositionStart);
      window.removeEventListener("compositionend", onCompositionEnd);
    };
  }, []);

  const shouldSubmit = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Fix Chinese input method "Enter" on Safari
    if (e.keyCode == 229) return false;
    if (e.key !== "Enter") return false;
    if (e.key === "Enter" && (e.nativeEvent.isComposing || isComposing.current))
      return false;
    return (
      (config.submitKey === SubmitKey.AltEnter && e.altKey) ||
      (config.submitKey === SubmitKey.CtrlEnter && e.ctrlKey) ||
      (config.submitKey === SubmitKey.ShiftEnter && e.shiftKey) ||
      (config.submitKey === SubmitKey.MetaEnter && e.metaKey) ||
      (config.submitKey === SubmitKey.Enter &&
        !e.altKey &&
        !e.ctrlKey &&
        !e.shiftKey &&
        !e.metaKey)
    );
  };

  return { submitKey, shouldSubmit };
}

export type RenderPrompt = Pick<Prompt, "title" | "content">;

export function PromptHints(props: {
  prompts: RenderPrompt[];
  onPromptSelect: (prompt: RenderPrompt) => void;
}) {
  const noPrompts = props.prompts.length === 0;
  const [selectIndex, setSelectIndex] = useState(0);
  const selectedRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSelectIndex(0);
  }, [props.prompts.length]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (noPrompts || e.metaKey || e.altKey || e.ctrlKey) {
        return;
      }
      // arrow up / down to select prompt
      const changeIndex = (delta: number) => {
        e.stopPropagation();
        e.preventDefault();
        const nextIndex = Math.max(
          0,
          Math.min(props.prompts.length - 1, selectIndex + delta),
        );
        setSelectIndex(nextIndex);
        selectedRef.current?.scrollIntoView({ block: "center" });
      };

      if (e.key === "ArrowUp") {
        changeIndex(1);
      } else if (e.key === "ArrowDown") {
        changeIndex(-1);
      } else if (e.key === "Enter") {
        const selectedPrompt = props.prompts.at(selectIndex);
        if (selectedPrompt) {
          props.onPromptSelect(selectedPrompt);
        }
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.prompts.length, selectIndex]);

  if (noPrompts) return null;
  return (
    <div className={styles["prompt-hints"]}>
      {props.prompts.map((prompt, i) => (
        <div
          ref={i === selectIndex ? selectedRef : null}
          className={clsx(styles["prompt-hint"], {
            [styles["prompt-hint-selected"]]: i === selectIndex,
          })}
          key={prompt.title + i.toString()}
          onClick={() => props.onPromptSelect(prompt)}
          onMouseEnter={() => setSelectIndex(i)}
        >
          <div className={styles["hint-title"]}>{prompt.title}</div>
          <div className={styles["hint-content"]}>{prompt.content}</div>
        </div>
      ))}
    </div>
  );
}

function ClearContextDivider() {
  const { t } = useTranslation();

  const chatStore = useEnhanceChatStore();

  return (
    <div
      className={styles["clear-context"]}
      onClick={() =>
        chatStore.updateTargetSession(
          (session) => (session.clearContextIndex = null),
          true,
        )
      }
    >
      {/* <div className={styles["clear-context-tips"]}>{Locale.Context.Clear}</div> */}
      <div className={styles["clear-context-tips"]}>{t("Context.Clear")}</div>
      {/* <div className={styles["clear-context-revert-btn"]}>
        {Locale.Context.Revert}
      </div> */}
      <div className={styles["clear-context-revert-btn"]}>
        {t("Context.Revert")}
      </div>
    </div>
  );
}

export function ChatAction(props: {
  text: string;
  icon: JSX.Element;
  onClick: () => void;
  isHaveHover?: boolean; // 是否有hover效果
  isClick?: boolean; // 是否需要点击效果
  isWebClick?: boolean; // web端是否有选中样式
  isChangeSvgStroke?: boolean; // svg样式是调整stroke 还是 fill
  tooltip?: string;
}) {
  const { isFromApp } = useOmeStore();
  const iconRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const [isActive, setIsActive] = useState(false);
  const [width, setWidth] = useState({ full: 16, icon: 16 });

  function updateWidth() {
    if (!iconRef.current || !textRef.current) return;
    const getWidth = (dom: HTMLDivElement) => dom.getBoundingClientRect().width;
    const textWidth = getWidth(textRef.current);
    const iconWidth = getWidth(iconRef.current);
    setWidth({ full: textWidth + iconWidth, icon: iconWidth });
  }

  const { run: onClick } = useDebounceFn(
    () => {
      props.onClick();
      setTimeout(updateWidth, 1);
    },
    { wait: 300 },
  );

  return (
    <div
      className={clsx(
        {
          // app端样式
          [styles["chat-input-action-is-app"]]: isFromApp && !isActive, // 默认
          [styles["chat-input-action-is-app-hover"]]: isFromApp && isActive, // hover
          [styles["chat-input-action-is-app-clicked"]]:
            isFromApp && !isActive && props.isClick, // 选中
          "clickable-is-app": isFromApp, // 设置svg样式
        },
        {
          // web端样式
          [styles["chat-input-action"]]: !isFromApp, // 默认
          [styles["chat-input-action-clicked"]]:
            !isFromApp && props.isClick && props.isWebClick, // 选中
          clickable: !isFromApp, // 设置svg样式
        },
        {
          [styles["chat-input-action-with-tooltip"]]:
            !isFromApp && !isEmpty(props.tooltip),
        },
      )}
      onClick={onClick}
      onMouseEnter={updateWidth}
      onTouchStart={() => {
        if (isFromApp) {
          setIsActive(!isActive);
        }
        updateWidth();
      }}
      onTouchEnd={() => {
        setTimeout(() => {
          if (isFromApp) {
            if (isActive) {
              setIsActive(false);
            }
          }
        }, 1000);
      }}
      style={
        {
          "--icon-width": `${width.icon}px`,
          "--full-width": `${width.full}px`,
        } as React.CSSProperties
      }
    >
      {!isFromApp && !isEmpty(props.tooltip) && (
        <div className={styles["chat-input-action-tooltip"]}>
          {props.tooltip}
        </div>
      )}
      <div
        ref={iconRef}
        // className={clsx(styles["icon"], props.isHaveHover && "is-hover-show")}
        className={clsx(
          styles["icon"],

          props.isClick || isActive
            ? isFromApp
              ? props.isChangeSvgStroke
                ? "is-clicked-show-stroke"
                : "is-clicked-show-fill"
              : "is-clicked-show"
            : (!isNil(props.isClick) || (isFromApp && props.isHaveHover)) &&
                (isFromApp
                  ? props.isChangeSvgStroke
                    ? "is-hover-show-stroke"
                    : "is-hover-show-fill"
                  : "is-hover-show"),
          props.isWebClick && props.isClick && "no-dark",
        )}
      >
        {props.icon}
      </div>
      <div className={styles["text"]} ref={textRef}>
        {props.text}
      </div>
    </div>
  );
}

function useScrollToBottom(
  scrollRef: RefObject<HTMLDivElement>,
  detach: boolean = false,
  messages: ChatMessage[],
) {
  // for auto-scroll
  const [autoScroll, setAutoScroll] = useState(true);
  const scrollDomToBottom = useCallback(() => {
    const dom = scrollRef.current;
    if (dom) {
      requestAnimationFrame(() => {
        setAutoScroll(true);
        dom.scrollTo(0, dom.scrollHeight);
      });
    }
  }, [scrollRef]);

  // auto scroll
  useEffect(() => {
    if (autoScroll && !detach) {
      scrollDomToBottom();
    }
  });

  // auto scroll when messages length changes
  const lastMessagesLength = useRef(messages.length);
  useEffect(() => {
    if (messages.length > lastMessagesLength.current && !detach) {
      scrollDomToBottom();
    }
    lastMessagesLength.current = messages.length;
  }, [messages.length, detach, scrollDomToBottom]);

  return { scrollRef, autoScroll, setAutoScroll, scrollDomToBottom };
}

export function ChatActions(props: {
  uploadFiles: () => void;
  showPromptModal: () => void;
  scrollToBottom: () => void;
  showPromptHints: () => void;
  hitBottom: boolean;
  setShowShortcutKeyModal: React.Dispatch<React.SetStateAction<boolean>>;
  setUserInput: (input: string) => void;
  setShowChatSidePanel: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const { t } = useTranslation();

  const config = useAppConfig();
  const omeStore = useOmeStore();
  const navigate = useNavigate();
  const chatStore = useEnhanceChatStore();
  const pluginStore = usePluginStore();
  const session = chatStore.currentSession!;

  // switch themes
  const theme = config.theme;

  function nextTheme() {
    const themes = [Theme.Auto, Theme.Light, Theme.Dark];
    const themeIndex = themes.indexOf(theme);
    const nextIndex = (themeIndex + 1) % themes.length;
    const nextTheme = themes[nextIndex];
    config.update((config) => (config.theme = nextTheme));
  }

  // stop all responses
  const couldStop = ChatControllerPool.hasPending();
  const stopAll = () => ChatControllerPool.stopAll();

  // switch model
  const currentModel = session.mask.modelConfig.model;
  const currentProviderName =
    session.mask.modelConfig?.providerName || ServiceProvider.OpenAI;
  const allModels = useAllModels();

  const models = useMemo(() => {
    const filteredModels = allModels.filter((m) => m.available);
    const defaultModel = filteredModels.find((m) => m.isDefault);

    const deepseekModels = filteredModels.filter((m) =>
      m.displayName.toLowerCase().includes("deepseek"),
    );
    const metisModels = filteredModels.filter((m) =>
      m.displayName.toLowerCase().includes("metis"),
    );
    const otherModels = filteredModels.filter(
      (m) =>
        !m.displayName.toLowerCase().includes("deepseek") &&
        !m.displayName.toLowerCase().includes("metis"),
    );

    let arr: typeof filteredModels;

    if (defaultModel) {
      arr = [
        defaultModel,
        ...deepseekModels.filter((m) => m !== defaultModel),
        ...metisModels.filter((m) => m !== defaultModel),
        ...otherModels.filter((m) => m !== defaultModel),
      ];
    } else {
      arr = [...deepseekModels, ...metisModels, ...otherModels];
    }

    const result =
      omeStore.isFromApp && omeStore.from !== "omeoffice 2.0"
        ? arr.filter((i) => !i.displayName.toLowerCase().includes("deepseek"))
        : arr;

    // 匹配 nameLocales，添加 releaseDate 和 description
    return result.map((model) => {
      const locale = nameLocales.find(
        (item) => item.name.toLowerCase() === model.displayName.toLowerCase(),
      );

      const lang = omeStore.language;
      const description =
        locale?.translations?.[lang] ?? locale?.translations?.cn ?? "";

      return {
        ...model,
        releaseDate:
          location.origin.includes("ai-chat-test") ||
          location.origin.includes("localhost")
            ? locale?.releaseDateDev
            : locale?.releaseDateProd,
        description,
      };
    });
  }, [allModels, omeStore.language]);

  const currentModelName = useMemo(() => {
    const model = models.find(
      (m) =>
        m.name == currentModel &&
        m?.provider?.providerName == currentProviderName,
    );
    return model?.displayName ?? "";
  }, [models, currentModel, currentProviderName]);
  const [showModelSelector, setShowModelSelector] = useState(false);
  const [showPluginSelector, setShowPluginSelector] = useState(false);
  const [showUploadImage, setShowUploadImage] = useState(false);

  const [showSizeSelector, setShowSizeSelector] = useState(false);
  const [showQualitySelector, setShowQualitySelector] = useState(false);
  const [showStyleSelector, setShowStyleSelector] = useState(false);
  const modelSizes = getModelSizes(currentModel);
  const dalle3Qualitys: DalleQuality[] = ["standard", "hd"];
  const dalle3Styles: DalleStyle[] = ["vivid", "natural"];
  const currentSize =
    session.mask.modelConfig?.size ?? ("1024x1024" as ModelSize);
  const currentQuality = session.mask.modelConfig?.quality ?? "standard";
  const currentStyle = session.mask.modelConfig?.style ?? "vivid";

  const isMobileScreen = useMobileScreen();

  useEffect(() => {
    const show = isVisionModel(currentModel);
    setShowUploadImage(show);
    if (!show) {
    }

    // if current model is not available
    // switch to first available model
    const isUnavailableModel = !models.some((m) => m.name === currentModel);
    if (isUnavailableModel && models.length > 0) {
      // show next model to default model if exist
      let nextModel = models.find((model) => model.isDefault) || models[0];
      chatStore.updateTargetSession(
        (session) => {
          session.mask.modelConfig.model = nextModel.name;
          session.mask.modelConfig.providerName = nextModel?.provider
            ?.providerName as ServiceProvider;
        },
        // true,
      );
      // showToast(
      //   nextModel?.provider?.providerName == "ByteDance"
      //     ? nextModel.displayName
      //     : nextModel.name,
      // );
    }
  }, [currentModel, models, session]);

  return (
    <div className={styles["chat-input-actions"]}>
      <>
        {couldStop && (
          <ChatAction
            onClick={stopAll}
            // text={Locale.Chat.InputActions.Stop}
            text={t("Chat.InputActions.Stop")}
            icon={omeStore.isFromApp ? <AppStopIcon /> : <StopIcon />}
            isChangeSvgStroke={true}
            isHaveHover={true}
          />
        )}
        {!props.hitBottom && (
          <ChatAction
            onClick={props.scrollToBottom}
            // text={Locale.Chat.InputActions.ToBottom}
            text={t("Chat.InputActions.ToBottom")}
            icon={omeStore.isFromApp ? <AppBottomIcon /> : <BottomIcon />}
            isChangeSvgStroke={true}
            isHaveHover={true}
          />
        )}
        {props.hitBottom && !omeStore.isFromApp && (
          <ChatAction
            onClick={props.showPromptModal}
            // text={Locale.Chat.InputActions.Settings}
            text={t("Chat.InputActions.Settings")}
            icon={<SettingsIcon />}
          />
        )}

        {!omeStore.isFromApp && (
          <ChatAction
            onClick={nextTheme}
            // text={Locale.Chat.InputActions.Theme[theme]}
            text={t(`Chat.InputActions.Theme.${theme}`)}
            icon={
              <>
                {theme === Theme.Auto ? (
                  <AutoIcon />
                ) : theme === Theme.Light ? (
                  <LightIcon />
                ) : theme === Theme.Dark ? (
                  <DarkIcon />
                ) : null}
              </>
            }
          />
        )}

        {!omeStore.isFromApp && (
          <ChatAction
            onClick={props.showPromptHints}
            // text={Locale.Chat.InputActions.Prompt}
            text={t("Chat.InputActions.Prompt")}
            icon={<PromptIcon />}
          />
        )}

        {!omeStore.isFromApp && (
          <ChatAction
            onClick={() => {
              navigate(Path.Masks);
            }}
            // text={Locale.Chat.InputActions.Masks}
            text={t("Chat.InputActions.Masks")}
            icon={<MaskIcon />}
          />
        )}

        {!omeStore.isFromApp && (
          <ChatAction
            // text={Locale.Chat.InputActions.Clear}
            text={t("Chat.InputActions.Clear")}
            icon={<BreakIcon />}
            onClick={() => {
              chatStore.updateTargetSession((session) => {
                if (session.clearContextIndex === session.messages.length) {
                  session.clearContextIndex = null;
                } else {
                  session.clearContextIndex = session.messages.length;
                  session.memoryPrompt = ""; // will clear memory
                }
              }, true);
            }}
          />
        )}

        <ChatAction
          onClick={() => setShowModelSelector(true)}
          text={currentModelName}
          icon={omeStore.isFromApp ? <AppRobot /> : <RobotIcon />}
          isHaveHover={true}
          isClick={showModelSelector}
        />

        {!useOmeStore.getState()?.faqSearch && (
          <ChatAction
            onClick={() =>
              useOmeStore
                .getState()
                .setOnlineSearch(!useOmeStore.getState().onlineSearch)
            }
            text={t("Chat.InputActions.OnlineSearch")}
            icon={
              omeStore.isFromApp ? (
                <AppSearchOnlineIcon />
              ) : (
                <SearchOnlineIcon />
              )
            }
            isHaveHover={true}
            isClick={useOmeStore.getState().onlineSearch}
            isWebClick={true}
          />
        )}

        {showModelSelector && (
          <Selector
            defaultSelectedValue={`${currentModel}@${currentProviderName}`}
            items={models.map((m) => ({
              title: `${m.displayName}${
                m?.provider?.providerName
                  ? " (" + m?.provider?.providerName + ")"
                  : ""
              }`,
              value: `${m.name}@${m?.provider?.providerName}`,
              subTitle: m.description,
              releaseDate: m.releaseDate,
            }))}
            onClose={() => setShowModelSelector(false)}
            onSelection={(s) => {
              if (s.length === 0) return;
              const [model, providerName] = getModelProvider(s[0]);
              chatStore.updateTargetSession((session) => {
                session.mask.modelConfig.model = model as ModelType;
                session.mask.modelConfig.providerName =
                  providerName as ServiceProvider;
                session.mask.syncGlobalConfig = false;
              });
              if (providerName == "ByteDance") {
                const selectedModel = models.find(
                  (m) =>
                    m.name == model &&
                    m?.provider?.providerName == providerName,
                );
                showToast(selectedModel?.displayName ?? "");
              } else {
                showToast(model);
              }
            }}
          />
        )}

        {supportsCustomSize(currentModel) && (
          <ChatAction
            onClick={() => setShowSizeSelector(true)}
            text={currentSize}
            icon={<SizeIcon />}
          />
        )}

        {showSizeSelector && (
          <Selector
            defaultSelectedValue={currentSize}
            items={modelSizes.map((m) => ({ title: m, value: m }))}
            onClose={() => setShowSizeSelector(false)}
            onSelection={(s) => {
              if (s.length === 0) return;
              const size = s[0];
              chatStore.updateTargetSession((session) => {
                session.mask.modelConfig.size = size;
              });
              showToast(size);
            }}
          />
        )}

        {isDalle3(currentModel) && (
          <ChatAction
            onClick={() => setShowQualitySelector(true)}
            text={currentQuality}
            icon={<QualityIcon />}
          />
        )}

        {showQualitySelector && (
          <Selector
            defaultSelectedValue={currentQuality}
            items={dalle3Qualitys.map((m) => ({ title: m, value: m }))}
            onClose={() => setShowQualitySelector(false)}
            onSelection={(q) => {
              if (q.length === 0) return;
              const quality = q[0];
              chatStore.updateTargetSession((session) => {
                session.mask.modelConfig.quality = quality;
              });
              showToast(quality);
            }}
          />
        )}

        {isDalle3(currentModel) && (
          <ChatAction
            onClick={() => setShowStyleSelector(true)}
            text={currentStyle}
            icon={<StyleIcon />}
          />
        )}

        {showStyleSelector && (
          <Selector
            defaultSelectedValue={currentStyle}
            items={dalle3Styles.map((m) => ({ title: m, value: m }))}
            onClose={() => setShowStyleSelector(false)}
            onSelection={(s) => {
              if (s.length === 0) return;
              const style = s[0];
              chatStore.updateTargetSession((session) => {
                session.mask.modelConfig.style = style;
              });
              showToast(style);
            }}
          />
        )}

        {showPlugins(currentProviderName, currentModel) &&
          !omeStore.isFromApp && (
            <ChatAction
              onClick={() => {
                if (pluginStore.getAll().length == 0) {
                  navigate(Path.Plugins);
                } else {
                  setShowPluginSelector(true);
                }
              }}
              // text={Locale.Plugin.Name}
              text={t("Plugin.Name")}
              icon={<PluginIcon />}
            />
          )}
        {showPluginSelector && (
          <Selector
            multiple
            defaultSelectedValue={chatStore.currentSession!.mask?.plugin}
            items={pluginStore.getAll().map((item) => ({
              title: `${item?.title}@${item?.version}`,
              value: item?.id,
            }))}
            onClose={() => setShowPluginSelector(false)}
            onSelection={(s) => {
              chatStore.updateTargetSession((session) => {
                session.mask.plugin = s as string[];
              }, true);
            }}
          />
        )}

        {!isMobileScreen && (
          <ChatAction
            onClick={() => props.setShowShortcutKeyModal(true)}
            // text={Locale.Chat.ShortcutKey.Title}
            text={t("Chat.ShortcutKey.Title")}
            icon={<ShortcutkeyIcon />}
          />
        )}
        {!isMobileScreen && <MCPAction />}
        {(!omeStore.isFromApp || omeStore?.from?.includes("omeoffice")) && (
          <ChatAction
            onClick={() => {
              useOmeStore.getState().setOnlineSearch(false);
              useOmeStore
                .getState()
                .setFaqSearch(!useOmeStore.getState().faqSearch);
            }}
            text={"FAQ"}
            icon={omeStore.isFromApp ? <AppFaqIcon /> : <FaqIcon />}
            isHaveHover={true}
            isClick={useOmeStore.getState().faqSearch}
            isWebClick={true}
          />
        )}
        {showUploadImage && (
          <ChatAction
            onClick={props.uploadFiles}
            text={t("Chat.InputActions.UploadFile")}
            icon={<PlusOutlined />}
            isHaveHover={true}
            tooltip={t("Chat.InputActions.UploadFileTooltip")}
          />
        )}
      </>
      <div className={styles["chat-input-actions-end"]}>
        {config.realtimeConfig.enable && (
          <ChatAction
            onClick={() => props.setShowChatSidePanel(true)}
            text={"Realtime Chat"}
            icon={<HeadphoneIcon />}
          />
        )}
      </div>
    </div>
  );
}

export function EditMessageModal(props: { onClose: () => void }) {
  const { t } = useTranslation();

  const chatStore = useEnhanceChatStore();
  const session = chatStore.currentSession!;
  const [messages, setMessages] = useState(session.messages.slice());

  return (
    <div className="modal-mask">
      <Modal
        // title={Locale.Chat.EditMessage.Title}
        title={t("Chat.EditMessage.Title")}
        onClose={props.onClose}
        actions={[
          <IconButton
            // text={Locale.UI.Cancel}
            text={t("UI.Cancel")}
            icon={<CancelIcon />}
            key="cancel"
            onClick={() => {
              props.onClose();
            }}
          />,
          <IconButton
            type="primary"
            // text={Locale.UI.Confirm}
            text={t("UI.Confirm")}
            icon={<ConfirmIcon />}
            key="ok"
            onClick={() => {
              chatStore.updateTargetSession(
                (session) => (session.messages = messages),
                true,
              );
              props.onClose();
            }}
          />,
        ]}
      >
        <List>
          <ListItem
            // title={Locale.Chat.EditMessage.Topic.Title}
            title={t("Chat.EditMessage.Topic.Title")}
            // subTitle={Locale.Chat.EditMessage.Topic.SubTitle}
            subTitle={t("Chat.EditMessage.Topic.SubTitle")}
          >
            <input
              type="text"
              value={session.topic}
              onInput={(e) =>
                chatStore.updateTargetSession(
                  (session) => (session.topic = e.currentTarget.value),
                )
              }
            ></input>
          </ListItem>
        </List>
        <ContextPrompts
          context={messages}
          updateContext={(updater) => {
            const newMessages = messages.slice();
            updater(newMessages);
            setMessages(newMessages);
          }}
        />
      </Modal>
    </div>
  );
}

export function DeleteImageButton(props: { deleteImage: () => void }) {
  return (
    <div className={styles["delete-image"]} onClick={props.deleteImage}>
      <CloseCircleFilled className={styles["attach-delete-icon"]} />
    </div>
  );
}

function formatFileSize(size: number): string {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function truncateMiddle(name: string): string {
  if (name.length <= 14) return name;

  return name.slice(0, 7) + "..." + name.slice(-7);
}

function revokeAttachmentPreview(item?: Pick<Attachment, "previewUrl">) {
  const previewUrl = item?.previewUrl;
  if (previewUrl?.startsWith("blob:")) {
    URL.revokeObjectURL(previewUrl);
  }
}

function ImageCornerButton(props: {
  onClick: () => void;
  icon: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={clsx(styles["image-corner-button"], props.className)}
      onClick={props.onClick}
    >
      {props.icon}
    </div>
  );
}

function CircularProgress({
  percent,
  size = 24,
  trackColor = "rgba(120, 128, 140, 0.85)",
  progressColor = "#ffffff",
}: {
  percent: number;
  size?: number;
  trackColor?: string;
  progressColor?: string;
}) {
  const strokeWidth = 2.5;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;

  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={trackColor}
        strokeWidth={strokeWidth}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={progressColor}
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: "stroke-dashoffset 0.2s ease" }}
      />
    </svg>
  );
}

function getAttachmentFileIcon(ext: string) {
  const normalizedExt = ext.toLowerCase();

  if (normalizedExt === "pdf") {
    return (
      <FilePdfFilled
        className={styles["attach-file-meta-icon"]}
        style={{ color: "#ef4444" }}
      />
    );
  }

  if (normalizedExt === "xls" || normalizedExt === "xlsx") {
    return (
      <FileExcelFilled
        className={styles["attach-file-meta-icon"]}
        style={{ color: "#16a34a" }}
      />
    );
  }

  if (normalizedExt === "doc" || normalizedExt === "docx") {
    return (
      <FileWordFilled
        className={styles["attach-file-meta-icon"]}
        style={{ color: "#2563eb" }}
      />
    );
  }

  if (normalizedExt === "ppt" || normalizedExt === "pptx") {
    return (
      <FilePptFilled
        className={styles["attach-file-meta-icon"]}
        style={{ color: "#9ca3af" }}
      />
    );
  }

  if (
    normalizedExt === "txt" ||
    normalizedExt === "csv" ||
    normalizedExt === "json"
  ) {
    return (
      <FileTextFilled
        className={styles["attach-file-meta-icon"]}
        style={{ color: "#9ca3af" }}
      />
    );
  }

  return (
    <FileUnknownFilled
      className={styles["attach-file-meta-icon"]}
      style={{ color: "#9ca3af" }}
    />
  );
}

function AttachmentItem(props: { item: Attachment; onDelete?: () => void }) {
  const { t } = useTranslation();
  const { item, onDelete } = props;
  const ext = item.name.split(".").pop()?.toUpperCase() || "FILE";
  const isError = item.status === "error";
  const isUploading = item.status === "uploading";
  const imageUrl = item.previewUrl || item.url;

  if (item.isImage && imageUrl) {
    return (
      <div
        className={styles["attach-image"]}
        style={{ backgroundImage: `url("${imageUrl}")` }}
      >
        {isUploading && (
          <div className={styles["attach-image-uploading"]}>
            <CircularProgress percent={item.progress ?? 0} size={34} />
          </div>
        )}
        {isError && <div className={styles["attach-image-error"]}>!</div>}
        {onDelete && isUploading ? (
          <ImageCornerButton
            onClick={onDelete}
            icon={
              <CloseCircleFilled className={styles["attach-delete-icon"]} />
            }
            className={styles["image-corner-button-visible"]}
          />
        ) : (
          onDelete && (
            <ImageCornerButton
              onClick={onDelete}
              icon={
                <CloseCircleFilled className={styles["attach-delete-icon"]} />
              }
              className={styles["image-corner-button-visible"]}
            />
          )
        )}
      </div>
    );
  }

  // 文件 / 上传中 / 错误状态
  return (
    <div
      className={`${styles["attach-file-card"]} ${
        isError ? styles["attach-item-error"] : ""
      }`}
      title={item.name}
    >
      {isUploading && (
        <div className={styles["attach-item-uploading"]}>
          <CircularProgress percent={item.progress ?? 0} size={34} />
        </div>
      )}
      {/* <div className={styles["attach-file-icon"]}>{ext}</div> */}
      <div className={styles["attach-file-info"]}>
        <div className={styles["attach-file-name"]}>
          {truncateMiddle(item.name)}
        </div>
        <div className={styles["attach-file-size"]}>
          {isError ? (
            <>
              <ExclamationCircleOutlined
                className={styles["attach-file-meta-icon"]}
              />
              <span>{t("Chat.UploadFailed")}</span>
            </>
          ) : (
            <>
              {getAttachmentFileIcon(ext)}
              <span>{ext},</span>
              <span>{formatFileSize(item.size)}</span>
            </>
          )}
        </div>
      </div>
      {onDelete && (
        <div className={styles["attach-file-close"]} onClick={onDelete}>
          <CloseCircleFilled className={styles["attach-delete-icon"]} />
        </div>
      )}
    </div>
  );
}

function AttachmentScrollBox(props: {
  items: Attachment[];
  onDelete?: (id: string) => void;
}) {
  const attachScrollRef = useRef<HTMLDivElement>(null);
  const [showLeft, setShowLeft] = useState(false);
  const [showRight, setShowRight] = useState(false);

  const checkScroll = useCallback(() => {
    const el = attachScrollRef.current;
    if (!el) return;
    setShowLeft(el.scrollLeft > 0);
    setShowRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
  }, []);

  useEffect(() => {
    const el = attachScrollRef.current;
    if (!el) return;

    const resizeObserver = new ResizeObserver(() => {
      checkScroll();
    });
    resizeObserver.observe(el);

    const mutationObserver = new MutationObserver(() => {
      checkScroll();
    });
    mutationObserver.observe(el, { childList: true, subtree: true });

    checkScroll();

    return () => {
      resizeObserver.disconnect();
      mutationObserver.disconnect();
    };
  }, [checkScroll]);

  useEffect(() => {
    requestAnimationFrame(() => {
      checkScroll();
    });
  }, [props.items, checkScroll]);

  const scroll = (direction: "left" | "right") => {
    const el = attachScrollRef.current;
    if (!el) return;
    el.scrollBy({
      left: direction === "left" ? -150 : 150,
      behavior: "smooth",
    });
  };

  if (props.items.length === 0) return null;

  return (
    <div className={styles["attach-scroll-wrapper"]}>
      {showLeft && (
        <div className={styles["attach-scroll-fade-left"]}>
          <div
            className={styles["attach-scroll-arrow"]}
            onClick={() => scroll("left")}
          >
            <LeftCircleFilled style={{ fontSize: "2rem" }} />
          </div>
        </div>
      )}
      <div
        ref={attachScrollRef}
        className={styles["attach-scroll-box"]}
        onScroll={checkScroll}
      >
        {props.items.map((item) => (
          <AttachmentItem
            key={item.id}
            item={item}
            onDelete={
              props.onDelete ? () => props.onDelete!(item.id) : undefined
            }
          />
        ))}
      </div>
      {showRight && (
        <div className={styles["attach-scroll-fade-right"]}>
          <div
            className={styles["attach-scroll-arrow"]}
            onClick={() => scroll("right")}
          >
            <RightCircleFilled style={{ fontSize: "2rem" }} />
          </div>
        </div>
      )}
    </div>
  );
}

export function ShortcutKeyModal(props: { onClose: () => void }) {
  const { t } = useTranslation();
  const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
  const shortcuts = [
    {
      // title: Locale.Chat.ShortcutKey.newChat,
      title: t("Chat.ShortcutKey.newChat"),
      keys: isMac ? ["⌘", "Shift", "O"] : ["Ctrl", "Shift", "O"],
    },
    { title: t("Chat.ShortcutKey.focusInput"), keys: ["Shift", "Esc"] },
    {
      // title: Locale.Chat.ShortcutKey.copyLastCode,
      title: t("Chat.ShortcutKey.copyLastCode"),
      keys: isMac ? ["⌘", "Shift", ";"] : ["Ctrl", "Shift", ";"],
    },
    {
      // title: Locale.Chat.ShortcutKey.copyLastMessage,
      title: t("Chat.ShortcutKey.copyLastMessage"),
      keys: isMac ? ["⌘", "Shift", "C"] : ["Ctrl", "Shift", "C"],
    },
    {
      // title: Locale.Chat.ShortcutKey.showShortcutKey,
      title: t("Chat.ShortcutKey.showShortcutKey"),
      keys: isMac ? ["⌘", "/"] : ["Ctrl", "/"],
    },
    {
      // title: Locale.Chat.ShortcutKey.clearContext,
      title: t("Chat.ShortcutKey.clearContext"),
      keys: isMac
        ? ["⌘", "Shift", "backspace"]
        : ["Ctrl", "Shift", "backspace"],
    },
  ];
  return (
    <div className="modal-mask">
      <Modal
        // title={Locale.Chat.ShortcutKey.Title}
        title={t("Chat.ShortcutKey.Title")}
        onClose={props.onClose}
        actions={[
          <IconButton
            type="primary"
            // text={Locale.UI.Confirm}
            text={t("UI.Confirm")}
            icon={<ConfirmIcon />}
            key="ok"
            onClick={() => {
              props.onClose();
            }}
          />,
        ]}
      >
        <div className={styles["shortcut-key-container"]}>
          <div className={styles["shortcut-key-grid"]}>
            {shortcuts.map((shortcut, index) => (
              <div key={index} className={styles["shortcut-key-item"]}>
                <div className={styles["shortcut-key-title"]}>
                  {shortcut.title}
                </div>
                <div className={styles["shortcut-key-keys"]}>
                  {shortcut.keys.map((key, i) => (
                    <div key={i} className={styles["shortcut-key"]}>
                      <span>{key}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </Modal>
    </div>
  );
}

export function _Chat_NEW() {
  const { t } = useTranslation();
  type RenderMessage = ChatMessage & { preview?: boolean };

  const newChatStore = useEnhanceChatStore();
  // const session = chatStore.getCurrentSession();
  const session = newChatStore.currentSession!;
  const config = useAppConfig();
  const fontSize = config.fontSize;
  const fontFamily = config.fontFamily;

  const containerRef = useRef<HTMLDivElement>(null);
  const [showExport, setShowExport] = useState(false);

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const textareaRef = useRef<TextAreaRef>(null);
  const [userInput, setUserInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { submitKey, shouldSubmit } = useSubmitHandler();
  const scrollRef = useRef<HTMLDivElement>(null);
  const isScrolledToBottom = scrollRef?.current
    ? Math.abs(
        scrollRef.current.scrollHeight -
          (scrollRef.current.scrollTop + scrollRef.current.clientHeight),
      ) <= 1
    : false;
  const isAttachWithTop = useMemo(() => {
    const lastMessage = scrollRef.current?.lastElementChild as HTMLElement;
    // if scrolllRef is not ready or no message, return false
    if (!scrollRef?.current || !lastMessage) return false;
    const topDistance =
      lastMessage!.getBoundingClientRect().top -
      scrollRef.current.getBoundingClientRect().top;
    // leave some space for user question
    return topDistance < 100;
  }, [scrollRef?.current?.scrollHeight]);

  const isTyping = userInput !== "";

  // if user is typing, should auto scroll to bottom
  // if user is not typing, should auto scroll to bottom only if already at bottom
  const { setAutoScroll, scrollDomToBottom } = useScrollToBottom(
    scrollRef,
    (isScrolledToBottom || isAttachWithTop) && !isTyping,
    session.messages,
  );
  const [hitBottom, setHitBottom] = useState(true);
  const isMobileScreen = useMobileScreen();
  const navigate = useNavigate();
  const omeStore = useOmeStore();
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const uploading = attachments.some((a) => a.status === "uploading");

  const removeAttachment = useCallback((id: string) => {
    setAttachments((prev) => {
      const target = prev.find((a) => a.id === id);
      revokeAttachmentPreview(target);
      return prev.filter((a) => a.id !== id);
    });
  }, []);

  const clearAttachments = useCallback(() => {
    setAttachments((prev) => {
      prev.forEach(revokeAttachmentPreview);
      return [];
    });
  }, []);

  // prompt hints
  const promptStore = usePromptStore();
  const [promptHints, setPromptHints] = useState<RenderPrompt[]>([]);
  const onSearch = useDebouncedCallback(
    (text: string) => {
      const matchedPrompts = promptStore.search(text);
      setPromptHints(matchedPrompts);
    },
    100,
    { leading: true, trailing: true },
  );

  // // auto grow input
  // const [inputRows, setInputRows] = useState(2);
  // const measure = useDebouncedCallback(
  //   () => {
  //     const rows = inputRef.current ? autoGrowTextArea(inputRef.current) : 1;
  //     const inputRows = Math.min(
  //       20,
  //       Math.max(2 + Number(!isMobileScreen), rows),
  //     );
  //     setInputRows(inputRows);
  //   },
  //   100,
  //   {
  //     leading: true,
  //     trailing: true,
  //   },
  // );

  // // eslint-disable-next-line react-hooks/exhaustive-deps
  // useEffect(measure, [userInput]);

  // chat commands shortcuts
  const chatCommands = useChatCommand({
    new: () => newChatStore.newSession(),
    newm: () => navigate(Path.NewChat),
    prev: () => newChatStore.nextSession(-1),
    next: () => newChatStore.nextSession(1),
    clear: () =>
      newChatStore.updateTargetSession(
        (session) => (session.clearContextIndex = session.messages.length),
        true,
      ),
    fork: () => newChatStore.forkSession(),
    del: () => newChatStore.deleteSession(newChatStore.sessionId),
  });

  // only search prompts when user input is short
  const SEARCH_TEXT_LIMIT = 30;
  const onInput = (text: string) => {
    setUserInput(text);
    const n = text.trim().length;

    // clear search results
    if (n === 0) {
      setPromptHints([]);
    } else if (text.match(ChatCommandPrefix)) {
      if (!session.isAdd) setPromptHints(chatCommands.search(text));
    } else if (!config.disablePromptHint && n < SEARCH_TEXT_LIMIT) {
      // check if need to trigger auto completion
      if (text.startsWith("/")) {
        let searchText = text.slice(1);
        onSearch(searchText);
      }
    }
  };

  const doSubmit = async (userInput: string) => {
    if (uploading) return;
    if (userInput.trim() === "" && attachments.length === 0) return;
    const matchCommand = chatCommands.match(userInput);
    if (matchCommand.matched) {
      setUserInput("");
      setPromptHints([]);
      matchCommand.invoke();
      return;
    }
    setIsLoading(true);

    await newChatStore
      .onUserInput(userInput, attachments.length > 0 ? attachments : undefined)
      .then(() => setIsLoading(false));
    clearAttachments();
    newChatStore.setLastInput(userInput);
    setUserInput("");
    setPromptHints([]);
    if (!isMobileScreen) {
      textareaRef.current?.focus();
      // inputRef.current?.focus();
    }
    setAutoScroll(true);
  };

  const onPromptSelect = (prompt: RenderPrompt) => {
    setTimeout(() => {
      setPromptHints([]);

      const matchedChatCommand = chatCommands.match(prompt.content);
      if (matchedChatCommand.matched) {
        // if user is selecting a chat command, just trigger it
        matchedChatCommand.invoke();
        setUserInput("");
      } else {
        // or fill the prompt
        setUserInput(prompt.content);
      }
      // inputRef.current?.focus();
      textareaRef.current?.focus();
    }, 30);
  };

  // stop response
  const onUserStop = (messageId: string) => {
    if (session) ChatControllerPool.stop(session.id, messageId);
  };

  useEffect(() => {
    newChatStore.updateTargetSession(
      (session) => {
        const stopTiming = Date.now() - REQUEST_TIMEOUT_MS;
        session.messages.forEach((m) => {
          // check if should stop all stale messages
          if (m.isError || new Date(m.date).getTime() < stopTiming) {
            if (m.streaming) {
              m.streaming = false;
            }
            if (m.content.length === 0) {
              m.isError = true;
              m.content = prettyObject({
                error: true,
                message: "empty response",
              });
            }
          }
        });
        // auto sync mask config from global config
        if (session.mask.syncGlobalConfig) {
          console.log("[Mask] syncing from global, name = ", session.mask.name);
          session.mask.modelConfig = { ...config.modelConfig };
        }
      },
      // true,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  // check if should send message
  const onInputKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // if ArrowUp and no userInput, fill with last input
    if (
      e.key === "ArrowUp" &&
      userInput.length <= 0 &&
      !(e.metaKey || e.altKey || e.ctrlKey)
    ) {
      // setUserInput(chatStore.lastInput ?? "");
      e.preventDefault();
      return;
    }
    if (shouldSubmit(e) && promptHints.length === 0) {
      if (uploading) {
        e.preventDefault();
        return;
      }
      doSubmit(userInput);
      e.preventDefault();
    }
  };
  const onRightClick = (e: any, message: ChatMessage) => {
    // copy to clipboard
    if (selectOrCopy(e.currentTarget, getMessageTextContent(message))) {
      if (userInput.length === 0) {
        setUserInput(getMessageTextContent(message));
      }

      e.preventDefault();
    }
  };

  const deleteMessage = (msgId?: string, isGetApi = false) => {
    newChatStore.updateTargetSession(
      (session) =>
        (session.messages = session.messages.filter((m) => m.id !== msgId)),
      isGetApi,
    );
  };

  const onDelete = (msgId: string) => {
    deleteMessage(msgId, true);
  };

  const onResend = (message: ChatMessage) => {
    // when it is resending a message
    // 1. for a user's message, find the next bot response
    // 2. for a bot's message, find the last user's input
    // 3. delete original user input and bot's message
    // 4. resend the user's input
    const resendingIndex = session.messages.findIndex(
      (m) => m.id === message.id,
    );
    if (resendingIndex < 0 || resendingIndex >= session.messages.length) {
      console.error("[Chat] failed to find resending message", message);
      return;
    }
    let userMessage: ChatMessage | undefined;
    let botMessage: ChatMessage | undefined;
    if (message.role === "assistant") {
      // if it is resending a bot's message, find the user input for it
      botMessage = message;
      for (let i = resendingIndex; i >= 0; i -= 1) {
        if (session.messages[i].role === "user") {
          userMessage = session.messages[i];
          break;
        }
      }
    } else if (message.role === "user") {
      // if it is resending a user's input, find the bot's response
      userMessage = message;
      for (let i = resendingIndex; i < session.messages.length; i += 1) {
        if (session.messages[i].role === "assistant") {
          botMessage = session.messages[i];
          break;
        }
      }
    }
    if (userMessage === undefined) {
      console.error("[Chat] failed to resend", message);
      return;
    }
    // delete the original messages
    deleteMessage(userMessage.id);
    deleteMessage(botMessage?.id);
    // resend the message
    setIsLoading(true);
    const textContent = getMessageTextContent(userMessage);
    newChatStore
      .onUserInput(textContent, userMessage.attachments)
      .then(() => setIsLoading(false));
    // inputRef.current?.focus();
    textareaRef.current?.focus();
  };

  const onPinMessage = (message: ChatMessage) => {
    newChatStore.updateTargetSession(
      (session) => session.mask.context.push({ ...message, id: nanoid() }),
      true,
    );

    // showToast(Locale.Chat.Actions.PinToastContent, {
    showToast(t("Chat.Actions.PinToastContent"), {
      // text: Locale.Chat.Actions.PinToastAction,
      text: t("Chat.Actions.PinToastAction"),
      onClick: () => {
        setShowPromptModal(true);
      },
    });
  };

  const accessStore = useAccessStore();
  const [speechStatus, setSpeechStatus] = useState(false);
  const [speechLoading, setSpeechLoading] = useState(false);

  async function openaiSpeech(text: string) {
    if (speechStatus) {
      ttsPlayer.stop();
      setSpeechStatus(false);
    } else {
      var api: ClientApi;
      api = new ClientApi(ModelProvider.GPT);
      const config = useAppConfig.getState();
      setSpeechLoading(true);
      ttsPlayer.init();
      let audioBuffer: ArrayBuffer;
      const { markdownToTxt } = require("markdown-to-txt");
      const textContent = markdownToTxt(text);
      if (config.ttsConfig.engine !== DEFAULT_TTS_ENGINE) {
        const edgeVoiceName = accessStore.edgeVoiceName();
        const tts = new MsEdgeTTS();
        await tts.setMetadata(
          edgeVoiceName,
          OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3,
        );
        audioBuffer = await tts.toArrayBuffer(textContent);
      } else {
        audioBuffer = await api.llm.speech({
          model: config.ttsConfig.model,
          input: textContent,
          voice: config.ttsConfig.voice,
          speed: config.ttsConfig.speed,
        });
      }
      setSpeechStatus(true);
      ttsPlayer
        .play(audioBuffer, () => {
          setSpeechStatus(false);
        })
        .catch((e) => {
          console.error("[OpenAI Speech]", e);
          showToast(prettyObject(e));
          setSpeechStatus(false);
        })
        .finally(() => setSpeechLoading(false));
    }
  }

  const context: RenderMessage[] = useMemo(() => {
    return (
      (session?.mask?.hideContext ? [] : session?.mask?.context?.slice()) || []
    );
  }, [session?.mask?.context, session?.mask?.hideContext]);

  const data = getBotHello();

  if (
    context.length === 0 &&
    session.messages.at(0)?.content !== data.content
  ) {
    const copiedHello = Object.assign({}, data);

    if (!accessStore.isAuthorized()) {
      if (!isEmpty(omeStore.token)) {
      } else {
        // copiedHello.content = Locale.Error.Unauthorized;
        copiedHello.content = t("Error.Unauthorized");
      }
    }
    if (!omeStore.isFromApp) context.push(copiedHello);
  }

  // preview messages
  const renderMessages = useMemo(() => {
    return context
      .concat(session.messages as RenderMessage[])
      .concat(
        isLoading
          ? [
              {
                ...createMessage({ role: "assistant", content: "……" }),
                preview: true,
              },
            ]
          : [],
      )
      .concat(
        userInput.length > 0 && config.sendPreviewBubble
          ? [
              {
                ...createMessage({ role: "user", content: userInput }),
                preview: true,
              },
            ]
          : [],
      );
  }, [
    config.sendPreviewBubble,
    context,
    isLoading,
    session.messages,
    userInput,
  ]);

  const [msgRenderIndex, _setMsgRenderIndex] = useState(
    Math.max(0, renderMessages.length - CHAT_PAGE_SIZE),
  );

  function setMsgRenderIndex(newIndex: number) {
    newIndex = Math.min(renderMessages.length - CHAT_PAGE_SIZE, newIndex);
    newIndex = Math.max(0, newIndex);
    _setMsgRenderIndex(newIndex);
  }

  const messages = useMemo(() => {
    const endRenderIndex = Math.min(
      msgRenderIndex + 3 * CHAT_PAGE_SIZE,
      renderMessages.length,
    );
    return renderMessages.slice(msgRenderIndex, endRenderIndex);
  }, [msgRenderIndex, renderMessages]);

  const onChatBodyScroll = (e: HTMLElement) => {
    const bottomHeight = e.scrollTop + e.clientHeight;
    const edgeThreshold = e.clientHeight;

    const isTouchTopEdge = e.scrollTop <= edgeThreshold;
    const isTouchBottomEdge = bottomHeight >= e.scrollHeight - edgeThreshold;
    const isHitBottom =
      bottomHeight >= e.scrollHeight - (isMobileScreen ? 4 : 10);

    const prevPageMsgIndex = msgRenderIndex - CHAT_PAGE_SIZE;
    const nextPageMsgIndex = msgRenderIndex + CHAT_PAGE_SIZE;

    if (isTouchTopEdge && !isTouchBottomEdge) {
      setMsgRenderIndex(prevPageMsgIndex);
    } else if (isTouchBottomEdge) {
      setMsgRenderIndex(nextPageMsgIndex);
    }

    setHitBottom(isHitBottom);
    setAutoScroll(isHitBottom);
  };

  function scrollToBottom() {
    setMsgRenderIndex(renderMessages.length - CHAT_PAGE_SIZE);
    scrollDomToBottom();
  }

  // clear context index = context length + index in messages
  const clearContextIndex =
    (session?.clearContextIndex ?? -1) >= 0
      ? session?.clearContextIndex! + context.length - msgRenderIndex
      : -1;

  const [showPromptModal, setShowPromptModal] = useState(false);

  const clientConfig = useMemo(() => getClientConfig(), []);

  const autoFocus = !isMobileScreen; // wont auto focus on mobile screen
  const showMaxIcon = !isMobileScreen && !clientConfig?.isApp;

  useCommand({
    fill: setUserInput,
    submit: (text) => {
      doSubmit(text);
    },
    code: (text) => {
      if (accessStore.disableFastLink) return;
      console.log("[Command] got code from url: ", text);
      // showConfirm(Locale.URLCommand.Code + `code = ${text}`).then((res) => {
      showConfirm(t("URLCommand.Code") + `code = ${text}`).then((res) => {
        if (res) {
          accessStore.update((access) => (access.accessCode = text));
        }
      });
    },
    settings: (text) => {
      if (accessStore.disableFastLink) return;

      try {
        const payload = JSON.parse(text) as { key?: string; url?: string };

        console.log("[Command] got settings from url: ", payload);

        if (payload.key || payload.url) {
          showConfirm(
            // Locale.URLCommand.Settings +
            t("URLCommand.Settings") + `\n${JSON.stringify(payload, null, 4)}`,
          ).then((res) => {
            if (!res) return;
            if (payload.key) {
              accessStore.update(
                (access) => (access.openaiApiKey = payload.key!),
              );
            }
            if (payload.url) {
              accessStore.update((access) => (access.openaiUrl = payload.url!));
            }
            accessStore.update((access) => (access.useCustomConfig = true));
          });
        }
      } catch {
        console.error("[Command] failed to get settings from url: ", text);
      }
    },
  });

  // edit / insert message modal
  const [isEditingMessage, setIsEditingMessage] = useState(false);

  // remember unfinished input
  useEffect(() => {
    // try to load from local storage
    const key = UNFINISHED_INPUT(session.id);
    const mayBeUnfinishedInput = localStorage.getItem(key);
    if (mayBeUnfinishedInput && userInput.length === 0) {
      setUserInput(mayBeUnfinishedInput);
      localStorage.removeItem(key);
    }
    // const dom = inputRef.current;
    const dom = textareaRef.current;
    return () => {
      // localStorage.setItem(key, dom?.value ?? "");
      localStorage.setItem(key, dom?.resizableTextArea?.textArea.value ?? "");
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addAttachments = useCallback(
    (files: File[]) => {
      const validFiles = files.filter(
        (file) =>
          file.size <= MAX_FILE_SIZE ||
          (showToast(t("Chat.FileTooLarge")), false),
      );
      if (validFiles.length === 0) return;

      const nextAttachmentCount = attachments.length + validFiles.length;
      if (nextAttachmentCount > MAX_ATTACHMENTS_COUNT) {
        showToast(`最多同时上传${MAX_ATTACHMENTS_COUNT}个附件/图片`);
        return;
      }

      const currentTotalSize = attachments.reduce(
        (total, item) => total + item.size,
        0,
      );
      const nextTotalSize =
        currentTotalSize +
        validFiles.reduce((total, file) => total + file.size, 0);
      if (nextTotalSize > MAX_ATTACHMENTS_TOTAL_SIZE) {
        showToast(
          `附件和图片总大小不能超过${formatFileSize(
            MAX_ATTACHMENTS_TOTAL_SIZE,
          )}`,
        );
        return;
      }

      const newItems: Attachment[] = validFiles.map((file) => ({
        id: nanoid(),
        name: file.name,
        size: file.size,
        type: file.type,
        url: "",
        previewUrl: isImageFile(file) ? URL.createObjectURL(file) : undefined,
        isImage: isImageFile(file),
        status: "uploading" as const,
        progress: 0,
      }));

      setAttachments((prev) => {
        const total = prev.length + newItems.length;
        if (total > MAX_ATTACHMENTS_COUNT) {
          showToast(`最多同时上传${MAX_ATTACHMENTS_COUNT}个附件/图片`);
          return prev;
        }
        return [...prev, ...newItems];
      });

      // 异步上传每个文件，使用 PostAttachmentUpload 支持进度
      validFiles.forEach(async (file, idx) => {
        const itemId = newItems[idx].id;
        const formData = new FormData();
        formData.append("file", file, file.name);

        try {
          const headers = await getHeaders();
          const res = await PostAttachmentUpload(
            headers,
            formData,
            (percent) => {
              setAttachments((prev) =>
                prev.map((a) =>
                  a.id === itemId ? { ...a, progress: percent } : a,
                ),
              );
            },
          );
          const attachmentId =
            typeof res === "string"
              ? undefined
              : res?.attachmentId ?? res?.id ?? res?.fileId ?? res?.fileID;
          const url =
            typeof res === "string"
              ? res
              : res?.url ?? res?.fileUrl ?? res?.fileURL ?? "";
          setAttachments((prev) =>
            prev.map((a) => {
              if (a.id !== itemId) return a;
              return {
                ...a,
                attachmentId,
                url,
                status: "success" as const,
                progress: 100,
              };
            }),
          );
        } catch {
          setAttachments((prev) =>
            prev.map((a) =>
              a.id === itemId ? { ...a, status: "error" as const } : a,
            ),
          );
        }
      });
    },
    [attachments, t],
  );

  const dragAcceptFormats = useMemo(
    () =>
      ALLOWED_FILE_ACCEPT.split(",")
        .map((item) => item.trim().toLowerCase())
        .filter(Boolean),
    [],
  );

  const handleFileDrop = useCallback(
    async (files: File[], rejectedFiles: File[] = []) => {
      if (rejectedFiles.length > 0) {
        showToast(
          "仅支持上传 pdf、doc、docx、xlsx、ppt、pptx、txt、jpg、jpeg、png、webp、heic、heif、csv、json",
        );
      }
      if (files.length > 0) {
        addAttachments(files);
      }
    },
    [addAttachments],
  );

  const showOverlay = useDragOverlay(
    containerRef,
    handleFileDrop,
    dragAcceptFormats,
  );

  const handlePaste = useCallback(
    async (event: React.ClipboardEvent<HTMLTextAreaElement>) => {
      const currentModel = newChatStore.currentSession!.mask.modelConfig.model;
      if (!isVisionModel(currentModel)) {
        return;
      }
      const items = (event.clipboardData || window.clipboardData).items;
      const files: File[] = [];
      for (const item of items) {
        if (item.kind === "file" && item.type.startsWith("image/")) {
          event.preventDefault();
          const file = item.getAsFile();
          if (file) files.push(file);
        }
      }
      if (files.length > 0) addAttachments(files);
    },
    [newChatStore, addAttachments],
  );

  async function uploadFiles() {
    if (attachments.length >= MAX_ATTACHMENTS_COUNT) {
      return showToast(`最多同时上传${MAX_ATTACHMENTS_COUNT}个附件/图片`);
    }

    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = ALLOWED_FILE_ACCEPT;
    fileInput.multiple = true;
    fileInput.onchange = (event: any) => {
      const files: File[] = Array.from(event.target.files || []);
      addAttachments(files);
    };
    fileInput.click();
  }

  // 快捷键 shortcut keys
  const [showShortcutKeyModal, setShowShortcutKeyModal] = useState(false);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // 打开新聊天 command + shift + o
      if (
        (event.metaKey || event.ctrlKey) &&
        event.shiftKey &&
        event.key.toLowerCase() === "o"
      ) {
        event.preventDefault();
        setTimeout(() => {
          newChatStore.newSession(undefined, () => navigate(Path.Chat));
        }, 10);
      }
      // 聚焦聊天输入 shift + esc
      else if (event.shiftKey && event.key.toLowerCase() === "escape") {
        event.preventDefault();
        // inputRef.current?.focus();
        textareaRef.current?.focus();
      }
      // 复制最后一个代码块 command + shift + ;
      else if (
        (event.metaKey || event.ctrlKey) &&
        event.shiftKey &&
        event.code === "Semicolon"
      ) {
        event.preventDefault();
        const copyCodeButton =
          document.querySelectorAll<HTMLElement>(".copy-code-button");
        if (copyCodeButton.length > 0) {
          copyCodeButton[copyCodeButton.length - 1].click();
        }
      }
      // 复制最后一个回复 command + shift + c
      else if (
        (event.metaKey || event.ctrlKey) &&
        event.shiftKey &&
        event.key.toLowerCase() === "c"
      ) {
        event.preventDefault();
        const lastNonUserMessage = messages
          .filter((message) => message.role !== "user")
          .pop();
        if (lastNonUserMessage) {
          const lastMessageContent = getMessageTextContent(lastNonUserMessage);
          copyToClipboard(lastMessageContent);
        }
      }
      // 展示快捷键 command + /
      else if ((event.metaKey || event.ctrlKey) && event.key === "/") {
        event.preventDefault();
        setShowShortcutKeyModal(true);
      }
      // 清除上下文 command + shift + backspace
      else if (
        (event.metaKey || event.ctrlKey) &&
        event.shiftKey &&
        event.key.toLowerCase() === "backspace"
      ) {
        event.preventDefault();
        newChatStore.updateTargetSession((session) => {
          if (session.clearContextIndex === session.messages.length) {
            session.clearContextIndex = null;
          } else {
            session.clearContextIndex = session.messages.length;
            session.memoryPrompt = ""; // will clear memory
          }
        }, true);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [messages, newChatStore, navigate, session]);

  useEffect(() => {
    if (omeStore.isFromApp) {
      config.update((config) => (config.theme = Theme.Light));
    }
  }, [omeStore.isFromApp]);

  const [showChatSidePanel, setShowChatSidePanel] = useState(false);

  const { run: debouncedAction } = useDebounceFn(
    () => {
      // 空 updater，仅触发后端同步
      if (!isNil(useEnhanceChatStore.getState().currentSession?.sessionId)) {
        newChatStore.updateTargetSession(() => {}, true);
      }
    },
    { wait: 1500 },
  );

  // 切换函数
  const toggleVoice = () => {
    newChatStore.updateTargetSession(
      (session) =>
        (session.inputType =
          session.inputType === QuestionInputType.Voice
            ? QuestionInputType.Text
            : QuestionInputType.Voice),
    );

    debouncedAction();
  };

  if (!session) {
    return <></>;
  }

  return (
    <>
      <div
        className={omeStore.isFromApp ? styles["chat-is-app"] : styles.chat}
        ref={containerRef}
        key={session.id}
      >
        {omeStore.isFromApp ? (
          <div
            style={{
              textAlign: "center",
              fontWeight: 700,
              fontSize: 16,
              position: "relative",
              padding: "0 20px",
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
                visibility: "hidden",
              }}
              onClick={() => navigate(Path.Home)}
            >
              <ArrowLeftIcon />
            </div>
            <p
              style={{
                width: "100%",
                padding: "0 36px",
                boxSizing: "border-box",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {/* {!session.topic ? DEFAULT_TOPIC : session.topic} */}
              {!session.topic ? getDefaultTopic() : session.topic}
            </p>
          </div>
        ) : (
          <div className="window-header" data-tauri-drag-region>
            {isMobileScreen && (
              <div className="window-actions">
                <div className={"window-action-button"}>
                  <IconButton
                    icon={<ReturnIcon />}
                    bordered
                    // title={Locale.Chat.Actions.ChatList}
                    title={t("Chat.Actions.ChatList")}
                    onClick={() => navigate(Path.Home)}
                  />
                </div>
              </div>
            )}

            <div
              className={clsx("window-header-title", styles["chat-body-title"])}
            >
              <div
                className={clsx(
                  "window-header-main-title",
                  styles["chat-body-main-title"],
                )}
                onClickCapture={() => setIsEditingMessage(true)}
              >
                {/* {!session.topic ? DEFAULT_TOPIC : session.topic} */}
                {!session.topic ? getDefaultTopic() : session.topic}
              </div>
              <div className="window-header-sub-title">
                {/* {Locale.Chat.SubTitle(session.messages.length)} */}
                {t("Chat.SubTitle", { count: session.messages.length })}
              </div>
            </div>
            <div className="window-actions">
              <div className="window-action-button">
                <IconButton
                  icon={<ReloadIcon />}
                  bordered
                  // title={Locale.Chat.Actions.RefreshTitle}
                  title={t("Chat.Actions.RefreshTitle")}
                  onClick={() => {
                    // showToast(Locale.Chat.Actions.RefreshToast);
                    showToast(t("Chat.Actions.RefreshToast"));
                    newChatStore.summarizeSession(true, session);
                  }}
                />
              </div>
              {!isMobileScreen && (
                <div className="window-action-button">
                  <IconButton
                    icon={<RenameIcon />}
                    bordered
                    // title={Locale.Chat.EditMessage.Title}
                    title={t("Chat.EditMessage.Title")}
                    // aria={Locale.Chat.EditMessage.Title}
                    aria={t("Chat.EditMessage.Title")}
                    onClick={() => setIsEditingMessage(true)}
                  />
                </div>
              )}
              {/* <div className="window-action-button">
            <IconButton
              icon={<ExportIcon />}
              bordered
              title={Locale.Chat.Actions.Export}
              title={t("Chat.Actions.Export")}
              onClick={() => {
                setShowExport(true);
              }}
            />
          </div> */}
              {showMaxIcon && (
                <div className="window-action-button">
                  <IconButton
                    icon={config.tightBorder ? <MinIcon /> : <MaxIcon />}
                    bordered
                    // title={Locale.Chat.Actions.FullScreen}
                    // aria={Locale.Chat.Actions.FullScreen}
                    title={t("Chat.Actions.FullScreen")}
                    aria={t("Chat.Actions.FullScreen")}
                    onClick={() => {
                      config.update(
                        (config) => (config.tightBorder = !config.tightBorder),
                      );
                    }}
                  />
                </div>
              )}
            </div>

            <PromptToast
              showToast={!hitBottom}
              showModal={showPromptModal}
              setShowModal={setShowPromptModal}
            />
          </div>
        )}

        <div className={styles["chat-main"]}>
          <div className={styles["chat-body-container"]}>
            <div
              className={styles["chat-body"]}
              ref={scrollRef}
              onScroll={(e) => onChatBodyScroll(e.currentTarget)}
              onMouseDown={() => {
                textareaRef.current?.blur();
                // inputRef.current?.blur()
              }}
              onTouchStart={() => {
                textareaRef.current?.blur();
                // inputRef.current?.blur();
                setAutoScroll(false);
              }}
            >
              {messages
                // TODO
                // .filter((m) => !m.isMcpResponse)
                .map((message, i) => {
                  const isUser = message.role === "user";
                  const isContext = i < context.length;
                  const messageText = getMessageTextContent(message);
                  const messageImages = getMessageImages(message);
                  const messageFileAttachments =
                    message.attachments?.filter((item) => !item.isImage) ?? [];
                  const shouldRenderMessageBubble =
                    messageText.length > 0 ||
                    ((message.preview || message.streaming) &&
                      message.content.length === 0 &&
                      !isUser);
                  const showActions =
                    i > 0 &&
                    !(message.preview || message.content.length === 0) &&
                    !isContext;
                  const showTyping = message.preview || message.streaming;

                  const shouldShowClearContextDivider =
                    i === clearContextIndex - 1;

                  return (
                    <Fragment key={message.id}>
                      <div
                        className={
                          isUser
                            ? styles["chat-message-user"]
                            : styles["chat-message"]
                        }
                      >
                        <div className={styles["chat-message-container"]}>
                          <div className={styles["chat-message-header"]}>
                            <div className={styles["chat-message-avatar"]}>
                              {!omeStore.isFromApp && (
                                <div className={styles["chat-message-edit"]}>
                                  <IconButton
                                    icon={<EditIcon />}
                                    // aria={Locale.Chat.Actions.Edit}
                                    aria={t("Chat.Actions.Edit")}
                                    onClick={async () => {
                                      const newMessage = await showPrompt(
                                        // Locale.Chat.Actions.Edit,
                                        t("Chat.Actions.Edit"),
                                        getMessageTextContent(message),
                                        10,
                                      );
                                      let newContent:
                                        | string
                                        | MultimodalContent[] = newMessage;
                                      const images = getMessageImages(message);
                                      const files = getMessageFiles(message);
                                      if (
                                        images.length > 0 ||
                                        files.length > 0
                                      ) {
                                        newContent = [
                                          { type: "text", text: newMessage },
                                        ];
                                        for (
                                          let i = 0;
                                          i < images.length;
                                          i++
                                        ) {
                                          newContent.push({
                                            type: "image_url",
                                            image_url: { url: images[i] },
                                          });
                                        }
                                        for (let i = 0; i < files.length; i++) {
                                          newContent.push({
                                            type: "file",
                                            file_url: files[i],
                                          });
                                        }
                                      }
                                      newChatStore.updateTargetSession(
                                        (session) => {
                                          const m = session.mask.context
                                            .concat(session.messages)
                                            .find((m) => m.id === message.id);
                                          if (m) {
                                            m.content = newContent;
                                          }
                                        },
                                        true,
                                      );
                                    }}
                                  ></IconButton>
                                </div>
                              )}

                              {isUser ? (
                                <Avatar avatar={config.avatar} />
                              ) : (
                                <>
                                  {["system"].includes(message.role) ? (
                                    <Avatar avatar="2699-fe0f" />
                                  ) : (
                                    <MaskAvatar
                                      avatar={session.mask.avatar}
                                      model={
                                        message.model ||
                                        session.mask.modelConfig.model
                                      }
                                    />
                                  )}
                                </>
                              )}
                            </div>
                            {!isUser && (
                              <div className={styles["chat-model-name"]}>
                                {message.model}
                              </div>
                            )}

                            {showActions && !omeStore.isFromApp && (
                              <div className={styles["chat-message-actions"]}>
                                <div className={styles["chat-input-actions"]}>
                                  {message.streaming ? (
                                    <ChatAction
                                      // text={Locale.Chat.Actions.Stop}
                                      text={t("Chat.Actions.Stop")}
                                      icon={<StopIcon />}
                                      onClick={() =>
                                        onUserStop(message.id ?? i)
                                      }
                                    />
                                  ) : (
                                    <>
                                      <ChatAction
                                        // text={Locale.Chat.Actions.Retry}
                                        text={t("Chat.Actions.Retry")}
                                        icon={<ResetIcon />}
                                        onClick={() => onResend(message)}
                                      />

                                      <ChatAction
                                        // text={Locale.Chat.Actions.Delete}
                                        text={t("Chat.Actions.Delete")}
                                        icon={<DeleteIcon />}
                                        onClick={() => onDelete(message.id)}
                                      />

                                      <ChatAction
                                        // text={Locale.Chat.Actions.Pin}
                                        text={t("Chat.Actions.Pin")}
                                        icon={<PinIcon />}
                                        onClick={() => onPinMessage(message)}
                                      />
                                      <ChatAction
                                        // text={Locale.Chat.Actions.Copy}
                                        text={t("Chat.Actions.Copy")}
                                        icon={<CopyIcon />}
                                        onClick={() =>
                                          copyToClipboard(messageText)
                                        }
                                      />
                                      {config.ttsConfig.enable && (
                                        <ChatAction
                                          text={
                                            // speechStatus
                                            //   ? Locale.Chat.Actions.StopSpeech
                                            //   : Locale.Chat.Actions.Speech
                                            speechStatus
                                              ? t("Chat.Actions.StopSpeech")
                                              : t("Chat.Actions.Speech")
                                          }
                                          icon={
                                            speechStatus ? (
                                              <SpeakStopIcon />
                                            ) : (
                                              <SpeakIcon />
                                            )
                                          }
                                          onClick={() =>
                                            openaiSpeech(messageText)
                                          }
                                        />
                                      )}
                                    </>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                          {message?.tools?.length == 0 && showTyping && (
                            <div className={styles["chat-message-status"]}>
                              {/* {Locale.Chat.Typing} */}
                              {t("Chat.Typing")}
                            </div>
                          )}
                          {/*@ts-ignore*/}
                          {message?.tools?.length > 0 && (
                            <div className={styles["chat-message-tools"]}>
                              {message?.tools?.map((tool) => (
                                <div
                                  key={tool.id}
                                  title={tool?.errorMsg}
                                  className={styles["chat-message-tool"]}
                                >
                                  {tool.isError === false ? (
                                    <ConfirmIcon />
                                  ) : tool.isError === true ? (
                                    <CloseIcon />
                                  ) : (
                                    <LoadingButtonIcon />
                                  )}
                                  <span>{tool?.function?.name}</span>
                                </div>
                              ))}
                            </div>
                          )}
                          {(messageImages.length > 0 ||
                            messageFileAttachments.length > 0) && (
                            <div className={styles["chat-message-attachments"]}>
                              {messageImages.length > 0 && (
                                <div
                                  className={styles["chat-message-item-images"]}
                                >
                                  {messageImages.map((image, index) => {
                                    return (
                                      <img
                                        className={
                                          styles["chat-message-item-image"]
                                        }
                                        key={index}
                                        src={image}
                                        alt=""
                                      />
                                    );
                                  })}
                                </div>
                              )}
                              {messageFileAttachments.length > 0 && (
                                <div className={styles["chat-message-files"]}>
                                  {messageFileAttachments.map((item) => (
                                    <AttachmentItem key={item.id} item={item} />
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                          {shouldRenderMessageBubble && (
                            <div
                              className={
                                omeStore.isFromApp
                                  ? styles["chat-message-item-is-app"]
                                  : styles["chat-message-item"]
                              }
                            >
                              {(messageText.length > 0 ||
                                ((message.preview || message.streaming) &&
                                  message.content.length === 0 &&
                                  !isUser)) && (
                                <Markdown
                                  key={message.streaming ? "loading" : "done"}
                                  content={messageText}
                                  loading={
                                    (message.preview || message.streaming) &&
                                    message.content.length === 0 &&
                                    !isUser
                                  }
                                  //   onContextMenu={(e) => onRightClick(e, message)} // hard to use
                                  onDoubleClickCapture={() => {
                                    if (!isMobileScreen) return;
                                    setUserInput(messageText);
                                  }}
                                  fontSize={fontSize}
                                  fontFamily={fontFamily}
                                  parentRef={scrollRef}
                                  defaultShow={i >= messages.length - 6}
                                />
                              )}
                            </div>
                          )}
                          {message?.audio_url && (
                            <div className={styles["chat-message-audio"]}>
                              <audio src={message.audio_url} controls />
                            </div>
                          )}

                          {!omeStore.isFromApp && (
                            <div className={styles["chat-message-action-date"]}>
                              {isContext
                                ? // ? Locale.Chat.IsContext
                                  t("Chat.IsContext")
                                : message.date.toLocaleString()}
                            </div>
                          )}
                        </div>
                      </div>
                      {shouldShowClearContextDivider && <ClearContextDivider />}
                    </Fragment>
                  );
                })}
              {messages.length === 0 && omeStore.isFromApp && (
                <div
                  style={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    textAlign: "center",
                  }}
                >
                  <NextImage
                    src={MetisIcon.src}
                    alt="logo"
                    width={60}
                    height={60}
                  />
                  <div
                    style={{
                      fontSize: "16px",
                      fontWeight: 600,
                      marginTop: "12px",
                      marginBottom: "8px",
                    }}
                  >
                    {/* {Locale.Chat.Metis.Title} */}
                    {t("Chat.Metis.Title")}
                  </div>
                  <div
                    style={{ color: "rgba(160, 158, 187, 1)", width: "279px" }}
                  >
                    {/* {Locale.Chat.Metis.Content} */}
                    {t("Chat.Metis.Content")}
                  </div>
                </div>
              )}
            </div>
            <div
              className={
                omeStore.isFromApp
                  ? styles["chat-input-panel-is-app"]
                  : styles["chat-input-panel"]
              }
            >
              <PromptHints
                prompts={promptHints}
                onPromptSelect={onPromptSelect}
              />
              <ChatActions
                uploadFiles={uploadFiles}
                showPromptModal={() => setShowPromptModal(true)}
                scrollToBottom={scrollToBottom}
                hitBottom={hitBottom}
                showPromptHints={() => {
                  // Click again to close
                  if (promptHints.length > 0) {
                    setPromptHints([]);
                    return;
                  }

                  textareaRef.current?.focus();
                  // inputRef.current?.focus();
                  setUserInput("/");
                  onSearch("");
                }}
                setShowShortcutKeyModal={setShowShortcutKeyModal}
                setUserInput={setUserInput}
                setShowChatSidePanel={setShowChatSidePanel}
              />
              {/* 原本的输入框组件 */}
              {/* <div
                className={
                  omeStore.isFromApp
                    ? styles["chat-input-panel-inner-is-app"]
                    : styles["chat-input-panel-inner"]
                }
                style={
                  omeStore.isFromApp
                    ? {
                        padding: "12px 16px",
                        borderRadius: "32px",
                        display: "flex",
                        flexDirection: "row",
                      }
                    : { padding: "10px 10px", position: "relative" }
                }
              >
                <div style={{ width: "100%" }}>
                  <Input.TextArea
                    id="chat-input"
                    ref={textareaRef}
                    className={
                      omeStore.isFromApp
                        ? styles["chat-input-is-app"]
                        : styles["chat-input"]
                    }
                    // placeholder={Locale.Chat.Input(submitKey, config.isFromApp)}
                    placeholder={
                      omeStore.isFromApp
                        ? t("Chat.AppInput")
                        : t("Chat.Input", { submitKey })
                    }
                    onInput={(e) => onInput(e.currentTarget.value)}
                    value={userInput}
                    onKeyDown={onInputKeyDown}
                    onFocus={scrollToBottom}
                    onClick={scrollToBottom}
                    onPaste={handlePaste}
                    autoFocus={autoFocus}
                    autoSize={{
                      minRows: omeStore.isFromApp ? 1 : 2,
                      maxRows: 6,
                    }}
                    style={{
                      fontSize: config.fontSize,
                      fontFamily: config.fontFamily,
                      backgroundColor: omeStore.isFromApp
                        ? "#fafaff"
                        : undefined,
                      marginRight: 2,
                      border: "none",
                      marginBottom: attachments.length != 0 ? "8px" : 0,
                    }}
                  />

                  <AttachmentScrollBox
                    items={attachments}
                    onDelete={removeAttachment}
                  />
                </div>

                <div
                  style={{
                    maxHeight: omeStore.isFromApp ? 30 : undefined,
                    marginLeft: 4,
                    display: "flex",
                    justifyContent: "center",
                    alignItems: omeStore.isFromApp ? "center" : "end",
                    position: !omeStore.isFromApp ? "absolute" : undefined,
                    right: !omeStore.isFromApp ? "20px" : undefined,
                    bottom: !omeStore.isFromApp ? "10px" : undefined,
                  }}
                >
                  {omeStore.isFromApp ? (
                    isEmpty(userInput) && attachments.length === 0 ? (
                      <NextImage
                        src={GraySendIcon.src}
                        alt=""
                        width={32}
                        height={32}
                        onClick={() => doSubmit(userInput)}
                      />
                    ) : (
                      <NextImage
                        src={SendIcon.src}
                        alt=""
                        width={32}
                        height={32}
                        onClick={() => doSubmit(userInput)}
                      />
                    )
                  ) : (
                    <button
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        borderRadius: 10,
                        border: "none",
                        outline: "none",
                        cursor: "pointer",
                        color: "var(--black)",
                        backgroundColor: "var(--primary)",
                        padding: "10px",
                      }}
                      onClick={() => doSubmit(userInput)}
                    >
                      <SendWhiteIcon />
                      <div
                        style={{
                          fontSize: 12,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          marginLeft: 5,
                          color: "white",
                        }}
                      >
                        {t("Chat.Send")}
                      </div>
                    </button>
                  )}
                </div>
              </div> */}

              <div
                className={
                  omeStore.isFromApp
                    ? styles["chat-input-panel-inner-is-app"]
                    : styles["chat-input-panel-inner"]
                }
                style={
                  omeStore.isFromApp
                    ? {
                        padding:
                          session.inputType === QuestionInputType.Voice
                            ? "0px"
                            : "12px 16px",
                        borderRadius: "32px",
                        display: "flex",
                        flexDirection: "row",
                      }
                    : { padding: "10px 10px", position: "relative" }
                }
              >
                <div
                  style={{
                    display:
                      omeStore.isFromApp &&
                      session.inputType === QuestionInputType.Voice
                        ? "flex"
                        : "none",
                    width: "100%",
                    height: "100%",
                    alignItems: "center",
                  }}
                >
                  <VoiceChatButton
                    embedded={true}
                    onSend={async (result) => {
                      if (result?.blob) {
                        const text = await newChatStore.translateAudio(
                          result.blob,
                        );

                        if (text.trim() === "") return;

                        await doSubmit(text);
                      }
                    }}
                    onCancel={() => {
                      console.log("Voice cancelled");
                    }}
                    onSwitch={() => toggleVoice()}
                  />
                </div>
                <div
                  style={{
                    display:
                      omeStore.isFromApp &&
                      session.inputType === QuestionInputType.Voice
                        ? "none"
                        : "flex",
                    width: "100%",
                    height: "100%",
                    alignItems: "center",
                  }}
                >
                  <div style={{ width: "100%" }}>
                    <AttachmentScrollBox
                      items={attachments}
                      onDelete={removeAttachment}
                    />

                    <Input.TextArea
                      id="chat-input"
                      ref={textareaRef}
                      className={
                        omeStore.isFromApp
                          ? styles["chat-input-is-app"]
                          : styles["chat-input"]
                      }
                      // placeholder={Locale.Chat.Input(submitKey, config.isFromApp)}
                      placeholder={
                        omeStore.isFromApp
                          ? t("Chat.AppInput")
                          : t("Chat.Input", { submitKey })
                      }
                      onInput={(e) => onInput(e.currentTarget.value)}
                      value={userInput}
                      onKeyDown={onInputKeyDown}
                      onFocus={scrollToBottom}
                      onClick={scrollToBottom}
                      onPaste={handlePaste}
                      autoFocus={autoFocus}
                      autoSize={{
                        minRows: omeStore.isFromApp ? 1 : 2,
                        maxRows: 6,
                      }}
                      style={{
                        fontSize: config.fontSize,
                        fontFamily: config.fontFamily,
                        backgroundColor: omeStore.isFromApp
                          ? "#fafaff"
                          : undefined,
                        marginRight: 2,
                        border: "none",
                        marginBottom: attachments.length != 0 ? "8px" : 0,
                      }}
                    />
                  </div>
                </div>

                <div
                  style={{
                    maxHeight: omeStore.isFromApp ? 30 : undefined,
                    marginLeft: 4,
                    display:
                      session.inputType === QuestionInputType.Voice
                        ? "none"
                        : "flex",
                    justifyContent: "center",
                    alignItems: omeStore.isFromApp ? "center" : "end",
                    position: !omeStore.isFromApp ? "absolute" : undefined,
                    right: !omeStore.isFromApp ? "20px" : undefined,
                    bottom: !omeStore.isFromApp ? "10px" : undefined,
                  }}
                >
                  {omeStore.isFromApp ? (
                    isEmpty(userInput) && attachments.length === 0 ? (
                      <div
                        style={{
                          width: "32px",
                          height: "32px",
                        }}
                        onClick={() => toggleVoice()}
                      >
                        <YuYinIcon />
                      </div>
                    ) : (
                      <div
                        style={{
                          width: "32px",
                          height: "32px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          opacity: uploading ? 0.45 : 1,
                          cursor: uploading ? "not-allowed" : "pointer",
                        }}
                        onClick={
                          uploading ? undefined : () => doSubmit(userInput)
                        }
                      >
                        <NextImage
                          src={SendIcon.src}
                          alt=""
                          width={32}
                          height={32}
                        />
                      </div>
                    )
                  ) : (
                    <button
                      disabled={uploading}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        borderRadius: 10,
                        border: "none",
                        outline: "none",
                        cursor: uploading ? "not-allowed" : "pointer",
                        color: "var(--black)",
                        backgroundColor: "var(--primary)",
                        padding: "10px",
                        opacity: uploading ? 0.45 : 1,
                      }}
                      onClick={() => doSubmit(userInput)}
                    >
                      <SendWhiteIcon />
                      <div
                        style={{
                          fontSize: 12,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          marginLeft: 5,
                          color: "white",
                        }}
                      >
                        {t("Chat.Send")}
                      </div>
                    </button>
                  )}
                </div>
              </div>

              <div
                style={{
                  width: "100%",
                  color: "rgba(43, 43, 51, 0.40)",
                  display: "flex",
                  justifyContent: "center",
                  marginTop: "1rem",
                  fontSize: "12px",
                }}
              >
                {omeStore.language !== "cn" && omeStore.language !== "tw"
                  ? "AI-generated content"
                  : "內容由AI生成"}
              </div>
              {/* <label
                className={clsx(
                  config.isFromApp
                    ? styles["chat-input-panel-inner-is-app"]
                    : styles["chat-input-panel-inner"],
                  {
                    [styles["chat-input-panel-inner-attach"]]:
                      attachments.length !== 0,
                  },
                )}
                htmlFor="chat-input"
              >
                {config.isFromApp ? (
                  <div
                    style={{
                      width: "100%",
                      padding: "13px 16px",
                      borderRadius: "32px",
                      backgroundColor: "yellow",
                    }}
                  >
                    <textarea
                      id="chat-input"
                      ref={inputRef}
                      className={styles["chat-input-is-app"]}
                      placeholder={Locale.Chat.Input(submitKey)}
                      placeholder={t("Chat.Input", { submitKey, isFromApp: config.isFromApp })}
                      onInput={(e) => onInput(e.currentTarget.value)}
                      value={userInput}
                      onKeyDown={onInputKeyDown}
                      onFocus={scrollToBottom}
                      onClick={scrollToBottom}
                      onPaste={handlePaste}
                      rows={inputRows}
                      autoFocus={autoFocus}
                      style={{
                        fontSize: config.fontSize,
                        fontFamily: config.fontFamily,
                      }}
                    />
                  </div>
                ) : (
                  <>
                    <textarea
                      id="chat-input"
                      ref={inputRef}
                      className={styles["chat-input"]}
                      placeholder={Locale.Chat.Input(submitKey)}
                      placeholder={t("Chat.Input", { submitKey, isFromApp: config.isFromApp })}
                      onInput={(e) => onInput(e.currentTarget.value)}
                      value={userInput}
                      onKeyDown={onInputKeyDown}
                      onFocus={scrollToBottom}
                      onClick={scrollToBottom}
                      onPaste={handlePaste}
                      rows={inputRows}
                      autoFocus={autoFocus}
                      style={{
                        fontSize: config.fontSize,
                        fontFamily: config.fontFamily,
                      }}
                    />

                    <AttachmentScrollBox
                      items={attachments}
                      onDelete={removeAttachment}
                    />
                    <IconButton
                      icon={<SendWhiteIcon />}
                      text={Locale.Chat.Send}
                      text={t("Chat.Send")}
                      className={styles["chat-input-send"]}
                      type="primary"
                      onClick={() => doSubmit(userInput)}
                    />
                  </>
                )}
              </label> */}
            </div>
          </div>
          <div
            className={clsx(styles["chat-side-panel"], {
              [styles["mobile"]]: isMobileScreen,
              [styles["chat-side-panel-show"]]: showChatSidePanel,
            })}
          >
            {showChatSidePanel && (
              <RealtimeChat
                onClose={() => {
                  setShowChatSidePanel(false);
                }}
                onStartVoice={async () => {
                  console.log("start voice");
                }}
              />
            )}
          </div>
        </div>
      </div>
      {showExport && (
        <ExportMessageModal onClose={() => setShowExport(false)} />
      )}

      {isEditingMessage && (
        <EditMessageModal
          onClose={() => {
            setIsEditingMessage(false);
          }}
        />
      )}

      {showShortcutKeyModal && (
        <ShortcutKeyModal onClose={() => setShowShortcutKeyModal(false)} />
      )}

      {showOverlay && !omeStore.isFromApp && <UploadOverlay />}
    </>
  );
}
