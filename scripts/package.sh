#!/usr/bin/env sh
# Build the distributable extension package: a zip with manifest.json at the zip
# root (required for load-unpacked and store upload), plus a SHA-256 checksum.
# Output goes to dist/. Run from anywhere; needs `zip` and `sha256sum` (available
# on Linux, macOS, and WSL; on Windows use WSL or Git Bash with zip installed).
set -eu

root="$(cd "$(dirname "$0")/.." && pwd)"
cd "$root"

mkdir -p dist
rm -f dist/actblue-keepalive.zip dist/actblue-keepalive.zip.sha256

( cd src && zip -rq "../dist/actblue-keepalive.zip" . -x '*.DS_Store' )
( cd dist && sha256sum actblue-keepalive.zip > actblue-keepalive.zip.sha256 )

echo "built dist/actblue-keepalive.zip"
cat dist/actblue-keepalive.zip.sha256
