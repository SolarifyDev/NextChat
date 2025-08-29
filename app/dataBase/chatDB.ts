import { ChatSession } from "../store/new-chat";

const DB_NAME = "ChatDB-Ted";
const STORE_NAME = "conversations";

class ChatDB {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, 1);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: "id" });
          store.createIndex("userId", "userId", { unique: false });
        }
      };
    });
  }

  async saveConversation(conversation: ChatSession): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(conversation);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async deleteConversation(id: string, userId: number): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(id);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const record = request.result;
        if (record && record.userId === userId) {
          // 两者都匹配才删除
          const deleteRequest = store.delete(id);
          deleteRequest.onerror = () => reject(deleteRequest.error);
          deleteRequest.onsuccess = () => resolve();
        } else {
          // 找不到或 userId 不匹配，不删除
          resolve();
        }
      };
    });
  }

  async getConversation(
    id: string,
    userId: number,
  ): Promise<ChatSession | null> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], "readonly");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(id);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const record = request.result;
        if (record && record.userId === userId) {
          resolve(record);
        } else {
          resolve(null); // id 存在但 userId 不匹配，返回 null
        }
      };
    });
  }
}

const chatDB = new ChatDB();

export const saveConversation = (conversation: ChatSession): Promise<void> =>
  chatDB.saveConversation(conversation);

export const getConversation = (
  id: string,
  userId: number,
): Promise<ChatSession | null> => chatDB.getConversation(id, userId);

export const deleteConversation = (id: string, userId: number): Promise<void> =>
  chatDB.deleteConversation(id, userId);
