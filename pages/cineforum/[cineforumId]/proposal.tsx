import * as React from "react";
import type { GetServerSideProps } from "next";
import Head from "next/head";
import type { SupportedLocale } from "@/lib/server/get-locale";
import { getCineforumPageMeta } from "@/lib/server/meta";
import prisma from "@/lib/prisma";
import { CreateProposal } from "@/components/cineforum/proposal/create";
import { OpenProposal } from "@/components/cineforum/proposal/open";
import { ClosedProposal } from "@/components/cineforum/proposal/closed";
import CineforumLayout from "@/components/CineforumLayout";
import { getCineforumLayoutProps } from "@/lib/server/cineforum-layout-props";

type ProposalLite = {
  id: string;
  date: string | null;
  rawDate: string | null; // ISO date string for comparison
  title: string;
  closed: boolean;
  winner?: { id: string; title: string } | null;
  owner?: { id: string; type: "User" | "Team"; name?: string | null } | null;
  show_results: boolean;
  no_votes_left: boolean;
};

type Props = {
  cineforumId: string;
  cineforumName: string;
  initialLocale: SupportedLocale;
  last: ProposalLite | null;
};

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const cineforumProps = await getCineforumLayoutProps(ctx);
  if ("redirect" in cineforumProps || "notFound" in cineforumProps) {
    return cineforumProps;
  }

  const { cineforumId, cineforumName, initialLocale } = cineforumProps.props as {
    cineforumId: string;
    cineforumName: string;
    initialLocale: SupportedLocale;
  };

  const last = await prisma.proposal.findFirst({
    where: { cineforumId },
    orderBy: { date: "desc" },
    include: {
      winner: { select: { id: true, title: true } },
      ownerUser: { select: { id: true, name: true } },
      ownerTeam: { select: { id: true, name: true } },
    },
  });

  const props: Props = {
    cineforumId,
    cineforumName,
    initialLocale,
    last: last
      ? {
          id: last.id,
          date: last.date
            ? new Date(last.date).toLocaleDateString("it-IT")
            : null,
          rawDate: last.date ? last.date.toISOString() : null,
          title: last.title,
          closed: last.closed,
          winner: last.winner
            ? { id: last.winner.id, title: last.winner.title }
            : null,
          owner: last.ownerUserId
            ? {
                id: last.ownerUserId,
                type: "User" as const,
                name: last.ownerUser?.name ?? null,
              }
            : last.ownerTeamId
              ? {
                  id: last.ownerTeamId,
                  type: "Team" as const,
                  name: last.ownerTeam?.name ?? null,
                }
              : null,
          show_results: last.showResults,
          no_votes_left: false,
        }
      : null,
  };

  return { props };
};

export default function ProposalPage({
  cineforumId,
  cineforumName,
  initialLocale,
  last,
}: Props) {
  // Determine if the screening date is in the future
  const isScreeningInFuture = React.useMemo(() => {
    if (!last?.rawDate) return false;
    const screeningDate = new Date(last.rawDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to start of day for fair comparison
    return screeningDate >= today;
  }, [last?.rawDate]);

  // Logic:
  // 1. If there's a closed proposal with a future screening date -> show it (no create option)
  // 2. If there's no proposal OR closed proposal with past screening date -> show create option
  // 3. If there's an open proposal -> show voting interface

  const showClosedProposal = last && last.closed && isScreeningInFuture;
  const showCreateProposal = !last || (last.closed && !isScreeningInFuture);
  const showOpenProposal = last && !last.closed;

  const { title: pageTitle, description: pageDescription } = getCineforumPageMeta(
    "proposal",
    initialLocale,
    cineforumName,
  );

  return (
    <>
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:type" content="website" />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={pageDescription} />
      </Head>
      <CineforumLayout cineforumId={cineforumId} cineforumName={cineforumName}>
        <div>
          {showClosedProposal && <ClosedProposal last={last} />}

          {showCreateProposal && <CreateProposal cineforumId={cineforumId} />}

          {showOpenProposal && <OpenProposal proposalId={last.id} />}
        </div>
      </CineforumLayout>
    </>
  );
}
