import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = searchParams.get("page");
    const pageSize = searchParams.get("pageSize");

    const queryParams = new URLSearchParams();

    if (page) queryParams.append("page", page);
    if (pageSize) queryParams.append("pageSize", pageSize);

    queryParams.append("Channel", "2");

    const apiUrl = `${
      process.env.SMART_TALK_URL
    }/api/AiSpeechAssistant/assistants?${queryParams.toString()}`;

    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        "x-api-key": process.env.SMART_TALK_KEY,
        "Content-Type": "application/json",
      },
    });
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error in /assistants:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
