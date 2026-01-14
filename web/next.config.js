/** @type {import("next").NextConfig} */
const nextConfig = {
  outputFileTracingIncludes: {
    "/": ["reference_sheets/**"],
  },
};

module.exports = nextConfig;