"use client";

import { useClaimFlow } from "./hooks/useClaimFlow";
import { MetaAddressStep } from "./components/MetaAddressStep";
import { StealthAddressStep } from "./components/StealthAddressStep";
import { ProofStep } from "./components/ProofStep";
import { SubmitStep } from "./components/SubmitStep";

export default function Home() {
  const flow = useClaimFlow();

  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col gap-16 px-6 py-20">
      <p className="text-xs text-white/20">
        nothing leaves your browser — after steps 1-3 your claim data is saved
        to a local file only you control
      </p>

      <MetaAddressStep
        metaMode={flow.metaMode}
        setMetaMode={flow.setMetaMode}
        spendPrivInput={flow.spendPrivInput}
        setSpendPrivInput={flow.setSpendPrivInput}
        viewPrivInput={flow.viewPrivInput}
        setViewPrivInput={flow.setViewPrivInput}
        metaAddress={flow.metaAddress}
        metaError={flow.metaError}
        metaAddressInput={flow.metaAddressInput}
        setMetaAddressInput={flow.setMetaAddressInput}
        onGenerate={flow.handleGenerateMetaAddress}
      />

      <StealthAddressStep
        metaAddressInput={flow.metaAddressInput}
        stealthAddress={flow.stealthAddress}
        stealthError={flow.stealthError}
        ephemeralPubKey={flow.ephemeralPubKey}
        viewTag={flow.viewTag}
        onGenerate={flow.handleGenerateStealthAddress}
      />

      <ProofStep
        secret={flow.secret}
        setSecret={flow.setSecret}
        stealthAddress={flow.stealthAddress}
        proof={flow.proof}
        proving={flow.proving}
        proofError={flow.proofError}
        nullifierHash={flow.nullifierHash}
        amount={flow.amount}
        onGenerate={flow.handleGenerateProof}
      />

      <SubmitStep
        proof={flow.proof}
        submitting={flow.submitting}
        submitError={flow.submitError}
        txHash={flow.txHash}
        onSubmit={flow.handleSubmit}
        onSubmitFromFile={flow.handleSubmitFromFile}
        onReset={flow.handleReset}
      />
    </main>
  );
}
