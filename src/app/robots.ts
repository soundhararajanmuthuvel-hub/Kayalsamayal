import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/checkout",
          "/confirmation",
          "/order-confirmation",
          "/thank-you",
          "/cart",
          "/api/",
        ],
      },
    ],
    sitemap: "https://www.kayalsamayal.in/sitemap.xml",
  };
}
