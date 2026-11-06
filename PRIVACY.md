# Privacy Policy

Last updated: 2026-11-06

This policy describes the KeySense app and its hosted site, maintained by Keshav
Maheshwari. It does not promise privacy on a compromised browser or device.

## Wallet inputs and learning

The app processes seed words, passphrases, keys and addresses locally. Its own code
does not upload those values or create user accounts. The optional hosted-release
analytics integration described below measures visits, not wallet inputs. The wallet
course and Recovery Detective keep their state in memory and do not save scores.
In the tracker-free copy, only the light/dark theme is stored in browser localStorage, under `hd-tool-theme`,
until you clear site data. The app does not set cookies.

The page restricts network connections with its content security policy. That is a
layer of protection, not a guarantee: navigation, extensions, compromised software,
clipboard tools and other device features can expose data. Never use a real wallet
backup in this educational tool. See [SECURITY.md](SECURITY.md).

## Hosted-release analytics

The hosted package for keysense.withkeshav.com loads InsightFlare once from
stats.withkeshav.com. The site ID is public and shared with other withkeshav.com
apps; the dashboard separates traffic by hostname. Repository copies and default
release downloads contain no tracker. Analytics is enabled only by the explicit
`--hosted` packaging option, using locally stored deployment settings that are
not included in GitHub downloads. The generated hosted HTML exposes the public
tracker URL and site ID.

InsightFlare is cookieless, but the current integration is not entry-only tracking.
The script and configuration inspected on 2026-11-06 send:

- Page visits, hostname, path, page title, referrer, URL query strings and fragments.
- Visit timestamps, duration, and when the page becomes visible or hidden.
- Page-load and interaction timing measurements, not the contents of interactions.
- Browser/device details, language, timezone and screen dimensions.
- A random visitor ID stored in localStorage, which can link repeat visits.

The current configuration enables performance sampling for all visits, disables
automatic outbound-link tracking, and ignores the browser's Do Not Track setting.
Requests also disclose connection metadata to the analytics service. Do not put
wallet secrets or personal information in URLs, which are included in visit data.

KeySense does not call the tracker's custom-event or identify functions and has
no tracker-marked form or click elements. In the script inspected, we found no
reading or submission of seed fields, passphrases, keys, addresses, quiz answers,
or generated results, and no screen recording. This is a review of the current
code, not a guarantee about future versions of the remotely served script.
The tracker automatically observes URL changes; the app's current section switches
do not change the URL. Its visibility and timing events still describe page activity.

The hosted policy permits scripts and connections to stats.withkeshav.com.
It also permits Cloudflare Web Analytics scripts from static.cloudflareinsights.com
and connections to cloudflareinsights.com and the same-origin /cdn-cgi/rum endpoint
when the hosting service injects its beacon.
Remote JavaScript runs with access to the page, including its inputs. This is an
additional trust dependency; cookieless analytics does not isolate it from wallet
data. The remote script can change independently of this repository. Analytics
retention and server-side processing have not been independently verified here.
Use the tracker-free copy with the network disconnected for offline learning.

## Hosting and external services

Opening the hosted site sends requests to the hosting provider and Cloudflare,
which delivers and protects the site. Requests may reveal IP address, time,
requested file, browser details and other connection metadata. These systems may
process logs or security reports to operate the service and detect abuse. They do
not receive wallet inputs through the app's intended operation.

The origin web logs are configured for daily rotation with 14 rotated files.
This is a rotation setting, not a guarantee that every copy is deleted within
14 days. Provider logs, backups and Cloudflare records may have separate retention.
Their complete retention periods have not been independently verified. We do not
claim that hosted visits are anonymous or that no personal data is processed.

Source links and links to GitHub or the maintainer's website open external services.
Those services receive normal navigation data and apply their own privacy policies.
GitHub issues and comments are public. Deleting a post does not guarantee removal
from caches, notifications, backups or other people's copies. Do not post secrets.

## Copying and printing

Copying sends the selected data to your device clipboard. Clipboard history, sync
and other apps may retain it. Printing sends output to the browser and print system.
Printers, print servers, saved PDFs, cloud print services and photographs may keep
copies. The printed QR code contains the address, not the seed or private key.
The written seed and private key on the sheet remain secret material.

Clear removes the app's displayed results and print data. Closing the tab ends the
normal app session. Neither action securely erases device memory, screenshots,
clipboard history, print jobs, saved files or backups.

## Learning research

Automated readability checks inspect lesson text, not users. The optional local
reader-session page does not submit answers. If a person facilitates a study, they
must explain what notes they will keep, why, for how long and how to withdraw before
collecting answers. Publish only consented, de-identified results. No completed
reader study or measured learning gain is claimed for this release.

## Your choices and contact

Use a complete local copy without network access to avoid hosted-site requests
while using it. Downloading the copy still involves a request. Clear site data to
remove the theme preference. Use only public or disposable examples, including
when teaching children or sharing a screen.

Raise non-sensitive privacy questions through the
[project issue tracker](https://github.com/withkeshav/KeySense/issues). For sensitive
security reports, follow [SECURITY.md](SECURITY.md). Do not include a seed, private
key or other private data in a public issue. Applicable privacy rights depend on
your location and the processing involved; this notice does not waive them.

Material changes to this policy are recorded in [CHANGELOG.md](https://github.com/withkeshav/KeySense/blob/master/CHANGELOG.md).
