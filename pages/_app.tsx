// pages/_app.tsx
import Head from "next/head";
import { SessionProvider } from "next-auth/react";
import type { AppProps } from "next/app";
import "../styles/globals.css";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <SessionProvider session={pageProps.session}>
      <Head>
        <title>CineForum - Scegli film con gli amici</title>
        <meta
          name="description"
          content="Crea un round, invita gli amici a proporre film, votate insieme. Il migliore vince. Niente discussioni, solo cinema."
        />
        <meta
          name="keywords"
          content="cinema, film, amici, votazione, cineforum, movie night"
        />
        <meta name="author" content="CineForum" />
        <meta name="generator" content="v0.app" />

        {/* Open Graph base */}
        <meta
          property="og:title"
          content="CineForum - Scegli film con gli amici"
        />
        <meta
          property="og:description"
          content="Crea un round, invita gli amici a proporre film, votate insieme."
        />
        <meta property="og:type" content="website" />

        {/* Favicons (fallback globale) */}
        <link
          rel="icon"
          href="/couch-red.svg"
          media="(prefers-color-scheme: light)"
        />
        <link
          rel="icon"
          href="/couch-red.svg"
          media="(prefers-color-scheme: dark)"
        />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/couch-red.svg" />
      </Head>

      <Component {...pageProps} />
    </SessionProvider>
  );
}
