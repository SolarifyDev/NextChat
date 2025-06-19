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

import AudioRecordingWorklet from "./worklets/audio-processing";
import VolMeterWorket from "./worklets/vol-meter";

import { createWorketFromSrc } from "./audioworklet-registry";
import EventEmitter from "eventemitter3";

function arrayBufferToBase64(buffer: ArrayBuffer) {
  var binary = "";
  var bytes = new Uint8Array(buffer);
  var len = bytes.byteLength;
  for (var i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

export class AudioRecorder extends EventEmitter {
  stream: MediaStream | undefined;
  audioContext: AudioContext | undefined;
  source: MediaStreamAudioSourceNode | undefined;
  recording: boolean = false;
  recordingWorklet: AudioWorkletNode | undefined;
  vuWorklet: AudioWorkletNode | undefined;

  // 维护当前启动的Promise，防止重复启动和配合stop等待启动完成
  private starting: Promise<boolean> | null = null;

  constructor(public sampleRate = 24000) {
    super();
  }

  async start(): Promise<boolean> {
    if (this.starting) return this.starting;

    this.starting = (async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        console.error("环境不支持媒体设备访问");
        this.starting = null;
        return false;
      }

      // 设备检测
      const isHuawei = /huawei|honor/i.test(navigator.userAgent);
      const isAndroid = /android/i.test(navigator.userAgent);

      try {
        // 动态约束配置
        const constraints: MediaStreamConstraints = {
          audio: {
            // 基础约束
            channelCount: 1,
            sampleRate: this.sampleRate,
            echoCancellation: { ideal: true },
            noiseSuppression: { ideal: true },
            autoGainControl: { ideal: true },

            // 平台增强约束
            ...(isAndroid
              ? {
                  // Android通用增强
                  googEchoCancellation: true,
                  googNoiseSuppression: "aggressive",
                  googHighpassFilter: true,
                }
              : {}),

            ...(isHuawei
              ? {
                  // 华为专用配置
                  mimeType: "audio/G729",
                  processing: {
                    voiceIsolation: false, // 关闭EMUI语音增强
                    noiseSuppressionLevel: "high",
                  },
                }
              : {}),
          },
        };

        this.stream = await navigator.mediaDevices.getUserMedia(constraints);

        const track = this.stream.getAudioTracks()[0];

        const audioTracks = this.stream.getAudioTracks();
        if (audioTracks.length === 0) {
          console.warn("未检测到音频输入设备");
          this.starting = null;
          return false;
        }

        // 音频上下文配置
        this.audioContext = new (window.AudioContext ||
          window.webkitAudioContext)({
          sampleRate: this.sampleRate,
          latencyHint: isHuawei ? "interactive" : "balanced",
        });

        this.source = this.audioContext.createMediaStreamSource(this.stream);

        // Worklet初始化
        const workletName = "audio-recorder-worklet";
        await this.audioContext.audioWorklet.addModule(
          createWorketFromSrc(workletName, AudioRecordingWorklet),
        );

        this.recordingWorklet = new AudioWorkletNode(
          this.audioContext,
          workletName,
          { numberOfOutputs: 1 },
        );

        this.recordingWorklet.port.onmessage = (ev: MessageEvent) => {
          if (ev.data.data?.int16arrayBuffer) {
            this.emit(
              "data",
              arrayBufferToBase64(ev.data.data.int16arrayBuffer),
            );
          }
        };

        // VU Meter
        const vuWorkletName = "vu-meter";
        await this.audioContext.audioWorklet.addModule(
          createWorketFromSrc(vuWorkletName, VolMeterWorket),
        );
        this.vuWorklet = new AudioWorkletNode(
          this.audioContext,
          vuWorkletName,
          { numberOfOutputs: 0 }, // 仅测量不输出
        );
        this.vuWorklet.port.onmessage = (ev: MessageEvent) => {
          this.emit("volume", Math.min(ev.data.volume * 1.2, 1)); // 华为设备音量补偿
        };

        // 连接音频管线
        this.source.connect(this.recordingWorklet);
        this.source.connect(this.vuWorklet);

        this.recording = true;
        this.starting = null;
        return true;
      } catch (err) {
        console.error("启动失败:", err);
        this.starting = null;
        return false;
      }
    })();

    return this.starting;
  }

  stop() {
    const handleStop = () => {
      this.source?.disconnect();
      this.stream?.getTracks().forEach((track) => track.stop());
      this.stream = undefined;
      this.recordingWorklet = undefined;
      this.vuWorklet = undefined;
      this.recording = false;
    };

    if (this.starting) {
      this.starting.finally(() => handleStop());
      return;
    }

    handleStop();
  }
}
