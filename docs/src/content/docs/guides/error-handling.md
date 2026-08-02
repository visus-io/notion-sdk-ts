---
title: Error Handling
description: Error types, codes, and handling patterns.
sidebar:
  order: 6
---

The SDK has 4 error classes. Each class handles a different type of failure.

## Table of Contents

- [Error Types](#error-types)
- [NotionValidationError](#notionvalidationerror)
- [NotionAPIError](#notionapierror)
- [NotionNetworkError](#notionnetworkerror)
- [NotionRequestTimeoutError](#notionrequesttimeouterror)
- [Error Handling Patterns](#error-handling-patterns)
- [Error Codes Reference](#error-codes-reference)

---

## Error Types

Each SDK error class extends the built-in `Error` class:

```typescript
import {
  NotionValidationError, // Client-side validation failures
  NotionAPIError, // API responses with error status
  NotionNetworkError, // Network or connection failures
  NotionRequestTimeoutError, // Request timeout
} from '@visus-io/notion-sdk-ts';
```

---

## NotionValidationError

The SDK throws `NotionValidationError` when client-side validation fails. This check happens
**before** the SDK sends a request to the API.

### When the SDK Throws This Error

- Rich text content exceeds 2,000 characters.
- A URL exceeds 2,000 characters.
- An array exceeds 100 elements.
- The input data is invalid.

### Properties

```typescript
error.message; // Description of validation failure
```

### Example

```typescript
import { NotionValidationError, richText } from '@visus-io/notion-sdk-ts';

try {
  // Text exceeds 2,000 character limit
  const text = 'a'.repeat(3000);
  richText(text).build();
} catch (error) {
  if (error instanceof NotionValidationError) {
    console.error('Validation error:', error.message);
    // "Rich text content exceeds maximum length of 2000 characters"
  }
}
```

### Handling Validation Errors

```typescript
try {
  await notion.blocks.children.append('page-id', {
    children: Array(150).fill(block.paragraph('Too many blocks')),
  });
} catch (error) {
  if (error instanceof NotionValidationError) {
    console.error('Request validation failed:');
    console.error(error.message);
    // Split into smaller batches
  }
}
```

See [Request Size Limits](/guides/request-size-limits/) for all enforced limits.

---

## NotionAPIError

The SDK throws `NotionAPIError` when the Notion API returns an error response. The response has
a 4xx or 5xx status code.

### Properties

```typescript
error.status; // HTTP status code (e.g., 404, 401, 429)
error.code; // Notion error code (e.g., 'object_not_found')
error.message; // Error message from API
```

### Type Guards

```typescript
error.isNotFound(); // 404: resource not found
error.isUnauthorized(); // 401: invalid token or missing permissions
error.isValidationError(); // 400: invalid request data
error.isRateLimited(); // 429: rate limit exceeded
error.isServiceOverloaded(); // 529: Notion is overloaded
error.isServerError(); // 5xx: Notion server error, includes 529
error.isRetryable(); // rate limited or server error
```

**Retry behavior:** The SDK retries rate-limited (429) responses only when `retryOnRateLimit` is
enabled. See [Configuration](/guides/configuration/). The SDK **always** retries service-overload
(529) responses, no matter the value of `retryOnRateLimit`. The Notion API recommends this retry
behavior.

### Example

```typescript
import { NotionAPIError } from '@visus-io/notion-sdk-ts';

try {
  await notion.pages.retrieve('invalid-page-id');
} catch (error) {
  if (error instanceof NotionAPIError) {
    console.error(`API Error ${error.status}:`, error.message);
    console.error('Error code:', error.code);

    if (error.isNotFound()) {
      console.error('Page does not exist or bot lacks access');
    } else if (error.isUnauthorized()) {
      console.error('Invalid token or missing permissions');
    } else if (error.isRateLimited()) {
      console.error('Rate limited, retry after delay');
    }
  }
}
```

### Handling Specific Error Codes

```typescript
try {
  await notion.databases.query('database-id');
} catch (error) {
  if (error instanceof NotionAPIError) {
    switch (error.code) {
      case 'object_not_found':
        console.error('Database not found');
        break;
      case 'unauthorized':
        console.error('Token invalid or database not shared');
        break;
      case 'rate_limited':
        console.error('Rate limited, wait before retrying');
        break;
      case 'validation_error':
        console.error('Invalid filter or sort parameters');
        break;
      default:
        console.error('API error:', error.message);
    }
  }
}
```

---

## NotionNetworkError

The SDK throws `NotionNetworkError` when a network-level error occurs. Examples: a DNS failure
or a refused connection.

### Properties

```typescript
error.message; // Error description
error.cause; // Underlying error object
```

### When the SDK Throws This Error

- The DNS lookup fails.
- The connection is refused.
- The network request times out.
- A TLS or SSL error occurs.

### Example

```typescript
import { NotionNetworkError } from '@visus-io/notion-sdk-ts';

try {
  await notion.pages.retrieve('page-id');
} catch (error) {
  if (error instanceof NotionNetworkError) {
    console.error('Network error:', error.message);
    console.error('Cause:', error.cause);
    // Retry with exponential backoff or alert monitoring
  }
}
```

---

## NotionRequestTimeoutError

The SDK throws `NotionRequestTimeoutError` when a request exceeds the configured timeout.

### Properties

```typescript
error.message; // Timeout description
```

### Example

```typescript
import { NotionRequestTimeoutError } from '@visus-io/notion-sdk-ts';

const notion = new Notion({
  auth: process.env.NOTION_TOKEN,
  timeoutMs: 5_000, // 5 second timeout
});

try {
  await notion.databases.query('large-database-id');
} catch (error) {
  if (error instanceof NotionRequestTimeoutError) {
    console.error('Request timed out:', error.message);
    // Increase timeout or optimize query
  }
}
```

---

## Error Handling Patterns

### Comprehensive Error Handler

```typescript
import {
  NotionAPIError,
  NotionNetworkError,
  NotionRequestTimeoutError,
  NotionValidationError,
} from '@visus-io/notion-sdk-ts';

async function safeRetrievePage(pageId: string) {
  try {
    return await notion.pages.retrieve(pageId);
  } catch (error) {
    if (error instanceof NotionValidationError) {
      console.error('Validation failed:', error.message);
      throw new Error('Invalid input data');
    } else if (error instanceof NotionAPIError) {
      console.error(`API Error ${error.status}:`, error.message);

      if (error.isNotFound()) {
        return null; // Page does not exist
      } else if (error.isUnauthorized()) {
        throw new Error('Authentication failed');
      } else if (error.isRateLimited()) {
        // Wait and retry
        await new Promise((resolve) => setTimeout(resolve, 5000));
        return safeRetrievePage(pageId); // Retry once
      } else if (error.isServerError()) {
        throw new Error('Notion server error, try again later');
      }

      throw error;
    } else if (error instanceof NotionNetworkError) {
      console.error('Network error:', error.message);
      throw new Error('Network connection failed');
    } else if (error instanceof NotionRequestTimeoutError) {
      console.error('Request timed out:', error.message);
      throw new Error('Request took too long');
    }

    throw error; // Unknown error
  }
}
```

### Retry Pattern

```typescript
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 1000,
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      // Only retry on retryable errors
      if (error instanceof NotionAPIError && (error.isRateLimited() || error.isServerError())) {
        if (attempt < maxRetries) {
          const delay = baseDelay * Math.pow(2, attempt);
          console.log(`Retry attempt ${attempt + 1} after ${delay}ms`);
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }
      }

      throw error; // Do not retry other errors
    }
  }

  throw lastError;
}

// Usage
const page = await retryWithBackoff(() => notion.pages.retrieve('page-id'));
```

### Graceful Degradation

```typescript
async function getPageTitle(pageId: string): Promise<string> {
  try {
    const page = await notion.pages.retrieve(pageId);
    return page.getTitle();
  } catch (error) {
    if (error instanceof NotionAPIError && error.isNotFound()) {
      return 'Untitled'; // Default value
    }
    throw error; // Re-throw other errors
  }
}
```

### Bulk Operation Error Handling

```typescript
async function bulkUpdatePages(pageIds: string[]) {
  const results = {
    success: [] as string[],
    failed: [] as { id: string; error: string }[],
  };

  for (const pageId of pageIds) {
    try {
      await notion.pages.update(pageId, {
        properties: { Status: { status: { name: 'Done' } } },
      });
      results.success.push(pageId);
    } catch (error) {
      let errorMessage = 'Unknown error';

      if (error instanceof NotionAPIError) {
        errorMessage = `${error.code}: ${error.message}`;
      } else if (error instanceof NotionNetworkError) {
        errorMessage = 'Network error';
      }

      results.failed.push({ id: pageId, error: errorMessage });
    }
  }

  console.log(`Success: ${results.success.length}, Failed: ${results.failed.length}`);
  return results;
}
```

---

## Error Codes Reference

This table lists the Notion API error codes:

| Code                              | Status | Description                                                  |
| --------------------------------- | ------ | ------------------------------------------------------------ |
| `invalid_json`                    | 400    | Request body is not valid JSON                               |
| `invalid_request_url`             | 400    | Invalid request URL                                          |
| `invalid_request`                 | 400    | Request is invalid                                           |
| `validation_error`                | 400    | Validation failed on request parameters                      |
| `missing_version`                 | 400    | Notion-Version header missing                                |
| `unauthorized`                    | 401    | Invalid token or insufficient permissions                    |
| `restricted_resource`             | 403    | Forbidden access to resource                                 |
| `object_not_found`                | 404    | Resource not found                                           |
| `conflict_error`                  | 409    | Conflict with existing resource state                        |
| `rate_limited`                    | 429    | Too many requests (retried if `retryOnRateLimit` is enabled) |
| `internal_server_error`           | 500    | Notion internal error                                        |
| `service_unavailable`             | 503    | Service temporarily unavailable                              |
| `database_connection_unavailable` | 503    | Database connection error                                    |
| `gateway_timeout`                 | 504    | Gateway timeout                                              |
| `service_overload`                | 529    | Notion is overloaded (always auto-retried)                   |

### Common Error Scenarios

**404 Not Found (`object_not_found`):**

- The page or database does not exist.
- The bot does not have access to the resource.
- Someone deleted the resource.

**401 Unauthorized (`unauthorized`):**

- The integration token is invalid.
- The token expired.
- The integration is not connected to the page or database.

**400 Validation Error (`validation_error`):**

- The property type is invalid.
- The filter syntax is invalid.
- A required field is missing.

**429 Rate Limited (`rate_limited`):**

- Too many requests occurred in a short time.
- The SDK retries the request automatically. You can configure this behavior.

**500 and 503 Server Errors:**

- A temporary Notion service issue occurred.
- The SDK retries the request automatically for retryable operations.

---

## Related Pages

- **[Configuration](/guides/configuration/)**: how to configure retries and timeouts.
- **[Request Size Limits](/guides/request-size-limits/)**: client-side validation limits.
- **[Common Use Cases](/guides/common-use-cases/)**: error handling in practice.
- **[API Reference](/api/)**: API method documentation.
