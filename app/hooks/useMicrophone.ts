// hooks/useMicrophone.ts
import { useEffect, useState } from "react";
import { showToast } from "../components/ui-lib";

export const useMicrophone = () => {
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [audioTracks, setAudioTracks] = useState<MediaStreamTrack[]>([]); // 替换

  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([]);
  const [isMicrophoneLoading, setIsMicrophoneLoading] = useState(false);

  useEffect(() => {
    return () => {
      // 组件卸载时清理
      if (mediaStream) {
        mediaStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [mediaStream]);

  const startMicrophone = async (
    // mediaAudioTrackRef?: MutableRefObject<MediaStreamTrack | null>,
    // mediaDeviceRef?: MutableRefObject<MediaDeviceInfo | null>,
    setMediaDevice?: (mediaDevice: MediaDeviceInfo | null) => void,
  ) => {
    setIsMicrophoneLoading(true);
    try {
      // 先获取设备列表（此时可能没有设备名称，只有 deviceId）
      const devices = await navigator.mediaDevices.enumerateDevices();

      // 过滤出音频输入设备（麦克风）
      const microphones = devices.filter(
        (device) => device.kind === "audioinput",
      );

      showToast(microphones.length.toString());

      setAudioDevices(microphones);

      // const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // console.log("stream", stream);
      // setMediaStream(stream);
      // setAudioTracks(stream.getAudioTracks());

      if (setMediaDevice && microphones.length > 0) {
        setMediaDevice(microphones[0]);
      }
    } catch (error) {
      console.error("Error accessing microphone:", error);
    } finally {
      setIsMicrophoneLoading(false);
    }
  };

  const stopMicrophone = () => {
    if (mediaStream) {
      mediaStream.getTracks().forEach((track) => track.stop());
      setMediaStream(null);
      setAudioTracks([]);
    }
  };

  return {
    audioTracks,
    isMicrophoneLoading,
    audioDevices,
    startMicrophone,
    stopMicrophone,
  };
};
