// import { useEffect, useRef, useState } from "react";
// import { useTranscript } from "../contexts/TranscriptContext";
// import { AgentConfig, SessionStatus, TranscriptItem } from "../typing";
// import { useHandleServerEvent } from "../hooks/useHandleServerEvent";
// import { createRealtimeConnection } from "../lib/realtimeConnection";

// import { clone, isNil } from "lodash-es";
// import dynamic from "next/dynamic";
// import LoadingIcon from "../icons/three-dots.svg";

// import { useDebounceFn, useMemoizedFn } from "ahooks";
// import styles from "./test.module.scss";
// import clsx from "clsx";
// import PhotoIcon from "../icons/1.jpg";
// import Image from "next/image";
// import { Button, Select } from "antd";

// const Markdown = dynamic(async () => (await import("./markdown")).Markdown, {
//   loading: () => <LoadingIcon />,
// });

// export function Index() {
//   const {
//     transcriptItems,
//     addTranscriptMessage,
//     addTranscriptBreadcrumb,
//     toggleTranscriptItemExpand,
//   } = useTranscript();

//   const [selectedAgentName, setSelectedAgentName] = useState<string>("");
//   const [selectedAgentConfigSet, setSelectedAgentConfigSet] = useState<
//     AgentConfig[] | null
//   >(null);

//   const [dataChannel, setDataChannel] = useState<RTCDataChannel | null>(null);
//   const pcRef = useRef<RTCPeerConnection | null>(null);
//   const dcRef = useRef<RTCDataChannel | null>(null);
//   const audioElementRef = useRef<HTMLAudioElement | null>(null);
//   const sessionRef = useRef<Record<string, any>>({});
//   const senderRef = useRef<RTCRtpSender | null>(null);
//   const [sessionStatus, setSessionStatus] =
//     useState<SessionStatus>("DISCONNECTED");

//   const [isPTTActive, setIsPTTActive] = useState<boolean>(false);

//   const transcriptRef = useRef<HTMLDivElement | null>(null);
//   const [prevLogs, setPrevLogs] = useState<TranscriptItem[]>([]);
//   const [isShowSubtitles, setIsShowSubtitles] = useState<boolean>(false);

//   const [asststants, setAsststants] = useState<{ id: number; name: string }[]>(
//     [],
//   );

//   const [assistantsLoading, setAsststantsLoading] = useState<boolean>(false);

//   const [mediaAudiotrack, setMediaAudiotrack] = useState<MediaStreamTrack[]>(
//     [],
//   );

//   const [mediaAudiotarackLoading, setMediaAudiotarackLoading] =
//     useState<boolean>(false);

//   const [select, setSelect] = useState<{
//     mediaAudioTrack: MediaStreamTrack | null;
//     asststants: { id: number; name: string };
//   }>({
//     mediaAudioTrack: null,
//     asststants: {
//       id: 0,
//       name: "default",
//     },
//   });

//   const handleSelect = useMemoizedFn(
//     (
//       data: Partial<{
//         mediaAudioTrack: MediaStreamTrack | null;
//         asststants: { id: number; name: string };
//       }>,
//     ) => {
//       setSelect((prev) => ({
//         ...prev,
//         ...data,
//       }));
//     },
//   );

//   const sendClientEvent = (eventObj: any, eventNameSuffix = "") => {
//     if (dcRef.current && dcRef.current.readyState === "open") {
//       dcRef.current.send(JSON.stringify(eventObj));
//     } else {
//       console.error(
//         "Failed to send message - no data channel available",
//         eventObj,
//       );
//     }
//   };

//   const handleServerEventRef = useHandleServerEvent({
//     setSessionStatus,
//     selectedAgentName,
//     selectedAgentConfigSet,
//     sendClientEvent,
//     setSelectedAgentName,
//   });

//   // 连接实时通话
//   useEffect(() => {
//     if (sessionStatus === "DISCONNECTED") {
//       // setSelect({
//       //   mediaAudioTrack: null,
//       //   asststants: {
//       //     id: 0,
//       //     name: "default",
//       //   },
//       // });
//       // setAsststants([]);
//       // setMediaAudiotrack([]);
//       // getAudiotrack();
//       // getAssistants();
//     }
//   }, [sessionStatus]);

