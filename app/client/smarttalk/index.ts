import { api } from "./api";

export const PostRealTime = async (offerSdp: string) => {
  return (
    await api.post(
      "/api/AiSpeechAssistant/realtime/connect",
      {
        offerSdp,
      },
      {
        headers: {
          "x-api-key": "xxx",
        },
      },
    )
  ).data;
};
