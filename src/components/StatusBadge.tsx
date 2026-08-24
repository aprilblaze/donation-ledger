type Tone = "neutral" | "positive" | "warning" | "muted";

const toneClasses: Record<Tone, string> = {
  neutral: "border-rule-strong text-ink",
  positive: "border-positive/40 text-positive",
  warning: "border-negative/40 text-negative",
  muted: "border-rule text-muted",
};

export default function StatusBadge({
  label,
  tone = "neutral",
}: {
  label: string;
  tone?: Tone;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-wide ${toneClasses[tone]}`}
    >
      {label}
    </span>
  );
}
