import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";

export default function AppHeader() {
  const { data: session } = useSession();

  return (
    <header className="w-full border-b bg-background">
      <nav className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link href="/" className="font-semibold tracking-tight">
          CineFriends
        </Link>

        <div className="flex items-center gap-3">
          {session && (
            <span className="hidden text-sm text-muted-foreground sm:inline">
              {session.user?.name || session.user?.email}
            </span>
          )}
          <Button variant="outline" size="sm" onClick={() => signOut()}>
            Log out
          </Button>
        </div>
      </nav>
    </header>
  );
}
