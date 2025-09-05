import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Lang } from "../locales";
import { PostGetToken } from "../client/smarties";

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
  clearCurrent: () => void;
  setOnlineSearch: (onlineSearch: boolean) => void;
  setToken: (token: string) => void;
  setUserId: (userId: string) => void;
  setUserName: (userName: string) => void;
  setFrom: (from: string) => void;
  setIsFromApp: (isFromApp: boolean) => void;
  setLanguage: (language: Lang) => void;
  setTicket: (ticket: string) => void;
  setIsShowHome: (isShowHome: boolean) => void;
  setRefreshToken: (refreshToken: string) => void;
  setExpiresIn: (expiresIn: number) => void;
  refreshAccessToken: () => Promise<string>;
  shouldRefreshToken: () => boolean;
  setClient: (clientId: string, clientSecret: string, score: string) => void;
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
      isShowHome: false,
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
          isShowHome: false,
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
      setIsShowHome: (isShowHome: boolean) => {
        set({ isShowHome });
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
    }),
    {
      name: "OME_STORE",
      onRehydrateStorage: () => (state) => {
        state?.clearCurrent();
      },
    },
  ),
);