//   // 更新对话配置配置
//   useEffect(() => {
//     if (sessionStatus === "CONNECTED") {
//       console.log(
//         `updatingSession, isPTTACtive=${isPTTActive} sessionStatus=${sessionStatus}`,
//       );
//       updateSession();
//     }
//   }, [isPTTActive]);

//   const { run: connectToRealtime } = useDebounceFn(
//     async () => {
//       if (sessionStatus !== "DISCONNECTED") return;
//       setSessionStatus("CONNECTING");

//       console.log("ininin");

//       try {
//         if (!audioElementRef.current) {
//           audioElementRef.current = document.createElement("audio");
//         }
//         audioElementRef.current.autoplay = true;

//         const connection = await createRealtimeConnection(
//           audioElementRef,
//           asststants.find((item) => item.name === select.asststants.name)?.id ||
//             null,
//           select.mediaAudioTrack!,
//         );

//         if (!connection) {
//           setSessionStatus("DISCONNECTED");

//           return;
//         }

//         const { pc, dc, sender, session } = connection;
//         pcRef.current = pc;
//         dcRef.current = dc;
//         senderRef.current = sender;
//         sessionRef.current = session;

//         dc.addEventListener("open", () => {});
//         dc.addEventListener("close", () => {});
//         dc.addEventListener("error", (err: any) => {});
//         dc.addEventListener("message", (e: MessageEvent) => {
//           handleServerEventRef.current(JSON.parse(e.data));
//         });

//         setDataChannel(dc);
//       } catch (err) {
//         console.error("Error connecting to realtime:", err);
//         setSessionStatus("DISCONNECTED");
//       }
//     },
//     {
//       wait: 200,
//     },
//   );

//   const { run: onToggleConnection } = useDebounceFn(
//     () => {
//       if (sessionStatus === "CONNECTED" || sessionStatus === "CONNECTING") {
//         disconnectFromRealtime();
//         setSessionStatus("DISCONNECTED");
//         console.log(1);
//       } else {
//         connectToRealtime();
//         console.log(2);
//       }
//     },
//     {
//       wait: 200,
//     },
//   );

//   const disconnectFromRealtime = () => {
//     if (pcRef.current) {
//       pcRef.current.getSenders().forEach((sender) => {
//         if (sender.track) {
//           sender.track.stop();
//         }
//       });

//       pcRef.current.close();
//       pcRef.current = null;
//     }
//     dcRef.current = null;
//     setDataChannel(null);
//     setSessionStatus("DISCONNECTED");
//   };

//   const updateSession = (shouldTriggerResponse: boolean = false) => {
//     sendClientEvent(
//       { type: "input_audio_buffer.clear" },
//       "clear audio buffer on session update",
//     );

//     const session = clone(sessionRef.current);

//     if (isPTTActive) {
//       session["turn_detection"] = null;
//     }

//     console.log(session, "sessionsessionsession");

//     const sessionUpdateEvent = {
//       type: "session.update",
//       session: session,
//     };

//     sendClientEvent(sessionUpdateEvent);
//   };

//   function getConnectionButtonLabel() {
//     if (sessionStatus === "CONNECTED") return "已连接";
//     if (sessionStatus === "CONNECTING") return "连接中...";
//     return "未连接";
//   }

//   function scrollToBottom() {
//     if (transcriptRef.current) {
//       transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;
//     }
//   }

//   const getAssistants = async () => {
//     setAsststantsLoading(true);
//     try {
//       const assistantsResponse = await fetch("/api/assistants");

//       const data = await assistantsResponse.json();

//       if (!data.data) {
//         setAsststants([]);
//         return;
//       }

//       const { assistants, count } = data.data;

//       setAsststants(
//         assistants.map(
//           (item: {
//             id: number;
//             name: string;
//             answeringNumberId: number;
//             answeringNumber: string;
//             modelUrl: string;
//             modelProvider: number;
//             modelVoice: string;
//             agentId: number;
//             customRecordAnalyzePrompt: string;
//             channel: string;
//             createdDate: string;
//             createdBy: number;
//             knowledge: {
//               id: number;
//               assistantId: number;
//               json: string;
//               prompt: string;
//               isActive: boolean;
//               brief: string;
//               greetings: string;
//               createdDate: string;
//               createdBy: number;
//             };
//             channels: number[];
//           }) => ({
//             id: item.id,
//             name: item.name,
//           }),
//         ),
//       );

