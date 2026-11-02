import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Servidor autónomo en .next/standalone para la imagen de Docker.
  output: "standalone",
  // lib/rag.ts lee el índice con fs en tiempo de ejecución; se incluye explícitamente en el build.
  outputFileTracingIncludes: {
    "/api/chat": ["./data/indice-embeddings.json"],
  },
};

export default nextConfig;
