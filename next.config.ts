import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /**
   * node-ical が内部で temporal-polyfill / rrule-temporal を読み込む。
   * バンドルに取り込むと BigInt 周りが壊れ「h.BigInt is not a function」になるため、
   * Node 上でそのまま require させる。
   */
  serverExternalPackages: ["node-ical", "rrule-temporal", "temporal-polyfill"],

  async redirects() {
    return [{ source: "/konshu", destination: "/weeklyAgenda", permanent: true }];
  },
};

export default nextConfig;
