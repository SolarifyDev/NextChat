import { useState, useRef, useCallback } from "react";
import ErrorBoundary from "./error";
import styles from "./mask.module.scss";
import { useNavigate } from "react-router-dom";
import { IconButton } from "./button";
import CloseIcon from "../icons/close.svg";
import EyeIcon from "../icons/eye.svg";
import { Path } from "../constant";

import { useTranslation } from "react-i18next";
import { GetHistory, getHeaders } from "../client/smarties";
import { ChatSession, useEnhanceChatStore } from "../store/enhance-chat";
import { JSONParse } from "../utils/convert";

type Item = {
  id: number;
  name: string;
  content: string;
  sessionId: number;
};

export function SearchChatPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // const chatStore = useChatStore();
  const chatStore = useEnhanceChatStore();

  // const sessions = chatStore.sessions;
  const selectSession = chatStore.getCurrentSession;

  const [searchResults, setSearchResults] = useState<Item[]>([]);

  const previousValueRef = useRef<string>("");
  const searchInputRef = useRef<HTMLInputElement>(null);
  const doSearch = useCallback(async (text: string) => {
    const lowerCaseText = text.toLowerCase();
    const results: Item[] = [];

    try {
      const data = await GetHistory(await getHeaders(), true);

      const sessions: ChatSession[] = data.map((item) => ({
        ...item,
        messages: JSONParse(item.messages, "arr"),
        stat: JSONParse(item.stat, "obj"),
        mask: JSONParse(item.mask, "mask"),
      }));

      sessions.forEach((session, index) => {
        const fullTextContents: string[] = [];

        session.messages.forEach((message) => {
          const content = message.content as string;
          if (!content.toLowerCase || content === "") return;
          const lowerCaseContent = content.toLowerCase();

          // full text search
          let pos = lowerCaseContent.indexOf(lowerCaseText);
          while (pos !== -1) {
            const start = Math.max(0, pos - 35);
            const end = Math.min(
              content.length,
              pos + lowerCaseText.length + 35,
            );
            fullTextContents.push(content.substring(start, end));
            pos = lowerCaseContent.indexOf(
              lowerCaseText,
              pos + lowerCaseText.length,
            );
          }
        });

        if (fullTextContents.length > 0) {
          results.push({
            id: index,
            name: session.topic,
            content: fullTextContents.join("... "), // concat content with...
            sessionId: session.sessionId!,
          });
        }
      });
    } catch {
      return [];
    }

    // sort by length of matching content
    results.sort((a, b) => b.content.length - a.content.length);

    return results;
  }, []);

  // useEffect(() => {
  //   const intervalId = setInterval(async () => {
  //     if (searchInputRef.current) {
  //       const currentValue = searchInputRef.current.value;
  //       if (currentValue !== previousValueRef.current) {
  //         if (currentValue.length > 0) {
  //           const result = await doSearch(currentValue);
  //           setSearchResults(result);
  //         }
  //         previousValueRef.current = currentValue;
  //       }
  //     }
  //   }, 1000);

  //   // Cleanup the interval on component unmount
  //   return () => clearInterval(intervalId);
  // }, [doSearch]);

  return (
    <ErrorBoundary>
      <div className={styles["mask-page"]}>
        {/* header */}
        <div className="window-header">
          <div className="window-header-title">
            <div className="window-header-main-title">
              {/* {Locale.SearchChat.Page.Title} */}
              {t("SearchChat.Page.Title")}
            </div>
            <div className="window-header-submai-title">
              {/* {Locale.SearchChat.Page.SubTitle(searchResults.length)} */}
              {t("SearchChat.Page.SubTitle", { count: searchResults.length })}
            </div>
          </div>

          <div className="window-actions">
            <div className="window-action-button">
              <IconButton
                icon={<CloseIcon />}
                bordered
                onClick={() => navigate(-1)}
              />
            </div>
          </div>
        </div>

        <div className={styles["mask-page-body"]}>
          <div className={styles["mask-filter"]}>
            {/**搜索输入框 */}
            <input
              type="text"
              className={styles["search-bar"]}
              // placeholder={Locale.SearchChat.Page.Search}
              placeholder={t("SearchChat.Page.Search")}
              autoFocus
              ref={searchInputRef}
              onKeyDown={async (e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  const searchText = e.currentTarget.value;
                  if (searchText.length > 0) {
                    const result = await doSearch(searchText);
                    setSearchResults(result);
                  }
                }
              }}
            />
          </div>

          <div>
            {searchResults.map((item) => (
              <div
                className={styles["mask-item"]}
                key={item.id}
                onClick={() => {
                  navigate(Path.Chat);
                  selectSession(item.sessionId);
                }}
                style={{ cursor: "pointer" }}
              >
                {/** 搜索匹配的文本 */}
                <div className={styles["mask-header"]}>
                  <div className={styles["mask-title"]}>
                    <div className={styles["mask-name"]}>{item.name}</div>
                    {item.content.slice(0, 70)}
                  </div>
                </div>
                {/** 操作按钮 */}
                <div className={styles["mask-actions"]}>
                  <IconButton
                    icon={<EyeIcon />}
                    // text={Locale.SearchChat.Item.View}
                    text={t("SearchChat.Item.View")}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}
