import { ISession } from "../client/smarties";
import { createEmptyMask } from "../store/mask";
import { ChatSession } from "../store/new-chat";

export const JSONParse = (
  data: string,
  expectedValueType: "arr" | "obj" | "mask",
): any => {
  if (!data)
    return expectedValueType === "arr"
      ? []
      : expectedValueType === "obj"
      ? { tokenCount: 0, wordCount: 0, charCount: 0 }
      : createEmptyMask();

  try {
    return JSON.parse(data);
  } catch (error) {
    return expectedValueType === "arr"
      ? []
      : expectedValueType === "obj"
      ? { tokenCount: 0, wordCount: 0, charCount: 0 }
      : createEmptyMask();
  }
};

export const JSONStringify = (data: any): string | null => {
  if (data === null || data === undefined) return null;

  try {
    return JSON.stringify(data);
  } catch (error) {
    return null;
  }
};

export const ConvertSession = (
  type: "add" | "update" | "delete",
  session: ChatSession,
): Partial<ISession> => {
  switch (type) {
    case "add":
      return {
        sessionId: 0,
        id: session.id,
        topic: session.topic,
        memoryPrompt: session.memoryPrompt,
        messages: JSONStringify(session.messages) ?? "",
        stat: JSONStringify(session.stat) ?? "",
        lastUpdate: session.lastUpdate,
        lastSummarizeIndex: session.lastSummarizeIndex,
        clearContextIndex: null,
        mask: JSONStringify(session.mask) ?? "",
        isDeleted: false,
      };
    case "update":
      return {
        sessionId: session.sessionId!,
        id: session.id,
        topic: session.topic,
        memoryPrompt: session.memoryPrompt,
        messages: JSONStringify(session.messages) ?? "",
        stat: JSONStringify(session.stat) ?? "",
        lastUpdate: session.lastUpdate,
        lastSummarizeIndex: session.lastSummarizeIndex,
        clearContextIndex: session.clearContextIndex,
        mask: JSONStringify(session.mask) ?? "",
        isDeleted: session.isDeleted!,
      };
    case "delete": {
      return {
        sessionId: session.sessionId!,
        id: session.id,
        topic: session.topic,
        memoryPrompt: session.memoryPrompt,
        messages: JSONStringify(session.messages) ?? "",
        stat: JSONStringify(session.stat) ?? "",
        lastUpdate: session.lastUpdate,
        lastSummarizeIndex: session.lastSummarizeIndex,
        clearContextIndex: session.clearContextIndex,
        mask: JSONStringify(session.mask) ?? "",
        isDeleted: true,
      };
    }
  }
};
