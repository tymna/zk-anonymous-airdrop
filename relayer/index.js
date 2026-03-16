import "dotenv/config";
import express from "express";
import cors from "cors";
import {
  createWalletClient,
  createPublicClient,
  http,
  parseAbi,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { sepolia } from "viem/chains";

const {
  RELAYER_PRIVATE_KEY,
  AIRDROP_ADDRESS,
  RPC_URL = "http://127.0.0.1:8545",
  PORT = "3001",
} = process.env;

if (!RELAYER_PRIVATE_KEY || !AIRDROP_ADDRESS) {
  console.error("Missing RELAYER_PRIVATE_KEY or AIRDROP_ADDRESS");
  process.exit(1);
}

const abi = parseAbi([
  "function claim(bytes calldata proof, bytes32 nullifierHash, uint256 amount, address stealthAddress, bytes calldata ephemeralPubKey, bytes1 viewTag)",
]);

const account = privateKeyToAccount(RELAYER_PRIVATE_KEY);

const walletClient = createWalletClient({
  account,
  chain: sepolia,
  transport: http(RPC_URL),
});

const publicClient = createPublicClient({
  chain: sepolia,
  transport: http(RPC_URL),
});

const app = express();
app.use(cors());
app.use(express.json({ limit: "5mb" }));

app.post("/relay", async (req, res) => {
  const { proof, nullifierHash, amount, stealthAddress, ephemeralPubKey, viewTag } = req.body;

  if (!proof || !nullifierHash || !amount || !stealthAddress || !ephemeralPubKey || !viewTag) {
    return res.status(400).json({ error: "Missing parameters" });
  }

  try {
    const hash = await walletClient.writeContract({
      address: AIRDROP_ADDRESS,
      abi,
      functionName: "claim",
      args: [proof, nullifierHash, BigInt(amount), stealthAddress, ephemeralPubKey, viewTag],
    });

    const receipt = await publicClient.waitForTransactionReceipt({ hash });

    res.json({ txHash: hash, status: receipt.status });
  } catch (err) {
    console.error("Relay failed:", err);
    const msg = err.shortMessage || err.details || err.message;
    res.status(500).json({ error: msg });
  }
});

app.listen(Number(PORT), () => {
  console.log(`Relayer listening on :${PORT}`);
  console.log(`Relayer address: ${account.address}`);
});
