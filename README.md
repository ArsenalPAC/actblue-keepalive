# ActBlue Session Keepalive

A small, open-source browser extension that keeps an active ActBlue dashboard
session from idling out, so you re-login less. For Microsoft Edge and Google
Chrome (Manifest V3).

> **Unofficial tool, not affiliated with ActBlue.** Independent and open source,
> published by Arsenal PAC. Provided as is; use at your own risk. See
> [DISCLAIMER.md](DISCLAIMER.md).

<p align="center">
  <a href="https://github.com/ArsenalPAC/actblue-keepalive/raw/main/dist/actblue-keepalive.zip">
    <img src="https://img.shields.io/badge/Download-Chrome%20%26%20Edge-1f6feb?style=for-the-badge&logo=googlechrome&logoColor=white" alt="Download the extension for Chrome and Edge" />
  </a>
  &nbsp;
  <a href="#install">
    <img src="https://img.shields.io/badge/How%20to%20install-2e7d32?style=for-the-badge" alt="How to install" />
  </a>
</p>

## What it does

ActBlue signs you out after a period of inactivity. While it is on, this extension
sends one small, signed-in request to `secure.actblue.com` every few minutes,
which keeps your existing session from going idle, the same as if you had clicked
something on the page.

You choose how long to keep your session warm with a slider, from 30 minutes up to
Unlimited (default 3 hours). After that window the keepalive pauses and lets the
session idle out on its own; "Check now" extends it. It uses the session your
browser already has and never sees, stores, or sends your password or session
token. There is no account, no server, and no tracking. See [PRIVACY.md](PRIVACY.md).

### What it can and can't do

- It defeats an **idle** (inactivity) timeout, the usual cause of "why am I logged
  out again?"
- If ActBlue also enforces an **absolute** session limit (a hard cap no matter
  what), nothing can extend past that. The extension will notice the session
  ended, tell you once, and pick back up after you sign in again.

## Install

Browsers do not allow one-click install for extensions outside their stores, so
installing is two quick steps: download the package, then load it.

### 1. Download

Use the **Download** button above, or grab
[`dist/actblue-keepalive.zip`](dist/actblue-keepalive.zip) directly from this repo.

Optional but recommended: verify the download against
[`dist/actblue-keepalive.zip.sha256`](dist/actblue-keepalive.zip.sha256), for
example `sha256sum -c actblue-keepalive.zip.sha256` (or `Get-FileHash` on Windows).

### 2. Load it

1. Unzip the download.
2. Open `edge://extensions` (Edge) or `chrome://extensions` (Chrome).
3. Turn on **Developer mode**.
4. Click **Load unpacked** and select the unzipped folder (the one containing
   `manifest.json`).
5. Pin the extension, then sign in to ActBlue as usual.

### Build from source instead

Clone the repo and **Load unpacked** the `src/` folder directly. There is no build
step; the extension is plain JavaScript, HTML, and CSS, so what you load is exactly
what you can read in `src/`. To rebuild the package, run `sh scripts/package.sh`.

## Using it

- **Toolbar icon:** click it for the dropdown. A calm green dot means your session
  is alive; a muted amber `!` means it ended (sign in to resume); grey means off,
  paused, or unreachable.
- **On/off switch** is at the top of the dropdown.
- **Keep my session alive for:** a slider with ticks from 30 minutes to Unlimited
  (default 3 hours). That is how long the extension holds your session before it
  lets it idle out.
- **Check now** runs an immediate check and extends the window.
- **Advanced:** the ping interval (how often it checks while the window is open,
  minimum 1 minute) and the keepalive URL (kept on `secure.actblue.com`).

## Use at your own risk

This is an independent tool that interacts with a third-party website you do not
control. Keeping a session open longer than usual is a convenience that has a
flip side: an authenticated dashboard stays reachable for longer. Use it on a
personal device you control, lock your screen when you step away, and sign out of
ActBlue when you finish. It is provided as is, without warranty; ActBlue can change
its site at any time, which may stop this from working. See [SECURITY.md](SECURITY.md).

## How it works

| File | Role |
|---|---|
| `src/manifest.json` | MV3 manifest. Permissions: `alarms`, `storage`, `notifications`. Host: `secure.actblue.com` only. |
| `src/background.js` | Service worker. While the keep-alive window is open, an alarm fires a credentialed `GET` and classifies the result as alive, ended, paused, or unreachable. |
| `src/popup.html`, `popup.js` | The dropdown: status, on/off, duration slider, advanced settings, Check now. |
| `src/about.html` | In-extension about page. |

See [docs/hld.md](docs/hld.md) for the architecture.

## Permissions, explained

- `host_permissions: https://secure.actblue.com/*`: to make the keepalive request.
  This is the only site the extension can touch.
- `alarms`: to run the check on a schedule.
- `storage`: to remember your settings and last status, locally.
- `notifications`: to tell you once if your session ended.

No `<all_urls>`, no content scripts, no access to any other site.

## Contributing and reporting

- Issues and pull requests are welcome. See [CONTRIBUTING.md](CONTRIBUTING.md) and
  the [Code of Conduct](CODE_OF_CONDUCT.md).
- To report a security concern, see [SECURITY.md](SECURITY.md).

## License

[Apache License 2.0](LICENSE). Provided as is, without warranty of any kind.
