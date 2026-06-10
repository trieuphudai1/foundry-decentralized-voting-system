import { useState } from "react";
import { Search } from "lucide-react";
import EmptyState from "../components/EmptyState";
import IntegrityBadge from "../components/IntegrityBadge";
import { PageTitle, StatusTag, formatDeadline, shortAddress, shortHash } from "../components/SharedUI";
import { getFriendlyError } from "../web3/hooks";
import { VOTING_CONTRACT_ADDRESS } from "../web3/votingContract";

export default function PollsList({ pollsState, onSelect }) {
  const [filter, setFilter] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const normalizedQuery = searchTerm.trim().toLowerCase();
  const visiblePolls = pollsState.polls.filter((poll) => {
    const active = poll.isActive && !poll.isExpired;
    const matchesStatus = filter === "All" || (filter === "Active" ? active : !active);
    return matchesStatus && matchesSearch(poll, normalizedQuery);
  });

  return (
    <section className="page-panel">
      <PageTitle title="Polls" subtitle="Metadata from MongoDB, state from the Voting contract on Sepolia" />
      <div className="contract-line">Contract: <strong>{shortAddress(VOTING_CONTRACT_ADDRESS)}</strong></div>
      <div className="list-toolbar">
        <label className="search-box">
          <Search size={16} />
          <input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search by poll id or hash..."
          />
        </label>
        <div className="segmented">
          {["All", "Active", "Closed"].map((item) => (
            <button className={item === filter ? "active" : ""} key={item} onClick={() => setFilter(item)}>{item}</button>
          ))}
        </div>
      </div>
      {pollsState.isLoading && <EmptyState text="Loading polls from contract..." />}
      {pollsState.error && <EmptyState text={getFriendlyError(pollsState.error)} danger />}
      {!pollsState.isLoading && !visiblePolls.length && <EmptyState text="No polls found." />}
      <div className="poll-grid">
        {visiblePolls.map((poll) => (
          <article className="poll-card" key={poll.id.toString()}>
            <div className="card-head">
              <h3>{poll.title}</h3>
              <StatusTag status={poll.isActive && !poll.isExpired ? "Active" : "Closed"} />
            </div>
            <p>{poll.description}</p>
            <div className="meta-row">
              <span><small>{poll.isActive && !poll.isExpired ? "Ends" : "Ended"}</small>{formatDeadline(poll.deadline)}</span>
              <span><small>Options</small>{poll.optionCount.toString()}</span>
              <IntegrityBadge integrity={poll.integrity} />
            </div>
            <small className="contract-line">Poll #{poll.id.toString()} - {shortHash(poll.contentHash)}</small>
            <button className={poll.isActive && !poll.isExpired ? "primary full" : "secondary full"} onClick={() => onSelect(poll)}>
              {poll.isActive && !poll.isExpired ? "View Poll" : "View Results"}
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}

function matchesSearch(poll, query) {
  if (!query) return true;

  const pollId = String(poll.id ?? poll.pollId ?? "");
  const hashes = [
    poll.contentHash,
    poll.metadataHash,
    poll.hash,
    poll.transactionHash,
    poll.txHash,
    poll.metadata?.contentHash,
    poll.metadata?.metadataHash,
    poll.metadata?.hash,
    poll.metadata?.transactionHash,
    poll.metadata?.txHash
  ].filter(Boolean).map(String);

  const searchableText = [
    pollId,
    `#${pollId}`,
    `poll ${pollId}`,
    `poll #${pollId}`,
    poll.title,
    poll.description,
    poll.metadata?.title,
    poll.metadata?.description,
    ...hashes,
    ...hashes.map(shortHash)
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return searchableText.includes(query);
}
