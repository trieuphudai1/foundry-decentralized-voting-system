import { useEffect, useMemo, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  usePublicClient,
  useAccount,
  useChainId,
  useReadContract,
  useReadContracts,
  useSwitchChain,
  useWaitForTransactionReceipt,
  useWriteContract
} from "wagmi";
import { isAddress } from "viem";
import { listPollMetadata } from "../services/pollApi";
import { hashPollContent } from "../utils/hashPollContent";
import { verifyPollIntegrity } from "../utils/verifyPollIntegrity";
import { sepolia } from "./config";
import { VOTING_CONTRACT_ADDRESS, votingAbi, votingContract } from "./votingContract";

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
  const {
    data: metadata = [],
    isLoading: isMetadataLoading,
    error: metadataError,
    refetch: refetchMetadata
  } = useQuery({
    queryKey: ["pollMetadata"],
    queryFn: listPollMetadata
  });

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
    const metadataByPollId = new Map(metadata.map((item) => [String(item.pollId), item]));
    return ids.map((id, index) => {
      const pollResult = data[index * 2]?.result;
      const optionCount = data[index * 2 + 1]?.result ?? 0n;
      if (!pollResult) return null;
      const [pollId, contentHash, deadline, isActive] = pollResult;
      const offChain = metadataByPollId.get(pollId.toString());
      const onChainPoll = { id: pollId, contentHash, deadline, isActive, optionCount };
      const integrity = verifyPollIntegrity(offChain, onChainPoll);
      return {
        id: pollId,
        contentHash,
        deadline,
        isActive,
        optionCount,
        isExpired: BigInt(Math.floor(Date.now() / 1000)) >= deadline,
        metadata: offChain || null,
        title: offChain?.title || `Poll #${pollId.toString()}`,
        description: offChain?.description || "Metadata is not available from MongoDB.",
        options: offChain?.options || [],
        integrity
      };
    }).filter(Boolean).reverse();
  }, [data, ids, metadata]);

  const refetch = async () => {
    await Promise.all([refetchCount(), refetchPolls(), refetchMetadata()]);
  };

  return {
    polls,
    count: count || 0n,
    hasCount: count !== undefined,
    isLoading: isCountLoading || arePollsLoading || isMetadataLoading,
    error: countError || pollsError || metadataError,
    refetch
  };
}

export function usePollDetail(poll, voter) {
  const optionIndexes = useMemo(() => {
    const total = Number(poll?.optionCount || 0n);
    return Array.from({ length: total }, (_, index) => BigInt(index));
  }, [poll?.optionCount]);

  const {
    data: accountState,
    error: accountStateError,
    isLoading: isAccountStateLoading,
    refetch: refetchAccountState
  } = useReadContracts({
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
    isAccountStateLoading,
    accountStateError,
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
      onSettled(hash, receipt.data);
    }
  }, [hash, receipt.data, receipt.isSuccess, onSettled]);

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

export function useAdminStatus() {
  const { address, isConnected } = useAccount();
  const ownerQuery = useOwner();
  const owner = ownerQuery.data;
  const isAdmin = Boolean(
    isConnected &&
    address &&
    owner &&
    address.toLowerCase() === owner.toLowerCase()
  );

  return {
    address,
    owner,
    isConnected,
    isAdmin,
    isLoading: Boolean(isConnected && ownerQuery.isLoading),
    error: ownerQuery.error
  };
}

export function useWhitelistedWallets(pollId, enabled = true) {
  const publicClient = usePublicClient();
  const pollIdText = String(pollId ?? "").trim();
  const parsedPollId = Number(pollId);
  const isPollIdValid = pollIdText !== "" && Number.isInteger(parsedPollId) && parsedPollId >= 0;
  const deploymentBlock = getDeploymentFromBlock();
  const logBlockRange = getLogBlockRange();

  return useQuery({
    queryKey: [
      "whitelistedWallets",
      publicClient?.chain?.id,
      VOTING_CONTRACT_ADDRESS,
      parsedPollId,
      deploymentBlock?.toString() || "recent",
      logBlockRange.toString()
    ],
    enabled: Boolean(enabled && publicClient && isPollIdValid),
    queryFn: async () => {
      const latestBlock = await publicClient.getBlockNumber();
      const fromBlock = deploymentBlock ?? getFallbackFromBlock(latestBlock);
      const logs = await getVoterWhitelistedLogs(publicClient, fromBlock, latestBlock, logBlockRange);
      const matchingLogs = logs.filter((log) => BigInt(log.args?.pollId ?? -1) === BigInt(parsedPollId));
      const unique = new Map();

      for (const log of matchingLogs) {
        const voter = log.args?.voter;
        if (!voter) continue;
        const key = voter.toLowerCase();
        if (!unique.has(key)) {
          unique.set(key, voter);
        }
      }

      return Array.from(unique.values());
    }
  });
}

function getDeploymentFromBlock() {
  const value = import.meta.env.VITE_DEPLOYMENT_BLOCK;
  if (!value) return null;

  try {
    const block = BigInt(value);
    return block > 0n ? block : null;
  } catch (_error) {
    console.warn("Invalid VITE_DEPLOYMENT_BLOCK. Falling back to a recent block range for VoterWhitelisted logs.");
    return null;
  }
}

function getLogBlockRange() {
  const value = import.meta.env.VITE_LOG_BLOCK_RANGE;
  if (!value) return 10n;

  try {
    const range = BigInt(value);
    return range > 0n ? range : 10n;
  } catch (_error) {
    console.warn("Invalid VITE_LOG_BLOCK_RANGE. Falling back to 10 blocks per VoterWhitelisted getLogs request.");
    return 10n;
  }
}

function getFallbackFromBlock(latestBlock) {
  const fallbackWindow = 100000n;
  console.warn("VITE_DEPLOYMENT_BLOCK is not set. Reading VoterWhitelisted logs from a recent block range only.");
  if (latestBlock <= fallbackWindow) return 1n;
  return latestBlock - fallbackWindow;
}

async function getVoterWhitelistedLogs(publicClient, fromBlock, latestBlock, chunkSize) {
  const logs = [];

  for (let current = fromBlock; current <= latestBlock;) {
    const toBlock = current + chunkSize - 1n > latestBlock ? latestBlock : current + chunkSize - 1n;
    try {
      const chunk = await publicClient.getContractEvents({
        address: VOTING_CONTRACT_ADDRESS,
        abi: votingAbi,
        eventName: "VoterWhitelisted",
        fromBlock: current,
        toBlock
      });
      logs.push(...chunk);
    } catch (error) {
      console.error("Failed to read VoterWhitelisted logs", {
        error,
        fromBlock: current.toString(),
        toBlock: toBlock.toString(),
        chunkSize: chunkSize.toString()
      });
      throw error;
    }
    current = toBlock + 1n;
  }

  return logs;
}

export function buildContentHash({ title, description }) {
  return hashPollContent({ title, description });
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
