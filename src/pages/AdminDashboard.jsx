import { BarChart3, ChevronRight, FilePlus2, Gauge, UsersRound } from "lucide-react";
import AdminPollRow from "../components/AdminPollRow";
import { Metric, PageTitle, Sidebar, shortAddress } from "../components/SharedUI";

export default function AdminDashboard({ adminStatus, pollsState, setRoute, setTx }) {
  const { isAdmin, owner } = adminStatus;
  const activePolls = pollsState.polls.filter((poll) => poll.isActive && !poll.isExpired);
  const closedPolls = pollsState.polls.length - activePolls.length;
  return (
    <section className="admin-layout">
      <Sidebar setRoute={setRoute} active="dashboard" isAdmin={isAdmin} />
      <div className="admin-main">
        <PageTitle title="Dashboard" subtitle={isAdmin ? "Owner controls enabled" : "Connect owner wallet for admin actions"} />
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
              <AdminPollRow key={poll.id.toString()} poll={poll} disabled={!isAdmin} setTx={setTx} refetchPolls={pollsState.refetch} />
            ))}
          </div>
          <div className="admin-card">
            <h3>Admin Actions</h3>
            <div className="actions vertical">
              <button className="primary" onClick={() => setRoute("create")} disabled={!isAdmin}><FilePlus2 size={16} /> Create Poll</button>
              <button className="secondary" onClick={() => setRoute("whitelist")} disabled={!isAdmin}><UsersRound size={16} /> Add Whitelist</button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
