import { create } from "zustand";
import { persist } from "zustand/middleware";
import { RequestMessage } from "../typing";
import { ModelType } from "./config";
import {
  ChatStat,
  // DEFAULT_TOPIC,
  ModelConfig,
  useAccessStore,
  useAppConfig,
} from ".";
import { Mask, createEmptyMask } from "./mask";
import { ChatControllerPool } from "../client/controller";
import { ClientApi, getClientApi, MultimodalContent } from "../client/api";
import {
  DEEPSEEK_SUMMARIZE_MODEL,
  DEFAULT_INPUT_TEMPLATE,
  DEFAULT_MODELS,
  DEFAULT_SYSTEM_TEMPLATE,
  GEMINI_SUMMARIZE_MODEL,
  KnowledgeCutOffDate,
  MCP_SYSTEM_TEMPLATE,
  MCP_TOOLS_TEMPLATE,
  SUMMARIZE_MODEL,
  ServiceProvider,
} from "../constant";
import { getLang } from "../locales";
import { nanoid } from "nanoid";
import { prettyObject } from "../utils/format";
import { executeMcpAction, getAllTools, isMcpEnabled } from "../mcp/actions";
import { getMessageTextContent, isDalle3, trimTopic } from "../utils";
import { estimateTokenLength } from "../utils/token";
import { collectModelsWithDefaultModel } from "../utils/model";
import { showToast } from "../components/ui-lib";
import { GetHistory, PostAddOrUpdateSession } from "../client/smarties";
import { ConvertSession, JSONParse } from "../utils/convert";
import { extractMcpJson, isMcpJson } from "../mcp/utils";
import { isEmpty } from "lodash-es";
import { t } from "i18next";

export type ChatMessageTool = {
  id: string;
  index?: number;
  type?: string;
  function?: {
    name: string;
    arguments?: string;
  };
  content?: string;
  isError?: boolean;
  errorMsg?: string;
};

export type ChatMessage = RequestMessage & {
  date: string;
  streaming?: boolean;
  isError?: boolean;
  id: string;
  model?: ModelType;
  tools?: ChatMessageTool[];
  audio_url?: string;
  isMcpResponse?: boolean;
};

export interface ChatSession {
  sessionId?: number;
  isDeleted?: boolean;

  id: string;
  topic: string;

  memoryPrompt: string;
  messages: ChatMessage[];
  stat: ChatStat;
  lastUpdate: number;
  lastSummarizeIndex: number;
  clearContextIndex?: number | null;

  mask: Mask;
}

export type ChatStoreType = {
  currentSessionIndex: number;
  sessions: ChatSession[];
  lastInput: string;
  isDown: boolean;
  isLoading: boolean;
  selectSession: (i: number) => void;
  getSession: () => Promise<void>;
  getCurrentSession: () => ChatSession;
  clearCurrent: () => void;
  onUserInput(
    content: string,
    attachImages?: string[],
    isMcpResponse?: boolean,
  ): Promise<void>;
  getMessagesWithMemory(): Promise<ChatMessage[]>;
  onNewMessage(message: ChatMessage, targetSession: ChatSession): void;
  updateTargetSession(
    targetSession: ChatSession,
    updater: (session: ChatSession) => void,
    isUpdate?: boolean,
  ): void;
  getMemoryPrompt(): ChatMessage | undefined;
  setLastInput(lastInput: string): void;
  summarizeSession(
    refreshTitle: boolean | undefined,
    targetSession: ChatSession,
  ): void;
  deleteSession(index: number): void;
  forkSession(): void;
  nextSession(delta: number): void;
  newSession(mask?: Mask, callback?: () => void): void;
  updateStat(message: ChatMessage, session: ChatSession): void;
  checkMcpJson(message: ChatMessage): void;
  clearAllData(): void;
  setIsDown: (isDown: boolean) => void;
};

export function createMessage(override: Partial<ChatMessage>): ChatMessage {
  return {
    id: nanoid(),
    date: new Date().toLocaleString(),
    role: "user",
    content: "",
    ...override,
  };
}

