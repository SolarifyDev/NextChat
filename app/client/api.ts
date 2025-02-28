import { getClientConfig } from "../config/client";
import {
  ACCESS_CODE_PREFIX,
  ModelProvider,
  ServiceProvider,
} from "../constant";
import {
  ChatMessageTool,
  ChatMessage,
  ModelType,
  useAccessStore,
  useChatStore,
  useAppConfig,
} from "../store";
import { ChatGPTApi, DalleRequestPayload } from "./platforms/openai";
import { GeminiProApi } from "./platforms/google";
import { ClaudeApi } from "./platforms/anthropic";
import { ErnieApi } from "./platforms/baidu";
import { DoubaoApi } from "./platforms/bytedance";
import { QwenApi } from "./platforms/alibaba";
import { HunyuanApi } from "./platforms/tencent";
import { MoonshotApi } from "./platforms/moonshot";
import { SparkApi } from "./platforms/iflytek";
import { DeepSeekApi } from "./platforms/deepseek";
import { XAIApi } from "./platforms/xai";
import { ChatGLMApi } from "./platforms/glm";
import { SiliconflowApi } from "./platforms/siliconflow";

export const ROLES = ["system", "user", "assistant"] as const;
export type MessageRole = (typeof ROLES)[number];

export const Models = ["gpt-3.5-turbo", "gpt-4"] as const;
export const TTSModels = ["tts-1", "tts-1-hd"] as const;
export type ChatModel = ModelType;

export interface MultimodalContent {
  type: "text" | "image_url";
  text?: string;
  image_url?: {
    url: string;
  };
}

export interface RequestMessage {
  role: MessageRole;
  content: string | MultimodalContent[];
}

export interface LLMConfig {
  model: string;
  providerName?: string;
  temperature?: number;
  top_p?: number;
  stream?: boolean;
  presence_penalty?: number;
  frequency_penalty?: number;
  size?: DalleRequestPayload["size"];
  quality?: DalleRequestPayload["quality"];
  style?: DalleRequestPayload["style"];
}

export interface SpeechOptions {
  model: string;
  input: string;
  voice: string;
  response_format?: string;
  speed?: number;
  onController?: (controller: AbortController) => void;
}

export interface ChatOptions {
  messages: RequestMessage[];
  config: LLMConfig;

  onUpdate?: (message: string, chunk: string) => void;
  onFinish: (message: string, responseRes: Response) => void;
  onError?: (err: Error) => void;
  onController?: (controller: AbortController) => void;
  onBeforeTool?: (tool: ChatMessageTool) => void;
  onAfterTool?: (tool: ChatMessageTool) => void;
}

export interface LLMUsage {
  used: number;
  total: number;
}

export interface LLMModel {
  name: string;
  displayName?: string;
  available: boolean;
  provider: LLMModelProvider;
  sorted: number;
}

export interface LLMModelProvider {
  id: string;
  providerName: string;
  providerType: string;
  sorted: number;
}

export abstract class LLMApi {
  abstract chat(options: ChatOptions): Promise<void>;
  abstract speech(options: SpeechOptions): Promise<ArrayBuffer>;
  abstract usage(): Promise<LLMUsage>;
  abstract models(): Promise<LLMModel[]>;
}

type ProviderName = "openai" | "azure" | "claude" | "palm";

interface Model {
  name: string;
  provider: ProviderName;
  ctxlen: number;
}

interface ChatProvider {
  name: ProviderName;
  apiConfig: {
    baseUrl: string;
    apiKey: string;
    summaryModel: Model;
  };
  models: Model[];

  chat: () => void;
  usage: () => void;
}

export class ClientApi {
  public llm: LLMApi;

  constructor(provider: ModelProvider = ModelProvider.GPT) {
    switch (provider) {
      case ModelProvider.GeminiPro:
        this.llm = new GeminiProApi();
        break;
      case ModelProvider.Claude:
        this.llm = new ClaudeApi();
        break;
      case ModelProvider.Ernie:
        this.llm = new ErnieApi();
        break;
      case ModelProvider.Doubao:
        this.llm = new DoubaoApi();
        break;
      case ModelProvider.Qwen:
        this.llm = new QwenApi();
        break;
      case ModelProvider.Hunyuan:
        this.llm = new HunyuanApi();
        break;
      case ModelProvider.Moonshot:
        this.llm = new MoonshotApi();
        break;
      case ModelProvider.Iflytek:
        this.llm = new SparkApi();
        break;
      case ModelProvider.DeepSeek:
        this.llm = new DeepSeekApi();
        break;
      case ModelProvider.XAI:
        this.llm = new XAIApi();
        break;
      case ModelProvider.ChatGLM:
        this.llm = new ChatGLMApi();
        break;
      case ModelProvider.SiliconFlow:
        this.llm = new SiliconflowApi();
        break;
      default:
        this.llm = new ChatGPTApi();
    }
  }

