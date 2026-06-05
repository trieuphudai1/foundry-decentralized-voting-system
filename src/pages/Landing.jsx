import { BadgeCheck, DatabaseZap, Fingerprint, ShieldCheck } from "lucide-react";
import { WalletButton } from "../components/Header";
import { Feature, FloatingCube } from "../components/SharedUI";

export default function Landing({ setRoute }) {
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
