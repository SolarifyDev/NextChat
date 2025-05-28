import { createPersistStore } from "../utils/store";

const defaultKids: [] = [];

export const useKidStore = createPersistStore(
  {
    // type: "add" | "update" | null,
    currentKid: null,
    kids: defaultKids,
    isLoading: false,
  },
  (set, _get) => {
    function get() {
      return {
        ..._get(),
        ...methods,
      };
    }

    const methods = {
      getKid: async () => {
        try {
          set({
            isLoading: true,
          });
        } catch {}
      },
    };

    return methods;
  },
  {
    name: "KID_STORE",
    onRehydrateStorage: () => {},
  },
);
