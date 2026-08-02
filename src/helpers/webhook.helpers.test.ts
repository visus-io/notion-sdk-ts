import { createHmac } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { webhook } from './webhook.helpers';

describe('webhook helpers', () => {
  const verificationToken = 'test-verification-token';
  const body = { event: 'page.updated', page_id: '123e4567-e89b-12d3-a456-426614174000' };
  const rawBody = JSON.stringify(body);

  describe('sign', () => {
    it('should produce a signature matching an independently-computed HMAC', () => {
      const expected = `sha256=${createHmac('sha256', verificationToken).update(rawBody).digest('hex')}`;

      const signature = webhook.sign(body, verificationToken);

      expect(signature).toBe(expected);
    });

    it('should sign a raw string body as-is without re-serializing', () => {
      const expected = `sha256=${createHmac('sha256', verificationToken).update(rawBody).digest('hex')}`;

      const signature = webhook.sign(rawBody, verificationToken);

      expect(signature).toBe(expected);
    });
  });

  describe('verifySignature', () => {
    it('should return true for a signature produced by sign() with the same token/body', () => {
      const signature = webhook.sign(body, verificationToken);

      expect(webhook.verifySignature(rawBody, signature, verificationToken)).toBe(true);
    });

    it('should return false for a signature generated with a different token', () => {
      const signature = webhook.sign(body, 'other-token');

      expect(webhook.verifySignature(rawBody, signature, verificationToken)).toBe(false);
    });

    it('should return false when the body has been tampered with', () => {
      const signature = webhook.sign(body, verificationToken);
      const tamperedBody = JSON.stringify({ ...body, page_id: 'tampered' });

      expect(webhook.verifySignature(tamperedBody, signature, verificationToken)).toBe(false);
    });

    it('should return false (not throw) for a null header', () => {
      expect(webhook.verifySignature(rawBody, null, verificationToken)).toBe(false);
    });

    it('should return false (not throw) for an undefined header', () => {
      expect(webhook.verifySignature(rawBody, undefined, verificationToken)).toBe(false);
    });

    it('should return false (not throw) for an empty string header', () => {
      expect(webhook.verifySignature(rawBody, '', verificationToken)).toBe(false);
    });

    it('should return false (not throw) for a signature of a different length', () => {
      expect(webhook.verifySignature(rawBody, 'sha256=short', verificationToken)).toBe(false);
    });
  });
});
