"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { UserProfileCard } from "@/components/users/UserProfileCard";
import { cn } from "@/lib/utils";

type ProfileResponse = {
  id: string;
  username: string;
  joinedAt: string;
  joinedCircles: number;
  messagesSent: number;
};

type JoinedCircle = {
  name: string;
  slug: string;
};

type CirclesResponse = JoinedCircle[];

export default function UserProfilePage({
  params,
}: {
  params: { username: string };
}) {
  const username = params.username;
  const [profile, setProfile] = React.useState<ProfileResponse | null>(null);
  const [circles, setCircles] = React.useState<JoinedCircle[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!username) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [profileRes, circlesRes] = await Promise.all([
          fetch(`/api/users/profile?username=${encodeURIComponent(username)}`, {
            cache: "no-store",
          }),
          fetch(`/api/circles/by-user?username=${encodeURIComponent(username)}`, {
            cache: "no-store",
          }).catch(() => null),
        ]);

        if (cancelled) return;

        if (!profileRes.ok) {
          const data = await profileRes.json().catch(() => ({}));
          setError(data?.error ?? "Profile not found");
          setProfile(null);
          setCircles([]);
          return;
        }

        const profileData = (await profileRes.json()) as ProfileResponse;
        setProfile(profileData);

        if (circlesRes && circlesRes.ok) {
          const circleData = (await circlesRes.json()) as CirclesResponse;
          setCircles(circleData ?? []);
        } else {
          setCircles([]);
        }
      } catch {
        if (!cancelled) {
          setError("Failed to load profile");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [username]);

  return (
    <div
      className="min-h-dvh bg-gray-50/80 dark:bg-black/80 text-gray-900 dark:text-white"
      style={{
        paddingTop: "env(safe-area-inset-top)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      <div className="mx-auto max-w-3xl px-4 py-4">
        <div className="mb-4 flex items-center gap-3">
          <Link
            href="/circles"
            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 hover:text-gray-900 dark:border-white/10 dark:bg-white/5 dark:text-white/70"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <h1 className="text-lg font-bold truncate">
            {profile?.username ?? username}
          </h1>
        </div>

        {error ? (
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        ) : !profile ? (
          <p className="text-sm text-gray-500 dark:text-white/60">
            Profile not found.
          </p>
        ) : (
          <div className="space-y-6">
            <UserProfileCard
              username={profile.username}
              joinedCircles={profile.joinedCircles}
              messagesSent={profile.messagesSent}
              joinedAt={profile.joinedAt}
            />

            <section>
              <h2 className="mb-2 text-sm font-semibold text-gray-800 dark:text-white">
                Circles
              </h2>
              {circles.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-white/60">
                  This user has not joined any circles yet.
                </p>
              ) : (
                <ul className="space-y-1">
                  {circles.map((c) => (
                    <li key={c.slug}>
                      <Link
                        href={`/circles/${encodeURIComponent(c.slug)}`}
                        className={cn(
                          "text-sm text-violet-700 hover:underline dark:text-violet-300"
                        )}
                      >
                        {c.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        )}
      </div>
    </div>
  );
}

