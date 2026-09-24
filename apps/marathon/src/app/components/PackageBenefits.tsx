// Package `benefits` arrives as a free-text blob of "- Label: value" lines with
// hard-wrapped continuations; parse it back into bullets so it renders as a list.
function parseBenefits(raw: string): string[] {
  const lines = raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const items: string[] = [];
  for (const line of lines) {
    if (/^-\s*/.test(line)) {
      items.push(line.replace(/^-\s*/, ''));
    } else if (items.length > 0) {
      // Continuation of the previous bullet (wrapped mid-sentence)
      items[items.length - 1] += ` ${line}`;
    } else {
      items.push(line);
    }
  }
  return items;
}

export function PackageBenefits({ benefits, className = '' }: { benefits: string; className?: string }) {
  const items = parseBenefits(benefits);
  if (items.length === 0) return null;

  return (
    <ul className={`space-y-1 ${className}`}>
      {items.map((item, i) => {
        const labelled = item.match(/^([^:]{2,40}):\s*(.+)$/s);
        return (
          <li key={i} className="flex gap-1.5">
            <span className="opacity-50 shrink-0 leading-relaxed">•</span>
            {labelled ? (
              <span className="min-w-0 leading-relaxed">
                <span className="font-semibold">{labelled[1]}:</span>{' '}
                <span className="opacity-80">{labelled[2]}</span>
              </span>
            ) : (
              <span className="min-w-0 leading-relaxed opacity-80">{item}</span>
            )}
          </li>
        );
      })}
    </ul>
  );
}
