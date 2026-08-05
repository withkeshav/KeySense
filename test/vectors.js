/* KeySense test vectors.
 *
 * Loaded as a classic script in the browser (sets one global) and via require()
 * in Node. It is deliberately not JSON: the page ships a Content-Security-Policy
 * with connect-src 'none', so a test page cannot fetch a .json file, and
 * loosening that directive to make tests convenient would be a bad trade in a
 * tool that handles private keys.
 *
 * "source" tells you how much each expectation is worth:
 *   bip32/bip39/bip44/bip49/bip84/bip86/slip10 = published in the spec itself
 *   crosstool = produced by an independent implementation written from the spec
 *               (audit/reference/reference.py) and confirmed against this code.
 *               Not a published vector. Treat as a regression lock, not proof.
 */

var KEYSENSE_VECTORS = {
  schema: "keysense-vectors-1",

  mnemonics: {
    abandon12: "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about"
  },

  /* Full derivation, mnemonic to displayed address. */
  addresses: [
    { id: "eth-0", mnemonic: "abandon12", path: "m/44'/60'/0'/0/0", purpose: 44, coinType: 60,
      expected: "0x9858EfFD232B4033E47d90003D41EC34EcaEda94", source: "bip44" },
    { id: "eth-1", mnemonic: "abandon12", path: "m/44'/60'/0'/0/1", purpose: 44, coinType: 60,
      expected: "0x6Fac4D18c912343BF86fa7049364Dd4E424Ab9C0", source: "bip44" },

    { id: "btc-legacy-0", mnemonic: "abandon12", path: "m/44'/0'/0'/0/0", purpose: 44, coinType: 0,
      expected: "1LqBGSKuX5yYUonjxT5qGfpUsXKYYWeabA", source: "bip44" },
    { id: "btc-p2sh-0", mnemonic: "abandon12", path: "m/49'/0'/0'/0/0", purpose: 49, coinType: 0,
      expected: "37VucYSaXLCAsxYyAPfbSi9eh4iEcbShgf", source: "bip49" },
    { id: "btc-native-0", mnemonic: "abandon12", path: "m/84'/0'/0'/0/0", purpose: 84, coinType: 0,
      expected: "bc1qcr8te4kr609gcawutmrza0j4xv80jy8z306fyu", source: "bip84" },
    { id: "btc-native-1", mnemonic: "abandon12", path: "m/84'/0'/0'/0/1", purpose: 84, coinType: 0,
      expected: "bc1qnjg0jd8228aq7egyzacy8cys3knf9xvrerkf9g", source: "bip84" },

    /* BIP86 Test Vectors section, same mnemonic the BIP uses. */
    { id: "btc-taproot-0", mnemonic: "abandon12", path: "m/86'/0'/0'/0/0", purpose: 86, coinType: 0,
      expected: "bc1p5cyxnuxmeuwuvkwfem96lqzszd02n6xdcjrs20cac6yqjjwudpxqkedrcr", source: "bip86" },
    { id: "btc-taproot-1", mnemonic: "abandon12", path: "m/86'/0'/0'/0/1", purpose: 86, coinType: 0,
      expected: "bc1p4qhjn9zdvkux4e44uhx8tc55attvtyu358kutcqkudyccelu0was9fqzwh", source: "bip86" },
    { id: "btc-taproot-change-0", mnemonic: "abandon12", path: "m/86'/0'/0'/1/0", purpose: 86, coinType: 0,
      expected: "bc1p3qkhfews2uk44qtvauqyr2ttdsw7svhkl9nkm9s9c3x4ax5h60wqwruhk7", source: "bip86" },

    { id: "ltc-legacy-0", mnemonic: "abandon12", path: "m/44'/2'/0'/0/0", purpose: 44, coinType: 2,
      expected: "LUWPbpM43E2p7ZSh8cyTBEkvpHmr3cB8Ez", source: "crosstool" },
    { id: "ltc-native-0", mnemonic: "abandon12", path: "m/84'/2'/0'/0/0", purpose: 84, coinType: 2,
      expected: "ltc1qjmxnz78nmc8nq77wuxh25n2es7rzm5c2rkk4wh", source: "crosstool" },
    { id: "ltc-taproot-0", mnemonic: "abandon12", path: "m/86'/2'/0'/0/0", purpose: 86, coinType: 2,
      expected: "ltc1puht8rk95c53q3u9w3pf9h3jfcutcrl9lxc7rqsdthjrse4k6sn7q9tuqm9", source: "crosstool" },
    { id: "doge-legacy-0", mnemonic: "abandon12", path: "m/44'/3'/0'/0/0", purpose: 44, coinType: 3,
      expected: "DBus3bamQjgJULBJtYXpEzDWQRwF5iwxgC", source: "crosstool" },

    { id: "tron-0", mnemonic: "abandon12", path: "m/44'/195'/0'/0/0", purpose: 44, coinType: 195,
      expected: "TUEZSdKsoDHQMeZwihtdoBiN46zxhGWYdH", source: "crosstool" },
    { id: "cosmos-0", mnemonic: "abandon12", path: "m/44'/118'/0'/0/0", purpose: 44, coinType: 118,
      expected: "cosmos19rl4cm2hmr8afy4kldpxz3fka4jguq0auqdal4", source: "crosstool" },

    { id: "solana-0", mnemonic: "abandon12", path: "m/44'/501'/0'/0'", purpose: 44, coinType: 501,
      expected: "HAgk14JpMQLgt6rVgv7cBQFJWFto5Dqxi472uT3DKpqk", source: "crosstool" },
    { id: "solana-1", mnemonic: "abandon12", path: "m/44'/501'/1'/0'", purpose: 44, coinType: 501,
      expected: "Hh8QwFUA6MtVu1qAoq12ucvFHNwCcVTV7hpWjeY1Hztb", source: "crosstool" },

    /* Sui address is BLAKE2b-256(0x00 || pubkey), NOT the public key. The tool
     * displayed the public key until this was fixed; see CHANGELOG. */
    { id: "sui-0", mnemonic: "abandon12", path: "m/44'/784'/0'/0'/0'", purpose: 44, coinType: 784,
      expected: "0x5e93a736d04fbb25737aa40bee40171ef79f65fae833749e3c089fe7cc2161f1", source: "crosstool" },

    /* Aptos address is SHA3-256(pubkey || 0x00). SHA3-256, not Keccak-256. */
    { id: "aptos-0", mnemonic: "abandon12", path: "m/44'/637'/0'/0'/0'", purpose: 44, coinType: 637,
      expected: "0xeb663b681209e7087d681c5d3eed12aaa8e1915e7c87794542c3f96e94b3d3bf", source: "crosstool" }
  ],

  /* Non-address outputs that are just as easy to break. */
  keys: [
    { id: "btc-native-0-wif", kind: "wif", path: "m/84'/0'/0'/0/0", purpose: 84, coinType: 0,
      expected: "KyZpNDKnfs94vbrwhJneDi77V6jF64PWPF8x5cdJb8ifgg2DUc9d", source: "bip84" },
    { id: "eth-account-xpub", kind: "neutered", path: "m/44'/60'/0'",
      expected: "xpub6DCoCpSuQZB2jawqnGMEPS63ePKWkwWPH4TU45Q7LPXWuNd8TMtVxRrgjtEshuqpK3mdhaWHPFsBngh5GFZaM6si3yZdUsT8ddYM3PwnATt",
      source: "bip32" }
  ],

  /* SLIP-0010 ed25519, both published test vectors, every level.
   * pub carries the leading 0x00 prefix exactly as the spec prints it. */
  slip10Ed25519: [
    { seedHex: "000102030405060708090a0b0c0d0e0f", path: "m",
      key: "2b4be7f19ee27bbf30c667b642d5f4aa69fd169872f8fc3059c08ebae2eb19e7",
      chainCode: "90046a93de5380a72b5e45010748567d5ea02bbf6522f979e05c0d8d8ca9fffb",
      pub: "00a4b2856bfec510abab89753fac1ac0e1112364e7d250545963f135f2a33188ed", source: "slip10" },
    { seedHex: "000102030405060708090a0b0c0d0e0f", path: "m/0'",
      key: "68e0fe46dfb67e368c75379acec591dad19df3cde26e63b93a8e704f1dade7a3",
      chainCode: "8b59aa11380b624e81507a27fedda59fea6d0b779a778918a2fd3590e16e9c69",
      pub: "008c8a13df77a28f3445213a0f432fde644acaa215fc72dcdf300d5efaa85d350c", source: "slip10" },
    { seedHex: "000102030405060708090a0b0c0d0e0f", path: "m/0'/1'",
      key: "b1d0bad404bf35da785a64ca1ac54b2617211d2777696fbffaf208f746ae84f2",
      chainCode: "a320425f77d1b5c2505a6b1b27382b37368ee640e3557c315416801243552f14",
      pub: "001932a5270f335bed617d5b935c80aedb1a35bd9fc1e31acafd5372c30f5c1187", source: "slip10" },
    { seedHex: "000102030405060708090a0b0c0d0e0f", path: "m/0'/1'/2'",
      key: "92a5b23c0b8a99e37d07df3fb9966917f5d06e02ddbd909c7e184371463e9fc9",
      chainCode: "2e69929e00b5ab250f49c3fb1c12f252de4fed2c1db88387094a0f8c4c9ccd6c",
      pub: "00ae98736566d30ed0e9d2f4486a64bc95740d89c7db33f52121f8ea8f76ff0fc1", source: "slip10" },
    { seedHex: "000102030405060708090a0b0c0d0e0f", path: "m/0'/1'/2'/2'",
      key: "30d1dc7e5fc04c31219ab25a27ae00b50f6fd66622f6e9c913253d6511d1e662",
      chainCode: "8f6d87f93d750e0efccda017d662a1b31a266e4a6f5993b15f5c1f07f74dd5cc",
      pub: "008abae2d66361c879b900d204ad2cc4984fa2aa344dd7ddc46007329ac76c429c", source: "slip10" },
    { seedHex: "000102030405060708090a0b0c0d0e0f", path: "m/0'/1'/2'/2'/1000000000'",
      key: "8f94d394a8e8fd6b1bc2f3f49f5c47e385281d5c17e65324b0f62483e37e8793",
      chainCode: "68789923a0cac2cd5a29172a475fe9e0fb14cd6adb5ad98a3fa70333e7afa230",
      pub: "003c24da049451555d51a7014a37337aa4e12d41e485abccfa46b47dfb2af54b7a", source: "slip10" },

    { seedHex: "fffcf9f6f3f0edeae7e4e1dedbd8d5d2cfccc9c6c3c0bdbab7b4b1aeaba8a5a29f9c999693908d8a8784817e7b7875726f6c696663605d5a5754514e4b484542",
      path: "m",
      key: "171cb88b1b3c1db25add599712e36245d75bc65a1a5c9e18d76f9f2b1eab4012",
      chainCode: "ef70a74db9c3a5af931b5fe73ed8e1a53464133654fd55e7a66f8570b8e33c3b",
      pub: "008fe9693f8fa62a4305a140b9764c5ee01e455963744fe18204b4fb948249308a", source: "slip10" },
    { seedHex: "fffcf9f6f3f0edeae7e4e1dedbd8d5d2cfccc9c6c3c0bdbab7b4b1aeaba8a5a29f9c999693908d8a8784817e7b7875726f6c696663605d5a5754514e4b484542",
      path: "m/0'",
      key: "1559eb2bbec5790b0c65d8693e4d0875b1747f4970ae8b650486ed7470845635",
      chainCode: "0b78a3226f915c082bf118f83618a618ab6dec793752624cbeb622acb562862d",
      pub: "0086fab68dcb57aa196c77c5f264f215a112c22a912c10d123b0d03c3c28ef1037", source: "slip10" },
    { seedHex: "fffcf9f6f3f0edeae7e4e1dedbd8d5d2cfccc9c6c3c0bdbab7b4b1aeaba8a5a29f9c999693908d8a8784817e7b7875726f6c696663605d5a5754514e4b484542",
      path: "m/0'/2147483647'",
      key: "ea4f5bfe8694d8bb74b7b59404632fd5968b774ed545e810de9c32a4fb4192f4",
      chainCode: "138f0b2551bcafeca6ff2aa88ba8ed0ed8de070841f0c4ef0165df8181eaad7f",
      pub: "005ba3b9ac6e90e83effcd25ac4e58a1365a9e35a3d3ae5eb07b9e4d90bcf7506d", source: "slip10" },
    { seedHex: "fffcf9f6f3f0edeae7e4e1dedbd8d5d2cfccc9c6c3c0bdbab7b4b1aeaba8a5a29f9c999693908d8a8784817e7b7875726f6c696663605d5a5754514e4b484542",
      path: "m/0'/2147483647'/1'",
      key: "3757c7577170179c7868353ada796c839135b3d30554bbb74a4b1e4a5a58505c",
      chainCode: "73bd9fff1cfbde33a1b846c27085f711c0fe2d66fd32e139d3ebc28e5a4a6b90",
      pub: "002e66aa57069c86cc18249aecf5cb5a9cebbfd6fadeab056254763874a9352b45", source: "slip10" },
    { seedHex: "fffcf9f6f3f0edeae7e4e1dedbd8d5d2cfccc9c6c3c0bdbab7b4b1aeaba8a5a29f9c999693908d8a8784817e7b7875726f6c696663605d5a5754514e4b484542",
      path: "m/0'/2147483647'/1'/2147483646'",
      key: "5837736c89570de861ebc173b1086da4f505d4adb387c6a1b1342d5e4ac9ec72",
      chainCode: "0902fe8a29f9140480a00ef244bd183e8a13288e4412d8389d140aac1794825a",
      pub: "00e33c0f7d81d843c572275f287498e8d408654fdf0d1e065b84e2e6f157aab09b", source: "slip10" },
    { seedHex: "fffcf9f6f3f0edeae7e4e1dedbd8d5d2cfccc9c6c3c0bdbab7b4b1aeaba8a5a29f9c999693908d8a8784817e7b7875726f6c696663605d5a5754514e4b484542",
      path: "m/0'/2147483647'/1'/2147483646'/2'",
      key: "551d333177df541ad876a60ea71f00447931c0a9da16f227c11ea080d7391b8d",
      chainCode: "5d70af781f3a37b829f0d060924d5e960bdc02e85423494afc0b1a41bbe196d4",
      pub: "0047150c75db263559a70d5778bf36abbab30fb061ad69f69ece61a72b0cfa4fc0", source: "slip10" }
  ],

  /* Things that must fail, and fail with the message the UI keys off. */
  negative: [
    { id: "slip10-unhardened-last", path: "m/44'/501'/0'/0", coinType: 501, purpose: 44,
      throwsMatching: "invalid derivation path",
      why: "Ed25519 has no unhardened derivation. main.js matches this message to show the hardening hint." },
    { id: "slip10-unhardened-mid", path: "m/44'/501'/0/0'", coinType: 501, purpose: 44,
      throwsMatching: "invalid derivation path" }
  ],

  /* Entropy lab, reproducible mode only. Mixed mode is non-deterministic by
   * design and is covered by a separate "two runs differ" assertion. */
  /* Input lengths are deliberately at the minimum the entropy gate accepts:
   * 50 dice rolls clears 128 bits (floor(50 * 2.585) = 129), 100 clears 256
   * (258). Anything shorter would start failing once the gate lands. */
  entropyLab: [
    { id: "entropy-12w-dice50",
      dice: "12345612345612345612345612345612345612345612345612", coins: "",
      words: 12, deterministic: true, expected: "across music choose carpet vacuum own dune achieve daring milk turkey invest", source: "frozen" },
    { id: "entropy-24w-dice100",
      dice: "1234561234561234561234561234561234561234561234561234561234561234561234561234561234561234561234561234",
      coins: "", words: 24, deterministic: true, expected: "wrap dream spike obtain rug energy fancy organ tiny behave jelly bounce pizza gap celery wedding faith goose toss gym bleak mercy unveil toward", source: "frozen" },
    { id: "entropy-12w-coins128", dice: "",
      coins: "HTHTHTHTHTHTHTHTHTHTHTHTHTHTHTHTHTHTHTHTHTHTHTHTHTHTHTHTHTHTHTHTHTHTHTHTHTHTHTHTHTHTHTHTHTHTHTHTHTHTHTHTHTHTHTHTHTHTHTHTHTHTHTHT",
      words: 12, deterministic: true, expected: "amount syrup sponsor clog draft grain permit art spatial moral depth west", source: "frozen" },
    { id: "entropy-12w-mixed-sources", dice: "1234561234561234561234561", coins: "HTHTHTHTHTHTHTHTHTHTHTHTHTHTHTHTHTHTHTHTHTHTHTHTHTHTHTHTHTHTHTHT",
      words: 12, deterministic: true, expected: "sting merry cute viable fuel found arrest close uphold tragic marriage eye", source: "frozen",
      note: "25 rolls (64 bits) plus 64 flips (64 bits) sums to exactly 128" }
  ],

  /* Brain wallet. Deliberately weak by design; these lock the demo, not endorse it. */
  brainWallet: [
    { id: "brain-xkcd", passphrase: "correct horse battery staple",
      expectedEth: "0xbc5f7b96F113AA74fe3B6AC9Cb3B447b138fb5Fc", source: "frozen" }
  ]
};

if (typeof module !== "undefined" && module.exports) { module.exports = KEYSENSE_VECTORS; }
