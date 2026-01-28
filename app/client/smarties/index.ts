import axios from "axios";
import { api } from "./api";
import { useOmeStore } from "@/app/store/ome";

export enum AiKidVoiceType {
  Male,
  Female,
}

export enum SourceSystem {
  WeChat,
  OMEv1,
  OMELink,
  OMEv2,
  OMEApp,
}

export enum LanguageEnum {
  SimplyChinese = 1,
  TraditionalChinese = 2,
  English = 3,
  Spanish = 4,
}

export enum AiKidSystemSource {
  SmartTalk,
  ToolAgent,
  DifyLevelAgent,
}

export enum QuestionInputType {
  Text,
  Voice,
}

export interface ISession {
  sessionId: number;
  id: string;
  topic: string;
  memoryPrompt: string;
  messages: string;
  stat: string;
  lastUpdate: number;
  lastSummarizeIndex: number;
  mask: string;
  isDeleted: boolean;
  clearContextIndex: number | null;
  inputType: QuestionInputType;
}

export interface IAIKid {
  id: number;
  agentId: number;
  assistantId: number;
  uuid: string;
  name: string;
  avatarUrl: string | File;
  greeting: string;
  voice: AiKidVoiceType;
  mediaType: number;
  userId: number;
  externalUrl: string;
  systemSource: AiKidSystemSource;
  domian: string;
  description: string;
  createdBy: number;
  createdDate: string;
  sortOrder: number;
}

export interface ITopics {
  id: number;
  title: string;
  answer: string;
  language: number;
  createTime: string;
  topicCutLineText: string;
}

export async function getHeaders() {
  if (useOmeStore.getState().shouldRefreshToken()) {
    await useOmeStore.getState().refreshAccessToken();
  }

  let headers: { [key: string]: string } = {};

  const state = useOmeStore.getState();

  if (state.isFromApp) {
    switch (state.from.toLowerCase()) {
      case "omeofficeapp":
        headers = {
          "Ome-Metis-Authorization": state.token,
          "Ome-Metis-Userid": state.userId,
          "Ome-Metis-Username": state.userName,
        };
        break;
      case "omelinkapp":
        headers = {
          "Omelink-Metis-Userid": state.userId,
        };
        break;
      case "omeoffice 1.0":
        headers = {
          "Ome-Office-Oa-User-Id": state.userId,
        };
        break;
      case "omeoffice 2.0":
        headers = {
          "Ome-Office-Authorization": "Bearer " + state.token,
        };
        break;
      default:
        return {};
    }
  } else {
    headers = {
      "Ome-Metis-Authorization": state.token,
      "Ome-Metis-Userid": state.userId,
      "Ome-Metis-Username": state.userName,
    };
  }

  return headers;
}

export const GetHistory = async (
  headers: {
    [key: string]: string;
  },
  includeMessages: boolean = false,
): Promise<ISession[]> => {
  return (
    await api.get(`/api/v1/histories?IncludeMessages=${includeMessages}`, {
      headers,
    })
  ).data;
};

export const GetItemHistory = async (
  headers: { [key: string]: string },
  sessionId: number,
): Promise<ISession> => {
  return (
    await api.get(`/api/v1/history?SessionId=${sessionId}`, {
      headers,
    })
  ).data;
};

export const PostAddOrUpdateSession = async (
  headers: { [key: string]: string },
  data: Partial<ISession>,
): Promise<ISession> => {
  return (
    await api.post("/api/v1/history/addOrUpdate", data, {
      headers,
    })
  ).data;
};

export const GetRecommendTopics = async (
  headers: {
    [key: string]: string;
  },
  language: LanguageEnum,
  sessionId?: number,
): Promise<ITopics[]> => {
  const params = new URLSearchParams();
  params.append("Language", language.toString());

  if (sessionId) {
    params.append("SessionId", sessionId.toString());
  }

  return (
    await api.get(`/api/v1/recommend/topics?${params.toString()}`, {
      headers,
    })
  ).data;
};

export const GetQuestionTopic = async (
  headers: {
    [key: string]: string;
  },
  recommendTopicId: number,
  systemSource: SourceSystem,
) => {
  return (
    await api.post(
      "/api/v1/faqs/question/topic",
      {
        recommendTopicId,
        systemSource,
      },
      {
        headers,
      },
    )
  ).data;
};

export const GetQuestionTopicUrl = async (
  headers: {
    [key: string]: string;
  },
  url: string,
  systemSource: SourceSystem,
) => {
  return (
    await api.post(
      "/api/v1/faqs/question/topic/url",
      {
        url,
        systemSource,
      },
      {
        headers,
      },
    )
  ).data;
};

export const GetKids = async (headers: {
  [key: string]: string;
}): Promise<IAIKid[]> => {
  return (
    await api.get("/api/Ome/ai/kids", {
      headers,
    })
  ).data;
};

// export const

export const PostUpdateKid = async (
  headers: { [key: string]: string },
  data: FormData,
) => {
  return await api.post("/api/Ome/ai/kid/update", data, {
    headers,
  });
};

export const PostTranslationSpeech = async (
  headers: { [key: string]: string },
  data: FormData,
) => {
  return (
    await api.post("/api/Translation/speech/to/text", data, {
      headers,
    })
  ).data;
};

const authApi = axios.create({
  timeout: 120000,
});

authApi.interceptors.request.use(
  async (config) => {
    config.baseURL =
      location.origin.includes("ai-chat-test") ||
      location.origin.includes("localhost")
        ? "https://ome-account.wiltechs.com"
        : "https://ome-account.omenow.com";

    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

export const PostGetToken = async (
  type: "get" | "refresh",
  data: Partial<{
    grant_type: string;
    ticket: string;
    refresh_token: string;
  }>,
): Promise<{
  access_token: string;
  token_type: string;
  expires_in: number;
  id_token: string;
  refresh_token: string;
}> => {
  const omeState = useOmeStore.getState();

  const client =
    type === "get"
      ? {
          client_id: omeState.clientId || "",
          client_secret: omeState.clientSecret || "",
          scope: omeState.score || "",
        }
      : {
          client_id: omeState.clientId || "",
          client_secret: omeState.clientSecret || "",
        };

  const newData = {
    ...data,
    ...client,
  };

  return (
    await authApi.post("/connect/token", newData, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    })
  ).data;
};
