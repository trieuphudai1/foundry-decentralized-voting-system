import { Check, CircleX, Clock3, ExternalLink, Gauge, X } from "lucide-react";
import { sepolia } from "../web3/config";

export default function StatusDock({ tx, onClose, onRetry }) {
  const states = {
    idle: { icon: <Clock3 />, tone: "mining" },
    pending: { icon: <Clock3 />, tone: "pending" },
    mining: { icon: <Gauge />, tone: "mining" },
    success: { icon: <Check />, tone: "success" },
    error: { icon: <CircleX />, tone: "failed" }
  };
  const current = states[tx.status] || states.idle;
  return (
    <aside className="status-dock" aria-label="Transaction status">
      <div className="dock-tabs">
        {["pending", "success", "error"].map((state) => <button className={tx.status === state ? "active" : ""} key={state}>{state}</button>)}
      </div>
      <div className={`tx-card ${current.tone}`}>
        <button className="icon-btn" aria-label="Close status" onClick={onClose}><X size={14} /></button>
        <span>{current.icon}</span>
        <h3>{tx.title}</h3>
        <p>{tx.text}</p>
        {tx.retryMetadata && <button className="primary" onClick={onRetry}>Retry Save</button>}
        {tx.hash && <a className="secondary" href={`${sepolia.blockExplorers.default.url}/tx/${tx.hash}`} target="_blank" rel="noreferrer">View on Etherscan <ExternalLink size={14} /></a>}
      </div>
    </aside>
  );
}