  config() {}

  prompts() {}

  masks() {}

  async share(messages: ChatMessage[], avatarUrl: string | null = null) {
    const msgs = messages
      .map((m) => ({
        from: m.role === "user" ? "human" : "gpt",
        value: m.content,
      }))
      .concat([
        {
          from: "human",
          value:
            "Share from [NextChat]: https://github.com/Yidadaa/ChatGPT-Next-Web",
        },
      ]);
    // 敬告二开开发者们，为了开源大模型的发展，请不要修改上述消息，此消息用于后续数据清洗使用
    // Please do not modify this message

    console.log("[Share]", messages, msgs);
    const clientConfig = getClientConfig();
    const proxyUrl = "/sharegpt";
    const rawUrl = "https://sharegpt.com/api/conversations";
    const shareUrl = clientConfig?.isApp ? rawUrl : proxyUrl;
    const res = await fetch(shareUrl, {
      body: JSON.stringify({
        avatarUrl,
        items: msgs,
      }),
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
    });

    const resJson = await res.json();
    console.log("[Share]", resJson);
    if (resJson.id) {
      return `https://shareg.pt/${resJson.id}`;
    }
  }
}

export function getBearerToken(
  apiKey: string,
  noBearer: boolean = false,
): string {
  return validString(apiKey)
    ? `${noBearer ? "" : "Bearer "}${apiKey.trim()}`
    : "";
}

export function validString(x: string): boolean {
  return x?.length > 0;
}

