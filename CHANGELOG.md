# Changelog

## 1.0.0 - 2026-07-30

### Added
- BIP86 Bitcoin Taproot preset (`m/86'/0'/0'/0/0`) with fallback address display
- `btc-taproot` dev mode override for custom path testing
- `CHANGELOG.md`
- Paper wallet print now includes the private key, WIF (Bitcoin-style chains), and public key, in addition to the address and seed words

### Changed
- **Renamed project** from "HD Wallet Derivation Playground" to **KeySense**
- Branding: new tagline, title, meta description, header, subtitle
- `package.json`: name → `keysense`, description, license → MIT, then replaced with a custom source-available license (see below)
- `README.md`: rewritten with VPS deployment instructions
- License changed from MIT to a custom **KeySense License 1.0**: free to download and use for any purpose including commercial, but modifying, rebranding, or redistributing a modified copy requires the copyright holder's written permission
- "Developer mode" toggle (Step 3, custom path) renamed to "Expert mode" for consistency with the Step 1 toggle
- Paper wallet print layout reordered: seed words on top, then address/path/keys, then branding and a fuller disclaimer at the bottom; added the `keysense.withkeshav.com` URL alongside the GitHub link

### Fixed
- file:// support: converted ES modules (`type=module` + `import`/`export`) to regular scripts loaded in dependency order
- `vanityInputLabel` naming conflict (DOM element vs global function)
- Removed dead `if (!inf)` block in batch derive loop
- SLIP-0010 error message now accurately explains hardening requirement
- Brain wallet Solana derivation: 15s timeout guard to prevent indefinite hang
- Sticky seed bar CSS was accidentally nested inside a `max-width: 480px` media query, so it rendered unstyled on desktop; fixed and set to wrap and show the full mnemonic at any word count, with sticky behavior disabled on mobile
- Paper wallet print silently dropped the private key even though it was passed in; it now actually renders
- "Learn Paths" link to the Physical entropy lab did not enable Expert mode, so the panel it tried to open was invisible
- A few hint texts pointed users to "Path recovery" on the Derive tab; it actually lives on the Experiments tab

### Notes
- BIP86 Taproot shows P2PKH (Legacy) address as fallback - full schnorr key tweak needs an ECC library
- Solana and Brain Wallet tabs require HTTPS (graceful error on file://)
