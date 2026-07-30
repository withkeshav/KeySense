# Changelog

## 1.0.0 — 2026-07-30

### Added
- BIP86 Bitcoin Taproot preset (`m/86'/0'/0'/0/0`) with fallback address display
- `btc-taproot` dev mode override for custom path testing
- `CHANGELOG.md`

### Changed
- **Renamed project** from "HD Wallet Derivation Playground" to **KeySense**
- Branding: new tagline, title, meta description, header, subtitle
- `package.json`: name → `keysense`, description, license → MIT
- `README.md`: rewritten with VPS deployment instructions

### Fixed
- file:// support: converted ES modules (`type=module` + `import`/`export`) to regular scripts loaded in dependency order
- `vanityInputLabel` naming conflict (DOM element vs global function)
- Removed dead `if (!inf)` block in batch derive loop
- SLIP-0010 error message now accurately explains hardening requirement
- Brain wallet Solana derivation: 15s timeout guard to prevent indefinite hang

### Notes
- BIP86 Taproot shows P2PKH (Legacy) address as fallback — full schnorr key tweak needs an ECC library
- Solana and Brain Wallet tabs require HTTPS (graceful error on file://)
