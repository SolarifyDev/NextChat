import { api } from "./api";

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

export function getHeaders(
  from: string,
  isFromApp: boolean,
  userId: string,
  userName: string,
  token: string,
) {
  let headers: { [key: string]: string } = {};

  if (isFromApp) {
    switch (from.toLowerCase()) {
      case "omeofficeapp":
        headers = {
          "Ome-Metis-Authorization": token,
          "Ome-Metis-Userid": userId,
          "Ome-Metis-Username": userName,
        };
        break;
      case "omelinkapp":
        headers = {
          "Omelink-Metis-Userid": userId,
        };
        break;
      case "omeoffice 1.0":
        headers = {
          "Ome-Office-Oa-User-Id": userId,
        };
        break;
      default:
        return {};
    }
  } else {
    headers = {
      "Ome-Metis-Authorization": token,
      "Ome-Metis-Userid": userId,
      "Ome-Metis-Username": userName,
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
  const client =
    type === "get"
      ? {
          client_id: "",
          client_secret: "",
          scope: "",
        }
      : {
          client_id: "",
          client_secret: "",
        };

  const newData = {
    ...data,
    ...client,
  };
  return (
    await api.post(
      "/connect/token",
      newData,

      {
        baseURL: "http://ome-account.wiltechs.com",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      },
    )
  ).data;
};
