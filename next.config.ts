import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    rules: {
      "*.svg": {
        loaders: ["@svgr/webpack"],
        as: "*.js",
      },
    },
  },
  webpack(config, { dev }) {
    // 이 환경에서는 파일 캐시가 의존성 스냅샷 생성에 실패해
    // 최초 컴파일과 재시작이 크게 지연된다. 개발 중에는 실패하는
    // 디스크 캐시 대신 프로세스 수명 동안 유지되는 메모리 캐시를 쓴다.
    if (dev) {
      config.cache = { type: "memory" };
    }

    config.module.rules.push({
      test: /\.svg$/i,
      issuer: /\.[jt]sx?$/,
      use: ["@svgr/webpack"],
    });

    return config;
  },
};

export default nextConfig;
