import { useRef } from "react";

export function SubmitStep({
  proof,
  submitting,
  submitError,
  txHash,
  onSubmit,
  onSubmitFromFile,
  onReset,
}: {
  proof: string;
  submitting: boolean;
  submitError: string;
  txHash: string;
  onSubmit: () => void;
  onSubmitFromFile: (file: File) => void;
  onReset: () => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) onSubmitFromFile(file);
  }

  return (
    <>
      {proof && (
        <div className="flex flex-col gap-2">
          <p className="text-xs text-amber-400/60">
            careful — only step 4 goes on-chain and cannot be reverted. you can
            safely redo steps 1-3 if something looks wrong
          </p>
          <button
            onClick={onReset}
            className="action-btn cursor-pointer self-start text-xs text-white/30 transition-colors hover:text-white/60"
          >
            start over
          </button>
        </div>
      )}
      <section className="flex flex-col gap-4">
        <div>
          <p className="text-white/30">4</p>
          <p className="text-sm text-rose-400/50">
            submit the proof to the relayer — it will call the contract on your
            behalf so your address stays hidden
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={onSubmit}
            disabled={submitting || !proof || !!txHash}
            className="action-btn cursor-pointer self-start text-white/60 transition-colors hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {submitting
              ? "submitting..."
              : txHash
                ? "claim submitted"
                : "submit proof"}
          </button>
          <span className="text-xs text-white/20">or</span>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={submitting || !!txHash}
            className="action-btn cursor-pointer text-white/40 transition-colors hover:text-white/60 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            upload claim file
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
        {submitError && (
          <p className="text-sm text-amber-300">{submitError.toLowerCase().replace(/\.+$/, "")}</p>
        )}
        {txHash && (
          <div className="flex flex-col gap-1">
            <p className="text-sm text-green-400/70">claim successful</p>
            <a
              href={`https://sepolia.etherscan.io/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-white/40 break-all hover:text-white/60"
            >
              {txHash}
            </a>
          </div>
        )}
      </section>
    </>
  );
}
