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

## Data policy

What data exists around this tool, why it exists, who touches it, and how long it is kept.

| Data | Who collects it | Why | Where it lives | How long |
|---|---|---|---|---|
| Anything you type or derive: seeds, passphrases, keys, addresses | nobody | not applicable | never leaves the browser tab | not applicable |
| Request traces: IP address, time, requested file, user agent, referrer, TLS handshake data | the CDN in front of the site (Cloudflare) and the server that runs it | deliver the page, stop abuse, rate limit | those two systems, never the app | set by them, not by this project |
| Theme choice, light or dark | the app, on your device only | remember your choice | your browser's `localStorage`, key `hd-tool-theme` | until you clear site data |
| Anything you post in a GitHub issue | GitHub, and you decide the content | bug reports and questions | on GitHub, publicly visible | until you delete it |

What this means in plain terms:

* We do not collect personal data, wallet data, accounts, emails, or usage analytics. There is no sign up, no profile, and no server side record of anything you derive.
* Nothing is sold, rented, shared, or handed to advertisers or data brokers. There is no ad network and no third party script. The code libraries are served from this same site, not from a CDN.
* Only two third parties are involved, and both are infrastructure: the CDN and server that deliver the files, and GitHub, which hosts the source and the issue tracker. Neither receives wallet data, because wallet data never leaves your browser.
* Retention: this project stores nothing, so it sets no retention period and can give no number for one. Log retention is a hosting and CDN setting. If you want the current figure, ask in an issue and it will be answered with the measured value rather than an estimate.
* Deleting your data: there is nothing stored by the app to delete. Clear site data to remove the theme preference. To avoid leaving server traces at all, use the offline copy, which contacts nothing.
* Security: the site is served over HTTPS, but the stronger protection here is architectural. The page ships `connect-src 'none'`, so it has no way to send data anywhere even if injected code tried to.
* Children: the tool is educational and collects nothing from anyone, so there is nothing for it to collect from a child either. The only caution is the subject matter: a child should not type a seed that holds real money.

## Your control

* Use the page offline or from a local copy for maximum privacy: clone `https://github.com/withkeshav/KeySense`, open `index.html` directly, or serve it with `python3 -m http.server`.
* Clear the sticky seed bar with Clear when done on a shared screen. Print output is paper only.
* Contact through GitHub issues. Do not paste seeds or private keys anywhere, including issues.

## Changes

Material changes to this policy will be noted in `CHANGELOG.md` before release.
