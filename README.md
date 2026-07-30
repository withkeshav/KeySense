# HD Wallet Derivation Playground

Standalone edition of the HD wallet derivation tool — extracted from the keshav-reports monorepo.

Created by [Keshav Maheshwari](https://www.linkedin.com/in/withkeshav)

Multi-chain HD wallet derivation playground — BIP39/32/44/49/84/86, vanity miner, brain wallet.

## Usage

Serve with any static file server:

```bash
npx serve .
# or
python3 -m http.server 8080
```

Then open the URL in a browser (requires HTTPS for Brain Wallet tab — use Cloudflare Pages or a local server).

All derivation happens in the browser. No keys are transmitted.