export function getHeaders(ignoreHeaders: boolean = false) {
  const appConfig = useAppConfig.getState();
  const accessStore = useAccessStore.getState();
  const chatStore = useChatStore.getState();
  let headers: Record<string, string> = {};
  if (!ignoreHeaders) {
    headers = {
      "Content-Type": "application/json",
      Accept: "application/json",
    };
  }

  const clientConfig = getClientConfig();

  function getConfig() {
    const modelConfig =
      chatStore.currentSession()?.mask?.modelConfig || undefined;
    const isGoogle = modelConfig?.providerName === ServiceProvider.Google;
    const isAzure = modelConfig?.providerName === ServiceProvider.Azure;
    const isAnthropic = modelConfig?.providerName === ServiceProvider.Anthropic;
    const isBaidu = modelConfig?.providerName == ServiceProvider.Baidu;
    const isByteDance = modelConfig?.providerName === ServiceProvider.ByteDance;
    const isAlibaba = modelConfig?.providerName === ServiceProvider.Alibaba;
    const isMoonshot = modelConfig?.providerName === ServiceProvider.Moonshot;
    const isIflytek = modelConfig?.providerName === ServiceProvider.Iflytek;
    const isDeepSeek = modelConfig?.providerName === ServiceProvider.DeepSeek;
    const isXAI = modelConfig?.providerName === ServiceProvider.XAI;
    const isChatGLM = modelConfig?.providerName === ServiceProvider.ChatGLM;
    const isSiliconFlow =
      modelConfig?.providerName === ServiceProvider.SiliconFlow;
    const isEnabledAccessControl = accessStore.enabledAccessControl();
    const apiKey = isGoogle
      ? accessStore.googleApiKey
      : isAzure
      ? accessStore.azureApiKey
      : isAnthropic
      ? accessStore.anthropicApiKey
      : isByteDance
      ? accessStore.bytedanceApiKey
      : isAlibaba
      ? accessStore.alibabaApiKey
      : isMoonshot
      ? accessStore.moonshotApiKey
      : isXAI
      ? accessStore.xaiApiKey
      : isDeepSeek
      ? accessStore.deepseekApiKey
      : isChatGLM
      ? accessStore.chatglmApiKey
      : isSiliconFlow
      ? accessStore.siliconflowApiKey
      : isIflytek
      ? accessStore.iflytekApiKey && accessStore.iflytekApiSecret
        ? accessStore.iflytekApiKey + ":" + accessStore.iflytekApiSecret
        : ""
      : accessStore.openaiApiKey;
    return {
      isGoogle,
      isAzure,
      isAnthropic,
      isBaidu,
      isByteDance,
      isAlibaba,
      isMoonshot,
      isIflytek,
      isDeepSeek,
      isXAI,
      isChatGLM,
      isSiliconFlow,
      apiKey,
      isEnabledAccessControl,
    };
  }

  function getAuthHeader(): string {
    return isAzure
      ? "api-key"
      : isAnthropic
      ? "x-api-key"
      : isGoogle
      ? "x-goog-api-key"
      : "Authorization";
  }

  const {
    isGoogle,
    isAzure,
    isAnthropic,
    isBaidu,
    isByteDance,
    isAlibaba,
    isMoonshot,
    isIflytek,
    isDeepSeek,
    isXAI,
    isChatGLM,
    isSiliconFlow,
    apiKey,
    isEnabledAccessControl,
  } = getConfig();
  // when using baidu api in app, not set auth header
  if (isBaidu && clientConfig?.isApp) return headers;

  const authHeader = getAuthHeader();

  const bearerToken = getBearerToken(
    apiKey,
    isAzure || isAnthropic || isGoogle,
  );

  if (bearerToken) {
    headers[authHeader] = bearerToken;
  } else if (isEnabledAccessControl && validString(accessStore.accessCode)) {
    headers["Authorization"] = getBearerToken(
      ACCESS_CODE_PREFIX + accessStore.accessCode,
    );
  }
  console.log("Headers.[`OME-METIS-Authorization`]", appConfig.omeToken);

  headers["OME-METIS-Authorization"] =
    appConfig.omeToken ||
    "eyJhbGciOiJBMjU2S1ciLCJlbmMiOiJBMjU2Q0JDLUhTNTEyIiwidHlwIjoiYXQrand0IiwiY3R5IjoiSldUIn0.lprBbY-PDAxvH8Cd6URG4e2N0MaIiU4C7mXADfMtU8ZyUJ6b_QtDY4pIgSJ4Qu-oBAFFEWposxk1k-PmqmpWx7Vlh8dfLPz_.xRsmNeV2YAb04nIRiOLFVw.9UWWDIkH5MtlWM_jLBtsWJOHSUAwX3-zRoUJIoAmHN90qYcegoppYx2LOYWEj61KrDq72ZVb22rnu2NmcydzYpCca29-fBaUs9Fw62uttywNrsy8nQWRMkh9MqXdTcMqzFVaMi6Let-ySPYqH32stvVO42jaOXyKwWIvaNHzCgzpXvXWZUp4PuzdYUK8fxRG7qGcNDZBq5GJRrU_CWT6V1aDeLSp7E6zZdMsAZDdkIdaynGPsPnVfYJ2ijGQ3CPRh3lg6NMzbxmNuo9cBr_318CHR23gO8Nnh2q0v9OD7LXPLu9lWErqi7NMzen0pHauRW5NsDoPXvMIEo-uLd4Tcn7iIug5tV_cXjTBYAp2JEAEdiSs9h2L9Tfk7oiJF1hxH1Oz21igcmWYgNanl5qk_kSOKJYhQnFPbsjECdEnJqLg02tRCcztejhp-NHX9KjfEMvcvCkOTyFIBVKGhSlble2cROGe7Ra27_sOEKuC5UesdGlTCZP33sXFd7F4y9YxcV_MyWVh4lVmcQ5XmZoirrz-W3vITgvnO-ylxzA3fuxoBF9CWZXPFpuHGIfjUPGl9Ue_b1YTvSTnQLsglMtt1docmXv7oPFP7dmPP9_0vEWZRaVxy54zF4isCjYkr7HSunrUAAR5Yq--JYAreoPGCPbCc1PEmeU_5_x18CiJNTMusF3H_umJTuWF1ydRY3PrujWGcLU8w6Z57SSo9tEUZGKytEanaBke4pSUO63PmXIc135AdyQmYPRXDrFgOrqeG01Z4Xf26K31Nal43kj7XBGWmUuRRECHumB9cvjBwRxnIJcVq0hLiolSpLPVkSCEdo4__4-igWsyVZP2Q8sRyUYHgzQ0kZYtkWbSwtpre0qcJa5XpkSzPf7TfSi2t6c31b0U8Bi73PsEENfnSx_KBO26-oGHwuRwLNiqcg2aKr3-bRMheEb8Flfvi4YT6lmmYtTeS0eCqfi9hvxlCvVMQDrernfF2TZIzwzb_I7J8QOTk6IdSXuf7Yiaja7Xxm1ASpipIzbQy0DGUizJSNCT3fcNGDNzdfmHh3lvnWkelxIbrw-grF752VHH7Irti53DZWmSc0BuNjxOJNse9gsOppgKtfUvbMYjVaZxU7gGSNZwvg_hJ6ZiMN-gBuD2ybMa-zvYM4af2b8Smfs0kw6Xyjk4QrVZI0804R_3i_UGqJABHkGsKosHdLbGdrzfh6_Yznzha8UHHdBcyW2LrZfPmLhgEJcObt8_OYGYxE8ntkMkS8CIBftRsVLwKrfkt-7KhwLPAMFHeHyCgBd4h6BOaJU3VfBbCivDc6T3JWNRpLusCP_q0Hal57wTHF3zHBlRfx2CyvX1dYld1ySItDxUiiKinqLkwWYHOyXQHuJbIIYkGc0ifZkLaNSVlfSemKw6IRX3z2VRC2YFuOGsNvfU030CIcLUnXmqi99nitnEDSt8FssXlCfRPojx76WK7LTJ3PLer4FUDFklCjdk45VAU2K7CNwqpY4tSrfcQdBbDp1BUTRpuR3Mk_TBu3JsHVSU9Dg-agTSOarPwPhpDCEJPFsBNWzy0nyHPyfc_jFIxJdmV277TeSpxAaNmOvmLvwZzt_U-6d_pJv1QucoV4FHWETALJOkKC4ie8owUtOu0vHD70UhAM0rXXI2ECGXd25JrvKIlHjD7CFCjpnJDyzF2iSZtlO_LyJ8nlYVGY0cRHiqX5sPyIRIp36GARC2qG7FG2MfOi-ipPS1E38_VdnvyrbV8aJxt-EuWIrcQpByY07D6mnI79eDptvw898Y5hG4Nx990cCN0jShIsrKkivwoI76I8yh0URppB59ns0je0S9dx9kc1Wi6-Y6elJwbgI3ADQiaE4CvbyHPtwevvQ7o9BC475MrEEmHm8eYec8NxjY_LlXW6Vj1ZfPEJKKyzZxv0Zru13RQyeGDt9M9SEQzUaILFCPwTp-SPBvhRnhbO87j1HmWSRPN0YOOlUdJkBUdSumiAoIXlaT_Gdcku96Pyrhg_e5DqiWEUxk6YSfoYkE0G7Gc80W3G9otS3NGXKhWbugMaG_8665yKVItYTPwEP2C1ZqEsKtH4bwuMmovDz9yqHbo5yNfD4hC1v4PRILBITd2e5XDq9nWVdoJBkP8A.ZdAelcOkNx3eDO6jonbFgNBvPlnI1YQbdMfVPlH0J-g";

  return headers;
}

