# Contributing

Thanks for taking the time to look. This is a small, deliberately simple tool, and
keeping it auditable matters more than adding features.

## Ground rules

- Be kind and constructive. See the [Code of Conduct](CODE_OF_CONDUCT.md).
- For a security concern, do not open a public issue. Follow [SECURITY.md](SECURITY.md).
- Keep the extension least-privilege. New permissions or a new host are a hard
  sell and need a clear, documented reason. Requests to ActBlue stay read-only
  `GET`s.
- No analytics, telemetry, third-party calls, or bundled dependencies. The shipped
  code stays plain, readable JavaScript that a user can audit without a build step.

## Develop and test locally

There is no build step.

1. Clone the repository.
2. Open `edge://extensions` or `chrome://extensions`, turn on Developer mode, and
   "Load unpacked" the `src/` folder.
3. Make your change in `src/`, then use the extension's reload button on the
   extensions page to pick it up.
4. Manual check: open the popup, "Check now", confirm "Session alive" while signed
   in to ActBlue and "Session ended" after signing out.

## Pull requests

- Branch from the default branch and open a PR against it.
- Keep changes focused; one logical change per PR.
- Use [Conventional Commits](https://www.conventionalcommits.org/) for commit
  messages (for example `fix: handle 302 as ended`).
- Do not use em-dashes in code, comments, docs, or commit messages; use a comma,
  period, colon, semicolon, or parentheses.
- Update [CHANGELOG.md](CHANGELOG.md) under "Unreleased" when your change is
  user-visible.
- By contributing, you agree your contribution is licensed under the project's
  [Apache License 2.0](LICENSE).

## Releases

Releases are cut from a git tag (`vX.Y.Z`). CI packages `src/` into a zip with
`manifest.json` at the root and attaches it, plus a SHA-256 checksum, to the
GitHub Release.
