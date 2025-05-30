// import { Path } from "@/app/constant";
import { useKidStore } from "@/app/store/kid";
import { useNavigate } from "react-router-dom";

import RealTimeBgPng from "../../../icons/realtime-bg.png";
import AvatarBgIcon from "../../../icons/avatar-bg.svg";
import NoAvatar from "../../../icons/gril.png";
import RealtimeSpeakIcon from "../../../icons/realtime-speak.svg";
import RealtimeStopIcon from "../../../icons/realtime-stop.svg";
import RealtimeCloseIcon from "../../../icons/realtime-close.svg";
import { useLiveAPIContext } from "@/app/contexts/LiveAPIContext";
import { useEffect, useState } from "react";
import { CallStatus } from "@/app/hook/use-live-api";
import { AudioRecorder } from "@/app/lib/audio-recorder";
import { Path } from "@/app/constant";

export function Realtime() {
  const kidStore = useKidStore();

  const navigate = useNavigate();

  const { client, connected, connect, disconnect, connectStatus } =
    useLiveAPIContext();

  const [audioRecorder] = useState(() => new AudioRecorder());

  const [muted, setMuted] = useState(false);

  useEffect(() => {
    if (kidStore.currentKid?.assistantId) {
      connect(kidStore.currentKid.assistantId);
    }
  }, []);

  useEffect(() => {
    const onData = (base64: string) => {
      client.sendRealtimeInput([
        {
          mimeType: "audio/pcm",
          data: base64,
        },
      ]);
    };
    if (connectStatus && !muted && audioRecorder) {
      audioRecorder.on("data", onData).start();
    } else {
      audioRecorder.stop();
    }

    return () => {
      audioRecorder.off("data", onData);
    };
  }, [connectStatus, muted, audioRecorder]);

  const sessionStatusText = () => {
    switch (connected) {
      case CallStatus.Disconnected:
        return <div>正在連接中......</div>;

      case CallStatus.Connected:
        return <div>你可以開始說話</div>;

      case CallStatus.AISpeaking:
        return <div>說話或點擊打斷</div>;

      case CallStatus.UserSpeaking:
        return <div>正在聽...</div>;
    }
  };

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
        backgroundColor: "skyblue",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
      className={"no-dark"}
    >
      {kidStore.currentKid?.name && (
        <div
          style={{
            position: "absolute",
            top: "13px",
            zIndex: 1,
            fontSize: "18px",
            color: "#3A3A47",
            fontWeight: 600,
          }}
        >
          {kidStore.currentKid?.name}
        </div>
      )}

      {sessionStatusText()}

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
        <img
          src={NoAvatar.src}
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
      </div>
      <div
        style={{
          display: "flex",
          borderRadius: "50px",
          background: "rgba(255,255,255,.5)",
          position: "absolute",
          bottom: "10%",
          zIndex: 1,
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
            await disconnect();
            navigate(Path.AIKid);
          }}
        >
          <RealtimeCloseIcon />
        </div>

        {/* <svg
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
            x="24"
            y="4"
            fill="rgba(255,255,255,0.1)"
          />
          <use
            xlinkHref="#gentle-wave"
            x="24"
            y="4"
            fill="rgba(255,255,255,0.19)"
          />
          <use
            xlinkHref="#gentle-wave"
            x="24"
            y="4"
            fill="rgba(255,255,255,0.15)"
          />

          <use
            xlinkHref="#gentle-wave"
            x="12"
            y="16"
            fill="rgba(255,255,255,0.1)"
          />
        </g>
      </svg> */}
      </div>
    </div>
  );
}
