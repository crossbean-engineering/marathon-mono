import { useRenderPrice } from '@ak-marathon/sdk';
import type { AddOnType, BaseAddOn } from '@ak-marathon/sdk';
import { Check } from 'lucide-react';
import {
  availableBundles,
  describeAddOn,
  optionsOfType,
  WeekendSelection,
} from '../lib/weekendPackage';

interface WeekendPackagePickerProps {
  addOns: BaseAddOn[];
  value: WeekendSelection;
  onChange: (value: WeekendSelection) => void;
  disabled?: boolean;
}

const optionCls = (selected: boolean, unavailable = false) =>
  `w-full text-left p-3 rounded-xl border-2 transition-colors ${
    unavailable
      ? 'border-border opacity-50 cursor-not-allowed'
      : selected
        ? 'border-olive bg-olive/5'
        : 'border-border hover:border-olive/50'
  }`;

// Weekend Package step for participants travelling to Takoradi: pick a bundle,
// then the specific room (and transport, if there's more than one option).
export function WeekendPackagePicker({ addOns, value, onChange, disabled }: WeekendPackagePickerProps) {
  const { renderPrice } = useRenderPrice();
  const bundles = availableBundles(addOns);
  const bundle = bundles.find((b) => b.id === value.bundle) ?? bundles[0];

  const renderOptions = (type: AddOnType, chosenId: string, field: 'accommodationId' | 'transportId') => {
    const options = optionsOfType(addOns, type);
    // A single option is picked automatically — nothing to choose.
    if (options.length <= 1) return null;
    return (
      <div className="space-y-2">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          {type === 'accommodation' ? 'Accommodation' : 'Transport'}
        </p>
        {options.map((addOn) => {
          const soldOut = addOn.remaining === 0;
          const selected = chosenId === addOn.id;
          return (
            <button
              key={addOn.id}
              type="button"
              disabled={disabled || soldOut}
              onClick={() => onChange({ ...value, [field]: addOn.id })}
              className={optionCls(selected, soldOut)}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate">{describeAddOn(addOn)}</p>
                  {addOn.description && <p className="text-xs text-muted-foreground">{addOn.description}</p>}
                  {soldOut && <p className="text-xs text-red-500 font-medium">Fully booked</p>}
                </div>
                <p className="text-sm font-bold whitespace-nowrap">
                  {renderPrice(addOn.price)}
                  <span className="text-[10px] text-muted-foreground font-medium">/person</span>
                </p>
              </div>
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-semibold">Coming from outside Takoradi?</p>
        <p className="text-xs text-muted-foreground">Add a Weekend Package — or keep it to the race.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {bundles.map((option) => {
          const selected = bundle?.id === option.id;
          return (
            <button
              key={option.id}
              type="button"
              disabled={disabled}
              onClick={() => onChange({ ...value, bundle: option.id })}
              className={optionCls(selected)}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold">{option.label}</p>
                  <p className="text-xs text-muted-foreground">{option.description}</p>
                </div>
                {selected && <Check className="w-4 h-4 text-olive shrink-0" />}
              </div>
            </button>
          );
        })}
      </div>

      {bundle?.types.includes('accommodation') && renderOptions('accommodation', value.accommodationId, 'accommodationId')}
      {bundle?.types.includes('transport') && renderOptions('transport', value.transportId, 'transportId')}
    </div>
  );
}
