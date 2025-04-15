import { RefObject } from "react";
import { showToast } from "../components/ui-lib";
import { isNil } from "lodash-es";

export async function createRealtimeConnection(
  audioElement: RefObject<HTMLAudioElement | null>,
  assistantId: number | null,
  // audioTrack: MediaStreamTrack,
  deviceId: string,
): Promise<{
  pc: RTCPeerConnection;
  dc: RTCDataChannel;
  // sender: RTCRtpSender;
  session: Record<string, any>;
} | null> {
  let pc: RTCPeerConnection | null = null;
  let mediaStream: MediaStream | null = null;
  try {
    pc = new RTCPeerConnection();

    pc.ontrack = (e) => {
      if (audioElement.current) {
        audioElement.current.srcObject = e.streams[0];
      }
    };

    // let mediaStream;
    // try {
    //   mediaStream = await navigator.mediaDevices.getUserMedia({
    //     audio: true,
    //   });
    // } catch (error) {
    //   showToast("无法获取麦克风权限，请检查权限设置");
    //   return null;
    // }

    // const audioTracks = mediaStream.getAudioTracks();
    // if (audioTracks.length === 0) {
    //   showToast("实时聊天连接失败，请重试");
    //   return null;
    // }

    // const audioTrack = audioTracks[0];

    if (isNil(deviceId)) {
      showToast("当前选择音频设备有问题，请选择另一个设备");
      return null;
    }

    try {
      mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          deviceId: { exact: deviceId },
        },
      });
    } catch {
      // showToast("无法获取麦克风权限，请检查权限设置");
      // return null;

      throw new Error("无法获取麦克风权限，请检查权限设置");
    }

    const audioTracks = mediaStream.getAudioTracks();
    if (audioTracks.length === 0) {
      // showToast("实时聊天连接失败，请重试1");
      // mediaStream.getTracks().forEach((track) => track.stop());
      // return null;

      throw new Error("获取本地音频失败，请重试");
    }

    const audioTrack = audioTracks[0];

    pc.addTrack(audioTrack);

    const dc = pc.createDataChannel("oai-events");

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    let sdpResponse;
    try {
      const body: Record<string, any> = {
        offerSdp: offer.sdp,
      };
      if (assistantId) {
        body.assistantId = assistantId;
      }
      sdpResponse = await fetch("/api/session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (!sdpResponse.ok) {
        throw new Error(`HTTP error! status: ${sdpResponse.status}`);
      }
    } catch (error) {
      // showToast("实时聊天连接失败，请重试2");
      // mediaStream.getTracks().forEach((track) => track.stop());
      // return null;

      throw new Error("实时聊天连接失败，请重试");
    }

    const data = await sdpResponse.json();

    if (!data || !data.data || !data.data.answerSdp) {
      // showToast("实时聊天连接失败，请重试3");
      // mediaStream.getTracks().forEach((track) => track.stop());
      // return null;

      throw new Error("实时聊天连接失败，请重试");
    }

    const answerSdp = data.data.answerSdp;
    const session = data.data.session;

    const answer: RTCSessionDescriptionInit = {
      type: "answer",
      sdp: answerSdp,
    };

    await pc.setRemoteDescription(answer);

    return { pc, dc, session };
  } catch (error) {
    showToast("实时聊天连接失败，请重试");
    if (mediaStream) {
      mediaStream.getTracks().forEach((track) => track.stop());
    }
    if (pc) {
      pc.close();
    }

    return null;
  }
}
