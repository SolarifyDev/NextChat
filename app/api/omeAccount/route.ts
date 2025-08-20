import { NextResponse } from "next/server";

import { getServerSideConfig } from "../../config/server";

const serverConfig = getServerSideConfig();

const OME_ACCOUNT_CONFIG = {
  clientId: serverConfig.clientId,
  clientSecret: serverConfig.clientSecret,
  score: serverConfig.score,
};

declare global {
  type OmeAccountConfig = typeof OME_ACCOUNT_CONFIG;
}

async function handle() {
  return NextResponse.json(OME_ACCOUNT_CONFIG);
}

export const GET = handle;
export const POST = handle;

export const runtime = "edge";
