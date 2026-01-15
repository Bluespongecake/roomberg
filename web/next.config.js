/** @type {import("next").NextConfig} */
const nextConfig = {
  experimental: {
    outputFileTracingIncludes: {
      "/": ["reference_sheets/**"],
    },
  },
};

module.exports = nextConfig;
