import { useCallback, useEffect, useRef, useState } from 'react';

export interface UseFetchResult<T> {
  data: T | undefined;
  loading: boolean;
  error: Error | undefined;
  refetch: () => void;
}

/**
 * Generic data-fetching hook. Wraps any async producer function and exposes
 * { data, loading, error, refetch }. Has no external dependencies and works
 * with any () => Promise<T>, e.g. the functions in src/data/api.ts.
 */
export function useFetch<T>(
  fetcher: () => Promise<T>,
  deps: ReadonlyArray<unknown> = []
): UseFetchResult<T> {
  const [data, setData] = useState<T | undefined>(undefined);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | undefined>(undefined);
  const [reloadToken, setReloadToken] = useState(0);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(undefined);

    const executeFetch = (attempt = 0) => {
      fetcher()
        .then((result) => {
          if (!cancelled) {
            setData(result);
            setLoading(false);
          }
        })
        .catch((err) => {
          if (!cancelled) {
            if (attempt < 1) {
              setTimeout(() => {
                if (!cancelled) executeFetch(attempt + 1);
              }, 1200);
            } else {
              setError(err instanceof Error ? err : new Error(String(err)));
              setLoading(false);
            }
          }
        });
    };

    executeFetch(0);

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reloadToken, ...deps]);

  const refetch = useCallback(() => {
    setReloadToken((t) => t + 1);
  }, []);

  return { data, loading, error, refetch };
}
