import type { MetaMode } from "../hooks/useClaimFlow";
import type { StealthKeypair } from "../lib/stealth";

const inputStyle =
  "w-full bg-white/[0.03] border-b border-white/10 px-3 py-2 text-sm text-white/80 placeholder-white/30 outline-none focus:border-rose-400/30";

const secretInputStyle =
  `${inputStyle} secret-input`;

export function MetaAddressStep({
  metaMode,
  setMetaMode,
  spendPrivInput,
  setSpendPrivInput,
  viewPrivInput,
  setViewPrivInput,
  metaAddress,
  metaError,
  metaAddressInput,
  setMetaAddressInput,
  onGenerate,
}: {
  metaMode: MetaMode;
  setMetaMode: (mode: MetaMode) => void;
  spendPrivInput: string;
  setSpendPrivInput: (v: string) => void;
  viewPrivInput: string;
  setViewPrivInput: (v: string) => void;
  metaAddress: StealthKeypair | null;
  metaError: string;
  metaAddressInput: string;
  setMetaAddressInput: (v: string) => void;
  onGenerate: () => void;
}) {
  return (
    <section className="flex flex-col gap-4">
      <div>
        <p className="text-white/30">1</p>
        <p className="text-sm text-rose-400/50">
          provide your stealth meta-address
        </p>
      </div>

      <div className="flex items-center gap-3">
        <span className="text-xs text-rose-400/50">choose:</span>
        <button
          onClick={() => setMetaMode("generate")}
          className={`cursor-pointer rounded-full border px-2.5 py-0.5 text-xs transition-colors ${
            metaMode === "generate"
              ? "border-rose-400/30 text-rose-300/80"
              : "border-white/10 text-white/20 hover:border-white/20 hover:text-white/40"
          }`}
        >
          generate from keys
        </button>
        <button
          onClick={() => setMetaMode("existing")}
          className={`cursor-pointer rounded-full border px-2.5 py-0.5 text-xs transition-colors ${
            metaMode === "existing"
              ? "border-rose-400/30 text-rose-300/80"
              : "border-white/10 text-white/20 hover:border-white/20 hover:text-white/40"
          }`}
        >
          paste meta-address
        </button>
      </div>

      {metaMode === "generate" ? (
        <>
          <input
            type="text"
            placeholder="spending private key"
            value={spendPrivInput}
            onChange={(e) => setSpendPrivInput(e.target.value)}
            autoComplete="off"
            className={secretInputStyle}
          />
          <input
            type="text"
            placeholder="view private key"
            value={viewPrivInput}
            onChange={(e) => setViewPrivInput(e.target.value)}
            autoComplete="off"
            className={secretInputStyle}
          />
          <button
            onClick={onGenerate}
            disabled={!!metaAddress}
            className="action-btn cursor-pointer self-start text-white/60 transition-colors hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {metaAddress ? "meta-address set" : "generate meta address"}
          </button>
          {metaError && (
            <p className="text-sm text-amber-300">{metaError}</p>
          )}
          {metaAddress && (
            <p className="text-sm text-white/40 break-all">
              {metaAddress.uriMetaAddress}
            </p>
          )}
        </>
      ) : (
        <input
          type="text"
          placeholder="meta address (st:eth:0x...)"
          value={metaAddressInput}
          onChange={(e) => setMetaAddressInput(e.target.value)}
          className={inputStyle}
        />
      )}
    </section>
  );
}
