// // // // // // // // // import React, { useState, useRef, useEffect, useCallback } from "react";
// // // // // // // // // import styles from "./voice.module.scss";

// // // // // // // // // // 类型定义
// // // // // // // // // type RecordingState = "idle" | "recording" | "cancel";

// // // // // // // // // interface MicIconProps {
// // // // // // // // //   className?: string;
// // // // // // // // // }

// // // // // // // // // interface WaveAnimationProps {
// // // // // // // // //   level: number;
// // // // // // // // // }

// // // // // // // // // // 录音结果数据
// // // // // // // // // interface VoiceRecordingResult {
// // // // // // // // //   blob: Blob;
// // // // // // // // //   duration: number;
// // // // // // // // //   url: string;
// // // // // // // // // }

// // // // // // // // // // 组件 Props
// // // // // // // // // interface VoiceChatButtonProps {
// // // // // // // // //   onSend?: (result: VoiceRecordingResult) => void;
// // // // // // // // //   onCancel?: () => void;
// // // // // // // // // }

// // // // // // // // // // 麦克风图标组件
// // // // // // // // // const MicIcon: React.FC<MicIconProps> = ({ className }) => (
// // // // // // // // //   <svg
// // // // // // // // //     className={className}
// // // // // // // // //     viewBox="0 0 24 24"
// // // // // // // // //     fill="none"
// // // // // // // // //     stroke="currentColor"
// // // // // // // // //     strokeWidth="2"
// // // // // // // // //     strokeLinecap="round"
// // // // // // // // //     strokeLinejoin="round"
// // // // // // // // //   >
// // // // // // // // //     <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
// // // // // // // // //     <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
// // // // // // // // //     <line x1="12" x2="12" y1="19" y2="22" />
// // // // // // // // //   </svg>
// // // // // // // // // );

// // // // // // // // // const VoiceChatButton: React.FC<VoiceChatButtonProps> = ({
// // // // // // // // //   onSend,
// // // // // // // // //   onCancel,
// // // // // // // // // }) => {
// // // // // // // // //   const [state, setState] = useState<RecordingState>("idle");
// // // // // // // // //   const [duration, setDuration] = useState<number>(0);
// // // // // // // // //   const [audioLevel, setAudioLevel] = useState<number>(0);
// // // // // // // // //   const [micError, setMicError] = useState<string | null>(null);

// // // // // // // // //   const startY = useRef<number>(0);
// // // // // // // // //   const isRecordingRef = useRef<boolean>(false);
// // // // // // // // //   const isStartingRef = useRef<boolean>(false);
// // // // // // // // //   const stateRef = useRef<RecordingState>("idle");
// // // // // // // // //   const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
// // // // // // // // //   const audioContextRef = useRef<AudioContext | null>(null);
// // // // // // // // //   const analyserRef = useRef<AnalyserNode | null>(null);
// // // // // // // // //   const mediaStreamRef = useRef<MediaStream | null>(null);
// // // // // // // // //   const animationRef = useRef<number | null>(null);
// // // // // // // // //   const mouseMoveHandlerRef = useRef<((e: MouseEvent) => void) | null>(null);
// // // // // // // // //   const mouseUpHandlerRef = useRef<(() => void) | null>(null);

// // // // // // // // //   // MediaRecorder 相关
// // // // // // // // //   const mediaRecorderRef = useRef<MediaRecorder | null>(null);
// // // // // // // // //   const audioChunksRef = useRef<Blob[]>([]);
// // // // // // // // //   const recordingDurationRef = useRef<number>(0);

// // // // // // // // //   // 同步 state 到 ref
// // // // // // // // //   useEffect(() => {
// // // // // // // // //     stateRef.current = state;
// // // // // // // // //   }, [state]);

// // // // // // // // //   // 清理资源
// // // // // // // // //   const cleanup = useCallback(() => {
// // // // // // // // //     if (timerRef.current) {
// // // // // // // // //       clearInterval(timerRef.current);
// // // // // // // // //       timerRef.current = null;
// // // // // // // // //     }
// // // // // // // // //     if (animationRef.current) {
// // // // // // // // //       cancelAnimationFrame(animationRef.current);
// // // // // // // // //       animationRef.current = null;
// // // // // // // // //     }
// // // // // // // // //     if (
// // // // // // // // //       mediaRecorderRef.current &&
// // // // // // // // //       mediaRecorderRef.current.state !== "inactive"
// // // // // // // // //     ) {
// // // // // // // // //       mediaRecorderRef.current.stop();
// // // // // // // // //       mediaRecorderRef.current = null;
// // // // // // // // //     }
// // // // // // // // //     if (mediaStreamRef.current) {
// // // // // // // // //       mediaStreamRef.current.getTracks().forEach((track) => track.stop());
// // // // // // // // //       mediaStreamRef.current = null;
// // // // // // // // //     }
// // // // // // // // //     if (audioContextRef.current) {
// // // // // // // // //       audioContextRef.current.close().catch(() => {});
// // // // // // // // //       audioContextRef.current = null;
// // // // // // // // //     }
// // // // // // // // //     if (mouseMoveHandlerRef.current) {
// // // // // // // // //       document.removeEventListener("mousemove", mouseMoveHandlerRef.current);
// // // // // // // // //       mouseMoveHandlerRef.current = null;
// // // // // // // // //     }
// // // // // // // // //     if (mouseUpHandlerRef.current) {
// // // // // // // // //       document.removeEventListener("mouseup", mouseUpHandlerRef.current);
// // // // // // // // //       mouseUpHandlerRef.current = null;
// // // // // // // // //     }
// // // // // // // // //   }, []);

// // // // // // // // //   // 重置状态
// // // // // // // // //   const resetState = useCallback(() => {
// // // // // // // // //     isRecordingRef.current = false;
// // // // // // // // //     isStartingRef.current = false;
// // // // // // // // //     audioChunksRef.current = [];
// // // // // // // // //     recordingDurationRef.current = 0;
// // // // // // // // //     cleanup();
// // // // // // // // //     setState("idle");
// // // // // // // // //     setDuration(0);
// // // // // // // // //     setAudioLevel(0);
// // // // // // // // //   }, [cleanup]);

// // // // // // // // //   // 发送语音
// // // // // // // // //   const handleSendVoice = useCallback(() => {
// // // // // // // // //     const currentDuration = recordingDurationRef.current;

// // // // // // // // //     if (currentDuration < 1) {
// // // // // // // // //       console.log("录音时间太短");
// // // // // // // // //       // 立即重置 UI
// // // // // // // // //       isRecordingRef.current = false;
// // // // // // // // //       isStartingRef.current = false;
// // // // // // // // //       setState("idle");
// // // // // // // // //       setDuration(0);
// // // // // // // // //       setAudioLevel(0);

// // // // // // // // //       // 异步清理
// // // // // // // // //       setTimeout(() => {
// // // // // // // // //         cleanup();
// // // // // // // // //         audioChunksRef.current = [];
// // // // // // // // //         recordingDurationRef.current = 0;
// // // // // // // // //       }, 0);
// // // // // // // // //       return;
// // // // // // // // //     }

// // // // // // // // //     // 停止 MediaRecorder 并获取音频数据
// // // // // // // // //     if (
// // // // // // // // //       mediaRecorderRef.current &&
// // // // // // // // //       mediaRecorderRef.current.state !== "inactive"
// // // // // // // // //     ) {
// // // // // // // // //       mediaRecorderRef.current.stop();
// // // // // // // // //     } else {
// // // // // // // // //       // 立即重置 UI
// // // // // // // // //       isRecordingRef.current = false;
// // // // // // // // //       isStartingRef.current = false;
// // // // // // // // //       setState("idle");
// // // // // // // // //       setDuration(0);
// // // // // // // // //       setAudioLevel(0);
// // // // // // // // //       setTimeout(() => cleanup(), 0);
// // // // // // // // //     }
// // // // // // // // //   }, [cleanup]);

// // // // // // // // //   // 取消语音 - 立即重置UI
// // // // // // // // //   const handleCancelVoice = useCallback(() => {
// // // // // // // // //     console.log("取消语音");

// // // // // // // // //     // 立即重置 UI 状态
// // // // // // // // //     isRecordingRef.current = false;
// // // // // // // // //     isStartingRef.current = false;
// // // // // // // // //     setState("idle");
// // // // // // // // //     setDuration(0);
// // // // // // // // //     setAudioLevel(0);

// // // // // // // // //     // 异步清理资源，不阻塞 UI
// // // // // // // // //     setTimeout(() => {
// // // // // // // // //       if (timerRef.current) {
// // // // // // // // //         clearInterval(timerRef.current);
// // // // // // // // //         timerRef.current = null;
// // // // // // // // //       }
// // // // // // // // //       if (animationRef.current) {
// // // // // // // // //         cancelAnimationFrame(animationRef.current);
// // // // // // // // //         animationRef.current = null;
// // // // // // // // //       }
// // // // // // // // //       if (mediaRecorderRef.current) {
// // // // // // // // //         try {
// // // // // // // // //           if (mediaRecorderRef.current.state !== "inactive") {
// // // // // // // // //             mediaRecorderRef.current.stop();
// // // // // // // // //           }
// // // // // // // // //         } catch (e) {}
// // // // // // // // //         mediaRecorderRef.current = null;
// // // // // // // // //       }
// // // // // // // // //       if (mediaStreamRef.current) {
// // // // // // // // //         mediaStreamRef.current.getTracks().forEach((track) => track.stop());
// // // // // // // // //         mediaStreamRef.current = null;
// // // // // // // // //       }
// // // // // // // // //       if (audioContextRef.current) {
// // // // // // // // //         audioContextRef.current.close().catch(() => {});
// // // // // // // // //         audioContextRef.current = null;
// // // // // // // // //       }
// // // // // // // // //       audioChunksRef.current = [];
// // // // // // // // //       recordingDurationRef.current = 0;
// // // // // // // // //     }, 0);

// // // // // // // // //     onCancel?.();
// // // // // // // // //   }, [onCancel]);

// // // // // // // // //   // 开始录音
// // // // // // // // //   const startRecording = useCallback(async () => {
// // // // // // // // //     if (isStartingRef.current || isRecordingRef.current) {
// // // // // // // // //       return;
// // // // // // // // //     }

// // // // // // // // //     isStartingRef.current = true;
// // // // // // // // //     setMicError(null);
// // // // // // // // //     audioChunksRef.current = [];

// // // // // // // // //     try {
// // // // // // // // //       const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

// // // // // // // // //       if (!isStartingRef.current) {
// // // // // // // // //         stream.getTracks().forEach((track) => track.stop());
// // // // // // // // //         return;
// // // // // // // // //       }

// // // // // // // // //       mediaStreamRef.current = stream;
// // // // // // // // //       isRecordingRef.current = true;
// // // // // // // // //       isStartingRef.current = false;
// // // // // // // // //       setState("recording");

// // // // // // // // //       // 设置 MediaRecorder 录音
// // // // // // // // //       const mimeType = MediaRecorder.isTypeSupported("audio/webm")
// // // // // // // // //         ? "audio/webm"
// // // // // // // // //         : MediaRecorder.isTypeSupported("audio/mp4")
// // // // // // // // //         ? "audio/mp4"
// // // // // // // // //         : "audio/ogg";

// // // // // // // // //       mediaRecorderRef.current = new MediaRecorder(stream, { mimeType });

// // // // // // // // //       mediaRecorderRef.current.ondataavailable = (event: BlobEvent) => {
// // // // // // // // //         if (event.data.size > 0) {
// // // // // // // // //           audioChunksRef.current.push(event.data);
// // // // // // // // //         }
// // // // // // // // //       };

// // // // // // // // //       mediaRecorderRef.current.onstop = () => {
// // // // // // // // //         const recordedDuration = recordingDurationRef.current;

// // // // // // // // //         if (audioChunksRef.current.length > 0 && recordedDuration >= 1) {
// // // // // // // // //           const audioBlob = new Blob(audioChunksRef.current, {
// // // // // // // // //             type: mimeType,
// // // // // // // // //           });
// // // // // // // // //           const audioUrl = URL.createObjectURL(audioBlob);

// // // // // // // // //           const result: VoiceRecordingResult = {
// // // // // // // // //             blob: audioBlob,
// // // // // // // // //             duration: recordedDuration,
// // // // // // // // //             url: audioUrl,
// // // // // // // // //           };

// // // // // // // // //           console.log(`发送语音，时长: ${recordedDuration}秒`, result);
// // // // // // // // //           onSend?.(result);
// // // // // // // // //         }

// // // // // // // // //         isRecordingRef.current = false;
// // // // // // // // //         isStartingRef.current = false;
// // // // // // // // //         audioChunksRef.current = [];
// // // // // // // // //         recordingDurationRef.current = 0;
// // // // // // // // //         cleanup();
// // // // // // // // //         setState("idle");
// // // // // // // // //         setDuration(0);
// // // // // // // // //         setAudioLevel(0);
// // // // // // // // //       };

// // // // // // // // //       mediaRecorderRef.current.start(100);

// // // // // // // // //       // 设置音频分析（用于可视化）
// // // // // // // // //       audioContextRef.current = new (window.AudioContext ||
// // // // // // // // //         (window as any).webkitAudioContext)();
// // // // // // // // //       analyserRef.current = audioContextRef.current.createAnalyser();
// // // // // // // // //       const source = audioContextRef.current.createMediaStreamSource(stream);
// // // // // // // // //       source.connect(analyserRef.current);
// // // // // // // // //       analyserRef.current.fftSize = 256;

// // // // // // // // //       // 可视化声波
// // // // // // // // //       const visualize = () => {
// // // // // // // // //         if (!analyserRef.current || !isRecordingRef.current) return;
// // // // // // // // //         const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
// // // // // // // // //         analyserRef.current.getByteFrequencyData(dataArray);
// // // // // // // // //         const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
// // // // // // // // //         setAudioLevel(average / 255);
// // // // // // // // //         animationRef.current = requestAnimationFrame(visualize);
// // // // // // // // //       };
// // // // // // // // //       visualize();

// // // // // // // // //       // 开始计时
// // // // // // // // //       let seconds = 0;
// // // // // // // // //       timerRef.current = setInterval(() => {
// // // // // // // // //         seconds++;
// // // // // // // // //         recordingDurationRef.current = seconds;
// // // // // // // // //         setDuration(seconds);
// // // // // // // // //         if (seconds >= 60) {
// // // // // // // // //           handleSendVoice();
// // // // // // // // //         }
// // // // // // // // //       }, 1000);
// // // // // // // // //     } catch (error: any) {
// // // // // // // // //       console.error("无法访问麦克风:", error);
// // // // // // // // //       isStartingRef.current = false;
// // // // // // // // //       isRecordingRef.current = false;

// // // // // // // // //       let errorMessage = "无法访问麦克风";
// // // // // // // // //       if (
// // // // // // // // //         error.name === "NotAllowedError" ||
// // // // // // // // //         error.name === "PermissionDeniedError"
// // // // // // // // //       ) {
// // // // // // // // //         errorMessage = "麦克风权限被拒绝，请在浏览器设置中允许访问麦克风";
// // // // // // // // //       } else if (
// // // // // // // // //         error.name === "NotFoundError" ||
// // // // // // // // //         error.name === "DevicesNotFoundError"
// // // // // // // // //       ) {
// // // // // // // // //         errorMessage = "未检测到麦克风设备";
// // // // // // // // //       } else if (
// // // // // // // // //         error.name === "NotReadableError" ||
// // // // // // // // //         error.name === "TrackStartError"
// // // // // // // // //       ) {
// // // // // // // // //         errorMessage = "麦克风被其他应用占用";
// // // // // // // // //       } else if (error.name === "SecurityError") {
// // // // // // // // //         errorMessage = "安全限制：请使用 HTTPS 或在本地环境中访问";
// // // // // // // // //       }

// // // // // // // // //       setMicError(errorMessage);
// // // // // // // // //       setTimeout(() => setMicError(null), 3000);
// // // // // // // // //     }
// // // // // // // // //   }, [handleSendVoice, onSend, cleanup]);

// // // // // // // // //   // 更新取消状态
// // // // // // // // //   const updateCancelState = useCallback((clientY: number): void => {
// // // // // // // // //     if (!isRecordingRef.current) return;
// // // // // // // // //     const deltaY = startY.current - clientY;
// // // // // // // // //     setState(deltaY > 100 ? "cancel" : "recording");
// // // // // // // // //   }, []);

// // // // // // // // //   // 处理结束
// // // // // // // // //   const handleEnd = useCallback(() => {
// // // // // // // // //     // 立即移除事件监听器
// // // // // // // // //     if (mouseMoveHandlerRef.current) {
// // // // // // // // //       document.removeEventListener("mousemove", mouseMoveHandlerRef.current);
// // // // // // // // //       mouseMoveHandlerRef.current = null;
// // // // // // // // //     }
// // // // // // // // //     if (mouseUpHandlerRef.current) {
// // // // // // // // //       document.removeEventListener("mouseup", mouseUpHandlerRef.current);
// // // // // // // // //       mouseUpHandlerRef.current = null;
// // // // // // // // //     }

// // // // // // // // //     // 如果正在启动中，取消启动
// // // // // // // // //     if (isStartingRef.current) {
// // // // // // // // //       isStartingRef.current = false;
// // // // // // // // //       return;
// // // // // // // // //     }

// // // // // // // // //     if (!isRecordingRef.current) return;

// // // // // // // // //     if (stateRef.current === "cancel") {
// // // // // // // // //       handleCancelVoice();
// // // // // // // // //     } else {
// // // // // // // // //       handleSendVoice();
// // // // // // // // //     }
// // // // // // // // //   }, [handleCancelVoice, handleSendVoice]);

// // // // // // // // //   // 触摸开始
// // // // // // // // //   const handleTouchStart = useCallback(
// // // // // // // // //     (e: React.TouchEvent) => {
// // // // // // // // //       e.preventDefault();
// // // // // // // // //       if (isStartingRef.current || isRecordingRef.current) return;
// // // // // // // // //       startY.current = e.touches[0].clientY;
// // // // // // // // //       startRecording();
// // // // // // // // //     },
// // // // // // // // //     [startRecording],
// // // // // // // // //   );

// // // // // // // // //   // 触摸移动
// // // // // // // // //   const handleTouchMove = useCallback(
// // // // // // // // //     (e: React.TouchEvent) => {
// // // // // // // // //       e.preventDefault();
// // // // // // // // //       updateCancelState(e.touches[0].clientY);
// // // // // // // // //     },
// // // // // // // // //     [updateCancelState],
// // // // // // // // //   );

// // // // // // // // //   // 触摸结束
// // // // // // // // //   const handleTouchEnd = useCallback(
// // // // // // // // //     (e: React.TouchEvent) => {
// // // // // // // // //       e.preventDefault();
// // // // // // // // //       e.stopPropagation();

// // // // // // // // //       // 立即调用结束处理
// // // // // // // // //       handleEnd();
// // // // // // // // //     },
// // // // // // // // //     [handleEnd],
// // // // // // // // //   );

// // // // // // // // //   // 鼠标按下
// // // // // // // // //   const handleMouseDown = useCallback(
// // // // // // // // //     (e: React.MouseEvent) => {
// // // // // // // // //       e.preventDefault();
// // // // // // // // //       if (isStartingRef.current || isRecordingRef.current) return;
// // // // // // // // //       startY.current = e.clientY;
// // // // // // // // //       startRecording();

// // // // // // // // //       mouseMoveHandlerRef.current = (moveEvent) => {
// // // // // // // // //         updateCancelState(moveEvent.clientY);
// // // // // // // // //       };

// // // // // // // // //       mouseUpHandlerRef.current = () => {
// // // // // // // // //         handleEnd();
// // // // // // // // //       };

// // // // // // // // //       document.addEventListener("mousemove", mouseMoveHandlerRef.current);
// // // // // // // // //       document.addEventListener("mouseup", mouseUpHandlerRef.current);
// // // // // // // // //     },
// // // // // // // // //     [startRecording, updateCancelState, handleEnd],
// // // // // // // // //   );

// // // // // // // // //   // 组件卸载时清理
// // // // // // // // //   useEffect(() => {
// // // // // // // // //     return () => cleanup();
// // // // // // // // //   }, [cleanup]);

// // // // // // // // //   const formatTime = (seconds: number): string => {
// // // // // // // // //     const mins = Math.floor(seconds / 60);
// // // // // // // // //     const secs = seconds % 60;
// // // // // // // // //     return `${mins}:${secs.toString().padStart(2, "0")}`;
// // // // // // // // //   };

// // // // // // // // //   const getCountdown = (): number | null => {
// // // // // // // // //     if (duration >= 50 && duration < 60) {
// // // // // // // // //       return 60 - duration;
// // // // // // // // //     }
// // // // // // // // //     return null;
// // // // // // // // //   };

// // // // // // // // //   const WaveAnimation: React.FC<WaveAnimationProps> = ({ level }) => {
// // // // // // // // //     const bars = 7;
// // // // // // // // //     return (
// // // // // // // // //       <div className={styles.waveContainer}>
// // // // // // // // //         {[...Array(bars)].map((_, i) => {
// // // // // // // // //           const height = 6 + level * 20 + Math.sin(Date.now() / 100 + i) * 4;
// // // // // // // // //           return (
// // // // // // // // //             <div
// // // // // // // // //               key={i}
// // // // // // // // //               className={styles.waveBar}
// // // // // // // // //               style={{ height: `${Math.max(6, height)}px` }}
// // // // // // // // //             />
// // // // // // // // //           );
// // // // // // // // //         })}
// // // // // // // // //       </div>
// // // // // // // // //     );
// // // // // // // // //   };

// // // // // // // // //   // 获取按钮类名
// // // // // // // // //   const getButtonClassName = (): string => {
// // // // // // // // //     const classNames = [styles.voiceButton];
// // // // // // // // //     if (state === "idle") classNames.push(styles.idle);
// // // // // // // // //     else if (state === "recording") classNames.push(styles.recording);
// // // // // // // // //     else if (state === "cancel") classNames.push(styles.cancel);
// // // // // // // // //     return classNames.join(" ");
// // // // // // // // //   };

// // // // // // // // //   // 获取状态提示类名
// // // // // // // // //   const getStateTooltipClassName = (): string => {
// // // // // // // // //     const classNames = [styles.stateTooltip];
// // // // // // // // //     if (state !== "idle") classNames.push(styles.visible);
// // // // // // // // //     else classNames.push(styles.hidden);
// // // // // // // // //     return classNames.join(" ");
// // // // // // // // //   };

// // // // // // // // //   // 获取状态内容类名
// // // // // // // // //   const getStateContentClassName = (): string => {
// // // // // // // // //     const classNames = [styles.stateContent];
// // // // // // // // //     if (state === "cancel") classNames.push(styles.cancel);
// // // // // // // // //     else classNames.push(styles.recording);
// // // // // // // // //     return classNames.join(" ");
// // // // // // // // //   };

// // // // // // // // //   // 获取状态箭头类名
// // // // // // // // //   const getStateArrowClassName = (): string => {
// // // // // // // // //     const classNames = [styles.stateArrow];
// // // // // // // // //     if (state === "cancel") classNames.push(styles.cancel);
// // // // // // // // //     else classNames.push(styles.recording);
// // // // // // // // //     return classNames.join(" ");
// // // // // // // // //   };

// // // // // // // // //   return (
// // // // // // // // //     <div className={styles.container}>
// // // // // // // // //       {state}
// // // // // // // // //       <div className={styles.card}>
// // // // // // // // //         <div className={styles.buttonContainer}>
// // // // // // // // //           {/* 麦克风错误提示 */}
// // // // // // // // //           {micError && (
// // // // // // // // //             <div className={styles.errorTooltip}>
// // // // // // // // //               <div className={styles.errorContent}>
// // // // // // // // //                 <div className={styles.errorHeader}>
// // // // // // // // //                   <svg
// // // // // // // // //                     className={styles.errorIcon}
// // // // // // // // //                     fill="none"
// // // // // // // // //                     stroke="currentColor"
// // // // // // // // //                     viewBox="0 0 24 24"
// // // // // // // // //                   >
// // // // // // // // //                     <path
// // // // // // // // //                       strokeLinecap="round"
// // // // // // // // //                       strokeLinejoin="round"
// // // // // // // // //                       strokeWidth={2}
// // // // // // // // //                       d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
// // // // // // // // //                     />
// // // // // // // // //                   </svg>
// // // // // // // // //                   <span className={styles.errorTitle}>无法录音</span>
// // // // // // // // //                 </div>
// // // // // // // // //                 <div className={styles.errorMessage}>{micError}</div>
// // // // // // // // //               </div>
// // // // // // // // //               <div className={styles.errorArrow} />
// // // // // // // // //             </div>
// // // // // // // // //           )}

// // // // // // // // //           {/* 录音状态提示 */}
// // // // // // // // //           <div className={getStateTooltipClassName()}>
// // // // // // // // //             <div className={getStateContentClassName()}>
// // // // // // // // //               <div className={styles.stateText}>
// // // // // // // // //                 {state === "cancel" ? "松手取消" : "松手发送，上移取消"}
// // // // // // // // //               </div>

// // // // // // // // //               {state !== "idle" && (
// // // // // // // // //                 <div className={styles.stateDuration}>
// // // // // // // // //                   {formatTime(duration)}
// // // // // // // // //                 </div>
// // // // // // // // //               )}

// // // // // // // // //               {getCountdown() !== null && (
// // // // // // // // //                 <div className={styles.stateCountdown}>
// // // // // // // // //                   还剩 {getCountdown()} 秒
// // // // // // // // //                 </div>
// // // // // // // // //               )}
// // // // // // // // //             </div>

// // // // // // // // //             <div className={getStateArrowClassName()} />
// // // // // // // // //           </div>

// // // // // // // // //           {/* 按住说话按钮 */}
// // // // // // // // //           <button
// // // // // // // // //             className={getButtonClassName()}
// // // // // // // // //             onTouchStart={handleTouchStart}
// // // // // // // // //             onTouchMove={handleTouchMove}
// // // // // // // // //             onTouchEnd={handleTouchEnd}
// // // // // // // // //             onMouseDown={handleMouseDown}
// // // // // // // // //           >
// // // // // // // // //             <div className={styles.buttonContent}>
// // // // // // // // //               {state === "idle" ? (
// // // // // // // // //                 <>
// // // // // // // // //                   <MicIcon className={styles.micIcon} />
// // // // // // // // //                   <span className={styles.buttonText}>按住说话</span>
// // // // // // // // //                 </>
// // // // // // // // //               ) : (
// // // // // // // // //                 <>
// // // // // // // // //                   <WaveAnimation level={audioLevel} />
// // // // // // // // //                   <span className={styles.buttonTextSmall}>
// // // // // // // // //                     {state === "cancel" ? "松手取消" : "录音中..."}
// // // // // // // // //                   </span>
// // // // // // // // //                 </>
// // // // // // // // //               )}
// // // // // // // // //             </div>
// // // // // // // // //           </button>
// // // // // // // // //         </div>
// // // // // // // // //       </div>
// // // // // // // // //     </div>
// // // // // // // // //   );
// // // // // // // // // };

// // // // // // // // // export default VoiceChatButton;

// // // // // // // // import React, { useState, useRef, useEffect, useCallback } from "react";
// // // // // // // // import styles from "./voice.module.scss";

// // // // // // // // // 类型定义
// // // // // // // // type RecordingState = "idle" | "recording" | "cancel";

// // // // // // // // interface MicIconProps {
// // // // // // // //   className?: string;
// // // // // // // // }

// // // // // // // // interface WaveAnimationProps {
// // // // // // // //   level: number;
// // // // // // // // }

// // // // // // // // // 录音结果数据
// // // // // // // // interface VoiceRecordingResult {
// // // // // // // //   blob: Blob;
// // // // // // // //   duration: number;
// // // // // // // //   url: string;
// // // // // // // // }

// // // // // // // // // 组件 Props
// // // // // // // // interface VoiceChatButtonProps {
// // // // // // // //   onSend?: (result: VoiceRecordingResult) => void;
// // // // // // // //   onCancel?: () => void;
// // // // // // // // }

// // // // // // // // // 麦克风图标组件
// // // // // // // // const MicIcon: React.FC<MicIconProps> = ({ className }) => (
// // // // // // // //   <svg
// // // // // // // //     className={className}
// // // // // // // //     viewBox="0 0 24 24"
// // // // // // // //     fill="none"
// // // // // // // //     stroke="currentColor"
// // // // // // // //     strokeWidth="2"
// // // // // // // //     strokeLinecap="round"
// // // // // // // //     strokeLinejoin="round"
// // // // // // // //   >
// // // // // // // //     <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
// // // // // // // //     <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
// // // // // // // //     <line x1="12" x2="12" y1="19" y2="22" />
// // // // // // // //   </svg>
// // // // // // // // );

// // // // // // // // const VoiceChatButton: React.FC<VoiceChatButtonProps> = ({
// // // // // // // //   onSend,
// // // // // // // //   onCancel,
// // // // // // // // }) => {
// // // // // // // //   const [state, setState] = useState<RecordingState>("idle");
// // // // // // // //   const [duration, setDuration] = useState<number>(0);
// // // // // // // //   const [audioLevel, setAudioLevel] = useState<number>(0);
// // // // // // // //   const [micError, setMicError] = useState<string | null>(null);

// // // // // // // //   const startY = useRef<number>(0);
// // // // // // // //   const stateRef = useRef<RecordingState>("idle");
// // // // // // // //   const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
// // // // // // // //   const audioContextRef = useRef<AudioContext | null>(null);
// // // // // // // //   const analyserRef = useRef<AnalyserNode | null>(null);
// // // // // // // //   const mediaStreamRef = useRef<MediaStream | null>(null);
// // // // // // // //   const animationRef = useRef<number | null>(null);

