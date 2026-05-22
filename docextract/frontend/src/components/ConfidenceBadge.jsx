export default function ConfidenceBadge({ confidence }) {
  const icons = { high: "●", medium: "◐", low: "○" };
  return (
    <span className={`badge badge-${confidence}`}>
      {icons[confidence] || "○"} {confidence}
    </span>
  );
}
