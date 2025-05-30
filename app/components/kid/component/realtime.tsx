// import { Path } from "@/app/constant";
import { useKidStore } from "@/app/store/kid";
import { useNavigate } from "react-router-dom";

import RealTimeBgPng from "../../../icons/realtime-bg.png";
import AvatarBgIcon from "../../../icons/avatar-bg.svg";
import NoAvatar from "../../../icons/gril.png";
import RealtimeSpeakIcon from "../../../icons/realtime-speak.svg";
import RealtimeStopIcon from "../../../icons/realtime-stop.svg";
import RealtimeCloseIcon from "../../../icons/realtime-close.svg";
import P1 from "../../../icons/1.svg";
import P2 from "../../../icons/2.svg";
import P3 from "../../../icons/3.svg";
import P4 from "../../../icons/4.svg";
import Wave from "../../../icons/wave.png";
import styles from "./realtime.module.scss";
import clsx from "clsx";
import { useOmeStore } from "@/app/store/ome";

export function Realtime() {
  const kidStore = useKidStore();

  const omeStore = useOmeStore();

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
      {kidStore.currentKid?.name && (
        <div
          style={{
            position: "absolute",
            top: "13px",
            zIndex: 2,
            fontSize: "18px",
            color: "#3A3A47",
            fontWeight: 600,
          }}
        >
          {kidStore.currentKid?.name}
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

      <div className={styles.container}>
        <div className={`${styles.dots} ${true ? styles.active : ""}`}>
          <div className={`${styles.dot} ${styles.dot1}`}></div>
          <div className={`${styles.dot} ${styles.dot2}`}></div>
          <div className={`${styles.dot} ${styles.dot3}`}></div>
        </div>
        <div className={styles.text}>你可以開始說話</div>
      </div>

      <div
        style={{
          display: "flex",
          borderRadius: "50px",
          background: "rgba(255,255,255,.5)",
          position: "absolute",
          bottom: "10%",
          zIndex: 2,
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

      {omeStore.isFromApp ? (
        <div className={styles.waveContainer}>
          <img src={Wave.src} alt="Wave 1" className={styles.waveImage} />
          <img src={Wave.src} alt="Wave 2" className={styles.waveImage} />
        </div>
      ) : (
        <div className={clsx("no-dark", styles.svgContainer)}>
          <div
            className={clsx("no-dark", styles.waveItem)}
            style={{
              zIndex: 1,
              // backgroundColor: "red",
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
              // backgroundColor: "green",
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
              // backgroundColor: "skyblue",
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
              // backgroundColor: "pink",
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
