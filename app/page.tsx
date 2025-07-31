import { Analytics } from "@vercel/analytics/react";
import { Home } from "./components/home";
import { getServerSideConfig } from "./config/server";
import { GrowingIOProvider } from "./hook/use-growing-io";

const serverConfig = getServerSideConfig();

export default async function App() {
  return (
    <>
      <GrowingIOProvider />
      <Home />
      {serverConfig?.isVercel && (
        <>
          <Analytics />
        </>
      )}
    </>
  );
}
