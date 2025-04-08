import { useEffect, useRef, useState } from "react";
import { useTranscript } from "../contexts/TranscriptContext";
import { AgentConfig, SessionStatus } from "../typing";
import { useHandleServerEvent } from "../hooks/useHandleServerEvent";
import { createRealtimeConnection } from "../lib/realtimeConnection";

import { v4 as uuidv4 } from "uuid";
import ReactMarkdown from "react-markdown";
import { Button } from "antd";

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
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const [sessionStatus, setSessionStatus] =
    useState<SessionStatus>("DISCONNECTED");

  const [isPTTActive, setIsPTTActive] = useState<boolean>(false);
  const [isPTTUserSpeaking, setIsPTTUserSpeaking] = useState<boolean>(false);
  const transcriptRef = useRef<HTMLDivElement | null>(null);

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

  useEffect(() => {
    if (sessionStatus === "DISCONNECTED") {
      connectToRealtime();
    }
  }, []);

  const connectToRealtime = async () => {
    if (sessionStatus !== "DISCONNECTED") return;
    setSessionStatus("CONNECTING");

    try {
      if (!audioElementRef.current) {
        audioElementRef.current = document.createElement("audio");
      }
      // audioElementRef.current.autoplay = isAudioPlaybackEnabled;

      const { pc, dc, mediaStream } =
        await createRealtimeConnection(audioElementRef);
      pcRef.current = pc;
      dcRef.current = dc;
      mediaStreamRef.current = mediaStream;

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

  const sendSimulatedUserMessage = (text: string) => {
    const id = uuidv4().slice(0, 32);
    addTranscriptMessage(id, "user", text, true);

    sendClientEvent(
      {
        type: "conversation.item.create",
        item: {
          id,
          type: "message",
          role: "user",
          content: [{ type: "input_text", text }],
        },
      },
      "(simulated user text message)",
    );
    sendClientEvent(
      { type: "response.create" },
      "(trigger response after simulated user text message)",
    );
  };

  const cancelAssistantSpeech = async () => {
    const mostRecentAssistantMessage = [...transcriptItems]
      .reverse()
      .find((item) => item.role === "assistant");

    if (!mostRecentAssistantMessage) {
      console.warn("can't cancel, no recent assistant message found");
      return;
    }
    if (mostRecentAssistantMessage.status === "DONE") {
      console.log("No truncation needed, message is DONE");
      return;
    }

    sendClientEvent({
      type: "conversation.item.truncate",
      item_id: mostRecentAssistantMessage?.itemId,
      content_index: 0,
      audio_end_ms: Date.now() - mostRecentAssistantMessage.createdAtMs,
    });
    sendClientEvent(
      { type: "response.cancel" },
      "(cancel due to user interruption)",
    );
  };

  const handleTalkButtonDown = () => {
    if (sessionStatus !== "CONNECTED" || dataChannel?.readyState !== "open")
      return;
    cancelAssistantSpeech();

    setIsPTTUserSpeaking(true);
    sendClientEvent({ type: "input_audio_buffer.clear" }, "clear PTT buffer");
  };

  const handleTalkButtonUp = () => {
    if (
      sessionStatus !== "CONNECTED" ||
      dataChannel?.readyState !== "open" ||
      !isPTTUserSpeaking
    )
      return;

    setIsPTTUserSpeaking(false);
    sendClientEvent({ type: "input_audio_buffer.commit" }, "commit PTT");
    sendClientEvent({ type: "response.create" }, "trigger response PTT");
  };

  // Stop current session, clean up peer connection and data channel
  function stopSession() {
    if (dataChannel) {
      dataChannel.close();
    }

    if (pcRef.current)
      pcRef.current.getSenders().forEach((sender) => {
        if (sender.track) {
          sender.track.stop();
        }
      });

    if (pcRef.current) {
      pcRef.current.close();
    }

    setDataChannel(null);
    pcRef.current = null;
  }

  const muteMicrophone = () => {
    if (mediaStreamRef.current) {
      const audioTracks = mediaStreamRef.current.getAudioTracks();
      audioTracks.forEach((track) => {
        track.enabled = false;
      });
    }
  };

  const unmuteMicrophone = () => {
    if (mediaStreamRef.current) {
      const audioTracks = mediaStreamRef.current.getAudioTracks();
      audioTracks.forEach((track) => {
        track.enabled = true;
      });
    }
  };

  // 或者一个切换函数
  const toggleMute = () => {
    if (!mediaStreamRef.current) return;

    const audioTracks = mediaStreamRef.current.getAudioTracks();
    const isMuted = !audioTracks[0].enabled;

    audioTracks.forEach((track) => {
      track.enabled = isMuted;
    });
  };

  // useUpdateEffect(() => {
  //   console.log(transcriptItems, "transcriptItems");
  // }, [transcriptItems]);

  return (
    <div>
      <div className="relative flex-1 min-h-0">
        <div
          ref={transcriptRef}
          className="overflow-auto p-4 flex flex-col gap-y-4 h-full"
          style={{
            overflowY: "scroll",
            height: "400px",
            backgroundColor: "#f5f5f5",
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
              const baseContainer = "flex justify-end flex-col";
              const containerClasses = `${baseContainer} ${
                isUser ? "items-end" : "items-start"
              }`;
              const bubbleBase = `max-w-lg p-3 rounded-xl ${
                isUser ? "bg-gray-900 text-gray-100" : "bg-gray-100 text-black"
              }`;
              const isBracketedMessage =
                title.startsWith("[") && title.endsWith("]");
              const messageStyle = isBracketedMessage
                ? "italic text-gray-400"
                : "";
              const displayTitle = isBracketedMessage
                ? title.slice(1, -1)
                : title;

              return (
                <div key={itemId} className={containerClasses}>
                  <div className={bubbleBase}>
                    <div
                      className={`text-xs ${
                        isUser ? "text-gray-400" : "text-gray-500"
                      } font-mono`}
                    >
                      {timestamp}
                    </div>
                    <div className={`whitespace-pre-wrap ${messageStyle}`}>
                      <ReactMarkdown>{displayTitle}</ReactMarkdown>
                    </div>
                  </div>
                </div>
              );
            } else if (type === "BREADCRUMB") {
              return (
                <div
                  key={itemId}
                  className="flex flex-col justify-start items-start text-gray-500 text-sm"
                >
                  <span className="text-xs font-mono">{timestamp}</span>
                  <div
                    className={`whitespace-pre-wrap flex items-center font-mono text-sm text-gray-800 ${
                      data ? "cursor-pointer" : ""
                    }`}
                    onClick={() => data && toggleTranscriptItemExpand(itemId)}
                  >
                    {data && (
                      <span
                        className={`text-gray-400 mr-1 transform transition-transform duration-200 select-none font-mono ${
                          expanded ? "rotate-90" : "rotate-0"
                        }`}
                      >
                        ▶
                      </span>
                    )}
                    {title}
                  </div>
                  {expanded && data && (
                    <div className="text-gray-800 text-left">
                      <pre className="border-l-2 ml-1 border-gray-200 whitespace-pre-wrap break-words font-mono text-xs mb-2 mt-2 pl-2">
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
                  className="flex justify-center text-gray-500 text-sm italic font-mono"
                >
                  Unknown item type: {type}{" "}
                  <span className="ml-2 text-xs">{timestamp}</span>
                </div>
              );
            }
          })}
        </div>
      </div>
      <div>
        <Button onClick={() => toggleMute()}>静音</Button>
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