// // // // // // // //   // MediaRecorder 相关
// // // // // // // //   const mediaRecorderRef = useRef<MediaRecorder | null>(null);
// // // // // // // //   const audioChunksRef = useRef<Blob[]>([]);
// // // // // // // //   const recordingDurationRef = useRef<number>(0);

// // // // // // // //   // 录音会话ID - 用于防止旧回调干扰新会话
// // // // // // // //   const sessionIdRef = useRef<number>(0);
// // // // // // // //   // 记录当前 mimeType
// // // // // // // //   const mimeTypeRef = useRef<string>("audio/webm");

// // // // // // // //   // 同步 state 到 ref
// // // // // // // //   useEffect(() => {
// // // // // // // //     stateRef.current = state;
// // // // // // // //   }, [state]);

// // // // // // // //   // 同步清理资源 - 不等待异步操作
// // // // // // // //   const cleanupResources = useCallback(() => {
// // // // // // // //     console.log("[cleanup] 开始清理资源");

// // // // // // // //     // 清理定时器
// // // // // // // //     if (timerRef.current) {
// // // // // // // //       clearInterval(timerRef.current);
// // // // // // // //       timerRef.current = null;
// // // // // // // //     }

// // // // // // // //     // 清理动画帧
// // // // // // // //     if (animationRef.current) {
// // // // // // // //       cancelAnimationFrame(animationRef.current);
// // // // // // // //       animationRef.current = null;
// // // // // // // //     }

// // // // // // // //     // 清理 MediaRecorder - 先移除回调
// // // // // // // //     if (mediaRecorderRef.current) {
// // // // // // // //       const recorder = mediaRecorderRef.current;
// // // // // // // //       recorder.onstop = null;
// // // // // // // //       recorder.ondataavailable = null;
// // // // // // // //       recorder.onerror = null;

// // // // // // // //       if (recorder.state !== "inactive") {
// // // // // // // //         try {
// // // // // // // //           recorder.stop();
// // // // // // // //         } catch (e) {
// // // // // // // //           // 忽略错误
// // // // // // // //         }
// // // // // // // //       }
// // // // // // // //       mediaRecorderRef.current = null;
// // // // // // // //     }

// // // // // // // //     // 清理媒体流 - 这是关键！必须停止所有轨道
// // // // // // // //     if (mediaStreamRef.current) {
// // // // // // // //       const tracks = mediaStreamRef.current.getTracks();
// // // // // // // //       tracks.forEach((track) => {
// // // // // // // //         track.stop();
// // // // // // // //         console.log("[cleanup] Track stopped:", track.kind);
// // // // // // // //       });
// // // // // // // //       mediaStreamRef.current = null;
// // // // // // // //     }

// // // // // // // //     // 清理音频上下文 - 不等待 close() 完成
// // // // // // // //     if (audioContextRef.current) {
// // // // // // // //       const ctx = audioContextRef.current;
// // // // // // // //       audioContextRef.current = null;
// // // // // // // //       analyserRef.current = null;

// // // // // // // //       // 异步关闭，但不等待
// // // // // // // //       if (ctx.state !== "closed") {
// // // // // // // //         ctx.close().catch(() => {});
// // // // // // // //       }
// // // // // // // //     }

// // // // // // // //     console.log("[cleanup] 清理完成");
// // // // // // // //   }, []);

// // // // // // // //   // 完全重置到初始状态
// // // // // // // //   const resetToIdle = useCallback(() => {
// // // // // // // //     console.log("[resetToIdle] 重置到初始状态");

// // // // // // // //     // 增加 session ID，使所有旧的回调失效
// // // // // // // //     sessionIdRef.current += 1;

// // // // // // // //     // 清理资源
// // // // // // // //     cleanupResources();

// // // // // // // //     // 重置数据
// // // // // // // //     audioChunksRef.current = [];
// // // // // // // //     recordingDurationRef.current = 0;

// // // // // // // //     // 重置 UI 状态
// // // // // // // //     setState("idle");
// // // // // // // //     setDuration(0);
// // // // // // // //     setAudioLevel(0);
// // // // // // // //   }, [cleanupResources]);

// // // // // // // //   // 发送语音
// // // // // // // //   const handleSendVoice = useCallback(
// // // // // // // //     (currentSessionId: number) => {
// // // // // // // //       console.log(
// // // // // // // //         "[handleSendVoice] 尝试发送语音, sessionId:",
// // // // // // // //         currentSessionId,
// // // // // // // //       );

// // // // // // // //       // 检查 session 是否仍然有效
// // // // // // // //       if (sessionIdRef.current !== currentSessionId) {
// // // // // // // //         console.log("[handleSendVoice] Session 已过期，忽略");
// // // // // // // //         return;
// // // // // // // //       }

// // // // // // // //       const currentDuration = recordingDurationRef.current;
// // // // // // // //       const currentChunks = [...audioChunksRef.current];
// // // // // // // //       const currentMimeType = mimeTypeRef.current;

// // // // // // // //       if (currentDuration < 1) {
// // // // // // // //         console.log("[handleSendVoice] 录音时间太短，取消发送");
// // // // // // // //         resetToIdle();
// // // // // // // //         return;
// // // // // // // //       }

// // // // // // // //       // 如果 MediaRecorder 还在运行，需要等它停止后获取最后的数据
// // // // // // // //       if (
// // // // // // // //         mediaRecorderRef.current &&
// // // // // // // //         mediaRecorderRef.current.state !== "inactive"
// // // // // // // //       ) {
// // // // // // // //         const recorder = mediaRecorderRef.current;

// // // // // // // //         recorder.onstop = () => {
// // // // // // // //           console.log("[onstop] MediaRecorder stopped");

// // // // // // // //           // 再次检查 session
// // // // // // // //           if (sessionIdRef.current !== currentSessionId) {
// // // // // // // //             console.log("[onstop] Session 已变化，忽略");
// // // // // // // //             return;
// // // // // // // //           }

// // // // // // // //           const allChunks = [...currentChunks, ...audioChunksRef.current];

// // // // // // // //           if (allChunks.length > 0 && currentDuration >= 1) {
// // // // // // // //             const audioBlob = new Blob(allChunks, { type: currentMimeType });
// // // // // // // //             const audioUrl = URL.createObjectURL(audioBlob);

// // // // // // // //             const result: VoiceRecordingResult = {
// // // // // // // //               blob: audioBlob,
// // // // // // // //               duration: currentDuration,
// // // // // // // //               url: audioUrl,
// // // // // // // //             };

// // // // // // // //             console.log(`[onstop] 发送语音，时长: ${currentDuration}秒`);
// // // // // // // //             onSend?.(result);
// // // // // // // //           }

// // // // // // // //           resetToIdle();
// // // // // // // //         };

// // // // // // // //         try {
// // // // // // // //           recorder.stop();
// // // // // // // //         } catch (e) {
// // // // // // // //           console.error("[handleSendVoice] Error stopping recorder:", e);
// // // // // // // //           resetToIdle();
// // // // // // // //         }
// // // // // // // //       } else {
// // // // // // // //         // MediaRecorder 已经停止或不存在
// // // // // // // //         if (currentChunks.length > 0 && currentDuration >= 1) {
// // // // // // // //           const audioBlob = new Blob(currentChunks, { type: currentMimeType });
// // // // // // // //           const audioUrl = URL.createObjectURL(audioBlob);

// // // // // // // //           const result: VoiceRecordingResult = {
// // // // // // // //             blob: audioBlob,
// // // // // // // //             duration: currentDuration,
// // // // // // // //             url: audioUrl,
// // // // // // // //           };

// // // // // // // //           console.log(
// // // // // // // //             `[handleSendVoice] 直接发送语音，时长: ${currentDuration}秒`,
// // // // // // // //           );
// // // // // // // //           onSend?.(result);
// // // // // // // //         }
// // // // // // // //         resetToIdle();
// // // // // // // //       }
// // // // // // // //     },
// // // // // // // //     [resetToIdle, onSend],
// // // // // // // //   );

// // // // // // // //   // 取消语音
// // // // // // // //   const handleCancelVoice = useCallback(() => {
// // // // // // // //     console.log("[handleCancelVoice] 取消语音");
// // // // // // // //     resetToIdle();
// // // // // // // //     onCancel?.();
// // // // // // // //   }, [resetToIdle, onCancel]);

// // // // // // // //   // 处理结束录音
// // // // // // // //   const handleEndRef = useRef<() => void>();
// // // // // // // //   handleEndRef.current = () => {
// // // // // // // //     const currentSessionId = sessionIdRef.current;
// // // // // // // //     console.log(
// // // // // // // //       "[handleEnd] 结束操作, state:",
// // // // // // // //       stateRef.current,
// // // // // // // //       "sessionId:",
// // // // // // // //       currentSessionId,
// // // // // // // //     );

// // // // // // // //     // 如果不是录音状态，忽略
// // // // // // // //     if (stateRef.current === "idle") {
// // // // // // // //       console.log("[handleEnd] 当前是 idle 状态，忽略");
// // // // // // // //       return;
// // // // // // // //     }

// // // // // // // //     if (stateRef.current === "cancel") {
// // // // // // // //       handleCancelVoice();
// // // // // // // //     } else {
// // // // // // // //       handleSendVoice(currentSessionId);
// // // // // // // //     }
// // // // // // // //   };

// // // // // // // //   // 开始录音 - 简化逻辑，避免复杂的状态检查
// // // // // // // //   const startRecording = useCallback(async () => {
// // // // // // // //     // 如果已经在录音，忽略
// // // // // // // //     if (stateRef.current !== "idle") {
// // // // // // // //       console.log("[startRecording] 已经在录音中，忽略");
// // // // // // // //       return;
// // // // // // // //     }

// // // // // // // //     // 创建新的 session
// // // // // // // //     const currentSessionId = ++sessionIdRef.current;
// // // // // // // //     console.log("[startRecording] 开始录音, sessionId:", currentSessionId);

// // // // // // // //     // 立即切换到录音状态，提供即时反馈
// // // // // // // //     setState("recording");
// // // // // // // //     setMicError(null);
// // // // // // // //     audioChunksRef.current = [];
// // // // // // // //     recordingDurationRef.current = 0;

// // // // // // // //     try {
// // // // // // // //       // 请求麦克风权限
// // // // // // // //       console.log("[startRecording] 请求麦克风权限...");
// // // // // // // //       const stream = await navigator.mediaDevices.getUserMedia({
// // // // // // // //         audio: {
// // // // // // // //           echoCancellation: true,
// // // // // // // //           noiseSuppression: true,
// // // // // // // //         },
// // // // // // // //       });

// // // // // // // //       // 检查 session 是否仍然有效（用户可能在等待期间取消了）
// // // // // // // //       if (sessionIdRef.current !== currentSessionId) {
// // // // // // // //         console.log("[startRecording] Session 已变化，清理并退出");
// // // // // // // //         stream.getTracks().forEach((track) => track.stop());
// // // // // // // //         return;
// // // // // // // //       }

// // // // // // // //       // 再次检查状态（可能在等待期间被取消了）
// // // // // // // //       if (stateRef.current === "idle") {
// // // // // // // //         console.log("[startRecording] 状态已变为 idle，清理并退出");
// // // // // // // //         stream.getTracks().forEach((track) => track.stop());
// // // // // // // //         return;
// // // // // // // //       }

// // // // // // // //       console.log("[startRecording] 获取到麦克风权限");
// // // // // // // //       mediaStreamRef.current = stream;

// // // // // // // //       // 设置 MediaRecorder
// // // // // // // //       const mimeType = MediaRecorder.isTypeSupported("audio/webm")
// // // // // // // //         ? "audio/webm"
// // // // // // // //         : MediaRecorder.isTypeSupported("audio/mp4")
// // // // // // // //         ? "audio/mp4"
// // // // // // // //         : "audio/ogg";

// // // // // // // //       mimeTypeRef.current = mimeType;
// // // // // // // //       console.log("[startRecording] 使用 mimeType:", mimeType);

// // // // // // // //       const recorder = new MediaRecorder(stream, { mimeType });
// // // // // // // //       mediaRecorderRef.current = recorder;

// // // // // // // //       recorder.ondataavailable = (event: BlobEvent) => {
// // // // // // // //         if (sessionIdRef.current !== currentSessionId) return;
// // // // // // // //         if (event.data.size > 0) {
// // // // // // // //           audioChunksRef.current.push(event.data);
// // // // // // // //         }
// // // // // // // //       };

// // // // // // // //       recorder.onerror = (event) => {
// // // // // // // //         console.error("[MediaRecorder] Error:", event);
// // // // // // // //         if (sessionIdRef.current === currentSessionId) {
// // // // // // // //           resetToIdle();
// // // // // // // //         }
// // // // // // // //       };

// // // // // // // //       recorder.start(100);
// // // // // // // //       console.log("[startRecording] MediaRecorder 已启动");

// // // // // // // //       // 有问题 需要整改

// // // // // // // //       // // 设置音频分析（用于可视化）
// // // // // // // //       // try {
// // // // // // // //       //   const AudioContextClass =
// // // // // // // //       //     window.AudioContext || (window as any).webkitAudioContext;
// // // // // // // //       //   audioContextRef.current = new AudioContextClass();
// // // // // // // //       //   analyserRef.current = audioContextRef.current.createAnalyser();
// // // // // // // //       //   const source = audioContextRef.current.createMediaStreamSource(stream);
// // // // // // // //       //   source.connect(analyserRef.current);
// // // // // // // //       //   analyserRef.current.fftSize = 256;

// // // // // // // //       //   // 可视化声波
// // // // // // // //       //   const visualize = () => {
// // // // // // // //       //     if (sessionIdRef.current !== currentSessionId) return;
// // // // // // // //       //     if (!analyserRef.current) return;

// // // // // // // //       //     const dataArray = new Uint8Array(
// // // // // // // //       //       analyserRef.current.frequencyBinCount,
// // // // // // // //       //     );
// // // // // // // //       //     analyserRef.current.getByteFrequencyData(dataArray);
// // // // // // // //       //     const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
// // // // // // // //       //     setAudioLevel(average / 255);
// // // // // // // //       //     animationRef.current = requestAnimationFrame(visualize);
// // // // // // // //       //   };
// // // // // // // //       //   visualize();
// // // // // // // //       // } catch (e) {
// // // // // // // //       //   console.warn("[startRecording] 音频分析初始化失败:", e);
// // // // // // // //       //   // 继续录音，只是没有可视化
// // // // // // // //       // }

// // // // // // // //       // 开始计时
// // // // // // // //       let seconds = 0;
// // // // // // // //       timerRef.current = setInterval(() => {
// // // // // // // //         if (sessionIdRef.current !== currentSessionId) {
// // // // // // // //           if (timerRef.current) {
// // // // // // // //             clearInterval(timerRef.current);
// // // // // // // //             timerRef.current = null;
// // // // // // // //           }
// // // // // // // //           return;
// // // // // // // //         }
// // // // // // // //         seconds++;
// // // // // // // //         recordingDurationRef.current = seconds;
// // // // // // // //         setDuration(seconds);

// // // // // // // //         // 60秒自动发送
// // // // // // // //         if (seconds >= 60) {
// // // // // // // //           handleEndRef.current?.();
// // // // // // // //         }
// // // // // // // //       }, 1000);
// // // // // // // //     } catch (error: any) {
// // // // // // // //       console.error("[startRecording] 无法访问麦克风:", error);

// // // // // // // //       // 只有当前 session 仍然有效时才处理错误
// // // // // // // //       if (sessionIdRef.current === currentSessionId) {
// // // // // // // //         let errorMessage = "无法访问麦克风";
// // // // // // // //         if (
// // // // // // // //           error.name === "NotAllowedError" ||
// // // // // // // //           error.name === "PermissionDeniedError"
// // // // // // // //         ) {
// // // // // // // //           errorMessage = "麦克风权限被拒绝，请在浏览器设置中允许访问麦克风";
// // // // // // // //         } else if (
// // // // // // // //           error.name === "NotFoundError" ||
// // // // // // // //           error.name === "DevicesNotFoundError"
// // // // // // // //         ) {
// // // // // // // //           errorMessage = "未检测到麦克风设备";
// // // // // // // //         } else if (
// // // // // // // //           error.name === "NotReadableError" ||
// // // // // // // //           error.name === "TrackStartError"
// // // // // // // //         ) {
// // // // // // // //           errorMessage = "麦克风被其他应用占用";
// // // // // // // //         } else if (error.name === "SecurityError") {
// // // // // // // //           errorMessage = "安全限制：请使用 HTTPS 或在本地环境中访问";
// // // // // // // //         }

// // // // // // // //         setMicError(errorMessage);
// // // // // // // //         setTimeout(() => setMicError(null), 3000);

// // // // // // // //         // 重置到 idle 状态
// // // // // // // //         resetToIdle();
// // // // // // // //       }
// // // // // // // //     }
// // // // // // // //   }, [resetToIdle]);

// // // // // // // //   // 更新取消状态
// // // // // // // //   const updateCancelStateRef = useRef<(clientY: number) => void>();
// // // // // // // //   updateCancelStateRef.current = (clientY: number) => {
// // // // // // // //     if (stateRef.current === "idle") return;
// // // // // // // //     const deltaY = startY.current - clientY;
// // // // // // // //     const newState: RecordingState = deltaY > 100 ? "cancel" : "recording";
// // // // // // // //     if (stateRef.current !== newState) {
// // // // // // // //       setState(newState);
// // // // // // // //     }
// // // // // // // //   };

// // // // // // // //   // 全局事件处理
// // // // // // // //   useEffect(() => {
// // // // // // // //     const handleGlobalEnd = (e: Event) => {
// // // // // // // //       if (stateRef.current !== "idle") {
// // // // // // // //         console.log(
// // // // // // // //           "[globalEnd] 触发结束, eventType:",
// // // // // // // //           e.type,
// // // // // // // //           "state:",
// // // // // // // //           stateRef.current,
// // // // // // // //         );
// // // // // // // //         e.preventDefault();
// // // // // // // //         e.stopPropagation();
// // // // // // // //         handleEndRef.current?.();
// // // // // // // //       }
// // // // // // // //     };

// // // // // // // //     const handleGlobalMove = (clientY: number) => {
// // // // // // // //       if (stateRef.current !== "idle") {
// // // // // // // //         updateCancelStateRef.current?.(clientY);
// // // // // // // //       }
// // // // // // // //     };

// // // // // // // //     const handleMouseMove = (e: MouseEvent) => handleGlobalMove(e.clientY);
// // // // // // // //     const handleTouchMove = (e: TouchEvent) => {
// // // // // // // //       if (e.touches.length > 0) {
// // // // // // // //         e.preventDefault();
// // // // // // // //         handleGlobalMove(e.touches[0].clientY);
// // // // // // // //       }
// // // // // // // //     };

// // // // // // // //     // 页面可见性变化
// // // // // // // //     const handleVisibilityChange = () => {
// // // // // // // //       if (document.hidden && stateRef.current !== "idle") {
// // // // // // // //         console.log("[visibilityChange] 页面隐藏，取消录音");
// // // // // // // //         handleCancelVoice();
// // // // // // // //       }
// // // // // // // //     };

// // // // // // // //     // 窗口失焦
// // // // // // // //     const handleWindowBlur = () => {
// // // // // // // //       if (stateRef.current !== "idle") {
// // // // // // // //         console.log("[windowBlur] 窗口失焦，结束录音");
// // // // // // // //         handleEndRef.current?.();
// // // // // // // //       }
// // // // // // // //     };

// // // // // // // //     // 使用 capture 模式
// // // // // // // //     const options = { capture: true };

// // // // // // // //     document.addEventListener("mouseup", handleGlobalEnd, options);
// // // // // // // //     document.addEventListener("touchend", handleGlobalEnd, options);
// // // // // // // //     document.addEventListener("pointerup", handleGlobalEnd, options);
// // // // // // // //     document.addEventListener("pointercancel", handleGlobalEnd, options);
// // // // // // // //     document.addEventListener("mousemove", handleMouseMove, options);
// // // // // // // //     document.addEventListener("touchmove", handleTouchMove, {
// // // // // // // //       capture: true,
// // // // // // // //       passive: false,
// // // // // // // //     });
// // // // // // // //     document.addEventListener("visibilitychange", handleVisibilityChange);
// // // // // // // //     window.addEventListener("blur", handleWindowBlur);

// // // // // // // //     // 也监听 window 级别
// // // // // // // //     window.addEventListener("mouseup", handleGlobalEnd, options);
// // // // // // // //     window.addEventListener("touchend", handleGlobalEnd, options);
// // // // // // // //     window.addEventListener("pointerup", handleGlobalEnd, options);

// // // // // // // //     return () => {
// // // // // // // //       document.removeEventListener("mouseup", handleGlobalEnd, options);
// // // // // // // //       document.removeEventListener("touchend", handleGlobalEnd, options);
// // // // // // // //       document.removeEventListener("pointerup", handleGlobalEnd, options);
// // // // // // // //       document.removeEventListener("pointercancel", handleGlobalEnd, options);
// // // // // // // //       document.removeEventListener("mousemove", handleMouseMove, options);
// // // // // // // //       document.removeEventListener("touchmove", handleTouchMove, options);
// // // // // // // //       document.removeEventListener("visibilitychange", handleVisibilityChange);
// // // // // // // //       window.removeEventListener("blur", handleWindowBlur);
// // // // // // // //       window.removeEventListener("mouseup", handleGlobalEnd, options);
// // // // // // // //       window.removeEventListener("touchend", handleGlobalEnd, options);
// // // // // // // //       window.removeEventListener("pointerup", handleGlobalEnd, options);
// // // // // // // //     };
// // // // // // // //   }, [handleCancelVoice]);

// // // // // // // //   // 触摸/鼠标按下处理
// // // // // // // //   const handleStart = useCallback(
// // // // // // // //     (clientY: number) => {
// // // // // // // //       console.log("[handleStart] 按下, currentState:", stateRef.current);

// // // // // // // //       if (stateRef.current !== "idle") {
// // // // // // // //         console.log("[handleStart] 不是 idle 状态，忽略");
// // // // // // // //         return;
// // // // // // // //       }

// // // // // // // //       startY.current = clientY;
// // // // // // // //       startRecording();
// // // // // // // //     },
// // // // // // // //     [startRecording],
// // // // // // // //   );

// // // // // // // //   const handleTouchStart = useCallback(
// // // // // // // //     (e: React.TouchEvent) => {
// // // // // // // //       e.preventDefault();
// // // // // // // //       e.stopPropagation();
// // // // // // // //       handleStart(e.touches[0].clientY);
// // // // // // // //     },
// // // // // // // //     [handleStart],
// // // // // // // //   );

// // // // // // // //   const handleMouseDown = useCallback(
// // // // // // // //     (e: React.MouseEvent) => {
// // // // // // // //       e.preventDefault();
// // // // // // // //       e.stopPropagation();
// // // // // // // //       handleStart(e.clientY);
// // // // // // // //     },
// // // // // // // //     [handleStart],
// // // // // // // //   );

// // // // // // // //   const handlePointerDown = useCallback(
// // // // // // // //     (e: React.PointerEvent) => {
// // // // // // // //       e.preventDefault();
// // // // // // // //       e.stopPropagation();
// // // // // // // //       handleStart(e.clientY);
// // // // // // // //     },
// // // // // // // //     [handleStart],
// // // // // // // //   );

// // // // // // // //   // 组件卸载时清理
// // // // // // // //   useEffect(() => {
// // // // // // // //     return () => {
// // // // // // // //       console.log("[unmount] 组件卸载");
// // // // // // // //       sessionIdRef.current += 1;
// // // // // // // //       cleanupResources();
// // // // // // // //     };
// // // // // // // //   }, [cleanupResources]);

// // // // // // // //   // 工具函数
// // // // // // // //   const formatTime = (seconds: number): string => {
// // // // // // // //     const mins = Math.floor(seconds / 60);
// // // // // // // //     const secs = seconds % 60;
// // // // // // // //     return `${mins}:${secs.toString().padStart(2, "0")}`;
// // // // // // // //   };

// // // // // // // //   const getCountdown = (): number | null => {
// // // // // // // //     if (duration >= 50 && duration < 60) {
// // // // // // // //       return 60 - duration;
// // // // // // // //     }
// // // // // // // //     return null;
// // // // // // // //   };

// // // // // // // //   // 波形动画组件
// // // // // // // //   const WaveAnimation: React.FC<WaveAnimationProps> = ({ level }) => {
// // // // // // // //     const bars = 7;
// // // // // // // //     return (
// // // // // // // //       <div className={styles.waveContainer}>
// // // // // // // //         {[...Array(bars)].map((_, i) => {
// // // // // // // //           const height = 6 + level * 20 + Math.sin(Date.now() / 100 + i) * 4;
// // // // // // // //           return (
// // // // // // // //             <div
// // // // // // // //               key={i}
// // // // // // // //               className={styles.waveBar}
// // // // // // // //               style={{ height: `${Math.max(6, height)}px` }}
// // // // // // // //             />
// // // // // // // //           );
// // // // // // // //         })}
// // // // // // // //       </div>
// // // // // // // //     );
// // // // // // // //   };

// // // // // // // //   // 样式类名获取
// // // // // // // //   const getButtonClassName = (): string => {
// // // // // // // //     const classNames = [styles.voiceButton];
// // // // // // // //     if (state === "idle") classNames.push(styles.idle);
// // // // // // // //     else if (state === "recording") classNames.push(styles.recording);
// // // // // // // //     else if (state === "cancel") classNames.push(styles.cancel);
// // // // // // // //     return classNames.join(" ");
// // // // // // // //   };

// // // // // // // //   const getStateTooltipClassName = (): string => {
// // // // // // // //     const classNames = [styles.stateTooltip];
// // // // // // // //     if (state !== "idle") classNames.push(styles.visible);
// // // // // // // //     else classNames.push(styles.hidden);
// // // // // // // //     return classNames.join(" ");
// // // // // // // //   };

// // // // // // // //   const getStateContentClassName = (): string => {
// // // // // // // //     const classNames = [styles.stateContent];
// // // // // // // //     if (state === "cancel") classNames.push(styles.cancel);
// // // // // // // //     else classNames.push(styles.recording);
// // // // // // // //     return classNames.join(" ");
// // // // // // // //   };

// // // // // // // //   const getStateArrowClassName = (): string => {
// // // // // // // //     const classNames = [styles.stateArrow];
// // // // // // // //     if (state === "cancel") classNames.push(styles.cancel);
// // // // // // // //     else classNames.push(styles.recording);
// // // // // // // //     return classNames.join(" ");
// // // // // // // //   };

// // // // // // // //   return (
// // // // // // // //     <div className={styles.container}>
// // // // // // // //       {state}
// // // // // // // //       <div className={styles.card}>
// // // // // // // //         <div className={styles.buttonContainer}>
// // // // // // // //           {/* 麦克风错误提示 */}
// // // // // // // //           {micError && (
// // // // // // // //             <div className={styles.errorTooltip}>
// // // // // // // //               <div className={styles.errorContent}>
// // // // // // // //                 <div className={styles.errorHeader}>
// // // // // // // //                   <svg
// // // // // // // //                     className={styles.errorIcon}
// // // // // // // //                     fill="none"
// // // // // // // //                     stroke="currentColor"
// // // // // // // //                     viewBox="0 0 24 24"
// // // // // // // //                   >
// // // // // // // //                     <path
// // // // // // // //                       strokeLinecap="round"
// // // // // // // //                       strokeLinejoin="round"
// // // // // // // //                       strokeWidth={2}
// // // // // // // //                       d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
// // // // // // // //                     />
// // // // // // // //                   </svg>
// // // // // // // //                   <span className={styles.errorTitle}>无法录音</span>
// // // // // // // //                 </div>
// // // // // // // //                 <div className={styles.errorMessage}>{micError}</div>
// // // // // // // //               </div>
// // // // // // // //               <div className={styles.errorArrow} />
// // // // // // // //             </div>
// // // // // // // //           )}

// // // // // // // //           {/* 录音状态提示 */}
// // // // // // // //           <div className={getStateTooltipClassName()}>
// // // // // // // //             <div className={getStateContentClassName()}>
// // // // // // // //               <div className={styles.stateText}>
// // // // // // // //                 {state === "cancel" ? "松手取消" : "松手发送，上移取消"}
// // // // // // // //               </div>

// // // // // // // //               {state !== "idle" && (
// // // // // // // //                 <div className={styles.stateDuration}>
// // // // // // // //                   {formatTime(duration)}
// // // // // // // //                 </div>
// // // // // // // //               )}

// // // // // // // //               {getCountdown() !== null && (
// // // // // // // //                 <div className={styles.stateCountdown}>
// // // // // // // //                   还剩 {getCountdown()} 秒
// // // // // // // //                 </div>
// // // // // // // //               )}
// // // // // // // //             </div>

// // // // // // // //             <div className={getStateArrowClassName()} />
// // // // // // // //           </div>

// // // // // // // //           {/* 按住说话按钮 */}
// // // // // // // //           <button
// // // // // // // //             className={getButtonClassName()}
// // // // // // // //             onTouchStart={handleTouchStart}
// // // // // // // //             onMouseDown={handleMouseDown}
// // // // // // // //             onPointerDown={handlePointerDown}
// // // // // // // //             style={{ touchAction: "none" }}
// // // // // // // //           >
// // // // // // // //             <div className={styles.buttonContent}>
// // // // // // // //               {state === "idle" ? (
// // // // // // // //                 <>
// // // // // // // //                   <MicIcon className={styles.micIcon} />
// // // // // // // //                   <span className={styles.buttonText}>按住说话</span>
// // // // // // // //                 </>
// // // // // // // //               ) : (
// // // // // // // //                 <>
// // // // // // // //                   <WaveAnimation level={audioLevel} />
// // // // // // // //                   <span className={styles.buttonTextSmall}>
// // // // // // // //                     {state === "cancel" ? "松手取消" : "录音中..."}
// // // // // // // //                   </span>
// // // // // // // //                 </>
// // // // // // // //               )}
// // // // // // // //             </div>
// // // // // // // //           </button>
// // // // // // // //         </div>
// // // // // // // //       </div>
// // // // // // // //     </div>
// // // // // // // //   );
// // // // // // // // };

