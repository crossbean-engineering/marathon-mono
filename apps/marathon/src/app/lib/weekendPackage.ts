import type { BaseAddOn, AddOnType } from '@ak-marathon/sdk';

// Weekend Package bundles for participants travelling to Takoradi. Each bundle
// is the race package plus a set of add-on types; the API only sees the
// resulting add-on ids.
export type WeekendBundle = 'race' | 'race_transport' | 'race_stay' | 'full';

export const WEEKEND_BUNDLES: {
  id: WeekendBundle;
  label: string;
  description: string;
  types: AddOnType[];
}[] = [
  { id: 'race', label: 'Race only', description: 'Just the race registration', types: [] },
  { id: 'race_transport', label: 'Race + Transport', description: 'Return group transportation', types: ['transport'] },
  { id: 'race_stay', label: 'Race + Stay', description: 'Your choice of accommodation', types: ['accommodation'] },
  { id: 'full', label: 'Full Package', description: 'Race + transportation + accommodation', types: ['transport', 'accommodation'] },
];

export type WeekendSelection = {
  bundle: WeekendBundle;
  // Chosen option per type. Can stay empty when there's only one option.
  accommodationId: string;
  transportId: string;
};

export const RACE_ONLY: WeekendSelection = { bundle: 'race', accommodationId: '', transportId: '' };

const isBookable = (addOn: BaseAddOn) => addOn.isActive && addOn.remaining !== 0;

export function optionsOfType(addOns: readonly BaseAddOn[], type: AddOnType): BaseAddOn[] {
  return addOns.filter((a) => a.type === type);
}

// Bundles that can actually be offered: every add-on type they need has at
// least one bookable option. "Race only" is always offered.
export function availableBundles(addOns: readonly BaseAddOn[]) {
  return WEEKEND_BUNDLES.filter((bundle) =>
    bundle.types.every((type) => optionsOfType(addOns, type).some(isBookable)),
  );
}

// The chosen option for a type: the one picked, or the only bookable option
// when there's no choice to make.
function pick(addOns: readonly BaseAddOn[], type: AddOnType, chosenId: string): BaseAddOn | undefined {
  const options = optionsOfType(addOns, type).filter(isBookable);
  if (chosenId) return options.find((a) => a.id === chosenId);
  return options.length === 1 ? options[0] : undefined;
}

// Add-on types the selection books. A bundle that is no longer offered (e.g.
// its rooms sold out) counts as race only rather than blocking checkout.
function bundleTypes(selection: WeekendSelection, addOns: readonly BaseAddOn[]): AddOnType[] {
  return availableBundles(addOns).find((b) => b.id === selection.bundle)?.types ?? [];
}

// The add-ons a selection books. Unresolved choices are left out —
// `selectionError` reports them.
export function selectedAddOns(selection: WeekendSelection, addOns: readonly BaseAddOn[]): BaseAddOn[] {
  return bundleTypes(selection, addOns)
    .map((type) => pick(addOns, type, type === 'accommodation' ? selection.accommodationId : selection.transportId))
    .filter((a): a is BaseAddOn => !!a);
}

// Why the selection can't be booked yet, or null when it's complete.
export function selectionError(selection: WeekendSelection, addOns: readonly BaseAddOn[]): string | null {
  for (const type of bundleTypes(selection, addOns)) {
    const chosenId = type === 'accommodation' ? selection.accommodationId : selection.transportId;
    if (!pick(addOns, type, chosenId)) {
      return type === 'accommodation' ? "Choose where you'd like to stay" : 'Choose your transport option';
    }
  }
  return null;
}

export function addOnTotal(addOns: readonly Pick<BaseAddOn, 'price'>[]): number {
  return addOns.reduce((sum, a) => sum + a.price, 0);
}

// "KOD Apartment — Double room (2 sharing)" for rooms, the name otherwise.
// Mirrors the API's describeAddOn so emails, exports and the UI agree.
export function describeAddOn(addOn: Pick<BaseAddOn, 'name' | 'provider' | 'occupancy'>): string {
  const label = addOn.provider ? `${addOn.provider} — ${addOn.name}` : addOn.name;
  return addOn.occupancy ? `${label} (${addOn.occupancy} sharing)` : label;
}
