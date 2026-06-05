import { BadgeCheck, CircleAlert } from "lucide-react";

export default function IntegrityBadge({ integrity }) {
  if (integrity?.status === "verified") {
    return <span className="verified"><BadgeCheck size={13} /> Verified</span>;
  }

  if (integrity?.status === "tampered") {
    return <span className="verified danger-text"><CircleAlert size={13} /> Tampered</span>;
  }

  return <span className="verified warning-text"><CircleAlert size={13} /> Missing</span>;
}