// // // // // // // // export default VoiceChatButton;

// // // // // // // import React, { useState, useRef, useEffect, useCallback } from "react";
// // // // // // // import styles from "./voice.module.scss";

// // // // // // // // 类型定义
// // // // // // // type RecordingState = "idle" | "recording" | "cancel";

// // // // // // // interface MicIconProps {
// // // // // // //   className?: string;
// // // // // // // }

// // // // // // // interface WaveAnimationProps {
// // // // // // //   isActive: boolean;
// // // // // // // }

// // // // // // // // 录音结果数据
// // // // // // // interface VoiceRecordingResult {
// // // // // // //   blob: Blob;
// // // // // // //   duration: number;
// // // // // // //   url: string;
// // // // // // // }

// // // // // // // // 组件 Props
// // // // // // // interface VoiceChatButtonProps {
// // // // // // //   onSend?: (result: VoiceRecordingResult) => void;
// // // // // // //   onCancel?: () => void;
// // // // // // // }

// // // // // // // // 麦克风图标组件
// // // // // // // const MicIcon: React.FC<MicIconProps> = ({ className }) => (
// // // // // // //   <svg
// // // // // // //     className={className}
// // // // // // //     viewBox="0 0 24 24"
// // // // // // //     fill="none"
// // // // // // //     stroke="currentColor"
// // // // // // //     strokeWidth="2"
// // // // // // //     strokeLinecap="round"
// // // // // // //     strokeLinejoin="round"
// // // // // // //   >
// // // // // // //     <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
// // // // // // //     <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
// // // // // // //     <line x1="12" x2="12" y1="19" y2="22" />
// // // // // // //   </svg>
// // // // // // // );

// // // // // // // // 模拟波形动画组件
// // // // // // // const WaveAnimation: React.FC<WaveAnimationProps> = ({ isActive }) => {
// // // // // // //   const [tick, setTick] = useState(0);

// // // // // // //   useEffect(() => {
// // // // // // //     if (!isActive) return;
// // // // // // //     const interval = setInterval(() => {
// // // // // // //       setTick((t) => t + 1);
// // // // // // //     }, 100);
// // // // // // //     return () => clearInterval(interval);
// // // // // // //   }, [isActive]);

// // // // // // //   return (
// // // // // // //     <div className={styles.waveContainer}>
// // // // // // //       {[...Array(7)].map((_, i) => {
// // // // // // //         const phase = tick * 0.3 + i * 0.8;
// // // // // // //         const height = 8 + Math.sin(phase) * 6 + Math.sin(phase * 1.5) * 4;
// // // // // // //         return (
// // // // // // //           <div
// // // // // // //             key={i}
// // // // // // //             className={styles.waveBar}
// // // // // // //             style={{ height: `${Math.max(4, height)}px` }}
// // // // // // //           />
// // // // // // //         );
// // // // // // //       })}
// // // // // // //     </div>
// // // // // // //   );
// // // // // // // };

// // // // // // // const VoiceChatButton: React.FC<VoiceChatButtonProps> = ({
// // // // // // //   onSend,
// // // // // // //   onCancel,
// // // // // // // }) => {
// // // // // // //   const [state, setState] = useState<RecordingState>("idle");
// // // // // // //   const [duration, setDuration] = useState<number>(0);
// // // // // // //   const [micError, setMicError] = useState<string | null>(null);

// // // // // // //   // Refs
// // // // // // //   const startYRef = useRef<number>(0);
// // // // // // //   const stateRef = useRef<RecordingState>("idle");
// // // // // // //   const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
// // // // // // //   const mediaStreamRef = useRef<MediaStream | null>(null);
// // // // // // //   const mediaRecorderRef = useRef<MediaRecorder | null>(null);
// // // // // // //   const audioChunksRef = useRef<Blob[]>([]);
// // // // // // //   const recordingDurationRef = useRef<number>(0);
// // // // // // //   const sessionIdRef = useRef<number>(0);
// // // // // // //   const mimeTypeRef = useRef<string>("audio/webm");

// // // // // // //   // 同步 state 到 ref
// // // // // // //   useEffect(() => {
// // // // // // //     stateRef.current = state;
// // // // // // //   }, [state]);

// // // // // // //   // 清理资源
// // // // // // //   const cleanupResources = useCallback(() => {
// // // // // // //     if (timerRef.current) {
// // // // // // //       clearInterval(timerRef.current);
// // // // // // //       timerRef.current = null;
// // // // // // //     }

// // // // // // //     if (mediaRecorderRef.current) {
// // // // // // //       const recorder = mediaRecorderRef.current;
// // // // // // //       recorder.onstop = null;
// // // // // // //       recorder.ondataavailable = null;
// // // // // // //       recorder.onerror = null;
// // // // // // //       if (recorder.state !== "inactive") {
// // // // // // //         try {
// // // // // // //           recorder.stop();
// // // // // // //         } catch (e) {}
// // // // // // //       }
// // // // // // //       mediaRecorderRef.current = null;
// // // // // // //     }

// // // // // // //     if (mediaStreamRef.current) {
// // // // // // //       mediaStreamRef.current.getTracks().forEach((track) => track.stop());
// // // // // // //       mediaStreamRef.current = null;
// // // // // // //     }
// // // // // // //   }, []);

// // // // // // //   // 重置到初始状态
// // // // // // //   const resetToIdle = useCallback(() => {
// // // // // // //     sessionIdRef.current += 1;
// // // // // // //     cleanupResources();
// // // // // // //     audioChunksRef.current = [];
// // // // // // //     recordingDurationRef.current = 0;
// // // // // // //     setState("idle");
// // // // // // //     setDuration(0);
// // // // // // //   }, [cleanupResources]);

// // // // // // //   // 更新取消状态 - 根据 Y 坐标变化判断
// // // // // // //   const updateCancelState = useCallback((clientY: number) => {
// // // // // // //     if (stateRef.current === "idle") return;

// // // // // // //     const deltaY = startYRef.current - clientY;
// // // // // // //     const shouldCancel = deltaY > 80;
// // // // // // //     const newState: RecordingState = shouldCancel ? "cancel" : "recording";

// // // // // // //     if (stateRef.current !== newState) {
// // // // // // //       console.log(
// // // // // // //         "[updateCancelState]",
// // // // // // //         stateRef.current,
// // // // // // //         "->",
// // // // // // //         newState,
// // // // // // //         "deltaY:",
// // // // // // //         deltaY,
// // // // // // //       );
// // // // // // //       setState(newState);
// // // // // // //     }
// // // // // // //   }, []);

// // // // // // //   // 发送语音
// // // // // // //   const handleSendVoice = useCallback(
// // // // // // //     (currentSessionId: number) => {
// // // // // // //       if (sessionIdRef.current !== currentSessionId) return;

// // // // // // //       const currentDuration = recordingDurationRef.current;
// // // // // // //       const currentChunks = [...audioChunksRef.current];
// // // // // // //       const currentMimeType = mimeTypeRef.current;

// // // // // // //       if (currentDuration < 1) {
// // // // // // //         resetToIdle();
// // // // // // //         return;
// // // // // // //       }

// // // // // // //       if (
// // // // // // //         mediaRecorderRef.current &&
// // // // // // //         mediaRecorderRef.current.state !== "inactive"
// // // // // // //       ) {
// // // // // // //         const recorder = mediaRecorderRef.current;

// // // // // // //         recorder.onstop = () => {
// // // // // // //           if (sessionIdRef.current !== currentSessionId) return;

// // // // // // //           const allChunks = [...currentChunks, ...audioChunksRef.current];

// // // // // // //           if (allChunks.length > 0 && currentDuration >= 1) {
// // // // // // //             const audioBlob = new Blob(allChunks, { type: currentMimeType });
// // // // // // //             const audioUrl = URL.createObjectURL(audioBlob);
// // // // // // //             onSend?.({
// // // // // // //               blob: audioBlob,
// // // // // // //               duration: currentDuration,
// // // // // // //               url: audioUrl,
// // // // // // //             });
// // // // // // //           }
// // // // // // //           resetToIdle();
// // // // // // //         };

// // // // // // //         try {
// // // // // // //           recorder.stop();
// // // // // // //         } catch (e) {
// // // // // // //           resetToIdle();
// // // // // // //         }
// // // // // // //       } else {
// // // // // // //         if (currentChunks.length > 0 && currentDuration >= 1) {
// // // // // // //           const audioBlob = new Blob(currentChunks, { type: currentMimeType });
// // // // // // //           const audioUrl = URL.createObjectURL(audioBlob);
// // // // // // //           onSend?.({
// // // // // // //             blob: audioBlob,
// // // // // // //             duration: currentDuration,
// // // // // // //             url: audioUrl,
// // // // // // //           });
// // // // // // //         }
// // // // // // //         resetToIdle();
// // // // // // //       }
// // // // // // //     },
// // // // // // //     [resetToIdle, onSend],
// // // // // // //   );

// // // // // // //   // 取消语音
// // // // // // //   const handleCancelVoice = useCallback(() => {
// // // // // // //     resetToIdle();
// // // // // // //     onCancel?.();
// // // // // // //   }, [resetToIdle, onCancel]);

// // // // // // //   // 处理结束
// // // // // // //   const handleEnd = useCallback(() => {
// // // // // // //     const currentState = stateRef.current;
// // // // // // //     const currentSessionId = sessionIdRef.current;

// // // // // // //     console.log("[handleEnd] state:", currentState);

// // // // // // //     if (currentState === "idle") return;

// // // // // // //     if (currentState === "cancel") {
// // // // // // //       handleCancelVoice();
// // // // // // //     } else {
// // // // // // //       handleSendVoice(currentSessionId);
// // // // // // //     }
// // // // // // //   }, [handleCancelVoice, handleSendVoice]);

// // // // // // //   // 开始录音
// // // // // // //   const startRecording = useCallback(async () => {
// // // // // // //     if (stateRef.current !== "idle") return;

// // // // // // //     const currentSessionId = ++sessionIdRef.current;

// // // // // // //     setState("recording");
// // // // // // //     setMicError(null);
// // // // // // //     audioChunksRef.current = [];
// // // // // // //     recordingDurationRef.current = 0;

// // // // // // //     try {
// // // // // // //       const stream = await navigator.mediaDevices.getUserMedia({
// // // // // // //         audio: { echoCancellation: true, noiseSuppression: true },
// // // // // // //       });

// // // // // // //       if (
// // // // // // //         sessionIdRef.current !== currentSessionId ||
// // // // // // //         stateRef.current === "idle"
// // // // // // //       ) {
// // // // // // //         stream.getTracks().forEach((track) => track.stop());
// // // // // // //         return;
// // // // // // //       }

// // // // // // //       mediaStreamRef.current = stream;

// // // // // // //       const mimeType = MediaRecorder.isTypeSupported("audio/webm")
// // // // // // //         ? "audio/webm"
// // // // // // //         : MediaRecorder.isTypeSupported("audio/mp4")
// // // // // // //         ? "audio/mp4"
// // // // // // //         : "audio/ogg";

// // // // // // //       mimeTypeRef.current = mimeType;

// // // // // // //       const recorder = new MediaRecorder(stream, { mimeType });
// // // // // // //       mediaRecorderRef.current = recorder;

// // // // // // //       recorder.ondataavailable = (event: BlobEvent) => {
// // // // // // //         if (sessionIdRef.current !== currentSessionId) return;
// // // // // // //         if (event.data.size > 0) {
// // // // // // //           audioChunksRef.current.push(event.data);
// // // // // // //         }
// // // // // // //       };

// // // // // // //       recorder.start(100);

// // // // // // //       let seconds = 0;
// // // // // // //       timerRef.current = setInterval(() => {
// // // // // // //         if (sessionIdRef.current !== currentSessionId) {
// // // // // // //           if (timerRef.current) clearInterval(timerRef.current);
// // // // // // //           return;
// // // // // // //         }
// // // // // // //         seconds++;
// // // // // // //         recordingDurationRef.current = seconds;
// // // // // // //         setDuration(seconds);
// // // // // // //         if (seconds >= 60) handleEnd();
// // // // // // //       }, 1000);
// // // // // // //     } catch (error: any) {
// // // // // // //       if (sessionIdRef.current === currentSessionId) {
// // // // // // //         let errorMessage = "无法访问麦克风";
// // // // // // //         if (error.name === "NotAllowedError") {
// // // // // // //           errorMessage = "麦克风权限被拒绝";
// // // // // // //         } else if (error.name === "NotFoundError") {
// // // // // // //           errorMessage = "未检测到麦克风";
// // // // // // //         }
// // // // // // //         setMicError(errorMessage);
// // // // // // //         setTimeout(() => setMicError(null), 3000);
// // // // // // //         resetToIdle();
// // // // // // //       }
// // // // // // //     }
// // // // // // //   }, [resetToIdle, handleEnd]);

// // // // // // //   // ========== 事件处理 ==========

// // // // // // //   // 按下开始
// // // // // // //   const handleStart = useCallback(
// // // // // // //     (clientY: number) => {
// // // // // // //       if (stateRef.current !== "idle") return;
// // // // // // //       console.log("[handleStart] Y:", clientY);
// // // // // // //       startYRef.current = clientY;
// // // // // // //       startRecording();
// // // // // // //     },
// // // // // // //     [startRecording],
// // // // // // //   );

// // // // // // //   // 移动更新（用于判断是否取消）
// // // // // // //   const handleMove = useCallback(
// // // // // // //     (clientY: number) => {
// // // // // // //       updateCancelState(clientY);
// // // // // // //     },
// // // // // // //     [updateCancelState],
// // // // // // //   );

// // // // // // //   // ========== 全局事件监听 ==========
// // // // // // //   useEffect(() => {
// // // // // // //     // 鼠标移动 - Web 端关键！
// // // // // // //     const onMouseMove = (e: MouseEvent) => {
// // // // // // //       if (stateRef.current !== "idle") {
// // // // // // //         handleMove(e.clientY);
// // // // // // //       }
// // // // // // //     };

// // // // // // //     // 鼠标松开
// // // // // // //     const onMouseUp = (e: MouseEvent) => {
// // // // // // //       if (stateRef.current !== "idle") {
// // // // // // //         console.log("[global mouseup]");
// // // // // // //         e.preventDefault();
// // // // // // //         handleEnd();
// // // // // // //       }
// // // // // // //     };

// // // // // // //     // 触摸移动 - WebView/移动端
// // // // // // //     const onTouchMove = (e: TouchEvent) => {
// // // // // // //       if (stateRef.current !== "idle" && e.touches.length > 0) {
// // // // // // //         handleMove(e.touches[0].clientY);
// // // // // // //       }
// // // // // // //     };

// // // // // // //     // 触摸结束
// // // // // // //     const onTouchEnd = (e: TouchEvent) => {
// // // // // // //       if (stateRef.current !== "idle") {
// // // // // // //         console.log("[global touchend]");
// // // // // // //         e.preventDefault();
// // // // // // //         handleEnd();
// // // // // // //       }
// // // // // // //     };

// // // // // // //     // Pointer 事件（统一处理）
// // // // // // //     const onPointerMove = (e: PointerEvent) => {
// // // // // // //       if (stateRef.current !== "idle") {
// // // // // // //         handleMove(e.clientY);
// // // // // // //       }
// // // // // // //     };

// // // // // // //     const onPointerUp = (e: PointerEvent) => {
// // // // // // //       if (stateRef.current !== "idle") {
// // // // // // //         console.log("[global pointerup]");
// // // // // // //         e.preventDefault();
// // // // // // //         handleEnd();
// // // // // // //       }
// // // // // // //     };

// // // // // // //     const onPointerCancel = () => {
// // // // // // //       if (stateRef.current !== "idle") {
// // // // // // //         console.log("[global pointercancel]");
// // // // // // //         handleEnd();
// // // // // // //       }
// // // // // // //     };

// // // // // // //     // 页面可见性
// // // // // // //     const onVisibilityChange = () => {
// // // // // // //       if (document.hidden && stateRef.current !== "idle") {
// // // // // // //         handleCancelVoice();
// // // // // // //       }
// // // // // // //     };

// // // // // // //     // 窗口失焦
// // // // // // //     const onBlur = () => {
// // // // // // //       if (stateRef.current !== "idle") {
// // // // // // //         handleEnd();
// // // // // // //       }
// // // // // // //     };

// // // // // // //     // 注册事件
// // // // // // //     // 移动事件 - 不使用 capture，确保能正常触发
// // // // // // //     document.addEventListener("mousemove", onMouseMove);
// // // // // // //     document.addEventListener("touchmove", onTouchMove, { passive: true });
// // // // // // //     document.addEventListener("pointermove", onPointerMove);

// // // // // // //     // 结束事件 - 使用 capture 确保优先处理
// // // // // // //     const captureOptions = { capture: true };
// // // // // // //     document.addEventListener("mouseup", onMouseUp, captureOptions);
// // // // // // //     document.addEventListener("touchend", onTouchEnd, captureOptions);
// // // // // // //     document.addEventListener("pointerup", onPointerUp, captureOptions);
// // // // // // //     document.addEventListener("pointercancel", onPointerCancel, captureOptions);

// // // // // // //     // 其他事件
// // // // // // //     document.addEventListener("visibilitychange", onVisibilityChange);
// // // // // // //     window.addEventListener("blur", onBlur);

// // // // // // //     // 也在 window 上监听结束事件（兼容性）
// // // // // // //     window.addEventListener("mouseup", onMouseUp, captureOptions);
// // // // // // //     window.addEventListener("touchend", onTouchEnd, captureOptions);
// // // // // // //     window.addEventListener("pointerup", onPointerUp, captureOptions);

// // // // // // //     return () => {
// // // // // // //       document.removeEventListener("mousemove", onMouseMove);
// // // // // // //       document.removeEventListener("touchmove", onTouchMove);
// // // // // // //       document.removeEventListener("pointermove", onPointerMove);
// // // // // // //       document.removeEventListener("mouseup", onMouseUp, captureOptions);
// // // // // // //       document.removeEventListener("touchend", onTouchEnd, captureOptions);
// // // // // // //       document.removeEventListener("pointerup", onPointerUp, captureOptions);
// // // // // // //       document.removeEventListener(
// // // // // // //         "pointercancel",
// // // // // // //         onPointerCancel,
// // // // // // //         captureOptions,
// // // // // // //       );
// // // // // // //       document.removeEventListener("visibilitychange", onVisibilityChange);
// // // // // // //       window.removeEventListener("blur", onBlur);
// // // // // // //       window.removeEventListener("mouseup", onMouseUp, captureOptions);
// // // // // // //       window.removeEventListener("touchend", onTouchEnd, captureOptions);
// // // // // // //       window.removeEventListener("pointerup", onPointerUp, captureOptions);
// // // // // // //     };
// // // // // // //   }, [handleMove, handleEnd, handleCancelVoice]);

// // // // // // //   // ========== React 事件处理（按钮上的事件）==========
// // // // // // //   const handleTouchStart = useCallback(
// // // // // // //     (e: React.TouchEvent) => {
// // // // // // //       e.preventDefault();
// // // // // // //       e.stopPropagation();
// // // // // // //       if (e.touches.length > 0) {
// // // // // // //         handleStart(e.touches[0].clientY);
// // // // // // //       }
// // // // // // //     },
// // // // // // //     [handleStart],
// // // // // // //   );

// // // // // // //   const handleTouchMove = useCallback(
// // // // // // //     (e: React.TouchEvent) => {
// // // // // // //       e.preventDefault();
// // // // // // //       e.stopPropagation();
// // // // // // //       if (e.touches.length > 0) {
// // // // // // //         handleMove(e.touches[0].clientY);
// // // // // // //       }
// // // // // // //     },
// // // // // // //     [handleMove],
// // // // // // //   );

// // // // // // //   const handleTouchEnd = useCallback(
// // // // // // //     (e: React.TouchEvent) => {
// // // // // // //       e.preventDefault();
// // // // // // //       e.stopPropagation();
// // // // // // //       handleEnd();
// // // // // // //     },
// // // // // // //     [handleEnd],
// // // // // // //   );

// // // // // // //   const handleMouseDown = useCallback(
// // // // // // //     (e: React.MouseEvent) => {
// // // // // // //       e.preventDefault();
// // // // // // //       e.stopPropagation();
// // // // // // //       handleStart(e.clientY);
// // // // // // //     },
// // // // // // //     [handleStart],
// // // // // // //   );

// // // // // // //   // 组件卸载清理
// // // // // // //   useEffect(() => {
// // // // // // //     return () => {
// // // // // // //       sessionIdRef.current += 1;
// // // // // // //       cleanupResources();
// // // // // // //     };
// // // // // // //   }, [cleanupResources]);

// // // // // // //   // 工具函数
// // // // // // //   const formatTime = (seconds: number): string => {
// // // // // // //     const mins = Math.floor(seconds / 60);
// // // // // // //     const secs = seconds % 60;
// // // // // // //     return `${mins}:${secs.toString().padStart(2, "0")}`;
// // // // // // //   };

// // // // // // //   const getCountdown = (): number | null => {
// // // // // // //     if (duration >= 50 && duration < 60) {
// // // // // // //       return 60 - duration;
// // // // // // //     }
// // // // // // //     return null;
// // // // // // //   };

// // // // // // //   // 样式类名
// // // // // // //   const getButtonClassName = (): string => {
// // // // // // //     const classNames = [styles.voiceButton];
// // // // // // //     if (state === "idle") classNames.push(styles.idle);
// // // // // // //     else if (state === "recording") classNames.push(styles.recording);
// // // // // // //     else if (state === "cancel") classNames.push(styles.cancel);
// // // // // // //     return classNames.join(" ");
// // // // // // //   };

// // // // // // //   const getStateTooltipClassName = (): string => {
// // // // // // //     const classNames = [styles.stateTooltip];
// // // // // // //     classNames.push(state !== "idle" ? styles.visible : styles.hidden);
// // // // // // //     return classNames.join(" ");
// // // // // // //   };

// // // // // // //   const getStateContentClassName = (): string => {
// // // // // // //     const classNames = [styles.stateContent];
// // // // // // //     classNames.push(state === "cancel" ? styles.cancel : styles.recording);
// // // // // // //     return classNames.join(" ");
// // // // // // //   };

// // // // // // //   const getStateArrowClassName = (): string => {
// // // // // // //     const classNames = [styles.stateArrow];
// // // // // // //     classNames.push(state === "cancel" ? styles.cancel : styles.recording);
// // // // // // //     return classNames.join(" ");
// // // // // // //   };

// // // // // // //   const isRecordingActive = state === "recording" || state === "cancel";

// // // // // // //   return (
// // // // // // //     <div className={styles.container}>
// // // // // // //       {state}
// // // // // // //       <div className={styles.card}>
// // // // // // //         <div className={styles.buttonContainer}>
// // // // // // //           {/* 错误提示 */}
// // // // // // //           {micError && (
// // // // // // //             <div className={styles.errorTooltip}>
// // // // // // //               <div className={styles.errorContent}>
// // // // // // //                 <div className={styles.errorHeader}>
// // // // // // //                   <svg
// // // // // // //                     className={styles.errorIcon}
// // // // // // //                     fill="none"
// // // // // // //                     stroke="currentColor"
// // // // // // //                     viewBox="0 0 24 24"
// // // // // // //                   >
// // // // // // //                     <path
// // // // // // //                       strokeLinecap="round"
// // // // // // //                       strokeLinejoin="round"
// // // // // // //                       strokeWidth={2}
// // // // // // //                       d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
// // // // // // //                     />
// // // // // // //                   </svg>
// // // // // // //                   <span className={styles.errorTitle}>无法录音</span>
// // // // // // //                 </div>
// // // // // // //                 <div className={styles.errorMessage}>{micError}</div>
// // // // // // //               </div>
// // // // // // //               <div className={styles.errorArrow} />
// // // // // // //             </div>
// // // // // // //           )}

// // // // // // //           {/* 状态提示 */}
// // // // // // //           <div className={getStateTooltipClassName()}>
// // // // // // //             <div className={getStateContentClassName()}>
// // // // // // //               <div className={styles.stateText}>
// // // // // // //                 {state === "cancel" ? "松手取消" : "松手发送，上移取消"}
// // // // // // //               </div>
// // // // // // //               {state !== "idle" && (
// // // // // // //                 <div className={styles.stateDuration}>
// // // // // // //                   {formatTime(duration)}
// // // // // // //                 </div>
// // // // // // //               )}
// // // // // // //               {getCountdown() !== null && (
// // // // // // //                 <div className={styles.stateCountdown}>
// // // // // // //                   还剩 {getCountdown()} 秒
// // // // // // //                 </div>
// // // // // // //               )}
// // // // // // //             </div>
// // // // // // //             <div className={getStateArrowClassName()} />
// // // // // // //           </div>

// // // // // // //           {/* 按钮 */}
// // // // // // //           <button
// // // // // // //             className={getButtonClassName()}
// // // // // // //             onTouchStart={handleTouchStart}
// // // // // // //             onTouchMove={handleTouchMove}
// // // // // // //             onTouchEnd={handleTouchEnd}
// // // // // // //             onMouseDown={handleMouseDown}
// // // // // // //             style={{ touchAction: "none" }}
// // // // // // //           >
// // // // // // //             <div className={styles.buttonContent}>
// // // // // // //               {state === "idle" ? (
// // // // // // //                 <>
// // // // // // //                   <MicIcon className={styles.micIcon} />
// // // // // // //                   <span className={styles.buttonText}>按住说话</span>
// // // // // // //                 </>
// // // // // // //               ) : (
// // // // // // //                 <>
// // // // // // //                   <WaveAnimation isActive={isRecordingActive} />
// // // // // // //                   <span className={styles.buttonTextSmall}>
// // // // // // //                     {state === "cancel" ? "松手取消" : "录音中..."}
// // // // // // //                   </span>
// // // // // // //                 </>
// // // // // // //               )}
// // // // // // //             </div>
// // // // // // //           </button>
// // // // // // //         </div>
// // // // // // //       </div>
// // // // // // //     </div>
// // // // // // //   );
// // // // // // // };

// // // // // // // export default VoiceChatButton;

// // // // // // import React, { useState, useRef, useEffect, useCallback } from "react";
// // // // // // import styles from "./voice.module.scss";

// // // // // // // 类型定义
// // // // // // type RecordingState = "idle" | "recording" | "cancel";

// // // // // // interface MicIconProps {
// // // // // //   className?: string;
// // // // // // }

// // // // // // interface WaveAnimationProps {
// // // // // //   isActive: boolean;
// // // // // // }

// // // // // // interface CountdownOverlayProps {
// // // // // //   seconds: number;
// // // // // // }

// // // // // // // 录音结果数据
// // // // // // interface VoiceRecordingResult {
// // // // // //   blob: Blob;
// // // // // //   duration: number;
// // // // // //   url: string;
// // // // // // }

// // // // // // // 组件 Props
// // // // // // interface VoiceChatButtonProps {
// // // // // //   onSend?: (result: VoiceRecordingResult) => void;
// // // // // //   onCancel?: () => void;
// // // // // // }

// // // // // // // 麦克风图标组件
// // // // // // const MicIcon: React.FC<MicIconProps> = ({ className }) => (
// // // // // //   <svg
// // // // // //     className={className}
// // // // // //     viewBox="0 0 24 24"
// // // // // //     fill="none"
// // // // // //     stroke="currentColor"
// // // // // //     strokeWidth="2"
// // // // // //     strokeLinecap="round"
// // // // // //     strokeLinejoin="round"
// // // // // //   >
// // // // // //     <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
// // // // // //     <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
// // // // // //     <line x1="12" x2="12" y1="19" y2="22" />
// // // // // //   </svg>
// // // // // // );

// // // // // // // 模拟波形动画组件
// // // // // // const WaveAnimation: React.FC<WaveAnimationProps> = ({ isActive }) => {
// // // // // //   const [tick, setTick] = useState(0);

// // // // // //   useEffect(() => {
// // // // // //     if (!isActive) return;
// // // // // //     const interval = setInterval(() => {
// // // // // //       setTick((t) => t + 1);
// // // // // //     }, 100);
// // // // // //     return () => clearInterval(interval);
// // // // // //   }, [isActive]);

// // // // // //   return (
// // // // // //     <div className={styles.waveContainer}>
// // // // // //       {[...Array(7)].map((_, i) => {
// // // // // //         const phase = tick * 0.3 + i * 0.8;
// // // // // //         const height = 8 + Math.sin(phase) * 6 + Math.sin(phase * 1.5) * 4;
// // // // // //         return (
// // // // // //           <div
// // // // // //             key={i}
// // // // // //             className={styles.waveBar}
// // // // // //             style={{ height: `${Math.max(4, height)}px` }}
// // // // // //           />
// // // // // //         );
// // // // // //       })}
// // // // // //     </div>
// // // // // //   );
// // // // // // };

// // // // // // // 全屏居中倒计时组件
// // // // // // const CountdownOverlay: React.FC<CountdownOverlayProps> = ({ seconds }) => {
// // // // // //   // 计算进度百分比 (10秒 -> 0秒)
// // // // // //   const progress = (seconds / 10) * 100;
// // // // // //   const circumference = 2 * Math.PI * 54; // 圆的周长
// // // // // //   const strokeDashoffset = circumference * (1 - progress / 100);

