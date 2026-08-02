import { createHmac, timingSafeEqual } from 'node:crypto';

/**
 * Webhook signature helpers.
 *
 * Notion signs webhook payloads with HMAC-SHA256, keyed by the subscription's
 * verification token, over the raw JSON request body. The signature is sent in the
 * `X-Notion-Signature` header as `sha256=<hex digest>`.
 *
 * Notion API reference:
 * https://developers.notion.com/reference/webhooks
 */

function computeSignature(rawBody: string, verificationToken: string): string {
  return `sha256=${createHmac('sha256', verificationToken).update(rawBody).digest('hex')}`;
}

/**
 * Sign a payload, for generating test webhook signatures.
 *
 * @param body - The payload to sign. A string is signed as-is; anything else is
 * `JSON.stringify`'d first -- safe here because the caller controls the exact
 * serialization of a payload they're constructing themselves.
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
 * IMPORTANT: `rawBody` must be the exact raw request body Notion sent, not
 * `JSON.stringify(parsedBody)` -- re-serializing a parsed object can produce a
 * different byte sequence (key order, whitespace) than what was actually signed,
 * silently breaking verification. Use your framework's raw-body access (e.g.
 * Express's `express.raw()` / `req.rawBody`), not `req.body` after JSON middleware
 * has already parsed it.
 *
 * @param rawBody - The exact raw request body string Notion sent
 * @param signatureHeader - The value of the `X-Notion-Signature` request header
 * @param verificationToken - The webhook subscription's verification token
 * @returns `true` if the signature is valid; `false` for any mismatch or malformed
 * input (never throws)
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
 */
export const webhook = {
  sign,
  verifySignature,
};
