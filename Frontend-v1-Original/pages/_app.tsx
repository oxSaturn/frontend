import { useState, useEffect } from "react";
import type { AppProps } from "next/app";
import Head from "next/head";
import { CacheProvider, EmotionCache } from "@emotion/react";
import { ThemeProvider } from "@mui/material/styles";
import { WagmiConfig } from "wagmi";
import {
  RainbowKitProvider,
  darkTheme as rainbowKitDarkTheme,
} from "@rainbow-me/rainbowkit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import * as Tooltip from "@radix-ui/react-tooltip";
import * as Toast from "@radix-ui/react-toast";

// import lightTheme from "../theme/light";
import darkTheme from "../theme/dark";
import Layout from "../components/layout/layout";
import stores from "../stores/index";
import { config, chains } from "../stores/connectors/viem";
import { ACTIONS } from "../stores/constants/constants";
import createEmotionCache from "../utils/createEmotionCache";

import Configure from "./configure";

import "../styles/global.css";
import "@rainbow-me/rainbowkit/styles.css";

export const queryClient = new QueryClient();

// Client-side cache, shared for the whole session of the user in the browser.
const clientSideEmotionCache = createEmotionCache();

export interface MyAppProps extends AppProps {
  emotionCache?: EmotionCache;
}

function RadixProvider({ children }: { children: React.ReactNode }) {
  return (
    <Toast.Provider swipeDirection="right">
      <Tooltip.Provider delayDuration={200}>{children}</Tooltip.Provider>
    </Toast.Provider>
  );
}

console.log("<<<<<<<<<<<<< flow >>>>>>>>>>>>>");

export default function MyApp({
  Component,
  emotionCache = clientSideEmotionCache,
  pageProps,
}: MyAppProps) {
  const [themeConfig] = useState(darkTheme);
  const [accountConfigured, setAccountConfigured] = useState(false);

  const accountConfigureReturned = () => {
    setAccountConfigured(true);
  };

  useEffect(function () {
    stores.emitter.on(ACTIONS.ACCOUNT_CONFIGURED, accountConfigureReturned);

    stores.dispatcher.dispatch({ type: ACTIONS.CONFIGURE });

    return () => {
      stores.emitter.removeListener(
        ACTIONS.ACCOUNT_CONFIGURED,
        accountConfigureReturned
      );
    };
  }, []);

  return (
    <CacheProvider value={emotionCache}>
      <QueryClientProvider client={queryClient}>
        <Head>
          <title>Velocimeter</title>
          <meta
            name="viewport"
            content="minimum-scale=1, initial-scale=1, width=device-width"
          />
        </Head>
        <ThemeProvider theme={themeConfig}>
          <RadixProvider>
            <WagmiConfig config={config}>
              <RainbowKitProvider
                chains={chains}
                theme={rainbowKitDarkTheme({
                  accentColor: "rgb(0, 243, 203)",
                  accentColorForeground: "#222222",
                  borderRadius: "small",
                  fontStack: "rounded",
                  overlayBlur: "small",
                })}
              >
                {accountConfigured ? (
                  <Layout>
                    <Component {...pageProps} />
                  </Layout>
                ) : (
                  <Configure {...pageProps} />
                )}
              </RainbowKitProvider>
            </WagmiConfig>
          </RadixProvider>
        </ThemeProvider>
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </CacheProvider>
  );
}
