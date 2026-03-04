import { getClientConfig } from "../config/client";
import { SAAS_CHAT_UTM_URL } from "@/app/constant";
const isApp = !!getClientConfig()?.isApp;

const tw = {
  WIP: "此功能仍在開發中……",
  Error: {
    Unauthorized: isApp
      ? `😆 對話遇到了一些問題，不用慌:
    \\ 1️⃣ 想要無須設定開箱即用，[點選這裡立刻開啟對話 🚀](${SAAS_CHAT_UTM_URL})
    \\ 2️⃣ 如果你想消耗自己的 OpenAI 資源，點選[這裡](/#/settings)修改設定 ⚙️`
      : `😆 對話遇到了一些問題，不用慌:
    \ 1️⃣ 想要無須設定開箱即用，[點選這裡立刻開啟對話 🚀](${SAAS_CHAT_UTM_URL})
    \ 2️⃣ 如果你正在使用私有部署版本，點選[這裡](/#/auth)輸入存取金鑰 🔑
    \ 3️⃣ 如果你想消耗自己的 OpenAI 資源，點選[這裡](/#/settings)修改設定 ⚙️
 `,
  },

  Auth: {
    Title: "需要密碼",
    Tips: "管理員開啟了密碼驗證，請在下方填入存取密碼",
    SubTips: "或者輸入你的 OpenAI 或 Google API 金鑰",
    Input: "在此處填寫存取密碼",
    Confirm: "確認",
    Later: "稍候再說",
    Return: "返回",
    SaasTips: "設定太麻煩，想要立即使用",
    TopTips:
      "🥳 NextChat AI 首發優惠，立刻解鎖 OpenAI o1, GPT-4o, Claude-3.5 等最新的大型語言模型",
  },
  ChatItem: {
    ChatItemCount: `{{count}} 則對話`,
  },
  Chat: {
    SubTitle: `您已經與 ChatGPT 進行了 {{count}} 則對話`,
    EditMessage: {
      Title: "編輯訊息記錄",
      Topic: {
        Title: "聊天主題",
        SubTitle: "更改目前聊天主題",
      },
    },
    Actions: {
      ChatList: "檢視訊息列表",
      CompressedHistory: "檢視壓縮後的歷史 Prompt",
      Export: "匯出聊天紀錄",
      Copy: "複製",
      Stop: "停止",
      Retry: "重試",
      Pin: "固定",
      PinToastContent: "已將 1 條對話固定至預設提示詞",
      PinToastAction: "檢視",
      Delete: "刪除",
      Edit: "編輯",
      RefreshTitle: "重新整理標題",
      RefreshToast: "已傳送重新整理標題請求",
    },
    Commands: {
      new: "新建聊天",
      newm: "從角色範本新建聊天",
      next: "下一個聊天",
      prev: "上一個聊天",
      clear: "清除上下文",
      del: "刪除聊天",
    },
    InputActions: {
      Stop: "停止回應",
      ToBottom: "移至最新",
      Theme: {
        auto: "自動主題",
        light: "亮色模式",
        dark: "深色模式",
      },
      Prompt: "快捷指令",
      Masks: "所有角色範本",
      Clear: "清除聊天",
      Settings: "對話設定",
      UploadImage: "上傳圖片",
      UploadFile: "上傳檔案",
      OnlineSearch: "聯網搜索",
    },
    Rename: "重新命名對話",
    Typing: "正在輸入…",
    Input: "輸入訊息後，按下 {{submitKey}} 鍵即可傳送",
    AppInput: "開始聊天吧～",
    Send: "傳送",
    Config: {
      Reset: "重設",
      SaveAs: "另存新檔",
    },
    IsContext: "預設提示詞",
    ShortcutKey: {
      Title: "鍵盤快捷方式",
      newChat: "開啟新聊天",
      focusInput: "聚焦輸入框",
      copyLastMessage: "複製最後一個回覆",
      copyLastCode: "複製最後一個程式碼區塊",
      showShortcutKey: "顯示快捷方式",
      clearContext: "清除上下文",
    },
    Metis: {
      Title: "Hi~我是METIS",
      Content: "我可以幫你搜索、答疑，請把你的疑問交給我吧~",
    },
    UploadImageTips: "最多只允許上傳三張圖片",
    UploadFileTips: "最多只允許上傳100個附件",
    FileTooLarge: "檔案超過5MB限制",
    UploadFailed: "上傳失敗",
    Voice: {
      HoldToTalk: "按住說話",
      ReleaseToSendSlideUpToCancel: "鬆開發送，上滑取消",
      ReleaseToCancel: "鬆手取消",
      Processing: "處理中",
    },
  },
  Export: {
    Title: "將聊天記錄匯出為 Markdown",
    Copy: "複製全部",
    Download: "下載檔案",
    Share: "分享到 ShareGPT",
    MessageFromYou: "來自您的訊息",
    MessageFromChatGPT: "來自 ChatGPT 的訊息",
    Format: {
      Title: "匯出格式",
      SubTitle: "可以匯出 Markdown 文字檔或者 PNG 圖片",
    },
    IncludeContext: {
      Title: "包含角色範本上下文",
      SubTitle: "是否在訊息中顯示角色範本上下文",
    },
    Steps: {
      Select: "選取",
      Preview: "預覽",
    },
    Image: {
      Toast: "正在產生截圖",
      Modal: "長按或按右鍵儲存圖片",
    },
  },
  Select: {
    Search: "查詢訊息",
    All: "選取全部",
    Latest: "最近幾條",
    Clear: "清除選取",
  },
  Memory: {
    Title: "上下文記憶 Prompt",
    EmptyContent: "尚未記憶",
    Copy: "複製全部",
    Send: "傳送記憶",
    Reset: "重設對話",
    ResetConfirm: "重設後將清除目前對話記錄以及歷史記憶，確認重設？",
  },
  Home: {
    NewChat: "開新對話",
    DeleteChat: "確定要刪除選取的對話嗎？",
    DeleteToast: "已刪除對話",
    Revert: "撤銷",
    History: "歷史對話",
  },
  Settings: {
    Title: "設定",
    SubTitle: "設定選項",

    Danger: {
      Reset: {
        Title: "重設所有設定",
        SubTitle: "重設所有設定項回預設值",
        Action: "立即重設",
        Confirm: "確認重設所有設定？",
      },
      Clear: {
        Title: "清除所有資料",
        SubTitle: "清除所有聊天、設定資料",
        Action: "立即清除",
        Confirm: "確認清除所有聊天、設定資料？",
      },
    },
    Lang: {
      Name: "Language", // ATTENTION: if you wanna add a new translation, please do not translate this value, leave it as `Language`
      All: "所有語言",
    },
    Avatar: "大頭貼",
    FontSize: {
      Title: "字型大小",
      SubTitle: "聊天內容的字型大小",
    },
    FontFamily: {
      Title: "聊天字型",
      SubTitle: "聊天內容的字型，若留空則套用全域預設字型",
      Placeholder: "字型名稱",
    },
    InjectSystemPrompts: {
      Title: "匯入系統提示",
      SubTitle: "強制在每個請求的訊息列表開頭新增一個模擬 ChatGPT 的系統提示",
    },
    InputTemplate: {
      Title: "使用者輸入預處理",
      SubTitle: "使用者最新的一則訊息會填充到此範本",
    },

    Update: {
      Version: `目前版本：{{x}}`,
      IsLatest: "已是最新版本",
      CheckUpdate: "檢查更新",
      IsChecking: "正在檢查更新...",
      FoundUpdate: "發現新版本：{{x}}",
      GoToUpdate: "前往更新",
    },
    SendKey: "傳送鍵",
    Theme: "主題",
    TightBorder: "緊湊邊框",
    SendPreviewBubble: {
      Title: "預覽氣泡",
      SubTitle: "在預覽氣泡中預覽 Markdown 內容",
    },
    AutoGenerateTitle: {
      Title: "自動產生標題",
      SubTitle: "根據對話內容產生合適的標題",
    },
    Sync: {
      CloudState: "雲端資料",
      NotSyncYet: "還沒有進行過同步",
      Success: "同步成功",
      Fail: "同步失敗",

      Config: {
        Modal: {
          Title: "設定雲端同步",
          Check: "檢查可用性",
        },
        SyncType: {
          Title: "同步類型",
          SubTitle: "選擇偏好的同步伺服器",
        },
        Proxy: {
          Title: "啟用代理伺服器",
          SubTitle: "在瀏覽器中同步時，啟用代理伺服器以避免跨域限制",
        },
        ProxyUrl: {
          Title: "代理伺服器位置",
          SubTitle: "僅適用於本專案內建的跨域代理",
        },

        WebDav: {
          Endpoint: "WebDAV 位置",
          UserName: "使用者名稱",
          Password: "密碼",
        },

        UpStash: {
          Endpoint: "UpStash Redis REST Url",
          UserName: "備份名稱",
          Password: "UpStash Redis REST Token",
        },
      },

      LocalState: "本機資料",
      Overview:
        "{{chat}} 次對話，{{message}} 則訊息，{{prompt}} 條提示詞，{{mask}} 個角色範本",
      ImportFailed: "匯入失敗",
    },
    Mask: {
      Splash: {
        Title: "角色範本啟動頁面",
        SubTitle: "新增聊天時，呈現角色範本啟動頁面",
      },
      Builtin: {
        Title: "隱藏內建角色範本",
        SubTitle: "在所有角色範本列表中隱藏內建角色範本",
      },
    },
    Prompt: {
      Disable: {
        Title: "停用提示詞自動補齊",
        SubTitle: "在輸入框開頭輸入 / 即可觸發自動補齊",
      },
      List: "自訂提示詞列表",
      ListCount: "內建 {{builtin}} 條，使用者自訂 {{custom}} 條",
      Edit: "編輯",
      Modal: {
        Title: "提示詞列表",
        Add: "新增一則",
        Search: "搜尋提示詞",
      },
      EditModal: {
        Title: "編輯提示詞",
      },
    },
    HistoryCount: {
      Title: "附帶歷史訊息數",
      SubTitle: "每次請求附帶的歷史訊息數",
    },
    CompressThreshold: {
      Title: "歷史訊息長度壓縮閾值",
      SubTitle: "當未壓縮的歷史訊息超過該值時，將進行壓縮",
    },

    Usage: {
      Title: "帳戶餘額",
      SubTitle: "本月已使用 ${{used}}，訂閱總額 ${{total}}",
      IsChecking: "正在檢查…",
      Check: "重新檢查",
      NoAccess: "輸入 API Key 檢視餘額",
    },

    Access: {
      SaasStart: {
        Title: "使用 NextChat AI",
        Label: "(性價比最高的方案)",
        SubTitle:
          "由 NextChat 官方維護，無須設定開箱即用，支援 OpenAI o1、GPT-4o、Claude-3.5 等最新的大型語言模型",
        ChatNow: "立刻開始對話",
      },

      AccessCode: {
        Title: "存取密碼",
        SubTitle: "管理員已開啟加密存取",
        Placeholder: "請輸入存取密碼",
      },
      CustomEndpoint: {
        Title: "自訂 API 端點 (Endpoint)",
        SubTitle: "是否使用自訂 Azure 或 OpenAI 服務",
      },
      Provider: {
        Title: "模型供應商",
        SubTitle: "切換不同的服務供應商",
      },
      OpenAI: {
        ApiKey: {
          Title: "API Key",
          SubTitle: "使用自訂 OpenAI Key 繞過密碼存取限制",
          Placeholder: "OpenAI API Key",
        },

        Endpoint: {
          Title: "API 端點 (Endpoint) 位址",
          SubTitle: "除預設位址外，必須包含 http(s)://",
        },
      },
      Azure: {
        ApiKey: {
          Title: "API 金鑰",
          SubTitle: "使用自訂 Azure Key 繞過密碼存取限制",
          Placeholder: "Azure API Key",
        },

        Endpoint: {
          Title: "API 端點 (Endpoint) 位址",
          SubTitle: "範例：",
        },

        ApiVerion: {
          Title: "API 版本 (azure api version)",
          SubTitle: "指定一個特定的 API 版本",
        },
      },
      Anthropic: {
        ApiKey: {
          Title: "API 金鑰",
          SubTitle: "從 Anthropic AI 取得您的 API 金鑰",
          Placeholder: "Anthropic API Key",
        },

        Endpoint: {
          Title: "端點位址",
          SubTitle: "範例：",
        },

        ApiVerion: {
          Title: "API 版本 (claude api version)",
          SubTitle: "指定一個特定的 API 版本",
        },
      },
      Google: {
        ApiKey: {
          Title: "API 金鑰",
          SubTitle: "從 Google AI 取得您的 API 金鑰",
          Placeholder: "輸入您的 Google AI Studio API 金鑰",
        },

        Endpoint: {
          Title: "端點位址",
          SubTitle: "範例：",
        },

        ApiVersion: {
          Title: "API 版本（僅適用於 gemini-pro）",
          SubTitle: "選擇一個特定的 API 版本",
        },
      },
      CustomModel: {
        Title: "自訂模型名稱",
        SubTitle: "增加自訂模型可選擇項目，使用英文逗號隔開",
      },
    },

    Model: "模型 (model)",
    CompressModel: {
      Title: "壓縮模型",
      SubTitle: "用於壓縮歷史記錄的模型",
    },
    Temperature: {
      Title: "隨機性 (temperature)",
      SubTitle: "值越大，回應越隨機",
    },
    TopP: {
      Title: "核心採樣 (top_p)",
      SubTitle: "與隨機性類似，但不要和隨機性一起更改",
    },
    MaxTokens: {
      Title: "單次回應限制 (max_tokens)",
      SubTitle: "單次互動所用的最大 Token 數",
    },
    PresencePenalty: {
      Title: "話題新穎度 (presence_penalty)",
      SubTitle: "值越大，越有可能拓展到新話題",
    },
    FrequencyPenalty: {
      Title: "頻率懲罰度 (frequency_penalty)",
      SubTitle: "值越大，越有可能降低重複字詞",
    },
  },
  Store: {
    DefaultTopic: "新的對話",
    BotHello: "請問需要我的協助嗎？",
    Error: "出錯了，請稍後再嘗試",
    Prompt: {
      History: "這是 AI 與使用者的歷史聊天總結，作為前情提要：{{content}}",
      Topic:
        "Use the language used by the user (e.g. en for english conversation, zh-hant for chinese conversation, etc.) to generate a title (at most 6 words) summarizing our conversation without any lead-in, quotation marks, preamble like 'Title:', direct text copies, single-word replies, quotation marks, translations, or brackets. Remove enclosing quotation marks. The title should make third-party grasp the essence of the conversation in first sight.",
      Summarize:
        "Use the language used by the user (e.g. en-us for english conversation, zh-hant for chinese conversation, etc.) to summarise the conversation in at most 200 words. The summary will be used as prompt for you to continue the conversation in the future.",
    },
  },
  Copy: {
    Success: "已複製到剪貼簿中",
    Failed: "複製失敗，請賦予剪貼簿權限",
  },
  Download: {
    Success: "內容已下載到您的目錄。",
    Failed: "下載失敗。",
  },
  Context: {
    Toast: "已設定 {{x}} 條前置上下文",
    Edit: "前置上下文和歷史記憶",
    Add: "新增一則",
    Clear: "上下文已清除",
    Revert: "恢復上下文",
  },
  Plugin: { Name: "外掛" },
  FineTuned: { Sysmessage: "你是一個助手" },
  Mask: {
    Name: "角色範本",
    Page: {
      Title: "預設角色角色範本",
      SubTitle: "{{count}} 個預設角色定義",
      Search: "搜尋角色角色範本",
      Create: "新增",
    },
    Item: {
      Info: "包含 {{count}} 條預設對話",
      Chat: "對話",
      View: "檢視",
      Edit: "編輯",
      Delete: "刪除",
      DeleteConfirm: "確認刪除？",
    },
    EditModal: {
      Title: "編輯預設角色範本",
      ReadOnlyTitle: "編輯預設角色範本 （唯讀）",
      Download: "下載預設值",
      Clone: "以此預設值建立副本",
    },
    Config: {
      Avatar: "角色頭像",
      Name: "角色名稱",
      Sync: {
        Title: "使用全域設定",
        SubTitle: "目前對話是否使用全域模型設定",
        Confirm: "目前對話的自訂設定將會被自動覆蓋，確認啟用全域設定？",
      },
      HideContext: {
        Title: "隱藏預設對話",
        SubTitle: "隱藏後預設對話不會出現在聊天介面",
      },
      Share: {
        Title: "分享此角色範本",
        SubTitle: "產生此角色範本的直達連結",
        Action: "複製連結",
      },
    },
  },
  SearchChat: {
    Name: "搜尋聊天記錄",
    Page: {
      Title: "搜尋聊天記錄",
      Search: "輸入搜尋關鍵詞",
      NoResult: "沒有找到結果",
      NoData: "沒有資料",
      Loading: "載入中",

      SubTitle: (count: number) => `找到 ${count} 條結果`,
    },
    Item: {
      View: "檢視",
    },
  },
  NewChat: {
    Return: "返回",
    Skip: "跳過",
    NotShow: "不再顯示",
    ConfirmNoShow: "確認停用？停用後可以隨時在設定中重新啟用。",
    Title: "挑選一個角色範本",
    SubTitle: "現在開始，與角色範本背後的靈魂思維碰撞",
    More: "搜尋更多",
  },
  URLCommand: {
    Code: "偵測到連結中已經包含存取密碼，是否自動填入？",
    Settings: "偵測到連結中包含了預設設定，是否自動填入？",
  },
  UI: {
    Confirm: "確認",
    Cancel: "取消",
    Close: "關閉",
    Create: "新增",
    Edit: "編輯",
    Export: "匯出",
    Import: "匯入",
    Sync: "同步",
    Config: "設定",
  },
  Exporter: {
    Description: {
      Title: "只有清除上下文之後的訊息會被顯示",
    },
    Model: "模型",
    Messages: "訊息",
    Topic: "主題",
    Time: "時間",
  },
  Kid: {
    NoKidText: "你還沒有 AI Kid 哦~",
    InstructionText: "點擊下方「+」召喚屬於自己的 AI Kid 吧~",
    Create: "創建",
  },
  SelectVoice: {
    Title: "選擇聲音",
    Recommended: "推薦",
    Female: "女聲",
    Male: "男聲",
    Dialect: "方言",
    MatureMale: "成熟男聲",
    GentleFemale: "溫柔女聲",
    YoungMale: "男 | 青年",
    YoungFemale: "女 | 青年",
    Confirm: "完成",
    Selected: "已選擇",
  },
  AddOrUpdateAiKid: {
    Create: "創建",
    Edit: "編輯",
    Name: "名稱",
    VoicePreference: "音色偏好",
    InputName: "輸入名稱",
    CreateCustomVoice: "創建專屬聲音",
    AbilitySettings: "能力設定",
    Polish: "潤色",
    Introduction: "介紹",
    IntroduceYourAiKid: "介紹你的AI KID",
    OpeningLine: "開場白",
    OpeningLineDescription: "將作為開啟聊天的第一句話",
    CreateMyAiKid: "創建 My AI Kid",
    Save: "保存",
    NotImageTypeError: "你選擇的不是圖片類型！",
    NoNameTips: "請輸入名稱",
  },
  Realtime: {
    StartSpeaking: "你可以開始說話",
    Listening: "正在聽…",
    Interrupt: "可以隨時說話打斷我",
    ConnectionFailed: "連接失敗，請重試！",
    Connecting: "正在連接...",
    PermissionPrompt: "當前麥克風獲取失敗，請手動開啟麥克風權限",
  },
};

type DeepPartial<T> = T extends object
  ? {
      [P in keyof T]?: DeepPartial<T[P]>;
    }
  : T;

export type LocaleType = typeof tw;
export type PartialLocaleType = DeepPartial<typeof tw>;

export default tw;
// Translated by @chunkiuuu, feel free the submit new pr if there are typo/incorrect translations :D
