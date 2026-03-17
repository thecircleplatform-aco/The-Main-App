import { query } from "@/database/db";

/**
 * Generate a search query for a circle image based on its name and category.
 */
function buildImageSearchQuery(name: string, category: string): string {
  const topic = name.trim() || category.trim();
  const base = topic || "community";
  if (/anime/i.test(base)) return "anime illustration community avatar square";
  if (/programming|coding|developer|engineer/i.test(base))
    return "programming coding workspace illustration square";
  if (/startup|founder|business|founders/i.test(base))
    return "startup founders business illustration square";
  if (/bts|k-pop|kpop/i.test(base)) return "kpop concert aesthetic illustration square";
  if (/game|gaming|esports|controller/i.test(base))
    return "gaming controller neon illustration square";
  return `${base} community illustration square`;
}

/**
 * Try to fetch a representative image URL for a circle using Unsplash or Pexels.
 * Returns null if no provider is configured or if the request fails.
 *
 * NOTE: This runs on the server. Make sure UNSPLASH_ACCESS_KEY or PEXELS_API_KEY
 * is configured in the environment before relying on it.
 */
export async function fetchCircleImageUrlForCircle(params: {
  name: string;
  category: string;
}): Promise<string | null> {
  const { name, category } = params;
  const queryText = buildImageSearchQuery(name, category);

  const unsplashKey = process.env.UNSPLASH_ACCESS_KEY;
  const pexelsKey = process.env.PEXELS_API_KEY;

  try {
    if (pexelsKey) {
      const url = new URL("https://api.pexels.com/v1/search");
      url.searchParams.set("query", queryText);
      url.searchParams.set("per_page", "1");
      url.searchParams.set("orientation", "square");

      const res = await fetch(url.toString(), {
        headers: {
          Authorization: pexelsKey,
        },
      });
      if (!res.ok) return null;
      const data = (await res.json().catch(() => null)) as
        | {
            photos?: {
              src?: { medium?: string; large?: string; large2x?: string };
            }[];
          }
        | null;
      const first = data?.photos?.[0];
      const src = first?.src?.large2x || first?.src?.large || first?.src?.medium;
      return src ?? null;
    }

    if (unsplashKey) {
      const url = new URL("https://api.unsplash.com/search/photos");
      url.searchParams.set("query", queryText);
      url.searchParams.set("per_page", "1");
      url.searchParams.set("orientation", "squarish");

      const res = await fetch(url.toString(), {
        headers: {
          Authorization: `Client-ID ${unsplashKey}`,
        },
      });
      if (!res.ok) return null;
      const data = (await res.json().catch(() => null)) as
        | {
            results?: {
              urls?: { small?: string; regular?: string; full?: string };
            }[];
          }
        | null;
      const first = data?.results?.[0];
      const urls = first?.urls;
      const src = urls?.regular || urls?.small || urls?.full;
      return src ?? null;
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Convenience helper to recompute and persist a circle image URL for a given circle id.
 * Useful for "reset to auto" admin actions.
 */
export async function regenerateCircleImageUrl(circleId: string): Promise<string | null> {
  const circleRes = await query<{
    id: string;
    name: string;
    category: string;
  }>("SELECT id, name, category FROM circles WHERE id = $1", [circleId]);
  const circle = circleRes.rows[0];
  if (!circle) return null;

  const imageUrl = await fetchCircleImageUrlForCircle({
    name: circle.name,
    category: circle.category,
  });

  await query("UPDATE circles SET circle_image_url = $1, updated_at = now() WHERE id = $2", [
    imageUrl,
    circle.id,
  ]);

  return imageUrl;
}

