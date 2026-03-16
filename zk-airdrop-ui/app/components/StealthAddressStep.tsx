export function StealthAddressStep({
  metaAddressInput,
  stealthAddress,
  stealthError,
  ephemeralPubKey,
  viewTag,
  onGenerate,
}: {
  metaAddressInput: string;
  stealthAddress: string;
  stealthError: string;
  ephemeralPubKey: string;
  viewTag: string;
  onGenerate: () => void;
}) {
  return (
    <section className="flex flex-col gap-4">
      <div>
        <p className="text-white/30">2</p>
        <p className="text-sm text-rose-400/50">
          derive a one-time stealth address from your meta-address — this is
          where tokens will be sent
        </p>
      </div>
      {metaAddressInput && (
        <p className="text-xs text-white/20 break-all">
          using: {metaAddressInput}
        </p>
      )}
      <button
        onClick={onGenerate}
        disabled={!!stealthAddress}
        className="action-btn cursor-pointer self-start text-white/60 transition-colors hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
      >
        {stealthAddress ? "stealth address set" : "get stealth address"}
      </button>
      {stealthError && (
        <p className="text-sm text-amber-300">{stealthError}</p>
      )}
      {stealthAddress && (
        <div className="flex flex-col gap-1">
          <p className="text-sm text-white/40 break-all">{stealthAddress}</p>
          <p className="text-xs text-white/20 break-all">
            ephemeral: {ephemeralPubKey}
          </p>
          <p className="text-xs text-white/20">view tag: {viewTag}</p>
        </div>
      )}
    </section>
  );
}