// // // // // //   return (
// // // // // //     <div className={styles.countdownOverlay}>
// // // // // //       <div className={styles.countdownContent}>
// // // // // //         <div className={styles.countdownCircle}>
// // // // // //           {/* 背景圆环 */}
// // // // // //           <svg className={styles.countdownSvg} viewBox="0 0 120 120">
// // // // // //             <circle
// // // // // //               className={styles.countdownBg}
// // // // // //               cx="60"
// // // // // //               cy="60"
// // // // // //               r="54"
// // // // // //               fill="none"
// // // // // //               strokeWidth="6"
// // // // // //             />
// // // // // //             {/* 进度圆环 */}
// // // // // //             <circle
// // // // // //               className={styles.countdownProgress}
// // // // // //               cx="60"
// // // // // //               cy="60"
// // // // // //               r="54"
// // // // // //               fill="none"
// // // // // //               strokeWidth="6"
// // // // // //               strokeLinecap="round"
// // // // // //               strokeDasharray={circumference}
// // // // // //               strokeDashoffset={strokeDashoffset}
// // // // // //               transform="rotate(-90 60 60)"
// // // // // //             />
// // // // // //           </svg>
// // // // // //           {/* 倒计时数字 */}
// // // // // //           <div className={styles.countdownNumber}>
// // // // // //             <span className={styles.countdownValue}>{seconds}</span>
// // // // // //             <span className={styles.countdownUnit}>s</span>
// // // // // //           </div>
// // // // // //         </div>
// // // // // //       </div>
// // // // // //     </div>
// // // // // //   );
// // // // // // };

// // // // // // const VoiceChatButton: React.FC<VoiceChatButtonProps> = ({
// // // // // //   onSend,
// // // // // //   onCancel,
// // // // // // }) => {
// // // // // //   const [state, setState] = useState<RecordingState>("idle");
// // // // // //   const [duration, setDuration] = useState<number>(0);
// // // // // //   const [micError, setMicError] = useState<string | null>(null);

// // // // // //   // Refs
// // // // // //   const startYRef = useRef<number>(0);
// // // // // //   const stateRef = useRef<RecordingState>("idle");
// // // // // //   const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
// // // // // //   const mediaStreamRef = useRef<MediaStream | null>(null);
// // // // // //   const mediaRecorderRef = useRef<MediaRecorder | null>(null);
// // // // // //   const audioChunksRef = useRef<Blob[]>([]);
// // // // // //   const recordingDurationRef = useRef<number>(0);
// // // // // //   const sessionIdRef = useRef<number>(0);
// // // // // //   const mimeTypeRef = useRef<string>("audio/webm");

// // // // // //   // 计算倒计时（最后10秒显示）
// // // // // //   const countdown = duration >= 50 && duration < 60 ? 60 - duration : null;

// // // // // //   // 同步 state 到 ref
// // // // // //   useEffect(() => {
// // // // // //     stateRef.current = state;
// // // // // //   }, [state]);

// // // // // //   // 清理资源
// // // // // //   const cleanupResources = useCallback(() => {
// // // // // //     if (timerRef.current) {
// // // // // //       clearInterval(timerRef.current);
// // // // // //       timerRef.current = null;
// // // // // //     }

// // // // // //     if (mediaRecorderRef.current) {
// // // // // //       const recorder = mediaRecorderRef.current;
// // // // // //       recorder.onstop = null;
// // // // // //       recorder.ondataavailable = null;
// // // // // //       recorder.onerror = null;
// // // // // //       if (recorder.state !== "inactive") {
// // // // // //         try {
// // // // // //           recorder.stop();
// // // // // //         } catch (e) {}
// // // // // //       }
// // // // // //       mediaRecorderRef.current = null;
// // // // // //     }

// // // // // //     if (mediaStreamRef.current) {
// // // // // //       mediaStreamRef.current.getTracks().forEach((track) => track.stop());
// // // // // //       mediaStreamRef.current = null;
// // // // // //     }
// // // // // //   }, []);

// // // // // //   // 重置到初始状态
// // // // // //   const resetToIdle = useCallback(() => {
// // // // // //     sessionIdRef.current += 1;
// // // // // //     cleanupResources();
// // // // // //     audioChunksRef.current = [];
// // // // // //     recordingDurationRef.current = 0;
// // // // // //     setState("idle");
// // // // // //     setDuration(0);
// // // // // //   }, [cleanupResources]);

// // // // // //   // 更新取消状态
// // // // // //   const updateCancelState = useCallback((clientY: number) => {
// // // // // //     if (stateRef.current === "idle") return;

// // // // // //     const deltaY = startYRef.current - clientY;
// // // // // //     const shouldCancel = deltaY > 80;
// // // // // //     const newState: RecordingState = shouldCancel ? "cancel" : "recording";

// // // // // //     if (stateRef.current !== newState) {
// // // // // //       setState(newState);
// // // // // //     }
// // // // // //   }, []);

// // // // // //   // 发送语音
// // // // // //   const handleSendVoice = useCallback(
// // // // // //     (currentSessionId: number) => {
// // // // // //       if (sessionIdRef.current !== currentSessionId) return;

// // // // // //       const currentDuration = recordingDurationRef.current;
// // // // // //       const currentChunks = [...audioChunksRef.current];
// // // // // //       const currentMimeType = mimeTypeRef.current;

// // // // // //       if (currentDuration < 1) {
// // // // // //         resetToIdle();
// // // // // //         return;
// // // // // //       }

// // // // // //       if (
// // // // // //         mediaRecorderRef.current &&
// // // // // //         mediaRecorderRef.current.state !== "inactive"
// // // // // //       ) {
// // // // // //         const recorder = mediaRecorderRef.current;

// // // // // //         recorder.onstop = () => {
// // // // // //           if (sessionIdRef.current !== currentSessionId) return;

// // // // // //           const allChunks = [...currentChunks, ...audioChunksRef.current];

// // // // // //           if (allChunks.length > 0 && currentDuration >= 1) {
// // // // // //             const audioBlob = new Blob(allChunks, { type: currentMimeType });
// // // // // //             const audioUrl = URL.createObjectURL(audioBlob);
// // // // // //             onSend?.({
// // // // // //               blob: audioBlob,
// // // // // //               duration: currentDuration,
// // // // // //               url: audioUrl,
// // // // // //             });
// // // // // //           }
// // // // // //           resetToIdle();
// // // // // //         };

// // // // // //         try {
// // // // // //           recorder.stop();
// // // // // //         } catch (e) {
// // // // // //           resetToIdle();
// // // // // //         }
// // // // // //       } else {
// // // // // //         if (currentChunks.length > 0 && currentDuration >= 1) {
// // // // // //           const audioBlob = new Blob(currentChunks, { type: currentMimeType });
// // // // // //           const audioUrl = URL.createObjectURL(audioBlob);
// // // // // //           onSend?.({
// // // // // //             blob: audioBlob,
// // // // // //             duration: currentDuration,
// // // // // //             url: audioUrl,
// // // // // //           });
// // // // // //         }
// // // // // //         resetToIdle();
// // // // // //       }
// // // // // //     },
// // // // // //     [resetToIdle, onSend],
// // // // // //   );

// // // // // //   // 取消语音
// // // // // //   const handleCancelVoice = useCallback(() => {
// // // // // //     resetToIdle();
// // // // // //     onCancel?.();
// // // // // //   }, [resetToIdle, onCancel]);

// // // // // //   // 处理结束
// // // // // //   const handleEnd = useCallback(() => {
// // // // // //     const currentState = stateRef.current;
// // // // // //     const currentSessionId = sessionIdRef.current;

// // // // // //     if (currentState === "idle") return;

// // // // // //     if (currentState === "cancel") {
// // // // // //       handleCancelVoice();
// // // // // //     } else {
// // // // // //       handleSendVoice(currentSessionId);
// // // // // //     }
// // // // // //   }, [handleCancelVoice, handleSendVoice]);

// // // // // //   // 开始录音
// // // // // //   const startRecording = useCallback(async () => {
// // // // // //     if (stateRef.current !== "idle") return;

// // // // // //     const currentSessionId = ++sessionIdRef.current;

// // // // // //     setState("recording");
// // // // // //     setMicError(null);
// // // // // //     audioChunksRef.current = [];
// // // // // //     recordingDurationRef.current = 0;

// // // // // //     try {
// // // // // //       const stream = await navigator.mediaDevices.getUserMedia({
// // // // // //         audio: { echoCancellation: true, noiseSuppression: true },
// // // // // //       });

// // // // // //       if (
// // // // // //         sessionIdRef.current !== currentSessionId ||
// // // // // //         stateRef.current === "idle"
// // // // // //       ) {
// // // // // //         stream.getTracks().forEach((track) => track.stop());
// // // // // //         return;
// // // // // //       }

// // // // // //       mediaStreamRef.current = stream;

// // // // // //       const mimeType = MediaRecorder.isTypeSupported("audio/webm")
// // // // // //         ? "audio/webm"
// // // // // //         : MediaRecorder.isTypeSupported("audio/mp4")
// // // // // //         ? "audio/mp4"
// // // // // //         : "audio/ogg";

// // // // // //       mimeTypeRef.current = mimeType;

// // // // // //       const recorder = new MediaRecorder(stream, { mimeType });
// // // // // //       mediaRecorderRef.current = recorder;

// // // // // //       recorder.ondataavailable = (event: BlobEvent) => {
// // // // // //         if (sessionIdRef.current !== currentSessionId) return;
// // // // // //         if (event.data.size > 0) {
// // // // // //           audioChunksRef.current.push(event.data);
// // // // // //         }
// // // // // //       };

// // // // // //       recorder.start(100);

// // // // // //       let seconds = 0;
// // // // // //       timerRef.current = setInterval(() => {
// // // // // //         if (sessionIdRef.current !== currentSessionId) {
// // // // // //           if (timerRef.current) clearInterval(timerRef.current);
// // // // // //           return;
// // // // // //         }
// // // // // //         seconds++;
// // // // // //         recordingDurationRef.current = seconds;
// // // // // //         setDuration(seconds);
// // // // // //         if (seconds >= 60) handleEnd();
// // // // // //       }, 1000);
// // // // // //     } catch (error: any) {
// // // // // //       if (sessionIdRef.current === currentSessionId) {
// // // // // //         let errorMessage = "无法访问麦克风";
// // // // // //         if (error.name === "NotAllowedError") {
// // // // // //           errorMessage = "麦克风权限被拒绝";
// // // // // //         } else if (error.name === "NotFoundError") {
// // // // // //           errorMessage = "未检测到麦克风";
// // // // // //         }
// // // // // //         setMicError(errorMessage);
// // // // // //         setTimeout(() => setMicError(null), 3000);
// // // // // //         resetToIdle();
// // // // // //       }
// // // // // //     }
// // // // // //   }, [resetToIdle, handleEnd]);

// // // // // //   // 事件处理
// // // // // //   const handleStart = useCallback(
// // // // // //     (clientY: number) => {
// // // // // //       if (stateRef.current !== "idle") return;
// // // // // //       startYRef.current = clientY;
// // // // // //       startRecording();
// // // // // //     },
// // // // // //     [startRecording],
// // // // // //   );

// // // // // //   const handleMove = useCallback(
// // // // // //     (clientY: number) => {
// // // // // //       updateCancelState(clientY);
// // // // // //     },
// // // // // //     [updateCancelState],
// // // // // //   );

// // // // // //   // 全局事件监听
// // // // // //   useEffect(() => {
// // // // // //     const onMouseMove = (e: MouseEvent) => {
// // // // // //       if (stateRef.current !== "idle") {
// // // // // //         handleMove(e.clientY);
// // // // // //       }
// // // // // //     };

// // // // // //     const onMouseUp = (e: MouseEvent) => {
// // // // // //       if (stateRef.current !== "idle") {
// // // // // //         e.preventDefault();
// // // // // //         handleEnd();
// // // // // //       }
// // // // // //     };

// // // // // //     const onTouchMove = (e: TouchEvent) => {
// // // // // //       if (stateRef.current !== "idle" && e.touches.length > 0) {
// // // // // //         handleMove(e.touches[0].clientY);
// // // // // //       }
// // // // // //     };

// // // // // //     const onTouchEnd = (e: TouchEvent) => {
// // // // // //       if (stateRef.current !== "idle") {
// // // // // //         e.preventDefault();
// // // // // //         handleEnd();
// // // // // //       }
// // // // // //     };

// // // // // //     const onPointerMove = (e: PointerEvent) => {
// // // // // //       if (stateRef.current !== "idle") {
// // // // // //         handleMove(e.clientY);
// // // // // //       }
// // // // // //     };

// // // // // //     const onPointerUp = (e: PointerEvent) => {
// // // // // //       if (stateRef.current !== "idle") {
// // // // // //         e.preventDefault();
// // // // // //         handleEnd();
// // // // // //       }
// // // // // //     };

// // // // // //     const onVisibilityChange = () => {
// // // // // //       if (document.hidden && stateRef.current !== "idle") {
// // // // // //         handleCancelVoice();
// // // // // //       }
// // // // // //     };

// // // // // //     const onBlur = () => {
// // // // // //       if (stateRef.current !== "idle") {
// // // // // //         handleEnd();
// // // // // //       }
// // // // // //     };

// // // // // //     document.addEventListener("mousemove", onMouseMove);
// // // // // //     document.addEventListener("touchmove", onTouchMove, { passive: true });
// // // // // //     document.addEventListener("pointermove", onPointerMove);

// // // // // //     const captureOptions = { capture: true };
// // // // // //     document.addEventListener("mouseup", onMouseUp, captureOptions);
// // // // // //     document.addEventListener("touchend", onTouchEnd, captureOptions);
// // // // // //     document.addEventListener("pointerup", onPointerUp, captureOptions);
// // // // // //     document.addEventListener("pointercancel", onPointerUp, captureOptions);
// // // // // //     document.addEventListener("visibilitychange", onVisibilityChange);
// // // // // //     window.addEventListener("blur", onBlur);
// // // // // //     window.addEventListener("mouseup", onMouseUp, captureOptions);
// // // // // //     window.addEventListener("touchend", onTouchEnd, captureOptions);
// // // // // //     window.addEventListener("pointerup", onPointerUp, captureOptions);

// // // // // //     return () => {
// // // // // //       document.removeEventListener("mousemove", onMouseMove);
// // // // // //       document.removeEventListener("touchmove", onTouchMove);
// // // // // //       document.removeEventListener("pointermove", onPointerMove);
// // // // // //       document.removeEventListener("mouseup", onMouseUp, captureOptions);
// // // // // //       document.removeEventListener("touchend", onTouchEnd, captureOptions);
// // // // // //       document.removeEventListener("pointerup", onPointerUp, captureOptions);
// // // // // //       document.removeEventListener(
// // // // // //         "pointercancel",
// // // // // //         onPointerUp,
// // // // // //         captureOptions,
// // // // // //       );
// // // // // //       document.removeEventListener("visibilitychange", onVisibilityChange);
// // // // // //       window.removeEventListener("blur", onBlur);
// // // // // //       window.removeEventListener("mouseup", onMouseUp, captureOptions);
// // // // // //       window.removeEventListener("touchend", onTouchEnd, captureOptions);
// // // // // //       window.removeEventListener("pointerup", onPointerUp, captureOptions);
// // // // // //     };
// // // // // //   }, [handleMove, handleEnd, handleCancelVoice]);

// // // // // //   // React 事件
// // // // // //   const handleTouchStart = useCallback(
// // // // // //     (e: React.TouchEvent) => {
// // // // // //       e.preventDefault();
// // // // // //       e.stopPropagation();
// // // // // //       if (e.touches.length > 0) {
// // // // // //         handleStart(e.touches[0].clientY);
// // // // // //       }
// // // // // //     },
// // // // // //     [handleStart],
// // // // // //   );

// // // // // //   const handleTouchMove = useCallback(
// // // // // //     (e: React.TouchEvent) => {
// // // // // //       e.preventDefault();
// // // // // //       e.stopPropagation();
// // // // // //       if (e.touches.length > 0) {
// // // // // //         handleMove(e.touches[0].clientY);
// // // // // //       }
// // // // // //     },
// // // // // //     [handleMove],
// // // // // //   );

// // // // // //   const handleTouchEnd = useCallback(
// // // // // //     (e: React.TouchEvent) => {
// // // // // //       e.preventDefault();
// // // // // //       e.stopPropagation();
// // // // // //       handleEnd();
// // // // // //     },
// // // // // //     [handleEnd],
// // // // // //   );

// // // // // //   const handleMouseDown = useCallback(
// // // // // //     (e: React.MouseEvent) => {
// // // // // //       e.preventDefault();
// // // // // //       e.stopPropagation();
// // // // // //       handleStart(e.clientY);
// // // // // //     },
// // // // // //     [handleStart],
// // // // // //   );

// // // // // //   // 组件卸载清理
// // // // // //   useEffect(() => {
// // // // // //     return () => {
// // // // // //       sessionIdRef.current += 1;
// // // // // //       cleanupResources();
// // // // // //     };
// // // // // //   }, [cleanupResources]);

// // // // // //   // 工具函数
// // // // // //   const formatTime = (seconds: number): string => {
// // // // // //     const mins = Math.floor(seconds / 60);
// // // // // //     const secs = seconds % 60;
// // // // // //     return `${mins}:${secs.toString().padStart(2, "0")}`;
// // // // // //   };

// // // // // //   // 样式类名
// // // // // //   const getButtonClassName = (): string => {
// // // // // //     const classNames = [styles.voiceButton];
// // // // // //     if (state === "idle") classNames.push(styles.idle);
// // // // // //     else if (state === "recording") classNames.push(styles.recording);
// // // // // //     else if (state === "cancel") classNames.push(styles.cancel);
// // // // // //     return classNames.join(" ");
// // // // // //   };

// // // // // //   const getStateTooltipClassName = (): string => {
// // // // // //     const classNames = [styles.stateTooltip];
// // // // // //     classNames.push(state !== "idle" ? styles.visible : styles.hidden);
// // // // // //     return classNames.join(" ");
// // // // // //   };

// // // // // //   const getStateContentClassName = (): string => {
// // // // // //     const classNames = [styles.stateContent];
// // // // // //     classNames.push(state === "cancel" ? styles.cancel : styles.recording);
// // // // // //     return classNames.join(" ");
// // // // // //   };

// // // // // //   const getStateArrowClassName = (): string => {
// // // // // //     const classNames = [styles.stateArrow];
// // // // // //     classNames.push(state === "cancel" ? styles.cancel : styles.recording);
// // // // // //     return classNames.join(" ");
// // // // // //   };

// // // // // //   const isRecordingActive = state === "recording" || state === "cancel";

// // // // // //   return (
// // // // // //     <div className={styles.container}>
// // // // // //       {/* 全屏倒计时遮罩 - 最后10秒显示 */}
// // // // // //       {countdown !== null && state !== "idle" && (
// // // // // //         <CountdownOverlay seconds={countdown} />
// // // // // //       )}

// // // // // //       {state}
// // // // // //       <div className={styles.card}>
// // // // // //         <div className={styles.buttonContainer}>
// // // // // //           {/* 错误提示 */}
// // // // // //           {micError && (
// // // // // //             <div className={styles.errorTooltip}>
// // // // // //               <div className={styles.errorContent}>
// // // // // //                 <div className={styles.errorHeader}>
// // // // // //                   <svg
// // // // // //                     className={styles.errorIcon}
// // // // // //                     fill="none"
// // // // // //                     stroke="currentColor"
// // // // // //                     viewBox="0 0 24 24"
// // // // // //                   >
// // // // // //                     <path
// // // // // //                       strokeLinecap="round"
// // // // // //                       strokeLinejoin="round"
// // // // // //                       strokeWidth={2}
// // // // // //                       d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
// // // // // //                     />
// // // // // //                   </svg>
// // // // // //                   <span className={styles.errorTitle}>无法录音</span>
// // // // // //                 </div>
// // // // // //                 <div className={styles.errorMessage}>{micError}</div>
// // // // // //               </div>
// // // // // //               <div className={styles.errorArrow} />
// // // // // //             </div>
// // // // // //           )}

// // // // // //           {/* 状态提示 */}
// // // // // //           <div className={getStateTooltipClassName()}>
// // // // // //             <div className={getStateContentClassName()}>
// // // // // //               <div className={styles.stateText}>
// // // // // //                 {state === "cancel" ? "松手取消" : "松手发送，上移取消"}
// // // // // //               </div>
// // // // // //               {state !== "idle" && (
// // // // // //                 <div className={styles.stateDuration}>
// // // // // //                   {formatTime(duration)}
// // // // // //                 </div>
// // // // // //               )}
// // // // // //             </div>
// // // // // //             <div className={getStateArrowClassName()} />
// // // // // //           </div>

// // // // // //           {/* 按钮 */}
// // // // // //           <button
// // // // // //             className={getButtonClassName()}
// // // // // //             onTouchStart={handleTouchStart}
// // // // // //             onTouchMove={handleTouchMove}
// // // // // //             onTouchEnd={handleTouchEnd}
// // // // // //             onMouseDown={handleMouseDown}
// // // // // //             style={{ touchAction: "none" }}
// // // // // //           >
// // // // // //             <div className={styles.buttonContent}>
// // // // // //               {state === "idle" ? (
// // // // // //                 <>
// // // // // //                   <MicIcon className={styles.micIcon} />
// // // // // //                   <span className={styles.buttonText}>按住说话</span>
// // // // // //                 </>
// // // // // //               ) : (
// // // // // //                 <>
// // // // // //                   <WaveAnimation isActive={isRecordingActive} />
// // // // // //                   <span className={styles.buttonTextSmall}>
// // // // // //                     {state === "cancel" ? "松手取消" : "录音中..."}
// // // // // //                   </span>
// // // // // //                 </>
// // // // // //               )}
// // // // // //             </div>
// // // // // //           </button>
// // // // // //         </div>
// // // // // //       </div>
// // // // // //     </div>
// // // // // //   );
// // // // // // };

// // // // // // export default VoiceChatButton;

// // // // // import React, { useState, useRef, useEffect, useCallback } from "react";
// // // // // import styles from "./voice.module.scss";

// // // // // // 类型定义
// // // // // type RecordingState = "idle" | "recording" | "cancel";

// // // // // interface MicIconProps {
// // // // //   className?: string;
// // // // // }

// // // // // interface WaveAnimationProps {
// // // // //   isActive: boolean;
// // // // // }

// // // // // interface CountdownOverlayProps {
// // // // //   seconds: number;
// // // // // }

// // // // // // 录音结果数据
// // // // // interface VoiceRecordingResult {
// // // // //   blob: Blob;
// // // // //   duration: number;
// // // // //   url: string;
// // // // // }

// // // // // // 组件 Props
// // // // // interface VoiceChatButtonProps {
// // // // //   onSend?: (result: VoiceRecordingResult) => void;
// // // // //   onCancel?: () => void;
// // // // // }

// // // // // // 麦克风图标组件
// // // // // const MicIcon: React.FC<MicIconProps> = ({ className }) => (
// // // // //   <svg
// // // // //     className={className}
// // // // //     viewBox="0 0 24 24"
// // // // //     fill="none"
// // // // //     stroke="currentColor"
// // // // //     strokeWidth="2"
// // // // //     strokeLinecap="round"
// // // // //     strokeLinejoin="round"
// // // // //   >
// // // // //     <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
// // // // //     <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
// // // // //     <line x1="12" x2="12" y1="19" y2="22" />
// // // // //   </svg>
// // // // // );

// // // // // // 模拟波形动画组件
// // // // // const WaveAnimation: React.FC<WaveAnimationProps> = ({ isActive }) => {
// // // // //   const [tick, setTick] = useState(0);

// // // // //   useEffect(() => {
// // // // //     if (!isActive) return;
// // // // //     const interval = setInterval(() => {
// // // // //       setTick((t) => t + 1);
// // // // //     }, 100);
// // // // //     return () => clearInterval(interval);
// // // // //   }, [isActive]);

// // // // //   return (
// // // // //     <div className={styles.waveContainer}>
// // // // //       {[...Array(7)].map((_, i) => {
// // // // //         const phase = tick * 0.3 + i * 0.8;
// // // // //         const height = 8 + Math.sin(phase) * 6 + Math.sin(phase * 1.5) * 4;
// // // // //         return (
// // // // //           <div
// // // // //             key={i}
// // // // //             className={styles.waveBar}
// // // // //             style={{ height: `${Math.max(4, height)}px` }}
// // // // //           />
// // // // //         );
// // // // //       })}
// // // // //     </div>
// // // // //   );
// // // // // };

// // // // // // 全屏居中倒计时组件
// // // // // const CountdownOverlay: React.FC<CountdownOverlayProps> = ({ seconds }) => {
// // // // //   // 计算进度百分比 (10秒 -> 0秒)
// // // // //   // 圆形 64px，边框 6px，所以半径 = (64 - 6) / 2 = 29
// // // // //   const radius = 29;
// // // // //   const progress = (seconds / 10) * 100;
// // // // //   const circumference = 2 * Math.PI * radius;
// // // // //   const strokeDashoffset = circumference * (1 - progress / 100);

// // // // //   return (
// // // // //     <div className={styles.countdownOverlay}>
// // // // //       <div className={styles.countdownContent}>
// // // // //         <div className={styles.countdownCircle}>
// // // // //           {/* 背景圆环 */}
// // // // //           <svg className={styles.countdownSvg} viewBox="0 0 64 64">
// // // // //             <circle
// // // // //               className={styles.countdownBg}
// // // // //               cx="32"
// // // // //               cy="32"
// // // // //               r={radius}
// // // // //               fill="none"
// // // // //               strokeWidth="6"
// // // // //             />
// // // // //             {/* 进度圆环 */}
// // // // //             <circle
// // // // //               className={styles.countdownProgress}
// // // // //               cx="32"
// // // // //               cy="32"
// // // // //               r={radius}
// // // // //               fill="none"
// // // // //               strokeWidth="6"
// // // // //               strokeLinecap="round"
// // // // //               strokeDasharray={circumference}
// // // // //               strokeDashoffset={strokeDashoffset}
// // // // //               transform="rotate(-90 32 32)"
// // // // //             />
// // // // //           </svg>
// // // // //           {/* 倒计时数字 */}
// // // // //           <div className={styles.countdownNumber}>
// // // // //             <span className={styles.countdownValue}>{seconds}</span>
// // // // //             <span className={styles.countdownUnit}>s</span>
// // // // //           </div>
// // // // //         </div>
// // // // //       </div>
// // // // //     </div>
// // // // //   );
// // // // // };

// // // // // const VoiceChatButton: React.FC<VoiceChatButtonProps> = ({
// // // // //   onSend,
// // // // //   onCancel,
// // // // // }) => {
// // // // //   const [state, setState] = useState<RecordingState>("idle");
// // // // //   const [duration, setDuration] = useState<number>(0);
// // // // //   const [micError, setMicError] = useState<string | null>(null);

// // // // //   // Refs
// // // // //   const startYRef = useRef<number>(0);
// // // // //   const stateRef = useRef<RecordingState>("idle");
// // // // //   const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
// // // // //   const mediaStreamRef = useRef<MediaStream | null>(null);
// // // // //   const mediaRecorderRef = useRef<MediaRecorder | null>(null);
// // // // //   const audioChunksRef = useRef<Blob[]>([]);
// // // // //   const recordingDurationRef = useRef<number>(0);
// // // // //   const sessionIdRef = useRef<number>(0);
// // // // //   const mimeTypeRef = useRef<string>("audio/webm");

// // // // //   // 计算倒计时（最后10秒显示）
// // // // //   const countdown = duration >= 50 && duration < 60 ? 60 - duration : null;

// // // // //   // 同步 state 到 ref
// // // // //   useEffect(() => {
// // // // //     stateRef.current = state;
// // // // //   }, [state]);

// // // // //   // 清理资源
// // // // //   const cleanupResources = useCallback(() => {
// // // // //     if (timerRef.current) {
// // // // //       clearInterval(timerRef.current);
// // // // //       timerRef.current = null;
// // // // //     }

// // // // //     if (mediaRecorderRef.current) {
// // // // //       const recorder = mediaRecorderRef.current;
// // // // //       recorder.onstop = null;
// // // // //       recorder.ondataavailable = null;
// // // // //       recorder.onerror = null;
// // // // //       if (recorder.state !== "inactive") {
// // // // //         try {
// // // // //           recorder.stop();
// // // // //         } catch (e) {}
// // // // //       }
// // // // //       mediaRecorderRef.current = null;
// // // // //     }

// // // // //     if (mediaStreamRef.current) {
// // // // //       mediaStreamRef.current.getTracks().forEach((track) => track.stop());
// // // // //       mediaStreamRef.current = null;
// // // // //     }
// // // // //   }, []);

// // // // //   // 重置到初始状态
// // // // //   const resetToIdle = useCallback(() => {
// // // // //     sessionIdRef.current += 1;
// // // // //     cleanupResources();
// // // // //     audioChunksRef.current = [];
// // // // //     recordingDurationRef.current = 0;
// // // // //     setState("idle");
// // // // //     setDuration(0);
// // // // //   }, [cleanupResources]);

// // // // //   // 更新取消状态
// // // // //   const updateCancelState = useCallback((clientY: number) => {
// // // // //     if (stateRef.current === "idle") return;

// // // // //     const deltaY = startYRef.current - clientY;
// // // // //     const shouldCancel = deltaY > 80;
// // // // //     const newState: RecordingState = shouldCancel ? "cancel" : "recording";

// // // // //     if (stateRef.current !== newState) {
// // // // //       setState(newState);
// // // // //     }
// // // // //   }, []);

// // // // //   // 发送语音
// // // // //   const handleSendVoice = useCallback(
// // // // //     (currentSessionId: number) => {
// // // // //       if (sessionIdRef.current !== currentSessionId) return;

// // // // //       const currentDuration = recordingDurationRef.current;
// // // // //       const currentChunks = [...audioChunksRef.current];
// // // // //       const currentMimeType = mimeTypeRef.current;

// // // // //       if (currentDuration < 1) {
// // // // //         resetToIdle();
// // // // //         return;
// // // // //       }

// // // // //       if (
// // // // //         mediaRecorderRef.current &&
// // // // //         mediaRecorderRef.current.state !== "inactive"
// // // // //       ) {
// // // // //         const recorder = mediaRecorderRef.current;

