import * as React from "react";
import { GetServerSideProps } from "next";
import { getServerSession } from "next-auth/next";
import { useSession } from "next-auth/react";
import { useTranslation } from "react-i18next";
import { authOptions } from "./api/auth/[...nextauth]";
import { getLocaleFromRequest } from "@/lib/server/get-locale";
import Layout from "@/components/Layout";
import { Separator } from "@/components/ui/separator";
import ProfileInfoCard from "@/components/profile/ProfileInfoCard";
import PasswordChangeCard from "@/components/profile/PasswordChangeCard";

type UserProfile = {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  createdAt: string;
};

type ProfilePageProps = {
  initialProfile: UserProfile;
};

export default function ProfilePage({ initialProfile }: ProfilePageProps) {
  const { t, i18n } = useTranslation("auth");
  const { update: updateSession } = useSession();

  // Profile form state
  const [name, setName] = React.useState(initialProfile.name || "");
  const [profileSubmitting, setProfileSubmitting] = React.useState(false);
  const [profileSuccess, setProfileSuccess] = React.useState(false);
  const [profileError, setProfileError] = React.useState<string | null>(null);

  // Password form state
  const [currentPassword, setCurrentPassword] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [passwordSubmitting, setPasswordSubmitting] = React.useState(false);
  const [passwordSuccess, setPasswordSuccess] = React.useState(false);
  const [passwordError, setPasswordError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (profileSuccess) {
      const timer = setTimeout(() => setProfileSuccess(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [profileSuccess]);

  React.useEffect(() => {
    if (passwordSuccess) {
      const timer = setTimeout(() => setPasswordSuccess(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [passwordSuccess]);

  async function handleProfileSubmit(e: React.FormEvent) {
    e.preventDefault();
    setProfileSubmitting(true);
    setProfileError(null);
    setProfileSuccess(false);

    try {
      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (!res.ok)
        throw new Error(data.error || t("profile.profileUpdateError"));
      setProfileSuccess(true);
      await updateSession({ name });
    } catch (err) {
      setProfileError(
        err instanceof Error ? err.message : t("profile.unknownError"),
      );
    } finally {
      setProfileSubmitting(false);
    }
  }

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPasswordSubmitting(true);
    setPasswordError(null);
    setPasswordSuccess(false);

    if (newPassword.length < 6) {
      setPasswordError(t("profile.passwordTooShort"));
      setPasswordSubmitting(false);
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError(t("profile.passwordMismatch"));
      setPasswordSubmitting(false);
      return;
    }

    try {
      const res = await fetch("/api/user/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok)
        throw new Error(data.error || t("profile.passwordChangeError"));
      setPasswordSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setPasswordError(
        err instanceof Error ? err.message : t("profile.unknownError"),
      );
    } finally {
      setPasswordSubmitting(false);
    }
  }

  const createdDate = new Date(initialProfile.createdAt).toLocaleDateString(
    i18n.language,
    {
      year: "numeric",
      month: "long",
      day: "numeric",
    },
  );

  return (
    <Layout>
      <div className="mx-auto max-w-2xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold">{t("profile.title")}</h1>
          <p className="mt-2 text-muted-foreground">{t("profile.subtitle")}</p>
        </div>

        <ProfileInfoCard
          email={initialProfile.email}
          name={name}
          createdDate={createdDate}
          onNameChange={setName}
          onSubmit={handleProfileSubmit}
          submitting={profileSubmitting}
          success={profileSuccess}
          error={profileError}
        />

        <Separator />

        <PasswordChangeCard
          currentPassword={currentPassword}
          newPassword={newPassword}
          confirmPassword={confirmPassword}
          onCurrentPasswordChange={setCurrentPassword}
          onNewPasswordChange={setNewPassword}
          onConfirmPasswordChange={setConfirmPassword}
          onSubmit={handlePasswordSubmit}
          submitting={passwordSubmitting}
          success={passwordSuccess}
          error={passwordError}
        />
      </div>
    </Layout>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getServerSession(context.req, context.res, authOptions);

  if (!session?.user?.id) {
    return {
      redirect: {
        destination: "/auth/signin?callbackUrl=/profile",
        permanent: false,
      },
    };
  }

  try {
    const res = await fetch(
      `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/api/user/profile`,
      { headers: { cookie: context.req.headers.cookie || "" } },
    );
    if (!res.ok) throw new Error("Failed to fetch profile");
    const profile = await res.json();
    return {
      props: {
        initialProfile: profile,
        initialLocale: getLocaleFromRequest(context.req),
      },
    };
  } catch (error) {
    console.error("Error fetching profile:", error);
    return { redirect: { destination: "/", permanent: false } };
  }
};