//       setAsststantsLoading(false);
//     } catch {
//       setAsststantsLoading(false);
//     }
//   };

//   // const getAudiotrack = async () => {
//   //   setMediaAudiotarackLoading(true);
//   //   try {
//   //     const mediaStream = await navigator.mediaDevices.getUserMedia({
//   //       audio: true,
//   //     });

//   //     const audioTracks = mediaStream.getAudioTracks();

//   //     console.log(audioTracks, "audioTracks");

//   //     setMediaAudiotrack(audioTracks);
//   //     setMediaAudiotarackLoading(false);
//   //     console.log(audioTracks.length, "audioTracks.length");
//   //     if (audioTracks.length > 0) {
//   //       handleSelect({
//   //         mediaAudioTrack: audioTracks[0],
//   //       });
//   //     }
//   //   } catch (error) {
//   //     setMediaAudiotrack([]);
//   //     setMediaAudiotarackLoading(false);
//   //   }
//   // };

//   useEffect(() => {
//     const hasNewMessage = transcriptItems.length > prevLogs.length;
//     const hasUpdatedMessage = transcriptItems.some((newItem, index) => {
//       const oldItem = prevLogs[index];
//       return (
//         oldItem &&
//         (newItem.title !== oldItem.title || newItem.data !== oldItem.data)
//       );
//     });

//     if (hasNewMessage || hasUpdatedMessage) {
//       scrollToBottom();
//     }

//     setPrevLogs(transcriptItems);
//   }, [transcriptItems]);

//   useEffect(() => {
//     return () => {
//       disconnectFromRealtime();
//     };
//   }, []);

//   return (
//     <div
//       style={{
//         width: "100%",
//         height: "100%",
//         display: "flex",
//         flexDirection: "column",
//         alignItems: "center",
//         justifyContent: "center",
//       }}
//     >
//       <div className={styles["header"]}>
//         {false && (
//           <>
//             <div className={clsx(styles["inner-header"], styles["flex"])}>
//               {isShowSubtitles ? (
//                 <div
//                   ref={transcriptRef}
//                   style={{
//                     overflow: "auto",
//                     width: "100%",
//                     minWidth: "200px",
//                     maxWidth: "400px",
//                     height: "100%",
//                     padding: "16px",
//                     display: "flex",
//                     flexDirection: "column",
//                     rowGap: "8px",
//                     marginBottom: "250px",
//                     flexShrink: 1,
//                   }}
//                 >
//                   {transcriptItems.map((item) => {
//                     const {
//                       itemId,
//                       type,
//                       role,
//                       data,
//                       expanded,
//                       timestamp,
//                       title = "",
//                       isHidden,
//                     } = item;

//                     if (isHidden) {
//                       return null;
//                     }
//                     const isBracketedMessage =
//                       title.startsWith("[") && title.endsWith("]");

//                     const displayTitle = isBracketedMessage
//                       ? title.slice(1, -1)
//                       : title;