// // // // //         recorder.onstop = () => {
// // // // //           if (sessionIdRef.current !== currentSessionId) return;

// // // // //           const allChunks = [...currentChunks, ...audioChunksRef.current];

// // // // //           if (allChunks.length > 0 && currentDuration >= 1) {
// // // // //             const audioBlob = new Blob(allChunks, { type: currentMimeType });
// // // // //             const audioUrl = URL.createObjectURL(audioBlob);
// // // // //             onSend?.({
// // // // //               blob: audioBlob,
// // // // //               duration: currentDuration,
// // // // //               url: audioUrl,
// // // // //             });
// // // // //           }
// // // // //           resetToIdle();
// // // // //         };

// // // // //         try {
// // // // //           recorder.stop();
// // // // //         } catch (e) {
// // // // //           resetToIdle();
// // // // //         }
// // // // //       } else {
// // // // //         if (currentChunks.length > 0 && currentDuration >= 1) {
// // // // //           const audioBlob = new Blob(currentChunks, { type: currentMimeType });
// // // // //           const audioUrl = URL.createObjectURL(audioBlob);
// // // // //           onSend?.({
// // // // //             blob: audioBlob,
// // // // //             duration: currentDuration,
// // // // //             url: audioUrl,
// // // // //           });
// // // // //         }
// // // // //         resetToIdle();
// // // // //       }
// // // // //     },
// // // // //     [resetToIdle, onSend],
// // // // //   );

// // // // //   // 取消语音
// // // // //   const handleCancelVoice = useCallback(() => {
// // // // //     resetToIdle();
// // // // //     onCancel?.();
// // // // //   }, [resetToIdle, onCancel]);

// // // // //   // 处理结束
// // // // //   const handleEnd = useCallback(() => {
// // // // //     const currentState = stateRef.current;
// // // // //     const currentSessionId = sessionIdRef.current;

// // // // //     if (currentState === "idle") return;

// // // // //     if (currentState === "cancel") {
// // // // //       handleCancelVoice();
// // // // //     } else {
// // // // //       handleSendVoice(currentSessionId);
// // // // //     }
// // // // //   }, [handleCancelVoice, handleSendVoice]);

// // // // //   // 开始录音
// // // // //   const startRecording = useCallback(async () => {
// // // // //     if (stateRef.current !== "idle") return;

// // // // //     const currentSessionId = ++sessionIdRef.current;

// // // // //     setState("recording");
// // // // //     setMicError(null);
// // // // //     audioChunksRef.current = [];
// // // // //     recordingDurationRef.current = 0;

// // // // //     try {
// // // // //       const stream = await navigator.mediaDevices.getUserMedia({
// // // // //         audio: { echoCancellation: true, noiseSuppression: true },
// // // // //       });

// // // // //       if (
// // // // //         sessionIdRef.current !== currentSessionId ||
// // // // //         stateRef.current === "idle"
// // // // //       ) {
// // // // //         stream.getTracks().forEach((track) => track.stop());
// // // // //         return;
// // // // //       }

// // // // //       mediaStreamRef.current = stream;

// // // // //       const mimeType = MediaRecorder.isTypeSupported("audio/webm")
// // // // //         ? "audio/webm"
// // // // //         : MediaRecorder.isTypeSupported("audio/mp4")
// // // // //         ? "audio/mp4"
// // // // //         : "audio/ogg";

// // // // //       mimeTypeRef.current = mimeType;

// // // // //       const recorder = new MediaRecorder(stream, { mimeType });
// // // // //       mediaRecorderRef.current = recorder;

// // // // //       recorder.ondataavailable = (event: BlobEvent) => {
// // // // //         if (sessionIdRef.current !== currentSessionId) return;
// // // // //         if (event.data.size > 0) {
// // // // //           audioChunksRef.current.push(event.data);
// // // // //         }
// // // // //       };

// // // // //       recorder.start(100);

// // // // //       let seconds = 0;
// // // // //       timerRef.current = setInterval(() => {
// // // // //         if (sessionIdRef.current !== currentSessionId) {
// // // // //           if (timerRef.current) clearInterval(timerRef.current);
// // // // //           return;
// // // // //         }
// // // // //         seconds++;
// // // // //         recordingDurationRef.current = seconds;
// // // // //         setDuration(seconds);
// // // // //         if (seconds >= 60) handleEnd();
// // // // //       }, 1000);
// // // // //     } catch (error: any) {
// // // // //       if (sessionIdRef.current === currentSessionId) {
// // // // //         let errorMessage = "无法访问麦克风";
// // // // //         if (error.name === "NotAllowedError") {
// // // // //           errorMessage = "麦克风权限被拒绝";
// // // // //         } else if (error.name === "NotFoundError") {
// // // // //           errorMessage = "未检测到麦克风";
// // // // //         }
// // // // //         setMicError(errorMessage);
// // // // //         setTimeout(() => setMicError(null), 3000);
// // // // //         resetToIdle();
// // // // //       }
// // // // //     }
// // // // //   }, [resetToIdle, handleEnd]);

// // // // //   // 事件处理
// // // // //   const handleStart = useCallback(
// // // // //     (clientY: number) => {
// // // // //       if (stateRef.current !== "idle") return;
// // // // //       startYRef.current = clientY;
// // // // //       startRecording();
// // // // //     },
// // // // //     [startRecording],
// // // // //   );

// // // // //   const handleMove = useCallback(
// // // // //     (clientY: number) => {
// // // // //       updateCancelState(clientY);
// // // // //     },
// // // // //     [updateCancelState],
// // // // //   );

// // // // //   // 全局事件监听
// // // // //   useEffect(() => {
// // // // //     const onMouseMove = (e: MouseEvent) => {
// // // // //       if (stateRef.current !== "idle") {
// // // // //         handleMove(e.clientY);
// // // // //       }
// // // // //     };

// // // // //     const onMouseUp = (e: MouseEvent) => {
// // // // //       if (stateRef.current !== "idle") {
// // // // //         e.preventDefault();
// // // // //         handleEnd();
// // // // //       }
// // // // //     };

// // // // //     const onTouchMove = (e: TouchEvent) => {
// // // // //       if (stateRef.current !== "idle" && e.touches.length > 0) {
// // // // //         handleMove(e.touches[0].clientY);
// // // // //       }
// // // // //     };

// // // // //     const onTouchEnd = (e: TouchEvent) => {
// // // // //       if (stateRef.current !== "idle") {
// // // // //         e.preventDefault();
// // // // //         handleEnd();
// // // // //       }
// // // // //     };

// // // // //     const onPointerMove = (e: PointerEvent) => {
// // // // //       if (stateRef.current !== "idle") {
// // // // //         handleMove(e.clientY);
// // // // //       }
// // // // //     };

// // // // //     const onPointerUp = (e: PointerEvent) => {
// // // // //       if (stateRef.current !== "idle") {
// // // // //         e.preventDefault();
// // // // //         handleEnd();
// // // // //       }
// // // // //     };

// // // // //     const onVisibilityChange = () => {
// // // // //       if (document.hidden && stateRef.current !== "idle") {
// // // // //         handleCancelVoice();
// // // // //       }
// // // // //     };

// // // // //     const onBlur = () => {
// // // // //       if (stateRef.current !== "idle") {
// // // // //         handleEnd();
// // // // //       }
// // // // //     };

// // // // //     document.addEventListener("mousemove", onMouseMove);
// // // // //     document.addEventListener("touchmove", onTouchMove, { passive: true });
// // // // //     document.addEventListener("pointermove", onPointerMove);

// // // // //     const captureOptions = { capture: true };
// // // // //     document.addEventListener("mouseup", onMouseUp, captureOptions);
// // // // //     document.addEventListener("touchend", onTouchEnd, captureOptions);
// // // // //     document.addEventListener("pointerup", onPointerUp, captureOptions);
// // // // //     document.addEventListener("pointercancel", onPointerUp, captureOptions);
// // // // //     document.addEventListener("visibilitychange", onVisibilityChange);
// // // // //     window.addEventListener("blur", onBlur);
// // // // //     window.addEventListener("mouseup", onMouseUp, captureOptions);
// // // // //     window.addEventListener("touchend", onTouchEnd, captureOptions);
// // // // //     window.addEventListener("pointerup", onPointerUp, captureOptions);

// // // // //     return () => {
// // // // //       document.removeEventListener("mousemove", onMouseMove);
// // // // //       document.removeEventListener("touchmove", onTouchMove);
// // // // //       document.removeEventListener("pointermove", onPointerMove);
// // // // //       document.removeEventListener("mouseup", onMouseUp, captureOptions);
// // // // //       document.removeEventListener("touchend", onTouchEnd, captureOptions);
// // // // //       document.removeEventListener("pointerup", onPointerUp, captureOptions);
// // // // //       document.removeEventListener(
// // // // //         "pointercancel",
// // // // //         onPointerUp,
// // // // //         captureOptions,
// // // // //       );
// // // // //       document.removeEventListener("visibilitychange", onVisibilityChange);
// // // // //       window.removeEventListener("blur", onBlur);
// // // // //       window.removeEventListener("mouseup", onMouseUp, captureOptions);
// // // // //       window.removeEventListener("touchend", onTouchEnd, captureOptions);
// // // // //       window.removeEventListener("pointerup", onPointerUp, captureOptions);
// // // // //     };
// // // // //   }, [handleMove, handleEnd, handleCancelVoice]);

// // // // //   // React 事件
// // // // //   const handleTouchStart = useCallback(
// // // // //     (e: React.TouchEvent) => {
// // // // //       e.preventDefault();
// // // // //       e.stopPropagation();
// // // // //       if (e.touches.length > 0) {
// // // // //         handleStart(e.touches[0].clientY);
// // // // //       }
// // // // //     },
// // // // //     [handleStart],
// // // // //   );

// // // // //   const handleTouchMove = useCallback(
// // // // //     (e: React.TouchEvent) => {
// // // // //       e.preventDefault();
// // // // //       e.stopPropagation();
// // // // //       if (e.touches.length > 0) {
// // // // //         handleMove(e.touches[0].clientY);
// // // // //       }
// // // // //     },
// // // // //     [handleMove],
// // // // //   );

// // // // //   const handleTouchEnd = useCallback(
// // // // //     (e: React.TouchEvent) => {
// // // // //       e.preventDefault();
// // // // //       e.stopPropagation();
// // // // //       handleEnd();
// // // // //     },
// // // // //     [handleEnd],
// // // // //   );

// // // // //   const handleMouseDown = useCallback(
// // // // //     (e: React.MouseEvent) => {
// // // // //       e.preventDefault();
// // // // //       e.stopPropagation();
// // // // //       handleStart(e.clientY);
// // // // //     },
// // // // //     [handleStart],
// // // // //   );

// // // // //   // 组件卸载清理
// // // // //   useEffect(() => {
// // // // //     return () => {
// // // // //       sessionIdRef.current += 1;
// // // // //       cleanupResources();
// // // // //     };
// // // // //   }, [cleanupResources]);

// // // // //   // 工具函数
// // // // //   const formatTime = (seconds: number): string => {
// // // // //     const mins = Math.floor(seconds / 60);
// // // // //     const secs = seconds % 60;
// // // // //     return `${mins}:${secs.toString().padStart(2, "0")}`;
// // // // //   };

// // // // //   // 样式类名
// // // // //   const getButtonClassName = (): string => {
// // // // //     const classNames = [styles.voiceButton];
// // // // //     if (state === "idle") classNames.push(styles.idle);
// // // // //     else if (state === "recording") classNames.push(styles.recording);
// // // // //     else if (state === "cancel") classNames.push(styles.cancel);
// // // // //     return classNames.join(" ");
// // // // //   };

// // // // //   const getStateTooltipClassName = (): string => {
// // // // //     const classNames = [styles.stateTooltip];
// // // // //     classNames.push(state !== "idle" ? styles.visible : styles.hidden);
// // // // //     return classNames.join(" ");
// // // // //   };

// // // // //   const getStateContentClassName = (): string => {
// // // // //     const classNames = [styles.stateContent];
// // // // //     classNames.push(state === "cancel" ? styles.cancel : styles.recording);
// // // // //     return classNames.join(" ");
// // // // //   };

// // // // //   const getStateArrowClassName = (): string => {
// // // // //     const classNames = [styles.stateArrow];
// // // // //     classNames.push(state === "cancel" ? styles.cancel : styles.recording);
// // // // //     return classNames.join(" ");
// // // // //   };

// // // // //   const isRecordingActive = state === "recording" || state === "cancel";

// // // // //   return (
// // // // //     <div className={styles.container}>
// // // // //       {/* 全屏倒计时遮罩 - 最后10秒显示 */}
// // // // //       {countdown !== null && state !== "idle" && (
// // // // //         <CountdownOverlay seconds={countdown} />
// // // // //       )}

// // // // //       {state}
// // // // //       <div className={styles.card}>
// // // // //         <div className={styles.buttonContainer}>
// // // // //           {/* 错误提示 */}
// // // // //           {micError && (
// // // // //             <div className={styles.errorTooltip}>
// // // // //               <div className={styles.errorContent}>
// // // // //                 <div className={styles.errorHeader}>
// // // // //                   <svg
// // // // //                     className={styles.errorIcon}
// // // // //                     fill="none"
// // // // //                     stroke="currentColor"
// // // // //                     viewBox="0 0 24 24"
// // // // //                   >
// // // // //                     <path
// // // // //                       strokeLinecap="round"
// // // // //                       strokeLinejoin="round"
// // // // //                       strokeWidth={2}
// // // // //                       d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
// // // // //                     />
// // // // //                   </svg>
// // // // //                   <span className={styles.errorTitle}>无法录音</span>
// // // // //                 </div>
// // // // //                 <div className={styles.errorMessage}>{micError}</div>
// // // // //               </div>
// // // // //               <div className={styles.errorArrow} />
// // // // //             </div>
// // // // //           )}

// // // // //           {/* 状态提示 */}
// // // // //           <div className={getStateTooltipClassName()}>
// // // // //             <div className={getStateContentClassName()}>
// // // // //               <div className={styles.stateText}>
// // // // //                 {state === "cancel" ? "松手取消" : "松手发送，上移取消"}
// // // // //               </div>
// // // // //               {state !== "idle" && (
// // // // //                 <div className={styles.stateDuration}>
// // // // //                   {formatTime(duration)}
// // // // //                 </div>
// // // // //               )}
// // // // //             </div>
// // // // //             <div className={getStateArrowClassName()} />
// // // // //           </div>

// // // // //           {/* 按钮 */}
// // // // //           <button
// // // // //             className={getButtonClassName()}
// // // // //             onTouchStart={handleTouchStart}
// // // // //             onTouchMove={handleTouchMove}
// // // // //             onTouchEnd={handleTouchEnd}
// // // // //             onMouseDown={handleMouseDown}
// // // // //             style={{ touchAction: "none" }}
// // // // //           >
// // // // //             <div className={styles.buttonContent}>
// // // // //               {state === "idle" ? (
// // // // //                 <>
// // // // //                   <MicIcon className={styles.micIcon} />
// // // // //                   <span className={styles.buttonText}>按住说话</span>
// // // // //                 </>
// // // // //               ) : (
// // // // //                 <>
// // // // //                   <WaveAnimation isActive={isRecordingActive} />
// // // // //                   <span className={styles.buttonTextSmall}>
// // // // //                     {state === "cancel" ? "松手取消" : "录音中..."}
// // // // //                   </span>
// // // // //                 </>
// // // // //               )}
// // // // //             </div>
// // // // //           </button>
// // // // //         </div>
// // // // //       </div>
// // // // //     </div>
// // // // //   );
// // // // // };

// // // // // export default VoiceChatButton;

// // // // import React, { useState, useRef, useEffect, useCallback } from "react";
// // // // import styles from "./voice.module.scss";

// // // // // 类型定义
// // // // type RecordingState = "idle" | "recording" | "cancel";

// // // // interface MicIconProps {
// // // //   className?: string;
// // // // }

// // // // interface WaveAnimationProps {
// // // //   isActive: boolean;
// // // // }

// // // // interface CountdownOverlayProps {
// // // //   seconds: number;
// // // // }

// // // // // 录音结果数据
// // // // interface VoiceRecordingResult {
// // // //   blob: Blob;
// // // //   duration: number;
// // // //   url: string;
// // // // }

// // // // // 组件 Props
// // // // interface VoiceChatButtonProps {
// // // //   onSend?: (result: VoiceRecordingResult) => void;
// // // //   onCancel?: () => void;
// // // // }

// // // // // 麦克风图标组件
// // // // const MicIcon: React.FC<MicIconProps> = ({ className }) => (
// // // //   <svg
// // // //     className={className}
// // // //     viewBox="0 0 24 24"
// // // //     fill="none"
// // // //     stroke="currentColor"
// // // //     strokeWidth="2"
// // // //     strokeLinecap="round"
// // // //     strokeLinejoin="round"
// // // //   >
// // // //     <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
// // // //     <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
// // // //     <line x1="12" x2="12" y1="19" y2="22" />
// // // //   </svg>
// // // // );

// // // // // 模拟波形动画组件
// // // // const WaveAnimation: React.FC<WaveAnimationProps> = ({ isActive }) => {
// // // //   const [tick, setTick] = useState(0);

// // // //   useEffect(() => {
// // // //     if (!isActive) return;
// // // //     const interval = setInterval(() => {
// // // //       setTick((t) => t + 1);
// // // //     }, 80);
// // // //     return () => clearInterval(interval);
// // // //   }, [isActive]);

// // // //   // 生成更多波形条，模拟图片中的效果
// // // //   const bars = 25;

// // // //   return (
// // // //     <div className={styles.waveContainer}>
// // // //       {[...Array(bars)].map((_, i) => {
// // // //         const phase = tick * 0.25 + i * 0.4;
// // // //         // 中间高两边低的波形效果
// // // //         const centerOffset = Math.abs(i - bars / 2) / (bars / 2);
// // // //         const baseHeight = 8 + (1 - centerOffset) * 12;
// // // //         const height =
// // // //           baseHeight + Math.sin(phase) * 6 + Math.sin(phase * 1.8) * 4;
// // // //         return (
// // // //           <div
// // // //             key={i}
// // // //             className={styles.waveBar}
// // // //             style={{ height: `${Math.max(4, height)}px` }}
// // // //           />
// // // //         );
// // // //       })}
// // // //     </div>
// // // //   );
// // // // };

// // // // // 全屏居中倒计时组件
// // // // const CountdownOverlay: React.FC<CountdownOverlayProps> = ({ seconds }) => {
// // // //   // 计算进度百分比 (10秒 -> 0秒)
// // // //   // 圆形 64px，边框 6px，所以半径 = (64 - 6) / 2 = 29
// // // //   const radius = 29;
// // // //   const progress = (seconds / 10) * 100;
// // // //   const circumference = 2 * Math.PI * radius;
// // // //   const strokeDashoffset = circumference * (1 - progress / 100);

// // // //   return (
// // // //     <div className={styles.countdownOverlay}>
// // // //       <div className={styles.countdownContent}>
// // // //         <div className={styles.countdownCircle}>
// // // //           {/* 背景圆环 */}
// // // //           <svg className={styles.countdownSvg} viewBox="0 0 64 64">
// // // //             <circle
// // // //               className={styles.countdownBg}
// // // //               cx="32"
// // // //               cy="32"
// // // //               r={radius}
// // // //               fill="none"
// // // //               strokeWidth="6"
// // // //             />
// // // //             {/* 进度圆环 */}
// // // //             <circle
// // // //               className={styles.countdownProgress}
// // // //               cx="32"
// // // //               cy="32"
// // // //               r={radius}
// // // //               fill="none"
// // // //               strokeWidth="6"
// // // //               strokeLinecap="round"
// // // //               strokeDasharray={circumference}
// // // //               strokeDashoffset={strokeDashoffset}
// // // //               transform="rotate(-90 32 32)"
// // // //             />
// // // //           </svg>
// // // //           {/* 倒计时数字 */}
// // // //           <div className={styles.countdownNumber}>
// // // //             <span className={styles.countdownValue}>{seconds}</span>
// // // //             <span className={styles.countdownUnit}>s</span>
// // // //           </div>
// // // //         </div>
// // // //       </div>
// // // //     </div>
// // // //   );
// // // // };

// // // // const VoiceChatButton: React.FC<VoiceChatButtonProps> = ({
// // // //   onSend,
// // // //   onCancel,
// // // // }) => {
// // // //   const [state, setState] = useState<RecordingState>("idle");
// // // //   const [duration, setDuration] = useState<number>(0);
// // // //   const [micError, setMicError] = useState<string | null>(null);

// // // //   // Refs
// // // //   const startYRef = useRef<number>(0);
// // // //   const stateRef = useRef<RecordingState>("idle");
// // // //   const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
// // // //   const mediaStreamRef = useRef<MediaStream | null>(null);
// // // //   const mediaRecorderRef = useRef<MediaRecorder | null>(null);
// // // //   const audioChunksRef = useRef<Blob[]>([]);
// // // //   const recordingDurationRef = useRef<number>(0);
// // // //   const sessionIdRef = useRef<number>(0);
// // // //   const mimeTypeRef = useRef<string>("audio/webm");

// // // //   // 计算倒计时（最后10秒显示）
// // // //   const countdown = duration >= 50 && duration < 60 ? 60 - duration : null;

// // // //   // 同步 state 到 ref
// // // //   useEffect(() => {
// // // //     stateRef.current = state;
// // // //   }, [state]);

// // // //   // 清理资源
// // // //   const cleanupResources = useCallback(() => {
// // // //     if (timerRef.current) {
// // // //       clearInterval(timerRef.current);
// // // //       timerRef.current = null;
// // // //     }

// // // //     if (mediaRecorderRef.current) {
// // // //       const recorder = mediaRecorderRef.current;
// // // //       recorder.onstop = null;
// // // //       recorder.ondataavailable = null;
// // // //       recorder.onerror = null;
// // // //       if (recorder.state !== "inactive") {
// // // //         try {
// // // //           recorder.stop();
// // // //         } catch (e) {}
// // // //       }
// // // //       mediaRecorderRef.current = null;
// // // //     }

// // // //     if (mediaStreamRef.current) {
// // // //       mediaStreamRef.current.getTracks().forEach((track) => track.stop());
// // // //       mediaStreamRef.current = null;
// // // //     }
// // // //   }, []);

// // // //   // 重置到初始状态
// // // //   const resetToIdle = useCallback(() => {
// // // //     sessionIdRef.current += 1;
// // // //     cleanupResources();
// // // //     audioChunksRef.current = [];
// // // //     recordingDurationRef.current = 0;
// // // //     setState("idle");
// // // //     setDuration(0);
// // // //   }, [cleanupResources]);

// // // //   // 更新取消状态
// // // //   const updateCancelState = useCallback((clientY: number) => {
// // // //     if (stateRef.current === "idle") return;

// // // //     const deltaY = startYRef.current - clientY;
// // // //     const shouldCancel = deltaY > 80;
// // // //     const newState: RecordingState = shouldCancel ? "cancel" : "recording";

// // // //     if (stateRef.current !== newState) {
// // // //       setState(newState);
// // // //     }
// // // //   }, []);

// // // //   // 发送语音
// // // //   const handleSendVoice = useCallback(
// // // //     (currentSessionId: number) => {
// // // //       if (sessionIdRef.current !== currentSessionId) return;

// // // //       const currentDuration = recordingDurationRef.current;
// // // //       const currentChunks = [...audioChunksRef.current];
// // // //       const currentMimeType = mimeTypeRef.current;

// // // //       if (currentDuration < 1) {
// // // //         resetToIdle();
// // // //         return;
// // // //       }

// // // //       if (
// // // //         mediaRecorderRef.current &&
// // // //         mediaRecorderRef.current.state !== "inactive"
// // // //       ) {
// // // //         const recorder = mediaRecorderRef.current;

// // // //         recorder.onstop = () => {
// // // //           if (sessionIdRef.current !== currentSessionId) return;

// // // //           const allChunks = [...currentChunks, ...audioChunksRef.current];

// // // //           if (allChunks.length > 0 && currentDuration >= 1) {
// // // //             const audioBlob = new Blob(allChunks, { type: currentMimeType });
// // // //             const audioUrl = URL.createObjectURL(audioBlob);
// // // //             onSend?.({
// // // //               blob: audioBlob,
// // // //               duration: currentDuration,
// // // //               url: audioUrl,
// // // //             });
// // // //           }
// // // //           resetToIdle();
// // // //         };

// // // //         try {
// // // //           recorder.stop();
// // // //         } catch (e) {
// // // //           resetToIdle();
// // // //         }
// // // //       } else {
// // // //         if (currentChunks.length > 0 && currentDuration >= 1) {
// // // //           const audioBlob = new Blob(currentChunks, { type: currentMimeType });
// // // //           const audioUrl = URL.createObjectURL(audioBlob);
// // // //           onSend?.({
// // // //             blob: audioBlob,
// // // //             duration: currentDuration,
// // // //             url: audioUrl,
// // // //           });
// // // //         }
// // // //         resetToIdle();
// // // //       }
// // // //     },
// // // //     [resetToIdle, onSend],
// // // //   );

// // // //   // 取消语音
// // // //   const handleCancelVoice = useCallback(() => {
// // // //     resetToIdle();
// // // //     onCancel?.();
// // // //   }, [resetToIdle, onCancel]);

// // // //   // 处理结束
// // // //   const handleEnd = useCallback(() => {
// // // //     const currentState = stateRef.current;
// // // //     const currentSessionId = sessionIdRef.current;

// // // //     if (currentState === "idle") return;

// // // //     if (currentState === "cancel") {
// // // //       handleCancelVoice();
// // // //     } else {
// // // //       handleSendVoice(currentSessionId);
// // // //     }
// // // //   }, [handleCancelVoice, handleSendVoice]);

// // // //   // 开始录音
// // // //   const startRecording = useCallback(async () => {
// // // //     if (stateRef.current !== "idle") return;

// // // //     const currentSessionId = ++sessionIdRef.current;

// // // //     setState("recording");
// // // //     setMicError(null);
// // // //     audioChunksRef.current = [];
// // // //     recordingDurationRef.current = 0;

// // // //     try {
// // // //       const stream = await navigator.mediaDevices.getUserMedia({
// // // //         audio: { echoCancellation: true, noiseSuppression: true },
// // // //       });

// // // //       if (
// // // //         sessionIdRef.current !== currentSessionId ||
// // // //         stateRef.current === "idle"
// // // //       ) {
// // // //         stream.getTracks().forEach((track) => track.stop());
// // // //         return;
// // // //       }

// // // //       mediaStreamRef.current = stream;

// // // //       const mimeType = MediaRecorder.isTypeSupported("audio/webm")
// // // //         ? "audio/webm"
// // // //         : MediaRecorder.isTypeSupported("audio/mp4")
// // // //         ? "audio/mp4"
// // // //         : "audio/ogg";

// // // //       mimeTypeRef.current = mimeType;

// // // //       const recorder = new MediaRecorder(stream, { mimeType });
// // // //       mediaRecorderRef.current = recorder;

// // // //       recorder.ondataavailable = (event: BlobEvent) => {
// // // //         if (sessionIdRef.current !== currentSessionId) return;
// // // //         if (event.data.size > 0) {
// // // //           audioChunksRef.current.push(event.data);
// // // //         }
// // // //       };

// // // //       recorder.start(100);

// // // //       let seconds = 0;
// // // //       timerRef.current = setInterval(() => {
// // // //         if (sessionIdRef.current !== currentSessionId) {
// // // //           if (timerRef.current) clearInterval(timerRef.current);
// // // //           return;
// // // //         }
// // // //         seconds++;
// // // //         recordingDurationRef.current = seconds;
// // // //         setDuration(seconds);
// // // //         if (seconds >= 60) handleEnd();
// // // //       }, 1000);
// // // //     } catch (error: any) {
// // // //       if (sessionIdRef.current === currentSessionId) {
// // // //         let errorMessage = "无法访问麦克风";
// // // //         if (error.name === "NotAllowedError") {
// // // //           errorMessage = "麦克风权限被拒绝";
// // // //         } else if (error.name === "NotFoundError") {
// // // //           errorMessage = "未检测到麦克风";
// // // //         }
// // // //         setMicError(errorMessage);
// // // //         setTimeout(() => setMicError(null), 3000);
// // // //         resetToIdle();
// // // //       }
// // // //     }
// // // //   }, [resetToIdle, handleEnd]);

// // // //   // 事件处理
// // // //   const handleStart = useCallback(
// // // //     (clientY: number) => {
// // // //       if (stateRef.current !== "idle") return;
// // // //       startYRef.current = clientY;
// // // //       startRecording();
// // // //     },
// // // //     [startRecording],
// // // //   );

// // // //   const handleMove = useCallback(
// // // //     (clientY: number) => {
// // // //       updateCancelState(clientY);
// // // //     },
// // // //     [updateCancelState],
// // // //   );

// // // //   // 全局事件监听
// // // //   useEffect(() => {
// // // //     const onMouseMove = (e: MouseEvent) => {
// // // //       if (stateRef.current !== "idle") {
// // // //         handleMove(e.clientY);
// // // //       }
// // // //     };

// // // //     const onMouseUp = (e: MouseEvent) => {
// // // //       if (stateRef.current !== "idle") {
// // // //         e.preventDefault();
// // // //         handleEnd();
// // // //       }
// // // //     };

// // // //     const onTouchMove = (e: TouchEvent) => {
// // // //       if (stateRef.current !== "idle" && e.touches.length > 0) {
// // // //         handleMove(e.touches[0].clientY);
// // // //       }
// // // //     };

// // // //     const onTouchEnd = (e: TouchEvent) => {
// // // //       if (stateRef.current !== "idle") {
// // // //         e.preventDefault();
// // // //         handleEnd();
// // // //       }
// // // //     };

