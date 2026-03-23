# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in Riva, **please do not open a public issue**.

Instead, report it privately via GitHub's [Security Advisories](../../security/advisories/new) feature, or email directly at the address on the profile.

Please include:
- A description of the vulnerability
- Steps to reproduce
- Potential impact

You can expect a response within 72 hours.

## Security Model

All Azure DevOps API requests go through the Rust backend — your PAT is never exposed to the webview layer. Credentials are stored securely using the OS keychain where available.
