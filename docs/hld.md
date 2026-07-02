---
title: High-Level Design
summary: How the ActBlue keepalive extension is built and the design choices behind it.
status: live
type: explanation
parent: ../AGENTS.md
audience_tier: public
---

# High-Level Design

Plain language: this is the architecture for the extension, in one screen. The
user-facing install and usage guide is [../README.md](../README.md); the safety
notes for end users are in [../SECURITY.md](../SECURITY.md).

## The mechanism

ActBlue runs on Rails. The dashboard session is an HttpOnly, Secure cookie the
browser attaches to every same-site request automatically. The session expires on
an idle timeout: with no requests for a while, the next navigation redirects to
login.

While the keep-alive window is open, the extension keeps the session warm with a
single credentialed `GET` on a timer. Because the browser attaches the existing
cookie, each request re-stamps the session's sliding expiry server-side, the same
effect as a user clicking a link. A `GET` is read-only and needs no CSRF token, so
it has no side effect on the account.

## The keep-alive window

The user chooses how long to keep the session warm (the duration slider, default
3 hours, up to Unlimited). The window starts when the keepalive is enabled, on
browser startup, on any settings change, and on "Check now". `background.js` stamps
`armedAt` when the window opens; on each tick it checks whether the duration has
elapsed. If it has, the keepalive pauses (state `paused`) and the session is
allowed to idle out on its own. Unlimited never pauses.

## Components

```
chrome.alarms (every intervalMinutes)
        |
        v
background.js (service worker)
   window open? (now - armedAt < durationHours, or Unlimited)
        | yes
        v
   fetch(keepaliveUrl, { credentials: 'include', redirect: 'manual' })
        |
        v
   classify response
     2xx            -> alive
     opaqueredirect -> ended   (bounced to login)
     401 / 403      -> ended
     other status   -> unreachable (unexpected response)
     network error  -> unreachable
   window elapsed   -> paused
        |
        v
   chrome.storage.local: { state, lastCheck, message }, { armedAt }
   toolbar badge + (on alive->ended) one notification
        ^
        |
popup.html / popup.js  (read status; write settings to chrome.storage.local)
```

- `manifest.json`: MV3. Permissions `alarms`, `storage`, `notifications`; host
  permission `https://*.actblue.com/*` only.
- `background.js`: owns the keep-alive window, the alarm, the ping, classification,
  badge, and the one-shot "session ended" notification. Re-arms the window and runs
  on settings changes and "Check now".
- `popup.html` / `popup.js`: the toolbar dropdown. Shows status and is the control
  surface (on/off, duration slider, advanced interval and URL, Check now).
- `about.html`: in-extension about page.

## Design choices

- **Read-only GET, never the cookie.** The extension triggers a request the
  browser authenticates; it never reads, stores, or sends the cookie or any token.
  This keeps the blast radius minimal even though the host permission is powerful.
- **Duration window, modest by default.** Rather than holding a session open
  forever, the keepalive runs for a chosen window (default 3 hours) and then lets
  the session idle out. Unlimited is opt-in.
- **Default target `my-dashboards`.** `https://fundraising.app.actblue.com/my-dashboards`
  needs no per-user parameter, returns `200` while the session is alive, and cleanly
  redirects to login when it is gone, which doubles as the ended-session signal. The
  bare origin is avoided on purpose: it 302s to `/my-dashboards` unconditionally, and
  under `redirect: "manual"` that redirect would read as an ended session every time.
  The URL is configurable but pinned to an `actblue.com` subdomain.
- **One-minute interval floor.** MV3 alarms enforce a 1-minute minimum in
  production; the default cadence is 5 minutes.
- **Self-healing.** A dead session is reported, not retried into a loop; the next
  successful ping after sign-in restores the alive state.
- **Local only.** Settings and status live in `chrome.storage.local`; nothing
  syncs and there is no backend.

## Non-goals

- No background scraping, no DOM access, no content scripts, no second site.
- No data collection of any kind; see [../PRIVACY.md](../PRIVACY.md).
