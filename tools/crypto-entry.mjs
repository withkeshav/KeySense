/* Entry point for the only build artifact in this repository.
 *
 * Everything else the tool needs is already provided by the vendored ethers
 * 5.7.2 and tweetnacl 1.0.3 classic scripts:
 *
 *   HMAC-SHA512  ethers.utils.computeHmac("sha512", ...)   SLIP-0010
 *   ed25519      nacl.sign.keyPair.fromSeed                Solana, Sui, Aptos
 *   secp256k1    ethers.utils.computePublicKey             everything else
 *   SHA-256, RIPEMD160, keccak256                          ethers
 *
 * These two hash functions are the only primitives neither library has, and
 * no browser exposes either through Web Crypto:
 *
 *   blake2b   Sui address   = BLAKE2b-256(0x00 || pubkey)
 *   sha3_256  Aptos address = SHA3-256(pubkey || 0x00)
 *
 * SHA3-256 is not Keccak-256. They differ in padding, so ethers.utils.keccak256
 * cannot stand in for it.
 *
 * Rebuild with tools/build-crypto.sh. Verify with tools/build-crypto.sh --check.
 */
export { blake2b } from "@noble/hashes/blake2b";
export { sha3_256 } from "@noble/hashes/sha3";
