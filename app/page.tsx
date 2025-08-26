import { Analytics } from "@vercel/analytics/react";
import { Home } from "./components/home";
import { getServerSideConfig } from "./config/server";
import dynamic from "next/dynamic";

const serverConfig = getServerSideConfig();

const ArmsProvider = dynamic(
  async () => (await import("./hook/arms-provider")).ArmsProvider,
  {
    ssr: false,
  },
);

export default async function App() {
  return (
    <>
      <ArmsProvider />
      <Home />
      {serverConfig?.isVercel && (
        <>
          <Analytics />
        </>
      )}
    </>
  );
}
