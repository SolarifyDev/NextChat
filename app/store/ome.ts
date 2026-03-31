import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Lang } from "../locales";
import { LanguageEnum, PostGetToken, SourceSystem } from "../client/smarties";

export type OmeStoreType = {
  token: string;
  userId: string;
  userName: string;
  from: string;
  isFromApp: boolean | null;
  language: Lang;
  onlineSearch: boolean;
  ticket: string;
  refreshToken: string;
  expiresIn: null | number;
  clientId: string | null;
  clientSecret: string | null;
  score: string | null;
  isShowHome: boolean | null;
  faqSearch: boolean;
  clearCurrent: () => void;
  setOnlineSearch: (onlineSearch: boolean) => void;
  setToken: (token: string) => void;
  setUserId: (userId: string) => void;
  setUserName: (userName: string) => void;
  setFrom: (from: string) => void;
  setIsFromApp: (isFromApp: boolean) => void;
  setLanguage: (language: Lang) => void;
  setTicket: (ticket: string) => void;
  setRefreshToken: (refreshToken: string) => void;
  setExpiresIn: (expiresIn: number) => void;
  refreshAccessToken: () => Promise<string>;
  shouldRefreshToken: () => boolean;
  setClient: (clientId: string, clientSecret: string, score: string) => void;
  setIsShowHome: (isShowHome: boolean) => void;
  getSourceSystem: () => "" | SourceSystem;
  convertLangToEnum(): LanguageEnum;
  setFaqSearch: (faqSearch: boolean) => void;
};

export const useOmeStore = create<OmeStoreType>()(
  persist(
    (set, get) => ({
      token: "",
      userId: "",
      userName: "",
      from: "",
      isFromApp: null,
      language: "cn",
      onlineSearch: false,
      ticket: "",
      refreshToken: "",
      expiresIn: null,
      clientId: null,
      clientSecret: null,
      score: null,
      isShowHome: null,
      faqSearch: false,
      clearCurrent: () => {
        set({
          token: "",
          userId: "",
          userName: "",
          from: "",
          isFromApp: null,
          onlineSearch: false,
          ticket: "",
          refreshToken: "",
          expiresIn: null,
          clientId: null,
          clientSecret: null,
          score: null,
          isShowHome: null,
          faqSearch: false,
        });
      },
      setOnlineSearch: (onlineSearch: boolean) => {
        set({ onlineSearch });
      },
      setToken: (token: string) => {
        set({ token });
      },
      setUserId: (userId: string) => {
        set({ userId });
      },
      setUserName: (userName: string) => {
        set({ userName });
      },
      setFrom: (from: string) => {
        set({ from });
      },
      setIsFromApp: (isFromApp: boolean) => {
        set({ isFromApp });
      },
      setLanguage: (language: Lang) => {
        set({ language });
      },
      setTicket: (ticket: string) => {
        set({ ticket });
      },
      setRefreshToken: (refreshToken: string) => {
        set({ refreshToken });
      },
      setClient: (clientId: string, clientSecret: string, score: string) => {
        set({
          clientId,
          clientSecret,
          score,
        });
      },
      setExpiresIn: (expiresIn: number) => {
        set({ expiresIn });
      },
      refreshAccessToken: async () => {
        return PostGetToken("refresh", {
          grant_type: "refresh",
          refresh_token: get().refreshToken || "",
        })
          .then((res) => {
            if (res && res.access_token) {
              get().setToken(res?.access_token ?? "");
              get().setRefreshToken(res?.refresh_token ?? "");
              return res.access_token;
            }

            return "";
          })
          .catch(() => {
            return "";
          });
      },
      shouldRefreshToken: () => {
        const expiresIn = get().expiresIn;

        if (!expiresIn) {
          return false;
        }

        const currentTime = Date.now();
        const fiveMinutesInMs = 5 * 60 * 1000;

        return expiresIn - currentTime <= fiveMinutesInMs;
      },
      setIsShowHome: (isShowHome: boolean | null) => {
        set({ isShowHome });
      },
      getSourceSystem: () => {
        switch (get().from) {
          case "omeoffice web":
            return SourceSystem.OMEv1;
          case "omelinkapp":
            return SourceSystem.OMELink;
          case "omeoffice 1.0":
            return SourceSystem.OMEApp;
          case "omeoffice 2.0":
            return SourceSystem.OMEv2;
          default:
            return "";
        }
      },
      convertLangToEnum() {
        switch (get().language) {
          case "cn":
            return LanguageEnum.SimplyChinese; // 简体中文
          case "tw":
            return LanguageEnum.TraditionalChinese; // 繁体中文
          case "en":
            return LanguageEnum.English; // 英语
          case "es":
            return LanguageEnum.Spanish; // 西班牙语

          // 以下语种没有直接对应的枚举，使用默认的简体中文
          case "pt": // 葡萄牙语
          case "da": // 丹麦语
          case "jp": // 日语
          case "ko": // 韩语
          case "id": // 印尼语
          case "fr": // 法语
          case "it": // 意大利语
          case "tr": // 土耳其语
          case "de": // 德语
          case "vi": // 越南语
          case "ru": // 俄语
          case "cs": // 捷克语
          case "no": // 挪威语
          case "ar": // 阿拉伯语
          case "bn": // 孟加拉语
          case "sk": // 斯洛伐克语
          default:
            return LanguageEnum.SimplyChinese;
        }
      },
      setFaqSearch: (faqSearch: boolean) => {
        set({
          faqSearch,
        });
      },
    }),
    {
      name: "OME_STORE",
      onRehydrateStorage: () => (state) => {
        state?.clearCurrent();
      },
    },
  ),
);
