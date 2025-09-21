import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const now = new Date().toISOString();
  return [
    { url: `${base}/`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/admin`, lastModified: now, changeFrequency: "monthly", priority: 0.2 },
    { url: `${base}/admin/dashboard`, lastModified: now, changeFrequency: "monthly", priority: 0.2 },
  ];
}