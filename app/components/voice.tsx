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
