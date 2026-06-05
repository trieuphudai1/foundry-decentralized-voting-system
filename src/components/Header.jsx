import { ConnectButton } from "@rainbow-me/rainbowkit";
import { ChevronDown, CircleAlert, Menu, Wallet } from "lucide-react";
import { useNetworkGuard } from "../web3/hooks";
import { Avatar, LogoMark } from "./SharedUI";
import NetworkBadge from "./NetworkBadge";

export function WalletButton() {
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

export default function Header({ activeRoute, isAdmin, setRoute }) {
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
        {isAdmin && <button className={activeRoute === "dashboard" ? "active" : ""} onClick={() => setRoute("dashboard")}>Dashboard</button>}
        {isAdmin && <button className={activeRoute === "whitelist" ? "active" : ""} onClick={() => setRoute("whitelist")}>Whitelist</button>}
      </nav>
      <div className="wallet-cluster">
        <NetworkBadge isSepolia={isSepolia} />
        <WalletButton />
        <button className="icon-btn compact" aria-label="Menu"><Menu size={18} /></button>
      </div>
    </header>
  );
}
