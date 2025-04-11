import { RefObject } from "react";
import { showToast } from "../components/ui-lib";

export async function createRealtimeConnection(
  audioElement: RefObject<HTMLAudioElement | null>,
  assistantId: number | null,
  audioTrack: MediaStreamTrack,
): Promise<{
  pc: RTCPeerConnection;
  dc: RTCDataChannel;
  // sender: RTCRtpSender;
  session: Record<string, any>;
} | null> {
  try {
    const pc = new RTCPeerConnection();

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

    const sender = pc.addTrack(audioTrack);

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
      showToast("实时聊天连接失败，请重试");
      return null;
    }

    const data = await sdpResponse.json();

    if (!data || !data.data || !data.data.answerSdp) {
      showToast("实时聊天连接失败，请重试");
      return null;
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
    return null;
  }
}
