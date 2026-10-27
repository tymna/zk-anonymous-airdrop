"use client";

import { useState } from "react";
import {
  generateMetaAddressFromPrivkeys,
  generateStealthAddress,
  type StealthKeypair,
} from "../lib/stealth";
import { generateProof } from "../lib/prove";
import { downloadClaimData } from "../lib/download";

export type MetaMode = "generate" | "existing";

export function useClaimFlow() {
  const [metaMode, setMetaMode] = useState<MetaMode>("generate");

  // Step 1 — meta-address
  const [spendPrivInput, setSpendPrivInput] = useState("");
  const [viewPrivInput, setViewPrivInput] = useState("");
  const [metaAddress, setMetaAddress] = useState<StealthKeypair | null>(null);
  const [metaAddressInput, setMetaAddressInput] = useState("");

  // Step 2 — stealth address
  const [stealthAddress, setStealthAddress] = useState("");
  const [ephemeralPubKey, setEphemeralPubKey] = useState("");
  const [viewTag, setViewTag] = useState("");

  // Step 3 — proof
  const [secret, setSecret] = useState("");
  const [proof, setProof] = useState("");
  const [nullifierHash, setNullifierHash] = useState("");
  const [amount, setAmount] = useState("");
  const [proving, setProving] = useState(false);
  const [proofError, setProofError] = useState("");

  // Step 1 — errors
  const [metaError, setMetaError] = useState("");

  // Step 4 — submit
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [txHash, setTxHash] = useState("");

  function handleGenerateMetaAddress() {
    setMetaError("");
    try {
      const result = generateMetaAddressFromPrivkeys(spendPrivInput, viewPrivInput);
      setMetaAddress(result);
      setMetaAddressInput(result.uriMetaAddress);
    } catch (err) {
      if (err instanceof Error && err.message.includes("expected Uint8Array of length 32")) {
        setMetaError("private key must be 32 bytes (64 hex chars) — you may have pasted an address instead");
      } else {
        setMetaError(err instanceof Error ? err.message : "Invalid key input");
      }
    }
  }

  // Step 2 — errors
  const [stealthError, setStealthError] = useState("");

  // stealth private key (only available in "generate" mode)
  const [stealthPrivateKey, setStealthPrivateKey] = useState("");

  function handleGenerateStealthAddress() {
    setStealthError("");
    try {
      const spendPriv = metaMode === "generate" ? spendPrivInput : undefined;
      const result = generateStealthAddress(metaAddressInput, spendPriv);
      setStealthAddress(result.stealthAddress);
      setEphemeralPubKey(result.ephemeralPublicKey);
      setViewTag(result.viewTag);
      if (result.stealthPrivateKey) {
        setStealthPrivateKey(result.stealthPrivateKey);
      }
    } catch (err) {
      setStealthError(
        err instanceof Error ? err.message : "failed to derive stealth address"
      );
    }
  }

  async function handleGenerateProof() {
    setProving(true);
    setProofError("");
    try {
      const result = await generateProof(secret, stealthAddress);
      setProof(result.proof);
      setNullifierHash(result.nullifierHash);
      setAmount(result.amount);
      downloadClaimData({
        metaAddress: metaAddressInput,
        stealthAddress,
        stealthPrivateKey: stealthPrivateKey || undefined,
        ephemeralPubKey,
        viewTag,
        proof: result.proof,
        nullifierHash: result.nullifierHash,
        amount: result.amount,
      });
    } catch (err) {
      setProofError(
        err instanceof Error ? err.message : "proof generation failed"
      );
    } finally {
      setProving(false);
    }
  }

  async function handleSubmitFromFile(file: File) {
    setSubmitting(true);
    setSubmitError("");
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      const { proof: p, nullifierHash: nh, amount: a, stealthAddress: sa, ephemeralPubKey: epk, viewTag: vt } = data;
      if (!p || !nh || !sa || !epk || !vt) {
        throw new Error("invalid claim file — missing required fields");
      }
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_RELAYER_URL ?? "http://localhost:3001"}/relay`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            proof: p,
            nullifierHash: nh,
            amount: a,
            stealthAddress: sa,
            ephemeralPubKey: epk,
            viewTag: vt,
          }),
        }
      );
      const result = await res.json();
      if (!res.ok) throw new Error(result.error ?? "relay failed");
      setTxHash(result.txHash);
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "submission failed"
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSubmit() {
    setSubmitting(true);
    setSubmitError("");
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_RELAYER_URL ?? "http://localhost:3001"}/relay`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            proof,
            nullifierHash,
            amount,
            stealthAddress,
            ephemeralPubKey,
            viewTag,
          }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "relay failed");
      setTxHash(data.txHash);
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "submission failed"
      );
    } finally {
      setSubmitting(false);
    }
  }

  function handleReset() {
    setMetaAddress(null);
    setMetaAddressInput("");
    setSpendPrivInput("");
    setViewPrivInput("");
    setStealthAddress("");
    setEphemeralPubKey("");
    setViewTag("");
    setProof("");
    setNullifierHash("");
    setAmount("");
    setSecret("");
    setProofError("");
    setMetaError("");
    setStealthError("");
    setSubmitError("");
    setTxHash("");
    setStealthPrivateKey("");
  }

  return {
    // Step 1
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
    handleGenerateMetaAddress,

    // Step 2
    stealthAddress,
    stealthError,
    ephemeralPubKey,
    viewTag,
    handleGenerateStealthAddress,

    // Step 3
    secret,
    setSecret,
    proof,
    proving,
    proofError,
    nullifierHash,
    amount,
    handleGenerateProof,

    // Step 4
    submitting,
    submitError,
    txHash,
    handleSubmit,
    handleSubmitFromFile,

    // Reset
    handleReset,
  };
}
