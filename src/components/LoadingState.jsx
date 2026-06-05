import EmptyState from "./EmptyState";

export default function LoadingState({ text = "Loading..." }) {
  return <EmptyState text={text} />;
}