//                     if (type === "MESSAGE") {
//                       return (
//                         <div
//                           key={itemId}
//                           style={{
//                             width: "100%",
//                           }}
//                         >
//                           <div
//                             style={{
//                               display: "flex",
//                               flexDirection: "column",
//                               alignItems: "flex-start",
//                               justifyContent: "flex-start",
//                               textAlign: "left",
//                             }}
//                           >
//                             <div
//                               style={{
//                                 fontSize: "12px",
//                                 fontFamily: "monospace",
//                               }}
//                             >
//                               {timestamp}
//                             </div>
//                             <div>
//                               <Markdown
//                                 content={displayTitle}
//                                 fontSize={20}
//                               ></Markdown>
//                             </div>
//                           </div>
//                         </div>
//                       );
//                     }
//                   })}
//                 </div>
//               ) : (
//                 <div className={styles["body"]}>
//                   <Image
//                     src={PhotoIcon.src}
//                     alt=""
//                     width={200}
//                     height={200}
//                     style={{
//                       userSelect: "none",
//                       userDrag: "none",
//                       pointerEvents: "none",
//                     }}
//                   />
//                 </div>
//               )}
//             </div>
//             <div className={styles["btn-group"]}>
//               <div
//                 className={styles["btn-item"]}
//                 onClick={() => setIsPTTActive((prev) => !prev)}
//               >
//                 {!isPTTActive ? "关麦" : "开麦"}
//               </div>
//               <div
//                 className={styles["btn-item"]}
//                 onClick={() => onToggleConnection()}
//               >
//                 关闭
//               </div>
//               <div
//                 className={styles["btn-item"]}
//                 onClick={() => setIsShowSubtitles((prev) => !prev)}
//               >
//                 字幕
//               </div>
//             </div>
//           </>
//         )}
//         {/* 未连接 选择助理 --- 再连接 连接中 出现蒙层 -- 不允许操作点击 连接
//         允许操作 */}
//         {sessionStatus === "DISCONNECTED" ? (
//           <div
//             style={{
//               width: "100%",
//               height: "100%",
//               display: "flex",
//               flexDirection: "column",
//               alignItems: "center",
//               justifyContent: "center",
//               gap: "12px",
//             }}
//           >
//             <div
//               style={{
//                 fontSize: "24px",
//               }}
//             >
//               选择助理后连接或默认连接
//             </div>
//             <div>
//               <span>助理</span>{" "}
//               <Select
//                 value={select.asststants.name}
//                 style={{ width: 150 }}
//                 onChange={(e) => {
//                   // 需要判断clear的场景
//                   handleSelect({
//                     asststants: {
//                       id: Number(e),
//                       name: asststants.filter(
//                         (item) => item.id === Number(e),
//                       )[0].name,
//                     },
//                   });
//                 }}
//                 allowClear
//                 options={asststants.map((item) => ({
//                   value: item.id,
//                   label: item.name,
//                 }))}
//                 // allowClear
//                 loading={assistantsLoading}
//               />
//             </div>

//             <div>
//               <span>音频</span>{" "}
//               <Select
//                 style={{ width: 150 }}
//                 value={select.mediaAudioTrack?.label || undefined}
//                 onChange={(e) =>
//                   handleSelect({
//                     mediaAudioTrack: mediaAudiotrack.filter(
//                       (item) => item.id === e,
//                     )[0],
//                   })
//                 }
//                 options={mediaAudiotrack.map((item) => ({
//                   value: item.id,
//                   label: item.label,
//                 }))}
//                 loading={mediaAudiotarackLoading}
//               />
//             </div>

//             <Button
//               // disabled={
//               //   !(sessionStatus === "DISCONNECTED" && select.mediaAudioTrack)
//               // }
//               onClick={() => {
//                 console.log(
//                   sessionStatus === "DISCONNECTED",
//                   isNil(select.mediaAudioTrack),
//                 );
//                 if (
//                   sessionStatus === "DISCONNECTED" &&
//                   select.mediaAudioTrack
//                 ) {
//                   connectToRealtime();
//                 } else {
//                 }
//               }}
//             >
//               连接
//             </Button>
//           </div>
//         ) : (
//           <>
//             <div className={clsx(styles["inner-header"], styles["flex"])}>
//               {isShowSubtitles ? (
//                 <div
//                   ref={transcriptRef}
//                   style={{
//                     overflow: "auto",
//                     width: "100%",
//                     minWidth: "200px",
//                     maxWidth: "400px",
//                     height: "100%",
//                     padding: "16px",
//                     display: "flex",
//                     flexDirection: "column",
//                     rowGap: "8px",
//                     marginBottom: "250px",
//                     flexShrink: 1,
//                   }}
//                 >
//                   {transcriptItems.map((item) => {
//                     const {
//                       itemId,
//                       type,
//                       role,
//                       data,
//                       expanded,
//                       timestamp,
//                       title = "",
//                       isHidden,
//                     } = item;

//                     if (isHidden) {
//                       return null;
//                     }
//                     const isBracketedMessage =
//                       title.startsWith("[") && title.endsWith("]");

//                     const displayTitle = isBracketedMessage
//                       ? title.slice(1, -1)
//                       : title;

