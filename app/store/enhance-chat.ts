import { nanoid } from "nanoid";
import {
  GetHistory,
  GetItemHistory,
  PostAddOrUpdateSession,
  getHeaders,
} from "../client/smarties";
import { showToast } from "../components/ui-lib";
import { RequestMessage } from "../typing";
import { ConvertSession, JSONParse } from "../utils/convert";
import { createPersistStore } from "../utils/store";
import { ModelType, useAppConfig } from "./config";
import { Mask, createEmptyMask } from "./mask";
import { t } from "i18next";
import { clone, isNil } from "lodash";

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

export const getDefaultTopic = () => {
  return t("Store.DefaultTopic");
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

const defaultSessions: SessionItem[] = [];

const defaultCurrentSession = null as ChatSession | null;

export const useTest = createPersistStore(
  {
    sessions: defaultSessions, // 左边list
    currentSession: defaultCurrentSession, // 选中的session or 新聊天
    isDown: false,
    isLoading: false,
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
        } catch {
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
          const data = await GetItemHistory(await getHeaders(), sessionId);

          const newData: ChatSession = {
            ...data,
            messages: JSONParse(data.messages, "arr"),
            stat: JSONParse(data.stat, "obj"),
            mask: JSONParse(data.mask, "mask"),
          };

          set({
            currentSession: newData,
          });
        } catch {
          set({
            currentSession: null,
          });
        }
      },
      // 创建新聊天(本地)
      createSession: async (mask?: Mask, callback?: () => void) => {
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
          currentSession: session,
        }));
      },
      // 删除聊天
      deleteSession: async () => {},
      // 更新当前聊天
      updateTargetSession: async (updater: (session: ChatSession) => void) => {
        // 1. isAdd = true，左侧list不存在当前，调接口然后给做左侧add
        // 2. 此时左侧有相同的值，把current调整同步到左侧，调用接口

        const currentSession = get().currentSession;

        const sessions = get().sessions;

        if (isNil(currentSession)) return;

        // 判断左侧是否存在
        const hasSessionId = sessions.some(
          (obj) => obj?.sessionId === currentSession?.sessionId,
        );

        updater(currentSession!);

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
                  currentSession: newCurrentSession,
                  sessions: [
                    {
                      ...data,
                      messagesLength: messages.length,
                    },
                    ...sessions,
                  ],
                });
              }
            })
            .catch(() => console.log("更新失败"));
        } else {
          // 如果左侧有一样的聊天item，需要同步 messageLength,tootip,lastupdatetime
          const data = ConvertSession("update", currentSession);

          await PostAddOrUpdateSession(await getHeaders(), data)
            .then((res) => {
              if (res) {
                const newCurrentSession = clone(currentSession);

                const { messages, ...data } = newCurrentSession;

                const index = sessions.findIndex(
                  (item) => item.sessionId === currentSession.sessionId,
                );

                if (index !== -1) {
                  const newSessions = [...sessions];

                  newSessions[index] = {
                    ...data,
                    messagesLength: messages.length,
                  };
                }

                set({
                  currentSession: newCurrentSession,
                  sessions: sessions,
                });
              }
            })
            .catch(() => console.log("更新失败"));
        }
      },
    };

    return methods;
  },
  {
    name: "",
  },
);
