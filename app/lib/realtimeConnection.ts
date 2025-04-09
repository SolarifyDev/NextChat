import { RefObject } from "react";

export async function createRealtimeConnection(
  audioElement: RefObject<HTMLAudioElement | null>,
): Promise<{
  pc: RTCPeerConnection;
  dc: RTCDataChannel;
  sender: RTCRtpSender;
  session: Record<string, any>;
}> {
  const pc = new RTCPeerConnection();

  pc.ontrack = (e) => {
    if (audioElement.current) {
      audioElement.current.srcObject = e.streams[0];
    }
  };

  const mediaStream = await navigator.mediaDevices.getUserMedia({
    audio: true,
  });
  const audioTrack = mediaStream.getAudioTracks()[0];

  const sender = pc.addTrack(audioTrack);

  const dc = pc.createDataChannel("oai-events");

  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);

  // const sdpResponse = await PostRealTime(offer.sdp!);
  const sdpResponse = await fetch("/api/session", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      offerSdp: offer.sdp,
    }),
  });

  const data = await sdpResponse.json();

  const answerSdp = data.data.answerSdp;

  const session = data.data.session;

  const answer: RTCSessionDescriptionInit = {
    type: "answer",
    sdp: answerSdp,
  };

  await pc.setRemoteDescription(answer);

  return { pc, dc, sender, session };
}
