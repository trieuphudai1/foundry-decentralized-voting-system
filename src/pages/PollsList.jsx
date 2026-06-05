import { useState } from "react";
import { Search } from "lucide-react";
import EmptyState from "../components/EmptyState";
import IntegrityBadge from "../components/IntegrityBadge";
import { PageTitle, StatusTag, formatDeadline, shortAddress, shortHash } from "../components/SharedUI";
import { getFriendlyError } from "../web3/hooks";
import { VOTING_CONTRACT_ADDRESS } from "../web3/votingContract";

export default function PollsList({ pollsState, onSelect }) {
  const [filter, setFilter] = useState("All");
  const visiblePolls = pollsState.polls.filter((poll) => {
    const active = poll.isActive && !poll.isExpired;
    if (filter === "Active") return active;
    if (filter === "Closed") return !active;
    return true;
  });

  return (
    <section className="page-panel">
      <PageTitle title="Polls" subtitle="Metadata from MongoDB, state from the Voting contract on Sepolia" />
      <div className="contract-line">Contract: <strong>{shortAddress(VOTING_CONTRACT_ADDRESS)}</strong></div>
      <div className="list-toolbar">
        <label className="search-box">
          <Search size={16} />
          <input placeholder="Search by poll id or hash..." readOnly />
        </label>
        <div className="segmented">
          {["All", "Active", "Closed"].map((item) => (
            <button className={item === filter ? "active" : ""} key={item} onClick={() => setFilter(item)}>{item}</button>
          ))}
        </div>
      </div>
      {pollsState.isLoading && <EmptyState text="Loading polls from contract..." />}
      {pollsState.error && <EmptyState text={getFriendlyError(pollsState.error)} danger />}
      {!pollsState.isLoading && !visiblePolls.length && <EmptyState text="No polls found on this contract yet." />}
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
