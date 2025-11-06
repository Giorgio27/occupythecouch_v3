import Link from "next/link";
import { useRouter } from "next/router";
import { signOut, useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";

export default function Header() {
  const { data: session, status } = useSession();
  const isLoading = status === "loading";

  return (
    <header className="w-full border-b">
      <nav className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link href="/" className="font-semibold tracking-tight">
          CineFriends
        </Link>

        <div className="flex items-center gap-2">
          {isLoading ? (
            <span className="text-sm text-muted-foreground">Checking…</span>
          ) : session ? (
            <>
              <span className="hidden text-sm text-muted-foreground sm:inline">
                {session.user?.name || session.user?.email}
              </span>
              <Button variant="outline" onClick={() => signOut()}>
                Log out
              </Button>
            </>
          ) : (
            <>
              <Link href="/auth/signin">
                <Button variant="outline">Log in</Button>
              </Link>
              <Link href="/auth/signup">
                <Button>Sign up</Button>
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
