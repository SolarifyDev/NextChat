import { clone } from "lodash-es";
import { GetKids, IAIKid, PostUpdateKid, getHeaders } from "../client/smarties";
import { createPersistStore } from "../utils/store";
import { useOmeStore } from "./ome";

export enum IType {
  Add,
  Edit,
}

const defaultKid: {
  type: IType | null;
  currentKid: IAIKid | null;
  notSavekid: IAIKid | null;
  kids: IAIKid[];
  isLoading: boolean;
  isFetching: boolean;
  currentKidId: number;
} = {
  type: null,
  currentKid: null,
  notSavekid: null,
  kids: [],
  isLoading: false,
  isFetching: false,
  currentKidId: -1,
};

export const useKidStore = createPersistStore(
  {
    ...defaultKid,
  },
  (set, _get) => {
    function get() {
      return {
        ..._get(),
        ...methods,
      };
    }

    const methods = {
      getKids: async () => {
        try {
          set({
            isLoading: true,
          });

          const data = await GetKids(
            getHeaders(
              useOmeStore.getState().from,
              useOmeStore.getState().isFromApp!,
              useOmeStore.getState().userId,
              useOmeStore.getState().userName,
              useOmeStore.getState().token,
            ),
          );

          set({
            kids: data ?? [],
            isLoading: false,
          });
        } catch (err) {
          set({
            kids: [],
            isLoading: false,
          });
        }
      },
      getKid: async () => {
        try {
          set({
            isLoading: true,
          });
        } catch (err) {}
      },
      handleChangeCurrentKidIndex: (kidId: number) => {
        set({
          currentKidId: kidId,
        });
      },
      handleChangeType: (type: IType | null) => {
        set({
          type: type,
        });
      },
      handleChangeKid: (
        kid: IAIKid | null,
        isSave: boolean,
        callback?: () => void,
      ) => {
        isSave
          ? set({
              currentKid: clone(kid),
              notSavekid: clone(kid),
            })
          : set({
              notSavekid: clone(kid),
            });

        callback && callback();
      },
      handleUpdateKid: async (callback?: () => void) => {
        try {
          const { notSavekid, isFetching, handleChangeKid } = get();

          if (isFetching) return;

          if (notSavekid) {
            set({
              isFetching: true,
            });
            const formData = new FormData();

            if (notSavekid.avatarUrl instanceof File) {
              formData.append("file", notSavekid.avatarUrl);
            }

            formData.append("kidId", notSavekid.id.toString());
            formData.append("name", notSavekid.name);
            formData.append("greeting", notSavekid.greeting);
            formData.append("voice", notSavekid.voice.toString());

            await PostUpdateKid(
              getHeaders(
                useOmeStore.getState().from,
                useOmeStore.getState().isFromApp!,
                useOmeStore.getState().userId,
                useOmeStore.getState().userName,
                useOmeStore.getState().token,
              ),
              formData,
            );

            set({
              isFetching: false,
            });

            handleChangeKid(null, true);

            callback && callback();
          }
        } catch (err) {
          set({
            isFetching: false,
          });
          console.log(err);
        }
      },
      clearCurrent: () => {
        set({
          type: null,
          currentKid: null,
          notSavekid: null,
          kids: [],
          isLoading: false,
          isFetching: false,
          currentKidId: -1,
        });
      },
    };

    return methods;
  },
  {
    name: "KID_STORE",
    onRehydrateStorage: (state) => {
      state.clearCurrent();
    },
  },
);
