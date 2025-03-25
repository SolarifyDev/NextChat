import { useState, useEffect, useMemo } from "react";

import styles from "./settings.module.scss";

import ResetIcon from "../icons/reload.svg";
import AddIcon from "../icons/add.svg";
import CloseIcon from "../icons/close.svg";
import CopyIcon from "../icons/copy.svg";
import ClearIcon from "../icons/clear.svg";
import LoadingIcon from "../icons/three-dots.svg";
import EditIcon from "../icons/edit.svg";
import FireIcon from "../icons/fire.svg";
import EyeIcon from "../icons/eye.svg";
import DownloadIcon from "../icons/download.svg";
import UploadIcon from "../icons/upload.svg";
import ConfigIcon from "../icons/config.svg";
import ConfirmIcon from "../icons/confirm.svg";

import ConnectionIcon from "../icons/connection.svg";
import CloudSuccessIcon from "../icons/cloud-success.svg";
import CloudFailIcon from "../icons/cloud-fail.svg";
import { trackSettingsPageGuideToCPaymentClick } from "../utils/auth-settings-events";
import {
  Input,
  List,
  ListItem,
  Modal,
  PasswordInput,
  Popover,
  Select,
  showConfirm,
  showToast,
} from "./ui-lib";
import { ModelConfigList } from "./model-config";

import { IconButton } from "./button";
import {
  SubmitKey,
  Theme,
  useUpdateStore,
  useAccessStore,
  useAppConfig,
} from "../store";

import Locale, { AllLangs, ALL_LANG_OPTIONS } from "../locales";
import { copyToClipboard, semverCompare } from "../utils";
import {
  Anthropic,
  Azure,
  Baidu,
  Tencent,
  ByteDance,
  Alibaba,
  Moonshot,
  XAI,
  Google,
  GoogleSafetySettingsThreshold,
  OPENAI_BASE_URL,
  Path,
  RELEASE_URL,
  STORAGE_KEY,
  ServiceProvider,
  UPDATE_URL,
  Stability,
  Iflytek,
  SAAS_CHAT_URL,
  ChatGLM,
  DeepSeek,
  SiliconFlow,
} from "../constant";
import { Prompt, SearchService, usePromptStore } from "../store/prompt";
import ErrorBoundary from "./error";
import { InputRange } from "./input-range";
import { useNavigate } from "react-router-dom";
import { Avatar, AvatarPicker } from "./emoji";
import { getClientConfig } from "../config/client";
import { useSyncStore } from "../store/sync";
import { nanoid } from "nanoid";
import { useMaskStore } from "../store/mask";
import { ProviderType } from "../utils/cloud";
import { useNewChatStore } from "../store/new-chat";
import { useTranslation } from "react-i18next";
import { useOmeStore } from "../store/ome";

function EditPromptModal(props: { id: string; onClose: () => void }) {
  const { t } = useTranslation();
  const promptStore = usePromptStore();
  const prompt = promptStore.get(props.id);

  return prompt ? (
    <div className="modal-mask">
      <Modal
        // title={Locale.Settings.Prompt.EditModal.Title}
        title={t("Settings.Prompt.EditModal.Title")}
        onClose={props.onClose}
        actions={[
          <IconButton
            key=""
            onClick={props.onClose}
            // text={Locale.UI.Confirm}
            text={t("UI.Confirm")}
            bordered
          />,
        ]}
      >
        <div className={styles["edit-prompt-modal"]}>
          <input
            type="text"
            value={prompt.title}
            readOnly={!prompt.isUser}
            className={styles["edit-prompt-title"]}
            onInput={(e) =>
              promptStore.updatePrompt(
                props.id,
                (prompt) => (prompt.title = e.currentTarget.value),
              )
            }
          ></input>
          <Input
            value={prompt.content}
            readOnly={!prompt.isUser}
            className={styles["edit-prompt-content"]}
            rows={10}
            onInput={(e) =>
              promptStore.updatePrompt(
                props.id,
                (prompt) => (prompt.content = e.currentTarget.value),
              )
            }
          ></Input>
        </div>
      </Modal>
    </div>
  ) : null;
}

