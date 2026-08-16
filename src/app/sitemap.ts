import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: "https://music-flow-yb69.vercel.app",
      lastModified: new Date(),
    },
  ];
}