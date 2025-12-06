import { getServerSession } from "next-auth";
import { authOptions } from "./api/auth/[...nextauth]";
import prisma from "@/lib/prisma";
import Layout from "@/components/Layout";
import { CineforumDTO } from "@/lib/shared/types";
import { AuthedHome } from "@/components/home/auth";
import { Landing } from "@/components/home/landing";

type Props =
  | { authed: false }
  | {
      authed: true;
      cineforums: CineforumDTO[];
    };

// Server-side: if logged in, load cineforums via Membership
export async function getServerSideProps(ctx: any) {
  const session = await getServerSession(ctx.req, ctx.res, authOptions);
  if (!session?.user?.id) {
    return { props: { authed: false } };
  }

  const cineforums = await prisma.cineforum.findMany({
    where: { memberships: { some: { userId: session.user.id } } },
    select: {
      id: true,
      name: true,
      description: true,
      _count: { select: { memberships: true, rounds: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  return { props: { authed: true, cineforums } };
}

export default function Home(props: Props) {
  return (
    <Layout>
      {props.authed ? (
        <AuthedHome cineforums={props.cineforums} />
      ) : (
        <Landing />
      )}
    </Layout>
  );
}
