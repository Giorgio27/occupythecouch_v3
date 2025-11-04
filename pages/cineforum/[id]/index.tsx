import { GetServerSideProps } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import prisma from "@/lib/prisma";
import Layout from "@/components/Layout";

type Props = { id: string; name: string };

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const session = await getServerSession(ctx.req, ctx.res, authOptions);
  if (!session?.user?.id)
    return { redirect: { destination: "/auth/signin", permanent: false } };

  const id = ctx.params?.id as string;
  const cf = await prisma.cineforum.findFirst({
    where: { id, memberships: { some: { userId: session.user.id } } },
    select: { id: true, name: true },
  });
  if (!cf) return { notFound: true };

  return { props: { id: cf.id, name: cf.name } };
};

export default function CineforumPage({ name }: Props) {
  return (
    <Layout>
      <h1 className="text-xl font-semibold">{name}</h1>
      <p className="text-muted-foreground">
        Qui aggiungeremo round, proposte e voti.
      </p>
    </Layout>
  );
}
