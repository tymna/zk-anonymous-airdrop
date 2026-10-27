import * as secp from "@noble/secp256k1";
import { bytesToHex, hexToBytes, keccak256, getAddress } from "viem";

function toHex(bytes: Uint8Array): `0x${string}` {
  return bytesToHex(bytes);
}

export type StealthKeypair = {
  spendPriv: `0x${string}`;
  viewPriv: `0x${string}`;
  spendPubCompressed: `0x${string}`;
  viewPubCompressed: `0x${string}`;
  stealthMetaAddressHex: `0x${string}`;
  uriMetaAddress: string;
};

export function generateMetaAddressFromPrivkeys(
  spendPrivHex: string,
  viewPrivHex: string
): StealthKeypair {
  const spendPriv = hexToBytes(spendPrivHex as `0x${string}`);
  const viewPriv = hexToBytes(viewPrivHex as `0x${string}`);

  const spendPubCompressed = secp.getPublicKey(spendPriv, true);
  const viewPubCompressed = secp.getPublicKey(viewPriv, true);

  const spendPubUncompressed = secp.getPublicKey(spendPriv, false);
  const viewPubUncompressed = secp.getPublicKey(viewPriv, false);

  const metaBytes = new Uint8Array(66);
  metaBytes.set(spendPubCompressed, 0);
  metaBytes.set(viewPubCompressed, 33);

  const spendHex = toHex(spendPubUncompressed).slice(2);
  const viewHex = toHex(viewPubUncompressed).slice(2);
  const uri = `st:eth:0x${spendHex}${viewHex}`;

  return {
    spendPriv: toHex(spendPriv),
    viewPriv: toHex(viewPriv),
    spendPubCompressed: toHex(spendPubCompressed),
    viewPubCompressed: toHex(viewPubCompressed),
    stealthMetaAddressHex: toHex(metaBytes),
    uriMetaAddress: uri,
  };
}

export function parseMetaAddress(metaAddress: string): {
  spendingPublicKeyHex: string;
  viewingPublicKeyHex: string;
} {
  const parts = metaAddress.split(":");
  if (parts.length < 3) throw new Error("Invalid meta-address format");

  const keysPart = parts[2].replace("0x", "");

  if (keysPart.length !== 260) {
    throw new Error("Expected 130-byte uncompressed keys concatenated");
  }

  return {
    spendingPublicKeyHex: "0x" + keysPart.slice(0, 130),
    viewingPublicKeyHex: "0x" + keysPart.slice(130, 260),
  };
}

export type StealthResult = {
  stealthAddress: `0x${string}`;
  ephemeralPublicKey: `0x${string}`;
  viewTag: `0x${string}`;
  stealthPrivateKey?: `0x${string}`;
};

export function generateStealthAddress(
  metaAddress: string,
  spendPrivHex?: string
): StealthResult {
  const { spendingPublicKeyHex, viewingPublicKeyHex } =
    parseMetaAddress(metaAddress);

  const spendPub = spendingPublicKeyHex.replace("0x", "");
  const viewPub = viewingPublicKeyHex.replace("0x", "");

  const ephemeralPrivateKey = secp.utils.randomSecretKey();
  const ephemeralPublicKey = secp.getPublicKey(ephemeralPrivateKey, false);

  const viewPubBytes = hexToBytes(`0x${viewPub}` as `0x${string}`);
  const sharedSecret = secp.getSharedSecret(
    ephemeralPrivateKey,
    viewPubBytes,
    false
  );

  const sharedSecretHash = keccak256(toHex(sharedSecret));
  const hashedSecretBytes = hexToBytes(sharedSecretHash);

  const viewTag = toHex(hashedSecretBytes.slice(0, 1));

  const scalar = BigInt(sharedSecretHash);
  const hG = secp.Point.BASE.multiply(scalar);
  const P_spend = secp.Point.fromHex(spendPub);
  const P_stealth = P_spend.add(hG);

  const stealthPubHex = `0x${P_stealth.toHex(false)}` as `0x${string}`;

  const pubKeyBytes = hexToBytes(stealthPubHex);
  const pubKeyWithoutPrefix = pubKeyBytes.slice(1);
  const addrHash = keccak256(toHex(pubKeyWithoutPrefix));
  const stealthAddress = getAddress(
    `0x${addrHash.slice(-40)}`
  ) as `0x${string}`;

  let stealthPrivateKey: `0x${string}` | undefined;
  if (spendPrivHex) {
    const spendPrivScalar = BigInt(`0x${spendPrivHex.replace("0x", "")}`);
    const N = 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141n;
    const stealthPrivScalar =
      (spendPrivScalar + scalar) % N;
    const privHex = stealthPrivScalar.toString(16).padStart(64, "0");
    stealthPrivateKey = `0x${privHex}`;
  }

  return {
    stealthAddress,
    ephemeralPublicKey: toHex(ephemeralPublicKey),
    viewTag,
    stealthPrivateKey,
  };
}
