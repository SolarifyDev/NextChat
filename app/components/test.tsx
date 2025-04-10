import { CSSProperties, useEffect, useRef, useState } from "react";
import { useTranscript } from "../contexts/TranscriptContext";
import { AgentConfig, SessionStatus, TranscriptItem } from "../typing";
import { useHandleServerEvent } from "../hooks/useHandleServerEvent";
import { createRealtimeConnection } from "../lib/realtimeConnection";

import { Button } from "antd";
import ReactMarkdown from "react-markdown";
import { clone } from "lodash-es";

export function Index() {
  const {
    transcriptItems,
    addTranscriptMessage,
    addTranscriptBreadcrumb,
    toggleTranscriptItemExpand,
  } = useTranscript();

  const [selectedAgentName, setSelectedAgentName] = useState<string>("");
  const [selectedAgentConfigSet, setSelectedAgentConfigSet] = useState<
    AgentConfig[] | null
  >(null);

  const [dataChannel, setDataChannel] = useState<RTCDataChannel | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const dcRef = useRef<RTCDataChannel | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioTrackRef = useRef<MediaStreamTrack | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const sessionRef = useRef<Record<string, any>>({});
  const senderRef = useRef<RTCRtpSender | null>(null);
  const [sessionStatus, setSessionStatus] =
    useState<SessionStatus>("DISCONNECTED");

  const [isPTTActive, setIsPTTActive] = useState<boolean>(false);
  const [isPTTUserSpeaking, setIsPTTUserSpeaking] = useState<boolean>(false);

  const transcriptRef = useRef<HTMLDivElement | null>(null);
  const [prevLogs, setPrevLogs] = useState<TranscriptItem[]>([]);

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
    selectedAgentName,
    selectedAgentConfigSet,
    sendClientEvent,
    setSelectedAgentName,
  });

  // 连接实时通话
  useEffect(() => {
    if (sessionStatus === "DISCONNECTED") {
      connectToRealtime();
    }
  }, []);

  // 更新对话配置配置
  useEffect(() => {
    if (sessionStatus === "CONNECTED") {
      console.log(
        `updatingSession, isPTTACtive=${isPTTActive} sessionStatus=${sessionStatus}`,
      );
      updateSession();
    }
  }, [isPTTActive]);

  const connectToRealtime = async () => {
    if (sessionStatus !== "DISCONNECTED") return;
    setSessionStatus("CONNECTING");

    try {
      if (!audioElementRef.current) {
        audioElementRef.current = document.createElement("audio");
      }
      audioElementRef.current.autoplay = true;

      const { pc, dc, sender, session } =
        await createRealtimeConnection(audioElementRef);
      pcRef.current = pc;
      dcRef.current = dc;
      // mediaStreamRef.current = mediaStream;
      // audioTrackRef.current = audioTrack;
      senderRef.current = sender;
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
  };

  // 关闭实时通话
  const onToggleConnection = () => {
    if (sessionStatus === "CONNECTED" || sessionStatus === "CONNECTING") {
      disconnectFromRealtime();
      setSessionStatus("DISCONNECTED");
    } else {
      connectToRealtime();
    }
  };

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
    setSessionStatus("DISCONNECTED");
    setIsPTTUserSpeaking(false);
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

    console.log(session, "sessionsessionsession");

    const sessionUpdateEvent = {
      type: "session.update",
      session: session,
    };

    sendClientEvent(sessionUpdateEvent);
  };

  function getConnectionButtonLabel() {
    if (sessionStatus === "CONNECTED") return "Disconnect";
    if (sessionStatus === "CONNECTING") return "Connecting...";
    return "Connect";
  }

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
    return () => {
      connectToRealtime();
    };
  });

  return (
    <div
      style={{
        width: "100%",
        height: "100vh",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        ref={transcriptRef}
        style={{
          overflow: "auto",
          height: "100%",
          backgroundColor: "#f5f5f5",
          padding: "16px",
          display: "flex",
          flexDirection: "column",
          rowGap: "16px",
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

          if (type === "MESSAGE") {
            const isUser = role === "user";
            // const baseContainer = "flex justify-end flex-col";

            const baseContainer = {
              display: "flex",
              justifyContent: "flex-end",
              flexDirection: "column",
            };
            // const containerClasses = `${baseContainer} ${
            //   isUser ? "items-end" : "items-start"
            // }`;

            const containerClasses = {
              ...baseContainer,

              alignItems: isUser ? "flex-end" : "flex-start",
            };

            // const bubbleBase = `max-w-lg p-3 rounded-xl ${
            //   isUser ? "bg-gray-900 text-gray-100" : "bg-gray-100 text-black"
            // }`;
            let bubbleBase: Record<string, string> = {
              padding: "12px",
              borderRadius: "12px",
            };

            if (isUser) {
              bubbleBase = {
                ...bubbleBase,
                backgroundColor: "oklch(21% 0.034 264.665)",
                color: "oklch(96.7% 0.003 264.542)",
              };
            } else {
              bubbleBase = {
                ...bubbleBase,
                backgroundColor: "oklch(96.7% 0.003 264.542)",
                color: "black",
              };
            }

            const isBracketedMessage =
              title.startsWith("[") && title.endsWith("]");
            // const messageStyle = isBracketedMessage
            //   ? "italic text-gray-400"
            //   : "";
            const messageStyle = isBracketedMessage
              ? {
                  fontStyle: "italic",
                  color: "oklch(70.7% 0.022 261.325)",
                }
              : {};
            const displayTitle = isBracketedMessage
              ? title.slice(1, -1)
              : title;

            return (
              <div key={itemId} style={containerClasses as CSSProperties}>
                <div style={bubbleBase as CSSProperties}>
                  <div
                    // className={`text-xs ${
                    //   isUser ? "text-gray-400" : "text-gray-500"
                    // } font-mono`}
                    style={{
                      fontSize: "12px",
                      color: isUser
                        ? "oklch(70.7% 0.022 261.325)"
                        : "oklch(55.1% 0.027 264.364)",
                      fontFamily: "monospace",
                    }}
                  >
                    {timestamp}
                  </div>
                  <div style={{ ...messageStyle, whiteSpace: "pre-wrap" }}>
                    <ReactMarkdown>{displayTitle}</ReactMarkdown>
                  </div>
                </div>
              </div>
            );
          } else if (type === "BREADCRUMB") {
            return (
              <div
                key={itemId}
                // className="flex flex-col justify-start items-start text-gray-500 text-sm"
                style={{
                  display: "flex", // flex
                  flexDirection: "column", // flex-col
                  justifyContent: "flex-start", // justify-start
                  alignItems: "flex-start", // items-start
                  color: "#6b7280", // text-gray-500 (Tailwind 的 gray-500 对应 #6b7280)
                  fontSize: "0.875rem", // text-sm (Tailwind 的 text-sm 是 14px/0.875rem)
                  lineHeight: "1.25rem",
                }}
              >
                <span
                  style={{
                    fontSize: "0.75rem", // text-xs (12px)
                    lineHeight: "1rem", // text-xs 默认行高
                    fontFamily: "monospace", // font-mono
                  }}
                >
                  {timestamp}
                </span>
                <div
                  // className={`whitespace-pre-wrap flex items-center font-mono text-sm text-gray-800 ${
                  //   data ? "cursor-pointer" : ""
                  // }`}
                  style={{
                    whiteSpace: "pre-wrap", // whitespace-pre-wrap
                    display: "flex", // flex
                    alignItems: "center", // items-center
                    fontFamily: "monospace", // font-mono
                    fontSize: "0.875rem", // text-sm (14px)
                    lineHeight: "1.25rem", // text-sm default line-height
                    color: "#1f2937", // text-gray-800 (Tailwind's gray-800)
                    cursor: data ? "pointer" : "default", // conditional cursor-pointer
                  }}
                  onClick={() => data && toggleTranscriptItemExpand(itemId)}
                >
                  {data && (
                    <span
                      // className={`text-gray-400 mr-1 transform transition-transform duration-200 select-none font-mono ${
                      //   expanded ? "rotate-90" : "rotate-0"
                      // }`}
                      style={{
                        color: "#9ca3af", // text-gray-400
                        marginRight: "0.25rem", // mr-1 (4px)
                        transition: "transform 200ms", // transition-transform duration-200
                        userSelect: "none", // select-none
                        fontFamily: "monospace", // font-mono
                        transform: expanded ? "rotate(90deg)" : "rotate(0deg)", // conditional rotation
                      }}
                    >
                      ▶
                    </span>
                  )}
                  {title}
                </div>
                {expanded && data && (
                  <div
                    style={{
                      color: "#1f2937", // text-gray-800
                      textAlign: "left", // text-left
                    }}
                  >
                    <pre
                      style={{
                        borderLeft: "2px solid #e5e7eb", // border-l-2 border-gray-200
                        marginLeft: "0.25rem", // ml-1 (4px)
                        whiteSpace: "pre-wrap", // whitespace-pre-wrap
                        wordBreak: "break-word", // break-words
                        fontFamily: "monospace", // font-mono
                        fontSize: "0.75rem", // text-xs (12px)
                        lineHeight: "1rem", // text-xs default line-height
                        marginBottom: "0.5rem", // mb-2 (8px)
                        marginTop: "0.5rem", // mt-2 (8px)
                        paddingLeft: "0.5rem", // pl-2 (8px)
                      }}
                    >
                      {JSON.stringify(data, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            );
          } else {
            // Fallback if type is neither MESSAGE nor BREADCRUMB
            return (
              <div
                key={itemId}
                // className="flex justify-center text-gray-500 text-sm italic font-mono"
                style={{
                  display: "flex", // flex
                  justifyContent: "center", // justify-center
                  color: "#6b7280", // text-gray-500
                  fontSize: "0.875rem", // text-sm (14px)
                  lineHeight: "1.25rem", // text-sm default line-height
                  fontStyle: "italic", // italic
                  fontFamily: "monospace", // font-mono
                }}
              >
                Unknown item type: {type}{" "}
                <span
                  style={{
                    marginLeft: "0.5rem", // ml-2 (8px in Tailwind)
                    fontSize: "0.75rem", // text-xs (12px)
                    lineHeight: "1rem", // text-xs default line-height
                  }}
                >
                  {timestamp}
                </span>
              </div>
            );
          }
        })}
      </div>

      <div>
        <Button onClick={() => setIsPTTActive((prev) => !prev)}>
          {!isPTTActive ? "关麦" : "开麦"}
        </Button>
        <Button onClick={() => onToggleConnection()}>
          {getConnectionButtonLabel()}
        </Button>
      </div>
      {/* <div>
        1<Button onClick={() => stopSession()}>STOP</Button>
        <Button
          onMouseUp={handleTalkButtonUp}
          onMouseDown={handleTalkButtonDown}
        >
          up
        </Button>
      </div> */}
    </div>
  );
}

// export function Index() {
//   const audioElementRef = useRef<HTMLAudioElement | null>(null);

//   const connectToRealtime = async () => {
//     if (!audioElementRef.current) {
//       audioElementRef.current = document.createElement("audio");
//     }

//     const pc = new RTCPeerConnection();

//     pc.ontrack = (e) => {
//       if (audioElementRef.current) {
//         audioElementRef.current.srcObject = e.streams[0];
//       }
//     };

//     const ms = await navigator.mediaDevices.getUserMedia({ audio: true });
//     pc.addTrack(ms.getTracks()[0]);

//     const dc = pc.createDataChannel("oai-events");

//     const offer = await pc.createOffer();
//     await pc.setLocalDescription(offer);

//     try {
//       const sdpResponse = await PostRealTime(offer.sdp!);
//       console.log("[Realtime] Connected sdpResponse", sdpResponse);
//       // const answerSdp = await sdpResponse;
//       // console.log("[Realtime] Connected answerSdp", answerSdp);

//       const answer: RTCSessionDescriptionInit = {
//         type: "answer",
//         sdp: sdpResponse,
//       };
//       console.log("[Realtime] Received answer answer", answer);

//       await pc.setRemoteDescription(answer);
//       return { pc, dc };
//     } catch (err) {
//       console.log(err, "err");

//       return null;
//     }
//   };

//   useEffect(() => {
//     connectToRealtime();
//   }, []);

//   return <div>1</div>;
// }
