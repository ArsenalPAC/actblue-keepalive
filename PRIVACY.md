# Privacy

Short version: this extension collects nothing, sends nothing anywhere, and has
no servers. It talks only to ActBlue, using the session your browser already has.

## What it does

While the keep-alive window you set is open (default 3 hours, up to Unlimited),
the extension makes one ordinary web request to your ActBlue dashboard (default
`fundraising.app.actblue.com`) on a timer
(default every 5 minutes) so an active session does not lapse during idle gaps.
After that window it pauses and lets the session idle out; "Check now" starts a
fresh window. Your browser attaches your existing ActBlue session cookie to that
request automatically, the same way it does when you click a link on the site.

## What it never does

- It does **not** read, copy, store, or transmit your password.
- It does **not** read, copy, store, or transmit your session cookie or any
  authentication token. The browser holds the cookie; the extension only triggers
  a request the browser then authenticates on its own.
- It does **not** read the contents of your ActBlue account (donations,
  contacts, reports). It looks only at whether a request came back signed-in or
  signed-out.
- It has **no analytics, no telemetry, no tracking, no third-party calls.** There
  is no backend. Nothing leaves your machine except the request to ActBlue.

## What it stores locally

Only your own settings and the last check result, kept in the browser's local
extension storage (`chrome.storage.local`) on your device, which does not sync to
the browser vendor or to your other devices:

- whether the keepalive is on or off,
- the keep-alive duration and the ping interval,
- the keepalive URL,
- the time and outcome (alive / ended / paused / unreachable) of the last check.

This never leaves your browser. Removing the extension removes it.

## Permissions, and why

| Permission | Why |
|---|---|
| `host_permissions: https://*.actblue.com/*` | To make the keepalive request to ActBlue across its subdomains (the dashboard at `fundraising.app.actblue.com`, older tools on `secure.actblue.com`). actblue.com is the only site the extension can touch. |
| `alarms` | To run the check on a schedule. |
| `storage` | To remember your settings and last status, locally. |
| `notifications` | To tell you once if your session has ended so you can sign back in. |

Questions or concerns: open an issue on the project's repository.