// // // //     const onPointerMove = (e: PointerEvent) => {
// // // //       if (stateRef.current !== "idle") {
// // // //         handleMove(e.clientY);
// // // //       }
// // // //     };

// // // //     const onPointerUp = (e: PointerEvent) => {
// // // //       if (stateRef.current !== "idle") {
// // // //         e.preventDefault();
// // // //         handleEnd();
// // // //       }
// // // //     };

// // // //     const onVisibilityChange = () => {
// // // //       if (document.hidden && stateRef.current !== "idle") {
// // // //         handleCancelVoice();
// // // //       }
// // // //     };

// // // //     const onBlur = () => {
// // // //       if (stateRef.current !== "idle") {
// // // //         handleEnd();
// // // //       }
// // // //     };

// // // //     document.addEventListener("mousemove", onMouseMove);
// // // //     document.addEventListener("touchmove", onTouchMove, { passive: true });
// // // //     document.addEventListener("pointermove", onPointerMove);

// // // //     const captureOptions = { capture: true };
// // // //     document.addEventListener("mouseup", onMouseUp, captureOptions);
// // // //     document.addEventListener("touchend", onTouchEnd, captureOptions);
// // // //     document.addEventListener("pointerup", onPointerUp, captureOptions);
// // // //     document.addEventListener("pointercancel", onPointerUp, captureOptions);
// // // //     document.addEventListener("visibilitychange", onVisibilityChange);
// // // //     window.addEventListener("blur", onBlur);
// // // //     window.addEventListener("mouseup", onMouseUp, captureOptions);
// // // //     window.addEventListener("touchend", onTouchEnd, captureOptions);
// // // //     window.addEventListener("pointerup", onPointerUp, captureOptions);

// // // //     return () => {
// // // //       document.removeEventListener("mousemove", onMouseMove);
// // // //       document.removeEventListener("touchmove", onTouchMove);
// // // //       document.removeEventListener("pointermove", onPointerMove);
// // // //       document.removeEventListener("mouseup", onMouseUp, captureOptions);
// // // //       document.removeEventListener("touchend", onTouchEnd, captureOptions);
// // // //       document.removeEventListener("pointerup", onPointerUp, captureOptions);
// // // //       document.removeEventListener(
// // // //         "pointercancel",
// // // //         onPointerUp,
// // // //         captureOptions,
// // // //       );
// // // //       document.removeEventListener("visibilitychange", onVisibilityChange);
// // // //       window.removeEventListener("blur", onBlur);
// // // //       window.removeEventListener("mouseup", onMouseUp, captureOptions);
// // // //       window.removeEventListener("touchend", onTouchEnd, captureOptions);
// // // //       window.removeEventListener("pointerup", onPointerUp, captureOptions);
// // // //     };
// // // //   }, [handleMove, handleEnd, handleCancelVoice]);

// // // //   // React 事件
// // // //   const handleTouchStart = useCallback(
// // // //     (e: React.TouchEvent) => {
// // // //       e.preventDefault();
// // // //       e.stopPropagation();
// // // //       if (e.touches.length > 0) {
// // // //         handleStart(e.touches[0].clientY);
// // // //       }
// // // //     },
// // // //     [handleStart],
// // // //   );

// // // //   const handleTouchMove = useCallback(
// // // //     (e: React.TouchEvent) => {
// // // //       e.preventDefault();
// // // //       e.stopPropagation();
// // // //       if (e.touches.length > 0) {
// // // //         handleMove(e.touches[0].clientY);
// // // //       }
// // // //     },
// // // //     [handleMove],
// // // //   );

// // // //   const handleTouchEnd = useCallback(
// // // //     (e: React.TouchEvent) => {
// // // //       e.preventDefault();
// // // //       e.stopPropagation();
// // // //       handleEnd();
// // // //     },
// // // //     [handleEnd],
// // // //   );

// // // //   const handleMouseDown = useCallback(
// // // //     (e: React.MouseEvent) => {
// // // //       e.preventDefault();
// // // //       e.stopPropagation();
// // // //       handleStart(e.clientY);
// // // //     },
// // // //     [handleStart],
// // // //   );

// // // //   // 组件卸载清理
// // // //   useEffect(() => {
// // // //     return () => {
// // // //       sessionIdRef.current += 1;
// // // //       cleanupResources();
// // // //     };
// // // //   }, [cleanupResources]);

// // // //   // 工具函数
// // // //   const formatTime = (seconds: number): string => {
// // // //     const mins = Math.floor(seconds / 60);
// // // //     const secs = seconds % 60;
// // // //     return `${mins}:${secs.toString().padStart(2, "0")}`;
// // // //   };

// // // //   // 样式类名
// // // //   const getButtonClassName = (): string => {
// // // //     const classNames = [styles.voiceButton];
// // // //     if (state === "idle") classNames.push(styles.idle);
// // // //     else if (state === "recording") classNames.push(styles.recording);
// // // //     else if (state === "cancel") classNames.push(styles.cancel);
// // // //     return classNames.join(" ");
// // // //   };

// // // //   const getStateTooltipClassName = (): string => {
// // // //     const classNames = [styles.stateTooltip];
// // // //     classNames.push(state !== "idle" ? styles.visible : styles.hidden);
// // // //     return classNames.join(" ");
// // // //   };

// // // //   const getStateContentClassName = (): string => {
// // // //     const classNames = [styles.stateContent];
// // // //     classNames.push(state === "cancel" ? styles.cancel : styles.recording);
// // // //     return classNames.join(" ");
// // // //   };

// // // //   const getStateArrowClassName = (): string => {
// // // //     const classNames = [styles.stateArrow];
// // // //     classNames.push(state === "cancel" ? styles.cancel : styles.recording);
// // // //     return classNames.join(" ");
// // // //   };

// // // //   const isRecordingActive = state === "recording" || state === "cancel";

// // // //   return (
// // // //     <div className={styles.container}>
// // // //       {/* 全屏倒计时遮罩 - 最后10秒显示 */}
// // // //       {countdown !== null && state !== "idle" && (
// // // //         <CountdownOverlay seconds={countdown} />
// // // //       )}

// // // //       {state}
// // // //       <div className={styles.card}>
// // // //         <div className={styles.buttonContainer}>
// // // //           {/* 错误提示 */}
// // // //           {micError && (
// // // //             <div className={styles.errorTooltip}>
// // // //               <div className={styles.errorContent}>
// // // //                 <div className={styles.errorHeader}>
// // // //                   <svg
// // // //                     className={styles.errorIcon}
// // // //                     fill="none"
// // // //                     stroke="currentColor"
// // // //                     viewBox="0 0 24 24"
// // // //                   >
// // // //                     <path
// // // //                       strokeLinecap="round"
// // // //                       strokeLinejoin="round"
// // // //                       strokeWidth={2}
// // // //                       d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
// // // //                     />
// // // //                   </svg>
// // // //                   <span className={styles.errorTitle}>无法录音</span>
// // // //                 </div>
// // // //                 <div className={styles.errorMessage}>{micError}</div>
// // // //               </div>
// // // //               <div className={styles.errorArrow} />
// // // //             </div>
// // // //           )}

// // // //           {/* 状态提示 */}
// // // //           <div className={getStateTooltipClassName()}>
// // // //             <div className={getStateContentClassName()}>
// // // //               <div className={styles.stateText}>
// // // //                 {state === "cancel" ? "松手取消" : "松开发送 / 上滑取消"}
// // // //               </div>
// // // //             </div>
// // // //           </div>

// // // //           {/* 按钮 */}
// // // //           <button
// // // //             className={getButtonClassName()}
// // // //             onTouchStart={handleTouchStart}
// // // //             onTouchMove={handleTouchMove}
// // // //             onTouchEnd={handleTouchEnd}
// // // //             onMouseDown={handleMouseDown}
// // // //             style={{ touchAction: "none" }}
// // // //           >
// // // //             <div className={styles.buttonContent}>
// // // //               {/* {state === "idle" ? (
// // // //                 <>
// // // //                   <MicIcon className={styles.micIcon} />
// // // //                   <span className={styles.buttonText}>按住说话</span>
// // // //                 </>
// // // //               ) : (
// // // //                 <>
// // // //                   <WaveAnimation isActive={isRecordingActive} />
// // // //                   <span className={styles.buttonTextSmall}>
// // // //                     {state === "cancel" ? "松手取消" : "录音中..."}
// // // //                   </span>
// // // //                 </>
// // // //               )} */}

// // // //               <WaveAnimation isActive={isRecordingActive} />
// // // //             </div>
// // // //           </button>
// // // //         </div>
// // // //       </div>
// // // //     </div>
// // // //   );
// // // // };

// // // // export default VoiceChatButton;

// // // import React, { useState, useRef, useEffect, useCallback } from "react";
// // // import styles from "./voice.module.scss";

// // // // 类型定义
// // // type RecordingState = "idle" | "recording" | "cancel";

// // // interface MicIconProps {
// // //   className?: string;
// // // }

// // // interface WaveAnimationProps {
// // //   isActive: boolean;
// // // }

// // // interface CountdownOverlayProps {
// // //   seconds: number;
// // // }

// // // // 录音结果数据
// // // interface VoiceRecordingResult {
// // //   blob: Blob;
// // //   duration: number;
// // //   url: string;
// // // }

// // // // 组件 Props
// // // interface VoiceChatButtonProps {
// // //   onSend?: (result: VoiceRecordingResult) => void;
// // //   onCancel?: () => void;
// // // }

// // // // 麦克风图标组件
// // // const MicIcon: React.FC<MicIconProps> = ({ className }) => (
// // //   <svg
// // //     className={className}
// // //     viewBox="0 0 24 24"
// // //     fill="none"
// // //     stroke="currentColor"
// // //     strokeWidth="2"
// // //     strokeLinecap="round"
// // //     strokeLinejoin="round"
// // //   >
// // //     <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
// // //     <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
// // //     <line x1="12" x2="12" y1="19" y2="22" />
// // //   </svg>
// // // );

// // // // 模拟波形动画组件
// // // const WaveAnimation: React.FC<WaveAnimationProps> = ({ isActive }) => {
// // //   const [tick, setTick] = useState(0);

// // //   useEffect(() => {
// // //     if (!isActive) return;
// // //     const interval = setInterval(() => {
// // //       setTick((t) => t + 1);
// // //     }, 80);
// // //     return () => clearInterval(interval);
// // //   }, [isActive]);

// // //   // 生成更多波形条，模拟图片中的效果
// // //   const bars = 25;

// // //   return (
// // //     <div className={styles.waveContainer}>
// // //       {[...Array(bars)].map((_, i) => {
// // //         const phase = tick * 0.25 + i * 0.4;
// // //         // 中间高两边低的波形效果
// // //         const centerOffset = Math.abs(i - bars / 2) / (bars / 2);
// // //         const baseHeight = 10 + (1 - centerOffset) * 10;
// // //         const height =
// // //           baseHeight + Math.sin(phase) * 5 + Math.sin(phase * 1.8) * 3;
// // //         return (
// // //           <div
// // //             key={i}
// // //             className={styles.waveBar}
// // //             style={{ height: `${Math.max(6, height)}px` }}
// // //           />
// // //         );
// // //       })}
// // //     </div>
// // //   );
// // // };

// // // // 全屏居中倒计时组件
// // // const CountdownOverlay: React.FC<CountdownOverlayProps> = ({ seconds }) => {
// // //   // 计算进度百分比 (10秒 -> 0秒)
// // //   // 圆形 64px，边框 6px，所以半径 = (64 - 6) / 2 = 29
// // //   const radius = 29;
// // //   const progress = (seconds / 10) * 100;
// // //   const circumference = 2 * Math.PI * radius;
// // //   const strokeDashoffset = circumference * (1 - progress / 100);

// // //   return (
// // //     <div className={styles.countdownOverlay}>
// // //       <div className={styles.countdownContent}>
// // //         <div className={styles.countdownCircle}>
// // //           {/* 背景圆环 */}
// // //           <svg className={styles.countdownSvg} viewBox="0 0 64 64">
// // //             <circle
// // //               className={styles.countdownBg}
// // //               cx="32"
// // //               cy="32"
// // //               r={radius}
// // //               fill="none"
// // //               strokeWidth="6"
// // //             />
// // //             {/* 进度圆环 */}
// // //             <circle
// // //               className={styles.countdownProgress}
// // //               cx="32"
// // //               cy="32"
// // //               r={radius}
// // //               fill="none"
// // //               strokeWidth="6"
// // //               strokeLinecap="round"
// // //               strokeDasharray={circumference}
// // //               strokeDashoffset={strokeDashoffset}
// // //               transform="rotate(-90 32 32)"
// // //             />
// // //           </svg>
// // //           {/* 倒计时数字 */}
// // //           <div className={styles.countdownNumber}>
// // //             <span className={styles.countdownValue}>{seconds}</span>
// // //             <span className={styles.countdownUnit}>s</span>
// // //           </div>
// // //         </div>
// // //       </div>
// // //     </div>
// // //   );
// // // };

// // // const VoiceChatButton: React.FC<VoiceChatButtonProps> = ({
// // //   onSend,
// // //   onCancel,
// // // }) => {
// // //   const [state, setState] = useState<RecordingState>("idle");
// // //   const [duration, setDuration] = useState<number>(0);
// // //   const [micError, setMicError] = useState<string | null>(null);

// // //   // Refs
// // //   const startYRef = useRef<number>(0);
// // //   const stateRef = useRef<RecordingState>("idle");
// // //   const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
// // //   const mediaStreamRef = useRef<MediaStream | null>(null);
// // //   const mediaRecorderRef = useRef<MediaRecorder | null>(null);
// // //   const audioChunksRef = useRef<Blob[]>([]);
// // //   const recordingDurationRef = useRef<number>(0);
// // //   const sessionIdRef = useRef<number>(0);
// // //   const mimeTypeRef = useRef<string>("audio/webm");

// // //   // 计算倒计时（最后10秒显示）
// // //   const countdown = duration >= 50 && duration < 60 ? 60 - duration : null;

// // //   // 同步 state 到 ref
// // //   useEffect(() => {
// // //     stateRef.current = state;
// // //   }, [state]);

// // //   // 清理资源
// // //   const cleanupResources = useCallback(() => {
// // //     if (timerRef.current) {
// // //       clearInterval(timerRef.current);
// // //       timerRef.current = null;
// // //     }

// // //     if (mediaRecorderRef.current) {
// // //       const recorder = mediaRecorderRef.current;
// // //       recorder.onstop = null;
// // //       recorder.ondataavailable = null;
// // //       recorder.onerror = null;
// // //       if (recorder.state !== "inactive") {
// // //         try {
// // //           recorder.stop();
// // //         } catch (e) {}
// // //       }
// // //       mediaRecorderRef.current = null;
// // //     }

// // //     if (mediaStreamRef.current) {
// // //       mediaStreamRef.current.getTracks().forEach((track) => track.stop());
// // //       mediaStreamRef.current = null;
// // //     }
// // //   }, []);

// // //   // 重置到初始状态
// // //   const resetToIdle = useCallback(() => {
// // //     sessionIdRef.current += 1;
// // //     cleanupResources();
// // //     audioChunksRef.current = [];
// // //     recordingDurationRef.current = 0;
// // //     setState("idle");
// // //     setDuration(0);
// // //   }, [cleanupResources]);

// // //   // 更新取消状态
// // //   const updateCancelState = useCallback((clientY: number) => {
// // //     if (stateRef.current === "idle") return;

// // //     const deltaY = startYRef.current - clientY;
// // //     const shouldCancel = deltaY > 80;
// // //     const newState: RecordingState = shouldCancel ? "cancel" : "recording";

// // //     if (stateRef.current !== newState) {
// // //       setState(newState);
// // //     }
// // //   }, []);

// // //   // 发送语音
// // //   const handleSendVoice = useCallback(
// // //     (currentSessionId: number) => {
// // //       if (sessionIdRef.current !== currentSessionId) return;

// // //       const currentDuration = recordingDurationRef.current;
// // //       const currentChunks = [...audioChunksRef.current];
// // //       const currentMimeType = mimeTypeRef.current;

// // //       if (currentDuration < 1) {
// // //         resetToIdle();
// // //         return;
// // //       }

// // //       if (
// // //         mediaRecorderRef.current &&
// // //         mediaRecorderRef.current.state !== "inactive"
// // //       ) {
// // //         const recorder = mediaRecorderRef.current;

// // //         recorder.onstop = () => {
// // //           if (sessionIdRef.current !== currentSessionId) return;

// // //           const allChunks = [...currentChunks, ...audioChunksRef.current];

// // //           if (allChunks.length > 0 && currentDuration >= 1) {
// // //             const audioBlob = new Blob(allChunks, { type: currentMimeType });
// // //             const audioUrl = URL.createObjectURL(audioBlob);
// // //             onSend?.({
// // //               blob: audioBlob,
// // //               duration: currentDuration,
// // //               url: audioUrl,
// // //             });
// // //           }
// // //           resetToIdle();
// // //         };

// // //         try {
// // //           recorder.stop();
// // //         } catch (e) {
// // //           resetToIdle();
// // //         }
// // //       } else {
// // //         if (currentChunks.length > 0 && currentDuration >= 1) {
// // //           const audioBlob = new Blob(currentChunks, { type: currentMimeType });
// // //           const audioUrl = URL.createObjectURL(audioBlob);
// // //           onSend?.({
// // //             blob: audioBlob,
// // //             duration: currentDuration,
// // //             url: audioUrl,
// // //           });
// // //         }
// // //         resetToIdle();
// // //       }
// // //     },
// // //     [resetToIdle, onSend],
// // //   );

// // //   // 取消语音
// // //   const handleCancelVoice = useCallback(() => {
// // //     resetToIdle();
// // //     onCancel?.();
// // //   }, [resetToIdle, onCancel]);

// // //   // 处理结束
// // //   const handleEnd = useCallback(() => {
// // //     const currentState = stateRef.current;
// // //     const currentSessionId = sessionIdRef.current;

// // //     if (currentState === "idle") return;

// // //     if (currentState === "cancel") {
// // //       handleCancelVoice();
// // //     } else {
// // //       handleSendVoice(currentSessionId);
// // //     }
// // //   }, [handleCancelVoice, handleSendVoice]);

// // //   // 开始录音
// // //   const startRecording = useCallback(async () => {
// // //     if (stateRef.current !== "idle") return;

// // //     const currentSessionId = ++sessionIdRef.current;

// // //     setState("recording");
// // //     setMicError(null);
// // //     audioChunksRef.current = [];
// // //     recordingDurationRef.current = 0;

// // //     try {
// // //       const stream = await navigator.mediaDevices.getUserMedia({
// // //         audio: { echoCancellation: true, noiseSuppression: true },
// // //       });

// // //       if (
// // //         sessionIdRef.current !== currentSessionId ||
// // //         stateRef.current === "idle"
// // //       ) {
// // //         stream.getTracks().forEach((track) => track.stop());
// // //         return;
// // //       }

// // //       mediaStreamRef.current = stream;

// // //       const mimeType = MediaRecorder.isTypeSupported("audio/webm")
// // //         ? "audio/webm"
// // //         : MediaRecorder.isTypeSupported("audio/mp4")
// // //         ? "audio/mp4"
// // //         : "audio/ogg";

// // //       mimeTypeRef.current = mimeType;

// // //       const recorder = new MediaRecorder(stream, { mimeType });
// // //       mediaRecorderRef.current = recorder;

// // //       recorder.ondataavailable = (event: BlobEvent) => {
// // //         if (sessionIdRef.current !== currentSessionId) return;
// // //         if (event.data.size > 0) {
// // //           audioChunksRef.current.push(event.data);
// // //         }
// // //       };

// // //       recorder.start(100);

// // //       let seconds = 0;
// // //       timerRef.current = setInterval(() => {
// // //         if (sessionIdRef.current !== currentSessionId) {
// // //           if (timerRef.current) clearInterval(timerRef.current);
// // //           return;
// // //         }
// // //         seconds++;
// // //         recordingDurationRef.current = seconds;
// // //         setDuration(seconds);
// // //         if (seconds >= 60) handleEnd();
// // //       }, 1000);
// // //     } catch (error: any) {
// // //       if (sessionIdRef.current === currentSessionId) {
// // //         let errorMessage = "无法访问麦克风";
// // //         if (error.name === "NotAllowedError") {
// // //           errorMessage = "麦克风权限被拒绝";
// // //         } else if (error.name === "NotFoundError") {
// // //           errorMessage = "未检测到麦克风";
// // //         }
// // //         setMicError(errorMessage);
// // //         setTimeout(() => setMicError(null), 3000);
// // //         resetToIdle();
// // //       }
// // //     }
// // //   }, [resetToIdle, handleEnd]);

// // //   // 事件处理
// // //   const handleStart = useCallback(
// // //     (clientY: number) => {
// // //       if (stateRef.current !== "idle") return;
// // //       startYRef.current = clientY;
// // //       startRecording();
// // //     },
// // //     [startRecording],
// // //   );

// // //   const handleMove = useCallback(
// // //     (clientY: number) => {
// // //       updateCancelState(clientY);
// // //     },
// // //     [updateCancelState],
// // //   );

// // //   // 全局事件监听
// // //   useEffect(() => {
// // //     const onMouseMove = (e: MouseEvent) => {
// // //       if (stateRef.current !== "idle") {
// // //         handleMove(e.clientY);
// // //       }
// // //     };

// // //     const onMouseUp = (e: MouseEvent) => {
// // //       if (stateRef.current !== "idle") {
// // //         e.preventDefault();
// // //         handleEnd();
// // //       }
// // //     };

// // //     const onTouchMove = (e: TouchEvent) => {
// // //       if (stateRef.current !== "idle" && e.touches.length > 0) {
// // //         handleMove(e.touches[0].clientY);
// // //       }
// // //     };

// // //     const onTouchEnd = (e: TouchEvent) => {
// // //       if (stateRef.current !== "idle") {
// // //         e.preventDefault();
// // //         handleEnd();
// // //       }
// // //     };

// // //     const onPointerMove = (e: PointerEvent) => {
// // //       if (stateRef.current !== "idle") {
// // //         handleMove(e.clientY);
// // //       }
// // //     };

// // //     const onPointerUp = (e: PointerEvent) => {
// // //       if (stateRef.current !== "idle") {
// // //         e.preventDefault();
// // //         handleEnd();
// // //       }
// // //     };

// // //     const onVisibilityChange = () => {
// // //       if (document.hidden && stateRef.current !== "idle") {
// // //         handleCancelVoice();
// // //       }
// // //     };

// // //     const onBlur = () => {
// // //       if (stateRef.current !== "idle") {
// // //         handleEnd();
// // //       }
// // //     };

// // //     document.addEventListener("mousemove", onMouseMove);
// // //     document.addEventListener("touchmove", onTouchMove, { passive: true });
// // //     document.addEventListener("pointermove", onPointerMove);

// // //     const captureOptions = { capture: true };
// // //     document.addEventListener("mouseup", onMouseUp, captureOptions);
// // //     document.addEventListener("touchend", onTouchEnd, captureOptions);
// // //     document.addEventListener("pointerup", onPointerUp, captureOptions);
// // //     document.addEventListener("pointercancel", onPointerUp, captureOptions);
// // //     document.addEventListener("visibilitychange", onVisibilityChange);
// // //     window.addEventListener("blur", onBlur);
// // //     window.addEventListener("mouseup", onMouseUp, captureOptions);
// // //     window.addEventListener("touchend", onTouchEnd, captureOptions);
// // //     window.addEventListener("pointerup", onPointerUp, captureOptions);

// // //     return () => {
// // //       document.removeEventListener("mousemove", onMouseMove);
// // //       document.removeEventListener("touchmove", onTouchMove);
// // //       document.removeEventListener("pointermove", onPointerMove);
// // //       document.removeEventListener("mouseup", onMouseUp, captureOptions);
// // //       document.removeEventListener("touchend", onTouchEnd, captureOptions);
// // //       document.removeEventListener("pointerup", onPointerUp, captureOptions);
// // //       document.removeEventListener(
// // //         "pointercancel",
// // //         onPointerUp,
// // //         captureOptions,
// // //       );
// // //       document.removeEventListener("visibilitychange", onVisibilityChange);
// // //       window.removeEventListener("blur", onBlur);
// // //       window.removeEventListener("mouseup", onMouseUp, captureOptions);
// // //       window.removeEventListener("touchend", onTouchEnd, captureOptions);
// // //       window.removeEventListener("pointerup", onPointerUp, captureOptions);
// // //     };
// // //   }, [handleMove, handleEnd, handleCancelVoice]);

// // //   // React 事件
// // //   const handleTouchStart = useCallback(
// // //     (e: React.TouchEvent) => {
// // //       e.preventDefault();
// // //       e.stopPropagation();
// // //       if (e.touches.length > 0) {
// // //         handleStart(e.touches[0].clientY);
// // //       }
// // //     },
// // //     [handleStart],
// // //   );

// // //   const handleTouchMove = useCallback(
// // //     (e: React.TouchEvent) => {
// // //       e.preventDefault();
// // //       e.stopPropagation();
// // //       if (e.touches.length > 0) {
// // //         handleMove(e.touches[0].clientY);
// // //       }
// // //     },
// // //     [handleMove],
// // //   );

// // //   const handleTouchEnd = useCallback(
// // //     (e: React.TouchEvent) => {
// // //       e.preventDefault();
// // //       e.stopPropagation();
// // //       handleEnd();
// // //     },
// // //     [handleEnd],
// // //   );

// // //   const handleMouseDown = useCallback(
// // //     (e: React.MouseEvent) => {
// // //       e.preventDefault();
// // //       e.stopPropagation();
// // //       handleStart(e.clientY);
// // //     },
// // //     [handleStart],
// // //   );

// // //   // 组件卸载清理
// // //   useEffect(() => {
// // //     return () => {
// // //       sessionIdRef.current += 1;
// // //       cleanupResources();
// // //     };
// // //   }, [cleanupResources]);

// // //   // 工具函数
// // //   const formatTime = (seconds: number): string => {
// // //     const mins = Math.floor(seconds / 60);
// // //     const secs = seconds % 60;
// // //     return `${mins}:${secs.toString().padStart(2, "0")}`;
// // //   };

// // //   // 样式类名
// // //   const getButtonClassName = (): string => {
// // //     const classNames = [styles.voiceButton];
// // //     if (state === "idle") classNames.push(styles.idle);
// // //     else if (state === "recording") classNames.push(styles.recording);
// // //     else if (state === "cancel") classNames.push(styles.cancel);
// // //     return classNames.join(" ");
// // //   };

// // //   const getStateTooltipClassName = (): string => {
// // //     const classNames = [styles.stateTooltip];
// // //     classNames.push(state !== "idle" ? styles.visible : styles.hidden);
// // //     return classNames.join(" ");
// // //   };

// // //   const getStateContentClassName = (): string => {
// // //     const classNames = [styles.stateContent];
// // //     classNames.push(state === "cancel" ? styles.cancel : styles.recording);
// // //     return classNames.join(" ");
// // //   };

// // //   const isRecordingActive = state === "recording" || state === "cancel";

// // //   return (
// // //     <div className={styles.container}>
// // //       {/* 全屏倒计时遮罩 - 最后10秒显示 */}
// // //       {countdown !== null && state !== "idle" && (
// // //         <CountdownOverlay seconds={countdown} />
// // //       )}

// // //       {state}
// // //       <div className={styles.card}>
// // //         <div className={styles.buttonContainer}>
// // //           {/* 错误提示 */}
// // //           {micError && (
// // //             <div className={styles.errorTooltip}>
// // //               <div className={styles.errorContent}>
// // //                 <div className={styles.errorHeader}>
// // //                   <svg
// // //                     className={styles.errorIcon}
// // //                     fill="none"
// // //                     stroke="currentColor"
// // //                     viewBox="0 0 24 24"
// // //                   >
// // //                     <path
// // //                       strokeLinecap="round"
// // //                       strokeLinejoin="round"
// // //                       strokeWidth={2}
// // //                       d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
// // //                     />
// // //                   </svg>
// // //                   <span className={styles.errorTitle}>无法录音</span>
// // //                 </div>
// // //                 <div className={styles.errorMessage}>{micError}</div>
// // //               </div>
// // //               <div className={styles.errorArrow} />
// // //             </div>
// // //           )}

// // //           {/* 状态提示 */}
// // //           <div className={getStateTooltipClassName()}>
// // //             <div className={getStateContentClassName()}>
// // //               <div className={styles.stateText}>
// // //                 {state === "cancel" ? "松手取消" : "松开发送 / 上滑取消"}
// // //               </div>
// // //             </div>
// // //           </div>

// // //           {/* 按钮 */}
// // //           <button
// // //             className={getButtonClassName()}
// // //             onTouchStart={handleTouchStart}
// // //             onTouchMove={handleTouchMove}
// // //             onTouchEnd={handleTouchEnd}
// // //             onMouseDown={handleMouseDown}
// // //             style={{ touchAction: "none" }}
// // //           >
// // //             <div className={styles.buttonContent}>
// // //               {state === "idle" ? (
// // //                 <>
// // //                   <MicIcon className={styles.micIcon} />
// // //                   <span className={styles.buttonText}>按住说话</span>
// // //                 </>
// // //               ) : (
// // //                 <>
// // //                   <WaveAnimation isActive={isRecordingActive} />
// // //                   <span className={styles.buttonTextSmall}>
// // //                     {state === "cancel" ? "松手取消" : "录音中..."}
// // //                   </span>
// // //                 </>
// // //               )}
// // //             </div>
// // //           </button>
// // //         </div>
// // //       </div>
// // //     </div>
// // //   );
// // // };

// // // export default VoiceChatButton;

// // import React, { useState, useRef, useEffect, useCallback } from "react";
// // import styles from "./voice.module.scss";
// // import KeyBoardIcon from "../icons/keyboard.svg";
// // import clsx from "clsx";

// // // 类型定义
// // type RecordingState = "idle" | "recording" | "cancel";

