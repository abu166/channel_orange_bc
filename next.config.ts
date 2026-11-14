import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  agentRules: false,
  devIndicators: false, // hide the Next.js "N" dev badge (it never shows in production anyway)
  // docs/IA.md: plans now live inside the Care hub.
  async redirects() {
    return [{ source: "/plans", destination: "/care", permanent: false }];
  },
  turbopack: {
    root: __dirname,
    rules: {
      "*.css": { loaders: ["@tailwindcss/turbopack"], as: "*.css" },
    },
  },
};

export default nextConfig;
