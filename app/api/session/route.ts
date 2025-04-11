import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { offerSdp, assistantId } = await req.json();

    const response = await fetch(
      `${process.env.SMART_TALK_URL}/api/AiSpeechAssistant/realtime/connect`,
      {
        method: "POST",
        headers: {
          "x-api-key": process.env.SMART_TALK_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          offerSdp,
          assistantId,
        }),
      },
    );
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error in /session:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
