import { useState } from 'react';

export interface SuspenseResource<T> {
  read: () => T;
}

/**
 * Given a function which returns a promise, returns a Suspense resource object.
 * The resource object can be read from a descendent of a Suspense element,
 * allowing for fallback states for loading or error handling.
 */
function useAsync<T, Args extends unknown[]>(
  createPromise: (...args: Args) => Promise<T>,
  ...args: Args
): SuspenseResource<T> {
  const [read] = useState(() => {
    let hasData = false;
    let data: T;
    let hasError = false;
    let error: unknown;

    const promise = createPromise(...args)
      .then((nextData) => {
        hasData = true;
        data = nextData;
      })
      .catch((nextError) => {
        hasError = true;
        error = nextError;
      });

    return () => {
      if (hasData) {
        return data;
      }

      if (hasError) {
        throw error;
      }

      throw promise;
    };
  });

  return { read };
}

export default useAsync;
