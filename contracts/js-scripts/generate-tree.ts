import { Barretenberg, Fr } from "@aztec/bb.js-legacy";
import { writeFileSync } from "fs";

const DEPTH = 20;
const NUM_RANDOM = 93;
const NUM_PROOFS = 10;

const KNOWN_ELIGIBLE: { address: string; amount: number }[] = [
  { address: "0x2a3b257b4641bC307EEB8463E9975d17c0D5f656", amount: 1000 },
  { address: "0xCd926c7cfC17adF27Cf8DE5Ffe1079dEb8EEa908", amount: 1000 },
  { address: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266", amount: 1000 },
];

// ── Poseidon2 helpers ──────────────────────────────────────────────

function hash2(bb: Barretenberg, left: Fr, right: Fr): Promise<Fr> {
  return bb.poseidon2Hash([left, right]);
}

function hashLeaf(bb: Barretenberg, nullifierSecret: Fr, eligibleAddress: Fr, amount: Fr): Promise<Fr> {
  return bb.poseidon2Hash([nullifierSecret, eligibleAddress, amount]);
}

// ── Merkle tree ────────────────────────────────────────────────────

interface Tree {
  layers: Fr[][];
  zeros: Fr[];
}

async function buildTree(bb: Barretenberg, leaves: Fr[]): Promise<Tree> {
  const zeros: Fr[] = [Fr.ZERO];
  for (let i = 1; i <= DEPTH; i++) {
    zeros[i] = await hash2(bb, zeros[i - 1], zeros[i - 1]);
  }

  const layers: Fr[][] = [leaves.slice()];
  for (let level = 1; level <= DEPTH; level++) {
    const prev = layers[level - 1];
    const nodes: Fr[] = [];
    const pairs = Math.ceil(Math.max(prev.length, 1) / 2);
    for (let i = 0; i < pairs; i++) {
      const left = prev[2 * i] ?? zeros[level - 1];
      const right = prev[2 * i + 1] ?? zeros[level - 1];
      nodes.push(await hash2(bb, left, right));
    }
    layers[level] = nodes;
  }

  return { layers, zeros };
}

interface Proof {
  pathElements: Fr[];
  pathIndices: number[];
}

function getProof(layers: Fr[][], zeros: Fr[], index: number): Proof {
  const pathElements: Fr[] = [];
  const pathIndices: number[] = [];
  let idx = index;

  for (let level = 0; level < DEPTH; level++) {
    const isLeft = idx % 2 === 0;
    const siblingIdx = isLeft ? idx + 1 : idx - 1;
    const sibling = layers[level][siblingIdx] ?? zeros[level];
    pathElements.push(sibling);
    pathIndices.push(isLeft ? 0 : 1);
    idx = Math.floor(idx / 2);
  }

  return { pathElements, pathIndices };
}

// ── Main ───────────────────────────────────────────────────────────

async function main() {
  const bb = await Barretenberg.new();

  const eligibles: {
    index: number;
    nullifier_secret: string;
    nullifier_hash: string;
    eligible_address: string;
    amount: string;
    leaf: string;
  }[] = [];
  const leaves: Fr[] = [];

  // Add known eligible addresses
  for (const { address, amount } of KNOWN_ELIGIBLE) {
    const nullifierSecret = Fr.random();
    const eligibleAddress = new Fr(BigInt(address));
    const amt = new Fr(BigInt(amount));
    const leaf = await hashLeaf(bb, nullifierSecret, eligibleAddress, amt);
    const nullifierHash = await bb.poseidon2Hash([nullifierSecret]);

    leaves.push(leaf);
    eligibles.push({
      index: leaves.length - 1,
      nullifier_secret: nullifierSecret.toString(),
      nullifier_hash: nullifierHash.toString(),
      eligible_address: address,
      amount: amount.toString(),
      leaf: leaf.toString(),
    });
  }

  // Fill remaining with random addresses
  for (let i = 0; i < NUM_RANDOM; i++) {
    const nullifierSecret = Fr.random();
    const eligibleAddress = Fr.random();
    const amount = new Fr(BigInt(Math.floor(Math.random() * 1000) + 1));
    const leaf = await hashLeaf(bb, nullifierSecret, eligibleAddress, amount);
    const nullifierHash = await bb.poseidon2Hash([nullifierSecret]);

    leaves.push(leaf);
    eligibles.push({
      index: leaves.length - 1,
      nullifier_secret: nullifierSecret.toString(),
      nullifier_hash: nullifierHash.toString(),
      eligible_address: eligibleAddress.toString(),
      amount: amount.toString(),
      leaf: leaf.toString(),
    });
  }

  const { layers, zeros } = await buildTree(bb, leaves);
  const root = layers[DEPTH][0].toString();

  // Generate proofs for first NUM_PROOFS leaves
  const proofs: object[] = [];
  let allOk = true;
  for (let idx = 0; idx < NUM_PROOFS; idx++) {
    const { pathElements, pathIndices } = getProof(layers, zeros, idx);

    // Self-check
    let hash = leaves[idx];
    for (let i = 0; i < DEPTH; i++) {
      hash = pathIndices[i] === 0
        ? await hash2(bb, hash, pathElements[i])
        : await hash2(bb, pathElements[i], hash);
    }
    if (hash.toString() !== root) allOk = false;

    proofs.push({
      ...eligibles[idx],
      merkle_proof: pathElements.map((e) => e.toString()),
      is_even: pathIndices.map((i) => i === 0),
    });
  }

  console.log(`Tree built: ${leaves.length} leaves, root: ${root}`);
  console.log(`Self-check (${NUM_PROOFS} proofs): ${allOk ? "PASS" : "FAIL"}`);

  writeFileSync("tree-data.json", JSON.stringify({ root, proofs }, null, 2));
  console.log("Wrote tree-data.json");

  await bb.destroy();
}

main().catch(console.error);
