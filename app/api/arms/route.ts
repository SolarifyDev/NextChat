import { NextResponse } from "next/server";

import { getServerSideConfig } from "../../config/server";

const serverConfig = getServerSideConfig();

const ARMS_CONFIG = {
  pid: serverConfig.arms,
  environment: serverConfig.environment,
};

declare global {
  type ArmsConfig = typeof ARMS_CONFIG;
}

async function handle() {
  return NextResponse.json(ARMS_CONFIG);
}

export const GET = handle;
export const POST = handle;

export const runtime = "edge";
