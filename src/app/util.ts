export function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) return reject(new DOMException('aborted', 'AbortError'));
    const onAbort = () => {
      clearTimeout(timer);
      reject(new DOMException('aborted', 'AbortError'));
    };
    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort);
      resolve();
    }, ms);
    signal?.addEventListener('abort', onAbort, { once: true });
  });
}

export const isAbort = (e: unknown): boolean => e instanceof DOMException && e.name === 'AbortError';

export const randomSeed = (): number => crypto.getRandomValues(new Uint32Array(1))[0]!;

export const focusOnMount = (node: HTMLElement) => node.focus();

export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
