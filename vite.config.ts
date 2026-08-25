import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import viteTsconfigPaths from "vite-tsconfig-paths";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import { createAppVersionPlugin } from "./vite-plugin-app-version";

export default ({ mode }) => {
  const appBuildId = new Date().toISOString();
  console.log(`[vite] app buildId: ${appBuildId}`);

  return defineConfig({
    // depending on your application, base can also be "/"
    base: ``,
    define: {
      __APP_BUILD_ID__: JSON.stringify(appBuildId),
    },
    css: {
      preprocessorOptions: {
        less: {
          math: "always",
          relativeUrls: true,
          javascriptEnabled: true,
        },
      },
    },
    build: {
      outDir: "./dist",
      assetsDir: "assets",
      emptyOutDir: true, // also necessary
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    plugins: [
      createAppVersionPlugin(appBuildId),
      react(),
      viteTsconfigPaths(),
      tailwindcss(),
    ],
    server: {
      // this ensures that the browser opens upon server start
      open: true,
      host: true,
      // this sets a default port to 3000
      port: 4002,
    },
  });
};
