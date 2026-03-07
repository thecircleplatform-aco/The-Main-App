"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { GlassPanel } from "@/components/glass-panel";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { DeleteAccountModal } from "@/components/settings/DeleteAccountModal";
import { VersionDisplay, useVersion } from "@/components/VersionDisplay";
import { cn } from "@/lib/utils";
import { panelFade, fadeInUp, softSpring } from "@/lib/animations";

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
  const version = useVersion();

  React.useEffect(() => {
    void loadSettings();
  }, []);

  async function loadSettings() {
    setStatus("loading");
    setMessage(null);
    try {
      const res = await fetch("/api/settings");
      if (!res.ok) {
        throw new Error(`Failed to load settings (${res.status})`);
      }
      const data = (await res.json()) as SettingsPayload;
      setProfile(data.profile ?? {});
      setPrivacy(data.privacy ?? {});
      setNotifications(data.notifications ?? {});
      setAi(data.ai ?? {});
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
          <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[11px] font-medium text-white/70 backdrop-blur-xl">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
            User settings
          </div>
          <h1 className="mt-2 text-lg font-semibold text-white">
            Circle preferences
          </h1>
          <p className="mt-1 text-xs text-white/50">
            Control how the council interacts with you and how your data is
            handled.
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
          className="text-[11px] text-white/70"
        >
          {message}
        </motion.div>
      )}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1.3fr)]">
        {/* Left column: profile + privacy */}
        <div className="space-y-4">
          <GlassPanel className="p-5">
            <h2 className="text-sm font-semibold text-white">
              Profile settings
            </h2>
            <p className="mt-1 text-[11px] text-white/55">
              Configure how you appear in the product.
            </p>
            <div className="mt-3 space-y-2 text-xs">
              <div className="space-y-1">
                <label className="text-[11px] text-white/60">
                  Display name
                </label>
                <Input
                  value={profile.displayName ?? ""}
                  onChange={(e) =>
                    setProfile((p) => ({ ...p, displayName: e.target.value }))
                  }
                  placeholder="How should we refer to you?"
                  className="h-9 rounded-2xl border-white/15 bg-white/5 text-xs"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] text-white/60">Bio</label>
                <Textarea
                  value={profile.bio ?? ""}
                  onChange={(e) =>
                    setProfile((p) => ({ ...p, bio: e.target.value }))
                  }
                  placeholder="Short description that gives context to the council…"
                  className="min-h-[80px] rounded-2xl border-white/15 bg-white/5 text-xs"
                />
              </div>
            </div>
          </GlassPanel>

          <GlassPanel className="p-5">
            <h2 className="text-sm font-semibold text-white">
              Privacy settings
            </h2>
            <p className="mt-1 text-[11px] text-white/55">
              Decide what is visible and how ideas are handled.
            </p>
            <div className="mt-3 space-y-2 text-xs">
              <label className="flex items-start gap-2 text-[11px] text-white/70">
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
                  <span className="block text-[10px] text-white/45">
                    Allow your display name and bio to appear in shared views.
                  </span>
                </span>
              </label>

              <label className="flex items-start gap-2 text-[11px] text-white/70">
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
                  <span className="block text-[10px] text-white/45">
                    Allow anonymous use of your ideas to improve AI behavior.
                  </span>
                </span>
              </label>

              <div className="space-y-1 pt-1">
                <label className="text-[11px] text-white/60">
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
                  className="h-9 w-24 rounded-2xl border-white/15 bg-white/5 text-xs"
                />
                <p className="text-[10px] text-white/45">
                  Controls how long conversation history is retained.
                </p>
              </div>
            </div>
          </GlassPanel>
        </div>

        {/* Right column: notifications + AI + data */}
        <div className="space-y-4">
          <GlassPanel className="p-5">
            <h2 className="text-sm font-semibold text-white">
              Notification settings
            </h2>
            <p className="mt-1 text-[11px] text-white/55">
              Control what Circle emails you about.
            </p>
            <div className="mt-3 space-y-2 text-xs">
              <label className="flex items-start gap-2 text-[11px] text-white/70">
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
                  <span className="block text-[10px] text-white/45">
                    Occasional recap of your most interesting council sessions.
                  </span>
                </span>
              </label>

              <label className="flex items-start gap-2 text-[11px] text-white/70">
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
                  <span className="block text-[10px] text-white/45">
                    News about major launches and improvements.
                  </span>
                </span>
              </label>

              <label className="flex items-start gap-2 text-[11px] text-white/70">
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
                  <span className="block text-[10px] text-white/45">
                    Get notified when long-running analyses complete.
                  </span>
                </span>
              </label>
            </div>
          </GlassPanel>

          <GlassPanel className="p-5">
            <h2 className="text-sm font-semibold text-white">
              AI interaction
            </h2>
            <p className="mt-1 text-[11px] text-white/55">
              Tune how the council talks to you.
            </p>
            <div className="mt-3 grid gap-3 text-xs sm:grid-cols-2">
              <div className="space-y-1">
                <label className="text-[11px] text-white/60">Formality</label>
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
                <label className="text-[11px] text-white/60">
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
              <label className="flex items-start gap-2 text-[11px] text-white/70">
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
                  <span className="block text-[10px] text-white/45">
                    When enabled, agents can challenge each other more
                    aggressively before responding to you.
                  </span>
                </span>
              </label>
            </div>
          </GlassPanel>

          <GlassPanel className="p-5">
            <h2 className="text-sm font-semibold text-white">Data & account</h2>
            <p className="mt-1 text-[11px] text-white/55">
              Export your data or remove your account from Circle.
            </p>
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
          </GlassPanel>

          <GlassPanel className="p-5">
            <h2 className="text-sm font-semibold text-white">Version & updates</h2>
            <p className="mt-1 text-[11px] text-white/55">
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
              className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-cyan-400 transition-colors hover:text-cyan-300"
            >
              View what&apos;s new
              <span className="text-[10px]">→</span>
            </Link>
          </GlassPanel>

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

