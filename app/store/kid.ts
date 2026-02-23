import { clone, isEmpty, isNil } from "lodash-es";
import {
  AiKidSystemSource,
  GetKids,
  IAIKid,
  PostUpdateKid,
  getHeaders,
} from "../client/smarties";
import { createPersistStore } from "../utils/store";
import { showToast } from "../components/ui-lib";
import { t } from "i18next";
import { KidNamelocals } from "../components/kid/component/kid";
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

          const data = await GetKids(await getHeaders());

          const translateData = data.map((kid) => {
            if (kid?.IsMultilingual) {
              const KidNamelocal = KidNamelocals.find(
                (item) => item.name.toLowerCase() === kid.name.toLowerCase(),
              );

              const lang = useOmeStore.getState().language;
              const description =
                KidNamelocal?.translations?.[lang] ??
                KidNamelocal?.translations?.en ??
                "";

              const newKid = { ...kid };

              if (kid.systemSource === AiKidSystemSource.SmartTalk) {
                newKid.greeting = description;
              } else if (
                kid.systemSource === AiKidSystemSource.DifyLevelAgent ||
                kid.systemSource === AiKidSystemSource.ToolAgent
              ) {
                newKid.description = description;
              }

              return newKid;
            }

            return kid;
          });

          set({
            kids: translateData ?? [],
            isLoading: false,
          });
        } catch {
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
        } catch {}
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

          if (isEmpty(notSavekid?.name) || isNil(notSavekid?.name)) {
            showToast(t("AddOrUpdateAiKid.NoNameTips"));

            return;
          }

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

            await PostUpdateKid(await getHeaders(), formData);

            set({
              isFetching: false,
            });

            handleChangeKid(null, true);

            callback && callback();
          }
        } catch {
          set({
            isFetching: false,
          });
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