function UserPromptModal(props: { onClose?: () => void }) {
  const { t } = useTranslation();
  const promptStore = usePromptStore();
  const userPrompts = promptStore.getUserPrompts();
  const builtinPrompts = SearchService.builtinPrompts;
  const allPrompts = userPrompts.concat(builtinPrompts);
  const [searchInput, setSearchInput] = useState("");
  const [searchPrompts, setSearchPrompts] = useState<Prompt[]>([]);
  const prompts = searchInput.length > 0 ? searchPrompts : allPrompts;

  const [editingPromptId, setEditingPromptId] = useState<string>();

  useEffect(() => {
    if (searchInput.length > 0) {
      const searchResult = SearchService.search(searchInput);
      setSearchPrompts(searchResult);
    } else {
      setSearchPrompts([]);
    }
  }, [searchInput]);

  return (
    <div className="modal-mask">
      <Modal
        // title={Locale.Settings.Prompt.Modal.Title}
        title={t("Settings.Prompt.Modal.Title")}
        onClose={() => props.onClose?.()}
        actions={[
          <IconButton
            key="add"
            onClick={() => {
              const promptId = promptStore.add({
                id: nanoid(),
                createdAt: Date.now(),
                title: "Empty Prompt",
                content: "Empty Prompt Content",
              });
              setEditingPromptId(promptId);
            }}
            icon={<AddIcon />}
            bordered
            // text={Locale.Settings.Prompt.Modal.Add}
            text={t("Settings.Prompt.Modal.Add")}
          />,
        ]}
      >
        <div className={styles["user-prompt-modal"]}>
          <input
            type="text"
            className={styles["user-prompt-search"]}
            // placeholder={Locale.Settings.Prompt.Modal.Search}
            placeholder={t("Settings.Prompt.Modal.Search")}
            value={searchInput}
            onInput={(e) => setSearchInput(e.currentTarget.value)}
          ></input>

          <div className={styles["user-prompt-list"]}>
            {prompts.map((v, _) => (
              <div className={styles["user-prompt-item"]} key={v.id ?? v.title}>
                <div className={styles["user-prompt-header"]}>
                  <div className={styles["user-prompt-title"]}>{v.title}</div>
                  <div className={styles["user-prompt-content"] + " one-line"}>
                    {v.content}
                  </div>
                </div>

                <div className={styles["user-prompt-buttons"]}>
                  {v.isUser && (
                    <IconButton
                      icon={<ClearIcon />}
                      className={styles["user-prompt-button"]}
                      onClick={() => promptStore.remove(v.id!)}
                    />
                  )}
                  {v.isUser ? (
                    <IconButton
                      icon={<EditIcon />}
                      className={styles["user-prompt-button"]}
                      onClick={() => setEditingPromptId(v.id)}
                    />
                  ) : (
                    <IconButton
                      icon={<EyeIcon />}
                      className={styles["user-prompt-button"]}
                      onClick={() => setEditingPromptId(v.id)}
                    />
                  )}
                  <IconButton
                    icon={<CopyIcon />}
                    className={styles["user-prompt-button"]}
                    onClick={() => copyToClipboard(v.content)}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </Modal>

      {editingPromptId !== undefined && (
        <EditPromptModal
          id={editingPromptId!}
          onClose={() => setEditingPromptId(undefined)}
        />
      )}
    </div>
  );
}

function DangerItems() {
  const { t } = useTranslation();
  const chatStore = useNewChatStore();
  const appConfig = useAppConfig();

  return (
    <List>
      <ListItem
        // title={Locale.Settings.Danger.Reset.Title}
        // subTitle={Locale.Settings.Danger.Reset.SubTitle}
        title={t("Settings.Danger.Reset.Title")}
        subTitle={t("Settings.Danger.Reset.SubTitle")}
      >
        <IconButton
          // aria={Locale.Settings.Danger.Reset.Title}
          // text={Locale.Settings.Danger.Reset.Action}
          aria={t("Settings.Danger.Reset.Title")}
          text={t("Settings.Danger.Reset.Action")}
          onClick={async () => {
            // if (await showConfirm(Locale.Settings.Danger.Reset.Confirm)) {
            if (await showConfirm(t("Settings.Danger.Reset.Confirm"))) {
              appConfig.reset();
            }
          }}
          type="danger"
        />
      </ListItem>
      <ListItem
        // title={Locale.Settings.Danger.Clear.Title}
        // subTitle={Locale.Settings.Danger.Clear.SubTitle}
        title={t("Settings.Danger.Clear.Title")}
        subTitle={t("Settings.Danger.Clear.SubTitle")}
      >
        <IconButton
          // aria={Locale.Settings.Danger.Clear.Title}
          // text={Locale.Settings.Danger.Clear.Action}
          aria={t("Settings.Danger.Clear.Title")}
          text={t("Settings.Danger.Clear.Action")}
          onClick={async () => {
            // if (await showConfirm(Locale.Settings.Danger.Clear.Confirm)) {
            if (await showConfirm(t("Settings.Danger.Clear.Confirm"))) {
              chatStore.clearAllData();
            }
          }}
          type="danger"
        />
      </ListItem>
    </List>
  );
}

function CheckButton() {
  const { t } = useTranslation();
  const syncStore = useSyncStore();

  const couldCheck = useMemo(() => {
    return syncStore.cloudSync();
  }, [syncStore]);

  const [checkState, setCheckState] = useState<
    "none" | "checking" | "success" | "failed"
  >("none");

  async function check() {
    setCheckState("checking");
    const valid = await syncStore.check();
    setCheckState(valid ? "success" : "failed");
  }

  if (!couldCheck) return null;

  return (
    <IconButton
      // text={Locale.Settings.Sync.Config.Modal.Check}
      text={t("Settings.Sync.Config.Modal.Check")}
      bordered
      onClick={check}
      icon={
        checkState === "none" ? (
          <ConnectionIcon />
        ) : checkState === "checking" ? (
          <LoadingIcon />
        ) : checkState === "success" ? (
          <CloudSuccessIcon />
        ) : checkState === "failed" ? (
          <CloudFailIcon />
        ) : (
          <ConnectionIcon />
        )
      }
    ></IconButton>
  );
}

function SyncConfigModal(props: { onClose?: () => void }) {
  const { t } = useTranslation();
  const syncStore = useSyncStore();

  return (
    <div className="modal-mask">
      <Modal
        // title={Locale.Settings.Sync.Config.Modal.Title}
        title={t("Settings.Sync.Config.Modal.Title")}
        onClose={() => props.onClose?.()}
        actions={[
          <CheckButton key="check" />,
          <IconButton
            key="confirm"
            onClick={props.onClose}
            icon={<ConfirmIcon />}
            bordered
            // text={Locale.UI.Confirm}
            text={t("UI.Confirm")}
          />,
        ]}
      >
        <List>
          <ListItem
            // title={Locale.Settings.Sync.Config.SyncType.Title}
            // subTitle={Locale.Settings.Sync.Config.SyncType.SubTitle}
            title={t("Settings.Sync.Config.SyncType.Title")}
            subTitle={t("Settings.Sync.Config.SyncType.SubTitle")}
          >
            <select
              value={syncStore.provider}
              onChange={(e) => {
                syncStore.update(
                  (config) =>
                    (config.provider = e.target.value as ProviderType),
                );
              }}
            >
              {Object.entries(ProviderType).map(([k, v]) => (
                <option value={v} key={k}>
                  {k}
                </option>
              ))}
            </select>
          </ListItem>

          <ListItem
            // title={Locale.Settings.Sync.Config.Proxy.Title}
            // subTitle={Locale.Settings.Sync.Config.Proxy.SubTitle}
            title={t("Settings.Sync.Config.Proxy.Title")}
            subTitle={t("Settings.Sync.Config.Proxy.SubTitle")}
          >
            <input
              type="checkbox"
              checked={syncStore.useProxy}
              onChange={(e) => {
                syncStore.update(
                  (config) => (config.useProxy = e.currentTarget.checked),
                );
              }}
            ></input>
          </ListItem>
          {syncStore.useProxy ? (
            <ListItem
              // title={Locale.Settings.Sync.Config.ProxyUrl.Title}
              // subTitle={Locale.Settings.Sync.Config.ProxyUrl.SubTitle}
              title={t("Settings.Sync.Config.ProxyUrl.Title")}
              subTitle={t("Settings.Sync.Config.ProxyUrl.SubTitle")}
            >
              <input
                type="text"
                value={syncStore.proxyUrl}
                onChange={(e) => {
                  syncStore.update(
                    (config) => (config.proxyUrl = e.currentTarget.value),
                  );
                }}
              ></input>
            </ListItem>
          ) : null}
        </List>

        {syncStore.provider === ProviderType.WebDAV && (
          <>
            <List>
              {/* <ListItem title={Locale.Settings.Sync.Config.WebDav.Endpoint}> */}
              <ListItem title={t("Settings.Sync.Config.WebDav.Endpoint")}>
                <input
                  type="text"
                  value={syncStore.webdav.endpoint}
                  onChange={(e) => {
                    syncStore.update(
                      (config) =>
                        (config.webdav.endpoint = e.currentTarget.value),
                    );
                  }}
                ></input>
              </ListItem>

              {/* <ListItem title={Locale.Settings.Sync.Config.WebDav.UserName}> */}
              <ListItem title={t("Settings.Sync.Config.WebDav.UserName")}>
                <input
                  type="text"
                  value={syncStore.webdav.username}
                  onChange={(e) => {
                    syncStore.update(
                      (config) =>
                        (config.webdav.username = e.currentTarget.value),
                    );
                  }}
                ></input>
              </ListItem>
              {/* <ListItem title={Locale.Settings.Sync.Config.WebDav.Password}> */}
              <ListItem title={t("Settings.Sync.Config.WebDav.Password")}>
                <PasswordInput
                  value={syncStore.webdav.password}
                  onChange={(e) => {
                    syncStore.update(
                      (config) =>
                        (config.webdav.password = e.currentTarget.value),
                    );
                  }}
                ></PasswordInput>
              </ListItem>
            </List>
          </>
        )}

        {syncStore.provider === ProviderType.UpStash && (
          <List>
            {/* <ListItem title={Locale.Settings.Sync.Config.UpStash.Endpoint}> */}
            <ListItem title={t("Settings.Sync.Config.UpStash.Endpoint")}>
              <input
                type="text"
                value={syncStore.upstash.endpoint}
                onChange={(e) => {
                  syncStore.update(
                    (config) =>
                      (config.upstash.endpoint = e.currentTarget.value),
                  );
                }}
              ></input>
            </ListItem>

            {/* <ListItem title={Locale.Settings.Sync.Config.UpStash.UserName}> */}
            <ListItem title={t("Settings.Sync.Config.UpStash.UserName")}>
              <input
                type="text"
                value={syncStore.upstash.username}
                placeholder={STORAGE_KEY}
                onChange={(e) => {
                  syncStore.update(
                    (config) =>
                      (config.upstash.username = e.currentTarget.value),
                  );
                }}
              ></input>
            </ListItem>
            {/* <ListItem title={Locale.Settings.Sync.Config.UpStash.Password}> */}
            <ListItem title={t("Settings.Sync.Config.UpStash.Password")}>
              <PasswordInput
                value={syncStore.upstash.apiKey}
                onChange={(e) => {
                  syncStore.update(
                    (config) => (config.upstash.apiKey = e.currentTarget.value),
                  );
                }}
              ></PasswordInput>
            </ListItem>
          </List>
        )}
      </Modal>
    </div>
  );
}

function SyncItems() {
  const { t } = useTranslation();
  const syncStore = useSyncStore();
  // const chatStore = useChatStore();
  const chatStore = useNewChatStore();
  const promptStore = usePromptStore();
  const maskStore = useMaskStore();
  const couldSync = useMemo(() => {
    return syncStore.cloudSync();
  }, [syncStore]);

  const [showSyncConfigModal, setShowSyncConfigModal] = useState(false);

  const stateOverview = useMemo(() => {
    const sessions = chatStore.sessions;
    const messageCount = sessions.reduce((p, c) => p + c.messages.length, 0);

    return {
      chat: sessions.length,
      message: messageCount,
      prompt: Object.keys(promptStore.prompts).length,
      mask: Object.keys(maskStore.masks).length,
    };
  }, [chatStore.sessions, maskStore.masks, promptStore.prompts]);

  return (
    <>
      <List>
        <ListItem
          // title={Locale.Settings.Sync.CloudState}
          title={t("Settings.Sync.CloudState")}
          subTitle={
            syncStore.lastProvider
              ? `${new Date(syncStore.lastSyncTime).toLocaleString()} [${
                  syncStore.lastProvider
                }]`
              : // : Locale.Settings.Sync.NotSyncYet
                t("Settings.Sync.NotSyncYet")
          }
        >
          <div style={{ display: "flex" }}>
            <IconButton
              // aria={Locale.Settings.Sync.CloudState + Locale.UI.Config}
              aria={t("Settings.Sync.CloudState") + t("UI.Config")}
              icon={<ConfigIcon />}
              // text={Locale.UI.Config}
              text={t("UI.Config")}
              onClick={() => {
                setShowSyncConfigModal(true);
              }}
            />
            {couldSync && (
              <IconButton
                icon={<ResetIcon />}
                // text={Locale.UI.Sync}
                text={t("UI.Sync")}
                onClick={async () => {
                  try {
                    await syncStore.sync();
                    // showToast(Locale.Settings.Sync.Success);
                    showToast(t("Settings.Sync.Success"));
                  } catch (e) {
                    // showToast(Locale.Settings.Sync.Fail);
                    showToast(t("Settings.Sync.Fail"));

                    console.error("[Sync]", e);
                  }
                }}
              />
            )}
          </div>
        </ListItem>

        <ListItem
          // title={Locale.Settings.Sync.LocalState}
          // subTitle={Locale.Settings.Sync.Overview(stateOverview)}
          title={t("Settings.Sync.LocalState")}
          subTitle={t("Settings.Sync.Overview", {
            chat: stateOverview.chat,
            message: stateOverview.message,
            prompt: stateOverview.prompt,
            mask: stateOverview.mask,
          })}
        >
          <div style={{ display: "flex" }}>
            <IconButton
              // aria={Locale.Settings.Sync.LocalState + Locale.UI.Export}
              aria={t("Settings.Sync.LocalState") + t("UI.Export")}
              icon={<UploadIcon />}
              // text={Locale.UI.Export}
              text={t("UI.Export")}
              onClick={() => {
                syncStore.export();
              }}
            />
            <IconButton
              // aria={Locale.Settings.Sync.LocalState + Locale.UI.Import}
              aria={t("Settings.Sync.LocalState") + t("UI.Import")}
              icon={<DownloadIcon />}
              // text={Locale.UI.Import}
              text={t("UI.Import")}
              onClick={() => {
                syncStore.import();
              }}
            />
          </div>
        </ListItem>
      </List>

      {showSyncConfigModal && (
        <SyncConfigModal onClose={() => setShowSyncConfigModal(false)} />
      )}
    </>
  );
}

export function Settings() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const config = useAppConfig();
  const updateConfig = config.update;

  const updateStore = useUpdateStore();
  const [checkingUpdate, setCheckingUpdate] = useState(false);
  const currentVersion = updateStore.formatVersion(updateStore.version);
  const remoteId = updateStore.formatVersion(updateStore.remoteVersion);
  const hasNewVersion = semverCompare(currentVersion, remoteId) === -1;
  const updateUrl = getClientConfig()?.isApp ? RELEASE_URL : UPDATE_URL;

  function checkUpdate(force = false) {
    setCheckingUpdate(true);
    updateStore.getLatestVersion(force).then(() => {
      setCheckingUpdate(false);
    });

    console.log("[Update] local version ", updateStore.version);
    console.log("[Update] remote version ", updateStore.remoteVersion);
  }

  const accessStore = useAccessStore();
  const shouldHideBalanceQuery = useMemo(() => {
    const isOpenAiUrl = accessStore.openaiUrl.includes(OPENAI_BASE_URL);

    return (
      accessStore.hideBalanceQuery ||
      isOpenAiUrl ||
      accessStore.provider === ServiceProvider.Azure
    );
  }, [
    accessStore.hideBalanceQuery,
    accessStore.openaiUrl,
    accessStore.provider,
  ]);

  const usage = {
    used: updateStore.used,
    subscription: updateStore.subscription,
  };
  const [loadingUsage, setLoadingUsage] = useState(false);
  function checkUsage(force = false) {
    if (shouldHideBalanceQuery) {
      return;
    }

    setLoadingUsage(true);
    updateStore.updateUsage(force).finally(() => {
      setLoadingUsage(false);
    });
  }

  const enabledAccessControl = useMemo(
    () => accessStore.enabledAccessControl(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const omeStore = useOmeStore();
  const promptStore = usePromptStore();
  const builtinCount = SearchService.count.builtin;
  const customCount = promptStore.getUserPrompts().length ?? 0;
  const [shouldShowPromptModal, setShowPromptModal] = useState(false);

  const showUsage = accessStore.isAuthorized();
  useEffect(() => {
    // checks per minutes
    checkUpdate();
    showUsage && checkUsage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const keydownEvent = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        navigate(Path.Home);
      }
    };
    if (clientConfig?.isApp) {
      // Force to set custom endpoint to true if it's app
      accessStore.update((state) => {
        state.useCustomConfig = true;
      });
    }
    document.addEventListener("keydown", keydownEvent);
    return () => {
      document.removeEventListener("keydown", keydownEvent);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const clientConfig = useMemo(() => getClientConfig(), []);
  const showAccessCode = enabledAccessControl && !clientConfig?.isApp;

  const accessCodeComponent = showAccessCode && (
    <ListItem
      // title={Locale.Settings.Access.AccessCode.Title}
      // subTitle={Locale.Settings.Access.AccessCode.SubTitle}
      title={t("Settings.Access.AccessCode.Title")}
      subTitle={t("Settings.Access.AccessCode.SubTitle")}
    >
      <PasswordInput
        value={accessStore.accessCode}
        type="text"
        // placeholder={Locale.Settings.Access.AccessCode.Placeholder}
        placeholder={t("Settings.Access.AccessCode.Placeholder")}
        onChange={(e) => {
          accessStore.update(
            (access) => (access.accessCode = e.currentTarget.value),
          );
        }}
      />
    </ListItem>
  );

  const saasStartComponent = (
    <ListItem
      className={styles["subtitle-button"]}
      // title={
      //   Locale.Settings.Access.SaasStart.Title +
      //   `${Locale.Settings.Access.SaasStart.Label}`
      // }
      title={
        t("Settings.Access.SaasStart.Title") +
        `${t("Settings.Access.SaasStart.Label")}`
      }
      // subTitle={Locale.Settings.Access.SaasStart.SubTitle}
      subTitle={t("Settings.Access.SaasStart.SubTitle")}
    >
      <IconButton
        // aria={
        //   Locale.Settings.Access.SaasStart.Title +
        //   Locale.Settings.Access.SaasStart.ChatNow
        // }
        aria={
          t("Settings.Access.SaasStart.Title") +
          t("Settings.Access.SaasStart.ChatNow")
        }
        icon={<FireIcon />}
        type={"primary"}
        text={Locale.Settings.Access.SaasStart.ChatNow}
        onClick={() => {
          trackSettingsPageGuideToCPaymentClick();
          window.location.href = SAAS_CHAT_URL;
        }}
      />
    </ListItem>
  );

  const useCustomConfigComponent = // Conditionally render the following ListItem based on clientConfig.isApp
    !clientConfig?.isApp && ( // only show if isApp is false
      <ListItem
        // title={Locale.Settings.Access.CustomEndpoint.Title}
        // subTitle={Locale.Settings.Access.CustomEndpoint.SubTitle}
        title={t("Settings.Access.CustomEndpoint.Title")}
        subTitle={t("Settings.Access.CustomEndpoint.SubTitle")}
      >
        <input
          // aria-label={Locale.Settings.Access.CustomEndpoint.Title}
          aria-label={t("Settings.Access.CustomEndpoint.Title")}
          type="checkbox"
          checked={accessStore.useCustomConfig}
          onChange={(e) =>
            accessStore.update(
              (access) => (access.useCustomConfig = e.currentTarget.checked),
            )
          }
        ></input>
      </ListItem>
    );

  const openAIConfigComponent = accessStore.provider ===
    ServiceProvider.OpenAI && (
    <>
      <ListItem
        // title={Locale.Settings.Access.OpenAI.Endpoint.Title}
        // subTitle={Locale.Settings.Access.OpenAI.Endpoint.SubTitle}
        title={t("Settings.Access.OpenAI.Endpoint.Title")}
        subTitle={t("Settings.Access.OpenAI.Endpoint.SubTitle")}
      >
        <input
          // aria-label={Locale.Settings.Access.OpenAI.Endpoint.Title}
          aria-label={t("Settings.Access.OpenAI.Endpoint.Title")}
          type="text"
          value={accessStore.openaiUrl}
          placeholder={OPENAI_BASE_URL}
          onChange={(e) =>
            accessStore.update(
              (access) => (access.openaiUrl = e.currentTarget.value),
            )
          }
        ></input>
      </ListItem>
      <ListItem
        // title={Locale.Settings.Access.OpenAI.ApiKey.Title}
        // subTitle={Locale.Settings.Access.OpenAI.ApiKey.SubTitle}
        title={t("Settings.Access.OpenAI.ApiKey.Title")}
        subTitle={t("Settings.Access.OpenAI.ApiKey.SubTitle")}
      >
        <PasswordInput
          // aria={Locale.Settings.ShowPassword}
          // aria-label={Locale.Settings.Access.OpenAI.ApiKey.Title}
          aria={t("Settings.ShowPassword")}
          aria-label={t("Settings.Access.OpenAI.ApiKey.Title")}
          value={accessStore.openaiApiKey}
          type="text"
          // placeholder={Locale.Settings.Access.OpenAI.ApiKey.Placeholder}
          placeholder={t("Settings.Access.OpenAI.ApiKey.Placeholder")}
          onChange={(e) => {
            accessStore.update(
              (access) => (access.openaiApiKey = e.currentTarget.value),
            );
          }}
        />
      </ListItem>
    </>
  );

  const azureConfigComponent = accessStore.provider ===
    ServiceProvider.Azure && (
    <>
      <ListItem
        // title={Locale.Settings.Access.Azure.Endpoint.Title}
        // subTitle={
        //   Locale.Settings.Access.Azure.Endpoint.SubTitle + Azure.ExampleEndpoint
        // }
        title={t("Settings.Access.Azure.Endpoint.Title")}
        subTitle={
          t("Settings.Access.Azure.Endpoint.SubTitle") + Azure.ExampleEndpoint
        }
      >
        <input
          // aria-label={Locale.Settings.Access.Azure.Endpoint.Title}
          aria-label={t("Settings.Access.Azure.Endpoint.Title")}
          type="text"
          value={accessStore.azureUrl}
          placeholder={Azure.ExampleEndpoint}
          onChange={(e) =>
            accessStore.update(
              (access) => (access.azureUrl = e.currentTarget.value),
            )
          }
        ></input>
      </ListItem>
      <ListItem
        // title={Locale.Settings.Access.Azure.ApiKey.Title}
        // subTitle={Locale.Settings.Access.Azure.ApiKey.SubTitle}
        title={t("Settings.Access.Azure.ApiKey.Title")}
        subTitle={t("Settings.Access.Azure.ApiKey.SubTitle")}
      >
        <PasswordInput
          // aria-label={Locale.Settings.Access.Azure.ApiKey.Title}
          aria-label={t("Settings.Access.Azure.ApiKey.Title")}
          value={accessStore.azureApiKey}
          type="text"
          // placeholder={Locale.Settings.Access.Azure.ApiKey.Placeholder}
          placeholder={t("Settings.Access.Azure.ApiKey.Placeholder")}
          onChange={(e) => {
            accessStore.update(
              (access) => (access.azureApiKey = e.currentTarget.value),
            );
          }}
        />
      </ListItem>
      <ListItem
        // title={Locale.Settings.Access.Azure.ApiVerion.Title}
        // subTitle={Locale.Settings.Access.Azure.ApiVerion.SubTitle}
        title={t("Settings.Access.Azure.ApiVerion.Title")}
        subTitle={t("Settings.Access.Azure.ApiVerion.SubTitle")}
      >
        <input
          // aria-label={Locale.Settings.Access.Azure.ApiVerion.Title}
          aria-label={t("Settings.Access.Azure.ApiVerion.Title")}
          type="text"
          value={accessStore.azureApiVersion}
          placeholder="2023-08-01-preview"
          onChange={(e) =>
            accessStore.update(
              (access) => (access.azureApiVersion = e.currentTarget.value),
            )
          }
        ></input>
      </ListItem>
    </>
  );

  const googleConfigComponent = accessStore.provider ===
    ServiceProvider.Google && (
    <>
      <ListItem
        // title={Locale.Settings.Access.Google.Endpoint.Title}
        // subTitle={
        //   Locale.Settings.Access.Google.Endpoint.SubTitle +
        //   Google.ExampleEndpoint
        // }
        title={t("Settings.Access.Google.Endpoint.Title")}
        subTitle={
          t("Settings.Access.Google.Endpoint.SubTitle") + Google.ExampleEndpoint
        }
      >
        <input
          // aria-label={Locale.Settings.Access.Google.Endpoint.Title}
          aria-label={t("Settings.Access.Google.Endpoint.Title")}
          type="text"
          value={accessStore.googleUrl}
          placeholder={Google.ExampleEndpoint}
          onChange={(e) =>
            accessStore.update(
              (access) => (access.googleUrl = e.currentTarget.value),
            )
          }
        ></input>
      </ListItem>
      <ListItem
        // title={Locale.Settings.Access.Google.ApiKey.Title}
        // subTitle={Locale.Settings.Access.Google.ApiKey.SubTitle}
        title={t("Settings.Access.Google.ApiKey.Title")}
        subTitle={t("Settings.Access.Google.ApiKey.SubTitle")}
      >
        <PasswordInput
          // aria-label={Locale.Settings.Access.Google.ApiKey.Title}
          aria-label={t("Settings.Access.Google.ApiKey.Title")}
          value={accessStore.googleApiKey}
          type="text"
          // placeholder={Locale.Settings.Access.Google.ApiKey.Placeholder}
          placeholder={t("Settings.Access.Google.ApiKey.Placeholder")}
          onChange={(e) => {
            accessStore.update(
              (access) => (access.googleApiKey = e.currentTarget.value),
            );
          }}
        />
      </ListItem>
      <ListItem
        // title={Locale.Settings.Access.Google.ApiVersion.Title}
        // subTitle={Locale.Settings.Access.Google.ApiVersion.SubTitle}
        title={t("Settings.Access.Google.ApiVersion.Title")}
        subTitle={t("Settings.Access.Google.ApiVersion.SubTitle")}
      >
        <input
          // aria-label={Locale.Settings.Access.Google.ApiVersion.Title}
          aria-label={t("Settings.Access.Google.ApiVersion.Title")}
          type="text"
          value={accessStore.googleApiVersion}
          placeholder="2023-08-01-preview"
          onChange={(e) =>
            accessStore.update(
              (access) => (access.googleApiVersion = e.currentTarget.value),
            )
          }
        ></input>
      </ListItem>
      <ListItem
        // title={Locale.Settings.Access.Google.GoogleSafetySettings.Title}
        // subTitle={Locale.Settings.Access.Google.GoogleSafetySettings.SubTitle}
        title={t("Settings.Access.Google.GoogleSafetySettings.Title")}
        subTitle={t("Settings.Access.Google.GoogleSafetySettings.SubTitle")}
      >
        <Select
          // aria-label={Locale.Settings.Access.Google.GoogleSafetySettings.Title}
          aria-label={t("Settings.Access.Google.GoogleSafetySettings.Title")}
          value={accessStore.googleSafetySettings}
          onChange={(e) => {
            accessStore.update(
              (access) =>
                (access.googleSafetySettings = e.target
                  .value as GoogleSafetySettingsThreshold),
            );
          }}
        >
          {Object.entries(GoogleSafetySettingsThreshold).map(([k, v]) => (
            <option value={v} key={k}>
              {k}
            </option>
          ))}
        </Select>
      </ListItem>
    </>
  );

  const anthropicConfigComponent = accessStore.provider ===
    ServiceProvider.Anthropic && (
    <>
      <ListItem
        // title={Locale.Settings.Access.Anthropic.Endpoint.Title}
        // subTitle={
        //   Locale.Settings.Access.Anthropic.Endpoint.SubTitle +
        //   Anthropic.ExampleEndpoint
        // }
        title={t("Settings.Access.Anthropic.Endpoint.Title")}
        subTitle={
          t("Settings.Access.Anthropic.Endpoint.SubTitle") +
          Anthropic.ExampleEndpoint
        }
      >
        <input
          // aria-label={Locale.Settings.Access.Anthropic.Endpoint.Title}
          aria-label={t("Settings.Access.Anthropic.Endpoint.Title")}
          type="text"
          value={accessStore.anthropicUrl}
          placeholder={Anthropic.ExampleEndpoint}
          onChange={(e) =>
            accessStore.update(
              (access) => (access.anthropicUrl = e.currentTarget.value),
            )
          }
        ></input>
      </ListItem>
      <ListItem
        // title={Locale.Settings.Access.Anthropic.ApiKey.Title}
        // subTitle={Locale.Settings.Access.Anthropic.ApiKey.SubTitle}
        title={t("Settings.Access.Anthropic.ApiKey.Title")}
        subTitle={t("Settings.Access.Anthropic.ApiKey.SubTitle")}
      >
        <PasswordInput
          // aria-label={Locale.Settings.Access.Anthropic.ApiKey.Title}
          aria-label={t("Settings.Access.Anthropic.ApiKey.Title")}
          value={accessStore.anthropicApiKey}
          type="text"
          // placeholder={Locale.Settings.Access.Anthropic.ApiKey.Placeholder}
          placeholder={t("Settings.Access.Anthropic.ApiKey.Placeholder")}
          onChange={(e) => {
            accessStore.update(
              (access) => (access.anthropicApiKey = e.currentTarget.value),
            );
          }}
        />
      </ListItem>
      <ListItem
        // title={Locale.Settings.Access.Anthropic.ApiVerion.Title}
        // subTitle={Locale.Settings.Access.Anthropic.ApiVerion.SubTitle}
        title={t("Settings.Access.Anthropic.ApiVerion.Title")}
        subTitle={t("Settings.Access.Anthropic.ApiVerion.SubTitle")}
      >
        <input
          // aria-label={Locale.Settings.Access.Anthropic.ApiVerion.Title}
          aria-label={t("Settings.Access.Anthropic.ApiVerion.Title")}
          type="text"
          value={accessStore.anthropicApiVersion}
          placeholder={Anthropic.Vision}
          onChange={(e) =>
            accessStore.update(
              (access) => (access.anthropicApiVersion = e.currentTarget.value),
            )
          }
        ></input>
      </ListItem>
    </>
  );

  const baiduConfigComponent = accessStore.provider ===
    ServiceProvider.Baidu && (
    <>
      <ListItem
        // title={Locale.Settings.Access.Baidu.Endpoint.Title}
        // subTitle={Locale.Settings.Access.Baidu.Endpoint.SubTitle}
        title={t("Settings.Access.Baidu.Endpoint.Title")}
        subTitle={t("Settings.Access.Baidu.Endpoint.SubTitle")}
      >
        <input
          // aria-label={Locale.Settings.Access.Baidu.Endpoint.Title}
          aria-label={t("Settings.Access.Baidu.Endpoint.Title")}
          type="text"
          value={accessStore.baiduUrl}
          placeholder={Baidu.ExampleEndpoint}
          onChange={(e) =>
            accessStore.update(
              (access) => (access.baiduUrl = e.currentTarget.value),
            )
          }
        ></input>
      </ListItem>
      <ListItem
        // title={Locale.Settings.Access.Baidu.ApiKey.Title}
        // subTitle={Locale.Settings.Access.Baidu.ApiKey.SubTitle}
        title={t("Settings.Access.Baidu.ApiKey.Title")}
        subTitle={t("Settings.Access.Baidu.ApiKey.SubTitle")}
      >
        <PasswordInput
          // aria-label={Locale.Settings.Access.Baidu.ApiKey.Title}
          aria-label={t("Settings.Access.Baidu.ApiKey.Title")}
          value={accessStore.baiduApiKey}
          type="text"
          // placeholder={Locale.Settings.Access.Baidu.ApiKey.Placeholder}
          placeholder={t("Settings.Access.Baidu.ApiKey.Placeholder")}
          onChange={(e) => {
            accessStore.update(
              (access) => (access.baiduApiKey = e.currentTarget.value),
            );
          }}
        />
      </ListItem>
      <ListItem
        // title={Locale.Settings.Access.Baidu.SecretKey.Title}
        // subTitle={Locale.Settings.Access.Baidu.SecretKey.SubTitle}
        title={t("Settings.Access.Baidu.SecretKey.Title")}
        subTitle={t("Settings.Access.Baidu.SecretKey.SubTitle")}
      >
        <PasswordInput
          // aria-label={Locale.Settings.Access.Baidu.SecretKey.Title}
          aria-label={t("Settings.Access.Baidu.SecretKey.Title")}
          value={accessStore.baiduSecretKey}
          type="text"
          // placeholder={Locale.Settings.Access.Baidu.SecretKey.Placeholder}
          placeholder={t("Settings.Access.Baidu.SecretKey.Placeholder")}
          onChange={(e) => {
            accessStore.update(
              (access) => (access.baiduSecretKey = e.currentTarget.value),
            );
          }}
        />
      </ListItem>
    </>
  );

  const tencentConfigComponent = accessStore.provider ===
    ServiceProvider.Tencent && (
    <>
      <ListItem
        // title={Locale.Settings.Access.Tencent.Endpoint.Title}
        // subTitle={Locale.Settings.Access.Tencent.Endpoint.SubTitle}
        title={t("Settings.Access.Tencent.Endpoint.Title")}
        subTitle={t("Settings.Access.Tencent.Endpoint.SubTitle")}
      >
        <input
          // aria-label={Locale.Settings.Access.Tencent.Endpoint.Title}
          aria-label={t("Settings.Access.Tencent.Endpoint.Title")}
          type="text"
          value={accessStore.tencentUrl}
          placeholder={Tencent.ExampleEndpoint}
          onChange={(e) =>
            accessStore.update(
              (access) => (access.tencentUrl = e.currentTarget.value),
            )
          }
        ></input>
      </ListItem>
      <ListItem
        // title={Locale.Settings.Access.Tencent.ApiKey.Title}
        // subTitle={Locale.Settings.Access.Tencent.ApiKey.SubTitle}
        title={t("Settings.Access.Tencent.ApiKey.Title")}
        subTitle={t("Settings.Access.Tencent.ApiKey.SubTitle")}
      >
        <PasswordInput
          // aria-label={Locale.Settings.Access.Tencent.ApiKey.Title}
          aria-label={t("Settings.Access.Tencent.ApiKey.Title")}
          value={accessStore.tencentSecretId}
          type="text"
          // placeholder={Locale.Settings.Access.Tencent.ApiKey.Placeholder}
          placeholder={t("Settings.Access.Tencent.ApiKey.Placeholder")}
          onChange={(e) => {
            accessStore.update(
              (access) => (access.tencentSecretId = e.currentTarget.value),
            );
          }}
        />
      </ListItem>
      <ListItem
        // title={Locale.Settings.Access.Tencent.SecretKey.Title}
        // subTitle={Locale.Settings.Access.Tencent.SecretKey.SubTitle}
        title={t("Settings.Access.Tencent.SecretKey.Title")}
        subTitle={t("Settings.Access.Tencent.SecretKey.SubTitle")}
      >
        <PasswordInput
          // aria-label={Locale.Settings.Access.Tencent.SecretKey.Title}
          aria-label={t("Settings.Access.Tencent.SecretKey.Title")}
          value={accessStore.tencentSecretKey}
          type="text"
          // placeholder={Locale.Settings.Access.Tencent.SecretKey.Placeholder}
          placeholder={t("Settings.Access.Tencent.SecretKey.Placeholder")}
          onChange={(e) => {
            accessStore.update(
              (access) => (access.tencentSecretKey = e.currentTarget.value),
            );
          }}
        />
      </ListItem>
    </>
  );

  const byteDanceConfigComponent = accessStore.provider ===
    ServiceProvider.ByteDance && (
    <>
      <ListItem
        // title={Locale.Settings.Access.ByteDance.Endpoint.Title}
        title={t("Settings.Access.ByteDance.Endpoint.Title")}
        // subTitle={
        //   Locale.Settings.Access.ByteDance.Endpoint.SubTitle +
        //   ByteDance.ExampleEndpoint
        // }
        subTitle={
          t("Settings.Access.ByteDance.Endpoint.SubTitle") +
          ByteDance.ExampleEndpoint
        }
      >
        <input
          // aria-label={Locale.Settings.Access.ByteDance.Endpoint.Title}
          aria-label={t("Settings.Access.ByteDance.Endpoint.Title")}
          type="text"
          value={accessStore.bytedanceUrl}
          placeholder={ByteDance.ExampleEndpoint}
          onChange={(e) =>
            accessStore.update(
              (access) => (access.bytedanceUrl = e.currentTarget.value),
            )
          }
        ></input>
      </ListItem>
      <ListItem
        // title={Locale.Settings.Access.ByteDance.ApiKey.Title}
        // subTitle={Locale.Settings.Access.ByteDance.ApiKey.SubTitle}
        title={t("Settings.Access.ByteDance.ApiKey.Title")}
        subTitle={t("Settings.Access.ByteDance.ApiKey.SubTitle")}
      >
        <PasswordInput
          // aria-label={Locale.Settings.Access.ByteDance.ApiKey.Title}
          aria-label={t("Settings.Access.ByteDance.ApiKey.Title")}
          value={accessStore.bytedanceApiKey}
          type="text"
          // placeholder={Locale.Settings.Access.ByteDance.ApiKey.Placeholder}
          placeholder={t("Settings.Access.ByteDance.ApiKey.Placeholder")}
          onChange={(e) => {
            accessStore.update(
              (access) => (access.bytedanceApiKey = e.currentTarget.value),
            );
          }}
        />
      </ListItem>
    </>
  );

  const alibabaConfigComponent = accessStore.provider ===
    ServiceProvider.Alibaba && (
    <>
      <ListItem
        // title={Locale.Settings.Access.Alibaba.Endpoint.Title}
        title={t("Settings.Access.Alibaba.Endpoint.Title")}
        // subTitle={
        //   Locale.Settings.Access.Alibaba.Endpoint.SubTitle +
        //   Alibaba.ExampleEndpoint
        // }
        subTitle={
          t("Settings.Access.Alibaba.Endpoint.SubTitle") +
          Alibaba.ExampleEndpoint
        }
      >
        <input
          // aria-label={Locale.Settings.Access.Alibaba.Endpoint.Title}
          aria-label={t("Settings.Access.Alibaba.Endpoint.Title")}
          type="text"
          value={accessStore.alibabaUrl}
          placeholder={Alibaba.ExampleEndpoint}
          onChange={(e) =>
            accessStore.update(
              (access) => (access.alibabaUrl = e.currentTarget.value),
            )
          }
        ></input>
      </ListItem>
      <ListItem
        // title={Locale.Settings.Access.Alibaba.ApiKey.Title}
        // subTitle={Locale.Settings.Access.Alibaba.ApiKey.SubTitle}
        title={t("Settings.Access.Alibaba.ApiKey.Title")}
        subTitle={t("Settings.Access.Alibaba.ApiKey.SubTitle")}
      >
        <PasswordInput
          // aria-label={Locale.Settings.Access.Alibaba.ApiKey.Title}
          aria-label={t("Settings.Access.Alibaba.ApiKey.Title")}
          value={accessStore.alibabaApiKey}
          type="text"
          // placeholder={Locale.Settings.Access.Alibaba.ApiKey.Placeholder}
          placeholder={t("Settings.Access.Alibaba.ApiKey.Placeholder")}
          onChange={(e) => {
            accessStore.update(
              (access) => (access.alibabaApiKey = e.currentTarget.value),
            );
          }}
        />
      </ListItem>
    </>
  );

  const moonshotConfigComponent = accessStore.provider ===
    ServiceProvider.Moonshot && (
    <>
      <ListItem
        // title={Locale.Settings.Access.Moonshot.Endpoint.Title}
        // subTitle={
        //   Locale.Settings.Access.Moonshot.Endpoint.SubTitle +
        //   Moonshot.ExampleEndpoint
        // }
        title={t("Settings.Access.Moonshot.Endpoint.Title")}
        subTitle={
          t("Settings.Access.Moonshot.Endpoint.SubTitle") +
          Moonshot.ExampleEndpoint
        }
      >
        <input
          // aria-label={Locale.Settings.Access.Moonshot.Endpoint.Title}
          aria-label={t("Settings.Access.Moonshot.Endpoint.Title")}
          type="text"
          value={accessStore.moonshotUrl}
          placeholder={Moonshot.ExampleEndpoint}
          onChange={(e) =>
            accessStore.update(
              (access) => (access.moonshotUrl = e.currentTarget.value),
            )
          }
        ></input>
      </ListItem>
      <ListItem
        // title={Locale.Settings.Access.Moonshot.ApiKey.Title}
        // subTitle={Locale.Settings.Access.Moonshot.ApiKey.SubTitle}
        title={t("Settings.Access.Moonshot.ApiKey.Title")}
        subTitle={t("Settings.Access.Moonshot.ApiKey.SubTitle")}
      >
        <PasswordInput
          // aria-label={Locale.Settings.Access.Moonshot.ApiKey.Title}
          aria-label={t("Settings.Access.Moonshot.ApiKey.Title")}
          value={accessStore.moonshotApiKey}
          type="text"
          // placeholder={Locale.Settings.Access.Moonshot.ApiKey.Placeholder}
          placeholder={t("Settings.Access.Moonshot.ApiKey.Placeholder")}
          onChange={(e) => {
            accessStore.update(
              (access) => (access.moonshotApiKey = e.currentTarget.value),
            );
          }}
        />
      </ListItem>
    </>
  );

  const deepseekConfigComponent = accessStore.provider ===
    ServiceProvider.DeepSeek && (
    <>
      <ListItem
        // title={Locale.Settings.Access.DeepSeek.Endpoint.Title}
        // subTitle={
        //   Locale.Settings.Access.DeepSeek.Endpoint.SubTitle +
        //   DeepSeek.ExampleEndpoint
        // }
        title={t("Settings.Access.DeepSeek.Endpoint.Title")}
        subTitle={
          t("Settings.Access.DeepSeek.Endpoint.SubTitle") +
          DeepSeek.ExampleEndpoint
        }
      >
        <input
          // aria-label={Locale.Settings.Access.DeepSeek.Endpoint.Title}
          aria-label={t("Settings.Access.DeepSeek.Endpoint.Title")}
          type="text"
          value={accessStore.deepseekUrl}
          placeholder={DeepSeek.ExampleEndpoint}
          onChange={(e) =>
            accessStore.update(
              (access) => (access.deepseekUrl = e.currentTarget.value),
            )
          }
        ></input>
      </ListItem>
      <ListItem
        // title={Locale.Settings.Access.DeepSeek.ApiKey.Title}
        // subTitle={Locale.Settings.Access.DeepSeek.ApiKey.SubTitle}
        title={t("Settings.Access.DeepSeek.ApiKey.Title")}
        subTitle={t("Settings.Access.DeepSeek.ApiKey.SubTitle")}
      >
        <PasswordInput
          // aria-label={Locale.Settings.Access.DeepSeek.ApiKey.Title}
          aria-label={t("Settings.Access.DeepSeek.ApiKey.Title")}
          value={accessStore.deepseekApiKey}
          type="text"
          // placeholder={Locale.Settings.Access.DeepSeek.ApiKey.Placeholder}
          placeholder={t("Settings.Access.DeepSeek.ApiKey.Placeholder")}
          onChange={(e) => {
            accessStore.update(
              (access) => (access.deepseekApiKey = e.currentTarget.value),
            );
          }}
        />
      </ListItem>
    </>
  );

  const XAIConfigComponent = accessStore.provider === ServiceProvider.XAI && (
    <>
      <ListItem
        // title={Locale.Settings.Access.XAI.Endpoint.Title}
        // subTitle={
        //   Locale.Settings.Access.XAI.Endpoint.SubTitle + XAI.ExampleEndpoint
        // }
        title={t("Settings.Access.XAI.Endpoint.Title")}
        subTitle={
          t("Settings.Access.XAI.Endpoint.SubTitle") + XAI.ExampleEndpoint
        }
      >
        <input
          // aria-label={Locale.Settings.Access.XAI.Endpoint.Title}
          aria-label={t("Settings.Access.XAI.Endpoint.Title")}
          type="text"
          value={accessStore.xaiUrl}
          placeholder={XAI.ExampleEndpoint}
          onChange={(e) =>
            accessStore.update(
              (access) => (access.xaiUrl = e.currentTarget.value),
            )
          }
        ></input>
      </ListItem>
      <ListItem
        // title={Locale.Settings.Access.XAI.ApiKey.Title}
        // subTitle={Locale.Settings.Access.XAI.ApiKey.SubTitle}
        title={t("Settings.Access.XAI.ApiKey.Title")}
        subTitle={t("Settings.Access.XAI.ApiKey.SubTitle")}
      >
        <PasswordInput
          // aria-label={Locale.Settings.Access.XAI.ApiKey.Title}
          aria-label={t("Settings.Access.XAI.ApiKey.Title")}
          value={accessStore.xaiApiKey}
          type="text"
          // placeholder={Locale.Settings.Access.XAI.ApiKey.Placeholder}
          placeholder={t("Settings.Access.XAI.ApiKey.Placeholder")}
          onChange={(e) => {
            accessStore.update(
              (access) => (access.xaiApiKey = e.currentTarget.value),
            );
          }}
        />
      </ListItem>
    </>
  );

  const chatglmConfigComponent = accessStore.provider ===
    ServiceProvider.ChatGLM && (
    <>
      <ListItem
        // title={Locale.Settings.Access.ChatGLM.Endpoint.Title}
        title={t("Settings.Access.ChatGLM.Endpoint.Title")}
        // subTitle={
        //   Locale.Settings.Access.ChatGLM.Endpoint.SubTitle +
        //   ChatGLM.ExampleEndpoint
        // }
        subTitle={
          t("Settings.Access.ChatGLM.Endpoint.SubTitle") +
          ChatGLM.ExampleEndpoint
        }
      >
        <input
          // aria-label={Locale.Settings.Access.ChatGLM.Endpoint.Title}
          aria-label={t("Settings.Access.ChatGLM.Endpoint.Title")}
          type="text"
          value={accessStore.chatglmUrl}
          placeholder={ChatGLM.ExampleEndpoint}
          onChange={(e) =>
            accessStore.update(
              (access) => (access.chatglmUrl = e.currentTarget.value),
            )
          }
        ></input>
      </ListItem>
      <ListItem
        // title={Locale.Settings.Access.ChatGLM.ApiKey.Title}
        // subTitle={Locale.Settings.Access.ChatGLM.ApiKey.SubTitle}
        title={t("Settings.Access.ChatGLM.ApiKey.Title")}
        subTitle={t("Settings.Access.ChatGLM.ApiKey.SubTitle")}
      >
        <PasswordInput
          // aria-label={Locale.Settings.Access.ChatGLM.ApiKey.Title}
          aria-label={t("Settings.Access.ChatGLM.ApiKey.Title")}
          value={accessStore.chatglmApiKey}
          type="text"
          // placeholder={Locale.Settings.Access.ChatGLM.ApiKey.Placeholder}
          placeholder={t("Settings.Access.ChatGLM.ApiKey.Placeholder")}
          onChange={(e) => {
            accessStore.update(
              (access) => (access.chatglmApiKey = e.currentTarget.value),
            );
          }}
        />
      </ListItem>
    </>
  );
  const siliconflowConfigComponent = accessStore.provider ===
    ServiceProvider.SiliconFlow && (
    <>
      <ListItem
        // title={Locale.Settings.Access.SiliconFlow.Endpoint.Title}
        // subTitle={
        //   Locale.Settings.Access.SiliconFlow.Endpoint.SubTitle +
        //   SiliconFlow.ExampleEndpoint
        // }
        title={t("Settings.Access.SiliconFlow.Endpoint.Title")}
        subTitle={
          t("Settings.Access.SiliconFlow.Endpoint.SubTitle") +
          SiliconFlow.ExampleEndpoint
        }
      >
        <input
          // aria-label={Locale.Settings.Access.SiliconFlow.Endpoint.Title}
          aria-label={t("Settings.Access.SiliconFlow.Endpoint.Title")}
          type="text"
          value={accessStore.siliconflowUrl}
          placeholder={SiliconFlow.ExampleEndpoint}
          onChange={(e) =>
            accessStore.update(
              (access) => (access.siliconflowUrl = e.currentTarget.value),
            )
          }
        ></input>
      </ListItem>
      <ListItem
        // title={Locale.Settings.Access.SiliconFlow.ApiKey.Title}
        // subTitle={Locale.Settings.Access.SiliconFlow.ApiKey.SubTitle}
        title={t("Settings.Access.SiliconFlow.ApiKey.Title")}
        subTitle={t("Settings.Access.SiliconFlow.ApiKey.SubTitle")}
      >
        <PasswordInput
          // aria-label={Locale.Settings.Access.SiliconFlow.ApiKey.Title}
          aria-label={t("Settings.Access.SiliconFlow.ApiKey.Title")}
          value={accessStore.siliconflowApiKey}
          type="text"
          // placeholder={Locale.Settings.Access.SiliconFlow.ApiKey.Placeholder}
          placeholder={t("Settings.Access.SiliconFlow.ApiKey.Placeholder")}
          onChange={(e) => {
            accessStore.update(
              (access) => (access.siliconflowApiKey = e.currentTarget.value),
            );
          }}
        />
      </ListItem>
    </>
  );

  const stabilityConfigComponent = accessStore.provider ===
    ServiceProvider.Stability && (
    <>
      <ListItem
        // title={Locale.Settings.Access.Stability.Endpoint.Title}
        // subTitle={
        //   Locale.Settings.Access.Stability.Endpoint.SubTitle +
        //   Stability.ExampleEndpoint
        // }
        title={t("Settings.Access.Stability.Endpoint.Title")}
        subTitle={
          t("Settings.Access.Stability.Endpoint.SubTitle") +
          Stability.ExampleEndpoint
        }
      >
        <input
          // aria-label={Locale.Settings.Access.Stability.Endpoint.Title}
          aria-label={t("Settings.Access.Stability.Endpoint.Title")}
          type="text"
          value={accessStore.stabilityUrl}
          placeholder={Stability.ExampleEndpoint}
          onChange={(e) =>
            accessStore.update(
              (access) => (access.stabilityUrl = e.currentTarget.value),
            )
          }
        ></input>
      </ListItem>
      <ListItem
        // title={Locale.Settings.Access.Stability.ApiKey.Title}
        // subTitle={Locale.Settings.Access.Stability.ApiKey.SubTitle}
        title={t("Settings.Access.Stability.ApiKey.Title")}
        subTitle={t("Settings.Access.Stability.ApiKey.SubTitle")}
      >
        <PasswordInput
          // aria-label={Locale.Settings.Access.Stability.ApiKey.Title}
          aria-label={t("Settings.Access.Stability.ApiKey.Title")}
          value={accessStore.stabilityApiKey}
          type="text"
          // placeholder={Locale.Settings.Access.Stability.ApiKey.Placeholder}
          placeholder={t("Settings.Access.Stability.ApiKey.Placeholder")}
          onChange={(e) => {
            accessStore.update(
              (access) => (access.stabilityApiKey = e.currentTarget.value),
            );
          }}
        />
      </ListItem>
    </>
  );
  const lflytekConfigComponent = accessStore.provider ===
    ServiceProvider.Iflytek && (
    <>
      <ListItem
        // title={Locale.Settings.Access.Iflytek.Endpoint.Title}
        // subTitle={
        //   Locale.Settings.Access.Iflytek.Endpoint.SubTitle +
        //   Iflytek.ExampleEndpoint
        // }
        title={t("Settings.Access.Iflytek.Endpoint.Title")}
        subTitle={
          t("Settings.Access.Iflytek.Endpoint.SubTitle") +
          Iflytek.ExampleEndpoint
        }
      >
        <input
          // aria-label={Locale.Settings.Access.Iflytek.Endpoint.Title}
          aria-label={t("Settings.Access.Iflytek.Endpoint.Title")}
          type="text"
          value={accessStore.iflytekUrl}
          placeholder={Iflytek.ExampleEndpoint}
          onChange={(e) =>
            accessStore.update(
              (access) => (access.iflytekUrl = e.currentTarget.value),
            )
          }
        ></input>
      </ListItem>
      <ListItem
        // title={Locale.Settings.Access.Iflytek.ApiKey.Title}
        // subTitle={Locale.Settings.Access.Iflytek.ApiKey.SubTitle}
        title={t("Settings.Access.Iflytek.ApiKey.Title")}
        subTitle={t("Settings.Access.Iflytek.ApiKey.SubTitle")}
      >
        <PasswordInput
          // aria-label={Locale.Settings.Access.Iflytek.ApiKey.Title}
          aria-label={t("Settings.Access.Iflytek.ApiKey.Title")}
          value={accessStore.iflytekApiKey}
          type="text"
          // placeholder={Locale.Settings.Access.Iflytek.ApiKey.Placeholder}
          placeholder={t("Settings.Access.Iflytek.ApiKey.Placeholder")}
          onChange={(e) => {
            accessStore.update(
              (access) => (access.iflytekApiKey = e.currentTarget.value),
            );
          }}
        />
      </ListItem>

      <ListItem
        // title={Locale.Settings.Access.Iflytek.ApiSecret.Title}
        // subTitle={Locale.Settings.Access.Iflytek.ApiSecret.SubTitle}
        title={t("Settings.Access.Iflytek.ApiSecret.Title")}
        subTitle={t("Settings.Access.Iflytek.ApiSecret.SubTitle")}
      >
        <PasswordInput
          // aria-label={Locale.Settings.Access.Iflytek.ApiSecret.Title}
          aria-label={t("Settings.Access.Iflytek.ApiSecret.Title")}
          value={accessStore.iflytekApiSecret}
          type="text"
          // placeholder={Locale.Settings.Access.Iflytek.ApiSecret.Placeholder}
          placeholder={t("Settings.Access.Iflytek.ApiSecret.Placeholder")}
          onChange={(e) => {
            accessStore.update(
              (access) => (access.iflytekApiSecret = e.currentTarget.value),
            );
          }}
        />
      </ListItem>
    </>
  );

  return (
    <ErrorBoundary>
      <div className="window-header" data-tauri-drag-region>
        <div className="window-header-title">
          <div className="window-header-main-title">
            {/* {Locale.Settings.Title} */}
            {t("Settings.Title")}
          </div>
          <div className="window-header-sub-title">
            {/* {Locale.Settings.SubTitle} */}
            {t("Settings.SubTitle")}
          </div>
        </div>
        <div className="window-actions">
          <div className="window-action-button"></div>
          <div className="window-action-button"></div>
          <div className="window-action-button">
            <IconButton
              // aria={Locale.UI.Close}
              aria={t("UI.Close")}
              icon={<CloseIcon />}
              onClick={() => navigate(Path.Home)}
              bordered
            />
          </div>
        </div>
      </div>
      <div className={styles["settings"]}>
        <List>
          {/* <ListItem title={Locale.Settings.Avatar}> */}
          <ListItem title={t("Settings.Avatar")}>
            <Popover
              onClose={() => setShowEmojiPicker(false)}
              content={
                <AvatarPicker
                  onEmojiClick={(avatar: string) => {
                    updateConfig((config) => (config.avatar = avatar));
                    setShowEmojiPicker(false);
                  }}
                />
              }
              open={showEmojiPicker}
            >
              <div
                // aria-label={Locale.Settings.Avatar}
                aria-label={t("Settings.Avatar")}
                tabIndex={0}
                className={styles.avatar}
                onClick={() => {
                  setShowEmojiPicker(!showEmojiPicker);
                }}
              >
                <Avatar avatar={config.avatar} />
              </div>
            </Popover>
          </ListItem>

          {/* <ListItem
            // title={Locale.Settings.Update.Version(currentVersion ?? "unknown")}
            title={t("Settings.Update.Version", { x: currentVersion ?? "unknown" })}
            subTitle={
              checkingUpdate
                // ? Locale.Settings.Update.IsChecking
                // : hasNewVersion
                // ? Locale.Settings.Update.FoundUpdate(remoteId ?? "ERROR")
                // : Locale.Settings.Update.IsLatest
                ? t("Settings.Update.IsChecking")
: hasNewVersion
? t("Settings.Update.FoundUpdate", { x: remoteId ?? "ERROR" })
: t("Settings.Update.IsLatest")

            }
          >
            {checkingUpdate ? (
              <LoadingIcon />
            ) : hasNewVersion ? (
              clientConfig?.isApp ? (
                <IconButton
                  icon={<ResetIcon></ResetIcon>}
                  // text={Locale.Settings.Update.GoToUpdate}
                  text={t("Settings.Update.GoToUpdate")}
                  onClick={() => clientUpdate()}
                />
              ) : (
                <Link href={updateUrl} target="_blank" className="link">
                  // {Locale.Settings.Update.GoToUpdate}
                  {t("Settings.Update.GoToUpdate")}
                </Link>
              )
            ) : (
              <IconButton
                icon={<ResetIcon></ResetIcon>}
                // text={Locale.Settings.Update.CheckUpdate}
                text={t("Settings.Update.CheckUpdate")}
                onClick={() => checkUpdate(true)}
              />
            )}
          </ListItem> */}

          {/* <ListItem title={Locale.Settings.SendKey}> */}
          <ListItem title={t("Settings.SendKey")}>
            <Select
              // aria-label={Locale.Settings.SendKey}
              aria-label={t("Settings.SendKey")}
              value={config.submitKey}
              onChange={(e) => {
                updateConfig(
                  (config) =>
                    (config.submitKey = e.target.value as any as SubmitKey),
                );
              }}
            >
              {Object.values(SubmitKey).map((v) => (
                <option value={v} key={v}>
                  {v}
                </option>
              ))}
            </Select>
          </ListItem>

          {/* <ListItem title={Locale.Settings.Theme}> */}
          <ListItem title={t("Settings.Theme")}>
            <Select
              // aria-label={Locale.Settings.Theme}
              aria-label={t("Settings.Theme")}
              value={config.theme}
              onChange={(e) => {
                updateConfig(
                  (config) => (config.theme = e.target.value as any as Theme),
                );
              }}
            >
              {Object.values(Theme).map((v) => (
                <option value={v} key={v}>
                  {v}
                </option>
              ))}
            </Select>
          </ListItem>

          {/* <ListItem title={Locale.Settings.Lang.Name}> */}
          <ListItem title={t("Settings.Lang.Name")}>
            <Select
              // aria-label={Locale.Settings.Lang.Name}
              aria-label={t("Settings.Lang.Name")}
              value={omeStore.language}
              onChange={(e) => {
                omeStore.setLanguage(e.target.value as any);
              }}
            >
              {AllLangs.map((lang) => (
                <option value={lang} key={lang}>
                  {ALL_LANG_OPTIONS[lang]}
                </option>
              ))}
            </Select>
          </ListItem>

          <ListItem
            // title={Locale.Settings.FontSize.Title}
            // subTitle={Locale.Settings.FontSize.SubTitle}
            title={t("Settings.FontSize.Title")}
            subTitle={t("Settings.FontSize.SubTitle")}
          >
            <InputRange
              // aria={Locale.Settings.FontSize.Title}
              aria={t("Settings.FontSize.Title")}
              title={`${config.fontSize ?? 14}px`}
              value={config.fontSize}
              min="12"
              max="40"
              step="1"
              onChange={(e) =>
                updateConfig(
                  (config) =>
                    (config.fontSize = Number.parseInt(e.currentTarget.value)),
                )
              }
            ></InputRange>
          </ListItem>

          <ListItem
            // title={Locale.Settings.FontFamily.Title}
            // subTitle={Locale.Settings.FontFamily.SubTitle}
            title={t("Settings.FontFamily.Title")}
            subTitle={t("Settings.FontFamily.SubTitle")}
          >
            <input
              // aria-label={Locale.Settings.FontFamily.Title}
              aria-label={t("Settings.FontFamily.Title")}
              type="text"
              value={config.fontFamily}
              // placeholder={Locale.Settings.FontFamily.Placeholder}
              placeholder={t("Settings.FontFamily.Placeholder")}
              onChange={(e) =>
                updateConfig(
                  (config) => (config.fontFamily = e.currentTarget.value),
                )
              }
            ></input>
          </ListItem>

          <ListItem
            // title={Locale.Settings.AutoGenerateTitle.Title}
            // subTitle={Locale.Settings.AutoGenerateTitle.SubTitle}
            title={t("Settings.AutoGenerateTitle.Title")}
            subTitle={t("Settings.AutoGenerateTitle.SubTitle")}
          >
            <input
              // aria-label={Locale.Settings.AutoGenerateTitle.Title}
              aria-label={t("Settings.AutoGenerateTitle.Title")}
              type="checkbox"
              checked={config.enableAutoGenerateTitle}
              onChange={(e) =>
                updateConfig(
                  (config) =>
                    (config.enableAutoGenerateTitle = e.currentTarget.checked),
                )
              }
            ></input>
          </ListItem>

          <ListItem
            // title={Locale.Settings.SendPreviewBubble.Title}
            // subTitle={Locale.Settings.SendPreviewBubble.SubTitle}
            title={t("Settings.SendPreviewBubble.Title")}
            subTitle={t("Settings.SendPreviewBubble.SubTitle")}
          >
            <input
              // aria-label={Locale.Settings.SendPreviewBubble.Title}
              aria-label={t("Settings.SendPreviewBubble.Title")}
              type="checkbox"
              checked={config.sendPreviewBubble}
              onChange={(e) =>
                updateConfig(
                  (config) =>
                    (config.sendPreviewBubble = e.currentTarget.checked),
                )
              }
            ></input>
          </ListItem>

          <ListItem
            // title={Locale.Mask.Config.Artifacts.Title}
            // subTitle={Locale.Mask.Config.Artifacts.SubTitle}
            title={t("Mask.Config.Artifacts.Title")}
            subTitle={t("Mask.Config.Artifacts.SubTitle")}
          >
            <input
              // aria-label={Locale.Mask.Config.Artifacts.Title}
              aria-label={t("Mask.Config.Artifacts.Title")}
              type="checkbox"
              checked={config.enableArtifacts}
              onChange={(e) =>
                updateConfig(
                  (config) =>
                    (config.enableArtifacts = e.currentTarget.checked),
                )
              }
            ></input>
          </ListItem>
          <ListItem
            // title={Locale.Mask.Config.CodeFold.Title}
            // subTitle={Locale.Mask.Config.CodeFold.SubTitle}
            title={t("Mask.Config.CodeFold.Title")}
            subTitle={t("Mask.Config.CodeFold.SubTitle")}
          >
            <input
              // aria-label={Locale.Mask.Config.CodeFold.Title}
              aria-label={t("Mask.Config.CodeFold.Title")}
              type="checkbox"
              checked={config.enableCodeFold}
              data-testid="enable-code-fold-checkbox"
              onChange={(e) =>
                updateConfig(
                  (config) => (config.enableCodeFold = e.currentTarget.checked),
                )
              }
            ></input>
          </ListItem>
        </List>

        {/* <SyncItems /> */}

        <List>
          <ListItem
            // title={Locale.Settings.Mask.Splash.Title}
            // subTitle={Locale.Settings.Mask.Splash.SubTitle}
            title={t("Settings.Mask.Splash.Title")}
            subTitle={t("Settings.Mask.Splash.SubTitle")}
          >
            <input
              // aria-label={Locale.Settings.Mask.Splash.Title}
              aria-label={t("Settings.Mask.Splash.Title")}
              type="checkbox"
              checked={!config.dontShowMaskSplashScreen}
              onChange={(e) =>
                updateConfig(
                  (config) =>
                    (config.dontShowMaskSplashScreen =
                      !e.currentTarget.checked),
                )
              }
            ></input>
          </ListItem>

          <ListItem
            // title={Locale.Settings.Mask.Builtin.Title}
            // subTitle={Locale.Settings.Mask.Builtin.SubTitle}
            title={t("Settings.Mask.Builtin.Title")}
            subTitle={t("Settings.Mask.Builtin.SubTitle")}
          >
            <input
              // aria-label={Locale.Settings.Mask.Builtin.Title}
              aria-label={t("Settings.Mask.Builtin.Title")}
              type="checkbox"
              checked={config.hideBuiltinMasks}
              onChange={(e) =>
                updateConfig(
                  (config) =>
                    (config.hideBuiltinMasks = e.currentTarget.checked),
                )
              }
            ></input>
          </ListItem>
        </List>

        <List>
          <ListItem
            // title={Locale.Settings.Prompt.Disable.Title}
            // subTitle={Locale.Settings.Prompt.Disable.SubTitle}
            title={t("Settings.Prompt.Disable.Title")}
            subTitle={t("Settings.Prompt.Disable.SubTitle")}
          >
            <input
              // aria-label={Locale.Settings.Prompt.Disable.Title}
              aria-label={t("Settings.Prompt.Disable.Title")}
              type="checkbox"
              checked={config.disablePromptHint}
              onChange={(e) =>
                updateConfig(
                  (config) =>
                    (config.disablePromptHint = e.currentTarget.checked),
                )
              }
            ></input>
          </ListItem>

          <ListItem
            // title={Locale.Settings.Prompt.List}
            // subTitle={Locale.Settings.Prompt.ListCount(
            //   builtinCount,
            //   customCount,
            // )}
            title={t("Settings.Prompt.List")}
            subTitle={t("Settings.Prompt.ListCount", {
              builtin: builtinCount,
              custom: customCount,
            })}
          >
            <IconButton
              // aria={Locale.Settings.Prompt.List + Locale.Settings.Prompt.Edit}
              aria={t("Settings.Prompt.List") + t("Settings.Prompt.Edit")}
              icon={<EditIcon />}
              // text={Locale.Settings.Prompt.Edit}
              text={t("Settings.Prompt.Edit")}
              onClick={() => setShowPromptModal(true)}
            />
          </ListItem>
        </List>

        {/* <List id={SlotID.CustomModel}>
          {saasStartComponent}
          {accessCodeComponent}

          {!accessStore.hideUserApiKey && (
            <>
              {useCustomConfigComponent}

              {accessStore.useCustomConfig && (
                <>
                  <ListItem
                    // title={Locale.Settings.Access.Provider.Title}
                    // subTitle={Locale.Settings.Access.Provider.SubTitle}
                    title={t("Settings.Access.Provider.Title")}
subTitle={t("Settings.Access.Provider.SubTitle")}
                  >
                    <Select
                      // aria-label={Locale.Settings.Access.Provider.Title}
                      aria-label={t("Settings.Access.Provider.Title")}
                      value={accessStore.provider}
                      onChange={(e) => {
                        accessStore.update(
                          (access) =>
                            (access.provider = e.target
                              .value as ServiceProvider),
                        );
                      }}
                    >
                      {Object.entries(ServiceProvider).map(([k, v]) => (
                        <option value={v} key={k}>
                          {k}
                        </option>
                      ))}
                    </Select>
                  </ListItem>

                  {openAIConfigComponent}
                  {azureConfigComponent}
                  {googleConfigComponent}
                  {anthropicConfigComponent}
                  {baiduConfigComponent}
                  {byteDanceConfigComponent}
                  {alibabaConfigComponent}
                  {tencentConfigComponent}
                  {moonshotConfigComponent}
                  {deepseekConfigComponent}
                  {stabilityConfigComponent}
                  {lflytekConfigComponent}
                  {XAIConfigComponent}
                  {chatglmConfigComponent}
                  {siliconflowConfigComponent}
                </>
              )}
            </>
          )}

          {!shouldHideBalanceQuery && !clientConfig?.isApp ? (
            <ListItem
              // title={Locale.Settings.Usage.Title}
              title={t("Settings.Usage.Title")}
              subTitle={
                showUsage
                  ? loadingUsage
                    ? Locale.Settings.Usage.IsChecking
                    : Locale.Settings.Usage.SubTitle(
                        usage?.used ?? "[?]",
                        usage?.subscription ?? "[?]",
                      )
                  : Locale.Settings.Usage.NoAccess
              }
            >
              {!showUsage || loadingUsage ? (
                <div />
              ) : (
                <IconButton
                  icon={<ResetIcon></ResetIcon>}
                  text={Locale.Settings.Usage.Check}
                  onClick={() => checkUsage(true)}
                />
              )}
            </ListItem>
          ) : null}

          <ListItem
            title={Locale.Settings.Access.CustomModel.Title}
            subTitle={Locale.Settings.Access.CustomModel.SubTitle}
            vertical={true}
          >
            <input
              aria-label={Locale.Settings.Access.CustomModel.Title}
              style={{ width: "100%", maxWidth: "unset", textAlign: "left" }}
              type="text"
              value={config.customModels}
              placeholder="model1,model2,model3"
              onChange={(e) =>
                config.update(
                  (config) => (config.customModels = e.currentTarget.value),
                )
              }
            ></input>
          </ListItem>
        </List> */}

        <List>
          <ModelConfigList
            modelConfig={config.modelConfig}
            updateConfig={(updater) => {
              const modelConfig = { ...config.modelConfig };
              updater(modelConfig);
              config.update((config) => (config.modelConfig = modelConfig));
            }}
          />
        </List>

        {shouldShowPromptModal && (
          <UserPromptModal onClose={() => setShowPromptModal(false)} />
        )}
        {/* <List>
          <RealtimeConfigList
            realtimeConfig={config.realtimeConfig}
            updateConfig={(updater) => {
              const realtimeConfig = { ...config.realtimeConfig };
              updater(realtimeConfig);
              config.update(
                (config) => (config.realtimeConfig = realtimeConfig),
              );
            }}
          />
        </List> */}
        {/* <List>
          <TTSConfigList
            ttsConfig={config.ttsConfig}
            updateConfig={(updater) => {
              const ttsConfig = { ...config.ttsConfig };
              updater(ttsConfig);
              config.update((config) => (config.ttsConfig = ttsConfig));
            }}
          />
        </List> */}

        {/* <DangerItems /> */}
      </div>
    </ErrorBoundary>
  );
}
