import { DEFAULT_MODELS, ServiceProvider } from "../constant";
import { LLMModel } from "../client/api";
import { Lang } from "../locales";

interface NameLocale {
  name: string;
  translations: Partial<Record<Lang, string>>;
  releaseDateDev?: string; // 测试环境
  releaseDateProd?: string; // 正式环境
}

export const nameLocales: NameLocale[] = [
  {
    name: "deepseek-chat",
    translations: {
      cn: "擅长多轮对话与内容创作的高性能通用模型",
      tw: "擅長多輪對話與內容創作的高性能通用模型",
      en: "General model for chat & content",
      es: "Modelo general para chat y contenido",
    },
  },
  {
    name: "deepseek-reasoner",
    translations: {
      cn: "专攻数学代码与复杂逻辑的深度推理模型",
      tw: "專攻數學代碼與複雜邏輯的深度推理模型",
      en: "Advanced model for math & logic",
      es: "Modelo avanzado para matemáticas y lógica",
    },
  },
  {
    name: "metis-instruct",
    translations: {
      cn: "METIS 的综合基座，胜任标准语言任务",
      tw: "METIS 的綜合基座，勝任標準語言任務",
      en: "METIS core for language tasks",
      es: "Núcleo METIS para tareas lingüísticas",
    },
  },
  {
    name: "metis-thinking",
    translations: {
      cn: "METIS 的思考模型，攻克复杂逻辑难题",
      tw: "METIS 的思考模型，攻克複雜邏輯難題",
      en: "METIS logic reasoning model",
      es: "Modelo lógico de razonamiento METIS",
    },
  },
  {
    name: "gpt-5.1",
    translations: {
      cn: "具备自适应思考与顶尖智能的旗舰级模型",
      tw: "具備自適應思考與頂尖智能的旗艦級模型",
      en: "Flagship adaptive intelligence",
      es: "Inteligencia adaptativa insignia",
    },
    releaseDateDev: "2025-12-25",
    releaseDateProd: "2026-01-06",
  },
  {
    name: "gpt-5-mini",
    translations: {
      cn: "兼顾速度与成本，高响应的轻量级模型",
      tw: "兼顧速度與成本，高響應的輕量級模型",
      en: "Fast, lightweight, cost-effective model",
      es: "Modelo rápido, ligero y económico",
    },
    releaseDateDev: "2025-12-25",
    releaseDateProd: "2026-01-06",
  },
];

export function isWithinReleasePeriod(releaseDate?: string): boolean {
  if (!releaseDate) return false;

  const release = new Date(releaseDate);
  const today = new Date();

  // 往后推 30 天
  const endDate = new Date(release);
  endDate.setDate(endDate.getDate() + 30);

  // 判断今天是否在 [releaseDate, releaseDate + 30天] 区间内
  return today >= release && today <= endDate;
}

const CustomSeq = {
  val: -1000, //To ensure the custom model located at front, start from -1000, refer to constant.ts
  cache: new Map<string, number>(),
  next: (id: string) => {
    if (CustomSeq.cache.has(id)) {
      return CustomSeq.cache.get(id) as number;
    } else {
      let seq = CustomSeq.val++;
      CustomSeq.cache.set(id, seq);
      return seq;
    }
  },
};

const customProvider = (providerName: string) => ({
  id: providerName.toLowerCase(),
  providerName: providerName,
  providerType: "custom",
  sorted: CustomSeq.next(providerName),
});

/**
 * Sorts an array of models based on specified rules.
 *
 * First, sorted by provider; if the same, sorted by model
 */
const sortModelTable = (models: ReturnType<typeof collectModels>) =>
  models.sort((a, b) => {
    if (a.provider && b.provider) {
      let cmp = a.provider.sorted - b.provider.sorted;
      return cmp === 0 ? a.sorted - b.sorted : cmp;
    } else {
      return a.sorted - b.sorted;
    }
  });

/**
 * get model name and provider from a formatted string,
 * e.g. `gpt-4@OpenAi` or `claude-3-5-sonnet@20240620@Google`
 * @param modelWithProvider model name with provider separated by last `@` char,
 * @returns [model, provider] tuple, if no `@` char found, provider is undefined
 */
export function getModelProvider(modelWithProvider: string): [string, string?] {
  const [model, provider] = modelWithProvider.split(/@(?!.*@)/);
  return [model, provider];
}

