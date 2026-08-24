export default function PageHeader({
  eyebrow,
  title,
  action,
}: {
  eyebrow?: string;
  title: string;
  action?: React.ReactNode;
}) {
  return (
    <header className="sticky top-0 z-10 border-b border-rule bg-paper/95 px-5 pb-4 pt-6 backdrop-blur">
      <div className="flex items-end justify-between gap-3">
        <div>
          {eyebrow && (
            <p className="mb-1 text-[11px] font-medium uppercase tracking-[0.14em] text-muted">
              {eyebrow}
            </p>
          )}
          <h1 className="font-display text-[26px] leading-none text-ink">
            {title}
          </h1>
        </div>
        {action}
      </div>
    </header>
  );
}