function fillTemplateWith(input: string, modelConfig: ModelConfig) {
  const cutoff =
    KnowledgeCutOffDate[modelConfig.model] ?? KnowledgeCutOffDate.default;
  // Find the model in the DEFAULT_MODELS array that matches the modelConfig.model
  const modelInfo = DEFAULT_MODELS.find((m) => m.name === modelConfig.model);

  var serviceProvider = "OpenAI";
  if (modelInfo) {
    // TODO: auto detect the providerName from the modelConfig.model

    // Directly use the providerName from the modelInfo
    serviceProvider = modelInfo.provider.providerName;
  }

  const vars = {
    ServiceProvider: serviceProvider,
    cutoff,
    model: modelConfig.model,
    time: new Date().toString(),
    lang: getLang(),
    input: input,
  };

  let output = modelConfig.template ?? DEFAULT_INPUT_TEMPLATE;

  // remove duplicate
  if (input.startsWith(output)) {
    output = "";
  }

  // must contains {{input}}
  const inputVar = "{{input}}";
  if (!output.includes(inputVar)) {
    output += "\n" + inputVar;
  }

  Object.entries(vars).forEach(([name, value]) => {
    const regex = new RegExp(`{{${name}}}`, "g");
    output = output.replace(regex, value.toString()); // Ensure value is a string
  });

  return output;
}

async function getMcpSystemPrompt(): Promise<string> {
  const tools = await getAllTools();

  let toolsStr = "";

  tools.forEach((i) => {
    // error client has no tools
    if (!i.tools) return;

    toolsStr += MCP_TOOLS_TEMPLATE.replace(
      "{{ clientId }}",
      i.clientId,
    ).replace(
      "{{ tools }}",
      i.tools.tools.map((p: object) => JSON.stringify(p, null, 2)).join("\n"),
    );
  });

  return MCP_SYSTEM_TEMPLATE.replace("{{ MCP_TOOLS }}", toolsStr);
}

function countMessages(msgs: ChatMessage[]) {
  return msgs.reduce(
    (pre, cur) => pre + estimateTokenLength(getMessageTextContent(cur)),
    0,
  );
}

export const getDefaultTopic = () => {
  return t("Store.DefaultTopic");
};

export const getBotHello = (): ChatMessage => {
  return createMessage({
    role: "assistant",
    content: t("Store.BotHello"),
  });
};

function createEmptySession(): ChatSession {
  return {
    id: nanoid(),
    // topic: DEFAULT_TOPIC,
    topic: getDefaultTopic(),
    memoryPrompt: "",
    messages: [],
    stat: {
      tokenCount: 0,
      wordCount: 0,
      charCount: 0,
    },
    lastUpdate: Date.now(),
    lastSummarizeIndex: 0,

    mask: createEmptyMask(),
  };
}

function getSummarizeModel(
  currentModel: string,
  providerName: string,
): string[] {
  // if it is using gpt-* models, force to use 4o-mini to summarize
  if (currentModel.startsWith("gpt") || currentModel.startsWith("chatgpt")) {
    const configStore = useAppConfig.getState();
    const accessStore = useAccessStore.getState();
    const allModel = collectModelsWithDefaultModel(
      configStore.models,
      [configStore.customModels, accessStore.customModels].join(","),
      accessStore.defaultModel,
    );
    const summarizeModel = allModel.find(
      (m) => m.name === SUMMARIZE_MODEL && m.available,
    );
    if (summarizeModel) {
      return [
        summarizeModel.name,
        summarizeModel.provider?.providerName as string,
      ];
    }
  }
  if (currentModel.startsWith("gemini")) {
    return [GEMINI_SUMMARIZE_MODEL, ServiceProvider.Google];
  } else if (currentModel.startsWith("deepseek-")) {
    return [DEEPSEEK_SUMMARIZE_MODEL, ServiceProvider.DeepSeek];
  }

  return [currentModel, providerName];
}

