import React from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { signOut, useSession } from "next-auth/react";

const Header: React.FC = () => {
  const router = useRouter();
  const isActive: (pathname: string) => boolean = (pathname) =>
    router.pathname === pathname;

  const { data: session, status } = useSession();

  let left = (
    <div className="flex items-center space-x-4">
      <Link
        href="/"
        className={`text-base font-medium transition-colors duration-200 hover:text-gray-600 ${
          isActive("/") ? "text-gray-400" : "text-gray-900"
        }`}
      >
        Feed
      </Link>
    </div>
  );

  let right = null;

  if (status === "loading") {
    right = (
      <p className="ml-auto text-sm text-gray-500">Validating session ...</p>
    );
  }

  if (!session) {
    right = (
      <div className="flex items-center ml-auto space-x-4">
        <Link
          href="/auth/signin"
          className={`px-4 py-2 rounded border border-gray-400 text-base font-medium transition-colors duration-200 hover:bg-gray-100 hover:text-gray-700 ${
            isActive("/auth/signin") ? "text-gray-400" : "text-gray-900"
          }`}
        >
          Log in
        </Link>
        <Link
          href="/auth/signup"
          className={`px-4 py-2 rounded border border-gray-400 text-base font-medium transition-colors duration-200 hover:bg-gray-100 hover:text-gray-700 ${
            isActive("/auth/signup") ? "text-gray-400" : "text-gray-900"
          }`}
        >
          Sign up
        </Link>
      </div>
    );
  }

  if (session) {
    left = (
      <div className="flex items-center space-x-4">
        <Link
          href="/"
          className={`text-base font-medium transition-colors duration-200 hover:text-gray-600 ${
            isActive("/") ? "text-gray-400" : "text-gray-900"
          }`}
        >
          Feed
        </Link>
        <Link
          href="/drafts"
          className={`text-base font-medium transition-colors duration-200 hover:text-gray-600 ${
            isActive("/drafts") ? "text-gray-400" : "text-gray-900"
          }`}
        >
          My drafts
        </Link>
      </div>
    );
    right = (
      <div className="flex items-center ml-auto space-x-4">
        <p className="text-sm text-gray-700">
          {session.user?.name} ({session.user?.email})
        </p>
        <Link
          href="/create"
          className="px-4 py-2 rounded border border-gray-400 text-base font-medium transition-colors duration-200 hover:bg-gray-100 hover:text-gray-700"
        >
          New post
        </Link>
        <button
          onClick={() => signOut()}
          className="px-4 py-2 rounded border border-gray-400 bg-white text-base font-medium transition-colors duration-200 hover:bg-gray-100 hover:text-gray-700 cursor-pointer"
        >
          Log out
        </button>
      </div>
    );
  }

  return (
    <nav className="flex items-center px-8 py-6 bg-white border-b border-gray-200 shadow-sm">
      {left}
      {right}
    </nav>
  );
};

export default Header;
