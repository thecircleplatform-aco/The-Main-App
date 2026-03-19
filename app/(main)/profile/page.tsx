import { SettingsView } from "@/components/settings/SettingsView";

export default function ProfilePage() {
  return (
    <div className="relative min-h-dvh w-full bg-violet-50/60 text-slate-900 dark:bg-transparent dark:text-slate-100">
      <div className="mx-auto w-full max-w-3xl">
        <SettingsView />
      </div>
    </div>
  );
}

