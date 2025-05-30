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

// import { MultimodalLiveClient } from "../lib/multimodal-live-client";

import {
  Dispatch,
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
import { audioContext } from "../utils/audio-utils";
import VolMeterWorket from "../lib/worklets/vol-meter";

export enum CallStatus {
  Disconnected, // 未连接
  Connected, // 已连接
  AISpeaking, // AI在说话
  AIDone, // AI说话结束
  UserSpeaking, // 人开始说话
  UserDone, // 人结束说话
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
};

export function useLiveAPI({
  url,
}: MultimodalLiveAPIClientConnection): UseLiveAPIResults {
  const client = useMemo(() => new MultimodalLiveClient({ url }), [url]);
  const audioStreamerRef = useRef<AudioStreamer | null>(null);

  const [connected, setConnected] = useState<CallStatus>(
    CallStatus.Disconnected,
  );
  const [config, setConfig] = useState<LiveConfig>({
    model: "models/gemini-2.0-flash-exp",
  });
  const [volume, setVolume] = useState(0);

  // register audio for streaming server -> speakers
  useEffect(() => {
    if (!audioStreamerRef.current) {
      audioContext({ id: "audio-out" }).then((audioCtx: AudioContext) => {
        audioStreamerRef.current = new AudioStreamer(audioCtx);
        audioStreamerRef.current
          .addWorklet<any>("vumeter-out", VolMeterWorket, (ev: any) => {
            setVolume(ev.data.volume);
          })
          .then(() => {
            // Successfully added worklet
          });
      });
    }
  }, [audioStreamerRef]);

  useEffect(() => {
    const onConnectSuccesss = () => {
      setConnected(CallStatus.Connected);
    };

    const onClose = () => {
      setConnected(CallStatus.Disconnected);
    };

    const stopAudioStreamer = () => audioStreamerRef.current?.stop(false);

    const onAudio = (data: ArrayBuffer) => {
      setConnected(CallStatus.UserSpeaking);

      audioStreamerRef.current?.addPCM16(new Uint8Array(data));
    };

    client
      .on("open", onConnectSuccesss)
      .on("close", onClose)
      .on("interrupted", stopAudioStreamer)
      .on("audio", onAudio);

    return () => {
      client
        .off("open", onConnectSuccesss)
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
      client.disconnect();
      await client.connect(config, assistantId);
      setConnected(CallStatus.Connected);
    },
    [client, setConnected, config],
  );

  const disconnect = useCallback(async () => {
    audioStreamerRef.current?.stop(true);

    client.disconnect();

    setConnected(CallStatus.Disconnected);
  }, [setConnected, client]);

  return {
    client,
    config,
    setConfig,
    connected,
    setConnected,
    connect,
    disconnect,
    volume,
  };
}
