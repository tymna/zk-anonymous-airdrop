import { Barretenberg, UltraHonkBackend } from "@aztec/bb.js";
import { Noir } from "@noir-lang/noir_js";

function hexToBuffer(hex: string): Uint8Array {
  return Uint8Array.from(
    (hex.replace("0x", "").padStart(64, "0").match(/.{2}/g) ?? []).map((b) =>
      parseInt(b, 16)
    )
  );
}

function bufferToHex(buf: Uint8Array): `0x${string}` {
  return `0x${Array.from(buf)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")}`;
}

interface TreeEntry {
  index: number;
  nullifier_secret: string;
  nullifier_hash: string;
  eligible_address: string;
  amount: string;
  leaf: string;
  merkle_proof: string[];
  is_even: boolean[];
}

interface TreeData {
  root: string;
  proofs: TreeEntry[];
}

export interface ProofResult {
  proof: `0x${string}`;
  nullifierHash: string;
  amount: string;
  publicInputs: string[];
}

export async function generateProof(
  secret: string,
  stealthAddress: string
): Promise<ProofResult> {
  // 1. Init Barretenberg
  const bb = await Barretenberg.new();

  // 2. Compute nullifier hash from secret
  const { hash: nullifierHashBuf } = await bb.poseidon2Hash({
    inputs: [hexToBuffer(secret)],
  });
  const nullifierHash = bufferToHex(nullifierHashBuf);

  // 3. Load tree data and find matching entry
  const treeData: TreeData = await fetch("/tree-data.json").then((r) =>
    r.json()
  );

  const entry = treeData.proofs.find(
    (p) => p.nullifier_hash.toLowerCase() === nullifierHash.toLowerCase()
  );
  if (!entry) {
    await bb.destroy();
    throw new Error("Secret not found in Merkle tree — you may not be eligible");
  }

  // 4. Load circuit
  const circuit = await fetch("/circuit.json").then((r) => r.json());

  // 5. Build circuit inputs
  const recipientField =
    "0x" + BigInt(stealthAddress).toString(16).padStart(64, "0");

  const input = {
    root: treeData.root,
    nullifier_hash: nullifierHash,
    amount: entry.amount,
    recipient: recipientField,
    nullifier_secret: entry.nullifier_secret,
    eligible_address:
      "0x" + BigInt(entry.eligible_address).toString(16).padStart(64, "0"),
    merkle_proof: entry.merkle_proof.map((e: string) => e.toString()),
    is_even: entry.is_even,
  };

  // 6. Execute circuit and generate proof
  const backend = new UltraHonkBackend(circuit.bytecode, bb);
  const noir = new Noir(circuit);
  const { witness } = await noir.execute(input);

  const { proof, publicInputs } = await backend.generateProof(witness, {
    verifierTarget: "evm",
  });

  const proofHex = bufferToHex(new Uint8Array(proof));
  const publicInputsHex = publicInputs.map(
    (v: string) => "0x" + BigInt(v).toString(16).padStart(64, "0")
  );

  if ("destroy" in backend) await (backend as any).destroy();
  if ("destroy" in bb) await (bb as any).destroy();

  return {
    proof: proofHex,
    nullifierHash,
    amount: entry.amount,
    publicInputs: publicInputsHex,
  };
}
