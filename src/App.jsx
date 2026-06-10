import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAccount } from "wagmi";
import Header, { WalletButton } from "./components/Header";
import EmptyState from "./components/EmptyState";
import { PageTitle } from "./components/SharedUI";
import StatusDock from "./components/StatusDock";
import AdminDashboard from "./pages/AdminDashboard";
import CreatePoll from "./pages/CreatePoll";
import Landing from "./pages/Landing";
import PollDetail from "./pages/PollDetail";
import PollsList from "./pages/PollsList";
import Results from "./pages/Results";
import Whitelist from "./pages/Whitelist";
import { savePollMetadata } from "./services/pollApi";
import { getFriendlyError, useAdminStatus, usePolls } from "./web3/hooks";

const idleTx = {
  status: "idle",
  title: "No transaction yet",
  text: "Submit a transaction to see live status here."
};

export default function App() {
  const [route, setRoute] = useState("home");
  const [selectedPollId, setSelectedPollId] = useState(null);
  const [tx, setTx] = useState(idleTx);
  const { address, isConnected } = useAccount();
  const accountRef = useRef({ address: undefined, isConnected: false });
  const previousAddressRef = useRef(null);
  const pollsState = usePolls();
  const adminStatus = useAdminStatus();

  accountRef.current = { address, isConnected };

  const resetStatusDock = useCallback(() => {
    setTx(idleTx);
  }, []);

  const setTransactionStatus = useCallback((nextTx) => {
    const account = accountRef.current;
    if (!account.isConnected || !account.address) {
      setTx(idleTx);
      return;
    }
    setTx(nextTx);
  }, []);

  useEffect(() => {
    if (!isConnected || !address) {
      previousAddressRef.current = null;
      resetStatusDock();
      return;
    }

    const normalizedAddress = address.toLowerCase();
    if (previousAddressRef.current && previousAddressRef.current !== normalizedAddress) {
      resetStatusDock();
    }
    previousAddressRef.current = normalizedAddress;
  }, [address, isConnected, resetStatusDock]);

  const activeRoute = useMemo(() => {
    if (route === "home") return "home";
    if (route === "polls" || route === "detail" || route === "results") return "polls";
    if (route === "whitelist") return "whitelist";
    return "dashboard";
  }, [route]);

  const selectPoll = (poll) => {
    setSelectedPollId(poll.id.toString());
    setRoute(poll.isActive && !poll.isExpired ? "detail" : "results");
  };

  const selectedPoll = pollsState.polls.find((poll) => poll.id.toString() === selectedPollId) || pollsState.polls[0];

  const retrySaveMetadata = async () => {
    if (!tx.retryMetadata) return;
    try {
      setTransactionStatus({ ...tx, status: "pending", title: "Retrying metadata save", text: "Saving poll metadata to MongoDB." });
      await savePollMetadata(tx.retryMetadata);
      await pollsState.refetch();
      setTransactionStatus({ status: "success", title: "Metadata saved", text: `Poll #${tx.retryMetadata.pollId} metadata is now stored in MongoDB.`, hash: tx.hash });
      setRoute("polls");
    } catch (error) {
      setTransactionStatus({ ...tx, status: "error", title: "Metadata save failed", text: getFriendlyError(error) || error.message });
    }
  };

  return (
    <div className="app-shell">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />
      <Header activeRoute={activeRoute} isAdmin={adminStatus.isAdmin} setRoute={setRoute} />
      <main>
        {route === "home" && <Landing setRoute={setRoute} />}
        {route === "polls" && <PollsList pollsState={pollsState} onSelect={selectPoll} />}
        {route === "detail" && <PollDetail poll={selectedPoll} setRoute={setRoute} setTx={setTransactionStatus} refetchPolls={pollsState.refetch} />}
        {route === "results" && <Results poll={selectedPoll} setRoute={setRoute} />}
        {route === "dashboard" && (
          <AdminRoute adminStatus={adminStatus} setRoute={setRoute}>
            <AdminDashboard adminStatus={adminStatus} pollsState={pollsState} setRoute={setRoute} setTx={setTransactionStatus} />
          </AdminRoute>
        )}
        {route === "create" && (
          <AdminRoute adminStatus={adminStatus} setRoute={setRoute}>
            <CreatePoll hasPollCount={pollsState.hasCount} isAdmin={adminStatus.isAdmin} pollCount={pollsState.count} setRoute={setRoute} setTx={setTransactionStatus} refetchPolls={pollsState.refetch} />
          </AdminRoute>
        )}
        {route === "whitelist" && (
          <AdminRoute adminStatus={adminStatus} setRoute={setRoute}>
            <Whitelist polls={pollsState.polls} setTx={setTransactionStatus} refetchPolls={pollsState.refetch} />
          </AdminRoute>
        )}
      </main>
      <StatusDock tx={tx} onClose={resetStatusDock} onRetry={retrySaveMetadata} />
    </div>
  );
}

function AdminRoute({ adminStatus, children, setRoute }) {
  if (!adminStatus.isConnected) {
    return (
      <section className="page-panel">
        <PageTitle title="Connect Wallet Required" subtitle="Admin tools are available only to the Voting contract owner." />
        <div className="actions">
          <WalletButton />
          <button className="secondary" onClick={() => setRoute("polls")}>Back to Polls</button>
        </div>
      </section>
    );
  }

  if (adminStatus.isLoading) {
    return (
      <section className="page-panel">
        <PageTitle title="Checking Admin Access" subtitle="Reading the Voting contract owner address." />
        <EmptyState text="Loading admin status..." />
      </section>
    );
  }

  if (!adminStatus.isAdmin) {
    return (
      <section className="page-panel">
        <PageTitle title="Access Denied" subtitle="This wallet is not the Voting contract owner." />
        <button className="secondary" onClick={() => setRoute("polls")}>Back to Polls</button>
      </section>
    );
  }

  return children;
}
