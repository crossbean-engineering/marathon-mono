import { useRenderPrice } from '@ak-marathon/sdk';
import type { ParticipantAddOnSummary } from '@ak-marathon/sdk';
import { BedDouble, Bus } from 'lucide-react';
import { describeAddOn } from '../lib/weekendPackage';

// The Weekend Package add-ons booked on a registration. Renders nothing for a
// race-only registration.
export function ParticipantAddOns({ addOns, className = '' }: { addOns?: ParticipantAddOnSummary[]; className?: string }) {
  const { renderPrice } = useRenderPrice();
  if (!addOns?.length) return null;

  return (
    <div className={className}>
      <p className="text-muted-foreground text-xs uppercase tracking-wide mb-2">Weekend Package</p>
      <ul className="space-y-1.5">
        {addOns.map((addOn) => {
          const Icon = addOn.type === 'accommodation' ? BedDouble : Bus;
          return (
            <li key={addOn.addOnId} className="flex items-center justify-between gap-3 text-sm">
              <span className="flex items-center gap-2 min-w-0">
                <Icon className="w-4 h-4 text-olive shrink-0" />
                <span className="font-medium truncate">{describeAddOn(addOn)}</span>
              </span>
              <span className="text-muted-foreground whitespace-nowrap">{renderPrice(addOn.price)}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
