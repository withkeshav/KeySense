# Privacy Policy

Last updated: 2026-09-26

KeySense runs entirely in your browser. This policy covers both the app itself and the hosting of the site on a custom domain.

## The app collects nothing

* No seed phrases, private keys, addresses, or derived values leave your device. All derivation happens locally with vendored libraries served from the same origin.
* No `fetch`, no `XMLHttpRequest`, no `WebSocket`, no `sendBeacon`, no analytics, no telemetry. The page ships `connect-src 'none'`, so even injected script has no way to send data out. See `SECURITY.md`.
* No cookies are set by the app. Theme choice only is kept in `localStorage` under `hd-tool-theme`. Nothing secret is stored there.
* The app works with the network off after load and from `file://` on an air-gapped machine.

## What the hosting still sees

When you open the hosted site, the server must receive a basic request to send the files. Like almost every site, that can leave routine server traces:

* IP address, date and time, requested file, user agent, referrer, TLS handshake data.
* These traces live with the host or CDN in front of it, not in the app. They are kept for operations and security only, such as rate limiting and abuse review, and are not joined to any wallet data because the app never sends wallet data.
* This project sets no marketing cookies and runs no trackers. If the host adds any, that would be a hosting change to disclose here first.

## Your control

* Use the page offline or from a local copy for maximum privacy: clone `https://github.com/withkeshav/KeySense`, open `index.html` directly, or serve it with `python3 -m http.server`.
* Clear the sticky seed bar with Clear when done on a shared screen. Print output is paper only.
* Contact through GitHub issues. Do not paste seeds or private keys anywhere, including issues.

## Changes

Material changes to this policy will be noted in `CHANGELOG.md` before release.
