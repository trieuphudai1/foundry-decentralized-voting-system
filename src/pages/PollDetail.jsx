import { useCallback, useState } from "react";
import { BadgeCheck, CircleAlert, Clock3, Copy, Fingerprint, Link2, LockKeyhole, UserRound, UsersRound, Vote } from "lucide-react";
import { useAccount } from "wagmi";
import { getFriendlyError, useNetworkGuard, usePollDetail, useVotingWrite } from "../web3/hooks";
import {
  BackButton,
  Detail,
  EmptyPage,
  IntegrityNotice,
  StatusTag,
  formatDeadline,
  shortAddress,
  shortHash
} from "../components/SharedUI";

function getVoteDisabledReason({ isConnected, isSepolia, poll, detail }) {
  if (!isConnected) return "Connect wallet first.";
  if (!isSepolia) return "Switch to Sepolia.";
  if (poll?.integrity?.status === "tampered") return "Off-chain metadata hash mismatch.";
  if (poll?.integrity?.status === "missing") return "Poll metadata is missing from MongoDB.";
  if (!poll?.isActive || poll?.isExpired) return "Poll expired or closed.";
  if (detail.hasVoted) return "Already voted.";
  if (detail.isWhitelisted === false) return "You cannot vote because this wallet is not whitelisted.";
  return "";
}

export default function PollDetail({ poll, setRoute, setTx, refetchPolls }) {
  const { address, isConnected } = useAccount();
  const { isSepolia } = useNetworkGuard();
  const [selectedOption, setSelectedOption] = useState(0);
  const refresh = useCallback(() => {
    refetchPolls();
  }, [refetchPolls]);
  const detail = usePollDetail(poll, isSepolia ? address : undefined);
  const writer = useVotingWrite(async (hash) => {
    await detail.refetch();
    refresh();
    setTx({ status: "success", title: "Vote submitted successfully", text: "Poll data refreshed from contract.", hash });
  });

  if (!poll) return <EmptyPage setRoute={setRoute} />;

  const totalVotes = detail.options.reduce((sum, option) => sum + option.votes, 0n);
  const disabledReason = getVoteDisabledReason({ isConnected, isSepolia, poll, detail, writer });

  const submitVote = async () => {
    try {
      setTx({ status: "pending", title: "Waiting for confirmation", text: "Confirm the vote transaction in MetaMask." });
      const hash = await writer.write({ functionName: "vote", args: [poll.id, BigInt(selectedOption)] });
      setTx({ status: "mining", title: "Transaction submitted", text: "Waiting for Sepolia confirmation.", hash });
    } catch (error) {
      setTx({ status: "error", title: "Vote failed", text: getFriendlyError(error) });
    }
  };

  return (
    <section className="detail-layout">
      <div className="detail-info">
        <BackButton onClick={() => setRoute("polls")} label="Back to Polls" />
        <div className="title-line">
          <h2>{poll.title}</h2>
          <StatusTag status={poll.isActive && !poll.isExpired ? "Active" : "Closed"} />
        </div>
        <p>{poll.description}</p>
        <dl className="detail-list">
          <Detail icon={<UserRound />} label="Connected wallet" value={address ? shortAddress(address) : "Not connected"} />
          <Detail icon={<Fingerprint />} label="Poll ID" value={`#${poll.id.toString()}`} />
          <Detail icon={<Clock3 />} label="Deadline" value={formatDeadline(poll.deadline)} />
          <Detail icon={<UsersRound />} label="Total votes" value={totalVotes.toString()} />
          <Detail icon={<Vote />} label="Your status" value={detail.hasVoted ? "Voted" : "Not voted"} danger={!detail.hasVoted} />
          <Detail icon={<LockKeyhole />} label="Whitelist" value={getWhitelistDetailValue({ detail, isConnected, isSepolia })} danger={detail.isWhitelisted === false} />
          <Detail icon={<Link2 />} label="Content hash" value={shortHash(poll.contentHash)} copy={<Copy size={14} />} />
        </dl>
        <WhitelistStatus detail={detail} isConnected={isConnected} isSepolia={isSepolia} />
        <IntegrityNotice integrity={poll.integrity} />
      </div>
      <div className="vote-card">
        <h3>Choose your option</h3>
        <div className="radio-list">
          {detail.options.map((option) => (
            <button className={selectedOption === option.index ? "selected" : ""} onClick={() => setSelectedOption(option.index)} key={option.index}>
              <span className="radio-dot" />
              <span><strong>{poll.options[option.index] || `Option ${option.index}`}</strong><small>{option.votes.toString()} votes</small></span>
            </button>
          ))}
        </div>
        <button className="primary full" onClick={submitVote} disabled={Boolean(disabledReason) || writer.isBusy}>
          {writer.isBusy ? "Processing..." : "Vote Now"}
        </button>
        {disabledReason && <small className="form-error">{disabledReason}</small>}
      </div>
    </section>
  );
}

function getWhitelistDetailValue({ detail, isConnected, isSepolia }) {
  if (!isConnected) return "Connect wallet";
  if (!isSepolia) return "Wrong network";
  if (detail.accountStateError) return "Read error";
  if (detail.isAccountStateLoading) return "Checking...";
  return detail.isWhitelisted ? "Allowed" : "Not whitelisted";
}

function WhitelistStatus({ detail, isConnected, isSepolia }) {
  if (!isConnected) {
    return (
      <div className="whitelist-status-card neutral">
        <LockKeyhole size={16} />
        <span>Connect your wallet to check whitelist status.</span>
      </div>
    );
  }

  if (!isSepolia) {
    return (
      <div className="whitelist-status-card warning">
        <CircleAlert size={16} />
        <span>Switch to Sepolia to check whitelist status.</span>
      </div>
    );
  }

  if (detail.accountStateError) {
    return (
      <div className="whitelist-status-card warning">
        <CircleAlert size={16} />
        <span>Could not read whitelist status from the contract.</span>
      </div>
    );
  }

  if (detail.isAccountStateLoading) {
    return (
      <div className="whitelist-status-card neutral">
        <Clock3 size={16} />
        <span>Checking whitelist status...</span>
      </div>
    );
  }

  if (detail.isWhitelisted) {
    return (
      <div className="whitelist-status-card success">
        <BadgeCheck size={16} />
        <span>Your wallet is whitelisted for this poll.</span>
      </div>
    );
  }

  return (
    <div className="whitelist-status-card warning">
      <CircleAlert size={16} />
      <span>Your wallet is not whitelisted for this poll.</span>
    </div>
  );
}
