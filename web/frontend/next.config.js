/** @type {import('next').NextConfig} */
const nextConfig = {
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

module.exports = nextConfig;
