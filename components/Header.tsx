import React from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { signOut, useSession } from "next-auth/react";
import { Button } from "@/components/ui/button"; // <-- import dal pacchetto shadcn

const Header: React.FC = () => {
  const router = useRouter();
  const isActive = (pathname: string) => router.pathname === pathname;
  const { data: session, status } = useSession();

  return (
    <nav className="flex items-center p-6 border-b">
      <div className="flex gap-4">
        <Link
          href="/"
          className={`font-semibold ${isActive("/") ? "text-gray-400" : ""}`}
        >
          Feed
        </Link>
        {session && (
          <Link
            href="/drafts"
            className={isActive("/drafts") ? "text-gray-400" : ""}
          >
            My drafts
          </Link>
        )}
      </div>

      <div className="ml-auto flex items-center gap-3">
        {status === "loading" && <p>Validating session...</p>}

        {!session && (
          <>
            <Link href="/auth/signin">
              <Button variant="outline">Log in</Button>
            </Link>
            <Link href="/auth/signup">
              <Button>Sign up</Button>
            </Link>
          </>
        )}

        {session && (
          <>
            <p className="text-sm">
              {session.user?.name} ({session.user?.email})
            </p>
            <Link href="/create">
              <Button>New post</Button>
            </Link>
            <Button variant="outline" onClick={() => signOut()}>
              Log out
            </Button>
          </>
        )}
      </div>
    </nav>
  );
};

export default Header;
