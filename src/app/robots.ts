import type { MetadataRoute } from "next";

const BASE = process.env.NEXT_PUBLIC_URL || "https://b.rozo.ai";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // /history and /profile stay crawlable so Google can read their noindex.
      disallow: ["/api/"],
    },
    sitemap: `${BASE}/sitemap.xml`,
  };
}
