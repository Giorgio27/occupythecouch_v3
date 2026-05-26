// pages/_app.tsx
import "@/lib/i18n"; // Initialize i18n (must be before other imports)
import Head from "next/head";
import { SessionProvider } from "next-auth/react";
import type { AppProps } from "next/app";
import { I18nextProvider } from "react-i18next";
import i18n from "@/lib/i18n";
import { ThemeProvider } from "@/lib/client/contexts/ThemeContext";
import RouteProgressBar from "@/components/ui/RouteProgressBar";
import "../styles/globals.css";

export default function App({ Component, pageProps }: AppProps) {
  // Sync i18n language with the locale determined server-side from the cookie.
  // This must run synchronously (before render) so SSR and client produce the
  // same HTML and React hydration succeeds without a mismatch warning.
  if (pageProps.initialLocale && i18n.language !== pageProps.initialLocale) {
    i18n.changeLanguage(pageProps.initialLocale);
  }

  return (
    <SessionProvider session={pageProps.session}>
      <I18nextProvider i18n={i18n}>
        <ThemeProvider>
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

            {/* Open Graph — fallback globale (sovrascritto dalle singole pagine) */}
            <meta property="og:site_name" content="CineForum" />
            <meta
              property="og:title"
              content="CineForum - Scegli film con gli amici"
            />
            <meta
              property="og:description"
              content="Crea un round, invita gli amici a proporre film, votate insieme. Il migliore vince. Niente discussioni, solo cinema."
            />
            <meta property="og:type" content="website" />
            <meta property="og:image" content="/og-image.png" />
            <meta property="og:image:width" content="1200" />
            <meta property="og:image:height" content="630" />
            <meta property="og:image:alt" content="CineForum - Scegli film con gli amici" />

            {/* Twitter / X Card */}
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:site" content="@cineforum" />
            <meta
              name="twitter:title"
              content="CineForum - Scegli film con gli amici"
            />
            <meta
              name="twitter:description"
              content="Crea un round, invita gli amici a proporre film, votate insieme. Il migliore vince."
            />
            <meta name="twitter:image" content="/og-image.png" />

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
            <link rel="icon" href="/couch-red.svg" type="image/svg+xml" />
            <link rel="apple-touch-icon" href="/couch-red.svg" />
          </Head>

          <RouteProgressBar />
          <Component {...pageProps} />
        </ThemeProvider>
      </I18nextProvider>
    </SessionProvider>
  );
}