//                     if (type === "MESSAGE") {
//                       return (
//                         <div
//                           key={itemId}
//                           style={{
//                             width: "100%",
//                           }}
//                         >
//                           <div
//                             style={{
//                               display: "flex",
//                               flexDirection: "column",
//                               alignItems: "flex-start",
//                               justifyContent: "flex-start",
//                               textAlign: "left",
//                             }}
//                           >
//                             <div
//                               style={{
//                                 fontSize: "12px",
//                                 fontFamily: "monospace",
//                               }}
//                             >
//                               {timestamp}
//                             </div>
//                             <div>
//                               <Markdown
//                                 content={displayTitle}
//                                 fontSize={20}
//                               ></Markdown>
//                             </div>
//                           </div>
//                         </div>
//                       );
//                     }
//                   })}
//                 </div>
//               ) : (
//                 <div className={styles["body"]}>
//                   <Image
//                     src={PhotoIcon.src}
//                     alt=""
//                     width={200}
//                     height={200}
//                     style={{
//                       userSelect: "none",
//                       userDrag: "none",
//                       pointerEvents: "none",
//                     }}
//                   />
//                 </div>
//               )}
//             </div>
//             <div className={styles["btn-group"]}>
//               <div
//                 className={styles["btn-item"]}
//                 onClick={() => setIsPTTActive((prev) => !prev)}
//               >
//                 {!isPTTActive ? "关麦" : "开麦"}
//               </div>
//               <div
//                 className={styles["btn-item"]}
//                 onClick={() => onToggleConnection()}
//               >
//                 关闭
//               </div>
//               <div
//                 className={styles["btn-item"]}
//                 onClick={() => setIsShowSubtitles((prev) => !prev)}
//               >
//                 字幕
//               </div>
//             </div>
//           </>
//         )}
//         <div>
//           <svg
//             className={styles["waves"]}
//             xmlns="http://www.w3.org/2000/svg"
//             xlinkHref="http://www.w3.org/1999/xlink"
//             viewBox="0 24 150 28"
//             preserveAspectRatio="none"
//             shapeRendering="auto"
//           >
//             <defs>
//               <path
//                 id="gentle-wave"
//                 d="M-160 44c30 0 58-18 88-18s 58 18 88 18 58-18 88-18 58 18 88 18 v44h-352z"
//               />
//             </defs>
//             <g className={styles["parallax"]}>
//               <use
//                 xlinkHref="#gentle-wave"
//                 x="48"
//                 y="0"
//                 fill="rgba(255,255,255,0.3)"
//               />
//               <use
//                 xlinkHref="#gentle-wave"
//                 x="20"
//                 y="3"
//                 fill="rgba(255,255,255,0.2)"
//               />
//               <use
//                 xlinkHref="#gentle-wave"
//                 x="10"
//                 y="5"
//                 fill="rgba(255,255,255,0.3)"
//               />
//               <use
//                 xlinkHref="#gentle-wave"
//                 x="48"
//                 y="7"
//                 fill="rgba(255,255,255,0.2)"
//               />
//             </g>
//           </svg>
//         </div>
//       </div>
//     </div>
//   );
// }

// // export function Index() {
// //   const audioElementRef = useRef<HTMLAudioElement | null>(null);

// //   const connectToRealtime = async () => {
// //     if (!audioElementRef.current) {
// //       audioElementRef.current = document.createElement("audio");
// //     }

// //     const pc = new RTCPeerConnection();

// //     pc.ontrack = (e) => {
// //       if (audioElementRef.current) {
// //         audioElementRef.current.srcObject = e.streams[0];
// //       }
// //     };

// //     const ms = await navigator.mediaDevices.getUserMedia({ audio: true });
// //     pc.addTrack(ms.getTracks()[0]);

// //     const dc = pc.createDataChannel("oai-events");

// //     const offer = await pc.createOffer();
// //     await pc.setLocalDescription(offer);

// //     try {
// //       const sdpResponse = await PostRealTime(offer.sdp!);
// //       console.log("[Realtime] Connected sdpResponse", sdpResponse);
// //       // const answerSdp = await sdpResponse;
// //       // console.log("[Realtime] Connected answerSdp", answerSdp);

