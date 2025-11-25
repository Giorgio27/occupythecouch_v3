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
  return (
    <Layout>
      <div className="space-y-6">
        <CineforumHeader
          title={cineforumName}
          subtitle="Vote, see results, or create a new proposal — all in one place."
        />

        {!last && <CreateProposal cineforumId={cineforumId} />}

        {last && last.closed && (
          <>
            <ClosedProposal last={last} />
            <CreateProposal cineforumId={cineforumId} />
          </>
        )}

        {last && !last.closed && <OpenProposal proposalId={last.id} />}
      </div>
    </Layout>
  );
}