export const useNewChatStore = create<ChatStoreType>()(
  persist(
    (set, get) => ({
      currentSessionIndex: -1,
      sessions: [],
      lastInput: "",
      isDown: false,
      isReady: false,
      setIsDown: (isDown: boolean) => {
        set({ isDown });
      },
      isLoading: false,
      selectSession: (i: number) => {
        set({ currentSessionIndex: i });
      },

      getSession: async () => {
        try {
          set({
            isLoading: true,
          });

          const data = await GetHistory(
            useAppConfig.getState().omeToken,
            useAppConfig.getState().omeUserId,
            useAppConfig.getState().omeUserName,
            useAppConfig.getState().omelinkUserId,
          );
          const newData: ChatSession[] = data.map((item) => ({
            ...item,
            messages: JSONParse(item.messages, "arr"),
            stat: JSONParse(item.stat, "obj"),
            mask: JSONParse(item.mask, "mask"),
          }));
          set({
            sessions: newData,
            isLoading: false,
          });
        } catch {
          set({
            sessions: [],
            isLoading: false,
          });
          showToast("获取聊天失败");
        }
      },

      setIsLoading(isLoading: boolean) {
        set({ isLoading });
      },

      getCurrentSession: () => {
        return get().sessions[get().currentSessionIndex];
      },

      clearCurrent: () => {
        set({
          currentSessionIndex: -1,
          sessions: [],
          isDown: false,
          isLoading: false,
        });
      },

      onNewMessage(message: ChatMessage, targetSession: ChatSession) {
        get().updateTargetSession(
          targetSession,
          (session) => {
            session.lastUpdate = Date.now();
            session.messages = session.messages.concat();
            session.stat.charCount += message.content.length;
          },
          true,
        );

        get().checkMcpJson(message);

        get().summarizeSession(false, targetSession);
      },
      /** check if the message contains MCP JSON and execute the MCP action */
      checkMcpJson(message: ChatMessage) {
        const mcpEnabled = isMcpEnabled();
        console.log(mcpEnabled, "mcpEnabled");
        if (!mcpEnabled) return;
        const content = getMessageTextContent(message);
        if (isMcpJson(content)) {
          try {
            const mcpRequest = extractMcpJson(content);
            if (mcpRequest) {
              console.debug("[MCP Request]", mcpRequest);

              executeMcpAction(mcpRequest.clientId, mcpRequest.mcp)
                .then((result) => {
                  console.log("[MCP Response]", result);
                  const mcpResponse =
                    typeof result === "object"
                      ? JSON.stringify(result)
                      : String(result);
                  get().onUserInput(
                    `\`\`\`json:mcp-response:${mcpRequest.clientId}\n${mcpResponse}\n\`\`\``,
                    [],
                    true,
                  );
                })
                .catch((error) => showToast("MCP execution failed", error));
            }
          } catch (error) {
            console.error("[Check MCP JSON]", error);
          }
        }
      },
      updateStat(message: ChatMessage, session: ChatSession) {
        get().updateTargetSession(session, (session) => {
          session.stat.charCount += message.content.length;
          // TODO: should update chat count and word count
        });
      },
      async onUserInput(
        content: string,
        attachImages?: string[],
        isMcpResponse?: boolean,
      ) {
        const session = get().getCurrentSession();
        if (!session) return;

        const modelConfig = session.mask.modelConfig;

        // MCP Response no need to fill template
        let mContent: string | MultimodalContent[] = isMcpResponse
          ? content
          : fillTemplateWith(content, modelConfig);

        if (!isMcpResponse && attachImages && attachImages.length > 0) {
          mContent = [
            ...(content ? [{ type: "text" as const, text: content }] : []),
            ...attachImages.map((url) => ({
              type: "image_url" as const,
              image_url: { url },
            })),
          ];
        }

        let userMessage: ChatMessage = createMessage({
          role: "user",
          content: mContent,
          isMcpResponse,
        });

        const botMessage: ChatMessage = createMessage({
          role: "assistant",
          streaming: true,
          model: modelConfig.model,
        });

        // get recent messages
        const recentMessages = await get().getMessagesWithMemory();
        const sendMessages = recentMessages.concat(userMessage);
        const messageIndex = session.messages.length + 1;

        // save user's and bot's message
        get().updateTargetSession(session, (session) => {
          const savedUserMessage = {
            ...userMessage,
            content: mContent,
          };
          session.messages = session.messages.concat([
            savedUserMessage,
            botMessage,
          ]);
        });

        const api: ClientApi = getClientApi(modelConfig.providerName);
        // make request
        api.llm.chat({
          messages: sendMessages,
          config: { ...modelConfig, stream: true },
          onUpdate(message) {
            botMessage.streaming = true;
            if (message) {
              botMessage.content = message;
            }
            get().updateTargetSession(session, (session) => {
              session.messages = session.messages.concat();
            });
          },
          async onFinish(message) {
            botMessage.streaming = false;
            if (message) {
              botMessage.content = message;
              botMessage.date = new Date().toLocaleString();
              get().onNewMessage(botMessage, session);
            }
            ChatControllerPool.remove(session.id, botMessage.id);
          },
          onBeforeTool(tool: ChatMessageTool) {
            (botMessage.tools = botMessage?.tools || []).push(tool);
            get().updateTargetSession(session, (session) => {
              session.messages = session.messages.concat();
            });
          },
          onAfterTool(tool: ChatMessageTool) {
            botMessage?.tools?.forEach((t, i, tools) => {
              if (tool.id == t.id) {
                tools[i] = { ...tool };
              }
            });
            get().updateTargetSession(session, (session) => {
              session.messages = session.messages.concat();
            });
          },
          onError(error) {
            const isAborted = error.message?.includes?.("aborted");
            botMessage.content +=
              "\n\n" +
              prettyObject({
                error: true,
                message: error.message,
              });
            botMessage.streaming = false;
            userMessage.isError = !isAborted;
            botMessage.isError = !isAborted;
            get().updateTargetSession(
              session,
              (session) => {
                session.messages = session.messages.concat();
              },
              true,
            );
            ChatControllerPool.remove(
              session.id,
              botMessage.id ?? messageIndex,
            );

            console.error("[Chat] failed ", error);
          },
          onController(controller) {
            // collect controller for stop/retry
            ChatControllerPool.addController(
              session.id,
              botMessage.id ?? messageIndex,
              controller,
            );
          },
        });
      },
      async getMessagesWithMemory() {
        const session = get().getCurrentSession();

        const modelConfig = session?.mask?.modelConfig;
        const clearContextIndex = session?.clearContextIndex ?? 0;
        const messages = session?.messages.slice();
        const totalMessageCount = session?.messages?.length ?? 0;

        // in-context prompts
        const contextPrompts = session?.mask?.context.slice();

        // system prompts, to get close to OpenAI Web ChatGPT
        const shouldInjectSystemPrompts =
          modelConfig?.enableInjectSystemPrompts &&
          (session?.mask?.modelConfig?.model.startsWith("gpt-") ||
            session?.mask?.modelConfig?.model.startsWith("chatgpt-"));

        const mcpEnabled = (await isMcpEnabled()) ?? false;
        const mcpSystemPrompt = mcpEnabled ? await getMcpSystemPrompt() : "";

        var systemPrompts: ChatMessage[] = [];

        if (shouldInjectSystemPrompts) {
          systemPrompts = [
            createMessage({
              role: "system",
              content:
                fillTemplateWith("", {
                  ...modelConfig,
                  template: DEFAULT_SYSTEM_TEMPLATE,
                }) + mcpSystemPrompt,
            }),
          ];
        } else if (mcpEnabled) {
          systemPrompts = [
            createMessage({
              role: "system",
              content: mcpSystemPrompt,
            }),
          ];
        }

        if (shouldInjectSystemPrompts || mcpEnabled) {
          console.log(
            "[Global System Prompt] ",
            systemPrompts.at(0)?.content ?? "empty",
          );
        }
        const memoryPrompt = get().getMemoryPrompt();
        // long term memory
        const shouldSendLongTermMemory =
          modelConfig?.sendMemory &&
          session?.memoryPrompt &&
          session?.memoryPrompt.length > 0 &&
          session?.lastSummarizeIndex > clearContextIndex;
        const longTermMemoryPrompts =
          shouldSendLongTermMemory && memoryPrompt ? [memoryPrompt] : [];
        const longTermMemoryStartIndex = session?.lastSummarizeIndex;

        // short term memory
        const shortTermMemoryStartIndex = Math.max(
          0,
          totalMessageCount - (modelConfig?.historyMessageCount ?? 0),
        );

        // lets concat send messages, including 4 parts:
        // 0. system prompt: to get close to OpenAI Web ChatGPT
        // 1. long term memory: summarized memory messages
        // 2. pre-defined in-context prompts
        // 3. short term memory: latest n messages
        // 4. newest input message
        const memoryStartIndex = shouldSendLongTermMemory
          ? Math.min(longTermMemoryStartIndex ?? 0, shortTermMemoryStartIndex)
          : shortTermMemoryStartIndex;
        // and if user has cleared history messages, we should exclude the memory too.
        const contextStartIndex = Math.max(clearContextIndex, memoryStartIndex);
        const maxTokenThreshold = modelConfig?.max_tokens ?? 0;

        // get recent messages as much as possible
        const reversedRecentMessages = [];
        for (
          let i = totalMessageCount - 1, tokenCount = 0;
          i >= contextStartIndex && tokenCount < maxTokenThreshold;
          i -= 1
        ) {
          const msg = messages ? messages[i] : undefined;
          if (!msg || msg.isError) continue;
          tokenCount += estimateTokenLength(getMessageTextContent(msg));
          reversedRecentMessages.push(msg);
        }
        // concat all messages
        const recentMessages = [
          ...systemPrompts,
          ...longTermMemoryPrompts,
          ...contextPrompts,
          ...reversedRecentMessages.reverse(),
        ];

        return recentMessages;
      },
      getMemoryPrompt() {
        const session = get().getCurrentSession();

        if (session?.memoryPrompt?.length) {
          return {
            role: "system",
            // content: Locale.Store.Prompt.History(session.memoryPrompt),
            content: t("Store.Prompt.History", {
              content: session.memoryPrompt,
            }),
            date: "",
          } as ChatMessage;
        }
      },
      async updateTargetSession(
        targetSession: ChatSession,
        updater: (session: ChatSession) => void,
        isUpdate: boolean = false,
      ) {
        const sessions = get().sessions;
        const index = sessions.findIndex((s) => s.id === targetSession.id);
        if (index < 0) return;
        updater(sessions[index]);

        if (isUpdate) {
          const data = ConvertSession("update", sessions[index]);

          if (
            !isEmpty(data.messages) &&
            !isEmpty(data.mask) &&
            !isEmpty(data.stat)
          ) {
            set(() => ({ sessions }));

            const config = useAppConfig.getState();
            await PostAddOrUpdateSession(
              config.omeToken,
              config.omeUserId,
              config.omeUserName,
              config.omelinkUserId,
              ConvertSession("update", sessions[index]),
            )
              .then(() => console.log("更新成功"))
              .catch(() => console.log("更新失败"));
          }
        } else {
          set(() => ({ sessions }));
        }
      },
      setLastInput(lastInput: string) {
        set({
          lastInput,
        });
      },
      summarizeSession(
        refreshTitle: boolean = false,
        targetSession: ChatSession,
      ) {
        const config = useAppConfig.getState();
        const session = targetSession;
        const modelConfig = session.mask.modelConfig;
        // skip summarize when using dalle3?
        if (isDalle3(modelConfig.model)) {
          return;
        }

        // if not config compressModel, then using getSummarizeModel
        const [model, providerName] = modelConfig.compressModel
          ? [modelConfig.compressModel, modelConfig.compressProviderName]
          : getSummarizeModel(
              session.mask.modelConfig.model,
              session.mask.modelConfig.providerName,
            );
        const api: ClientApi = getClientApi(providerName as ServiceProvider);

        // remove error messages if any
        const messages = session.messages;

        // should summarize topic after chating more than 50 words
        const SUMMARIZE_MIN_LEN = 50;
        if (
          (config.enableAutoGenerateTitle &&
            // session.topic === DEFAULT_TOPIC &&
            session.topic === getDefaultTopic() &&
            countMessages(messages) >= SUMMARIZE_MIN_LEN) ||
          refreshTitle
        ) {
          const startIndex = Math.max(
            0,
            messages.length - modelConfig.historyMessageCount,
          );
          const topicMessages = messages
            .slice(
              startIndex < messages.length ? startIndex : messages.length - 1,
              messages.length,
            )
            .concat(
              createMessage({
                role: "user",
                // content: Locale.Store.Prompt.Topic,
                content: t("Store.Prompt.Topic"),
              }),
            );
          api.llm.chat({
            messages: topicMessages,
            config: {
              model,
              stream: false,
              providerName,
            },
            onFinish(message, responseRes) {
              if (responseRes?.status === 200) {
                get().updateTargetSession(
                  session,
                  (session) =>
                    (session.topic =
                      // message.length > 0 ? trimTopic(message) : DEFAULT_TOPIC),
                      message.length > 0
                        ? trimTopic(message)
                        : getDefaultTopic()),
                  true,
                );
              }
            },
          });
        }
        const summarizeIndex = Math.max(
          session.lastSummarizeIndex,
          session.clearContextIndex ?? 0,
        );
        let toBeSummarizedMsgs = messages
          .filter((msg) => !msg.isError)
          .slice(summarizeIndex);

        const historyMsgLength = countMessages(toBeSummarizedMsgs);

        if (historyMsgLength > (modelConfig?.max_tokens || 4000)) {
          const n = toBeSummarizedMsgs.length;
          toBeSummarizedMsgs = toBeSummarizedMsgs.slice(
            Math.max(0, n - modelConfig.historyMessageCount),
          );
        }
        const memoryPrompt = get().getMemoryPrompt();
        if (memoryPrompt) {
          // add memory prompt
          toBeSummarizedMsgs.unshift(memoryPrompt);
        }

        const lastSummarizeIndex = session.messages.length;

        console.log(
          "[Chat History] ",
          toBeSummarizedMsgs,
          historyMsgLength,
          modelConfig.compressMessageLengthThreshold,
        );

        if (
          historyMsgLength > modelConfig.compressMessageLengthThreshold &&
          modelConfig.sendMemory
        ) {
          /** Destruct max_tokens while summarizing
           * this param is just shit
           **/
          const { max_tokens, ...modelcfg } = modelConfig;
          api.llm.chat({
            messages: toBeSummarizedMsgs.concat(
              createMessage({
                role: "system",
                // content: Locale.Store.Prompt.Summarize,
                content: t("Store.Prompt.Summarize"),
                date: "",
              }),
            ),
            config: {
              ...modelcfg,
              stream: true,
              model,
              providerName,
            },
            onUpdate(message) {
              session.memoryPrompt = message;
            },
            onFinish(message, responseRes) {
              if (responseRes?.status === 200) {
                console.log("[Memory] ", message);
                get().updateTargetSession(
                  session,
                  (session) => {
                    session.lastSummarizeIndex = lastSummarizeIndex;
                    session.memoryPrompt = message; // Update the memory prompt for stored it in local storage
                  },
                  true,
                );
              }
            },
            onError(err) {
              console.error("[Summarize] ", err);
            },
          });
        }
      },
      deleteSession(index: number) {
        const deletingLastSession = get().sessions.length === 1;
        const deletedSession = get().sessions.at(index);

        if (!deletedSession) return;

        const sessions = get().sessions.slice();
        sessions.splice(index, 1);

        const currentIndex = get().currentSessionIndex;
        let nextIndex = Math.min(
          currentIndex - Number(index < currentIndex),
          sessions.length - 1,
        );

        if (deletingLastSession) {
          nextIndex = -1;
          // sessions.push(createEmptySession());
        }

        // for undo delete action
        const restoreState = {
          currentSessionIndex: get().currentSessionIndex,
          sessions: get().sessions.slice(),
        };

        set(() => ({
          currentSessionIndex: nextIndex,
          sessions,
        }));

        showToast(
          // Locale.Home.DeleteToast,
          t("Home.DeleteToast"),
          {
            // text: Locale.Home.Revert,
            text: t("Home.Revert"),
            onClick() {
              set(() => restoreState);
            },
          },
          5000,
          async () => {
            const data = ConvertSession("delete", deletedSession);

            await PostAddOrUpdateSession(
              useAppConfig.getState().omeToken,
              useAppConfig.getState().omeUserId,
              useAppConfig.getState().omeUserName,
              useAppConfig.getState().omelinkUserId,
              data,
            )
              .then(() => {
                console.log("delete成功");
              })
              .catch(() => {
                console.log("delete失败");
                showToast("删除聊天失败");
                set(() => restoreState);
              });
          },
        );
      },
      async forkSession() {
        // 获取当前会话
        const currentSession = get().getCurrentSession();
        if (!currentSession) return;

        const newSession = createEmptySession();

        newSession.topic = currentSession.topic;
        // 深拷贝消息
        newSession.messages = currentSession.messages.map((msg) => ({
          ...msg,
          id: nanoid(), // 生成新的消息 ID
        }));
        newSession.mask = {
          ...currentSession.mask,
          modelConfig: {
            ...currentSession.mask.modelConfig,
          },
        };

        const config = useAppConfig.getState();

        const data = ConvertSession("add", newSession);

        await PostAddOrUpdateSession(
          config.omeToken,
          config.omeUserId,
          config.omeUserName,
          config.omelinkUserId,
          data,
        )
          .then((res) => {
            if (res) {
              newSession.sessionId = res.sessionId;

              set((state) => ({
                currentSessionIndex: 0,
                sessions: [newSession, ...state.sessions],
              }));
            }
          })
          .catch(() => {
            console.log("失败");
            showToast("复制聊天失败");
          });
      },
      nextSession(delta: number) {
        const n = get().sessions.length;
        const limit = (x: number) => (x + n) % n;
        const i = get().currentSessionIndex;
        get().selectSession(limit(i + delta));
      },
      async newSession(mask?: Mask, callback?: () => void) {
        const session = createEmptySession();

        if (mask) {
          const config = useAppConfig.getState();
          const globalModelConfig = config.modelConfig;

          session.mask = {
            ...mask,
            modelConfig: {
              ...globalModelConfig,
              ...mask.modelConfig,
            },
          };
          session.topic = mask.name;
        }

        const data = ConvertSession("add", session);

        await PostAddOrUpdateSession(
          useAppConfig.getState().omeToken,
          useAppConfig.getState().omeUserId,
          useAppConfig.getState().omeUserName,
          useAppConfig.getState().omelinkUserId,
          data,
        )
          .then((res) => {
            if (res) {
              session.sessionId = res.sessionId;

              session.clearContextIndex = res.clearContextIndex;

              set((state) => ({
                currentSessionIndex: 0,
                sessions: [session].concat(state.sessions),
              }));
            }

            callback && callback();
          })
          .catch(() => {
            console.log("失败");
            showToast("创建新聊天失败");
          });
      },
      clearAllData() {
        localStorage.clear();
        location.reload();
      },
    }),
    {
      name: "CHAT_STORE",
      // storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        state?.clearCurrent();
      },
    },
  ),
);