// //       const answer: RTCSessionDescriptionInit = {
// //         type: "answer",
// //         sdp: sdpResponse,
// //       };
// //       console.log("[Realtime] Received answer answer", answer);

// //       await pc.setRemoteDescription(answer);
// //       return { pc, dc };
// //     } catch (err) {
// //       console.log(err, "err");

// //       return null;
// //     }
// //   };

// //   useEffect(() => {
// //     connectToRealtime();
// //   }, []);

// //   return <div>1</div>;
// // }

// {
//   /* <div
//         ref={transcriptRef}
//         style={{
//           overflow: "auto",
//           width: "100%",
//           height: "100%",
//           // backgroundColor: "#f5f5f5",
//           padding: "16px",
//           display: "flex",
//           flexDirection: "column",
//           rowGap: "16px",
//         }}
//       >
//         {transcriptItems.map((item) => {
//           const {
//             itemId,
//             type,
//             role,
//             data,
//             expanded,
//             timestamp,
//             title = "",
//             isHidden,
//           } = item;

//           if (isHidden) {
//             return null;
//           }

//           if (type === "MESSAGE") {
//             const isUser = role === "user";
//             // const baseContainer = "flex justify-end flex-col";

//             const baseContainer = {
//               display: "flex",
//               justifyContent: "flex-end",
//               flexDirection: "column",
//             };
//             // const containerClasses = `${baseContainer} ${
//             //   isUser ? "items-end" : "items-start"
//             // }`;

//             const containerClasses = {
//               ...baseContainer,

//               alignItems: isUser ? "flex-end" : "flex-start",
//             };

//             // const bubbleBase = `max-w-lg p-3 rounded-xl ${
//             //   isUser ? "bg-gray-900 text-gray-100" : "bg-gray-100 text-black"
//             // }`;
//             let bubbleBase: Record<string, string> = {
//               padding: "12px",
//               borderRadius: "12px",
//             };

//             if (isUser) {
//               bubbleBase = {
//                 ...bubbleBase,
//                 // backgroundColor: "oklch(21% 0.034 264.665)",
//                 color: "oklch(96.7% 0.003 264.542)",
//               };
//             } else {
//               bubbleBase = {
//                 ...bubbleBase,
//                 // backgroundColor: "oklch(96.7% 0.003 264.542)",
//                 color: "black",
//               };
//             }

//             const isBracketedMessage =
//               title.startsWith("[") && title.endsWith("]");
//             // const messageStyle = isBracketedMessage
//             //   ? "italic text-gray-400"
//             //   : "";
//             const messageStyle = isBracketedMessage
//               ? {
//                   fontStyle: "italic",
//                   color: "oklch(70.7% 0.022 261.325)",
//                 }
//               : {};
//             const displayTitle = isBracketedMessage
//               ? title.slice(1, -1)
//               : title;

