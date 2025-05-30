// import { Path } from "@/app/constant";
import { useKidStore } from "@/app/store/kid";
import { useNavigate } from "react-router-dom";

import RealTimeBgPng from "../../../icons/realtime-bg.png";
import AvatarBgIcon from "../../../icons/avatar-bg.svg";
import NoAvatar from "../../../icons/gril.png";
import RealtimeSpeakIcon from "../../../icons/realtime-speak.svg";
import RealtimeStopIcon from "../../../icons/realtime-stop.svg";
import RealtimeCloseIcon from "../../../icons/realtime-close.svg";

import styles from "./realtime.module.scss";

export function Realtime() {
  const kidStore = useKidStore();

  const navigate = useNavigate();

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
      }}
      className={"no-dark"}
    >
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
        >
          {true ? <RealtimeSpeakIcon /> : <RealtimeStopIcon />}
        </div>
        <div
          className={"no-dark"}
          style={{
            margin: "0 24px",
            cursor: "pointer",
          }}
        >
          <RealtimeCloseIcon />
        </div>
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
            fill="rgba(255,255,255,0.1)"
          />
          <use
            xlinkHref="#gentle-wave"
            x="0"
            y="8"
            fill="rgba(255,255,255,0.09)"
          />
          <use
            xlinkHref="#gentle-wave"
            x="24"
            y="4"
            fill="rgba(255,255,255,0.1)"
          />
          <use
            xlinkHref="#gentle-wave"
            x="72"
            y="12"
            fill="rgba(255,255,255,0.09)"
          />
          <use
            xlinkHref="#gentle-wave"
            x="12"
            y="16"
            fill="rgba(255,255,255,0.09)"
          />
        </g>
      </svg>
    </div>
  );
}
