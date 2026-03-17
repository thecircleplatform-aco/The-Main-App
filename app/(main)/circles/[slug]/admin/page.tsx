"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Shield } from "lucide-react";
import { CircleAdminPanel } from "@/components/circles/admin/CircleAdminPanel";
import { cn } from "@/lib/utils";

type ChannelItem = { slug: string; name: string };
type CircleData = {
  id: string;
  name: string;
  slug: string;
  circle_image_url?: string | null;
  channelList: ChannelItem[];
};

export default function CircleAdminPage({
  params,
}: {
  params: { slug: string };
}) {
  const slug = params?.slug ?? null;
  const router = useRouter();
  const [circle, setCircle] = React.useState<CircleData | null>(null);
  const [currentUserId, setCurrentUserId] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [forbidden, setForbidden] = React.useState(false);

  React.useEffect(() => {
    if (!slug) return;
    setLoading(true);
    setForbidden(false);
    const origin = typeof window !== "undefined" ? window.location.origin : "";

    Promise.all([
      fetch(`${origin}/api/circles/${encodeURIComponent(slug)}`, {
        cache: "no-store",
        credentials: "include",
      }),
      fetch("/api/me", { credentials: "include" }),
      fetch(`${origin}/api/circles/${encodeURIComponent(slug)}/role`, {
        credentials: "include",
      }),
    ])
      .then(([circleRes, meRes, roleRes]) => {
        if (!circleRes.ok) throw new Error("Circle not found");
        if (!meRes.ok) {
          router.replace("/login");
          return;
        }
        if (!roleRes.ok || roleRes.status === 403 || roleRes.status === 401) {
          setForbidden(true);
          return;
        }
        return roleRes.json().then((roleData) => {
          const role = roleData?.role;
          if (role !== "admin" && !roleData?.isSuperAdmin) {
            setForbidden(true);
            return;
          }
          return circleRes.json().then((circleData: CircleData) => {
            setCircle(circleData);
            return meRes.json().then((me) => {
              setCurrentUserId(me?.id ?? null);
            });
          });
        });
      })
      .catch(() => setForbidden(true))
      .finally(() => setLoading(false));
  }, [slug, router]);

  if (loading || !slug) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-gray-50/80 dark:bg-black/80">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
      </div>
    );
  }

  if (forbidden) {
    return (
      <div
        className="min-h-dvh bg-gray-50/80 dark:bg-black/80 flex flex-col items-center justify-center p-6"
        style={{
          paddingTop: "env(safe-area-inset-top)",
          paddingBottom: "env(safe-area-inset-bottom)",
        }}
      >
        <p className="text-sm text-gray-600 dark:text-white/60 mb-4">
          Only circle admins can access this page.
        </p>
        <Link
          href={`/circles/${encodeURIComponent(slug)}`}
          className="inline-flex items-center gap-2 text-sm font-medium text-violet-600 dark:text-violet-400 hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to circle
        </Link>
      </div>
    );
  }

  if (!circle || !currentUserId) {
    return (
      <div
        className="min-h-dvh bg-gray-50/80 dark:bg-black/80 flex flex-col items-center justify-center p-6"
        style={{
          paddingTop: "env(safe-area-inset-top)",
          paddingBottom: "env(safe-area-inset-bottom)",
        }}
      >
        <p className="text-sm text-gray-600 dark:text-white/60 mb-4">
          Circle not found or not logged in.
        </p>
        <Link
          href="/circles"
          className="inline-flex items-center gap-2 text-sm font-medium text-violet-600 dark:text-violet-400 hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Explore circles
        </Link>
      </div>
    );
  }

  const channelList = circle.channelList ?? [];

  return (
    <div
      className={cn(
        "min-h-dvh w-full bg-gray-50/80 dark:bg-black/80 flex flex-col",
        "md:max-w-4xl md:mx-auto"
      )}
      style={{
        paddingTop: "env(safe-area-inset-top)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      <header className="shrink-0 border-b border-gray-200 dark:border-white/10 bg-white/80 dark:bg-white/5 backdrop-blur-xl">
        <div className="mx-auto max-w-4xl px-4 py-3 flex items-center gap-4">
          <Link
            href={`/circles/${encodeURIComponent(slug)}`}
            className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-white/60 dark:hover:text-white"
            aria-label="Back to circle"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <Shield className="h-5 w-5 text-violet-600 dark:text-violet-400 shrink-0" />
            <h1 className="text-lg font-bold text-gray-900 dark:text-white truncate">
              {circle.name} – Admin
            </h1>
          </div>
        </div>
      </header>

      <main className="flex-1 p-4 overflow-y-auto">
        <CircleAdminPanel
          circleSlug={circle.slug}
          circleName={circle.name}
          currentUserId={currentUserId}
          channelList={channelList}
          circleImageUrl={circle.circle_image_url ?? null}
        />
      </main>
    </div>
  );
}

