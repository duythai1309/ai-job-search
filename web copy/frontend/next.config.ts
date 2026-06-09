import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.vietnamworks.com" },
      { protocol: "https", hostname: "**.topcv.vn" },
      { protocol: "https", hostname: "**.itviec.com" },
      { protocol: "https", hostname: "**.careerviet.vn" },
      { protocol: "https", hostname: "**.supabase.co" },
    ],
  },
};

export default nextConfig;
