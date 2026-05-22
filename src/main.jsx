import React, { useCallback, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { RainbowKitProvider, ConnectButton } from "@rainbow-me/rainbowkit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider, useAccount } from "wagmi";
import {
  BadgeCheck,
  BarChart3,
  CalendarClock,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  CircleX,
  Clock3,
  Copy,
  DatabaseZap,
  ExternalLink,
  FilePlus2,
  Fingerprint,
  Gauge,
  LayoutDashboard,
  Link2,
  LockKeyhole,
  Menu,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  Trash2,
  UserRound,
  UsersRound,
  Vote,
  Wallet,
  X
} from "lucide-react";
import { wagmiConfig, sepolia } from "./web3/config";
import {
  buildContentHash,
  getFriendlyError,
  parseAddresses,
  useNetworkGuard,
  useOwner,
  usePollDetail,
  usePolls,
  useVotingWrite
} from "./web3/hooks";
import { VOTING_CONTRACT_ADDRESS } from "./web3/votingContract";
import "./styles.css";

const queryClient = new QueryClient();

function Root() {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider modalSize="compact">
          <App />
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

function App() {
  const [route, setRoute] = useState("home");
  const [selectedPollId, setSelectedPollId] = useState(null);
  const [tx, setTx] = useState({ status: "idle", title: "No transaction yet", text: "Submit a transaction to see live status here." });
  const pollsState = usePolls();

  const activeRoute = useMemo(() => {
    if (route === "home") return "home";
    if (route === "polls" || route === "detail" || route === "results") return "polls";
    return "dashboard";
  }, [route]);

  const selectPoll = (poll) => {
    setSelectedPollId(poll.id.toString());
    setRoute(poll.isActive && !poll.isExpired ? "detail" : "results");
  };

  const selectedPoll = pollsState.polls.find((poll) => poll.id.toString() === selectedPollId) || pollsState.polls[0];

  return (
    <div className="app-shell">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />
      <Header activeRoute={activeRoute} setRoute={setRoute} />
      <main>
        {route === "home" && <Landing setRoute={setRoute} />}
        {route === "polls" && <PollsList pollsState={pollsState} onSelect={selectPoll} />}
        {route === "detail" && <PollDetail poll={selectedPoll} setRoute={setRoute} setTx={setTx} refetchPolls={pollsState.refetch} />}
        {route === "results" && <Results poll={selectedPoll} setRoute={setRoute} />}
        {route === "dashboard" && <AdminDashboard pollsState={pollsState} setRoute={setRoute} setTx={setTx} />}
        {route === "create" && <CreatePoll setRoute={setRoute} setTx={setTx} refetchPolls={pollsState.refetch} />}
        {route === "whitelist" && <Whitelist polls={pollsState.polls} setTx={setTx} refetchPolls={pollsState.refetch} />}
      </main>
      <StatusDock tx={tx} onClose={() => setTx({ status: "idle", title: "No transaction yet", text: "Submit a transaction to see live status here." })} />
    </div>
  );
}

function Header({ activeRoute, setRoute }) {
  const { isSepolia } = useNetworkGuard();
  return (
    <header className="topbar">
      <button className="brand" onClick={() => setRoute("home")} aria-label="Go home">
        <LogoMark />
        <span>Decentralized<br />Voting System</span>
      </button>
      <nav className="nav-links">
        <button className={activeRoute === "home" ? "active" : ""} onClick={() => setRoute("home")}>Home</button>
        <button className={activeRoute === "polls" ? "active" : ""} onClick={() => setRoute("polls")}>Polls</button>
        <button className={activeRoute === "dashboard" ? "active" : ""} onClick={() => setRoute("dashboard")}>Dashboard</button>
        <button onClick={() => setRoute("whitelist")}>Whitelist</button>
      </nav>
      <div className="wallet-cluster">
        <span className={`network ${isSepolia ? "" : "wrong"}`}><span /> {isSepolia ? "Sepolia" : "Wrong Network"}</span>
        <WalletButton />
        <button className="icon-btn compact" aria-label="Menu"><Menu size={18} /></button>
      </div>
    </header>
  );
}

function WalletButton() {
  return (
    <ConnectButton.Custom>
      {({ account, chain, openAccountModal, openChainModal, openConnectModal, mounted }) => {
        const connected = mounted && account && chain;
        if (!connected) {
          return <button className="wallet-pill" onClick={openConnectModal}><Wallet size={16} /> Connect Wallet <ChevronDown size={14} /></button>;
        }
        if (chain.unsupported) {
          return <button className="wallet-pill danger-text" onClick={openChainModal}><CircleAlert size={16} /> Switch Network</button>;
        }
        return <button className="wallet-pill" onClick={openAccountModal}><Avatar /> {account.displayName} <ChevronDown size={14} /></button>;
      }}
    </ConnectButton.Custom>
  );
}

function Landing({ setRoute }) {
  return (
    <section className="hero-screen">
      <div className="hero-canvas">
        <FloatingCube className="cube-a" label="01" />
        <FloatingCube className="cube-b" label="02" />
        <FloatingCube className="cube-c" label="03" />
        <FloatingCube className="cube-d" label="04" />
        <div className="hero-orbit" />
      </div>
      <div className="hero-content">
        <span className="eth-chip"><DatabaseZap size={14} /> Sepolia Smart Contract</span>
        <h1>Transparent Decentralized Voting</h1>
        <p>Secure. Transparent. Immutable.</p>
        <span className="hero-copy">Vote, verify results, and manage polls directly through MetaMask on Ethereum Sepolia.</span>
        <div className="actions">
          <WalletButton />
          <button className="outline" onClick={() => setRoute("polls")}>Explore Polls</button>
        </div>
      </div>
      <div className="feature-row">
        <Feature icon={<ShieldCheck />} title="Sepolia Network" text="Every action is sent to your deployed Voting contract." />
        <Feature icon={<Fingerprint />} title="One Wallet, One Vote" text="The contract prevents duplicate votes per poll." />
        <Feature icon={<BadgeCheck />} title="Verified Results" text="Vote counts are read from chain in real time." />
      </div>
    </section>
  );
}

function PollsList({ pollsState, onSelect }) {
  const [filter, setFilter] = useState("All");
  const visiblePolls = pollsState.polls.filter((poll) => {
    const active = poll.isActive && !poll.isExpired;
    if (filter === "Active") return active;
    if (filter === "Closed") return !active;
    return true;
  });

  return (
    <section className="page-panel">
      <PageTitle title="Polls" subtitle="Loaded from the deployed Voting contract on Sepolia" />
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
              <h3>Poll #{poll.id.toString()}</h3>
              <StatusTag status={poll.isActive && !poll.isExpired ? "Active" : "Closed"} />
            </div>
            <p>{poll.contentHash}</p>
            <div className="meta-row">
              <span><small>{poll.isActive && !poll.isExpired ? "Ends" : "Ended"}</small>{formatDeadline(poll.deadline)}</span>
              <span><small>Options</small>{poll.optionCount.toString()}</span>
              <span className="verified"><BadgeCheck size={13} /> Verified</span>
            </div>
            <button className={poll.isActive && !poll.isExpired ? "primary full" : "secondary full"} onClick={() => onSelect(poll)}>
              {poll.isActive && !poll.isExpired ? "View Poll" : "View Results"}
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}

function PollDetail({ poll, setRoute, setTx, refetchPolls }) {
  const { address, isConnected } = useAccount();
  const { isSepolia } = useNetworkGuard();
  const [selectedOption, setSelectedOption] = useState(0);
  const refresh = useCallback(() => {
    refetchPolls();
  }, [refetchPolls]);
  const detail = usePollDetail(poll, address);
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
          <h2>Poll #{poll.id.toString()}</h2>
          <StatusTag status={poll.isActive && !poll.isExpired ? "Active" : "Closed"} />
        </div>
        <p>Content is represented by an immutable bytes32 hash stored on-chain.</p>
        <dl className="detail-list">
          <Detail icon={<UserRound />} label="Connected wallet" value={address ? shortAddress(address) : "Not connected"} />
          <Detail icon={<Clock3 />} label="Deadline" value={formatDeadline(poll.deadline)} />
          <Detail icon={<UsersRound />} label="Total votes" value={totalVotes.toString()} />
          <Detail icon={<Vote />} label="Your status" value={detail.hasVoted ? "Voted" : "Not voted"} danger={!detail.hasVoted} />
          <Detail icon={<LockKeyhole />} label="Whitelist" value={detail.isWhitelisted ? "Allowed" : "Not whitelisted"} danger={!detail.isWhitelisted} />
          <Detail icon={<Link2 />} label="Content hash" value={shortHash(poll.contentHash)} copy />
        </dl>
        <span className="hash-ok"><BadgeCheck size={14} /> Blockchain Hash Verified</span>
      </div>
      <div className="vote-card">
        <h3>Choose your option</h3>
        <div className="radio-list">
          {detail.options.map((option) => (
            <button className={selectedOption === option.index ? "selected" : ""} onClick={() => setSelectedOption(option.index)} key={option.index}>
              <span className="radio-dot" />
              <span><strong>Option {option.index}</strong><small>{option.votes.toString()} votes</small></span>
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

function Results({ poll, setRoute }) {
  const detail = usePollDetail(poll);
  if (!poll) return <EmptyPage setRoute={setRoute} />;
  const total = detail.options.reduce((sum, option) => sum + option.votes, 0n);
  return (
    <section className="page-panel results-panel">
      <BackButton onClick={() => setRoute("polls")} label="Back to Polls" />
      <div className="title-line">
        <h2>Poll #{poll.id.toString()}</h2>
        <StatusTag status={poll.isActive && !poll.isExpired ? "Active" : "Closed"} />
      </div>
      <p>Results are read directly from the Voting contract.</p>
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
              <div><strong>Option {option.index}</strong><small>Index starts at 0</small></div>
              <div className="bar-track"><span className="bar-fill blue" style={{ width: `${percentage}%` }} /></div>
              <span>{percentage}%</span>
              <small>({option.votes.toString()} votes)</small>
            </div>
          );
        })}
      </div>
      <div className="notice"><ShieldCheck size={16} /> Results are immutable and verified on Ethereum Sepolia.</div>
    </section>
  );
}

function AdminDashboard({ pollsState, setRoute, setTx }) {
  const { address } = useAccount();
  const { data: owner } = useOwner();
  const isOwner = Boolean(address && owner && address.toLowerCase() === owner.toLowerCase());
  const activePolls = pollsState.polls.filter((poll) => poll.isActive && !poll.isExpired);
  const closedPolls = pollsState.polls.length - activePolls.length;
  return (
    <section className="admin-layout">
      <Sidebar setRoute={setRoute} active="dashboard" />
      <div className="admin-main">
        <PageTitle title="Dashboard" subtitle={isOwner ? "Owner controls enabled" : "Connect owner wallet for admin actions"} />
        <div className="metric-grid">
          <Metric tone="blue" label="Total Polls" value={pollsState.count.toString()} icon={<FilePlus2 />} action="On-chain" />
          <Metric tone="green" label="Active Polls" value={activePolls.length} icon={<Gauge />} action="Open" />
          <Metric tone="violet" label="Closed Polls" value={closedPolls} icon={<BarChart3 />} action="Final" />
          <Metric tone="amber" label="Admin" value={owner ? shortAddress(owner) : "..."} icon={<UsersRound />} action="Owner" />
        </div>
        <div className="dashboard-grid">
          <div className="admin-card">
            <div className="card-head"><h3>Recent Polls</h3><button onClick={() => setRoute("create")}>Create poll <ChevronRight size={14} /></button></div>
            {pollsState.polls.slice(0, 5).map((poll) => (
              <AdminPollRow key={poll.id.toString()} poll={poll} disabled={!isOwner} setTx={setTx} refetchPolls={pollsState.refetch} />
            ))}
          </div>
          <div className="admin-card">
            <h3>Admin Actions</h3>
            <div className="actions vertical">
              <button className="primary" onClick={() => setRoute("create")} disabled={!isOwner}><FilePlus2 size={16} /> Create Poll</button>
              <button className="secondary" onClick={() => setRoute("whitelist")} disabled={!isOwner}><UsersRound size={16} /> Add Whitelist</button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function AdminPollRow({ poll, disabled, setTx, refetchPolls }) {
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
      <span><strong>Poll #{poll.id.toString()}</strong><small>{poll.isActive ? "Active" : "Closed"} - {formatDeadline(poll.deadline)}</small></span>
      <button className="secondary compact-action" onClick={closePoll} disabled={disabled || !poll.isActive || writer.isBusy}>
        {writer.isBusy ? "..." : "End"}
      </button>
    </div>
  );
}

function CreatePoll({ setRoute, setTx, refetchPolls }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [deadline, setDeadline] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const writer = useVotingWrite(async (hash) => {
    await refetchPolls();
    setTx({ status: "success", title: "Poll created", text: "Poll list refreshed from contract.", hash });
    setRoute("polls");
  });

  const submit = async (event) => {
    event.preventDefault();
    const cleanOptions = options.map((option) => option.trim()).filter(Boolean);
    const deadlineSeconds = Math.floor(new Date(deadline).getTime() / 1000);
    if (!title.trim() || !description.trim()) return setTx({ status: "error", title: "Invalid poll", text: "Title and description are required for content hash." });
    if (cleanOptions.length < 2) return setTx({ status: "error", title: "Invalid options", text: "At least two options are required." });
    if (!deadlineSeconds || deadlineSeconds <= Math.floor(Date.now() / 1000)) return setTx({ status: "error", title: "Invalid deadline", text: "Deadline must be a future Unix timestamp in seconds." });
    try {
      const contentHash = buildContentHash({ title, description, options: cleanOptions });
      setTx({ status: "pending", title: "Waiting for confirmation", text: `Creating poll with hash ${shortHash(contentHash)}.` });
      const hash = await writer.write({ functionName: "createPoll", args: [contentHash, BigInt(deadlineSeconds), BigInt(cleanOptions.length)] });
      setTx({ status: "mining", title: "Creating poll", text: "Waiting for Sepolia confirmation.", hash });
    } catch (error) {
      setTx({ status: "error", title: "Create poll failed", text: getFriendlyError(error) });
    }
  };

  return (
    <section className="admin-layout">
      <Sidebar setRoute={setRoute} active="create" />
      <form className="create-panel" onSubmit={submit}>
        <PageTitle title="Create New Poll" subtitle="A bytes32 content hash is generated from title, description, and options" />
        <div className="form-grid">
          <label>Title<input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Enter poll title" /></label>
          <label>End Date & Time<input type="datetime-local" value={deadline} onChange={(event) => setDeadline(event.target.value)} /></label>
        </div>
        <label>Description<textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Enter poll description" /></label>
        <div className="option-editor">
          {options.map((option, index) => (
            <React.Fragment key={index}>
              <label><input value={option} onChange={(event) => setOptions((prev) => prev.map((item, optionIndex) => optionIndex === index ? event.target.value : item))} placeholder={`Option ${index}`} /></label>
              <button className="icon-btn" type="button" aria-label="Delete option" onClick={() => setOptions((prev) => prev.filter((_, optionIndex) => optionIndex !== index))} disabled={options.length <= 2}><Trash2 size={16} /></button>
            </React.Fragment>
          ))}
        </div>
        <button className="text-link" type="button" onClick={() => setOptions((prev) => [...prev, ""])}><Plus size={14} /> Add Option</button>
        <div className="whitelist-card">
          <h3>Whitelist</h3>
          <p>Create poll first, then add voters from Whitelist using the new poll id.</p>
        </div>
        <div className="form-actions">
          <button className="secondary" type="button" onClick={() => setRoute("dashboard")}>Cancel</button>
          <button className="primary" type="submit" disabled={writer.isBusy}>{writer.isBusy ? "Processing..." : "Create Poll"}</button>
        </div>
      </form>
    </section>
  );
}

function Whitelist({ polls, setTx, refetchPolls }) {
  const [pollId, setPollId] = useState(polls[0]?.id.toString() || "0");
  const [addresses, setAddresses] = useState("");
  const writer = useVotingWrite(async (hash) => {
    await refetchPolls();
    setTx({ status: "success", title: "Whitelist updated", text: `Voters added to Poll #${pollId}.`, hash });
  });
  const submit = async () => {
    try {
      const voters = parseAddresses(addresses);
      if (!voters.length) throw new Error("Empty list");
      setTx({ status: "pending", title: "Waiting for confirmation", text: `Adding ${voters.length} voter(s) to Poll #${pollId}.` });
      const hash = await writer.write({ functionName: "addToWhitelist", args: [BigInt(pollId), voters] });
      setTx({ status: "mining", title: "Updating whitelist", text: "Waiting for Sepolia confirmation.", hash });
    } catch (error) {
      setTx({ status: "error", title: "Whitelist failed", text: getFriendlyError(error) || error.message });
    }
  };
  return (
    <section className="page-panel whitelist-panel">
      <PageTitle title="Whitelist Management" subtitle="Owner-only addToWhitelist transaction" />
      <label>Poll ID<input value={pollId} onChange={(event) => setPollId(event.target.value)} /></label>
      <label>Add Addresses<textarea value={addresses} onChange={(event) => setAddresses(event.target.value)} placeholder={"0x...\n0x..."} /></label>
      <button className="primary full" onClick={submit} disabled={writer.isBusy}><Plus size={16} /> {writer.isBusy ? "Processing..." : "Add to Whitelist"}</button>
      <h3>Known Polls ({polls.length})</h3>
      <div className="address-list">
        {polls.map((poll) => (
          <button className="address-row" key={poll.id.toString()} onClick={() => setPollId(poll.id.toString())}>
            <UsersRound size={16} />
            <span><strong>Poll #{poll.id.toString()}</strong><small>{shortHash(poll.contentHash)}</small></span>
            <ChevronRight size={16} />
          </button>
        ))}
      </div>
    </section>
  );
}

function StatusDock({ tx, onClose }) {
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
        {tx.hash && <a className="secondary" href={`${sepolia.blockExplorers.default.url}/tx/${tx.hash}`} target="_blank" rel="noreferrer">View on Etherscan <ExternalLink size={14} /></a>}
      </div>
    </aside>
  );
}

function getVoteDisabledReason({ isConnected, isSepolia, poll, detail }) {
  if (!isConnected) return "Connect wallet first.";
  if (!isSepolia) return "Switch to Sepolia.";
  if (!poll?.isActive || poll?.isExpired) return "Poll expired or closed.";
  if (detail.hasVoted) return "Already voted.";
  if (detail.isWhitelisted === false) return "Not whitelisted.";
  return "";
}

function EmptyPage({ setRoute }) {
  return <section className="page-panel"><BackButton onClick={() => setRoute("polls")} label="Back to Polls" /><EmptyState text="Select a poll first." /></section>;
}

function Sidebar({ setRoute, active }) {
  const items = [
    ["dashboard", "Dashboard", LayoutDashboard],
    ["create", "Create Poll", FilePlus2],
    ["polls", "All Polls", Vote],
    ["whitelist", "Whitelist", UsersRound],
    ["dashboard", "Statistics", BarChart3],
    ["dashboard", "Settings", Settings]
  ];
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

function LogoMark() {
  return <span className="logo-mark"><ShieldCheck size={22} /></span>;
}

function Avatar() {
  return <span className="avatar"><Fingerprint size={14} /></span>;
}

function FloatingCube({ className, label }) {
  return <span className={`cube ${className}`}><DatabaseZap size={20} /><em>{label}</em></span>;
}

function Feature({ icon, title, text }) {
  return <article className="feature-card"><span>{icon}</span><h3>{title}</h3><p>{text}</p></article>;
}

function StatusTag({ status }) {
  return <span className={`status ${status.toLowerCase()}`}>{status}</span>;
}

function PageTitle({ title, subtitle }) {
  return <div className="page-title"><h1>{title}</h1><p>{subtitle}</p></div>;
}

function BackButton({ onClick, label }) {
  return <button className="back-btn" onClick={onClick}><ChevronLeft size={16} /> {label}</button>;
}

function Detail({ icon, label, value, danger, copy }) {
  return (
    <div className="detail-item">
      <dt>{icon}{label}</dt>
      <dd className={danger ? "danger-text" : ""}>{value}{copy && <Copy size={14} />}</dd>
    </div>
  );
}

function Summary({ icon, label, value, action }) {
  return <div className="summary-item">{icon}<span><small>{label}</small><strong>{value}</strong>{action && <em>View on Etherscan</em>}</span></div>;
}

function Metric({ tone, label, value, icon, action }) {
  return <article className={`metric ${tone}`}><div><small>{label}</small><strong>{value}</strong><button>{action}</button></div><span>{icon}</span></article>;
}

function EmptyState({ text, danger }) {
  return <div className={`notice ${danger ? "danger-text" : ""}`}>{danger ? <CircleAlert size={16} /> : <ShieldCheck size={16} />} {text}</div>;
}

function formatDeadline(deadline) {
  return new Date(Number(deadline) * 1000).toLocaleString();
}

function shortAddress(address) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function shortHash(hash) {
  return `${hash.slice(0, 10)}...${hash.slice(-8)}`;
}

createRoot(document.getElementById("root")).render(<Root />);
