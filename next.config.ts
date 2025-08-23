import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: false,
  i18n: {
    locales: ["en", "ro"],
    defaultLocale: "ro",
    localeDetection: false
  }
};

export default nextConfig;
