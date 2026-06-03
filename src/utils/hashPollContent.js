import { keccak256, toBytes } from "viem";

export function normalizePollContent({ title, description }) {
  return {
    title: String(title || "").trim(),
    description: String(description || "").trim()
  };
}

export function hashPollContent(content) {
  const { title, description } = normalizePollContent(content);
  return keccak256(toBytes(`${title}${description}`));
}
