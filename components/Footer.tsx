import Link from "next/link";
import Image from "next/image";
import { Heart } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-border/50 py-8 sm:py-10 md:py-12 lg:py-16 bg-card/20">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 xl:px-4">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 sm:gap-6">
          <Link href="/" className="flex items-center gap-2 sm:gap-2.5 group">
            <Image
              src="/couch-red.svg"
              alt="CineForum"
              width={28}
              height={28}
              className="w-6 h-6 sm:w-7 sm:h-7 transition-transform duration-300 group-hover:scale-105"
            />
            <span className="font-bold text-sm sm:text-base text-foreground">
              CineForum
            </span>
          </Link>
          <p className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1 sm:gap-1.5">
            Fatto con{" "}
            <Heart className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-primary fill-primary/50" />{" "}
            per chi ama il cinema
          </p>
        </div>
      </div>
    </footer>
  );
}
