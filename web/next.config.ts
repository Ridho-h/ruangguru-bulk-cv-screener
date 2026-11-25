import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["unpdf"],
  outputFileTracingIncludes: {
    "/api/screen": ["./public/sample-cvs/**/*"],
    "/api/samples": ["./public/sample-cvs/**/*"],
  },
};

export default nextConfig;
