const inputStyle =
  "w-full bg-white/[0.03] border-b border-white/10 px-3 py-2 text-sm text-white/80 placeholder-white/30 outline-none focus:border-rose-400/30";

const secretInputStyle =
  `${inputStyle} secret-input`;

export function ProofStep({
  secret,
  setSecret,
  stealthAddress,
  proof,
  proving,
  proofError,
  nullifierHash,
  amount,
  onGenerate,
}: {
  secret: string;
  setSecret: (v: string) => void;
  stealthAddress: string;
  proof: string;
  proving: boolean;
  proofError: string;
  nullifierHash: string;
  amount: string;
  onGenerate: () => void;
}) {
  return (
    <section className="flex flex-col gap-4">
      <div>
        <p className="text-white/30">3</p>
        <p className="text-sm text-rose-400/50">
          generate a zk proof that you are eligible to claim without revealing
          your identity
        </p>
      </div>
      <input
        type="text"
        placeholder="secret"
        value={secret}
        onChange={(e) => setSecret(e.target.value)}
        autoComplete="off"
        className={secretInputStyle}
      />
      <button
        onClick={onGenerate}
        disabled={proving || !secret || !stealthAddress || !!proof}
        className="action-btn cursor-pointer self-start text-white/60 transition-colors hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
      >
        {proving
          ? "generating proof..."
          : proof
            ? "proof generated"
            : "generate proof"}
      </button>
      {proofError && (
        <p className="text-sm text-amber-300">{proofError.toLowerCase().replace(/\.+$/, "")}</p>
      )}
      {proof && (
        <div className="flex flex-col gap-1">
          <p className="text-sm text-white/40 break-all">
            proof: {proof.slice(0, 66)}...
          </p>
          <p className="text-xs text-white/20">nullifier: {nullifierHash}</p>
          <p className="text-xs text-white/20">amount: {amount}</p>
        </div>
      )}
    </section>
  );
}
