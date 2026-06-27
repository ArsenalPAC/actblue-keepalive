# Security

This document covers two things: a few **practical safety notes for using this
extension**, and the **vulnerability-reporting policy** for the project.

## Using it safely

None of these are hidden bugs; they follow from what the tool does. They are worth
a minute before you install it.

### Trust the code you load

A load-unpacked extension with access to `secure.actblue.com` can make signed-in
requests to that site, because your browser attaches your existing session
automatically. This build only sends a read-only `GET` and never touches your
cookie, and the source is open so you can confirm that. Still, the code you load
is the code that runs, so get it from the official repository, and if you build
from source, read `src/` first.

### Keeping a session open longer is a tradeoff

A keepalive holds your authenticated dashboard open for the window you choose
instead of letting it idle out. That is convenient, and it also means the
dashboard stays reachable for longer. Use it on a personal device you control,
lock your screen when you step away (Windows+L), and sign out of ActBlue when you
finish. Setting a shorter keep-alive window (or leaving the default) limits how
long the session stays warm; "Unlimited" keeps it warm for as long as your browser
runs.

### No warranty

The extension depends on ActBlue's current behavior, which ActBlue is free to
change. A change could stop the keepalive working without notice. It is provided
as is, with no warranty. Save your work often and do not rely on it for anything
time-critical.

### If you think your account was accessed

Use ActBlue's account access log, click "Sign Out All Other Sessions," change your
password, and enable two-factor authentication.

## Reporting a vulnerability

If you find a security problem in this extension, please report it privately.

- **Preferred:** open a private security advisory through this repository's
  **Security** tab ("Report a vulnerability").
- Do not open a public issue for a security report.

Please include the extension version, browser and version, and steps to
reproduce. We aim to acknowledge a report within a few days and to address
confirmed issues promptly. There is no paid bounty program.

### Supported versions

The latest released version is supported. Older versions are not maintained;
please update before reporting.