// // interface MicIconProps {
// //   className?: string;
// // }

// // interface WaveAnimationProps {
// //   isActive: boolean;
// // }

// // interface CountdownOverlayProps {
// //   seconds: number;
// // }

// // // 录音结果数据
// // interface VoiceRecordingResult {
// //   blob: Blob;
// //   duration: number;
// //   url: string;
// // }

// // // 组件 Props
// // interface VoiceChatButtonProps {
// //   onSend?: (result: VoiceRecordingResult) => void;
// //   onCancel?: () => void;
// //   onSwitch?: () => void;
// // }

// // // 麦克风图标组件
// // const MicIcon: React.FC<MicIconProps> = ({ className }) => (
// //   <svg
// //     className={className}
// //     viewBox="0 0 24 24"
// //     fill="none"
// //     stroke="currentColor"
// //     strokeWidth="2"
// //     strokeLinecap="round"
// //     strokeLinejoin="round"
// //   >
// //     <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
// //     <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
// //     <line x1="12" x2="12" y1="19" y2="22" />
// //   </svg>
// // );

// // // 模拟波形动画组件
// // const WaveAnimation: React.FC<WaveAnimationProps> = ({ isActive }) => {
// //   const [tick, setTick] = useState(0);

// //   useEffect(() => {
// //     if (!isActive) return;
// //     const interval = setInterval(() => {
// //       setTick((t) => t + 1);
// //     }, 80);
// //     return () => clearInterval(interval);
// //   }, [isActive]);

// //   // 生成更多波形条，模拟图片中的效果
// //   const bars = 25;

// //   return (
// //     <div className={styles.waveContainer}>
// //       {[...Array(bars)].map((_, i) => {
// //         const phase = tick * 0.25 + i * 0.4;
// //         // 中间高两边低的波形效果
// //         const centerOffset = Math.abs(i - bars / 2) / (bars / 2);
// //         const baseHeight = 12 + (1 - centerOffset) * 10;
// //         const height =
// //           baseHeight + Math.sin(phase) * 5 + Math.sin(phase * 1.8) * 3;
// //         return (
// //           <div
// //             key={i}
// //             className={styles.waveBar}
// //             style={{ height: `${Math.max(8, height)}px` }}
// //           />
// //         );
// //       })}
// //     </div>
// //   );
// // };

// // // 全屏居中倒计时组件
// // const CountdownOverlay: React.FC<CountdownOverlayProps> = ({ seconds }) => {
// //   // 计算进度百分比 (10秒 -> 0秒)
// //   // 圆形 64px，边框 6px，所以半径 = (64 - 6) / 2 = 29
// //   const radius = 29;
// //   const progress = (seconds / 10) * 100;
// //   const circumference = 2 * Math.PI * radius;
// //   const strokeDashoffset = circumference * (1 - progress / 100);

// //   return (
// //     <div className={styles.countdownOverlay}>
// //       <div className={styles.countdownContent}>
// //         <div className={styles.countdownCircle}>
// //           {/* 背景圆环 */}
// //           <svg className={styles.countdownSvg} viewBox="0 0 64 64">
// //             <circle
// //               className={styles.countdownBg}
// //               cx="32"
// //               cy="32"
// //               r={radius}
// //               fill="none"
// //               strokeWidth="6"
// //             />
// //             {/* 进度圆环 */}
// //             <circle
// //               className={styles.countdownProgress}
// //               cx="32"
// //               cy="32"
// //               r={radius}
// //               fill="none"
// //               strokeWidth="6"
// //               strokeLinecap="round"
// //               strokeDasharray={circumference}
// //               strokeDashoffset={strokeDashoffset}
// //               transform="rotate(-90 32 32)"
// //             />
// //           </svg>
// //           {/* 倒计时数字 */}
// //           <div className={styles.countdownNumber}>
// //             <span className={styles.countdownValue}>{seconds}</span>
// //             <span className={styles.countdownUnit}>s</span>
// //           </div>
// //         </div>
// //       </div>
// //     </div>
// //   );
// // };

// // const VoiceChatButton: React.FC<VoiceChatButtonProps> = ({
// //   onSend,
// //   onCancel,
// //   onSwitch,
// // }) => {
// //   const [state, setState] = useState<RecordingState>("idle");
// //   const [duration, setDuration] = useState<number>(0);
// //   const [micError, setMicError] = useState<string | null>(null);

// //   // Refs
// //   const startYRef = useRef<number>(0);
// //   const stateRef = useRef<RecordingState>("idle");
// //   const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
// //   const mediaStreamRef = useRef<MediaStream | null>(null);
// //   const mediaRecorderRef = useRef<MediaRecorder | null>(null);
// //   const audioChunksRef = useRef<Blob[]>([]);
// //   const recordingDurationRef = useRef<number>(0);
// //   const sessionIdRef = useRef<number>(0);
// //   const mimeTypeRef = useRef<string>("audio/webm");

// //   // 计算倒计时（最后10秒显示）
// //   const countdown = duration >= 50 && duration < 60 ? 60 - duration : null;

// //   // 同步 state 到 ref
// //   useEffect(() => {
// //     stateRef.current = state;
// //   }, [state]);

// //   // 清理资源
// //   const cleanupResources = useCallback(() => {
// //     if (timerRef.current) {
// //       clearInterval(timerRef.current);
// //       timerRef.current = null;
// //     }

// //     if (mediaRecorderRef.current) {
// //       const recorder = mediaRecorderRef.current;
// //       recorder.onstop = null;
// //       recorder.ondataavailable = null;
// //       recorder.onerror = null;
// //       if (recorder.state !== "inactive") {
// //         try {
// //           recorder.stop();
// //         } catch (e) {}
// //       }
// //       mediaRecorderRef.current = null;
// //     }

// //     if (mediaStreamRef.current) {
// //       mediaStreamRef.current.getTracks().forEach((track) => track.stop());
// //       mediaStreamRef.current = null;
// //     }
// //   }, []);

// //   // 重置到初始状态
// //   const resetToIdle = useCallback(() => {
// //     sessionIdRef.current += 1;
// //     cleanupResources();
// //     audioChunksRef.current = [];
// //     recordingDurationRef.current = 0;
// //     setState("idle");
// //     setDuration(0);
// //   }, [cleanupResources]);

// //   // 更新取消状态
// //   const updateCancelState = useCallback((clientY: number) => {
// //     if (stateRef.current === "idle") return;

// //     const deltaY = startYRef.current - clientY;
// //     const shouldCancel = deltaY > 80;
// //     const newState: RecordingState = shouldCancel ? "cancel" : "recording";

// //     if (stateRef.current !== newState) {
// //       setState(newState);
// //     }
// //   }, []);

// //   // 发送语音
// //   const handleSendVoice = useCallback(
// //     (currentSessionId: number) => {
// //       if (sessionIdRef.current !== currentSessionId) return;

// //       const currentDuration = recordingDurationRef.current;
// //       const currentChunks = [...audioChunksRef.current];
// //       const currentMimeType = mimeTypeRef.current;

// //       if (currentDuration < 1) {
// //         resetToIdle();
// //         return;
// //       }

// //       if (
// //         mediaRecorderRef.current &&
// //         mediaRecorderRef.current.state !== "inactive"
// //       ) {
// //         const recorder = mediaRecorderRef.current;

// //         recorder.onstop = () => {
// //           if (sessionIdRef.current !== currentSessionId) return;

// //           const allChunks = [...currentChunks, ...audioChunksRef.current];

// //           if (allChunks.length > 0 && currentDuration >= 1) {
// //             const audioBlob = new Blob(allChunks, { type: currentMimeType });
// //             const audioUrl = URL.createObjectURL(audioBlob);
// //             onSend?.({
// //               blob: audioBlob,
// //               duration: currentDuration,
// //               url: audioUrl,
// //             });
// //           }
// //           resetToIdle();
// //         };

// //         try {
// //           recorder.stop();
// //         } catch (e) {
// //           resetToIdle();
// //         }
// //       } else {
// //         if (currentChunks.length > 0 && currentDuration >= 1) {
// //           const audioBlob = new Blob(currentChunks, { type: currentMimeType });
// //           const audioUrl = URL.createObjectURL(audioBlob);
// //           onSend?.({
// //             blob: audioBlob,
// //             duration: currentDuration,
// //             url: audioUrl,
// //           });
// //         }
// //         resetToIdle();
// //       }
// //     },
// //     [resetToIdle, onSend],
// //   );

// //   // 取消语音
// //   const handleCancelVoice = useCallback(() => {
// //     resetToIdle();
// //     onCancel?.();
// //   }, [resetToIdle, onCancel]);

// //   // 处理结束
// //   const handleEnd = useCallback(() => {
// //     const currentState = stateRef.current;
// //     const currentSessionId = sessionIdRef.current;

// //     if (currentState === "idle") return;

// //     if (currentState === "cancel") {
// //       handleCancelVoice();
// //     } else {
// //       handleSendVoice(currentSessionId);
// //     }
// //   }, [handleCancelVoice, handleSendVoice]);

// //   // 开始录音
// //   const startRecording = useCallback(async () => {
// //     if (stateRef.current !== "idle") return;

// //     const currentSessionId = ++sessionIdRef.current;

// //     setState("recording");
// //     setMicError(null);
// //     audioChunksRef.current = [];
// //     recordingDurationRef.current = 0;

// //     try {
// //       const stream = await navigator.mediaDevices.getUserMedia({
// //         audio: { echoCancellation: true, noiseSuppression: true },
// //       });

// //       if (
// //         sessionIdRef.current !== currentSessionId ||
// //         stateRef.current === "idle"
// //       ) {
// //         stream.getTracks().forEach((track) => track.stop());
// //         return;
// //       }

// //       mediaStreamRef.current = stream;

// //       const mimeType = MediaRecorder.isTypeSupported("audio/webm")
// //         ? "audio/webm"
// //         : MediaRecorder.isTypeSupported("audio/mp4")
// //         ? "audio/mp4"
// //         : "audio/ogg";

// //       mimeTypeRef.current = mimeType;

// //       const recorder = new MediaRecorder(stream, { mimeType });
// //       mediaRecorderRef.current = recorder;

// //       recorder.ondataavailable = (event: BlobEvent) => {
// //         if (sessionIdRef.current !== currentSessionId) return;
// //         if (event.data.size > 0) {
// //           audioChunksRef.current.push(event.data);
// //         }
// //       };

// //       recorder.start(100);

// //       let seconds = 0;
// //       timerRef.current = setInterval(() => {
// //         if (sessionIdRef.current !== currentSessionId) {
// //           if (timerRef.current) clearInterval(timerRef.current);
// //           return;
// //         }
// //         seconds++;
// //         recordingDurationRef.current = seconds;
// //         setDuration(seconds);
// //         if (seconds >= 60) handleEnd();
// //       }, 1000);
// //     } catch (error: any) {
// //       if (sessionIdRef.current === currentSessionId) {
// //         let errorMessage = "无法访问麦克风";
// //         if (error.name === "NotAllowedError") {
// //           errorMessage = "麦克风权限被拒绝";
// //         } else if (error.name === "NotFoundError") {
// //           errorMessage = "未检测到麦克风";
// //         }
// //         setMicError(errorMessage);
// //         setTimeout(() => setMicError(null), 3000);
// //         resetToIdle();
// //       }
// //     }
// //   }, [resetToIdle, handleEnd]);

// //   // 事件处理
// //   const handleStart = useCallback(
// //     (clientY: number) => {
// //       if (stateRef.current !== "idle") return;
// //       startYRef.current = clientY;
// //       startRecording();
// //     },
// //     [startRecording],
// //   );

// //   const handleMove = useCallback(
// //     (clientY: number) => {
// //       updateCancelState(clientY);
// //     },
// //     [updateCancelState],
// //   );

// //   // 全局事件监听
// //   useEffect(() => {
// //     const onMouseMove = (e: MouseEvent) => {
// //       if (stateRef.current !== "idle") {
// //         handleMove(e.clientY);
// //       }
// //     };

// //     const onMouseUp = (e: MouseEvent) => {
// //       if (stateRef.current !== "idle") {
// //         e.preventDefault();
// //         handleEnd();
// //       }
// //     };

// //     const onTouchMove = (e: TouchEvent) => {
// //       if (stateRef.current !== "idle" && e.touches.length > 0) {
// //         handleMove(e.touches[0].clientY);
// //       }
// //     };

// //     const onTouchEnd = (e: TouchEvent) => {
// //       if (stateRef.current !== "idle") {
// //         e.preventDefault();
// //         handleEnd();
// //       }
// //     };

// //     const onPointerMove = (e: PointerEvent) => {
// //       if (stateRef.current !== "idle") {
// //         handleMove(e.clientY);
// //       }
// //     };

// //     const onPointerUp = (e: PointerEvent) => {
// //       if (stateRef.current !== "idle") {
// //         e.preventDefault();
// //         handleEnd();
// //       }
// //     };

// //     const onVisibilityChange = () => {
// //       if (document.hidden && stateRef.current !== "idle") {
// //         handleCancelVoice();
// //       }
// //     };

// //     const onBlur = () => {
// //       if (stateRef.current !== "idle") {
// //         handleEnd();
// //       }
// //     };

// //     document.addEventListener("mousemove", onMouseMove);
// //     document.addEventListener("touchmove", onTouchMove, { passive: true });
// //     document.addEventListener("pointermove", onPointerMove);

// //     const captureOptions = { capture: true };
// //     document.addEventListener("mouseup", onMouseUp, captureOptions);
// //     document.addEventListener("touchend", onTouchEnd, captureOptions);
// //     document.addEventListener("pointerup", onPointerUp, captureOptions);
// //     document.addEventListener("pointercancel", onPointerUp, captureOptions);
// //     document.addEventListener("visibilitychange", onVisibilityChange);
// //     window.addEventListener("blur", onBlur);
// //     window.addEventListener("mouseup", onMouseUp, captureOptions);
// //     window.addEventListener("touchend", onTouchEnd, captureOptions);
// //     window.addEventListener("pointerup", onPointerUp, captureOptions);

// //     return () => {
// //       document.removeEventListener("mousemove", onMouseMove);
// //       document.removeEventListener("touchmove", onTouchMove);
// //       document.removeEventListener("pointermove", onPointerMove);
// //       document.removeEventListener("mouseup", onMouseUp, captureOptions);
// //       document.removeEventListener("touchend", onTouchEnd, captureOptions);
// //       document.removeEventListener("pointerup", onPointerUp, captureOptions);
// //       document.removeEventListener(
// //         "pointercancel",
// //         onPointerUp,
// //         captureOptions,
// //       );
// //       document.removeEventListener("visibilitychange", onVisibilityChange);
// //       window.removeEventListener("blur", onBlur);
// //       window.removeEventListener("mouseup", onMouseUp, captureOptions);
// //       window.removeEventListener("touchend", onTouchEnd, captureOptions);
// //       window.removeEventListener("pointerup", onPointerUp, captureOptions);
// //     };
// //   }, [handleMove, handleEnd, handleCancelVoice]);

// //   // React 事件
// //   const handleTouchStart = useCallback(
// //     (e: React.TouchEvent) => {
// //       e.preventDefault();
// //       e.stopPropagation();
// //       if (e.touches.length > 0) {
// //         handleStart(e.touches[0].clientY);
// //       }
// //     },
// //     [handleStart],
// //   );

// //   const handleTouchMove = useCallback(
// //     (e: React.TouchEvent) => {
// //       e.preventDefault();
// //       e.stopPropagation();
// //       if (e.touches.length > 0) {
// //         handleMove(e.touches[0].clientY);
// //       }
// //     },
// //     [handleMove],
// //   );

// //   const handleTouchEnd = useCallback(
// //     (e: React.TouchEvent) => {
// //       e.preventDefault();
// //       e.stopPropagation();
// //       handleEnd();
// //     },
// //     [handleEnd],
// //   );

// //   const handleMouseDown = useCallback(
// //     (e: React.MouseEvent) => {
// //       e.preventDefault();
// //       e.stopPropagation();
// //       handleStart(e.clientY);
// //     },
// //     [handleStart],
// //   );

// //   // 组件卸载清理
// //   useEffect(() => {
// //     return () => {
// //       sessionIdRef.current += 1;
// //       cleanupResources();
// //     };
// //   }, [cleanupResources]);

// //   // 工具函数
// //   const formatTime = (seconds: number): string => {
// //     const mins = Math.floor(seconds / 60);
// //     const secs = seconds % 60;
// //     return `${mins}:${secs.toString().padStart(2, "0")}`;
// //   };

// //   // 样式类名
// //   const getButtonClassName = (): string => {
// //     const classNames = [styles.voiceButton];
// //     if (state === "idle") classNames.push(styles.idle);
// //     else if (state === "recording") classNames.push(styles.recording);
// //     else if (state === "cancel") classNames.push(styles.cancel);
// //     return classNames.join(" ");
// //   };

// //   const getStateTooltipClassName = (): string => {
// //     const classNames = [styles.stateTooltip];
// //     classNames.push(state !== "idle" ? styles.visible : styles.hidden);
// //     return classNames.join(" ");
// //   };

// //   const getStateContentClassName = (): string => {
// //     const classNames = [styles.stateContent];
// //     classNames.push(state === "cancel" ? styles.cancel : styles.recording);
// //     return classNames.join(" ");
// //   };

// //   const getStateArrowClassName = (): string => {
// //     const classNames = [styles.stateArrow];
// //     classNames.push(state === "cancel" ? styles.cancel : styles.recording);
// //     return classNames.join(" ");
// //   };

// //   const isRecordingActive = state === "recording" || state === "cancel";

// //   return (
// //     <div className={styles.container}>
// //       {/* 全屏倒计时遮罩 - 最后10秒显示 */}
// //       {countdown !== null && state !== "idle" && (
// //         <CountdownOverlay seconds={countdown} />
// //       )}

// //       <div className={styles.card}>
// //         <div className={styles.buttonContainer}>
// //           {/* 错误提示 */}
// //           {micError && (
// //             <div className={styles.errorTooltip}>
// //               <div className={styles.errorContent}>
// //                 <div className={styles.errorHeader}>
// //                   <svg
// //                     className={styles.errorIcon}
// //                     fill="none"
// //                     stroke="currentColor"
// //                     viewBox="0 0 24 24"
// //                   >
// //                     <path
// //                       strokeLinecap="round"
// //                       strokeLinejoin="round"
// //                       strokeWidth={2}
// //                       d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
// //                     />
// //                   </svg>
// //                   <span className={styles.errorTitle}>无法录音</span>
// //                 </div>
// //                 <div className={styles.errorMessage}>{micError}</div>
// //               </div>
// //               <div className={styles.errorArrow} />
// //             </div>
// //           )}

// //           {/* 状态提示 */}
// //           <div className={getStateTooltipClassName()}>
// //             <div className={getStateContentClassName()}>
// //               <div className={styles.stateText}>
// //                 {state === "cancel" ? "松手取消" : "松开发送 / 上滑取消"}
// //               </div>
// //             </div>
// //           </div>

// //           {/* 按钮容器 */}
// //           <div className={styles.buttonRow}>
// //             {/* 语音按钮 */}
// //             <div
// //               className={getButtonClassName()}
// //               onTouchStart={handleTouchStart}
// //               onTouchMove={handleTouchMove}
// //               onTouchEnd={handleTouchEnd}
// //               onMouseDown={handleMouseDown}
// //               style={{
// //                 touchAction: "none",
// //                 height: "100%",
// //                 borderRadius: "32px",
// //               }}
// //             >
// //               <div className={styles.buttonContent}>
// //                 {state === "idle" ? (
// //                   <>
// //                     {/* <MicIcon className={styles.micIcon} /> */}
// //                     <span className={styles.buttonText}>按住说话</span>
// //                   </>
// //                 ) : (
// //                   <>
// //                     <WaveAnimation isActive={isRecordingActive} />
// //                     <span className={styles.buttonTextSmall}>
// //                       {state === "cancel" ? "松手取消" : "录音中..."}
// //                     </span>
// //                   </>
// //                 )}
// //               </div>
// //             </div>
// //             {/* <KeyBoardIcon /> */}
// //             {/* 右侧Log按钮 - 只在idle状态显示，叠加在语音按钮上层 */}
// //             {state === "idle" && (
// //               <div
// //                 className={clsx(styles.logButton, "no-dark")}
// //                 onClick={(e) => {
// //                   e.stopPropagation();
// //                   onSwitch?.();
// //                   console.log("[LogButton] clicked");
// //                   console.log("Current state:", state);
// //                   console.log("Duration:", duration);
// //                 }}
// //               >
// //                 <KeyBoardIcon />
// //               </div>
// //             )}
// //           </div>
// //         </div>
// //       </div>
// //     </div>
// //   );
// // };

// // export default VoiceChatButton;

// import React, { useState, useRef, useEffect, useCallback } from "react";
// import styles from "./voice.module.scss";
// import KeyBoardIcon from "../icons/keyboard.svg";
// import clsx from "clsx";

// // 类型定义
// type RecordingState = "idle" | "recording" | "cancel";

// interface MicIconProps {
//   className?: string;
// }

// interface WaveAnimationProps {
//   isActive: boolean;
// }

// interface CountdownOverlayProps {
//   seconds: number;
// }

// // 录音结果数据
// export interface VoiceRecordingResult {
//   blob: Blob;
//   duration: number;
//   url: string;
// }

// // 组件 Props
// interface VoiceChatButtonProps {
//   onSend?: (result: VoiceRecordingResult) => void;
//   onCancel?: () => void;
//   onSwitch?: () => void;
//   embedded?: boolean; // 嵌入模式，不渲染外框
// }

// // 麦克风图标组件
// const MicIcon: React.FC<MicIconProps> = ({ className }) => (
//   <svg
//     className={className}
//     viewBox="0 0 24 24"
//     fill="none"
//     stroke="currentColor"
//     strokeWidth="2"
//     strokeLinecap="round"
//     strokeLinejoin="round"
//   >
//     <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
//     <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
//     <line x1="12" x2="12" y1="19" y2="22" />
//   </svg>
// );

// // 模拟波形动画组件
// const WaveAnimation: React.FC<WaveAnimationProps> = ({ isActive }) => {
//   const [tick, setTick] = useState(0);

//   useEffect(() => {
//     if (!isActive) return;
//     const interval = setInterval(() => {
//       setTick((t) => t + 1);
//     }, 80);
//     return () => clearInterval(interval);
//   }, [isActive]);

//   // 生成更多波形条，模拟图片中的效果
//   const bars = 25;

//   return (
//     <div className={styles.waveContainer}>
//       {[...Array(bars)].map((_, i) => {
//         const phase = tick * 0.25 + i * 0.4;
//         // 中间高两边低的波形效果
//         const centerOffset = Math.abs(i - bars / 2) / (bars / 2);
//         const baseHeight = 12 + (1 - centerOffset) * 10;
//         const height =
//           baseHeight + Math.sin(phase) * 5 + Math.sin(phase * 1.8) * 3;
//         return (
//           <div
//             key={i}
//             className={styles.waveBar}
//             style={{ height: `${Math.max(8, height)}px` }}
//           />
//         );
//       })}
//     </div>
//   );
// };

// // 全屏居中倒计时组件
// const CountdownOverlay: React.FC<CountdownOverlayProps> = ({ seconds }) => {
//   // 计算进度百分比 (10秒 -> 0秒)
//   // 圆形 64px，边框 6px，所以半径 = (64 - 6) / 2 = 29
//   const radius = 29;
//   const progress = (seconds / 10) * 100;
//   const circumference = 2 * Math.PI * radius;
//   const strokeDashoffset = circumference * (1 - progress / 100);

//   return (
//     <div className={styles.countdownOverlay}>
//       <div className={styles.countdownContent}>
//         <div className={styles.countdownCircle}>
//           {/* 背景圆环 */}
//           <svg className={styles.countdownSvg} viewBox="0 0 64 64">
//             <circle
//               className={styles.countdownBg}
//               cx="32"
//               cy="32"
//               r={radius}
//               fill="none"
//               strokeWidth="6"
//             />
//             {/* 进度圆环 */}
//             <circle
//               className={styles.countdownProgress}
//               cx="32"
//               cy="32"
//               r={radius}
//               fill="none"
//               strokeWidth="6"
//               strokeLinecap="round"
//               strokeDasharray={circumference}
//               strokeDashoffset={strokeDashoffset}
//               transform="rotate(-90 32 32)"
//             />
//           </svg>
//           {/* 倒计时数字 */}
//           <div className={styles.countdownNumber}>
//             <span className={styles.countdownValue}>{seconds}</span>
//             <span className={styles.countdownUnit}>s</span>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// const VoiceChatButton: React.FC<VoiceChatButtonProps> = ({
//   onSend,
//   onCancel,
//   onSwitch,
//   embedded = false,
// }) => {
//   const [state, setState] = useState<RecordingState>("idle");
//   const [duration, setDuration] = useState<number>(0);
//   const [micError, setMicError] = useState<string | null>(null);

//   // Refs
//   const startYRef = useRef<number>(0);
//   const stateRef = useRef<RecordingState>("idle");
//   const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
//   const mediaStreamRef = useRef<MediaStream | null>(null);
//   const mediaRecorderRef = useRef<MediaRecorder | null>(null);
//   const audioChunksRef = useRef<Blob[]>([]);
//   const recordingDurationRef = useRef<number>(0);
//   const sessionIdRef = useRef<number>(0);
//   const mimeTypeRef = useRef<string>("audio/webm");

//   // 计算倒计时（最后10秒显示）
//   const countdown = duration >= 50 && duration < 60 ? 60 - duration : null;

//   // 同步 state 到 ref
//   useEffect(() => {
//     stateRef.current = state;
//   }, [state]);

//   // 清理资源
//   const cleanupResources = useCallback(() => {
//     if (timerRef.current) {
//       clearInterval(timerRef.current);
//       timerRef.current = null;
//     }

//     if (mediaRecorderRef.current) {
//       const recorder = mediaRecorderRef.current;
//       recorder.onstop = null;
//       recorder.ondataavailable = null;
//       recorder.onerror = null;
//       if (recorder.state !== "inactive") {
//         try {
//           recorder.stop();
//         } catch (e) {}
//       }
//       mediaRecorderRef.current = null;
//     }

//     if (mediaStreamRef.current) {
//       mediaStreamRef.current.getTracks().forEach((track) => track.stop());
//       mediaStreamRef.current = null;
//     }
//   }, []);

//   // 重置到初始状态
//   const resetToIdle = useCallback(() => {
//     sessionIdRef.current += 1;
//     cleanupResources();
//     audioChunksRef.current = [];
//     recordingDurationRef.current = 0;
//     setState("idle");
//     setDuration(0);
//   }, [cleanupResources]);

//   // 更新取消状态
//   const updateCancelState = useCallback((clientY: number) => {
//     if (stateRef.current === "idle") return;

//     const deltaY = startYRef.current - clientY;
//     const shouldCancel = deltaY > 80;
//     const newState: RecordingState = shouldCancel ? "cancel" : "recording";

//     if (stateRef.current !== newState) {
//       setState(newState);
//     }
//   }, []);

//   // 发送语音
//   const handleSendVoice = useCallback(
//     (currentSessionId: number) => {
//       if (sessionIdRef.current !== currentSessionId) return;

//       const currentDuration = recordingDurationRef.current;
//       const currentChunks = [...audioChunksRef.current];
//       const currentMimeType = mimeTypeRef.current;

//       if (currentDuration < 1) {
//         resetToIdle();
//         return;
//       }

//       if (
//         mediaRecorderRef.current &&
//         mediaRecorderRef.current.state !== "inactive"
//       ) {
//         const recorder = mediaRecorderRef.current;

//         recorder.onstop = () => {
//           if (sessionIdRef.current !== currentSessionId) return;

//           const allChunks = [...currentChunks, ...audioChunksRef.current];

//           if (allChunks.length > 0 && currentDuration >= 1) {
//             const audioBlob = new Blob(allChunks, { type: currentMimeType });
//             const audioUrl = URL.createObjectURL(audioBlob);
//             onSend?.({
//               blob: audioBlob,
//               duration: currentDuration,
//               url: audioUrl,
//             });
//           }
//           resetToIdle();
//         };

//         try {
//           recorder.stop();
//         } catch (e) {
//           resetToIdle();
//         }
//       } else {
//         if (currentChunks.length > 0 && currentDuration >= 1) {
//           const audioBlob = new Blob(currentChunks, { type: currentMimeType });
//           const audioUrl = URL.createObjectURL(audioBlob);
//           onSend?.({
//             blob: audioBlob,
//             duration: currentDuration,
//             url: audioUrl,
//           });
//         }
//         resetToIdle();
//       }
//     },
//     [resetToIdle, onSend],
//   );

//   // 取消语音
//   const handleCancelVoice = useCallback(() => {
//     resetToIdle();
//     onCancel?.();
//   }, [resetToIdle, onCancel]);

//   // 处理结束
//   const handleEnd = useCallback(() => {
//     const currentState = stateRef.current;
//     const currentSessionId = sessionIdRef.current;

//     if (currentState === "idle") return;

//     if (currentState === "cancel") {
//       handleCancelVoice();
//     } else {
//       handleSendVoice(currentSessionId);
//     }
//   }, [handleCancelVoice, handleSendVoice]);

//   // 开始录音
//   const startRecording = useCallback(async () => {
//     if (stateRef.current !== "idle") return;

//     const currentSessionId = ++sessionIdRef.current;

//     setState("recording");
//     setMicError(null);
//     audioChunksRef.current = [];
//     recordingDurationRef.current = 0;

//     try {
//       const stream = await navigator.mediaDevices.getUserMedia({
//         audio: { echoCancellation: true, noiseSuppression: true },
//       });

//       if (
//         sessionIdRef.current !== currentSessionId ||
//         stateRef.current === "idle"
//       ) {
//         stream.getTracks().forEach((track) => track.stop());
//         return;
//       }

