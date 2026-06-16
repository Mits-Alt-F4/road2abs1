import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.coop.ch" },
      { protocol: "https", hostname: "www.coop.ch" },
      { protocol: "https", hostname: "files.coop.ch" },
      { protocol: "https", hostname: "**.migros.ch" },
      { protocol: "https", hostname: "www.migros.ch" },
      { protocol: "https", hostname: "image.migros.ch" },
      { protocol: "https", hostname: "**.migros-cdn.ch" },
      { protocol: "https", hostname: "**.cloudinary.com" },
    ],
    unoptimized: false,
  },
};

export default nextConfig;
