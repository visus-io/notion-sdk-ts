/**
 * Internal timing helpers. The barrel does not export this module.
 */

/**
 * Return the reason of an aborted signal when it is an `Error`. Otherwise return a standard
 * `AbortError`.
 */
export function abortReason(signal: AbortSignal): Error {
  return signal.reason instanceof Error
    ? signal.reason
    : new DOMException('The operation was aborted.', 'AbortError');
}

/**
 * Pause for the given duration, in milliseconds. When `signal` aborts, reject at once with the
 * abort reason.
 */
export function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  if (!signal) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  return new Promise((resolve, reject) => {
    const onAbort = (): void => {
      clearTimeout(timeoutId);
      reject(abortReason(signal));
    };
    const timeoutId = setTimeout(() => {
      signal.removeEventListener('abort', onAbort);
      resolve();
    }, ms);

    if (signal.aborted) {
      onAbort();
      return;
    }
    signal.addEventListener('abort', onAbort, { once: true });
  });
}
