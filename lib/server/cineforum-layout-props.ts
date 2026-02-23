import { GetServerSidePropsContext, GetServerSidePropsResult } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import prisma from "@/lib/prisma";

export type CineforumLayoutServerProps = {
  cineforumId: string;
  cineforumName: string;
};

/**
 * Helper function to use in getServerSideProps of cineforum pages.
 * Handles authentication, membership check, and fetches cineforum data.
 *
 * @example
 * export const getServerSideProps: GetServerSideProps = async (ctx) => {
 *   const cineforumProps = await getCineforumLayoutProps(ctx);
 *   if ('redirect' in cineforumProps || 'notFound' in cineforumProps) {
 *     return cineforumProps;
 *   }
 *
 *   // Your additional logic here...
 *
 *   return {
 *     props: {
 *       ...cineforumProps.props,
 *       // your additional props
 *     }
 *   };
 * };
 */
export async function getCineforumLayoutProps(
  ctx: GetServerSidePropsContext,
): Promise<GetServerSidePropsResult<CineforumLayoutServerProps>> {
  // Check authentication
  const session = await getServerSession(ctx.req, ctx.res, authOptions);
  if (!session?.user?.id) {
    return {
      redirect: { destination: "/auth/signin", permanent: false },
    };
  }

  const cineforumId = ctx.params?.cineforumId as string;

  // Check membership
  const membership = await prisma.membership.findFirst({
    where: {
      cineforumId,
      userId: session.user.id,
    },
    include: {
      cineforum: {
        select: { name: true },
      },
    },
  });

  if (!membership || membership.disabled) {
    return { notFound: true };
  }

  return {
    props: {
      cineforumId,
      cineforumName: membership.cineforum.name,
    },
  };
}
