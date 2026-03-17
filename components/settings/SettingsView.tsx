"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ChevronDown, FileText, Shield, Sparkles, LogOut, Sun, Moon, Monitor, Smartphone } from "lucide-react";
import { useTheme, type Theme } from "@/contexts/ThemeContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DeleteAccountModal } from "@/components/settings/DeleteAccountModal";
import { VersionDisplay, useVersion } from "@/components/VersionDisplay";
import { cn } from "@/lib/utils";
import { panelFade, fadeInUp, softSpring } from "@/lib/animations";
import { performLogout, redirectToLoginAfterLogout } from "@/lib/logout";

const sectionCardClass =
  "rounded-2xl border border-violet-200/60 bg-violet-50/50 p-5 dark:border-white/10 dark:bg-white/5";

type ProfileSettings = {
  displayName?: string;
  bio?: string;
};

type PrivacySettings = {
  showProfilePublic?: boolean;
  shareIdeasWithModels?: boolean;
  dataRetentionDays?: number;
};

type NotificationSettings = {
  emailSummaries?: boolean;
  productUpdates?: boolean;
  aiActivity?: boolean;
};

type PushNotificationSettings = {
  mentionsEnabled?: boolean;
  updatesEnabled?: boolean;
};

type AiSettings = {
  formality?: "casual" | "balanced" | "formal";
  explanationDepth?: "minimal" | "standard" | "detailed";
  allowAgentDebate?: boolean;
};

type SettingsPayload = {
  profile?: ProfileSettings;
  privacy?: PrivacySettings;
  notifications?: NotificationSettings;
  ai?: AiSettings;
};

type Status = "idle" | "saving" | "loading" | "exporting";

type SessionItem = {
  id: string;
  deviceName: string;
  browser: string;
  os: string;
  ipAddress?: string;
  createdAt: string;
  lastActive: string;
  isCurrent: boolean;
};

