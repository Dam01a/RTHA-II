import { useEffect, useState } from "react";
import { ensureProviderDirectorySeeded, subscribeProviders } from "../lib/providers";
import type { Provider } from "../types/health";

/**
 * Loads the shared provider directory. Seeding writes require an authenticated user;
 * reads work once Firestore rules allow `providers` reads (deployed).
 */
export function useProviders(uid: string | undefined) {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let unsub: (() => void) | undefined;
    let cancelled = false;

    unsub = subscribeProviders(
      (list) => {
        if (!cancelled) {
          setProviders(list);
          setLoading(false);
          setError(null);
        }
      },
      (err) => {
        if (!cancelled) {
          console.error("[providers] subscribe failed", {
            error: err instanceof Error ? { name: err.name, message: err.message, stack: err.stack } : String(err),
          });
          setError(err);
          setLoading(false);
        }
      }
    );

    if (uid) {
      void ensureProviderDirectorySeeded();
    }

    return () => {
      cancelled = true;
      unsub?.();
    };
  }, [uid]);

  return { providers, loading, error };
}
