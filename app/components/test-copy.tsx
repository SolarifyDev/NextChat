import { useEffect, useMemo, useRef, useState } from "react";
import { useAssistant } from "../hooks/useAssistant";
import { useMicrophone } from "../hooks/useMicrophone";
import { SessionStatus, TranscriptItem } from "../typing";
import { useHandleServerEvent } from "../hooks/useHandleServerEvent";
import { createRealtimeConnection } from "../lib/realtimeConnection";
import { useDebounceFn } from "ahooks";
import { clone } from "lodash-es";

import styles from "./test.module.scss";
import { useTranscript } from "../contexts/TranscriptContext";
import { Markdown } from "./markdown";
import { Button, Select } from "antd";
import { showToast } from "./ui-lib";

export function Index() {
  const { transcriptItems, setTranscriptItems } = useTranscript();
  const { audioTracks, isMicrophoneLoading, startMicrophone, stopMicrophone } =
    useMicrophone();

  const {
    assistants,
    isAssistantLoading,
    selectedAssistant,
    getAssistants,
    selectAssistant,
  } = useAssistant();

  const [sessionStatus, setSessionStatus] =
    useState<SessionStatus>("DISCONNECTED");

  // 当前获取的本地音频
  const mediaAudioTrackRef = useRef<MediaStreamTrack | null>(null);

  // rtc数据
  const [dataChannel, setDataChannel] = useState<RTCDataChannel | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const dcRef = useRef<RTCDataChannel | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const sessionRef = useRef<Record<string, any>>({});

  // 开麦闭麦关键
  const [isPTTActive, setIsPTTActive] = useState<boolean>(false);

  // 滚动容器
  const transcriptRef = useRef<HTMLDivElement | null>(null);

  const [prevLogs, setPrevLogs] = useState<TranscriptItem[]>([]);

  // 字幕
  const [isShowSubtitles, setIsShowSubtitles] = useState<boolean>(false);

  // 通信事件----------
  useEffect(() => {
    if (sessionStatus === "CONNECTED") {
      console.log(
        `updatingSession, isPTTACtive=${isPTTActive} sessionStatus=${sessionStatus}`,
      );
      updateSession();
    }
  }, [isPTTActive]);

  const sendClientEvent = (eventObj: any, eventNameSuffix = "") => {
    if (dcRef.current && dcRef.current.readyState === "open") {
      dcRef.current.send(JSON.stringify(eventObj));
    } else {
      console.error(
        "Failed to send message - no data channel available",
        eventObj,
      );
    }
  };

  const handleServerEventRef = useHandleServerEvent({
    setSessionStatus,
    sendClientEvent,
  });

  const { run: connectToRealtime } = useDebounceFn(
    async () => {
      if (sessionStatus !== "DISCONNECTED") return;
      setSessionStatus("CONNECTING");

      console.log("ininin");

      try {
        if (!audioElementRef.current) {
          audioElementRef.current = document.createElement("audio");
        }
        audioElementRef.current.autoplay = true;

        const connection = await createRealtimeConnection(
          audioElementRef,
          selectedAssistant ? selectedAssistant.id : null,
          mediaAudioTrackRef.current!,
        );

        if (!connection) {
          setSessionStatus("DISCONNECTED");

          return;
        }

        const { pc, dc, session } = connection;
        pcRef.current = pc;
        dcRef.current = dc;
        sessionRef.current = session;

        dc.addEventListener("open", () => {});
        dc.addEventListener("close", () => {});
        dc.addEventListener("error", (err: any) => {});
        dc.addEventListener("message", (e: MessageEvent) => {
          handleServerEventRef.current(JSON.parse(e.data));
        });

        setDataChannel(dc);
      } catch (err) {
        console.error("Error connecting to realtime:", err);
        setSessionStatus("DISCONNECTED");
      }
    },
    {
      wait: 200,
    },
  );

  const { run: onToggleConnection } = useDebounceFn(
    () => {
      if (sessionStatus === "CONNECTED" || sessionStatus === "CONNECTING") {
        disconnectFromRealtime();
        setSessionStatus("DISCONNECTED");
      } else {
        connectToRealtime();
      }
    },
    {
      wait: 200,
    },
  );

  const disconnectFromRealtime = () => {
    if (pcRef.current) {
      pcRef.current.getSenders().forEach((sender) => {
        if (sender.track) {
          sender.track.stop();
        }
      });

      pcRef.current.close();
      pcRef.current = null;
    }
    dcRef.current = null;
    setDataChannel(null);
    setTranscriptItems([]);

    setSessionStatus("DISCONNECTED");
  };

  const updateSession = (shouldTriggerResponse: boolean = false) => {
    sendClientEvent(
      { type: "input_audio_buffer.clear" },
      "clear audio buffer on session update",
    );

    const session = clone(sessionRef.current);

    if (isPTTActive) {
      session["turn_detection"] = null;
    }

    const sessionUpdateEvent = {
      type: "session.update",
      session: session,
    };

    sendClientEvent(sessionUpdateEvent);
  };

  // ----------

  function scrollToBottom() {
    if (transcriptRef.current) {
      transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;
    }
  }

  useEffect(() => {
    const hasNewMessage = transcriptItems.length > prevLogs.length;
    const hasUpdatedMessage = transcriptItems.some((newItem, index) => {
      const oldItem = prevLogs[index];
      return (
        oldItem &&
        (newItem.title !== oldItem.title || newItem.data !== oldItem.data)
      );
    });

    if (hasNewMessage || hasUpdatedMessage) {
      scrollToBottom();
    }

    setPrevLogs(transcriptItems);
  }, [transcriptItems]);

  useEffect(() => {
    if (sessionStatus === "DISCONNECTED") {
      startMicrophone(mediaAudioTrackRef);
      getAssistants();
    }
  }, [sessionStatus]);

  useEffect(() => {
    return () => {
      stopMicrophone();
      disconnectFromRealtime();
    };
  }, []);

  const renderAssistantList = useMemo(() => {
    return assistants.map((item) => ({
      value: item.id,
      label: item.name,
    }));
  }, [assistants]);

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-start",
      }}
    >
      <div className={styles["header"]}>
        <div
          style={{
            height: "85vh",
            display: "flex",
            flexDirection: "column",
            flexGrow: 1,
            flexShrink: 1,
            gap: "1rem",
          }}
        >
          {sessionStatus === "DISCONNECTED" ? (
            <div
              style={{
                width: "100%",
                height: "100%",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: "12px",
              }}
            >
              <div
                style={{
                  fontSize: "24px",
                }}
              >
                选择助理后连接或按默认配置连接
              </div>
              <div>
                <span>助理</span>{" "}
                <Select
                  value={selectedAssistant?.id || undefined}
                  style={{ width: 150 }}
                  onChange={(e) => {
                    selectAssistant(
                      !e
                        ? null
                        : assistants.find((item) => item.id === e) || null,
                    );
                  }}
                  allowClear
                  options={renderAssistantList}
                  loading={isAssistantLoading}
                  disabled={isAssistantLoading}
                  placeholder="选填"
                />
              </div>

              <div>
                <span>音频</span>{" "}
                <Select
                  style={{ width: 150 }}
                  value={mediaAudioTrackRef?.current?.label || undefined}
                  onChange={(e) => {
                    mediaAudioTrackRef.current =
                      audioTracks.filter((item) => item.id === e)[0] || null;
                  }}
                  options={audioTracks.map((item) => ({
                    value: item.id,
                    label: item.label,
                  }))}
                  loading={isMicrophoneLoading}
                  disabled={isMicrophoneLoading}
                />
              </div>

              <Button
                onClick={() => {
                  if (
                    sessionStatus === "DISCONNECTED" &&
                    mediaAudioTrackRef.current
                  ) {
                    connectToRealtime();
                  } else {
                    showToast("请先选择本地音频设备");
                  }
                }}
              >
                连接
              </Button>
            </div>
          ) : (
            <>
              <div
                style={{
                  width: "calc(100% - 20px)",
                  height: "100%",
                  overflow: "auto",
                  padding: "10px",
                  display: "flex",
                  justifyContent: "center",
                }}
              >
                {isShowSubtitles ? (
                  <div
                    ref={transcriptRef}
                    style={{
                      overflow: "auto",
                      width: "100%",
                      minWidth: "200px",
                      maxWidth: "400px",
                      height: "100%",
                      display: "flex",
                      flexDirection: "column",
                      rowGap: "8px",
                      flexShrink: 1,
                    }}
                  >
                    {transcriptItems.map((item) => {
                      const {
                        itemId,
                        type,
                        role,
                        data,
                        expanded,
                        timestamp,
                        title = "",
                        isHidden,
                      } = item;

                      if (isHidden) {
                        return null;
                      }
                      const isBracketedMessage =
                        title.startsWith("[") && title.endsWith("]");

                      const displayTitle = isBracketedMessage
                        ? title.slice(1, -1)
                        : title;

                      if (type === "MESSAGE") {
                        return (
                          <div
                            key={itemId}
                            style={{
                              width: "100%",
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "flex-start",
                                justifyContent: "flex-start",
                                textAlign: "left",
                              }}
                            >
                              <div
                                style={{
                                  fontSize: "12px",
                                  fontFamily: "monospace",
                                }}
                              >
                                {timestamp}
                              </div>
                              <div>
                                <Markdown
                                  content={displayTitle}
                                  fontSize={20}
                                ></Markdown>
                              </div>
                            </div>
                          </div>
                        );
                      }
                    })}
                  </div>
                ) : (
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      width: "100%",
                      height: "100%",
                    }}
                  >
                    <div
                      style={{
                        width: 150,
                        height: 150,
                        borderRadius: "50%",
                        backgroundColor: "rgba(255,255,255,0.3)",
                        border: "2px solid white",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        textAlign: "center",
                        boxShadow: "0 0 10px rgba(0,0,0,0.5)",
                        fontSize: "24px",
                      }}
                    >
                      Metis
                    </div>
                  </div>
                )}
              </div>
              <div className={styles["btn-group"]}>
                <div
                  className={styles["btn-item"]}
                  onClick={() => setIsPTTActive((prev) => !prev)}
                >
                  {!isPTTActive ? "关麦" : "开麦"}
                </div>
                <div
                  className={styles["btn-item"]}
                  onClick={() => onToggleConnection()}
                >
                  关闭
                </div>
                <div
                  className={styles["btn-item"]}
                  onClick={() => setIsShowSubtitles((prev) => !prev)}
                >
                  {isShowSubtitles ? "隐藏字幕" : "显示字幕"}
                </div>
              </div>
            </>
          )}
        </div>

        <svg
          className={styles["waves"]}
          xmlns="http://www.w3.org/2000/svg"
          xlinkHref="http://www.w3.org/1999/xlink"
          viewBox="0 24 150 28"
          preserveAspectRatio="none"
          shapeRendering="auto"
        >
          <defs>
            <path
              id="gentle-wave"
              d="M-160 44c30 0 58-18 88-18s 58 18 88 18 58-18 88-18 58 18 88 18 v44h-352z"
            />
          </defs>
          <g className={styles["parallax"]}>
            <use
              xlinkHref="#gentle-wave"
              x="48"
              y="0"
              fill="rgba(255,255,255,0.3)"
            />
            <use
              xlinkHref="#gentle-wave"
              x="20"
              y="3"
              fill="rgba(255,255,255,0.2)"
            />
            <use
              xlinkHref="#gentle-wave"
              x="10"
              y="5"
              fill="rgba(255,255,255,0.3)"
            />
            <use
              xlinkHref="#gentle-wave"
              x="48"
              y="7"
              fill="rgba(255,255,255,0.2)"
            />
          </g>
        </svg>

        {sessionStatus === "CONNECTING" && (
          <div className={styles["mask-layer"]}>通话连接中...</div>
        )}
      </div>
    </div>
  );
}
