import Link from "next/link";
import { Button } from "@/components/ui/button";
import Image from "next/image";

export default function PublicHeader() {
  return (
    <header className="w-full border-b border-border bg-gradient-to-r from-cine-bg via-cine-bg-soft to-cine-bg backdrop-blur-sm">
      <nav className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
        <div className="flex items-center gap-2">
          <Image src="/couch-red.svg" alt="Couch Icon" width={32} height={32} />
          <Link
            href="/"
            className="font-black text-lg tracking-tight text-foreground hover:text-cine-red transition-colors duration-300"
          >
            Cineforum
          </Link>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/auth/signin">
            <Button
              variant="outline"
              size="sm"
              className="border-border hover:border-cine-red hover:text-white transition-all duration-300 bg-transparent"
            >
              Log in
            </Button>
          </Link>
          <Link href="/auth/signup">
            <Button
              size="sm"
              className="bg-cine-red hover:bg-cine-red-soft text-white transition-all duration-300 hover:shadow-lg hover:shadow-cine-red/50"
            >
              Sign up
            </Button>
          </Link>
        </div>
      </nav>
    </header>
  );
}
