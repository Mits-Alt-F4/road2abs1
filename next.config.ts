import type { NextConfig } from "next";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const withPWA = require("next-pwa")({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
});

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

export default withPWA(nextConfig);
