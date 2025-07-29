import { Analytics } from "@vercel/analytics/react";
import { Home } from "./components/home";
import { getServerSideConfig } from "./config/server";
import { GaProvider } from "./hook/ga";

const serverConfig = getServerSideConfig();

export default async function App() {
  return (
    <>
      <GaProvider />
      <Home />
      {serverConfig?.isVercel && (
        <>
          <Analytics />
        </>
      )}
    </>
  );
}