function ThemeOption({ mode }: { mode: Theme }) {
  const { theme, setTheme } = useTheme();
  const Icon = mode === "light" ? Sun : mode === "dark" ? Moon : Monitor;
  const label = mode === "system" ? "System" : mode === "light" ? "Light" : "Dark";
  const active = theme === mode;
  return (
    <button
      type="button"
      onClick={() => setTheme(mode)}
      className={cn(
        "flex flex-1 items-center justify-center gap-1.5 rounded-xl px-3 py-1.5 text-[11px] font-medium capitalize transition",
        active ? "bg-white text-black dark:bg-white dark:text-black" : "text-gray-600 hover:bg-gray-200/80 dark:text-white/65 dark:hover:bg-white/10"
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </button>
  );
}

export function SettingsView() {
  const [profile, setProfile] = React.useState<ProfileSettings>({});
  const [privacy, setPrivacy] = React.useState<PrivacySettings>({});
  const [notifications, setNotifications] =
    React.useState<NotificationSettings>({});
  const [ai, setAi] = React.useState<AiSettings>({});
  const [status, setStatus] = React.useState<Status>("loading");
  const [message, setMessage] = React.useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = React.useState(false);
  const [currentUserId, setCurrentUserId] = React.useState<string | null>(null);
  const [showDataAccount, setShowDataAccount] = React.useState(false);
  const [sessions, setSessions] = React.useState<SessionItem[]>([]);
  const [sessionsLoading, setSessionsLoading] = React.useState(false);
  const [revokingId, setRevokingId] = React.useState<string | null>(null);
  const [pushSettings, setPushSettings] = React.useState<PushNotificationSettings>({});
  const version = useVersion();

  React.useEffect(() => {
    void loadSettings();
    void loadSessions();
  }, []);

  async function loadSessions() {
    setSessionsLoading(true);
    try {
      const res = await fetch("/api/auth/sessions");
      if (res.ok) {
        const data = (await res.json()) as { sessions?: SessionItem[] };
        setSessions(data.sessions ?? []);
      }
    } finally {
      setSessionsLoading(false);
    }
  }

  async function revokeSession(sessionId: string) {
    setRevokingId(sessionId);
    try {
      const res = await fetch("/api/auth/revoke-session", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });
      const data = (await res.json()) as { signoutUrl?: string };
      if (data.signoutUrl) {
        redirectToLoginAfterLogout(data.signoutUrl);
        return;
      }
      if (res.ok) await loadSessions();
    } finally {
      setRevokingId(null);
    }
  }

  async function revokeOtherSessions() {
    setRevokingId("all");
    try {
      const res = await fetch("/api/auth/revoke-other-sessions", { method: "POST" });
      if (res.ok) await loadSessions();
    } finally {
      setRevokingId(null);
    }
  }

  async function revokeAllSessions() {
    setRevokingId("all");
    try {
      const res = await fetch("/api/auth/revoke-all-sessions", {
        method: "POST",
        credentials: "include",
      });
      const data = (await res.json()) as { signoutUrl?: string };
      if (data.signoutUrl) {
        redirectToLoginAfterLogout(data.signoutUrl);
        return;
      }
      if (res.ok) await loadSessions();
    } finally {
      setRevokingId(null);
    }
  }

  async function loadSettings() {
    setStatus("loading");
    setMessage(null);
    try {
      const [settingsRes, meRes, pushRes] = await Promise.all([
        fetch("/api/settings"),
        fetch("/api/me"),
        fetch("/api/notification-settings/push"),
      ]);
      if (!settingsRes.ok) {
        throw new Error(`Failed to load settings (${settingsRes.status})`);
      }
      const data = (await settingsRes.json()) as SettingsPayload;
      let profileData = data.profile ?? {};
      // Use account name from signup as default display name when none is set
      const hasDisplayName = typeof profileData.displayName === "string" && profileData.displayName.trim() !== "";
      if (!hasDisplayName && meRes.ok) {
        const me = (await meRes.json()) as { name?: string | null };
        if (me?.name?.trim()) {
          profileData = { ...profileData, displayName: me.name.trim() };
        }
      }
      setProfile(profileData);
      setPrivacy(data.privacy ?? {});
      setNotifications(data.notifications ?? {});
      setAi(data.ai ?? {});

      if (pushRes.ok) {
        const ps = (await pushRes.json()) as {
          mentionsEnabled?: boolean;
          updatesEnabled?: boolean;
        };
        setPushSettings(ps ?? {});
      }
      setStatus("idle");
    } catch (e) {
      setStatus("idle");
      setMessage(
        e instanceof Error ? e.message : "Failed to load settings. Using defaults."
      );
    }
  }

  async function saveSettings() {
    setStatus("saving");
    setMessage(null);
    try {
      const payload: SettingsPayload = {
        profile,
        privacy,
        notifications,
        ai,
      };
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Save failed (${res.status})`);
      }
      setMessage("Settings saved.");
    } catch (e) {
      setMessage(
        e instanceof Error ? e.message : "Failed to save settings."
      );
    } finally {
      setStatus("idle");
    }
  }

  async function exportData() {
    setStatus("exporting");
    setMessage(null);
    try {
      const res = await fetch("/api/settings/export", { method: "POST" });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Export failed (${res.status})`);
      }
      const data = await res.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `circle-export-${new Date()
        .toISOString()
        .replace(/[:.]/g, "-")}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setMessage("Data exported as JSON.");
    } catch (e) {
      setMessage(
        e instanceof Error ? e.message : "Failed to export data."
      );
    } finally {
      setStatus("idle");
    }
  }

  async function openDeleteModal() {
    try {
      const res = await fetch("/api/me");
      const data = (await res.json()) as { id?: string };
      setCurrentUserId(data.id ?? null);
    } catch {
      setCurrentUserId(null);
    }
    setShowDeleteModal(true);
  }

  const busy = status !== "idle";

  async function updatePushSettings(next: PushNotificationSettings) {
    setPushSettings((prev) => ({ ...prev, ...next }));
    try {
      await fetch("/api/notification-settings/push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          mentionsEnabled:
            next.mentionsEnabled ?? pushSettings.mentionsEnabled ?? true,
          updatesEnabled:
            next.updatesEnabled ?? pushSettings.updatesEnabled ?? true,
        }),
      });
    } catch {
      // non-fatal
    }
  }

  return (
    <motion.div
      className="space-y-4"
      variants={panelFade}
      initial="hidden"
      animate="visible"
      transition={{ ...softSpring, delay: 0.04 }}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-gray-100/80 px-3 py-1 text-[11px] font-medium text-gray-700 dark:border-white/10 dark:bg-white/5 dark:text-gray-700 dark:text-white/70">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
            User settings
          </div>
          <h1 className="mt-2 text-lg font-semibold text-gray-900 dark:text-white/90">
            Circle preferences
          </h1>
          <p className="mt-1 text-xs text-gray-500 dark:text-white/50">
            Manage your preferences and how your data is handled.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="md"
            disabled={busy}
            onClick={() => void loadSettings()}
          >
            Reset
          </Button>
          <Button size="md" disabled={busy} onClick={() => void saveSettings()}>
            {status === "saving" ? "Saving…" : "Save changes"}
          </Button>
        </div>
      </div>

      {message && (
        <motion.div
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
          className="text-[11px] text-gray-600 dark:text-gray-700 dark:text-white/70"
        >
          {message}
        </motion.div>
      )}

      <div className={sectionCardClass}>
        <h2 className="text-sm font-semibold text-gray-900 dark:text-white/90 dark:text-gray-900 dark:text-white/90">Appearance</h2>
        <p className="mt-1 text-[11px] text-gray-600 dark:text-white/55 dark:text-gray-600 dark:text-white/55">
          Choose light, dark, or follow system preference.
        </p>
        <div className="mt-3 inline-flex h-9 items-center gap-1 rounded-2xl border border-gray-200 bg-gray-100/80 p-1 dark:border-white/15 dark:bg-white/5">
          {(["light", "dark", "system"] as const).map((mode) => (
            <ThemeOption key={mode} mode={mode} />
          ))}
        </div>
      </div>

      <div className={sectionCardClass}>
        <h2 className="text-sm font-semibold text-gray-900 dark:text-white/90">Legal & account</h2>
        <p className="mt-1 text-[11px] text-gray-600 dark:text-white/55">
          Policies and sign out.
        </p>
        <div className="mt-3 flex flex-col gap-1.5 text-sm">
          <Link
            href="/privacy"
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-gray-800 transition-colors hover:bg-gray-200/80 hover:text-gray-900 dark:text-white/80 dark:hover:bg-white/10 dark:hover:text-white"
          >
            <Shield className="h-4 w-4 text-gray-600 dark:text-white/60" />
            Privacy
          </Link>
          <Link
            href="/terms"
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-gray-800 transition-colors hover:bg-gray-200/80 hover:text-gray-900 dark:text-white/80 dark:hover:bg-white/10 dark:hover:text-white"
          >
            <FileText className="h-4 w-4 text-gray-600 dark:text-white/60" />
            Terms
          </Link>
          <Link
            href="/ai-policy"
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-gray-800 transition-colors hover:bg-gray-200/80 hover:text-gray-900 dark:text-white/80 dark:hover:bg-white/10 dark:hover:text-white"
          >
            <Sparkles className="h-4 w-4 text-gray-600 dark:text-white/60" />
            AI policy
          </Link>
          <button
            type="button"
            onClick={() => void performLogout()}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-gray-800 transition-colors hover:bg-gray-200/80 hover:text-gray-900 dark:text-white/80 dark:hover:bg-white/10 dark:hover:text-white"
          >
            <LogOut className="h-4 w-4 text-gray-600 dark:text-white/60" />
            Log out
          </button>
        </div>
      </div>

      <div className={sectionCardClass}>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white/90 flex items-center gap-2">
              <Smartphone className="h-4 w-4 text-gray-600 dark:text-white/60" />
              Active sessions
            </h2>
            <p className="mt-1 text-[11px] text-gray-600 dark:text-white/55">
              See where your account is signed in. Log out other devices.
            </p>
          </div>
          <Button
            variant="ghost"
            size="md"
            disabled={sessionsLoading}
            onClick={() => void loadSessions()}
          >
            {sessionsLoading ? "Loading…" : "Refresh"}
          </Button>
        </div>
        <div className="mt-3">
          {sessions.length === 0 && !sessionsLoading ? (
            <p className="text-xs text-gray-500 dark:text-white/50 py-2">
              No session data yet. Sign in again to see tracked sessions here.
            </p>
          ) : sessionsLoading && sessions.length === 0 ? (
            <p className="text-xs text-gray-500 dark:text-white/50 py-2">Loading sessions…</p>
          ) : (
            <>
              <ul className="space-y-2">
                {sessions.map((s) => (
                  <li
                    key={s.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-gray-200/60 bg-white/40 px-3 py-2.5 dark:border-white/10 dark:bg-white/5 text-xs"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-gray-900 dark:text-white/90 truncate">
                        {s.deviceName}
                        {s.isCurrent && (
                          <span className="ml-1.5 text-[10px] font-normal text-violet-600 dark:text-violet-400">(this device)</span>
                        )}
                      </p>
                      <p className="text-[11px] text-gray-600 dark:text-white/60 mt-0.5">
                        {s.browser} • {s.os}
                        {s.ipAddress ? ` • ${s.ipAddress}` : ""}
                      </p>
                      <p className="text-[10px] text-gray-500 dark:text-white/45 mt-0.5">
                        Last active: {new Date(s.lastActive).toLocaleString()}
                      </p>
                    </div>
                    {!s.isCurrent && (
                      <Button
                        variant="ghost"
                        size="md"
                        className="shrink-0 text-rose-500 hover:text-rose-600 hover:bg-rose-500/10"
                        disabled={revokingId !== null}
                        onClick={() => revokeSession(s.id)}
                      >
                        {revokingId === s.id ? "Logging out…" : "Log out"}
                      </Button>
                    )}
                  </li>
                ))}
              </ul>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  variant="ghost"
                  size="md"
                  disabled={revokingId !== null || sessions.length <= 1}
                  onClick={() => void revokeOtherSessions()}
                >
                  {revokingId === "all" ? "…" : "Log out all other sessions"}
                </Button>
                <Button
                  variant="ghost"
                  size="md"
                  className="text-rose-500 border-rose-500/50 hover:bg-rose-500/10"
                  disabled={revokingId !== null}
                  onClick={() => void revokeAllSessions()}
                >
                  Log out all sessions
                </Button>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1.3fr)]">
        {/* Left column: privacy */}
        <div className="space-y-4">
          <div className={sectionCardClass}>
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white/90">
              Privacy settings
            </h2>
            <p className="mt-1 text-[11px] text-gray-600 dark:text-white/55">
              Decide what is visible and how ideas are handled.
            </p>
            <div className="mt-3 space-y-2 text-xs">
              <label className="flex items-start gap-2 text-[11px] text-gray-700 dark:text-white/70">
                <input
                  type="checkbox"
                  className="mt-[2px] h-3.5 w-3.5 rounded border-white/40 bg-black/50"
                  checked={privacy.showProfilePublic ?? false}
                  onChange={(e) =>
                    setPrivacy((p) => ({
                      ...p,
                      showProfilePublic: e.target.checked,
                    }))
                  }
                />
                <span>
                  Public profile
                  <span className="block text-[10px] text-gray-500 dark:text-white/45">
                    Allow your display name and bio to appear in shared views.
                  </span>
                </span>
              </label>

              <label className="flex items-start gap-2 text-[11px] text-gray-700 dark:text-white/70">
                <input
                  type="checkbox"
                  className="mt-[2px] h-3.5 w-3.5 rounded border-white/40 bg-black/50"
                  checked={privacy.shareIdeasWithModels ?? true}
                  onChange={(e) =>
                    setPrivacy((p) => ({
                      ...p,
                      shareIdeasWithModels: e.target.checked,
                    }))
                  }
                />
                <span>
                  Share ideas with models
                  <span className="block text-[10px] text-gray-500 dark:text-white/45">
                    Allow anonymous use of your ideas to improve AI behavior.
                  </span>
                </span>
              </label>

              <div className="space-y-1 pt-1">
                <label className="text-[11px] text-gray-600 dark:text-white/60">
                  Data retention (days)
                </label>
                <Input
                  type="number"
                  min={7}
                  max={365}
                  value={privacy.dataRetentionDays ?? 90}
                  onChange={(e) =>
                    setPrivacy((p) => ({
                      ...p,
                      dataRetentionDays: Number(e.target.value || 0),
                    }))
                  }
                  className="h-9 w-24 rounded-xl border-white/10 bg-white/5 text-xs backdrop-blur-none"
                />
                <p className="text-[10px] text-gray-500 dark:text-white/45">
                  Controls how long conversation history is retained.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right column: notifications + AI + data */}
        <div className="space-y-4">
          <div className={sectionCardClass}>
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white/90">
              Notification settings
            </h2>
            <p className="mt-1 text-[11px] text-gray-600 dark:text-white/55">
              Control what Circle emails you about.
            </p>
            <div className="mt-3 space-y-2 text-xs">
              <label className="flex items-start gap-2 text-[11px] text-gray-700 dark:text-white/70">
                <input
                  type="checkbox"
                  className="mt-[2px] h-3.5 w-3.5 rounded border-white/40 bg-black/50"
                  checked={notifications.emailSummaries ?? false}
                  onChange={(e) =>
                    setNotifications((n) => ({
                      ...n,
                      emailSummaries: e.target.checked,
                    }))
                  }
                />
                <span>
                  Session summaries
                  <span className="block text-[10px] text-gray-500 dark:text-white/45">
                    Occasional recap of your sessions.
                  </span>
                </span>
              </label>

              <label className="flex items-start gap-2 text-[11px] text-gray-700 dark:text-white/70">
                <input
                  type="checkbox"
                  className="mt-[2px] h-3.5 w-3.5 rounded border-white/40 bg-black/50"
                  checked={notifications.productUpdates ?? false}
                  onChange={(e) =>
                    setNotifications((n) => ({
                      ...n,
                      productUpdates: e.target.checked,
                    }))
                  }
                />
                <span>
                  Product updates
                  <span className="block text-[10px] text-gray-500 dark:text-white/45">
                    News about major launches and improvements.
                  </span>
                </span>
              </label>

              <label className="flex items-start gap-2 text-[11px] text-gray-700 dark:text-white/70">
                <input
                  type="checkbox"
                  className="mt-[2px] h-3.5 w-3.5 rounded border-white/40 bg-black/50"
                  checked={notifications.aiActivity ?? true}
                  onChange={(e) =>
                    setNotifications((n) => ({
                      ...n,
                      aiActivity: e.target.checked,
                    }))
                  }
                />
                <span>
                  AI activity alerts
                  <span className="block text-[10px] text-gray-500 dark:text-white/45">
                    Get notified when long-running analyses complete.
                  </span>
                </span>
              </label>
            </div>
          </div>

          <div className={sectionCardClass}>
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white/90">
              Mobile push notifications
            </h2>
            <p className="mt-1 text-[11px] text-gray-600 dark:text-white/55">
              Control push alerts on your phone.
            </p>
            <div className="mt-3 space-y-2 text-xs">
              <label className="flex items-start gap-2 text-[11px] text-gray-700 dark:text-white/70">
                <input
                  type="checkbox"
                  className="mt-[2px] h-3.5 w-3.5 rounded border-white/40 bg-black/50"
                  checked={pushSettings.mentionsEnabled ?? true}
                  onChange={(e) =>
                    void updatePushSettings({ mentionsEnabled: e.target.checked })
                  }
                />
                <span>
                  Mentions
                  <span className="block text-[10px] text-gray-500 dark:text-white/45">
                    Notify you when someone uses @username in your circles.
                  </span>
                </span>
              </label>

              <label className="flex items-start gap-2 text-[11px] text-gray-700 dark:text-white/70">
                <input
                  type="checkbox"
                  className="mt-[2px] h-3.5 w-3.5 rounded border-white/40 bg-black/50"
                  checked={pushSettings.updatesEnabled ?? true}
                  onChange={(e) =>
                    void updatePushSettings({ updatesEnabled: e.target.checked })
                  }
                />
                <span>
                  Circle &amp; system updates
                  <span className="block text-[10px] text-gray-500 dark:text-white/45">
                    Announcements and new posts from your circles.
                  </span>
                </span>
              </label>
            </div>
          </div>

          <div className={sectionCardClass}>
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white/90">
              AI interaction
            </h2>
            <p className="mt-1 text-[11px] text-gray-600 dark:text-white/55">
              Tune interaction preferences.
            </p>
            <div className="mt-3 grid gap-3 text-xs sm:grid-cols-2">
              <div className="space-y-1">
                <label className="text-[11px] text-gray-600 dark:text-white/60">Formality</label>
                <div className="inline-flex h-9 items-center gap-1 rounded-2xl border border-white/15 bg-white/5 p-1">
                  {(["casual", "balanced", "formal"] as const).map((mode) => (
                    <button
                      type="button"
                      key={mode}
                      onClick={() =>
                        setAi((a) => ({
                          ...a,
                          formality: mode,
                        }))
                      }
                      className={cn(
                        "flex-1 rounded-xl px-2 py-1 text-[11px] capitalize transition",
                        ai.formality === mode
                          ? "bg-white text-black"
                          : "text-white/65 hover:bg-white/10"
                      )}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] text-gray-600 dark:text-white/60">
                  Explanation depth
                </label>
                <div className="inline-flex h-9 items-center gap-1 rounded-2xl border border-white/15 bg-white/5 p-1">
                  {(["minimal", "standard", "detailed"] as const).map(
                    (level) => (
                      <button
                        type="button"
                        key={level}
                        onClick={() =>
                          setAi((a) => ({
                            ...a,
                            explanationDepth: level,
                          }))
                        }
                        className={cn(
                          "flex-1 rounded-xl px-2 py-1 text-[11px] capitalize transition",
                          ai.explanationDepth === level
                            ? "bg-white text-black"
                            : "text-white/65 hover:bg-white/10"
                        )}
                      >
                        {level}
                      </button>
                    )
                  )}
                </div>
              </div>
            </div>

            <div className="mt-3 text-xs">
              <label className="flex items-start gap-2 text-[11px] text-gray-700 dark:text-white/70">
                <input
                  type="checkbox"
                  className="mt-[2px] h-3.5 w-3.5 rounded border-white/40 bg-black/50"
                  checked={ai.allowAgentDebate ?? true}
                  onChange={(e) =>
                    setAi((a) => ({
                      ...a,
                      allowAgentDebate: e.target.checked,
                    }))
                  }
                />
                <span>
                  Allow rich agent debate
                  <span className="block text-[10px] text-gray-500 dark:text-white/45">
                    When enabled, agents can challenge each other more
                    aggressively before responding to you.
                  </span>
                </span>
              </label>
            </div>
          </div>

          <div className={sectionCardClass}>
            <button
              type="button"
              onClick={() => setShowDataAccount((v) => !v)}
              className="flex w-full items-center justify-between gap-2 text-left focus:outline-none focus:ring-2 focus:ring-white/15 focus:ring-offset-2 focus:ring-offset-black/95 rounded-lg -m-1 p-1"
              aria-expanded={showDataAccount}
            >
              <div>
                <h2 className="text-sm font-semibold text-gray-700 dark:text-white/70">Data & account</h2>
                <p className="mt-0.5 text-[11px] text-gray-500 dark:text-white/45">
                  Export data or remove your account
                </p>
              </div>
              <ChevronDown
                className={cn(
                  "h-4 w-4 shrink-0 text-gray-400 dark:text-white/40 transition-transform",
                  showDataAccount && "rotate-180"
                )}
              />
            </button>
            {showDataAccount && (
              <div className="mt-3 flex flex-col gap-2 text-xs sm:flex-row">
                <Button
                  type="button"
                  variant="ghost"
                  size="md"
                  disabled={busy}
                  onClick={() => void exportData()}
                  className="flex-1"
                >
                  Export data (JSON)
                </Button>
                <Button
                  type="button"
                  size="md"
                  disabled={busy}
                  onClick={() => void openDeleteModal()}
                  className="flex-1 bg-rose-500/90 hover:bg-rose-500 text-xs"
                >
                  Delete account
                </Button>
              </div>
            )}
          </div>

          <div className={sectionCardClass}>
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white/90">Version & updates</h2>
            <p className="mt-1 text-[11px] text-gray-600 dark:text-white/55">
              Current build versions and release notes.
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <VersionDisplay
                appVersion={version?.appVersion}
                gitVersion={version?.gitVersion}
                aiVersion={version?.aiVersion}
                variant="full"
              />
            </div>
            <Link
              href="/changelog"
              className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-violet-600 transition-colors hover:text-violet-700 dark:text-cyan-400 dark:hover:text-cyan-300"
            >
              View what&apos;s new
              <span className="text-[10px]">→</span>
            </Link>
          </div>

          <DeleteAccountModal
            open={showDeleteModal}
            onClose={() => setShowDeleteModal(false)}
            currentUserId={currentUserId}
            onSuccess={() =>
              setMessage(
                "Your account is scheduled for deletion. If this was a mistake, you can cancel within 7 days."
              )
            }
          />
        </div>
      </div>
    </motion.div>
  );
}

