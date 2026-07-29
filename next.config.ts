import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["http://192.168.2.10:3000", "http://0.0.0.0:3000"],
};

export default nextConfig;
