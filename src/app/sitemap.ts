import type { MetadataRoute } from "next";

const BASE = process.env.NEXT_PUBLIC_URL || "https://b.rozo.ai";

// Only the public, indexable pages. /history, /profile and /share/* carry
// noindex and are deliberately left out.
export default function sitemap(): MetadataRoute.Sitemap {
  return ["", "/topup", "/generate", "/gallery"].map((path) => ({
    url: `${BASE}${path}`,
  }));
}
