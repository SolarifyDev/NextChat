import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Lang } from "../locales";
// import i18next from "i18next";

export type OmeStoreType = {
  token: string;
  userId: string;
  userName: string;
  from: string;
  isFromApp: boolean | null;
  language: Lang;
  onlineSearch: boolean;
  clearCurrent: () => void;
  setOnlineSearch: (onlineSearch: boolean) => void;
  setToken: (token: string) => void;
  setUserId: (userId: string) => void;
  setUserName: (userName: string) => void;
  setFrom: (from: string) => void;
  setIsFromApp: (isFromApp: boolean) => void;
  setLanguage: (language: Lang) => void;
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
      clearCurrent: () => {
        set({
          token: "",
          userId: "",
          userName: "",
          from: "",
          isFromApp: null,
          onlineSearch: false,
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
    }),
    {
      name: "OME_STORE",
      onRehydrateStorage: () => (state) => {
        state?.clearCurrent();
      },
    },
  ),
);
