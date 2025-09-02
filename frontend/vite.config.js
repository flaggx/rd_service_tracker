import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Prefer BACKEND_URL if provided; otherwise default to the dev service name
const proxyTarget = (globalThis?.process?.env?.BACKEND_URL) || "http://backend-dev:3001";

export default defineConfig({
    plugins: [react()],
    server: {
        host: true,
        port: 5173,
        proxy: {
            "/api": {
                target: proxyTarget,
                changeOrigin: true,
                // Strip the /api prefix so /api/auth/login -> /auth/login on the backend
                rewrite: (path) => path.replace(/^\/api/, "")
            }
        }
    }
});