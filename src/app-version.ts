/**
 * Проверка новой версии SPA: buildId из бандла vs `/version.json` на статике.
 */

/** Имя файла версии в корне origin. */
export const APP_VERSION_JSON_FILE = "version.json";

/** Интервал опроса `/version.json`, пока вкладка открыта. */
export const APP_VERSION_POLL_INTERVAL_MS = 15_000;

/** Ключ sessionStorage: remote buildId, под который уже делали reload. */
export const APP_VERSION_RELOAD_GUARD_KEY = "app-version-reloaded-for";

/**
 * Локальный buildId, зашитый Vite на этапе сборки.
 */
export function getLocalBuildId(): string {
  return typeof __APP_BUILD_ID__ === "string" ? __APP_BUILD_ID__ : "";
}

/**
 * URL `/version.json` с cache-buster, чтобы CDN/браузер не отдали старый файл.
 */
export function buildVersionCheckUrl(nowMs: number, baseUrl = "/"): string {
  const normalizedBase = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  return `${normalizedBase}${APP_VERSION_JSON_FILE}?t=${nowMs}`;
}

/**
 * Достаёт buildId из JSON `/version.json`.
 */
export function parseRemoteBuildId(payload: unknown): string | null {
  if (
    payload == null ||
    typeof payload !== "object" ||
    Array.isArray(payload)
  ) {
    return null;
  }
  if (!("buildId" in payload)) {
    return null;
  }
  const buildId = (payload as { buildId: unknown }).buildId;
  if (typeof buildId !== "string") {
    return null;
  }
  const trimmed = buildId.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/**
 * Есть ли на статике другой билд, чем в текущем JS.
 */
export function hasRemoteBuildChanged(
  localBuildId: string,
  remoteBuildId: string,
): boolean {
  if (!localBuildId || !remoteBuildId) {
    return false;
  }
  return localBuildId !== remoteBuildId;
}

/**
 * Качает `/version.json` без HTTP-кеша и возвращает remote buildId.
 */
export async function fetchRemoteBuildId(
  nowMs = Date.now(),
  baseUrl = "/",
): Promise<string | null> {
  const url = buildVersionCheckUrl(nowMs, baseUrl);
  const response = await fetch(url, {
    cache: "no-store",
    headers: {
      Accept: "application/json",
      "Cache-Control": "no-store, no-cache, must-revalidate",
      Pragma: "no-cache",
    },
  });
  if (!response.ok) {
    return null;
  }
  const payload: unknown = await response.json();
  return parseRemoteBuildId(payload);
}

/**
 * Просит Service Worker проверить обновление (не блокирует reload, если SW нет).
 */
export async function pingServiceWorkerUpdate(): Promise<void> {
  if (!("serviceWorker" in navigator)) {
    return;
  }
  const registration = await navigator.serviceWorker.getRegistration();
  await registration?.update();
}

/**
 * Снимает Service Worker и Cache Storage, затем жёстко перезагружает страницу.
 */
export async function reloadAppClearingCaches(): Promise<void> {
  try {
    if ("serviceWorker" in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(
        registrations.map((registration) => registration.unregister()),
      );
    }
  } catch {
    // ignore
  }

  try {
    if ("caches" in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map((key) => caches.delete(key)));
    }
  } catch {
    // ignore
  }

  const url = new URL(window.location.href);
  url.searchParams.set("_v", String(Date.now()));
  window.location.replace(url.toString());
}
