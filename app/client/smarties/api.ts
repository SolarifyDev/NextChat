import { MessageEnum } from "@/app/enum";
import axios from "axios";

export const api = axios.create({ baseURL: "", timeout: 120000 });

api.interceptors.request.use(
  async (config) => {
    // config.baseURL = process.env.NEXT_PUBLIC_SMARTIES_URL;

    if (!config.baseURL || config.baseURL === "") {
      config.baseURL =
        location.origin.includes("ai-chat-test") ||
        location.origin.includes("localhost")
          ? "https://testsmarties.yamimeal.ca"
          : "https://smarties.yamimeal.ca";
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

api.interceptors.response.use(
  (response) => {
    if (response.data.code === 200) {
      return response.data;
    }

    return Promise.reject(response.data.msg ?? "");
  },
  async (error) => {
    console.log(error, "error");
    const { status } = error.response;

    if (status === 401) {
      try {
        if (window.ReactNativeWebView) {
          const message = {
            data: {},
            msg: "quit",
            type: MessageEnum.Quit,
          };
          window.ReactNativeWebView.postMessage(JSON.stringify(message));
        } else if ((window as any)?.webkit?.messageHandlers?.nativeListener) {
          (window as any)?.webkit?.messageHandlers?.nativeListener.postMessage(
            "quit",
          );
        }
      } catch {}
    }
  },
);
