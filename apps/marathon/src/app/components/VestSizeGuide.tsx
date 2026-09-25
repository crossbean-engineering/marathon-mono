import { Ruler } from 'lucide-react';
import { BaseModal } from './BaseModal';
import { SHIRT_SIZES, VEST_SIZE_CHART } from '../types/packages';

// Size table for the race vest. Rows with no measurements yet render "TBC" so
// the table stays usable until the supplier's spec is filled in.
export function VestSizeTable({ tone = 'light' }: { tone?: 'light' | 'dark' }) {
  const dark = tone === 'dark';
  const head = dark ? 'text-white/60' : 'text-muted-foreground';
  const cell = dark ? 'text-white' : 'text-foreground';
  const rule = dark ? 'border-white/10' : 'border-border';

  return (
    <div>
      <table className="w-full text-sm">
        <thead>
          <tr className={`border-b ${rule}`}>
            <th className={`text-left py-2 font-bold text-[11px] uppercase tracking-wider ${head}`}>Size</th>
            <th className={`text-right py-2 font-bold text-[11px] uppercase tracking-wider ${head}`}>Chest (in)</th>
            <th className={`text-right py-2 font-bold text-[11px] uppercase tracking-wider ${head}`}>Length (in)</th>
          </tr>
        </thead>
        <tbody>
          {SHIRT_SIZES.map((size) => {
            const row = VEST_SIZE_CHART[size];
            return (
              <tr key={size} className={`border-b last:border-0 ${rule}`}>
                <td className={`py-2 font-bold uppercase ${cell}`}>{size}</td>
                <td className={`py-2 text-right tabular-nums ${cell}`}>{row.chest ?? 'TBC'}</td>
                <td className={`py-2 text-right tabular-nums ${cell}`}>{row.length ?? 'TBC'}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className={`text-xs mt-3 leading-relaxed ${head}`}>
        Measure around the fullest part of your chest. Vests are unisex — if you're between sizes, size up.
      </p>
    </div>
  );
}

// "Size guide" link that opens the table in a modal. Sits next to every vest
// size picker.
export function VestSizeGuideLink() {
  return (
    <BaseModal
      title="Race Vest Size Guide"
      maxWidth="sm"
      trigger={
        <button
          type="button"
          className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline underline-offset-2"
        >
          <Ruler className="w-3 h-3" /> Size guide
        </button>
      }
    >
      {() => <VestSizeTable />}
    </BaseModal>
  );
}
