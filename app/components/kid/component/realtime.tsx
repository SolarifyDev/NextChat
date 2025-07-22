import { useKidStore } from "@/app/store/kid";
import { useNavigate } from "react-router-dom";

import RealTimeBgPng from "../../../icons/realtime-bg.png";
import AvatarBgIcon from "../../../icons/avatar-bg.svg";
import RealtimeSpeakIcon from "../../../icons/realtime-speak.svg";
import RealtimeStopIcon from "../../../icons/realtime-stop.svg";
import RealtimeCloseIcon from "../../../icons/realtime-close.svg";
import OpenCameraIcon from "../../../icons/open-camera.svg";
import StopCameraIcon from "../../../icons/stop-camera.svg";
import SwitchIcon from "../../../icons/switch.svg";
import { useLiveAPIContext } from "@/app/contexts/LiveAPIContext";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CallStatus } from "@/app/hook/use-live-api";
import { AudioRecorder } from "@/app/lib/audio-recorder";
import { Path } from "@/app/constant";
import P1 from "../../../icons/1.svg";
import P2 from "../../../icons/2.svg";
import P3 from "../../../icons/3.svg";
import P4 from "../../../icons/4.svg";
import Wave from "../../../icons/wave.png";
import styles from "./realtime.module.scss";
import clsx from "clsx";
import { useOmeStore } from "@/app/store/ome";
import { useTranslation } from "react-i18next";
import { showToast } from "../../ui-lib";
import { isNil } from "lodash";
import { useWebcam } from "@/app/hook/use-webcam";
import { UseMediaStreamResult } from "@/app/hook/use-media-stream-mux";

type MediaStreamButtonProps = {
  isStreaming: boolean;
  start: () => Promise<any>;
  stop: () => any;
};

const MediaStreamButton = ({
  isStreaming,
  start,
  stop,
}: MediaStreamButtonProps) =>
  isStreaming ? (
    <div
      onClick={stop}
      style={{
        margin: "0 24px",
        cursor: "pointer",
      }}
    >
      <OpenCameraIcon />
    </div>
  ) : (
    <div
      onClick={start}
      style={{
        margin: "0 24px",
        cursor: "pointer",
      }}
    >
      <StopCameraIcon />
    </div>
  );

