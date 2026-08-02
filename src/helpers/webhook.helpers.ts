import { createHmac, timingSafeEqual } from 'node:crypto';

/**
 * Webhook signature helpers.
 *
 * Notion signs webhook payloads with HMAC-SHA256. It signs the raw JSON request body
 * and keys the signature with the subscription's verification token. Notion sends the
 * signature in the `X-Notion-Signature` header as `sha256=<hex digest>`.
 *
 * Notion API reference:
 * https://developers.notion.com/reference/webhooks
 */

function computeSignature(rawBody: string, verificationToken: string): string {
  return `sha256=${createHmac('sha256', verificationToken).update(rawBody).digest('hex')}`;
}

/**
 * Sign a payload to generate test webhook signatures.
 *
 * @param body - The payload to sign. This function signs a string as-is. It
 * converts anything else with `JSON.stringify` first. This is safe because the
 * caller controls the serialization of their own payload.
 * @param verificationToken - The webhook subscription's verification token
 * @returns The `sha256=<hex digest>` signature
 *
 * @example
 * ```ts
 * const signature = webhook.sign({ event: 'page.updated' }, verificationToken);
 * ```
 */
function sign(body: unknown, verificationToken: string): string {
  return computeSignature(
    typeof body === 'string' ? body : JSON.stringify(body),
    verificationToken,
  );
}

/**
 * Verify an incoming webhook's `X-Notion-Signature` header via constant-time comparison.
 *
 * IMPORTANT: `rawBody` must be the exact raw request body that Notion sent. Do not use
 * `JSON.stringify(parsedBody)`. Re-serializing a parsed object can produce a different
 * byte sequence (key order, whitespace) than the original signed body, and this
 * silently breaks verification. Use your framework's raw-body access, for example
 * Express's `express.raw()` or `req.rawBody`. Do not use `req.body` after JSON
 * middleware parses it.
 *
 * @param rawBody - The exact raw request body string Notion sent
 * @param signatureHeader - The value of the `X-Notion-Signature` request header
 * @param verificationToken - The webhook subscription's verification token
 * @returns `true` if the signature is valid. Returns `false` for a mismatch or
 * malformed input. This function never throws.
 *
 * @example
 * ```ts
 * const isValid = webhook.verifySignature(rawBody, req.headers['x-notion-signature'], verificationToken);
 * ```
 */
function verifySignature(
  rawBody: string,
  signatureHeader: string | null | undefined,
  verificationToken: string,
): boolean {
  if (!signatureHeader) {
    return false;
  }

  const expected = Buffer.from(computeSignature(rawBody, verificationToken));
  const actual = Buffer.from(signatureHeader);

  // timingSafeEqual throws on mismatched buffer lengths, so guard explicitly.
  if (expected.length !== actual.length) {
    return false;
  }

  return timingSafeEqual(expected, actual);
}

/**
 * Helpers for signing and verifying Notion webhook payloads.
 *
 * @example
 * ```ts
 * import { webhook } from '@visus-io/notion-sdk-ts';
 *
 * const isValid = webhook.verifySignature(rawBody, req.headers['x-notion-signature'], verificationToken);
 * ```
 *
 * @category Helpers
 */
export const webhook = {
  sign,
  verifySignature,
};
