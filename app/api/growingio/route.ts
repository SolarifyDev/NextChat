import { NextResponse } from "next/server";

import { getServerSideConfig } from "../../config/server";

const serverConfig = getServerSideConfig();

const GROWINGIO_CONFIG = {
  growingId: serverConfig.growingId,
};

declare global {
  type GrowingIOConfig = typeof GROWINGIO_CONFIG;
}

async function handle() {
  return NextResponse.json(GROWINGIO_CONFIG);
}

export const GET = handle;
export const POST = handle;

export const runtime = "edge";
