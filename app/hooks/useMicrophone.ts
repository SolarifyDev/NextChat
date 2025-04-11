// hooks/useMicrophone.ts
import { MutableRefObject, useEffect, useState } from "react";

export const useMicrophone = () => {
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [audioTracks, setAudioTracks] = useState<MediaStreamTrack[]>([]);
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
    mediaAudioTrackRef?: MutableRefObject<MediaStreamTrack | null>,
  ) => {
    setIsMicrophoneLoading(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setMediaStream(stream);
      setAudioTracks(stream.getAudioTracks());

      if (mediaAudioTrackRef && stream.getAudioTracks().length > 0) {
        mediaAudioTrackRef.current = stream.getAudioTracks()[0];
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

  return { audioTracks, isMicrophoneLoading, startMicrophone, stopMicrophone };
};
