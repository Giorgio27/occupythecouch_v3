import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { GetServerSideProps } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import prisma from "@/lib/prisma";
import { getCineforumLayoutProps } from "@/lib/server/cineforum-layout-props";
import CineforumLayout from "@/components/CineforumLayout";
import { useAdminAccess } from "@/lib/client/hooks/useAdminAccess";
import {
  fetchNotificationSettings,
  saveNotificationSettings,
  sendTestNotification,
} from "@/lib/client/cineforum/admin-notifications";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Bell,
  Bot,
  Hash,
  CheckCircle2,
  ExternalLink,
  Send,
  Globe,
} from "lucide-react";

interface AdminNotificationsPageProps {
  cineforumId: string;
  cineforumName: string;
}

export default function AdminNotificationsPage({
  cineforumId,
  cineforumName,
}: AdminNotificationsPageProps) {
  const { t } = useTranslation("admin");
  const { isAdmin, isLoading: isLoadingAccess } = useAdminAccess(cineforumId);

  const [botToken, setBotToken] = useState("");
  const [chatId, setChatId] = useState("");
  const [locale, setLocale] = useState("it");
  const [botTokenSet, setBotTokenSet] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<"success" | "error" | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAdmin) return;
    fetchNotificationSettings(cineforumId)
      .then((data) => {
        setBotTokenSet(data.botTokenSet);
        setChatId(data.chatId ?? "");
        setLocale(data.locale ?? "it");
      })
      .catch(() => setError(t("notifications.loadError")))
      .finally(() => setLoading(false));
  }, [cineforumId, isAdmin, t]);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      await saveNotificationSettings(cineforumId, botToken, chatId, locale);
      setSaved(true);
      if (botToken.trim()) {
        setBotTokenSet(true);
        setBotToken("");
      }
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setError(t("notifications.saveError"));
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    if (!botTokenSet || !chatId) {
      setError(t("notifications.testNotConfigured"));
      return;
    }
    setTesting(true);
    setTestResult(null);
    setError(null);
    try {
      await sendTestNotification(cineforumId);
      setTestResult("success");
      setTimeout(() => setTestResult(null), 4000);
    } catch {
      setTestResult("error");
      setError(t("notifications.testError"));
    } finally {
      setTesting(false);
    }
  };

  if (isLoadingAccess || loading) {
    return (
      <CineforumLayout cineforumId={cineforumId} cineforumName={cineforumName}>
        <div className="mx-auto max-w-xl px-4 py-6 text-sm text-muted-foreground">
          {t("notifications.loading")}
        </div>
      </CineforumLayout>
    );
  }

  if (!isAdmin) return null;

  const isConfigured = botTokenSet && !!chatId;

  return (
    <CineforumLayout cineforumId={cineforumId} cineforumName={cineforumName}>
      <div className="flex w-full flex-col gap-6">
        {/* Header */}
        <div className="space-y-1">
          <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
            <Bell className="h-6 w-6 text-primary" />
            {t("notifications.pageTitle")}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t("notifications.pageSubtitle")}
          </p>
        </div>

        {/* How-to guide */}
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-primary">
              {t("notifications.howToTitle")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <ol className="list-decimal space-y-2 pl-4">
              <li>
                {t("notifications.step1")}{" "}
                <a
                  href="https://t.me/BotFather"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-medium text-primary underline-offset-4 hover:underline"
                >
                  @BotFather
                  <ExternalLink className="h-3 w-3" />
                </a>
              </li>
              <li>{t("notifications.step2")}</li>
              <li>{t("notifications.step3")}</li>
              <li>
                {t("notifications.step4")}{" "}
                <code className="rounded bg-muted px-1 py-0.5 text-xs font-mono">
                  /getUpdates
                </code>{" "}
                {t("notifications.step4b")}
              </li>
            </ol>
          </CardContent>
        </Card>

        {/* Error banner */}
        {error && (
          <div className="rounded-md border border-red-500/40 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Settings form */}
        <Card>
          <CardContent className="space-y-5 pt-6">
            {/* Bot Token */}
            <div className="space-y-2">
              <Label
                htmlFor="botToken"
                className="flex items-center gap-2 text-sm font-medium"
              >
                <Bot className="h-4 w-4 text-primary/70" />
                {t("notifications.botTokenLabel")}
              </Label>
              {botTokenSet && !botToken && (
                <p className="flex items-center gap-1.5 text-xs text-emerald-600">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {t("notifications.botTokenAlreadySet")}
                </p>
              )}
              <Input
                id="botToken"
                type="password"
                placeholder={
                  botTokenSet
                    ? t("notifications.botTokenPlaceholderUpdate")
                    : t("notifications.botTokenPlaceholder")
                }
                value={botToken}
                onChange={(e) => setBotToken(e.target.value)}
                autoComplete="off"
              />
              <p className="text-xs text-muted-foreground">
                {t("notifications.botTokenHint")}
              </p>
            </div>

            {/* Chat ID */}
            <div className="space-y-2">
              <Label
                htmlFor="chatId"
                className="flex items-center gap-2 text-sm font-medium"
              >
                <Hash className="h-4 w-4 text-primary/70" />
                {t("notifications.chatIdLabel")}
              </Label>
              <Input
                id="chatId"
                type="text"
                placeholder={t("notifications.chatIdPlaceholder")}
                value={chatId}
                onChange={(e) => setChatId(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                {t("notifications.chatIdHint")}
              </p>
            </div>

            {/* Notification language */}
            <div className="space-y-2">
              <Label
                htmlFor="locale"
                className="flex items-center gap-2 text-sm font-medium"
              >
                <Globe className="h-4 w-4 text-primary/70" />
                {t("notifications.localeLabel")}
              </Label>
              <Select value={locale} onValueChange={setLocale}>
                <SelectTrigger id="locale" className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="it">🇮🇹 Italiano</SelectItem>
                  <SelectItem value="en">🇬🇧 English</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {t("notifications.localeHint")}
              </p>
            </div>

            {/* Save */}
            <div className="flex items-center gap-3 pt-1">
              <Button onClick={handleSave} disabled={saving}>
                {saving
                  ? t("notifications.saving")
                  : t("notifications.saveButton")}
              </Button>
              {saved && (
                <span className="flex items-center gap-1.5 text-sm text-emerald-600">
                  <CheckCircle2 className="h-4 w-4" />
                  {t("notifications.savedSuccess")}
                </span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Test message */}
        <Card className={isConfigured ? "" : "opacity-60"}>
          <CardContent className="flex items-center justify-between gap-4">
            <div className="space-y-0.5">
              <p className="text-sm font-medium">
                {t("notifications.testButton")}
              </p>
              {!isConfigured && (
                <p className="text-xs text-muted-foreground">
                  {t("notifications.testNotConfigured")}
                </p>
              )}
            </div>
            <div className="flex items-center gap-3">
              {testResult === "success" && (
                <span className="flex items-center gap-1.5 text-sm text-emerald-600">
                  <CheckCircle2 className="h-4 w-4" />
                  {t("notifications.testSuccess")}
                </span>
              )}
              <Button
                variant="outline"
                onClick={handleTest}
                disabled={testing || !isConfigured}
              >
                <Send className="mr-2 h-4 w-4" />
                {testing
                  ? t("notifications.testing")
                  : t("notifications.testButton")}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </CineforumLayout>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const cineforumProps = await getCineforumLayoutProps(context);
  if ("redirect" in cineforumProps || "notFound" in cineforumProps) {
    return cineforumProps;
  }

  const { cineforumId } = cineforumProps.props as {
    cineforumId: string;
    cineforumName: string;
  };
  const session = await getServerSession(context.req, context.res, authOptions);

  const membership = await prisma.membership.findUnique({
    where: {
      userId_cineforumId: {
        userId: (session?.user as { id: string })?.id,
        cineforumId,
      },
    },
  });

  if (!membership || !["ADMIN", "OWNER"].includes(membership.role)) {
    return {
      redirect: {
        destination: `/cineforum/${cineforumId}`,
        permanent: false,
      },
    };
  }

  return { props: { ...cineforumProps.props } };
};
