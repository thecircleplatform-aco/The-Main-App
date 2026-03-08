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
    version: "0.2.0",
    aiVersion: "Lumana 1.4",
    date: "March 2025",
    features: [
      {
        title: "Streaming responses",
        description: "AI replies stream in real time with a smooth typewriter effect, similar to ChatGPT.",
        icon: "message",
      },
      {
        title: "Lumana as default",
        description: "Lumana (Circle AI) is now the default companion. Sam, Alex, Maya, and Nova respond when called by name.",
        icon: "sparkle",
      },
      {
        title: "Message actions",
        description: "Copy, feedback (helpful/not helpful), share, and more options on every AI message.",
        icon: "message",
      },
      {
        title: "Edit & regenerate",
        description: "Right-click or long-press your latest message to edit and regenerate the AI reply.",
        icon: "sparkle",
      },
      {
        title: "Context menu",
        description: "Right-click or long-press user messages for Copy, Edit, and Delete. Delete removes the AI reply too.",
        icon: "settings",
      },
      {
        title: "Smart model selection",
        description: "DeepSeek chat (fast) or reasoner (analysis) chosen automatically. Header shows mode and progress.",
        icon: "version",
      },
      {
        title: "Gemini for images",
        description: "Gemini API integrated for future image scanning and vision features.",
        icon: "sparkle",
      },
      {
        title: "Professional UI",
        description: "Refined input, footer, header, and spacing for a cleaner, company-grade experience.",
        icon: "settings",
      },
    ],
  },
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
