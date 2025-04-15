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
import { Button, Select } from "antd";
import { showToast } from "./ui-lib";
import {
  AudioMutedOutlined,
  AudioOutlined,
  CloseOutlined,
} from "@ant-design/icons";
import clsx from "clsx";
import SubtitlesIcon from "../icons/subtitles.png";
import SubtitlesIcon1 from "../icons/subtitles1.png";
import Image from "next/image";
import ReactMarkdown from "react-markdown";

export function Index() {
  const { transcriptItems, setTranscriptItems } = useTranscript();
  const {
    audioTracks,
    isMicrophoneLoading,
    audioDevices,
    startMicrophone,
    stopMicrophone,
  } = useMicrophone();

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
  // const mediaAudioTrackRef = useRef<MediaStreamTrack | null>(null);

  const [mediaDevice, setMediaDevice] = useState<MediaDeviceInfo | null>(null);

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

  // 是否在说话
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);

  // 通信事件----------
  useEffect(() => {
    if (sessionStatus === "CONNECTED") {
      updateSession();
    }
  }, [isPTTActive]);

  const handleChangeIsSpeaking = (isSpeaking: boolean) => {
    setIsSpeaking(isSpeaking);
  };

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
    handleChangeIsSpeaking,
  });

  const { run: connectToRealtime } = useDebounceFn(
    async () => {
      if (sessionStatus !== "DISCONNECTED") return;
      setSessionStatus("CONNECTING");

      try {
        if (!audioElementRef.current) {
          audioElementRef.current = document.createElement("audio");
        }
        audioElementRef.current.autoplay = true;

        const connection = await createRealtimeConnection(
          audioElementRef,
          selectedAssistant ? selectedAssistant.id : null,
          // mediaAudioTrackRef.current!,
          mediaDevice?.deviceId || "",
        );

        if (!connection) {
          setSessionStatus("DISCONNECTED");
          stopMicrophone();
          disconnectFromRealtime();

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
        setSessionStatus("DISCONNECTED");
        stopMicrophone();
        disconnectFromRealtime();
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
      // startMicrophone(mediaAudioTrackRef);
      startMicrophone((mediaDevice: MediaDeviceInfo | null) => {
        setMediaDevice(mediaDevice);
      });
      getAssistants();
      setIsPTTActive(false);
      setIsShowSubtitles(false);
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
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <span
                  style={{
                    flexShrink: 0,
                  }}
                >
                  助理
                </span>{" "}
                <Select
                  style={{
                    minWidth: "150px",
                  }}
                  value={selectedAssistant?.id || undefined}
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
                  placeholder="可选填"
                />
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <span
                  style={{
                    flexShrink: 0,
                  }}
                >
                  音频
                </span>{" "}
                <Select
                  style={{
                    minWidth: "150px",
                  }}
                  value={mediaDevice?.label || undefined}
                  onChange={(e) => {
                    setMediaDevice(
                      audioDevices.filter((item) => item.deviceId === e)[0] ||
                        null,
                    );
                  }}
                  options={audioDevices.map((item) => ({
                    value: item.deviceId,
                    label: item.label,
                  }))}
                  loading={isMicrophoneLoading}
                  disabled={isMicrophoneLoading}
                />
              </div>

              <Button
                onClick={() => {
                  if (sessionStatus === "DISCONNECTED") {
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
                  gap: "10px",
                  flexDirection: "column",
                  alignItems: "center",
                }}
              >
                {isShowSubtitles ? (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      width: "100%",
                      height: "100%",
                      gap: "10px",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "24px",
                      }}
                    >
                      {selectedAssistant?.name || "默认助理"}
                    </span>
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
                          const isUser = role === "user";

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
                                  alignItems: isUser
                                    ? "flex-end"
                                    : "flex-start",
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
                                <div
                                  style={{
                                    backgroundColor: isUser
                                      ? "oklch(92.2% 0 0)"
                                      : "transparent",
                                    borderRadius: "16px",
                                    padding: "0 10px",
                                  }}
                                >
                                  <ReactMarkdown>{displayTitle}</ReactMarkdown>
                                </div>
                              </div>
                            </div>
                          );
                        }
                      })}
                    </div>
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
                    {sessionStatus === "CONNECTING" ? (
                      <div className={styles["pulse-circle"]}></div>
                    ) : (
                      <div
                        className={
                          isSpeaking ? styles["big"] : styles["big-stop"]
                        }
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
                    )}
                  </div>
                )}
              </div>
              <div className={styles["btn-group"]}>
                <div
                  className={clsx(
                    styles["btn-item"],
                    isPTTActive && styles["btn-item-err"],
                  )}
                  onClick={() => setIsPTTActive((prev) => !prev)}
                >
                  {isPTTActive ? (
                    <AudioMutedOutlined
                      style={{
                        fontSize: "24px",
                        color: "red",
                      }}
                    />
                  ) : (
                    <AudioOutlined
                      style={{
                        fontSize: "24px",
                        color: "black",
                      }}
                    />
                  )}
                </div>
                <div
                  className={styles["btn-item"]}
                  onClick={() => onToggleConnection()}
                >
                  <CloseOutlined
                    style={{
                      fontSize: "24px",
                    }}
                  />
                </div>
                <div
                  className={styles["btn-item"]}
                  onClick={() => setIsShowSubtitles((prev) => !prev)}
                >
                  {isShowSubtitles ? (
                    <Image
                      src={SubtitlesIcon.src}
                      alt=""
                      width={32}
                      height={32}
                    />
                  ) : (
                    <Image
                      src={SubtitlesIcon1.src}
                      alt=""
                      width={32}
                      height={32}
                    />
                  )}
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
      </div>
    </div>
  );
}