//             return (
//               <div key={itemId} style={containerClasses as CSSProperties}>
//                 <div style={bubbleBase as CSSProperties}>
//                   <div
//                     // className={`text-xs ${
//                     //   isUser ? "text-gray-400" : "text-gray-500"
//                     // } font-mono`}
//                     style={{
//                       fontSize: "12px",
//                       color: isUser
//                         ? "oklch(70.7% 0.022 261.325)"
//                         : "oklch(55.1% 0.027 264.364)",
//                       fontFamily: "monospace",
//                     }}
//                   >
//                     {timestamp}
//                   </div>
//                   <div style={{ ...messageStyle, whiteSpace: "pre-wrap" }}>
//                     <Markdown content={displayTitle}></Markdown>
//                   </div>
//                 </div>
//               </div>
//             );
//           } else if (type === "BREADCRUMB") {
//             return (
//               <div
//                 key={itemId}
//                 // className="flex flex-col justify-start items-start text-gray-500 text-sm"
//                 style={{
//                   display: "flex", // flex
//                   flexDirection: "column", // flex-col
//                   justifyContent: "flex-start", // justify-start
//                   alignItems: "flex-start", // items-start
//                   color: "#6b7280", // text-gray-500 (Tailwind 的 gray-500 对应 #6b7280)
//                   fontSize: "0.875rem", // text-sm (Tailwind 的 text-sm 是 14px/0.875rem)
//                   lineHeight: "1.25rem",
//                 }}
//               >
//                 <span
//                   style={{
//                     fontSize: "0.75rem", // text-xs (12px)
//                     lineHeight: "1rem", // text-xs 默认行高
//                     fontFamily: "monospace", // font-mono
//                   }}
//                 >
//                   {timestamp}
//                 </span>
//                 <div
//                   // className={`whitespace-pre-wrap flex items-center font-mono text-sm text-gray-800 ${
//                   //   data ? "cursor-pointer" : ""
//                   // }`}
//                   style={{
//                     whiteSpace: "pre-wrap", // whitespace-pre-wrap
//                     display: "flex", // flex
//                     alignItems: "center", // items-center
//                     fontFamily: "monospace", // font-mono
//                     fontSize: "0.875rem", // text-sm (14px)
//                     lineHeight: "1.25rem", // text-sm default line-height
//                     color: "#1f2937", // text-gray-800 (Tailwind's gray-800)
//                     cursor: data ? "pointer" : "default", // conditional cursor-pointer
//                   }}
//                   onClick={() => data && toggleTranscriptItemExpand(itemId)}
//                 >
//                   {data && (
//                     <span
//                       // className={`text-gray-400 mr-1 transform transition-transform duration-200 select-none font-mono ${
//                       //   expanded ? "rotate-90" : "rotate-0"
//                       // }`}
//                       style={{
//                         color: "#9ca3af", // text-gray-400
//                         marginRight: "0.25rem", // mr-1 (4px)
//                         transition: "transform 200ms", // transition-transform duration-200
//                         userSelect: "none", // select-none
//                         fontFamily: "monospace", // font-mono
//                         transform: expanded ? "rotate(90deg)" : "rotate(0deg)", // conditional rotation
//                       }}
//                     >
//                       ▶
//                     </span>
//                   )}
//                   {title}
//                 </div>
//                 {expanded && data && (
//                   <div
//                     style={{
//                       color: "#1f2937", // text-gray-800
//                       textAlign: "left", // text-left
//                     }}
//                   >
//                     <pre
//                       style={{
//                         borderLeft: "2px solid #e5e7eb", // border-l-2 border-gray-200
//                         marginLeft: "0.25rem", // ml-1 (4px)
//                         whiteSpace: "pre-wrap", // whitespace-pre-wrap
//                         wordBreak: "break-word", // break-words
//                         fontFamily: "monospace", // font-mono
//                         fontSize: "0.75rem", // text-xs (12px)
//                         lineHeight: "1rem", // text-xs default line-height
//                         marginBottom: "0.5rem", // mb-2 (8px)
//                         marginTop: "0.5rem", // mt-2 (8px)
//                         paddingLeft: "0.5rem", // pl-2 (8px)
//                       }}
//                     >
//                       {JSON.stringify(data, null, 2)}
//                     </pre>
//                   </div>
//                 )}
//               </div>
//             );
//           } else {
//             // Fallback if type is neither MESSAGE nor BREADCRUMB
//             return (
//               <div
//                 key={itemId}
//                 // className="flex justify-center text-gray-500 text-sm italic font-mono"
//                 style={{
//                   display: "flex", // flex
//                   justifyContent: "center", // justify-center
//                   color: "#6b7280", // text-gray-500
//                   fontSize: "0.875rem", // text-sm (14px)
//                   lineHeight: "1.25rem", // text-sm default line-height
//                   fontStyle: "italic", // italic
//                   fontFamily: "monospace", // font-mono
//                 }}
//               >
//                 Unknown item type: {type}{" "}
//                 <span
//                   style={{
//                     marginLeft: "0.5rem", // ml-2 (8px in Tailwind)
//                     fontSize: "0.75rem", // text-xs (12px)
//                     lineHeight: "1rem", // text-xs default line-height
//                   }}
//                 >
//                   {timestamp}
//                 </span>
//               </div>
//             );
//           }
//         })}
//       </div>
//       <div>
//         <Button onClick={() => setIsPTTActive((prev) => !prev)}>
//           {!isPTTActive ? "关麦" : "开麦"}
//         </Button>
//         <Button onClick={() => onToggleConnection()}>
//           {getConnectionButtonLabel()}
//         </Button>
//       </div> */
// }
