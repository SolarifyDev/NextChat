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

export const GetHistory = async (token: string): Promise<ISession[]> => {
  return (
    await api.get("/api/v1/histories", {
      headers: {
        "Ome-Metis-Authorization": token,
      },
    })
  ).data;
};

export const PostAddOrUpdateSession = async (
  token: string,
  data: Partial<ISession>,
): Promise<ISession> => {
  return (
    await api.post("/api/v1/history/addOrUpdate", data, {
      headers: {
        "Ome-Metis-Authorization": token,
      },
    })
  ).data;
};
