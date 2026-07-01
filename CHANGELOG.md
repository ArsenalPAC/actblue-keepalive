# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project aims to
follow [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.2.0] - 2026-07-01

### Changed
- Broadened the host permission from `https://secure.actblue.com/*` to
  `https://*.actblue.com/*` and repointed the default keepalive URL to the current
  dashboard at `https://fundraising.app.actblue.com/`. ActBlue moved the dashboard
  to a new subdomain; the wildcard keeps the whole `actblue.com` subdomain family
  reachable, and the advanced keepalive URL now accepts any `actblue.com` subdomain
  (still HTTPS, still a read-only GET).

## [0.1.0] - 2026-06-26

### Added
- Initial release. Manifest V3 extension for Edge and Chrome.
- Periodic credentialed keepalive request to `secure.actblue.com` that prevents
  idle session timeout while the keep-alive window is open.
- Keep-alive duration slider (30 minutes to Unlimited, default 3 hours): the
  keepalive holds the session for the chosen window, then pauses and lets it idle
  out. "Check now" extends the window.
- Toolbar popup: live status (alive / ended / paused / unreachable), on/off
  switch, the duration slider, and advanced settings (ping interval, keepalive URL).
- One-time notification when a session ends, so you know to sign back in.
- Settings and status stored locally (`chrome.storage.local`); no sync, no
  analytics, no telemetry, no backend.
- Bundled "About" page.
