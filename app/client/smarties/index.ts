import axios from "axios";
import { api } from "./api";
import { useOmeStore } from "@/app/store/ome";

export enum AiKidVoiceType {
  Male,
  Female,
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
  userId: number;
  createdBy: number;
  createdDate: string;
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
          Authorization: "Bearer " + state.token,
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

export const GetHistory = async (headers: {
  [key: string]: string;
}): Promise<ISession[]> => {
  return (
    await api.get("/api/v1/histories", {
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
