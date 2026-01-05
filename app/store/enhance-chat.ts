import { nanoid } from "nanoid";
import {
  GetHistory,
  GetItemHistory,
  GetQuestionTopic,
  GetQuestionTopicUrl,
  GetRecommendTopics,
  ITopics,
  PostAddOrUpdateSession,
  SourceSystem,
  getHeaders,
} from "../client/smarties";
import { showToast } from "../components/ui-lib";
import { RequestMessage } from "../typing";
import { ConvertSession, JSONParse } from "../utils/convert";
import { createPersistStore } from "../utils/store";
import { ModelConfig, ModelType, useAppConfig } from "./config";
import { Mask, createEmptyMask } from "./mask";
import { t } from "i18next";
import { clone, isEmpty, isNil } from "lodash";
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
  ServiceProvider,
  SUMMARIZE_MODEL,
} from "../constant";
import { useOmeStore } from "./ome";
import { executeMcpAction, getAllTools, isMcpEnabled } from "../mcp/actions";
import { getMessageTextContent, isDalle3, trimTopic } from "../utils";
import { extractMcpJson, isMcpJson } from "../mcp/utils";
import { useAccessStore } from "./access";
import { collectModelsWithDefaultModel } from "../utils/model";
import { estimateTokenLength } from "../utils/token";
import { ChatControllerPool } from "../client/controller";
import { prettyObject } from "../utils/format";
import { indexedDBStorage } from "../utils/indexedDB-storage";

export interface ChatStat {
  tokenCount: number;
  wordCount: number;
  charCount: number;
}

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

// detail
export interface ChatSession {
  sessionId?: number;
  isDeleted?: boolean;
  messagesLength?: number;
  userId?: number;
  isAdd?: boolean;

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

// 提供给左侧List显示
export interface SessionItem {
  sessionId?: number;
  isDeleted?: boolean;
  messagesLength?: number;
  userId?: number;

  id: string;
  topic: string;

  memoryPrompt: string;
  stat: ChatStat;
  lastUpdate: number;
  lastSummarizeIndex: number;
  clearContextIndex?: number | null;

