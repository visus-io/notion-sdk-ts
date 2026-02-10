# Security Policy

## Supported Versions

We actively support the latest version of `@visus-io/notion-sdk-ts`. Security updates are provided for the following versions:

| Version | Supported          |
| ------- | ------------------ |
| 0.x.x   | :white_check_mark: |

Once the SDK reaches stable v1.0.0, we will maintain security support for the current major version and one previous major version.

## Reporting a Vulnerability

We take the security of `@visus-io/notion-sdk-ts` seriously. If you discover a security vulnerability, please help us protect our users by reporting it responsibly.

### How to Report

**DO NOT** open a public GitHub issue for security vulnerabilities.

Instead, please report security vulnerabilities by email to:

**security@projects.visus.io**

### What to Include

Please include the following information in your report:

- A clear description of the vulnerability
- Steps to reproduce the issue
- Affected versions (if known)
- Potential impact of the vulnerability
- Any suggested remediation or mitigation steps
- Your contact information for follow-up questions

### Response Timeline

- **Initial Response:** We will acknowledge receipt of your report within 48 hours
- **Assessment:** We will investigate and assess the vulnerability within 5 business days
- **Resolution:** We will work to resolve critical vulnerabilities as quickly as possible and keep you informed of our progress
- **Disclosure:** Once a fix is available, we will coordinate disclosure timing with you

### Safe Harbor

We support responsible disclosure and will not pursue legal action against security researchers who:

- Make a good faith effort to avoid privacy violations, data destruction, and service disruption
- Only interact with accounts you own or have explicit permission to test
- Do not exploit the vulnerability beyond what is necessary to demonstrate it
- Provide us with a reasonable amount of time to fix the issue before public disclosure

## Security Best Practices

When using `@visus-io/notion-sdk-ts`, please follow these security best practices:

### 1. Protect Your Notion API Tokens

- **Never commit API tokens to version control**
- Store tokens in environment variables or secure credential management systems
- Use different tokens for development, staging, and production environments
- Rotate tokens periodically and immediately if compromised
- Limit token permissions to the minimum required scope

```typescript
// ✅ Good: Load from environment variable
const notion = new Notion({ auth: process.env.NOTION_TOKEN });

// ❌ Bad: Hardcoded token
const notion = new Notion({ auth: 'secret_abc123...' });
```

### 2. Validate User Input

Always validate and sanitize user-provided data before using it with the SDK:

```typescript
// ✅ Good: Validate before use
if (userInput && userInput.length <= 2000) {
  await notion.pages.create({
    parent: parent.database(dbId),
    properties: {
      Name: prop.title(userInput),
    },
  });
}

// ❌ Bad: Direct use of unvalidated input
await notion.pages.create({
  parent: parent.database(userInput), // Could be malicious
  properties: {
    Name: prop.title(untrustedData),
  },
});
```

### 3. Handle Errors Securely

Avoid exposing sensitive information in error messages:

```typescript
try {
  await notion.pages.retrieve(pageId);
} catch (error) {
  // ✅ Good: Log detailed errors server-side, show generic message to users
  console.error('Page retrieval failed:', error);
  return { error: 'Unable to retrieve page' };

  // ❌ Bad: Exposing detailed error to end users
  return { error: error.message }; // May contain sensitive details
}
```

### 4. Use HTTPS Only

The SDK defaults to HTTPS (`https://api.notion.com`). Do not override `baseUrl` with HTTP endpoints in production.

### 5. Keep Dependencies Updated

Regularly update the SDK and its dependencies to receive security patches:

```bash
npm audit
npm update @visus-io/notion-sdk-ts
```

### 6. Implement Rate Limiting

Even though the SDK handles Notion's rate limits, implement your own rate limiting for public-facing applications to prevent abuse:

```typescript
// Example: Use a rate limiting library for your API endpoints
app.use(
  '/api/notion',
  rateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per window
  }),
);
```

### 7. Principle of Least Privilege

When sharing Notion integrations:

- Only grant access to specific pages/databases needed
- Use integration-specific tokens rather than user tokens when possible
- Regularly audit and revoke unused integration access

### 8. Secure File Uploads

When using the File Uploads API:

- Validate file types and sizes before upload
- Scan uploaded files for malware if accepting user uploads
- Set appropriate content types
- Be aware of URL expiration times

```typescript
// ✅ Good: Validate before upload
const allowedTypes = ['image/png', 'image/jpeg', 'application/pdf'];
if (file.size <= 5 * 1024 * 1024 && allowedTypes.includes(file.type)) {
  await notion.fileUploads.uploadFile(file.name, file.buffer, file.type);
}
```

## Known Security Considerations

### Authentication

This SDK requires a Notion API token for authentication. The security of your integration depends on keeping this token confidential. The SDK does not provide token encryption or storage—this is the responsibility of the consuming application.

### Data Validation

The SDK uses [Zod](https://github.com/colinhacks/zod) for runtime validation of API responses. This helps prevent unexpected data structures from causing issues, but does not protect against malicious content within valid structures (e.g., XSS payloads in text fields).

### Network Security

The SDK uses Node.js's built-in `fetch` (Node 18+) for HTTP requests. Ensure your Node.js version is up to date to receive security patches.

### Dependencies

This SDK has minimal dependencies:

- `zod` - Runtime validation

We actively monitor these dependencies for security vulnerabilities.

## Security Updates

Security updates will be released as patch versions (e.g., 0.1.1 → 0.1.2) whenever possible to allow for easy adoption. Critical security fixes may be backported to previous minor versions.

Security advisories will be published via:

- [GitHub Security Advisories](https://github.com/visus-io/notion-sdk-ts/security/advisories)
- [npm Security Advisories](https://www.npmjs.com/advisories)
- Release notes in the [GitHub Releases](https://github.com/visus-io/notion-sdk-ts/releases) page

## Security Tooling

This project uses the following security tools:

- **npm audit** - Automated dependency vulnerability scanning (CI/CD)
- **ESLint** - Static code analysis with security-focused rules
- **TypeScript** - Strict type checking to prevent common vulnerability classes
- **Zod** - Runtime validation to prevent injection and malformed data issues
- **Prettier** - Consistent code formatting to prevent security-relevant typos

## Compliance

This SDK is designed to help developers build Notion integrations. Compliance with data protection regulations (GDPR, CCPA, etc.) is the responsibility of the application using this SDK. Consider the following:

- Notion API usage is subject to [Notion's Terms of Service](https://www.notion.so/Terms-and-Privacy-28ffdd083dc3473e9c2da6ec011b58ac)
- Personal data accessed through the API should be handled according to applicable privacy laws
- Implement appropriate data retention and deletion policies
- Maintain audit logs of API access when required by regulations

## Contact

For security-related questions or concerns, contact:

**security@projects.visus.io**

For general support, please use:

- [GitHub Issues](https://github.com/visus-io/notion-sdk-ts/issues) (non-security issues only)
- [GitHub Discussions](https://github.com/visus-io/notion-sdk-ts/discussions)

## Acknowledgments

We appreciate the security research community's efforts in responsibly disclosing vulnerabilities. Security researchers who report valid vulnerabilities will be acknowledged in our release notes (unless they prefer to remain anonymous).

---

**Last Updated:** February 10, 2026  
**Maintained by:** Visus Development Team
