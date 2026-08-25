import type { Plugin } from "vite";

/**
 * Имя файла версии в корне статики (не хешируется, всегда один URL).
 */
export const APP_VERSION_JSON_FILE = "version.json";

/**
 * Содержимое `version.json` для текущей сборки.
 */
export interface AppVersionFilePayload {
  /** Идентификатор сборки, зашитый также в бандл как `__APP_BUILD_ID__` */
  buildId: string;
}

/**
 * Собирает JSON версии приложения.
 */
export function serializeAppVersionFile(buildId: string): string {
  const payload: AppVersionFilePayload = { buildId };
  return JSON.stringify(payload);
}

/**
 * Плагин: отдаёт `/version.json` в dev и кладёт файл в dist при билде.
 */
export function createAppVersionPlugin(buildId: string): Plugin {
  const body = serializeAppVersionFile(buildId);

  return {
    name: "app-version-json",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const pathOnly = req.url?.split("?")[0];
        if (pathOnly !== `/${APP_VERSION_JSON_FILE}`) {
          next();
          return;
        }
        res.setHeader("Content-Type", "application/json; charset=utf-8");
        res.setHeader("Cache-Control", "no-store");
        res.end(body);
      });
    },
    generateBundle() {
      this.emitFile({
        type: "asset",
        fileName: APP_VERSION_JSON_FILE,
        source: body,
      });
    },
  };
}
