import { getFriendlyError, useVotingWrite } from "../web3/hooks";
import { Avatar, formatDeadline } from "./SharedUI";

export default function AdminPollRow({ poll, disabled, setTx, refetchPolls }) {
  const writer = useVotingWrite(async (hash) => {
    await refetchPolls();
    setTx({ status: "success", title: "Poll closed", text: `Poll #${poll.id.toString()} is no longer active.`, hash });
  });

  const closePoll = async () => {
    try {
      setTx({ status: "pending", title: "Waiting for confirmation", text: `Confirm closing Poll #${poll.id.toString()}.` });
      const hash = await writer.write({ functionName: "endPoll", args: [poll.id] });
      setTx({ status: "mining", title: "Closing poll", text: "Waiting for Sepolia confirmation.", hash });
    } catch (error) {
      setTx({ status: "error", title: "Close poll failed", text: getFriendlyError(error) });
    }
  };

  return (
    <div className="recent-row">
      <Avatar />
      <span><strong>{poll.title}</strong><small>Poll #{poll.id.toString()} - {poll.isActive ? "Active" : "Closed"} - {formatDeadline(poll.deadline)}</small></span>
      <button className="secondary compact-action" onClick={closePoll} disabled={disabled || !poll.isActive || writer.isBusy}>
        {writer.isBusy ? "..." : "End"}
      </button>
    </div>
  );
}
