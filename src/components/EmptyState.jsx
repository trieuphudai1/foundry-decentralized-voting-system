import { CircleAlert, ShieldCheck } from "lucide-react";

export default function EmptyState({ text, danger }) {
  return <div className={`notice ${danger ? "danger-text" : ""}`}>{danger ? <CircleAlert size={16} /> : <ShieldCheck size={16} />} {text}</div>;
}
