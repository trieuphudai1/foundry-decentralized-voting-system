import {
  BadgeCheck,
  ChevronLeft,
  CircleAlert,
  DatabaseZap,
  Fingerprint,
  LayoutDashboard,
  FilePlus2,
  ShieldCheck,
  UsersRound,
  Vote
} from "lucide-react";
import EmptyState from "./EmptyState";

export function LogoMark() {
  return <span className="logo-mark"><ShieldCheck size={22} /></span>;
}

export function Avatar() {
  return <span className="avatar"><Fingerprint size={14} /></span>;
}

export function FloatingCube({ className, label }) {
  return <span className={`cube ${className}`}><DatabaseZap size={20} /><em>{label}</em></span>;
}

export function Feature({ icon, title, text }) {
  return <article className="feature-card"><span>{icon}</span><h3>{title}</h3><p>{text}</p></article>;
}

export function StatusTag({ status }) {
  return <span className={`status ${status.toLowerCase()}`}>{status}</span>;
}

export function IntegrityNotice({ integrity }) {
  if (integrity?.status === "verified") {
    return <span className="hash-ok"><BadgeCheck size={14} /> Metadata hash matches on-chain contentHash</span>;
  }

  if (integrity?.status === "tampered") {
    return <span className="hash-ok tampered"><CircleAlert size={14} /> Warning: off-chain metadata may have been modified</span>;
  }

  return <span className="hash-ok missing"><CircleAlert size={14} /> Metadata is missing from MongoDB; integrity cannot be verified</span>;
}

export function PageTitle({ title, subtitle }) {
  return <div className="page-title"><h1>{title}</h1><p>{subtitle}</p></div>;
}

export function BackButton({ onClick, label }) {
  return <button className="back-btn" onClick={onClick}><ChevronLeft size={16} /> {label}</button>;
}

export function Detail({ icon, label, value, danger, copy }) {
  return (
    <div className="detail-item">
      <dt>{icon}{label}</dt>
      <dd className={danger ? "danger-text" : ""}>{value}{copy}</dd>
    </div>
  );
}

export function Summary({ icon, label, value, action }) {
  return <div className="summary-item">{icon}<span><small>{label}</small><strong>{value}</strong>{action && <em>View on Etherscan</em>}</span></div>;
}

export function Metric({ tone, label, value, icon, action }) {
  return <article className={`metric ${tone}`}><div><small>{label}</small><strong>{value}</strong><button>{action}</button></div><span>{icon}</span></article>;
}

export function EmptyPage({ setRoute }) {
  return <section className="page-panel"><BackButton onClick={() => setRoute("polls")} label="Back to Polls" /><EmptyState text="Select a poll first." /></section>;
}

export function Sidebar({ setRoute, active, isAdmin }) {
  const items = isAdmin
    ? [
        ["dashboard", "Dashboard", LayoutDashboard],
        ["create", "Create Poll", FilePlus2],
        ["polls", "All Polls", Vote],
        ["whitelist", "Whitelist", UsersRound]
      ]
    : [["polls", "All Polls", Vote]];

  return (
    <aside className="sidebar">
      <button className="brand small" onClick={() => setRoute("home")}><LogoMark /><span>Decentralized<br />Voting System</span></button>
      {items.map(([key, label, Icon]) => (
        <button className={active === key ? "active" : ""} onClick={() => setRoute(key)} key={`${label}-${key}`}>
          <Icon size={16} /> {label}
        </button>
      ))}
    </aside>
  );
}

export function formatDeadline(deadline) {
  return new Date(Number(deadline) * 1000).toLocaleString();
}

export function shortAddress(address) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function shortHash(hash) {
  return `${hash.slice(0, 10)}...${hash.slice(-8)}`;
}
