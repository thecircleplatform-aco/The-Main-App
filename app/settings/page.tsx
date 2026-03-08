import { SettingsView } from "@/components/settings/SettingsView";
import { GalaxyPageWrapper } from "@/components/GalaxyPageWrapper";

export default function SettingsPage() {
  return (
    <GalaxyPageWrapper>
      <div className="min-h-dvh px-4 pb-20 pt-14 md:px-8">
        <div className="mx-auto max-w-5xl">
          <SettingsView />
        </div>
      </div>
    </GalaxyPageWrapper>
  );
}

