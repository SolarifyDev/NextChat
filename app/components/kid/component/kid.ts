import { Lang } from "@/app/locales";

interface KidNamelocal {
  name: string;
  translations: Partial<Record<Lang, string>>;
}

export const KidNamelocals: KidNamelocal[] = [
  {
    name: "Video to Text",
    translations: {
      cn: "实现音视频转写成文字，生成摘要，支持粤语、普通话、英语、西班牙语。",
      tw: "實現音視頻轉寫成文字，生成摘要，支持粵語、普通話、英語、西班牙語。",
      en: "Convert audio and video to text, generate summaries, and support Cantonese, Mandarin, English, and Spanish.",
      es: "Convierte audio y video en texto, genera resúmenes y es compatible con cantonés, mandarín, inglés y español.",
    },
  },
];
