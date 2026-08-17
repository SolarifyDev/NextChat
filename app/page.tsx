import { Analytics } from "@vercel/analytics/react";
import { Home } from "./components/home";
import { getServerSideConfig } from "./config/server";
import { GaProvider } from "./hook/use-ga";
import { ArmsProvider } from "./hook/arms-provider";

const serverConfig = getServerSideConfig();

export default async function App() {
  return (
    <>
      <GaProvider />
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
