import { create } from "zustand";
import { persist } from "zustand/middleware";
import { RequestMessage } from "../typing";
import { ModelType } from "./config";
import { ChatStat } from ".";
import { Mask } from "./mask";

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
};

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
