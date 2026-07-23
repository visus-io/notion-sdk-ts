import { afterAll, afterEach, beforeAll } from 'vitest';
import { server } from './mswServer';

/** Wires the shared MSW server into a test file's lifecycle hooks. */
export function useMswServer(): void {
  beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());
}
