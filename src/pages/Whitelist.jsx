import { useState } from "react";
import { isAddress } from "viem";
import { Check, ChevronRight, Copy, Plus, Trash2, UsersRound, X } from "lucide-react";
import { getFriendlyError, useVotingWrite, useWhitelistedWallets } from "../web3/hooks";
import { PageTitle, shortHash } from "../components/SharedUI";

export default function Whitelist({ polls, setTx, refetchPolls }) {
  const [pollId, setPollId] = useState(polls[0]?.id.toString() || "0");
  const [addressInput, setAddressInput] = useState("");
  const [addresses, setAddresses] = useState([]);
  const [addressError, setAddressError] = useState("");
  const [copiedAddress, setCopiedAddress] = useState("");
  const pollIdText = pollId.trim();
  const pollIdNumber = Number(pollId);
  const isPollIdValid = pollIdText !== "" && Number.isInteger(pollIdNumber) && pollIdNumber >= 0;
  const whitelisted = useWhitelistedWallets(pollId, isPollIdValid);
  const writer = useVotingWrite(async (hash) => {
    await refetchPolls();
    await whitelisted.refetch();
    setAddresses([]);
    setAddressInput("");
    setAddressError("");
    setTx({ status: "success", title: "Whitelist updated", text: `Voters added to Poll #${pollId}.`, hash });
  });

  const canSubmit = isPollIdValid && addresses.length > 0 && !writer.isBusy;

  const addAddress = () => {
    const nextAddress = addressInput.trim();
    if (!nextAddress) {
      setAddressError("Enter a wallet address first.");
      return;
    }

    if (!isAddress(nextAddress)) {
      setAddressError("Invalid wallet address.");
      return;
    }

    const exists = addresses.some((address) => address.toLowerCase() === nextAddress.toLowerCase());
    if (exists) {
      setAddressError("This address is already in the whitelist list.");
      return;
    }

    setAddresses((prev) => [...prev, nextAddress]);
    setAddressInput("");
    setAddressError("");
  };

  const removeAddress = (addressToRemove) => {
    setAddresses((prev) => prev.filter((address) => address.toLowerCase() !== addressToRemove.toLowerCase()));
  };

  const clearAddresses = () => {
    setAddresses([]);
    setAddressError("");
  };

  const submit = async () => {
    try {
      if (!isPollIdValid) throw new Error("Valid poll ID is required.");
      if (!addresses.length) throw new Error("Add at least one wallet address.");
      setTx({ status: "pending", title: "Waiting for confirmation", text: `Adding ${addresses.length} voter(s) to Poll #${pollId}.` });
      const hash = await writer.write({ functionName: "addToWhitelist", args: [BigInt(pollId), addresses] });
      setTx({ status: "mining", title: "Updating whitelist", text: "Waiting for Sepolia confirmation.", hash });
    } catch (error) {
      setTx({ status: "error", title: "Whitelist failed", text: getFriendlyError(error) || error.message });
    }
  };

  const copyAddress = async (address) => {
    try {
      await navigator.clipboard.writeText(address);
      setCopiedAddress(address);
      window.setTimeout(() => setCopiedAddress(""), 1200);
    } catch (_error) {
      setCopiedAddress("");
    }
  };

  return (
    <section className="page-panel whitelist-panel">
      <PageTitle title="Whitelist Management" subtitle="Owner-only addToWhitelist transaction" />
      <div className="whitelist-layout">
        <div className="whitelist-left-column">
          <div className="whitelist-main-card">
            <label>Poll ID<input value={pollId} onChange={(event) => setPollId(event.target.value)} /></label>
            {!isPollIdValid && <small className="form-error">Poll ID must be a non-negative integer.</small>}

            <div className="address-manager">
              <label>Add Address
                <div className="address-input-row">
                  <input
                    value={addressInput}
                    onChange={(event) => {
                      setAddressInput(event.target.value);
                      if (addressError) setAddressError("");
                    }}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        addAddress();
                      }
                    }}
                    placeholder="0x..."
                  />
                  <button className="secondary address-add-btn" type="button" onClick={addAddress}><Plus size={16} /> Add Address</button>
                </div>
              </label>
              {addressError && <small className="form-error">{addressError}</small>}

              <div className="address-manager-header">
                <span>Addresses to add ({addresses.length})</span>
                {addresses.length > 0 && <button className="text-link" type="button" onClick={clearAddresses}><Trash2 size={14} /> Clear all</button>}
              </div>
              <div className="whitelist-address-box">
                {!addresses.length && <span className="address-empty-state">No addresses added yet.</span>}
                {addresses.map((address) => (
                  <span className="address-chip" key={address}>
                    <span title={address}>{shortWalletAddress(address)}</span>
                    <button type="button" aria-label={`Remove ${address}`} onClick={() => removeAddress(address)}><X size={14} /></button>
                  </span>
                ))}
              </div>
            </div>

            <button className="primary whitelist-submit-btn" onClick={submit} disabled={!canSubmit}><Plus size={16} /> {writer.isBusy ? "Processing..." : "Add to Whitelist"}</button>
          </div>

          <section className="whitelisted-wallets-card">
            <div className="known-polls-head">
              <h3>Whitelisted Wallets</h3>
              <span>{whitelisted.data?.length || 0}</span>
            </div>
            <p className="whitelist-note">Whitelist entries are read from on-chain VoterWhitelisted events. Already added wallets cannot be removed from this UI.</p>
            <WhitelistedWalletsList
              copiedAddress={copiedAddress}
              isPollIdValid={isPollIdValid}
              onCopy={copyAddress}
              query={whitelisted}
            />
          </section>
        </div>

        <aside className="known-polls-card">
          <div className="known-polls-head">
            <h3>Known Polls</h3>
            <span>{polls.length}</span>
          </div>
          <div className="address-list">
            {polls.map((poll) => (
              <button className="address-row known-poll-card" key={poll.id.toString()} onClick={() => setPollId(poll.id.toString())}>
                <UsersRound className="known-poll-icon" size={16} />
                <span><strong className="known-poll-title">Poll #{poll.id.toString()}</strong><small className="known-poll-hash">{shortHash(poll.contentHash)}</small></span>
                <ChevronRight className="known-poll-icon" size={16} />
              </button>
            ))}
          </div>
        </aside>
      </div>
    </section>
  );
}

function shortWalletAddress(address) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function WhitelistedWalletsList({ copiedAddress, isPollIdValid, onCopy, query }) {
  if (!isPollIdValid) {
    return <div className="whitelist-wallet-empty">Select a poll to view whitelisted wallets.</div>;
  }

  if (query.isLoading) {
    return <div className="whitelist-wallet-empty">Loading whitelisted wallets...</div>;
  }

  if (query.error) {
    return <div className="whitelist-wallet-empty danger-text">RPC getLogs failed. Current RPC allows only small block ranges. Try setting VITE_LOG_BLOCK_RANGE=10 or use a better Sepolia RPC.</div>;
  }

  const wallets = query.data || [];
  if (!wallets.length) {
    return <div className="whitelist-wallet-empty">No whitelisted wallets found for this poll.</div>;
  }

  return (
    <div className="whitelisted-wallet-list">
      {wallets.map((address) => (
        <div className="whitelisted-wallet-row" key={address.toLowerCase()}>
          <UsersRound size={16} />
          <span title={address}>{shortWalletAddress(address)}</span>
          <button type="button" onClick={() => onCopy(address)} aria-label={`Copy ${address}`}>
            {copiedAddress.toLowerCase() === address.toLowerCase() ? <Check size={14} /> : <Copy size={14} />}
          </button>
        </div>
      ))}
    </div>
  );
}