export function collectModelTable(
  models: readonly LLMModel[],
  customModels: string,
) {
  const modelTable: Record<
    string,
    {
      available: boolean;
      name: string;
      displayName: string;
      sorted: number;
      provider?: LLMModel["provider"]; // Marked as optional
      isDefault?: boolean;
      releaseDate?: string;
      description?: string;
    }
  > = {};

  // default models
  models.forEach((m) => {
    // using <modelName>@<providerId> as fullName
    modelTable[`${m.name}@${m?.provider?.id}`] = {
      ...m,
      displayName: m.name, // 'provider' is copied over if it exists
    };
  });

  // server custom models
  customModels
    .split(",")
    .filter((v) => !!v && v.length > 0)
    .forEach((m) => {
      const available = !m.startsWith("-");
      const nameConfig =
        m.startsWith("+") || m.startsWith("-") ? m.slice(1) : m;
      let [name, displayName] = nameConfig.split("=");

      // enable or disable all models
      if (name === "all") {
        Object.values(modelTable).forEach(
          (model) => (model.available = available),
        );
      } else {
        // 1. find model by name, and set available value
        const [customModelName, customProviderName] = getModelProvider(name);
        let count = 0;
        for (const fullName in modelTable) {
          const [modelName, providerName] = getModelProvider(fullName);
          if (
            customModelName == modelName &&
            (customProviderName === undefined ||
              customProviderName === providerName)
          ) {
            count += 1;
            modelTable[fullName]["available"] = available;
            // swap name and displayName for bytedance
            if (providerName === "bytedance") {
              [name, displayName] = [displayName, modelName];
              modelTable[fullName]["name"] = name;
            }
            if (displayName) {
              modelTable[fullName]["displayName"] = displayName;
            }
          }
        }
        // 2. if model not exists, create new model with available value
        if (count === 0) {
          let [customModelName, customProviderName] = getModelProvider(name);
          const provider = customProvider(
            customProviderName || customModelName,
          );
          // swap name and displayName for bytedance
          if (displayName && provider.providerName == "ByteDance") {
            [customModelName, displayName] = [displayName, customModelName];
          }
          modelTable[`${customModelName}@${provider?.id}`] = {
            name: customModelName,
            displayName: displayName || customModelName,
            available,
            provider, // Use optional chaining
            sorted: CustomSeq.next(`${customModelName}@${provider?.id}`),
          };
        }
      }
    });

  return modelTable;
}

export function collectModelTableWithDefaultModel(
  models: readonly LLMModel[],
  customModels: string,
  defaultModel: string,
) {
  let modelTable = collectModelTable(models, customModels);
  if (defaultModel && defaultModel !== "") {
    if (defaultModel.includes("@")) {
      if (defaultModel in modelTable) {
        modelTable[defaultModel].isDefault = true;
      }
    } else {
      for (const key of Object.keys(modelTable)) {
        if (
          modelTable[key].available &&
          getModelProvider(key)[0] == defaultModel
        ) {
          modelTable[key].isDefault = true;
          break;
        }
      }
    }
  }
  return modelTable;
}

/**
 * Generate full model table.
 */
export function collectModels(
  models: readonly LLMModel[],
  customModels: string,
) {
  const modelTable = collectModelTable(models, customModels);
  let allModels = Object.values(modelTable);

  allModels = sortModelTable(allModels);

  return allModels;
}

export function collectModelsWithDefaultModel(
  models: readonly LLMModel[],
  customModels: string,
  defaultModel: string,
) {
  const modelTable = collectModelTableWithDefaultModel(
    models,
    customModels,
    defaultModel,
  );
  let allModels = Object.values(modelTable);

  allModels = sortModelTable(allModels);

  return allModels;
}

export function isModelAvailableInServer(
  customModels: string,
  modelName: string,
  providerName: string,
) {
  const fullName = `${modelName}@${providerName}`;
  const modelTable = collectModelTable(DEFAULT_MODELS, customModels);
  return modelTable[fullName]?.available === false;
}

/**
 * Check if the model name is a GPT-4 related model
 *
 * @param modelName The name of the model to check
 * @returns True if the model is a GPT-4 related model (excluding gpt-4o-mini)
 */
export function isGPT4Model(modelName: string): boolean {
  return (
    (modelName.startsWith("gpt-4") ||
      modelName.startsWith("chatgpt-4o") ||
      modelName.startsWith("o1")) &&
    !modelName.startsWith("gpt-4o-mini")
  );
}

/**
 * Checks if a model is not available on any of the specified providers in the server.
 *
 * @param {string} customModels - A string of custom models, comma-separated.
 * @param {string} modelName - The name of the model to check.
 * @param {string|string[]} providerNames - A string or array of provider names to check against.
 *
 * @returns {boolean} True if the model is not available on any of the specified providers, false otherwise.
 */
export function isModelNotavailableInServer(
  customModels: string,
  modelName: string,
  providerNames: string | string[],
): boolean {
  // Check DISABLE_GPT4 environment variable
  if (
    process.env.DISABLE_GPT4 === "1" &&
    isGPT4Model(modelName.toLowerCase())
  ) {
    return true;
  }

  if (modelName.toLowerCase().includes("metis")) {
    return false;
  }

  const modelTable = collectModelTable(DEFAULT_MODELS, customModels);

  const providerNamesArray = Array.isArray(providerNames)
    ? providerNames
    : [providerNames];
  for (const providerName of providerNamesArray) {
    // if model provider is bytedance, use model config name to check if not avaliable
    if (providerName === ServiceProvider.ByteDance) {
      return !Object.values(modelTable).filter((v) => v.name === modelName)?.[0]
        ?.available;
    }
    const fullName = `${modelName}@${providerName.toLowerCase()}`;
    if (modelTable?.[fullName]?.available === true) return false;
  }
  return true;
}
