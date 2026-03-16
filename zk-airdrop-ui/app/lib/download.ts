export function downloadClaimData(data: {
  metaAddress: string;
  stealthAddress: string;
  stealthPrivateKey?: string;
  ephemeralPubKey: string;
  viewTag: string;
  proof: string;
  nullifierHash: string;
  amount: string;
}) {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `claim-${data.stealthAddress.slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
