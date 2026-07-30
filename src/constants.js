export const THEME_KEY = "hd-tool-theme";

export const BECH32_CHARS = "qpzry9x8gf2tvdw0s3jn54khce6mua7l";
export const BECH32_GEN = [0x3b6a57b2, 0x26508e6d, 0x1ea119fa, 0x3d4233dd, 0x2a1462b3];
export const BECH32M_CONST = 0x2bc830a3;

export const COIN_PARAMS = {
  0: { name: "Bitcoin", p2pkh: 0x00, p2sh: 0x05, wif: 0x80, bech32: "bc" },
  2: { name: "Litecoin", p2pkh: 0x30, p2sh: 0x32, wif: 0xb0, bech32: "ltc" },
  3: { name: "Dogecoin", p2pkh: 0x1e, p2sh: 0x16, wif: 0x9e, bech32: "doge" },
};

export const HD_HARDENED = 0x80000000;
