import { Analytics } from "@vercel/analytics/react";
import { Home } from "./components/home";
import { getServerSideConfig } from "./config/server";
import { TranscriptProvider } from "./contexts/TranscriptContext";

const serverConfig = getServerSideConfig();

export default async function App() {
  return (
    <>
      <TranscriptProvider>
        <Home />
        {serverConfig?.isVercel && (
          <>
            <Analytics />
          </>
        )}
      </TranscriptProvider>
    </>
  );
}
