import { hashPollContent } from "./hashPollContent";

export function verifyPollIntegrity(metadata, onChainPoll) {
  if (!metadata || !onChainPoll?.contentHash) {
    return {
      status: "missing",
      expectedHash: onChainPoll?.contentHash,
      actualHash: null,
      isVerified: false
    };
  }

  const actualHash = hashPollContent(metadata);
  const expectedHash = String(onChainPoll.contentHash).toLowerCase();

  return {
    status: actualHash.toLowerCase() === expectedHash ? "verified" : "tampered",
    expectedHash,
    actualHash,
    isVerified: actualHash.toLowerCase() === expectedHash
  };
}
