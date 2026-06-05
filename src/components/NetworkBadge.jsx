export default function NetworkBadge({ isSepolia }) {
  return <span className={`network ${isSepolia ? "" : "wrong"}`}><span /> {isSepolia ? "Sepolia" : "Wrong Network"}</span>;
}
