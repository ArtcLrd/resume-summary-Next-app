import type { NextConfig } from "next";
require("dotenv").config();

const nextConfig: NextConfig = {
  experimental: {
    serverComponentsExternalPackages : ["pdf-parse"],
  
    },
};

export default nextConfig;