  mask: Mask;
}

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
    lang: useOmeStore.getState().language,
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
    isAdd: true,
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

const defaultSessions: SessionItem[] = [];

const defaultCurrentSession = null as ChatSession | null;

const defaultTopics: ITopics[] = [];

export const useEnhanceChatStore = createPersistStore(
  {
    sessions: defaultSessions, // 左边list
    currentSession: defaultCurrentSession, // 选中的session or 新聊天
    sessionId: 0,
    isDown: false,
    isLoading: false,
    lastInput: "",
    topics: defaultTopics,
  },
  (set, _get) => {
    function get() {
      return {
        ..._get(),
        ...methods,
      };
    }

    const methods = {
      setIsDown: (isDown: boolean) => {
        set({ isDown });
      },
      setIsLoading(isLoading: boolean) {
        set({ isLoading });
      },
      setSessionId(sessionId: number) {
        set({ sessionId });
      },
      setCurrentSession(session: ChatSession | null) {
        set({ currentSession: session });
      },
      setLastInput(lastInput: string) {
        set({
          lastInput,
        });
      },
      setTopics(topics: ITopics[]) {
        set({ topics });
      },

      // 获取左侧聊天List
      getSessions: async () => {
        try {
          set({
            isLoading: true,
          });

          const data = await GetHistory(await getHeaders());
          const newData: SessionItem[] = data.map((item) => ({
            ...item,
            // messages: JSONParse(item.messages, "arr"),
            stat: JSONParse(item.stat, "obj"),
            mask: JSONParse(item.mask, "mask"),
          }));

          set({
            sessions: newData,
            isLoading: false,
          });
        } catch (err) {
          console.log(err, "getSessions");
          set({
            sessions: [],
            isLoading: false,
          });
          showToast("获取聊天失败");
        }
      },
      // 获取详情List
      getCurrentSession: async (sessionId: number) => {
        try {
          get().setSessionId(sessionId);

          get().setCurrentSession(null);

          get().setTopics([]);

          const data = await GetItemHistory(await getHeaders(), sessionId);

          const newData: ChatSession = {
            ...data,
            messages: JSONParse(data.messages, "arr"),
            stat: JSONParse(data.stat, "obj"),
            mask: JSONParse(data.mask, "mask"),
          };

          if (get().sessionId === sessionId) {
            set({
              currentSession: newData,
            });
          }
        } catch {
          console.log("获取失败");

          set({
            currentSession: null,
            sessionId: 0,
          });
        }
      },
      getRecommendTopics: async (sessionId?: number) => {
        try {
          const data = await GetRecommendTopics(
            await getHeaders(),
            useOmeStore.getState().convertLangToEnum(),
            sessionId,
          );

          set({
            topics: data,
          });
        } catch (err) {
          set({
            topics: [],
          });
        }
      },
      // 创建新聊天(本地)
      newSession: async (mask?: Mask, callback?: () => void) => {
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

        set(() => ({
          sessionId: 0,
          currentSession: session,
        }));

        callback?.();
      },
      // 删除聊天
      deleteSession: async (sessionId: number) => {
        const sessions = get().sessions.slice();

        // 找到要删除的 session 的索引
        const index = sessions.findIndex(
          (session) => session.sessionId === sessionId,
        );

        // 如果没找到，直接返回
        if (index === -1) return;

        const deletedSession = sessions[index];

        if (!deletedSession) return;

        sessions.splice(index, 1);

        // 先暂时将sessionId重置

        const restoreState = {
          sessionId,
          sessions: get().sessions.slice(),
        };

        set({
          sessionId: 0,
          sessions,
        });

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
            await PostAddOrUpdateSession(await getHeaders(), {
              sessionId: deletedSession.sessionId,
              id: deletedSession.id,
              isDeleted: true,
            })
              .then(() => {
                const nowCurrentSession = get().currentSession;

                if (
                  deletedSession.sessionId === nowCurrentSession?.sessionId &&
                  !isNil(nowCurrentSession)
                )
                  set({
                    currentSession: null,
                  });
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
        const currentSession = get().currentSession;
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

        const data = ConvertSession("add", newSession);

        await PostAddOrUpdateSession(await getHeaders(), data)
          .then((res) => {
            if (res) {
              newSession.sessionId = res.sessionId;

              const { messages, isAdd, ...data } = newSession;

              set((state) => ({
                sessionId: res.sessionId,
                currentSession: {
                  ...data,
                  messages,
                },
                sessions: [
                  {
                    ...data,
                    messagesLength: messages?.length ?? 0,
                  },
                  ...state.sessions,
                ],
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
        const i = get().sessions.findIndex(
          (i) => i.sessionId === get().sessionId,
        );

        if (i <= -1) {
          return;
        }

        get().getCurrentSession(get().sessions[limit(i + delta)].sessionId!);
      },
      // 更新当前聊天
      updateTargetSession: async (
        updater: (session: ChatSession) => void,
        isUpdate: boolean = false,
        callback?: () => void,
      ) => {
        const currentSession = get().currentSession;

        const sessions = get().sessions;

        if (isNil(currentSession)) return;

        updater(currentSession!);

        callback?.();

        if (isUpdate) {
          // 判断左侧是否存在
          const hasSessionId = sessions.some(
            (obj) => obj?.sessionId === currentSession?.sessionId,
          );

          // 新聊天
          if (currentSession?.isAdd && !hasSessionId) {
            const data = ConvertSession("add", currentSession);

            await PostAddOrUpdateSession(await getHeaders(), data)
              .then((res) => {
                if (res) {
                  const newCurrentSession = clone(currentSession);

                  newCurrentSession.isAdd = false;

                  newCurrentSession.sessionId = res?.sessionId || undefined;

                  const { messages, ...data } = newCurrentSession;

                  set({
                    sessionId: res.sessionId,
                    currentSession: newCurrentSession,
                    sessions: [
                      {
                        ...data,
                        messagesLength: messages.length,
                      },
                      ...sessions,
                    ],
                  });
                  console.log("添加成功");
                }
              })
              .catch(() => console.log("添加失败"));
          } else {
            // 如果左侧有一样的聊天item，需要同步 messageLength,tootip,lastupdatetime

            const newCurrentSession = clone(currentSession);

            const { messages, ...data } = newCurrentSession;

            const index = sessions.findIndex(
              (item) => item.sessionId === currentSession.sessionId,
            );

            if (index <= -1) return;

            const newSessions = [...sessions];

            newSessions[index] = {
              ...data,
              messagesLength: messages.length,
            };

            set({
              currentSession: newCurrentSession,
              sessions: newSessions,
            });

            await PostAddOrUpdateSession(
              await getHeaders(),
              ConvertSession("update", currentSession),
            )
              .then(() => console.log("更新成功"))
              .catch(() => console.log("更新失败"));
          }
        } else {
          set({
            currentSession: currentSession,
          });
        }
      },
      getMemoryPrompt() {
        const session = get().currentSession;

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
      async onNewMessage(message: ChatMessage, targetSession: ChatSession) {
        await get().updateTargetSession((session) => {
          session.lastUpdate = Date.now();
          session.messages = session.messages.concat();
          session.stat.charCount += message.content.length;
        }, true);

        await get().checkMcpJson(message);

        await get().summarizeSession(false, targetSession);
      },
      /** check if the message contains MCP JSON and execute the MCP action */
      async checkMcpJson(message: ChatMessage) {
        const mcpEnabled = isMcpEnabled();
        console.log(mcpEnabled, "mcpEnabled");
        if (!mcpEnabled) return;
        const content = getMessageTextContent(message);
        if (isMcpJson(content)) {
          try {
            const mcpRequest = extractMcpJson(content);
            if (mcpRequest) {
              console.debug("[MCP Request]", mcpRequest);

              await executeMcpAction(mcpRequest.clientId, mcpRequest.mcp)
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
      async summarizeSession(
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
          await api.llm.chat({
            messages: topicMessages,
            config: {
              model,
              stream: false,
              providerName,
            },
            onFinish(message, responseRes) {
              if (responseRes?.status === 200) {
                get().updateTargetSession(
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
            isSummary: true,
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
          await api.llm.chat({
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
                get().updateTargetSession((session) => {
                  session.lastSummarizeIndex = lastSummarizeIndex;
                  session.memoryPrompt = message; // Update the memory prompt for stored it in local storage
                }, true);
              }
            },
            onError(err) {
              console.error("[Summarize] ", err);
            },
            isSummary: true,
          });
        }
      },
      async onUserInput(
        content: string,
        attachImages?: string[],
        isMcpResponse?: boolean,
      ) {
        const session = get().currentSession;
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
        get().updateTargetSession((session) => {
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

        let pendingUpdate = false;
        let rafId: number | null = null;

        // make request
        api.llm.chat({
          messages: sendMessages,
          config: { ...modelConfig, stream: true },
          onUpdate(message) {
            botMessage.streaming = true;
            if (message) {
              botMessage.content = message;
            }
            // get().updateTargetSession((session) => {
            //   session.messages = session.messages.concat();
            // });

            if (!pendingUpdate) {
              pendingUpdate = true;
              rafId = requestAnimationFrame(() => {
                pendingUpdate = false;
                get().updateTargetSession((s) => {
                  const idx = s.messages.findIndex(
                    (m) => m.id === botMessage.id,
                  );
                  if (idx >= 0) {
                    if (s.messages[idx].content !== botMessage.content) {
                      // 🔧 只修改这一行：直接更新属性而不是创建新对象
                      s.messages[idx].content = botMessage.content;
                      s.messages[idx].streaming = botMessage.streaming;
                    }
                  }
                });
              });
            }
          },
          async onFinish(message) {
            // 取消待处理的 RAF
            if (rafId) {
              cancelAnimationFrame(rafId);
              rafId = null;
              pendingUpdate = false;
            }

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
            get().updateTargetSession((s) => {
              const idx = s.messages.findIndex((m) => m.id === botMessage.id);
              if (idx >= 0) {
                // 🔧 直接更新 tools 属性
                s.messages[idx].tools = botMessage.tools;
              }
            });
          },
          onAfterTool(tool: ChatMessageTool) {
            botMessage?.tools?.forEach((t, i, tools) => {
              if (tool.id == t.id) {
                // 🔧 直接修改属性而不是创建新对象
                Object.assign(tools[i], tool);
              }
            });
            get().updateTargetSession((s) => {
              const idx = s.messages.findIndex((m) => m.id === botMessage.id);
              if (idx >= 0) {
                // 🔧 直接更新 tools 属性
                s.messages[idx].tools = botMessage.tools;
              }
            });
          },
          onError(error) {
            if (rafId) {
              cancelAnimationFrame(rafId);
              rafId = null;
              pendingUpdate = false;
            }
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
            get().updateTargetSession((session) => {
              const userIdx = session.messages.findIndex(
                (m) => m.id === userMessage.id,
              );
              const botIdx = session.messages.findIndex(
                (m) => m.id === botMessage.id,
              );

              if (userIdx >= 0) {
                // 🔧 直接修改属性而不是创建新对象
                Object.assign(session.messages[userIdx], userMessage);
              }
              if (botIdx >= 0) {
                Object.assign(session.messages[botIdx], botMessage);
              }
            }, true);
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
        const session = get().currentSession;

        const modelConfig = session?.mask?.modelConfig;
        const clearContextIndex = session?.clearContextIndex ?? 0;
        const messages = session?.messages.slice() ?? [];
        const totalMessageCount = session?.messages?.length ?? 0;

        // in-context prompts
        const contextPrompts = session?.mask?.context.slice() ?? [];

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
      topicClick: async (recommendTopicId: number, callback?: () => void) => {
        try {
          const session = get().currentSession;

          const topic = get().topics.filter(
            (item) => item.id === recommendTopicId,
          );
          if (!session || isEmpty(topic)) return;

          const modelConfig = session.mask.modelConfig;

          let userMessage: ChatMessage = createMessage({
            role: "user",
            content: topic[0].title,
          });

          const botMessage: ChatMessage = createMessage({
            role: "assistant",
            content: topic[0].answer,
            model: modelConfig.model,
          });

          get().updateTargetSession(
            (session) => {
              session.messages = session.messages.concat([
                userMessage,
                botMessage,
              ]);
            },
            true,
            callback,
          );

          const systemSoure = useOmeStore.getState().getSourceSystem();

          GetQuestionTopic(
            await getHeaders(),
            recommendTopicId,
            systemSoure as SourceSystem,
          );
        } catch (err) {
          console.log(err);
        }
      },
      topicUrlClick: async (url: string) => {
        try {
          const systemSoure = useOmeStore.getState().getSourceSystem();

          await GetQuestionTopicUrl(
            await getHeaders(),
            url,
            systemSoure as SourceSystem,
          );
        } catch {}
      },
      clearCurrent: () => {
        set({
          sessions: defaultSessions,
          currentSession: defaultCurrentSession,
          sessionId: 0,
          isDown: false,
          lastInput: "",
          topics: defaultTopics,
        });
      },
      async clearAllData() {
        await indexedDBStorage.clear();
        localStorage.clear();
        location.reload();
      },
    };

    return methods;
  },
  {
    name: "NEW-CHAT-STORE",
    onRehydrateStorage: (state) => {
      state?.clearCurrent();
    },
  },
);
