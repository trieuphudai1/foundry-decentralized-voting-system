import { BadgeCheck, CalendarClock, UsersRound, Vote } from "lucide-react";
import { usePollDetail } from "../web3/hooks";
import {
  BackButton,
  EmptyPage,
  IntegrityNotice,
  StatusTag,
  Summary,
  formatDeadline,
  shortAddress
} from "../components/SharedUI";
import { VOTING_CONTRACT_ADDRESS } from "../web3/votingContract";

export default function Results({ poll, setRoute }) {
  const detail = usePollDetail(poll);
  if (!poll) return <EmptyPage setRoute={setRoute} />;
  const total = detail.options.reduce((sum, option) => sum + option.votes, 0n);
  return (
    <section className="page-panel results-panel">
      <BackButton onClick={() => setRoute("polls")} label="Back to Polls" />
      <div className="title-line">
        <h2>{poll.title}</h2>
        <StatusTag status={poll.isActive && !poll.isExpired ? "Active" : "Closed"} />
      </div>
      <p>{poll.description}</p>
      <div className="result-summary">
        <Summary icon={<Vote />} label="Total Votes" value={total.toString()} />
        <Summary icon={<UsersRound />} label="Options" value={poll.optionCount.toString()} />
        <Summary icon={<CalendarClock />} label="Deadline" value={formatDeadline(poll.deadline)} />
        <Summary icon={<BadgeCheck />} label="Contract" value={shortAddress(VOTING_CONTRACT_ADDRESS)} action />
      </div>
      <div className="bars">
        {detail.options.map((option) => {
          const percentage = total === 0n ? 0 : Number((option.votes * 100n) / total);
          return (
            <div className="bar-row" key={option.index}>
              <div><strong>{poll.options[option.index] || `Option ${option.index}`}</strong><small>Index {option.index}</small></div>
              <div className="bar-track"><span className="bar-fill blue" style={{ width: `${percentage}%` }} /></div>
              <span>{percentage}%</span>
              <small>({option.votes.toString()} votes)</small>
            </div>
          );
        })}
      </div>
      <IntegrityNotice integrity={poll.integrity} />
    </section>
  );
}
