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
    version: "0.3.0",
    aiVersion: "Lumana 1.4",
    date: "2026-03-08",
    features: [
      {
        title: "Admin user management",
        description: "Right-click users in the admin panel to change username/email, reset password, block, shadow ban, delete, view IP history, and view account activity.",
        icon: "settings",
      },
      {
        title: "Block & shadow ban",
        description: "Blocked or shadow-banned users are logged out and see a support message on login. Blocked users can contact support from the help center.",
        icon: "shield",
      },
      {
        title: "IP & device tracking",
        description: "Login and registration IPs are stored. One account per device; abuse detection limits account creation from the same device.",
        icon: "version",
      },
      {
        title: "Support tickets",
        description: "Blocked users can submit support messages. Admins view and respond at /admin/support and can unblock accounts.",
        icon: "message",
      },
      {
        title: "Help center",
        description: "Dedicated /help page for blocked users to contact support. Admin action logs for audit.",
        icon: "heart",
      },
    ],
  },
  {
    version: "0.2.0",
    aiVersion: "Lumana 1.4",
    date: "2026-03-07",
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
    date: "2026-03-06",
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
