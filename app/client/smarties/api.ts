import { MessageEnum } from "@/app/enum";
import axios from "axios";

export const api = axios.create({ baseURL: "", timeout: 120000 });

api.interceptors.request.use(
  async (config) => {
    // config.baseURL = process.env.NEXT_PUBLIC_SMARTIES_URL;

    config.baseURL =
      location.origin.includes("ai-chat-test") ||
      location.origin.includes("localhost")
        ? "https://testsmarties.yamimeal.ca"
        : "https://smarties.yamimeal.ca";

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
    const status = error.response?.status;

    if (status === 401) {
      try {
        const message = JSON.stringify({
          data: {},
          msg: "quit",
          type: MessageEnum.Quit,
        });

        if (window.ReactNativeWebView) {
          window.ReactNativeWebView.postMessage(message);
        } else if ((window as any)?.webkit?.messageHandlers?.nativeListener) {
          (window as any).webkit.messageHandlers.nativeListener.postMessage(
            message,
          );
        }
      } catch {}
    }

    // 构造统一的错误信息，方便调用方处理
    const errorMsg =
      error.response?.data?.msg ??
      (error.code === "ECONNABORTED" ? "请求超时" : null) ??
      (error.code === "ERR_NETWORK" ? "网络异常" : null) ??
      error.message ??
      "未知错误";

    return Promise.reject(errorMsg);
  },
);
