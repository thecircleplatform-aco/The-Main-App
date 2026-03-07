/**
 * Release notes and feature improvements by version.
 */

export type ReleaseFeature = {
  title: string;
  description: string;
  icon?: "sparkle" | "shield" | "message" | "settings" | "trash" | "version" | "heart";
};

export type Release = {
  version: string;
  aiVersion: string;
  date: string;
  features: ReleaseFeature[];
};

export const releases: Release[] = [
  {
    version: "0.1.0",
    aiVersion: "Lumala 1.3",
    date: "2025",
    features: [
      {
        title: "Multi-agent AI council",
        description: "Chat with Visionary, Skeptic, Builder, and Marketer personas that debate and collaborate on your ideas.",
        icon: "message",
      },
      {
        title: "Safe account deletion",
        description: "7-day grace period with feedback collection. Recover your account if you change your mind.",
        icon: "trash",
      },
      {
        title: "Account recovery flow",
        description: "Users who schedule deletion are auto-logged out. Login shows a recovery form to restore access within 7 days.",
        icon: "shield",
      },
      {
        title: "Version tracking",
        description: "App, Git, and AI versions visible in Settings. Track build identity and Lumala model version.",
        icon: "version",
      },
      {
        title: "Release notes page",
        description: "Dedicated changelog with animated feature highlights. See what improved in each version.",
        icon: "sparkle",
      },
      {
        title: "Settings & preferences",
        description: "Profile, privacy, notifications, and AI behavior. Export data or remove your account.",
        icon: "settings",
      },
    ],
  },
];
