import type { GetServerSidePropsContext } from "next";
import { getServerSession } from "next-auth";
import Head from "next/head";
import { authOptions } from "./api/auth/[...nextauth]";
import prisma from "@/lib/prisma";
import { getLocaleFromRequest } from "@/lib/server/get-locale";
import type { SupportedLocale } from "@/lib/server/get-locale";
import { getHomeMeta } from "@/lib/server/meta";
import Layout from "@/components/Layout";
import type { CineforumDTO } from "@/lib/shared/types";
import { AuthedHome } from "@/components/home/auth";
import { Landing } from "@/components/home/landing";

type Props =
  | { authed: false; initialLocale: SupportedLocale }
  | { authed: true; cineforums: CineforumDTO[]; initialLocale: SupportedLocale };

// Server-side: if logged in, load cineforums via Membership
export async function getServerSideProps(ctx: GetServerSidePropsContext) {
  const session = await getServerSession(ctx.req, ctx.res, authOptions);
  if (!session?.user?.id) {
    return {
      props: { authed: false, initialLocale: getLocaleFromRequest(ctx.req) },
    };
  }

  const cineforums = await prisma.cineforum.findMany({
    where: {
      memberships: { some: { userId: session.user.id, disabled: false } },
    },
    select: {
      id: true,
      name: true,
      description: true,
      _count: {
        select: {
          memberships: { where: { disabled: false } },
          rounds: true,
        },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  return {
    props: {
      authed: true,
      cineforums,
      initialLocale: getLocaleFromRequest(ctx.req),
    },
  };
}

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "https://occupythecouch.app";

export default function Home(props: Props) {
  const meta = getHomeMeta(props.initialLocale);

  return (
    <>
      <Head>
        <title>{meta.title}</title>
        <meta name="description" content={meta.description} />
        <meta property="og:title" content={meta.title} />
        <meta property="og:description" content={meta.description} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={BASE_URL} />
        <meta property="og:image" content={`${BASE_URL}/og-image.png`} />
        <meta name="twitter:title" content={meta.title} />
        <meta name="twitter:description" content={meta.description} />
        <meta name="twitter:image" content={`${BASE_URL}/og-image.png`} />
      </Head>
      <Layout>
        {props.authed ? (
          <AuthedHome cineforums={props.cineforums} />
        ) : (
          <Landing />
        )}
      </Layout>
    </>
  );
}
