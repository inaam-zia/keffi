/** Drop placeholder/broken menu image paths so cards never request an invalid URL. */
export function sanitizeMenuImageUrl(imageUrl: string | null | undefined): string | null {
  if (!imageUrl) return null;
  const trimmed = imageUrl.trim();
  if (!trimmed || trimmed === "null" || trimmed === "undefined") return null;

  // Seeded local paths — those files were never added to public/
  if (trimmed.startsWith("/menu/items/")) return null;

  if (trimmed.startsWith("/") && !trimmed.startsWith("//")) return trimmed;

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === "http:" || parsed.protocol === "https:") return trimmed;
  } catch {
    return null;
  }
  return null;
}

/** Menu cards display ~80px; thumbs are 240px for retina + fast load. */
export function menuThumbUrl(imageUrl: string | null | undefined): string | null {
  const url = sanitizeMenuImageUrl(imageUrl);
  if (!url) return null;
  if (url.startsWith("/menu/items/") && !url.includes("/thumbs/")) {
    return url.replace("/menu/items/", "/menu/items/thumbs/");
  }
  return url;
}
