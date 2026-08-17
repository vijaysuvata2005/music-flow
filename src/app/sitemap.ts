import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://music-flow-yb69.vercel.app";

  const categories = [
    "rajasthani",
    "punjabi",
    "haryanvi",
    "90s",
  ];

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },

    {
      url: `${baseUrl}/all-songs`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },

    ...categories.map((category) => ({
      url: `${baseUrl}/category/${category}`,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 0.8,
    })),
  ];
}