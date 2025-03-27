import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: false,
  
  // Add transpilePackages to handle MUI and other package imports
  transpilePackages: [
    '@mui/material',
    '@mui/icons-material',
    '@mui/x-date-pickers',
    '@aldabil/react-scheduler',
  ],
};

export default nextConfig;
