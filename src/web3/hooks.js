import { useEffect, useMemo, useRef } from "react";
import {
  useAccount,
  useChainId,
  useReadContract,
  useReadContracts,
  useSwitchChain,
  useWaitForTransactionReceipt,
  useWriteContract
} from "wagmi";
import { isAddress, keccak256, stringToHex } from "viem";
import { sepolia } from "./config";
import { votingContract } from "./votingContract";

export function useNetworkGuard() {
  const chainId = useChainId();
  const { switchChainAsync, isPending } = useSwitchChain();
  const isSepolia = chainId === sepolia.id;

  const ensureSepolia = async () => {
    if (!isSepolia) {
      await switchChainAsync({ chainId: sepolia.id });
    }
  };

  return { isSepolia, ensureSepolia, isSwitching: isPending };
}

export function usePolls() {
  const { data: count, isLoading: isCountLoading, error: countError, refetch: refetchCount } = useReadContract({
    ...votingContract,
    functionName: "getPollCount"
  });

  const ids = useMemo(() => {
    const pollCount = Number(count || 0n);
    return Array.from({ length: pollCount }, (_, index) => BigInt(index));
  }, [count]);

  const pollContracts = ids.flatMap((id) => [
    { ...votingContract, functionName: "getPoll", args: [id] },
    { ...votingContract, functionName: "optionCount", args: [id] }
  ]);

  const {
    data,
    isLoading: arePollsLoading,
    error: pollsError,
    refetch: refetchPolls
  } = useReadContracts({
    contracts: pollContracts,
    query: { enabled: ids.length > 0 }
  });

  const polls = useMemo(() => {
    if (!data) return [];
    return ids.map((id, index) => {
      const pollResult = data[index * 2]?.result;
      const optionCount = data[index * 2 + 1]?.result ?? 0n;
      if (!pollResult) return null;
      const [pollId, contentHash, deadline, isActive] = pollResult;
      return {
        id: pollId,
        contentHash,
        deadline,
        isActive,
        optionCount,
        isExpired: BigInt(Math.floor(Date.now() / 1000)) >= deadline
      };
    }).filter(Boolean).reverse();
  }, [data, ids]);

  const refetch = async () => {
    await Promise.all([refetchCount(), refetchPolls()]);
  };

  return {
    polls,
    count: count || 0n,
    isLoading: isCountLoading || arePollsLoading,
    error: countError || pollsError,
    refetch
  };
}

export function usePollDetail(poll, voter) {
  const optionIndexes = useMemo(() => {
    const total = Number(poll?.optionCount || 0n);
    return Array.from({ length: total }, (_, index) => BigInt(index));
  }, [poll?.optionCount]);

  const { data: accountState, refetch: refetchAccountState } = useReadContracts({
    contracts: voter && poll ? [
      { ...votingContract, functionName: "isWhitelisted", args: [poll.id, voter] },
      { ...votingContract, functionName: "hasUserVoted", args: [poll.id, voter] }
    ] : [],
    query: { enabled: Boolean(voter && poll) }
  });

  const { data: voteData, isLoading, refetch: refetchVotes } = useReadContracts({
    contracts: poll ? optionIndexes.map((option) => ({
      ...votingContract,
      functionName: "getVoteCount",
      args: [poll.id, option]
    })) : [],
    query: { enabled: Boolean(poll && optionIndexes.length) }
  });

  const options = optionIndexes.map((option, index) => ({
    index,
    votes: voteData?.[index]?.result ?? 0n
  }));

  const refetch = async () => {
    await Promise.all([refetchVotes(), refetchAccountState()]);
  };

  return {
    options,
    isWhitelisted: accountState?.[0]?.result,
    hasVoted: accountState?.[1]?.result,
    isLoading,
    refetch
  };
}

export function useVotingWrite(onSettled) {
  const { ensureSepolia } = useNetworkGuard();
  const { writeContractAsync, data: hash, isPending, error, reset } = useWriteContract();
  const receipt = useWaitForTransactionReceipt({ hash });
  const settledHash = useRef();

  const write = async ({ functionName, args }) => {
    await ensureSepolia();
    return writeContractAsync({
      ...votingContract,
      functionName,
      args
    });
  };

  useEffect(() => {
    if (receipt.isSuccess && hash && settledHash.current !== hash && onSettled) {
      settledHash.current = hash;
      onSettled(hash);
    }
  }, [hash, receipt.isSuccess, onSettled]);

  return {
    write,
    hash,
    reset,
    error: error || receipt.error,
    status: isPending ? "pending" : receipt.isLoading ? "mining" : receipt.isSuccess ? "success" : receipt.isError ? "error" : "idle",
    isBusy: isPending || receipt.isLoading
  };
}

export function useOwner() {
  return useReadContract({
    ...votingContract,
    functionName: "owner"
  });
}

export function buildContentHash({ title, description, options }) {
  return keccak256(stringToHex(JSON.stringify({
    title: title.trim(),
    description: description.trim(),
    options: options.map((option) => option.trim()).filter(Boolean)
  })));
}

export function parseAddresses(value) {
  return value
    .split(/\s|,|;/)
    .map((address) => address.trim())
    .filter(Boolean)
    .filter((address, index, arr) => arr.indexOf(address) === index)
    .map((address) => {
      if (!isAddress(address)) throw new Error(`Invalid address: ${address}`);
      return address;
    });
}

export function getFriendlyError(error) {
  const message = error?.shortMessage || error?.message || "";
  if (!message) return "";
  if (/user rejected|denied transaction|rejected/i.test(message)) return "User rejected transaction.";
  if (/wrong network|chain/i.test(message)) return "Wrong network. Please switch to Sepolia.";
  if (/Already voted/i.test(message)) return "Already voted.";
  if (/Poll expired/i.test(message)) return "Poll expired.";
  if (/Not whitelisted/i.test(message)) return "Not whitelisted.";
  if (/Invalid option/i.test(message)) return "Invalid option.";
  if (/owner|OwnableUnauthorizedAccount|Only owner|admin/i.test(message)) return "Only owner/admin can perform this action.";
  return message;
}
