import { useEffect } from "react";
import {
  APP_VERSION_POLL_INTERVAL_MS,
  APP_VERSION_RELOAD_GUARD_KEY,
  fetchRemoteBuildId,
  getLocalBuildId,
  hasRemoteBuildChanged,
  pingServiceWorkerUpdate,
  reloadAppClearingCaches,
} from "../app-version";

/**
 * Сравнивает зашитый buildId с `/version.json` сразу и каждые 15 с.
 * При новой сборке сбрасывает кеш и перезагружает страницу без баннера.
 */
export function useAppVersionAutoReload(): void {
  useEffect(() => {
    const localBuildId = getLocalBuildId();
    if (!localBuildId) {
      return;
    }

    let cancelled = false;
    let reloading = false;

    const check = async () => {
      if (cancelled || reloading) {
        return;
      }
      try {
        void pingServiceWorkerUpdate();
        const remoteBuildId = await fetchRemoteBuildId(
          Date.now(),
          import.meta.env.BASE_URL || "/",
        );
        if (!remoteBuildId || cancelled || reloading) {
          return;
        }
        if (!hasRemoteBuildChanged(localBuildId, remoteBuildId)) {
          return;
        }
        if (
          sessionStorage.getItem(APP_VERSION_RELOAD_GUARD_KEY) === remoteBuildId
        ) {
          return;
        }
        sessionStorage.setItem(APP_VERSION_RELOAD_GUARD_KEY, remoteBuildId);
        reloading = true;
        await reloadAppClearingCaches();
      } catch {
        // сеть / 404 старого деплоя без version.json
      }
    };

    void check();
    const timerId = window.setInterval(() => {
      void check();
    }, APP_VERSION_POLL_INTERVAL_MS);

    const onResume = () => {
      void check();
    };
    document.addEventListener("visibilitychange", onResume);
    window.addEventListener("focus", onResume);
    window.addEventListener("online", onResume);

    return () => {
      cancelled = true;
      window.clearInterval(timerId);
      document.removeEventListener("visibilitychange", onResume);
      window.removeEventListener("focus", onResume);
      window.removeEventListener("online", onResume);
    };
  }, []);
}