//       mediaStreamRef.current = stream;

//       const mimeType = MediaRecorder.isTypeSupported("audio/webm")
//         ? "audio/webm"
//         : MediaRecorder.isTypeSupported("audio/mp4")
//         ? "audio/mp4"
//         : "audio/ogg";

//       mimeTypeRef.current = mimeType;

//       const recorder = new MediaRecorder(stream, { mimeType });
//       mediaRecorderRef.current = recorder;

//       recorder.ondataavailable = (event: BlobEvent) => {
//         if (sessionIdRef.current !== currentSessionId) return;
//         if (event.data.size > 0) {
//           audioChunksRef.current.push(event.data);
//         }
//       };

//       recorder.start(100);

//       let seconds = 0;
//       timerRef.current = setInterval(() => {
//         if (sessionIdRef.current !== currentSessionId) {
//           if (timerRef.current) clearInterval(timerRef.current);
//           return;
//         }
//         seconds++;
//         recordingDurationRef.current = seconds;
//         setDuration(seconds);
//         if (seconds >= 60) handleEnd();
//       }, 1000);
//     } catch (error: any) {
//       if (sessionIdRef.current === currentSessionId) {
//         let errorMessage = "无法访问麦克风";
//         if (error.name === "NotAllowedError") {
//           errorMessage = "麦克风权限被拒绝";
//         } else if (error.name === "NotFoundError") {
//           errorMessage = "未检测到麦克风";
//         }
//         setMicError(errorMessage);
//         setTimeout(() => setMicError(null), 3000);
//         resetToIdle();
//       }
//     }
//   }, [resetToIdle, handleEnd]);

//   // 事件处理
//   const handleStart = useCallback(
//     (clientY: number) => {
//       if (stateRef.current !== "idle") return;
//       startYRef.current = clientY;
//       startRecording();
//     },
//     [startRecording],
//   );

//   const handleMove = useCallback(
//     (clientY: number) => {
//       updateCancelState(clientY);
//     },
//     [updateCancelState],
//   );

//   // 全局事件监听
//   useEffect(() => {
//     const onMouseMove = (e: MouseEvent) => {
//       if (stateRef.current !== "idle") {
//         handleMove(e.clientY);
//       }
//     };

//     const onMouseUp = (e: MouseEvent) => {
//       if (stateRef.current !== "idle") {
//         e.preventDefault();
//         handleEnd();
//       }
//     };

//     const onTouchMove = (e: TouchEvent) => {
//       if (stateRef.current !== "idle" && e.touches.length > 0) {
//         handleMove(e.touches[0].clientY);
//       }
//     };

//     const onTouchEnd = (e: TouchEvent) => {
//       if (stateRef.current !== "idle") {
//         e.preventDefault();
//         handleEnd();
//       }
//     };

//     const onPointerMove = (e: PointerEvent) => {
//       if (stateRef.current !== "idle") {
//         handleMove(e.clientY);
//       }
//     };

//     const onPointerUp = (e: PointerEvent) => {
//       if (stateRef.current !== "idle") {
//         e.preventDefault();
//         handleEnd();
//       }
//     };

//     const onVisibilityChange = () => {
//       if (document.hidden && stateRef.current !== "idle") {
//         handleCancelVoice();
//       }
//     };

//     const onBlur = () => {
//       if (stateRef.current !== "idle") {
//         handleEnd();
//       }
//     };

//     document.addEventListener("mousemove", onMouseMove);
//     document.addEventListener("touchmove", onTouchMove, { passive: true });
//     document.addEventListener("pointermove", onPointerMove);

//     const captureOptions = { capture: true };
//     document.addEventListener("mouseup", onMouseUp, captureOptions);
//     document.addEventListener("touchend", onTouchEnd, captureOptions);
//     document.addEventListener("pointerup", onPointerUp, captureOptions);
//     document.addEventListener("pointercancel", onPointerUp, captureOptions);
//     document.addEventListener("visibilitychange", onVisibilityChange);
//     window.addEventListener("blur", onBlur);
//     window.addEventListener("mouseup", onMouseUp, captureOptions);
//     window.addEventListener("touchend", onTouchEnd, captureOptions);
//     window.addEventListener("pointerup", onPointerUp, captureOptions);

//     return () => {
//       document.removeEventListener("mousemove", onMouseMove);
//       document.removeEventListener("touchmove", onTouchMove);
//       document.removeEventListener("pointermove", onPointerMove);
//       document.removeEventListener("mouseup", onMouseUp, captureOptions);
//       document.removeEventListener("touchend", onTouchEnd, captureOptions);
//       document.removeEventListener("pointerup", onPointerUp, captureOptions);
//       document.removeEventListener(
//         "pointercancel",
//         onPointerUp,
//         captureOptions,
//       );
//       document.removeEventListener("visibilitychange", onVisibilityChange);
//       window.removeEventListener("blur", onBlur);
//       window.removeEventListener("mouseup", onMouseUp, captureOptions);
//       window.removeEventListener("touchend", onTouchEnd, captureOptions);
//       window.removeEventListener("pointerup", onPointerUp, captureOptions);
//     };
//   }, [handleMove, handleEnd, handleCancelVoice]);

//   // React 事件
//   const handleTouchStart = useCallback(
//     (e: React.TouchEvent) => {
//       e.preventDefault();
//       e.stopPropagation();
//       if (e.touches.length > 0) {
//         handleStart(e.touches[0].clientY);
//       }
//     },
//     [handleStart],
//   );

//   const handleTouchMove = useCallback(
//     (e: React.TouchEvent) => {
//       e.preventDefault();
//       e.stopPropagation();
//       if (e.touches.length > 0) {
//         handleMove(e.touches[0].clientY);
//       }
//     },
//     [handleMove],
//   );

//   const handleTouchEnd = useCallback(
//     (e: React.TouchEvent) => {
//       e.preventDefault();
//       e.stopPropagation();
//       handleEnd();
//     },
//     [handleEnd],
//   );

//   const handleMouseDown = useCallback(
//     (e: React.MouseEvent) => {
//       e.preventDefault();
//       e.stopPropagation();
//       handleStart(e.clientY);
//     },
//     [handleStart],
//   );

//   // 组件卸载清理
//   useEffect(() => {
//     return () => {
//       sessionIdRef.current += 1;
//       cleanupResources();
//     };
//   }, [cleanupResources]);

//   // 工具函数
//   const formatTime = (seconds: number): string => {
//     const mins = Math.floor(seconds / 60);
//     const secs = seconds % 60;
//     return `${mins}:${secs.toString().padStart(2, "0")}`;
//   };

//   // 样式类名
//   const getButtonClassName = (): string => {
//     const classNames = [styles.voiceButton];
//     if (state === "idle") classNames.push(styles.idle);
//     else if (state === "recording") classNames.push(styles.recording);
//     else if (state === "cancel") classNames.push(styles.cancel);
//     return classNames.join(" ");
//   };

//   const getStateTooltipClassName = (): string => {
//     const classNames = [styles.stateTooltip];
//     classNames.push(state !== "idle" ? styles.visible : styles.hidden);
//     return classNames.join(" ");
//   };

//   const getStateContentClassName = (): string => {
//     const classNames = [styles.stateContent];
//     classNames.push(state === "cancel" ? styles.cancel : styles.recording);
//     return classNames.join(" ");
//   };

//   const getStateArrowClassName = (): string => {
//     const classNames = [styles.stateArrow];
//     classNames.push(state === "cancel" ? styles.cancel : styles.recording);
//     return classNames.join(" ");
//   };

//   const isRecordingActive = state === "recording" || state === "cancel";

//   // 错误提示组件
//   const ErrorTooltip = () =>
//     micError ? (
//       <div className={styles.errorTooltip}>
//         <div className={styles.errorContent}>
//           <div className={styles.errorHeader}>
//             <svg
//               className={styles.errorIcon}
//               fill="none"
//               stroke="currentColor"
//               viewBox="0 0 24 24"
//             >
//               <path
//                 strokeLinecap="round"
//                 strokeLinejoin="round"
//                 strokeWidth={2}
//                 d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
//               />
//             </svg>
//             <span className={styles.errorTitle}>无法录音</span>
//           </div>
//           <div className={styles.errorMessage}>{micError}</div>
//         </div>
//         <div className={styles.errorArrow} />
//       </div>
//     ) : null;

//   // 状态提示组件
//   const StateTooltip = () => (
//     <div className={getStateTooltipClassName()}>
//       <div className={getStateContentClassName()}>
//         <div className={styles.stateText}>
//           {state === "cancel" ? "松手取消" : "松开发送 / 上滑取消"}
//         </div>
//       </div>
//     </div>
//   );

//   // ==================== 嵌入模式渲染 ====================
//   if (embedded) {
//     return (
//       <div className={styles.embeddedContainer}>
//         {/* 倒计时遮罩 */}
//         {countdown !== null && state !== "idle" && (
//           <CountdownOverlay seconds={countdown} />
//         )}

//         {/* 错误提示 */}
//         <ErrorTooltip />

//         {/* 状态提示 */}
//         <StateTooltip />

//         {/* 主内容区域 */}
//         <div
//           className={clsx(styles.embeddedButton, {
//             [styles.embeddedIdle]: state === "idle",
//             [styles.embeddedRecording]: state === "recording",
//             [styles.embeddedCancel]: state === "cancel",
//           })}
//           onTouchStart={handleTouchStart}
//           onTouchMove={handleTouchMove}
//           onTouchEnd={handleTouchEnd}
//           onMouseDown={handleMouseDown}
//           style={{ touchAction: "none" }}
//         >
//           <div className={styles.embeddedButtonContent}>
//             {state === "idle" ? (
//               <span className={styles.embeddedButtonText}>按住说话</span>
//             ) : (
//               <WaveAnimation isActive={isRecordingActive} />
//             )}
//           </div>
//         </div>

//         {/* 键盘切换按钮 */}
//         {state === "idle" && (
//           <div
//             className={clsx(styles.embeddedLogButton, "no-dark")}
//             onClick={(e) => {
//               e.stopPropagation();
//               onSwitch?.();
//             }}
//           >
//             <KeyBoardIcon />
//           </div>
//         )}
//       </div>
//     );
//   }

//   // ==================== 原有完整模式渲染 ====================
//   return (
//     <div className={styles.container}>
//       {/* 全屏倒计时遮罩 - 最后10秒显示 */}
//       {countdown !== null && state !== "idle" && (
//         <CountdownOverlay seconds={countdown} />
//       )}

//       <div className={styles.card}>
//         <div className={styles.buttonContainer}>
//           {/* 错误提示 */}
//           <ErrorTooltip />

//           {/* 状态提示 */}
//           <StateTooltip />

//           {/* 按钮容器 */}
//           <div className={styles.buttonRow}>
//             {/* 语音按钮 */}
//             <div
//               className={getButtonClassName()}
//               onTouchStart={handleTouchStart}
//               onTouchMove={handleTouchMove}
//               onTouchEnd={handleTouchEnd}
//               onMouseDown={handleMouseDown}
//               style={{
//                 touchAction: "none",
//                 height: "100%",
//                 borderRadius: "32px",
//               }}
//             >
//               <div className={styles.buttonContent}>
//                 {state === "idle" ? (
//                   <>
//                     <span className={styles.buttonText}>按住说话</span>
//                   </>
//                 ) : (
//                   <>
//                     <WaveAnimation isActive={isRecordingActive} />
//                     <span className={styles.buttonTextSmall}>
//                       {state === "cancel" ? "松手取消" : "录音中..."}
//                     </span>
//                   </>
//                 )}
//               </div>
//             </div>

//             {/* 右侧Log按钮 - 只在idle状态显示 */}
//             {state === "idle" && (
//               <div
//                 className={clsx(styles.logButton, "no-dark")}
//                 onClick={(e) => {
//                   e.stopPropagation();
//                   onSwitch?.();
//                 }}
//               >
//                 <KeyBoardIcon />
//               </div>
//             )}
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default VoiceChatButton;

import React, { useState, useRef, useEffect, useCallback } from "react";
import styles from "./voice.module.scss";
import KeyBoardIcon from "../icons/keyboard.svg";
import clsx from "clsx";
import { useTranslation } from "react-i18next";

// 类型定义
type RecordingState = "idle" | "recording" | "cancel";

interface MicIconProps {
  className?: string;
}

interface WaveAnimationProps {
  isActive: boolean;
}

interface CountdownOverlayProps {
  seconds: number;
}

// 录音结果数据
export interface VoiceRecordingResult {
  blob: Blob;
  duration: number;
  url: string;
}

// 组件 Props
interface VoiceChatButtonProps {
  onSend?: (result: VoiceRecordingResult) => void | Promise<void>;
  onCancel?: () => void;
  onSwitch?: () => void;
  embedded?: boolean; // 嵌入模式，不渲染外框
}

// 麦克风图标组件
const MicIcon: React.FC<MicIconProps> = ({ className }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
    <line x1="12" x2="12" y1="19" y2="22" />
  </svg>
);

// 模拟波形动画组件
const WaveAnimation: React.FC<WaveAnimationProps> = ({ isActive }) => {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!isActive) return;
    const interval = setInterval(() => {
      setTick((t) => t + 1);
    }, 80);
    return () => clearInterval(interval);
  }, [isActive]);

  // 生成更多波形条，模拟图片中的效果
  const bars = 25;

  return (
    <div className={styles.waveContainer}>
      {[...Array(bars)].map((_, i) => {
        const phase = tick * 0.25 + i * 0.4;
        // 中间高两边低的波形效果
        const centerOffset = Math.abs(i - bars / 2) / (bars / 2);
        const baseHeight = 12 + (1 - centerOffset) * 10;
        const height =
          baseHeight + Math.sin(phase) * 5 + Math.sin(phase * 1.8) * 3;
        return (
          <div
            key={i}
            className={styles.waveBar}
            style={{ height: `${Math.max(8, height)}px` }}
          />
        );
      })}
    </div>
  );
};

// 全屏居中倒计时组件
const CountdownOverlay: React.FC<CountdownOverlayProps> = ({ seconds }) => {
  // 计算进度百分比 (10秒 -> 0秒)
  // 圆形 64px，边框 6px，所以半径 = (64 - 6) / 2 = 29
  const radius = 29;
  const progress = (seconds / 10) * 100;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress / 100);

  return (
    <div className={styles.countdownOverlay}>
      <div className={styles.countdownContent}>
        <div className={styles.countdownCircle}>
          {/* 背景圆环 */}
          <svg className={styles.countdownSvg} viewBox="0 0 64 64">
            <circle
              className={styles.countdownBg}
              cx="32"
              cy="32"
              r={radius}
              fill="none"
              strokeWidth="6"
            />
            {/* 进度圆环 */}
            <circle
              className={styles.countdownProgress}
              cx="32"
              cy="32"
              r={radius}
              fill="none"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              transform="rotate(-90 32 32)"
            />
          </svg>
          {/* 倒计时数字 */}
          <div className={styles.countdownNumber}>
            <span className={styles.countdownValue}>{seconds}</span>
            <span className={styles.countdownUnit}>s</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// 加载中动画组件
const LoadingSpinner: React.FC = () => (
  <div className={styles.loadingSpinner}>
    <svg viewBox="0 0 24 24" className={styles.spinnerSvg}>
      <circle
        cx="12"
        cy="12"
        r="10"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray="31.4 31.4"
      />
    </svg>
  </div>
);

const VoiceChatButton: React.FC<VoiceChatButtonProps> = ({
  onSend,
  onCancel,
  onSwitch,
  embedded = false,
}) => {
  const { t } = useTranslation();

  const [state, setState] = useState<RecordingState>("idle");
  const [duration, setDuration] = useState<number>(0);
  const [micError, setMicError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false); // 新增：处理中状态

  // Refs
  const startYRef = useRef<number>(0);
  const stateRef = useRef<RecordingState>("idle");
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingDurationRef = useRef<number>(0);
  const sessionIdRef = useRef<number>(0);
  const mimeTypeRef = useRef<string>("audio/webm");
  const isProcessingRef = useRef<boolean>(false); // 新增：处理中状态的 ref

  // 计算倒计时（最后10秒显示）
  const countdown = duration >= 50 && duration < 60 ? 60 - duration : null;

  // 同步 state 到 ref
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // 同步 isProcessing 到 ref
  useEffect(() => {
    isProcessingRef.current = isProcessing;
  }, [isProcessing]);

  // 清理资源
  const cleanupResources = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (mediaRecorderRef.current) {
      const recorder = mediaRecorderRef.current;
      recorder.onstop = null;
      recorder.ondataavailable = null;
      recorder.onerror = null;
      if (recorder.state !== "inactive") {
        try {
          recorder.stop();
        } catch (e) {}
      }
      mediaRecorderRef.current = null;
    }

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
  }, []);

  // 重置到初始状态
  const resetToIdle = useCallback(() => {
    sessionIdRef.current += 1;
    cleanupResources();
    audioChunksRef.current = [];
    recordingDurationRef.current = 0;
    setState("idle");
    setDuration(0);
  }, [cleanupResources]);

  // 更新取消状态
  const updateCancelState = useCallback((clientY: number) => {
    if (stateRef.current === "idle") return;

    const deltaY = startYRef.current - clientY;
    const shouldCancel = deltaY > 80;
    const newState: RecordingState = shouldCancel ? "cancel" : "recording";

    if (stateRef.current !== newState) {
      setState(newState);
    }
  }, []);

  // 发送语音
  const handleSendVoice = useCallback(
    (currentSessionId: number) => {
      if (sessionIdRef.current !== currentSessionId) return;

      const currentDuration = recordingDurationRef.current;
      const currentChunks = [...audioChunksRef.current];
      const currentMimeType = mimeTypeRef.current;

      if (currentDuration < 1) {
        resetToIdle();
        return;
      }

      // 定义处理发送的异步函数
      const processSend = async (audioBlob: Blob, audioDuration: number) => {
        const audioUrl = URL.createObjectURL(audioBlob);
        setIsProcessing(true);
        try {
          await onSend?.({
            blob: audioBlob,
            duration: audioDuration,
            url: audioUrl,
          });
        } finally {
          setIsProcessing(false);
        }
      };

      if (
        mediaRecorderRef.current &&
        mediaRecorderRef.current.state !== "inactive"
      ) {
        const recorder = mediaRecorderRef.current;

        recorder.onstop = () => {
          if (sessionIdRef.current !== currentSessionId) return;

          const allChunks = [...currentChunks, ...audioChunksRef.current];

          if (allChunks.length > 0 && currentDuration >= 1) {
            const audioBlob = new Blob(allChunks, { type: currentMimeType });
            processSend(audioBlob, currentDuration);
          } else {
            setIsProcessing(false);
          }
          resetToIdle();
        };

        try {
          recorder.stop();
        } catch (e) {
          resetToIdle();
          setIsProcessing(false);
        }
      } else {
        if (currentChunks.length > 0 && currentDuration >= 1) {
          const audioBlob = new Blob(currentChunks, { type: currentMimeType });
          processSend(audioBlob, currentDuration);
        }
        resetToIdle();
      }
    },
    [resetToIdle, onSend],
  );

  // 取消语音
  const handleCancelVoice = useCallback(() => {
    resetToIdle();
    onCancel?.();
  }, [resetToIdle, onCancel]);

  // 处理结束
  const handleEnd = useCallback(() => {
    const currentState = stateRef.current;
    const currentSessionId = sessionIdRef.current;

    if (currentState === "idle") return;

    if (currentState === "cancel") {
      handleCancelVoice();
    } else {
      handleSendVoice(currentSessionId);
    }
  }, [handleCancelVoice, handleSendVoice]);

  // 开始录音
  const startRecording = useCallback(async () => {
    // 新增：如果正在处理中，不允许开始新的录音
    if (stateRef.current !== "idle" || isProcessingRef.current) return;

    const currentSessionId = ++sessionIdRef.current;

    setState("recording");
    setMicError(null);
    audioChunksRef.current = [];
    recordingDurationRef.current = 0;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true },
      });

      if (
        sessionIdRef.current !== currentSessionId ||
        stateRef.current === "idle"
      ) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }

      mediaStreamRef.current = stream;

      const mimeType = MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : MediaRecorder.isTypeSupported("audio/mp4")
        ? "audio/mp4"
        : "audio/ogg";

      mimeTypeRef.current = mimeType;

      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event: BlobEvent) => {
        if (sessionIdRef.current !== currentSessionId) return;
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.start(100);

      let seconds = 0;
      timerRef.current = setInterval(() => {
        if (sessionIdRef.current !== currentSessionId) {
          if (timerRef.current) clearInterval(timerRef.current);
          return;
        }
        seconds++;
        recordingDurationRef.current = seconds;
        setDuration(seconds);
        if (seconds >= 60) handleEnd();
      }, 1000);
    } catch (error: any) {
      if (sessionIdRef.current === currentSessionId) {
        let errorMessage = "无法访问麦克风";
        if (error.name === "NotAllowedError") {
          errorMessage = "麦克风权限被拒绝";
        } else if (error.name === "NotFoundError") {
          errorMessage = "未检测到麦克风";
        }
        setMicError(errorMessage);
        setTimeout(() => setMicError(null), 3000);
        resetToIdle();
      }
    }
  }, [resetToIdle, handleEnd]);

  // 事件处理
  const handleStart = useCallback(
    (clientY: number) => {
      // 新增：如果正在处理中，不允许开始新的录音
      if (stateRef.current !== "idle" || isProcessingRef.current) return;
      startYRef.current = clientY;
      startRecording();
    },
    [startRecording],
  );

  const handleMove = useCallback(
    (clientY: number) => {
      updateCancelState(clientY);
    },
    [updateCancelState],
  );

  // 全局事件监听
  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (stateRef.current !== "idle") {
        handleMove(e.clientY);
      }
    };

    const onMouseUp = (e: MouseEvent) => {
      if (stateRef.current !== "idle") {
        e.preventDefault();
        handleEnd();
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (stateRef.current !== "idle" && e.touches.length > 0) {
        handleMove(e.touches[0].clientY);
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (stateRef.current !== "idle") {
        e.preventDefault();
        handleEnd();
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      if (stateRef.current !== "idle") {
        handleMove(e.clientY);
      }
    };

    const onPointerUp = (e: PointerEvent) => {
      if (stateRef.current !== "idle") {
        e.preventDefault();
        handleEnd();
      }
    };

    const onVisibilityChange = () => {
      if (document.hidden && stateRef.current !== "idle") {
        handleCancelVoice();
      }
    };

    const onBlur = () => {
      if (stateRef.current !== "idle") {
        handleEnd();
      }
    };

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("touchmove", onTouchMove, { passive: true });
    document.addEventListener("pointermove", onPointerMove);

    const captureOptions = { capture: true };
    document.addEventListener("mouseup", onMouseUp, captureOptions);
    document.addEventListener("touchend", onTouchEnd, captureOptions);
    document.addEventListener("pointerup", onPointerUp, captureOptions);
    document.addEventListener("pointercancel", onPointerUp, captureOptions);
    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("blur", onBlur);
    window.addEventListener("mouseup", onMouseUp, captureOptions);
    window.addEventListener("touchend", onTouchEnd, captureOptions);
    window.addEventListener("pointerup", onPointerUp, captureOptions);

    return () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("touchmove", onTouchMove);
      document.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("mouseup", onMouseUp, captureOptions);
      document.removeEventListener("touchend", onTouchEnd, captureOptions);
      document.removeEventListener("pointerup", onPointerUp, captureOptions);
      document.removeEventListener(
        "pointercancel",
        onPointerUp,
        captureOptions,
      );
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("blur", onBlur);
      window.removeEventListener("mouseup", onMouseUp, captureOptions);
      window.removeEventListener("touchend", onTouchEnd, captureOptions);
      window.removeEventListener("pointerup", onPointerUp, captureOptions);
    };
  }, [handleMove, handleEnd, handleCancelVoice]);

  // React 事件
  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      // 新增：如果正在处理中，不响应触摸事件
      if (isProcessingRef.current) return;
      e.preventDefault();
      e.stopPropagation();
      if (e.touches.length > 0) {
        handleStart(e.touches[0].clientY);
      }
    },
    [handleStart],
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.touches.length > 0) {
        handleMove(e.touches[0].clientY);
      }
    },
    [handleMove],
  );

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      e.preventDefault();
      e.stopPropagation();
      handleEnd();
    },
    [handleEnd],
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      // 新增：如果正在处理中，不响应鼠标事件
      if (isProcessingRef.current) return;
      e.preventDefault();
      e.stopPropagation();
      handleStart(e.clientY);
    },
    [handleStart],
  );

  // 组件卸载清理
  useEffect(() => {
    return () => {
      sessionIdRef.current += 1;
      cleanupResources();
    };
  }, [cleanupResources]);

  // 工具函数
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // 样式类名
  const getButtonClassName = (): string => {
    const classNames = [styles.voiceButton];
    if (isProcessing) classNames.push(styles.processing);
    else if (state === "idle") classNames.push(styles.idle);
    else if (state === "recording") classNames.push(styles.recording);
    else if (state === "cancel") classNames.push(styles.cancel);
    return classNames.join(" ");
  };

  const getStateTooltipClassName = (): string => {
    const classNames = [styles.stateTooltip];
    classNames.push(state !== "idle" ? styles.visible : styles.hidden);
    return classNames.join(" ");
  };

  const getStateContentClassName = (): string => {
    const classNames = [styles.stateContent];
    classNames.push(state === "cancel" ? styles.cancel : styles.recording);
    return classNames.join(" ");
  };

  const getStateArrowClassName = (): string => {
    const classNames = [styles.stateArrow];
    classNames.push(state === "cancel" ? styles.cancel : styles.recording);
    return classNames.join(" ");
  };

  const isRecordingActive = state === "recording" || state === "cancel";

  // 错误提示组件
  const ErrorTooltip = () =>
    micError ? (
      <div className={styles.errorTooltip}>
        <div className={styles.errorContent}>
          <div className={styles.errorHeader}>
            <svg
              className={styles.errorIcon}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <span className={styles.errorTitle}>无法录音</span>
          </div>
          <div className={styles.errorMessage}>{micError}</div>
        </div>
        <div className={styles.errorArrow} />
      </div>
    ) : null;

  // 状态提示组件
  const StateTooltip = () => (
    <div className={getStateTooltipClassName()}>
      <div className={getStateContentClassName()}>
        <div className={styles.stateText}>
          {state === "cancel"
            ? t("Chat.Voice.ReleaseToCancel")
            : t("Chat.Voice.ReleaseToSendSlideUpToCancel")}
        </div>
      </div>
    </div>
  );

  // ==================== 嵌入模式渲染 ====================
  if (embedded) {
    return (
      <div className={styles.embeddedContainer}>
        {/* 倒计时遮罩 */}
        {countdown !== null && state !== "idle" && (
          <CountdownOverlay seconds={countdown} />
        )}

        {/* 错误提示 */}
        <ErrorTooltip />

        {/* 状态提示 */}
        <StateTooltip />

        {/* 主内容区域 */}
        <div
          className={clsx(styles.embeddedButton, {
            [styles.embeddedIdle]: state === "idle" && !isProcessing,
            [styles.embeddedRecording]: state === "recording",
            [styles.embeddedCancel]: state === "cancel",
            [styles.embeddedProcessing]: isProcessing,
          })}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onMouseDown={handleMouseDown}
          style={{ touchAction: "none" }}
        >
          <div className={styles.embeddedButtonContent}>
            {isProcessing ? (
              <>
                <LoadingSpinner />
                <span className={styles.embeddedButtonText}>
                  {t("Chat.Voice.Processing")}...
                </span>
              </>
            ) : state === "idle" ? (
              <span className={styles.embeddedButtonText}>
                {t("Chat.Voice.HoldToTalk")}
              </span>
            ) : (
              <WaveAnimation isActive={isRecordingActive} />
            )}
          </div>
        </div>

        {/* 键盘切换按钮 */}
        {state === "idle" && !isProcessing && (
          <div
            className={clsx(styles.embeddedLogButton, "no-dark")}
            onClick={(e) => {
              e.stopPropagation();
              onSwitch?.();
            }}
          >
            <KeyBoardIcon />
          </div>
        )}
      </div>
    );
  }

  // ==================== 原有完整模式渲染 ====================
  return (
    <div className={styles.container}>
      {/* 全屏倒计时遮罩 - 最后10秒显示 */}
      {countdown !== null && state !== "idle" && (
        <CountdownOverlay seconds={countdown} />
      )}

      <div className={styles.card}>
        <div className={styles.buttonContainer}>
          {/* 错误提示 */}
          <ErrorTooltip />

          {/* 状态提示 */}
          <StateTooltip />

          {/* 按钮容器 */}
          <div className={styles.buttonRow}>
            {/* 语音按钮 */}
            <div
              className={getButtonClassName()}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              onMouseDown={handleMouseDown}
              style={{
                touchAction: "none",
                height: "100%",
                borderRadius: "32px",
              }}
            >
              <div className={styles.buttonContent}>
                {isProcessing ? (
                  <>
                    <LoadingSpinner />
                    <span className={styles.buttonTextSmall}>
                      {t("Chat.Voice.Processing")}...
                    </span>
                  </>
                ) : state === "idle" ? (
                  <>
                    <span className={styles.buttonText}>
                      {t("Chat.Voice.HoldToTalk")}
                    </span>
                  </>
                ) : (
                  <>
                    <WaveAnimation isActive={isRecordingActive} />
                    <span className={styles.buttonTextSmall}>
                      {state === "cancel"
                        ? t("Chat.Voice.ReleaseToCancel")
                        : t("Chat.Voice.Processing")}
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* 右侧Log按钮 - 只在idle状态且非处理中显示 */}
            {state === "idle" && !isProcessing && (
              <div
                className={clsx(styles.logButton, "no-dark")}
                onClick={(e) => {
                  e.stopPropagation();
                  onSwitch?.();
                }}
              >
                <KeyBoardIcon />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VoiceChatButton;
