/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    // TODO we should probably tidy these up
    // as every domain will need to be queried first
    domains: [
      "assets.coingecko.com",
      "moonmasters.mypinata.cloud",
      "cre8r.vip",
      "raw.githubusercontent.com",
      "ethereum.org",
      "docs.scanto.io",
      "pbs.twimg.com",
    ],
  },
};

module.exports = nextConfig;
