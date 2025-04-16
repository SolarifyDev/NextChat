import { useEffect, useRef, useState } from "react";
import { showToast } from "./ui-lib";

export function Index() {
  const [volumeValue, setVolumeValue] = useState(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function startAudio() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        streamRef.current = stream;

        const devices = await navigator.mediaDevices.enumerateDevices();

        // 3. 過濾出麥克風設備（kind === 'audioinput'）
        const microphones = devices.filter(
          (device) => device.kind === "audioinput",
        );

        // console.log("可用的麥克風:", microphones);
        showToast(microphones.length.toString());

        const audioContext = new AudioContext();
        audioContextRef.current = audioContext;

        const analyser = audioContext.createAnalyser();
        analyserRef.current = analyser;
        analyser.fftSize = 256;

        const source = audioContext.createMediaStreamSource(stream);
        source.connect(analyser);

        const meterElement = document.getElementById("volume-meter");
        const dataArray = new Uint8Array(analyser.frequencyBinCount);

        function updateMeter() {
          if (!analyserRef.current || !meterElement) return;

          analyserRef.current.getByteTimeDomainData(dataArray);

          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) {
            const amplitude = Math.abs(dataArray[i] - 128);
            sum += amplitude;
          }
          const volume = Math.min(100, (sum / dataArray.length) * 2);

          meterElement.style.width = `${volume}%`;
          setVolumeValue(Math.round(volume));

          requestAnimationFrame(updateMeter);
        }

        updateMeter();
      } catch (err) {
        if (err instanceof Error) {
          setError(
            "[handled error from website] " + err.name + ": " + err.message,
          );
        } else {
          setError("[handled error from website] Unknown error");
        }
        console.error(
          "[handled error from website] Error accessing microphone:",
          err,
        );
      }
    }

    startAudio();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  return (
    <div style={styles.appContainer}>
      <h1 style={styles.title}>Microphone Volume</h1>
      {error && <p style={styles.error}>{error}</p>}
      <div style={styles.meterWrapper}>
        <div style={styles.meterContainer}>
          <div id="volume-meter" style={styles.meterFill} />
        </div>
        <div style={styles.volumeValue}>{volumeValue}%</div>
      </div>
    </div>
  );
}

const styles = {
  appContainer: {
    padding: "20px",
    fontFamily: "Arial, sans-serif",
  },

  title: {
    fontSize: "24px",
    marginBottom: "20px",
  },

  meterWrapper: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },

  meterContainer: {
    width: "300px",
    height: "20px",
    backgroundColor: "#f5f5f5",
    borderRadius: "10px",
    overflow: "hidden",
  },

  meterFill: {
    height: "100%",
    width: "0%",
    backgroundColor: "#4CAF50",
    transition: "width 0.05s linear",
  },

  volumeValue: {
    fontSize: "20px",
    minWidth: "40px",
    fontWeight: "bold",
  },

  error: {
    color: "red",
    marginTop: "10px",
  },
} as const;
