import type { ReactNode } from "react";
import Header from "./Header";
import Footer from "./Footer";
import { CineforumProvider } from "@/lib/client/contexts/CineforumContext";

type LayoutProps = {
  children: ReactNode;
  cineforumId?: string | null;
  cineforumName?: string | null;
};

export default function Layout({
  children,
  cineforumId = null,
  cineforumName = null,
}: LayoutProps) {
  return (
    <CineforumProvider cineforumId={cineforumId} cineforumName={cineforumName}>
      <div className="min-h-dvh flex flex-col bg-background text-foreground">
        <Header />
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
          {children}
        </main>
        <Footer />
      </div>
    </CineforumProvider>
  );
}
