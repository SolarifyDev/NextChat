import { NextResponse } from "next/server";

import { getServerSideConfig } from "../../config/server";

const serverConfig = getServerSideConfig();

const GA_CONFIG = {
  gaId: serverConfig.gaId,
};

declare global {
  type GA_CONFIG = typeof GA_CONFIG;
}

async function handle() {
  return NextResponse.json(GA_CONFIG);
}

export const GET = handle;
export const POST = handle;

export const runtime = "edge";
