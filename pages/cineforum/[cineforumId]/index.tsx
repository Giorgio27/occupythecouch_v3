import type { GetServerSideProps } from "next";

/**
 * Home page for a specific cineforum.
 * Redirects to the proposal page which serves as the main landing page.
 */
export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const { cineforumId } = ctx.params as { cineforumId: string };

  return {
    redirect: {
      destination: `/cineforum/${cineforumId}/proposal`,
      permanent: false,
    },
  };
};

export default function CineforumHome() {
  return null;
}
