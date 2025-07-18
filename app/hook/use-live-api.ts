/**
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {
  Dispatch,
  MutableRefObject,
  SetStateAction,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  MultimodalLiveAPIClientConnection,
  MultimodalLiveClient,
} from "../lib/multimodal-live-client";
import { LiveConfig } from "../multimodal-live-types";
import { AudioStreamer } from "../lib/audio-streamer";

export enum CallStatus {
  Disconnected, // 未连接
  Connected, // 已连接
  AISpeaking, // AI在说话
  AIDone, // AI说话结束
  UserSpeaking, // 人开始说话
  UserDone, // 人结束说话
  ConnectError, // 连接失败
}

export type UseLiveAPIResults = {
  client: MultimodalLiveClient;
  setConfig: (config: LiveConfig) => void;
  config: LiveConfig;
  connected: CallStatus;
  setConnected: Dispatch<SetStateAction<CallStatus>>;
  connect: (assistantId: number) => Promise<void>;
  disconnect: () => Promise<void>;
  volume: number;
  connectLoading: boolean;
  setConnectLoading: Dispatch<SetStateAction<boolean>>;
  connectStatus: boolean;
  connectStatusRef: MutableRefObject<boolean>;
  stopAudioStreamer: () => void;
};

export function useLiveAPI({
  url,
}: MultimodalLiveAPIClientConnection): UseLiveAPIResults {
  const client = useMemo(() => new MultimodalLiveClient({ url }), [url]);
  const audioStreamerRef = useRef<AudioStreamer | null>(null);

  const [connected, setConnected] = useState<CallStatus>(
    CallStatus.Disconnected,
  );

  const [connectLoading, setConnectLoading] = useState<boolean>(false);

  const [connectStatus, setConnectStatus] = useState<boolean>(false);

  const connectStatusRef = useRef(connectStatus);

  const [config, setConfig] = useState<LiveConfig>({
    model: "models/gemini-2.0-flash-exp",
  });
  const [volume, setVolume] = useState(0);

  const initAudioStream = async () => {
    //   if (!audioStreamerRef.current) {
    //     audioContext({ id: "audio-out", latencyHint: "playback" }).then(
    //       (audioCtx: AudioContext) => {
    //         showToast(audioCtx.state);

    //         audioStreamerRef.current = new AudioStreamer(audioCtx);
    //         audioStreamerRef.current
    //           .addWorklet<any>("vumeter-out", VolMeterWorket, (ev: any) => {
    //             setVolume(ev.data.volume);
    //           })
    //           .then(() => {
    //             // Successfully added worklet
    //           });
    //       },
    //     );
    //   }
    audioStreamerRef.current = null;

    const newContext = new (window.AudioContext ||
      (window as any).webkitAudioContext)({
      sampleRate: 24000,
    });

    audioStreamerRef.current = new AudioStreamer(newContext);

    try {
      await newContext.resume();
      console.log("AudioContext 创建并恢复成功");
    } catch (error) {
      console.error("AudioContext 恢复失败:", error);
    }
  };

  // useEffect(() => {
  //   initAudioStream();
  // }, []);

  const stopAudioStreamer = () => {
    setConnected(CallStatus.UserSpeaking);

    audioStreamerRef.current?.stop();
  };

  useEffect(() => {
    const onConnectSuccess = () => {
      setConnected(CallStatus.Connected);

      setConnectLoading(false);

      setConnectStatus(true);
    };

    const onClose = () => {
      setConnected(CallStatus.Disconnected);
    };

    const onAudio = (data: ArrayBuffer) => {
      setConnected(CallStatus.AISpeaking);

      audioStreamerRef.current?.addPCM16(new Uint8Array(data));
    };

    const onError = () => setConnected(CallStatus.ConnectError);

    client
      .on("open", onConnectSuccess)
      .on("close", onClose)
      .on("interrupted", stopAudioStreamer)
      .on("audio", onAudio)
      .on("error", onError);

    return () => {
      client
        .off("open", onConnectSuccess)
        .off("close", onClose)
        .off("interrupted", stopAudioStreamer)
        .off("audio", onAudio);
    };
  }, [client]);

  const connect = useCallback(
    async (assistantId: number) => {
      if (!config) {
        throw new Error("config has not been set");
      }
      await initAudioStream();
      client.disconnect();
      await client.connect(config, assistantId);
    },
    [client, config],
  );

  const disconnect = useCallback(async () => {
    setConnectStatus(false);

    setConnected(CallStatus.Disconnected);

    await audioStreamerRef.current?.stop();

    audioStreamerRef.current = null;

    client.disconnect();
  }, [client]);

  useEffect(() => {
    connectStatusRef.current = connectStatus;
  }, [connectStatus]);

  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === "visible") {
        console.warn("页面恢复可见，强制重建 AudioContext");
        await initAudioStream();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  return {
    client,
    config,
    setConfig,
    connected,
    setConnected,
    connect,
    disconnect,
    volume,
    connectLoading,
    setConnectLoading,
    connectStatus,
    connectStatusRef,
    stopAudioStreamer,
  };
}