export function Realtime() {
  const { t } = useTranslation();

  const kidStore = useKidStore();

  const omeStore = useOmeStore();

  const navigate = useNavigate();

  const [audioRecorder] = useState(() => new AudioRecorder());

  const videoRef = useRef<HTMLVideoElement>(null);

  const renderCanvasRef = useRef<HTMLCanvasElement>(null);

  const [videoStream, setVideoStream] = useState<MediaStream | null>(null);

  const [muted, setMuted] = useState<boolean>(false);

  const [audioIsReady, setAudioIsReady] = useState<boolean | null>(null);

  const videoStreams = [useWebcam(omeStore.isFromApp as boolean)];

  const [webcam] = videoStreams;

  const [activeVideoStream, setActiveVideoStream] =
    useState<MediaStream | null>(null);

  const videoStreamRef = useRef<MediaStream | null>(null);
  const activeVideoStreamRef = useRef<MediaStream | null>(null);

  // 添加切换状态管理
  const [isSwitchingCamera, setIsSwitchingCamera] = useState(false);

  const [isVideoReady, setIsVideoReady] = useState(false);

  const {
    client,
    connected,
    connect,
    disconnect,
    connectStatus,
    connectStatusRef,
    stopAudioStreamer,
  } = useLiveAPIContext();

  useEffect(() => {
    if (kidStore.currentKid?.assistantId) {
      // connect(kidStore.currentKid.assistantId);
    }

    return () => {
      disconnect();

      audioRecorder.stop();
      webcam?.stop();

      changeStreams()();

      cleanupVideoStream(videoStreamRef.current);
      cleanupVideoStream(activeVideoStreamRef.current);
    };
  }, []);

  const cleanupVideoStream = useCallback((stream: MediaStream | null) => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      console.log("清理视频流");
    }
  }, []);

  // useUpdateEffect(() => {
  //   const currentStream = videoStream;

  //   return () => {
  //     currentStream && cleanupVideoStream(currentStream);
  //   };
  // }, [videoStream, cleanupVideoStream]);

  // useUpdateEffect(() => {
  //   const currentStream = activeVideoStream;

  //   return () => {
  //     currentStream && cleanupVideoStream(currentStream);
  //   };
  // }, [activeVideoStream, cleanupVideoStream]);

  useEffect(() => {
    videoStreamRef.current = videoStream;
  }, [videoStream]);

  useEffect(() => {
    activeVideoStreamRef.current = activeVideoStream;
  }, [activeVideoStream]);

  useEffect(() => {
    if (connected === CallStatus.ConnectError) {
      showToast(t("Realtime.ConnectionFailed"));

      navigate(Path.AIKid);
    }
  }, [connected]);

  useEffect(() => {
    const onData = (base64: string) => {
      client.sendRealtimeInput([
        {
          mimeType: "audio/pcm",
          data: base64,
        },
      ]);
    };

    if (!audioRecorder) return;

    let active = true;

    const startRecording = async () => {
      if (connectStatus && !muted) {
        audioRecorder.on("data", onData);

        const success = await audioRecorder.start();

        if (active) {
          setAudioIsReady(success);
        }
      } else {
        audioRecorder.stop();
      }
    };

    startRecording();

    const handleVisibilityChange = async () => {
      const isIOS =
        /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

      if (
        document.visibilityState === "visible" &&
        connectStatusRef.current &&
        isIOS
      ) {
        // 重新启动麦克风采集
        await audioRecorder.stop();
        startRecording();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      active = false;
      audioRecorder.off("data", onData);
    };
  }, [connectStatus, muted, audioRecorder]);

  useEffect(() => {
    if (videoRef.current && videoRef.current.srcObject !== activeVideoStream) {
      videoRef.current.srcObject = activeVideoStream;
    }
  }, [activeVideoStream]);

  useEffect(() => {
    let timeoutId = -1;

    function sendVideoFrame() {
      const video = videoRef.current;
      const canvas = renderCanvasRef.current;

      if (!video || !canvas) {
        return;
      }

      const ctx = canvas.getContext("2d")!;
      canvas.width = video.videoWidth * 0.25;
      canvas.height = video.videoHeight * 0.25;
      if (canvas.width + canvas.height > 0) {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const base64 = canvas.toDataURL("image/jpeg", 1.0);
        const data = base64.slice(base64.indexOf(",") + 1, Infinity);
        console.log("sending video frame", data);
        client.sendRealtimeInput([{ mimeType: "image/jpeg", data }]);
      }
      if (connected) {
        timeoutId = window.setTimeout(sendVideoFrame, 1000 / 0.5);
      }
    }

    if (connected && activeVideoStream !== null) {
      requestAnimationFrame(sendVideoFrame);
    }
    return () => {
      clearTimeout(timeoutId);
    };
  }, [connected, activeVideoStream, client]);

  const sessionStatusText = useMemo(() => {
    if (!isNil(audioIsReady) && !audioIsReady) {
      return <div>{t("Realtime.PermissionPrompt")}</div>;
    }

    switch (connected) {
      case CallStatus.Disconnected:
        return <div>{t("Realtime.Connecting")}</div>;

      case CallStatus.Connected:
        return <div>{t("Realtime.StartSpeaking")}</div>;

      case CallStatus.AISpeaking:
        return (
          <div onClick={() => stopAudioStreamer()}>
            {t("Realtime.Interrupt")}
          </div>
        );

      case CallStatus.UserSpeaking:
        return <div>{t("Realtime.Listening")}</div>;
    }
  }, [connected, audioIsReady]);

  const changeStreams = (next?: UseMediaStreamResult) => async () => {
    if (next) {
      setIsSwitchingCamera(true);

      const mediaStream = await next?.start();
      if (mediaStream) {
        setActiveVideoStream(mediaStream);
        setVideoStream(mediaStream);
      }
    } else {
      setActiveVideoStream(null);
      setVideoStream(null);
    }

    videoStreams.filter((msr) => msr !== next).forEach((msr) => msr.stop());
  };

  const switchStreams = (next: UseMediaStreamResult) => async () => {
    setIsSwitchingCamera(true);

    const mediaStream = await next?.switchCamera();
    if (mediaStream) {
      setActiveVideoStream(mediaStream);
      setVideoStream(mediaStream);
      videoStreams.filter((msr) => msr !== next).forEach((msr) => msr.stop());
    }
  };

  const shouldShowOverlay = activeVideoStream && isSwitchingCamera;

  // 监听视频开始播放事件
  const handleVideoPlay = useCallback(() => {
    setIsSwitchingCamera(false);
  }, []);

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        boxSizing: "border-box",
        position: "relative",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        backgroundImage: `url(${RealTimeBgPng.src})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        gap: "15px",
      }}
      className={"no-dark"}
    >
      <canvas style={{ display: "none" }} ref={renderCanvasRef} />

      {kidStore.currentKid?.name && (
        <div
          style={{
            position: "absolute",
            top: "13px",
            zIndex: 10,
            fontSize: "18px",
            color: "#3A3A47",
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            width: "100%",
            justifyContent: "center",
          }}
        >
          {kidStore.currentKid?.name}
          {/* {webcam?.isStreaming && omeStore.isFromApp && (
            <div
              onClick={switchStreams(webcam)}
              className="no-dark"
              style={{
                position: "absolute",
                right: "16px",
                cursor: "pointer",
                zIndex: 11,
              }}
            >
              <SwitchIcon />
            </div>
          )} */}
          <div
            onClick={switchStreams(webcam)}
            className="no-dark"
            style={{
              position: "absolute",
              right: "16px",
              cursor: "pointer",
              zIndex: 11,
            }}
          >
            <SwitchIcon />
          </div>
        </div>
      )}

      <div
        style={{
          width: "275px",
          height: "275px",
          borderRadius: "50%",
          flexShrink: 0,
          position: "relative",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          zIndex: 2,
          opacity: shouldShowOverlay ? 0 : 1,
        }}
        className={"no-dark"}
      >
        <AvatarBgIcon
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            objectFit: "cover",
            pointerEvents: "none",
          }}
        />
        {typeof kidStore.currentKid?.avatarUrl === "string" && (
          <img
            src={kidStore.currentKid?.avatarUrl as string}
            alt="Logo"
            style={{
              width: 250,
              height: 250,
              objectFit: "cover",
              userSelect: "none",
              pointerEvents: "none",
              borderRadius: "50%",
              zIndex: 1,
              position: "relative",
            }}
          />
        )}
      </div>

      <video
        ref={videoRef}
        autoPlay
        playsInline
        webkit-playsinline="true"
        controls={false}
        muted={true}
        disablePictureInPicture={true} // 禁用画中画
        disableRemotePlayback={true}
        preload="auto"
        // onLoadedData={handleVideoReady}
        onPlaying={handleVideoPlay}
        // onCanPlay={handleVideoReady}
        x-webkit-airplay="deny"
        style={{
          position: "absolute",
          visibility: !videoRef.current || !videoStream ? "hidden" : "visible",
          objectFit: "cover",
          width: "100%",
          height: "100%",
          zIndex: 9,
          opacity: shouldShowOverlay ? 0 : 1,
        }}
      />

      <div
        style={{
          width: "100%",
          height: "100%",
          position: "absolute",
          zIndex: 8,
          display: "flex",
          background: "black",
          alignItems: "center",
          justifyContent: "center",
          opacity: shouldShowOverlay ? 1 : 0,
          pointerEvents: shouldShowOverlay ? "auto" : "none",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "16px" /* space-y-4 ≈ 16px */,
          }}
        >
          {/* 旋转加载动画 */}
          <div
            style={{
              width: "48px",
              height: "48px",
              border: "4px solid white",
              borderTop: "4px solid transparent",
              borderRadius: "50%",
              animation: "spin 1s linear infinite",
            }}
          ></div>

          {/* 文字提示 */}
          <div
            style={{
              color: "white",
              fontSize: "18px",
              fontWeight: 500,
              lineHeight: "28px",
            }}
          >
            {isSwitchingCamera ? "切换摄像头中..." : "准备中..."}
          </div>
        </div>
      </div>

      <div
        className={styles.container}
        style={{
          zIndex: 10,
        }}
      >
        <div className={`${styles.dots} ${true ? styles.active : ""}`}>
          <div className={`${styles.dot} ${styles.dot1}`}></div>
          <div className={`${styles.dot} ${styles.dot2}`}></div>
          <div className={`${styles.dot} ${styles.dot3}`}></div>
        </div>
        <div className={styles.text}>{sessionStatusText}</div>
      </div>

      <div
        style={{
          display: "flex",
          borderRadius: "50px",
          background: "rgba(255,255,255,.5)",
          position: "absolute",
          bottom: "10%",
          zIndex: 10,
        }}
      >
        <div
          className={"no-dark"}
          style={{
            margin: "0 24px",
            cursor: "pointer",
          }}
          onClick={() => {
            setMuted(!muted);
          }}
        >
          {!muted ? <RealtimeSpeakIcon /> : <RealtimeStopIcon />}
        </div>
        <div
          className={"no-dark"}
          style={{
            margin: "0 24px",
            cursor: "pointer",
          }}
          onClick={async () => {
            await changeStreams()();
            await disconnect();
            navigate(Path.AIKid);
          }}
        >
          <RealtimeCloseIcon />
        </div>

        <MediaStreamButton
          isStreaming={webcam?.isStreaming}
          start={changeStreams(webcam)}
          stop={changeStreams()}
        />
      </div>

      {omeStore.isFromApp ? (
        <div className={clsx("no-dark", styles.waveWrapper)}>
          <div className={styles.waveContainer}>
            <img
              src={Wave.src}
              alt="Wave 1"
              className={clsx("no-dark", styles.waveImage)}
            />
            <img
              src={Wave.src}
              alt="Wave 2"
              className={clsx("no-dark", styles.waveImage)}
            />
          </div>
        </div>
      ) : (
        <div className={clsx("no-dark", styles.svgContainer)}>
          <div
            className={clsx("no-dark", styles.waveItem)}
            style={{
              zIndex: 1,
            }}
          >
            <P1 className={styles["wave-animation"]} />
            <P1
              className={clsx(styles["wave-animation"], styles.flippedWave)}
            />
          </div>

          <div
            className={clsx("no-dark", styles.waveItem)}
            style={{
              zIndex: 1,
            }}
          >
            <P2 className={styles["wave-animation"]} />
            <P2
              className={clsx(styles["wave-animation"], styles.flippedWave)}
            />
          </div>

          <div
            className={clsx("no-dark", styles.waveItem)}
            style={{
              zIndex: 1,
            }}
          >
            <P3 className={styles["wave-animation"]} />
            <P3
              className={clsx(styles["wave-animation"], styles.flippedWave)}
            />
          </div>

          <div
            className={clsx("no-dark", styles.waveItem)}
            style={{
              zIndex: 1,
            }}
          >
            <P4 className={styles["wave-animation"]} />
            <P4
              className={clsx(styles["wave-animation"], styles.flippedWave)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
