import { create } from "zustand";
import { persist } from "zustand/middleware";
import { RequestMessage } from "../typing";
import { ModelType } from "./config";
import { ChatStat, ModelConfig } from ".";
import { Mask } from "./mask";
import { ChatControllerPool } from "../client/controller";
import { ClientApi, getClientApi, MultimodalContent } from "../client/api";
import {
  DEFAULT_INPUT_TEMPLATE,
  DEFAULT_MODELS,
  DEFAULT_SYSTEM_TEMPLATE,
  KnowledgeCutOffDate,
  MCP_SYSTEM_TEMPLATE,
  MCP_TOOLS_TEMPLATE,
} from "../constant";
import Locale, { getLang } from "../locales";
import { nanoid } from "nanoid";
import { prettyObject } from "../utils/format";
import { getAllTools, isMcpEnabled } from "../mcp/actions";
import { getMessageTextContent } from "../utils";
import { estimateTokenLength } from "../utils/token";

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
  id: string;
  topic: string;

  memoryPrompt: string;
  messages: ChatMessage[];
  stat: ChatStat;
  lastUpdate: number;
  lastSummarizeIndex: number;
  clearContextIndex?: number;

  mask: Mask;
}

export type ChatStoreType = {
  currentSessionIndex: number;
  sessions: ChatSession[];
  message: ChatMessage[];
  selectSession: (i: number) => void;
  getSession: () => Promise<void>;
  getCurrentMessage: (i: number) => Promise<void>;
  getCurrentSession: (i: number) => ChatSession | null;
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
  ): void;
  getMemoryPrompt(): ChatMessage | undefined;
  onUserInput(
    content: string,
    attachImages?: string[],
    isMcpResponse?: boolean,
  ): Promise<void>;
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

