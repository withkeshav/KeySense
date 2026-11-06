# Wallet learning feature research

Reviewed: 2026-11-06. These are proposals, not shipped features. The priority order
is a product judgment based on the learning gaps below, not a measured user study.
Keep first versions offline and use public fixtures. Do not add live signing,
broadcasting or network connections without a separate design and security review.

| Priority | Proposed learning tool | What the reader would do | Evidence of learning |
|---|---|---|---|
| 1 | Transaction and change explorer | Choose fictional Bitcoin inputs, recipient and fee; inspect the change output | Explain every output, the fee and which outputs belong to the wallet |
| 2 | Permission and signature inspector | Compare a token transfer, allowance and typed-data request; change spender, network or expiry | Explain who gains which right and why disconnecting is not revocation |
| 3 | Multisig recovery lab | Rebuild a public two-of-three policy from descriptors, then remove a signer or policy field | Separate sufficient signing keys from sufficient recovery data |
| 4 | PSBT inspection lab | Read a fixed Partially Signed Bitcoin Transaction, including input/output details, missing data and signing stages | Identify unknowns and refuse an unverified change output |
| 5 | Wallet discovery lab | Vary account, index, address format and a simulated address gap using public examples | State what a finite search has and has not ruled out |
| 6 | Backup rehearsal | Classify example seed, passphrase, policy and channel-state records | Explain what each wallet model needs without entering real secrets |

## Primary sources and implications

- [Sparrow coin-control FAQ](https://sparrowwallet.com/docs/faq.html) describes choosing
  which coins to spend. This supports teaching input selection, change and fee
  tradeoffs, rather than showing only the final address.
- [EIP-712](https://eips.ethereum.org/EIPS/eip-712) specifies typed structured signing
  data and domain separation. Human-readable fields still need interpretation;
  rendering them is not a safe/unsafe verdict. Teach domain, chain and contract checks.
- [Ethereum token revocation guide](https://ethereum.org/guides/how-to-revoke-token-access)
  distinguishes a disconnected site from an existing allowance. Use separate
  connection and permission states in a fictional exercise.
- [Bitcoin Core PSBT guide](https://github.com/bitcoin/bitcoin/blob/master/doc/psbt.md)
  describes roles in creating, updating, signing, combining and finalizing a PSBT.
  An inspection-only exercise can teach those roles without requesting real keys.
- [BIP380 descriptors](https://github.com/bitcoin/bips/blob/master/bip-0380.mediawiki)
  describes output-script descriptors. Use public descriptors to demonstrate that
  a seed list does not fully describe a shared wallet's spending policy.
- [BIP44 discovery](https://github.com/bitcoin/bips/blob/master/bip-0044.mediawiki)
  describes account discovery and an address gap limit. A simulation should explain
  that wallet behavior varies and an unsuccessful bounded scan is not proof of loss.
- [LND recovery](https://github.com/lightningnetwork/lnd/blob/master/docs/recovery.md)
  separates on-chain and channel recovery. Use it to explain why static keys and
  changing channel state cannot be treated as the same backup problem.

## Proposed acceptance criteria

Each tool needs a stated scope, a fixed public fixture, a worked failure case,
a changed case and an explanation of missing evidence. Validate any computed value
against a pinned specification vector or independent implementation before release.
Test keyboard use, phone layout and learning explanations as well as calculations.
Do not award expertise for clicking through steps. Observe readers on unseen cases.

Start with the transaction/change explorer and permission inspector. They fill the
largest gap between today's key derivation tools and understanding what a wallet
actually authorizes. The rest can follow once those two pass reader testing.
