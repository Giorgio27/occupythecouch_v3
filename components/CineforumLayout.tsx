import { ReactNode } from "react";
import Layout from "./Layout";

type CineforumLayoutProps = {
  children: ReactNode;
  cineforumId: string;
  cineforumName: string;
};

/**
 * Layout wrapper for cineforum pages that automatically provides
 * cineforumId and cineforumName to the context.
 *
 * Use this instead of the base Layout component in all pages under
 * /cineforum/[cineforumId]/*
 */
export default function CineforumLayout({
  children,
  cineforumId,
  cineforumName,
}: CineforumLayoutProps) {
  return (
    <Layout cineforumId={cineforumId} cineforumName={cineforumName}>
      {children}
    </Layout>
  );
}