export const newChatStore = create<ChatStoreType>()(
  persist(
    (set, get) => ({
      currentSessionIndex: -1,
      sessions: [],
      message: [],
      selectSession: (i: number) => {
        set({ currentSessionIndex: i });
      },
      getSession: async () => {
        set({
          sessions: data,
        });
      },
      getCurrentMessage: async (i: number) => {
        if (i >= 0) {
          console.log("getCurrentMessage", data[i].messages);

          set({
            message: data[i].messages,
          });
        } else {
          set({
            message: [],
          });
        }
      },
      getCurrentSession: (i: number) => {
        if (i >= 0) {
          return get().sessions[i];
        }

        return null;
      },
      clearCurrent: () => {
        set({ currentSessionIndex: -1 });
      },
      onNewMessage(message: ChatMessage, targetSession: ChatSession) {
        set({
          message: get().message.concat(),
        });
        get().updateTargetSession(targetSession, (session) => {
          session.lastUpdate = Date.now();
        });

        // get().updateStat(message, targetSession);

        // get().checkMcpJson(message);

        // get().summarizeSession(false, targetSession);
      },
      async onUserInput(
        content: string,
        attachImages?: string[],
        isMcpResponse?: boolean,
      ) {
        const session = get().getCurrentSession(get().currentSessionIndex);
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
        // get().updateTargetSession(session, (session) => {
        //   const savedUserMessage = {
        //     ...userMessage,
        //     content: mContent,
        //   };
        //   session.messages = session.messages.concat([
        //     savedUserMessage,
        //     botMessage,
        //   ]);
        // });

        const savedUserMessage = {
          ...userMessage,
          content: mContent,
        };

        set({
          message: get().message.concat([savedUserMessage, botMessage]),
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
            // get().updateTargetSession(session, (session) => {
            //   session.messages = session.messages.concat();
            // });

            set({
              message: get().message.concat(),
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
            set({
              message: get().message.concat(),
            });
          },
          onAfterTool(tool: ChatMessageTool) {
            botMessage?.tools?.forEach((t, i, tools) => {
              if (tool.id == t.id) {
                tools[i] = { ...tool };
              }
            });
            // get().updateTargetSession(session, (session) => {
            //   session.messages = session.messages.concat();
            // });
            set({
              message: get().message.concat(),
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
            get().updateTargetSession(session, (session) => {
              session.messages = session.messages.concat();
            });
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
        const session = get().getCurrentSession(get().currentSessionIndex);

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

        const mcpEnabled = await isMcpEnabled();
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
        const session = get().getCurrentSession(get().currentSessionIndex);

        if (session?.memoryPrompt?.length) {
          return {
            role: "system",
            content: Locale.Store.Prompt.History(session.memoryPrompt),
            date: "",
          } as ChatMessage;
        }
      },
      updateTargetSession(
        targetSession: ChatSession,
        updater: (session: ChatSession) => void,
      ) {
        const sessions = get().sessions;
        const index = sessions.findIndex((s) => s.id === targetSession.id);
        if (index < 0) return;
        updater(sessions[index]);
        set(() => ({ sessions }));
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

const data: ChatSession[] = [
  {
    id: "OQUqwpaDpcLuTl63N0AWD",
    topic: "新的聊天",
    memoryPrompt: "",
    messages: [],
    stat: {
      tokenCount: 0,
      wordCount: 0,
      charCount: 1360,
    },
    lastUpdate: 1740465702082,
    lastSummarizeIndex: 0,
    mask: {
      id: "xynUrxn49IouorL-Imfm-",
      avatar: "gpt-bot",
      name: "新的聊天",
      context: [],
      syncGlobalConfig: true,
      modelConfig: {
        model: "gpt-4o-mini",
        providerName: "OpenAI",
        temperature: 0.5,
        top_p: 1,
        max_tokens: 4000,
        presence_penalty: 0,
        frequency_penalty: 0,
        sendMemory: true,
        historyMessageCount: 4,
        compressMessageLengthThreshold: 1000,
        compressModel: "",
        compressProviderName: "",
        enableInjectSystemPrompts: true,
        template: "{{input}}",
        size: "1024x1024",
        quality: "standard",
        style: "vivid",
      },
      lang: "cn",
      builtin: false,
      createdAt: 1740448232818,
      plugin: ["ikAbgA1Miq34iB7tZ9OY5"],
    },
  },
  {
    id: "lt_ab6Q_8i4NhHLf6YxI8",
    topic: "AI文生图",
    memoryPrompt: "",
    messages: [
      {
        id: "xz03XUbkKFzPeOB_K1B62",
        date: "2025/2/26 10:16:37",
        role: "user",
        content: "123",
      },
      {
        id: "QhlqN8GRqTmCrEIloxFla",
        date: "2025/2/26 10:16:37",
        role: "assistant",
        content:
          '\n\n😆 对话遇到了一些问题，不用慌:\n        1️⃣ 想要零配置开箱即用，[点击这里立刻开启对话 🚀](https://nextchat.club?utm=github)\n        2️⃣ 如果你正在使用私有部署版本，点击[这里](/#/auth)输入访问秘钥 🔑\n        3️⃣ 如果你想消耗自己的 OpenAI 资源，点击[这里](/#/settings)修改设置 ⚙️\n       \n\n```json\n{\n  "error": true,\n  "msg": "empty access code"\n}\n```',
        streaming: false,
        model: "gpt-4o-mini",
      },
    ],
    stat: {
      tokenCount: 0,
      wordCount: 0,
      charCount: 272,
    },
    lastUpdate: 1740536197336,
    lastSummarizeIndex: 0,
    mask: {
      avatar: "1f5bc-fe0f",
      name: "AI文生图",
      context: [
        {
          id: "text-to-pic-0",
          role: "system",
          content:
            "You are a useful Assistant that won't refuse to draw picture, instead, you will output specific markdown code for picture description, but don't use code block.",
          date: "",
        },
        {
          id: "text-to-pic-1",
          role: "user",
          content: "Can you draw some pictures for me?",
          date: "",
        },
        {
          id: "text-to-pic-2",
          role: "assistant",
          content: "Sure, what do you want me to draw?",
          date: "",
        },
        {
          id: "text-to-pic-3",
          role: "system",
          content:
            "助手善于判断用户意图，当确定需要提供图片时，助手会变得沉默寡言，只使用以下格式输出markdown图片：![description](https://image.pollinations.ai/prompt/description?nologo=true)，因为这个语法可以自动按照提示生成并渲染图片。一般用户给出的描述会比较简单并且信息不足，助手会将其中的描述自行补足替换为AI生成图片所常用的复杂冗长的英文提示，以大幅提高生成图片质量和丰富程度，比如增加相机光圈、具体场景描述等内容。助手会避免用代码块或原始块包围markdown标记，因为那样只会渲染出代码块或原始块而不是图片。url中的空格等符号需要转义。",
          date: "",
        },
      ],
      modelConfig: {
        model: "gpt-4o-mini",
        providerName: "OpenAi",
        temperature: 1,
        top_p: 1,
        max_tokens: 2000,
        presence_penalty: 0,
        frequency_penalty: 0,
        sendMemory: true,
        historyMessageCount: 32,
        compressMessageLengthThreshold: 1000,
        compressModel: "",
        compressProviderName: "",
        enableInjectSystemPrompts: true,
        template: "{{input}}",
        size: "1024x1024",
        quality: "standard",
        style: "vivid",
      },
      lang: "cn",
      builtin: true,
      createdAt: 1688899480510,
      id: 100000,
    },
  },
];