export function getClientApi(provider: ServiceProvider): ClientApi {
  switch (provider) {
    case ServiceProvider.Google:
      return new ClientApi(ModelProvider.GeminiPro);
    case ServiceProvider.Anthropic:
      return new ClientApi(ModelProvider.Claude);
    case ServiceProvider.Baidu:
      return new ClientApi(ModelProvider.Ernie);
    case ServiceProvider.ByteDance:
      return new ClientApi(ModelProvider.Doubao);
    case ServiceProvider.Alibaba:
      return new ClientApi(ModelProvider.Qwen);
    case ServiceProvider.Tencent:
      return new ClientApi(ModelProvider.Hunyuan);
    case ServiceProvider.Moonshot:
      return new ClientApi(ModelProvider.Moonshot);
    case ServiceProvider.Iflytek:
      return new ClientApi(ModelProvider.Iflytek);
    case ServiceProvider.DeepSeek:
      return new ClientApi(ModelProvider.DeepSeek);
    case ServiceProvider.XAI:
      return new ClientApi(ModelProvider.XAI);
    case ServiceProvider.ChatGLM:
      return new ClientApi(ModelProvider.ChatGLM);
    case ServiceProvider.SiliconFlow:
      return new ClientApi(ModelProvider.SiliconFlow);
    default:
      return new ClientApi(ModelProvider.GPT);
  }
}
