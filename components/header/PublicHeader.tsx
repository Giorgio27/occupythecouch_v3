import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function PublicHeader() {
  return (
    <header className="w-full border-b bg-background">
      <nav className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link href="/" className="font-semibold tracking-tight">
          CineFriends
        </Link>

        <div className="flex items-center gap-2">
          <Link href="/auth/signin">
            <Button variant="outline" size="sm">
              Log in
            </Button>
          </Link>
          <Link href="/auth/signup">
            <Button size="sm">Sign up</Button>
          </Link>
        </div>
      </nav>
    </header>
  );
}
