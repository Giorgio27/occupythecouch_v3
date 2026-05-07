import Layout from "@/components/Layout";
import { Tutorial } from "@/components/home/tutorial";
import { getLocaleFromRequest } from "@/lib/server/get-locale";

export async function getServerSideProps(ctx: any) {
  return {
    props: { initialLocale: getLocaleFromRequest(ctx.req) },
  };
}

export default function TutorialPage() {
  return (
    <Layout>
      <Tutorial />
    </Layout>
  );
}
