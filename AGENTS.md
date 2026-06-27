---
title: actblue-keepalive
summary: Agent and contributor context for the unofficial ActBlue session-keepalive browser extension.
status: live
type: reference
audience_tier: public
---

# actblue-keepalive

A community-built, unofficial Manifest V3 browser extension (Edge and Chrome)
that keeps an active ActBlue dashboard session from idling out, by sending a
periodic credentialed request to `secure.actblue.com` while you are already
signed in. Not affiliated with ActBlue. See [NOTICE](NOTICE) and
[DISCLAIMER.md](DISCLAIMER.md).

## What it is

ActBlue runs on Rails and expires the dashboard session on an idle timeout: leave
it untouched for a while and the next action bounces to login. While the
keep-alive window is open, this extension makes one small authenticated `GET` on a
timer (default cadence every 5 minutes). The browser attaches the existing session
cookie automatically, which re-stamps the session's sliding expiry, the same as if
a person had clicked something. The extension never reads, stores, or transmits the
cookie, a token, or a password.

The user chooses how long to keep the session warm (the duration slider, default 3
hours, up to Unlimited). When the window elapses the keepalive pauses and the
session idles out on its own; "Check now" re-arms the window.

It defeats an **idle** timeout only. If ActBlue also enforces an **absolute**
session cap, no keepalive extends past it; the extension detects the ended
session, says so, and resumes after the next sign-in.

## Layout

```
actblue-keepalive/
  src/                 # the unpacked extension
    manifest.json      # MV3 manifest (permissions: alarms, storage, notifications; host: secure.actblue.com)
    background.js      # service worker: keep-alive window + alarm -> GET -> classify alive/ended/paused/unreachable
    popup.html/js      # toolbar dropdown: status, on/off switch, duration slider, advanced settings, Check now
    about.html         # in-extension about page
    icons/             # toolbar icons
  docs/hld.md          # architecture
  README.md            # install and usage
  SECURITY.md PRIVACY.md NOTICE DISCLAIMER.md LICENSE
```

## Build, test, run

No build step. Load `src/` unpacked:

1. Open `edge://extensions` (or `chrome://extensions`).
2. Turn on Developer mode.
3. Choose "Load unpacked" and select the `src/` folder.

There is no automated test harness. Manual check: load unpacked, open the popup,
"Check now", confirm it reads "Session alive" while signed in and flips to
"Session ended" after signing out of ActBlue.

## Conventions

- Manifest V3, authored for plain Chromium so it loads in Edge or Chrome.
- Least privilege: host access is scoped to `https://secure.actblue.com/*` only;
  request no permission the extension does not use.
- Requests stay read-only `GET`s. A `GET` needs no CSRF token and changes no
  account state. Any move to a state-changing request is a deliberate, documented
  change.
- No analytics, no telemetry, no backend, no third-party calls.
- User-facing copy stays calm and plain.
- No em-dashes in source, docs, or commits; use a comma, period, colon,
  semicolon, or parentheses.

## Boundaries

- Target `secure.actblue.com` only. Do not broaden host permissions, add another
  site, or add a network endpoint without a deliberate decision and a doc update.
- Never persist or transmit cookie values, tokens, or account data. Status is
  alive / ended / unreachable and a timestamp, never session contents.
