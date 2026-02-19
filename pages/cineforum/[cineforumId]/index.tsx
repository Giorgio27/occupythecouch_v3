import * as React from "react";
import type { GetServerSideProps } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import prisma from "@/lib/prisma";

import { CineforumHeader } from "@/components/cineforum/header";
import { CreateProposal } from "@/components/cineforum/proposal/create";
import { OpenProposal } from "@/components/cineforum/proposal/open";
import { ClosedProposal } from "@/components/cineforum/proposal/closed";
import Layout from "@/components/Layout";

type ProposalLite = {
  id: string;
  date: string | null;
  rawDate: string | null; // ISO date string for comparison
  title: string;
  closed: boolean;
  winner?: { id: string; title: string } | null;
  show_results: boolean;
  no_votes_left: boolean;
};

type Props = {
  cineforumId: string;
  cineforumName: string;
  last: ProposalLite | null;
};

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const session = await getServerSession(ctx.req, ctx.res, authOptions);
  if (!session?.user?.id)
    return { redirect: { destination: "/auth/signin", permanent: false } };

  const cineforumId = ctx.params?.cineforumId as string;

  const member = await prisma.membership.findFirst({
    where: { cineforumId, userId: session.user.id },
  });
  if (!member) return { notFound: true };

  const cf = await prisma.cineforum.findUnique({
    where: { id: cineforumId },
    select: { name: true },
  });

  const last = await prisma.proposal.findFirst({
    where: { cineforumId },
    orderBy: { date: "desc" },
    include: { winner: { select: { id: true, title: true } } },
  });

  const props: Props = {
    cineforumId,
    cineforumName: cf?.name ?? "Cineforum",
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
          show_results: last.showResults,
          no_votes_left: false,
        }
      : null,
  };

  return { props };
};

export default function CineforumHome({
  cineforumId,
  cineforumName,
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

  return (
    <Layout>
      <div>
        <CineforumHeader
          title={cineforumName}
          subtitle="Vote, see results, or create a new proposal — all in one place."
        />

        {showClosedProposal && <ClosedProposal last={last} />}

        {showCreateProposal && <CreateProposal cineforumId={cineforumId} />}

        {showOpenProposal && <OpenProposal proposalId={last.id} />}
      </div>
    </Layout>
  );
}
