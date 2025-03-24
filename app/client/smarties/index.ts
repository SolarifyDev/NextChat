import { api } from "./api";

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

export function getHeaders(
  from: string,
  isFromApp: boolean,
  userId: string,
  userName: string,
  token: string,
) {
  let headers: { [key: string]: string } = {};

  if (isFromApp) {
    switch (from) {
      case "OmeOfficeApp":
        headers = {
          "Ome-Metis-Authorization": token,
          "Ome-Metis-Userid": userId,
          "Ome-Metis-Username": userName,
        };
        break;
      case "omelink":
        headers = {
          "Omelink-Metis-Userid": userId,
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
  headers: {
    [key: string]: string;
  },
  data: Partial<ISession>,
): Promise<ISession> => {
  return (
    await api.post("/api/v1/history/addOrUpdate", data, {
      headers,
    })
  ).data;
};
