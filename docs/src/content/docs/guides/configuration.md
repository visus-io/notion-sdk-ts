---
title: Configuration & Features
description: Client options, rate limiting, retries, and timeouts.
sidebar:
  order: 5
---

Configure the Notion client with various options to customize behavior.

## Table of Contents

- [Basic Configuration](#basic-configuration)
- [Authentication](#authentication)
- [API Version](#api-version)
- [Request Timeouts](#request-timeouts)
- [Rate Limiting & Retries](#rate-limiting--retries)
- [Custom Fetch Implementation](#custom-fetch-implementation)
- [Base URL Configuration](#base-url-configuration)

---

## Basic Configuration

Initialize the Notion client with configuration options:

```typescript
import { Notion } from '@visus-io/notion-sdk-ts';

const notion = new Notion({
  auth: process.env.NOTION_TOKEN, // Required
  // All other options are optional
});
```

## Authentication

The `auth` parameter is required. It must contain your Notion integration token.

### Getting an Integration Token

1. Go to [https://www.notion.so/my-integrations](https://www.notion.so/my-integrations).
2. Click "New integration".
3. Give the integration a name.
4. Select the capabilities you need.
5. Copy the "Internal Integration Token".

### Using the Token

```typescript
const notion = new Notion({
  auth: process.env.NOTION_TOKEN,
});
```

**Security best practice:** Always use environment variables for tokens. Do not hardcode tokens
in your code.

```bash
# .env file
NOTION_TOKEN=secret_your_token_here
```

```typescript
// Load from .env
import { config } from 'dotenv';
config();

const notion = new Notion({
  auth: process.env.NOTION_TOKEN,
});
```

---

## API Version

The SDK uses Notion API version `2026-03-11`. This version is a fixed constant. You cannot
override it with client options. All schemas, request bodies, and helpers depend on this version.

### Finding the Target Version

The SDK exports the target version as a read-only constant:

```typescript
import { NOTION_VERSION } from '@visus-io/notion-sdk-ts';

console.log(NOTION_VERSION); // '2026-03-11'

// Useful for logging or conditional logic
console.log(`Using Notion API version: ${NOTION_VERSION}`);
```

Every outgoing HTTP request carries the header `Notion-Version: 2026-03-11` automatically. You do
not need to configure this header.

See the [Migration Guide](/migration-guide/) to upgrade from an earlier SDK version.

---

## Request Timeouts

Set how long the client waits for a response before the request times out.

### Default Timeout

```typescript
const notion = new Notion({
  auth: process.env.NOTION_TOKEN,
  // Default: 60,000ms (60 seconds)
});
```

### Custom Timeout

```typescript
const notion = new Notion({
  auth: process.env.NOTION_TOKEN,
  timeoutMs: 30_000, // 30 seconds
});
```

### Very Short Timeout

```typescript
const notion = new Notion({
  auth: process.env.NOTION_TOKEN,
  timeoutMs: 5_000, // 5 seconds (for fast-fail scenarios)
});
```

### Handling Timeout Errors

```typescript
import { NotionRequestTimeoutError } from '@visus-io/notion-sdk-ts';

try {
  await notion.pages.retrieve('page-id');
} catch (error) {
  if (error instanceof NotionRequestTimeoutError) {
    console.error('Request timed out after', error.message);
  }
}
```

---

## Rate Limiting & Retries

The SDK handles rate limiting automatically with retry logic.

### Default Behavior

```typescript
const notion = new Notion({
  auth: process.env.NOTION_TOKEN,
  retryOnRateLimit: true, // Default: automatically retry 429 responses
  maxRetries: 3, // Default: retry up to 3 times
});
```

**How it works:**

1. The SDK receives a `429 Too Many Requests` response.
2. The SDK checks the `Retry-After` header from the Notion API.
3. The SDK waits for the duration in the header.
4. If the header is missing, the SDK uses exponential backoff instead: 1 second, 2 seconds, 4
   seconds, 8 seconds, and so on, up to a maximum of 60 seconds.
5. The SDK retries the request automatically.

### Disable Automatic Retries

```typescript
const notion = new Notion({
  auth: process.env.NOTION_TOKEN,
  retryOnRateLimit: false, // Do not retry on 429
});
```

> **Note:** `retryOnRateLimit` controls only 429 retries. The SDK always retries
> `529 Service Overload` responses, up to `maxRetries`, no matter the value of
> `retryOnRateLimit`. See [`isServiceOverloaded()`](/guides/error-handling/#notionapierror).

### Custom Max Retries

```typescript
const notion = new Notion({
  auth: process.env.NOTION_TOKEN,
  maxRetries: 5, // Retry up to 5 times
});
```

### No Retries

```typescript
const notion = new Notion({
  auth: process.env.NOTION_TOKEN,
  maxRetries: 0, // Never retry
});
```

### Rate Limit Error Handling

Retries do not prevent all rate limits. You might still get a rate-limited response:

```typescript
import { NotionAPIError } from '@visus-io/notion-sdk-ts';

try {
  await notion.pages.retrieve('page-id');
} catch (error) {
  if (error instanceof NotionAPIError && error.isRateLimited()) {
    console.error('Rate limited after retries');
    console.error('Retry after:', error.message);
  }
}
```

---

## Custom Fetch Implementation

The SDK uses the native `fetch` API in Node 18 and later. You can provide your own
implementation instead.

### Default Behavior

```typescript
const notion = new Notion({
  auth: process.env.NOTION_TOKEN,
  // Uses native fetch by default
});
```

### Custom Fetch

A custom `fetch` implementation is useful for these cases:

- Custom logging or telemetry
- A different HTTP client
- Proxy support
- Tests with mock data

```typescript
const notion = new Notion({
  auth: process.env.NOTION_TOKEN,
  fetch: async (url, init) => {
    console.log(`Fetching: ${url}`);
    const response = await fetch(url, init);
    console.log(`Status: ${response.status}`);
    return response;
  },
});
```

### Proxy Support Example

```typescript
import { HttpsProxyAgent } from 'https-proxy-agent';

const proxyAgent = new HttpsProxyAgent('http://proxy.example.com:8080');

const notion = new Notion({
  auth: process.env.NOTION_TOKEN,
  fetch: (url, init) => fetch(url, { ...init, agent: proxyAgent }),
});
```

### Mock Fetch for Testing

```typescript
const mockFetch = async (url: string, init?: RequestInit) => {
  return new Response(JSON.stringify({ id: 'test-id' }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};

const notion = new Notion({
  auth: 'test-token',
  fetch: mockFetch,
});
```

---

## Base URL Configuration

Change the API base URL. Most projects do not need this option.

### Default

```typescript
const notion = new Notion({
  auth: process.env.NOTION_TOKEN,
  baseUrl: 'https://api.notion.com', // Default
});
```

### Custom Base URL

A custom base URL is useful for these cases:

- Tests against a mock server
- A proxy
- Development or staging environments

```typescript
const notion = new Notion({
  auth: process.env.NOTION_TOKEN,
  baseUrl: 'http://localhost:3000', // Local mock server
});
```

---

## Complete Configuration Example

This example shows a fully configured client with all options:

```typescript
import { Notion } from '@visus-io/notion-sdk-ts';
import { config } from 'dotenv';

config(); // Load .env

const notion = new Notion({
  // Required
  auth: process.env.NOTION_TOKEN!,

  // API Configuration
  baseUrl: 'https://api.notion.com', // Default

  // Timeout Configuration
  timeoutMs: 60_000, // 60 seconds (default)

  // Rate Limiting & Retries
  retryOnRateLimit: true, // Default
  maxRetries: 3, // Default

  // Custom Fetch (optional)
  fetch: async (url, init) => {
    // Add custom logging or a proxy
    console.log(`API Call: ${url}`);
    return fetch(url, init);
  },
});
```

---

## Environment-Specific Configuration

Configure the client differently for each environment:

```typescript
const isProduction = process.env.NODE_ENV === 'production';

const notion = new Notion({
  auth: process.env.NOTION_TOKEN!,
  timeoutMs: isProduction ? 60_000 : 10_000, // Use a shorter timeout for development
  maxRetries: isProduction ? 3 : 0, // Skip retries in development for faster feedback
  fetch: isProduction
    ? undefined // Use default fetch
    : async (url, init) => {
        // Add debug logging in development
        console.log(`[DEV] ${init?.method || 'GET'} ${url}`);
        return fetch(url, init);
      },
});
```

---

## Related Pages

- **[Getting Started](/getting-started/)**: basic setup and initialization.
- **[Error Handling](/guides/error-handling/)**: how to handle API errors and timeouts.
- **[Common Use Cases](/guides/common-use-cases/)**: practical configuration examples.
