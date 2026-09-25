// Packages will come from the API — these types mirror the expected response
// shape and should move to the SDK once the packages endpoints land.

export type Merchandise = {
  id: string;
  name: string;
  description: string;
};

export type Prize = {
  id: string;
  name: string;
  amount: number; // GHS
  position: number; // 1 = 1st place, 2 = 2nd place, ...
  description: string;
};

export type ParticipationPackage = {
  id: string;
  name: string;
  price: number; // GHS
  items: Merchandise[];
  benefits: string;
  prizes: Prize[];
};

export const SHIRT_SIZES = ['xs', 's', 'm', 'l', 'xl', 'xxl'] as const;
export type ShirtSize = (typeof SHIRT_SIZES)[number];

// Race vest measurements in inches, shown in the size guide. TODO: fill in from
// the vest supplier's spec sheet — null renders as "TBC".
export const VEST_SIZE_CHART: Record<
  ShirtSize,
  { chest: string | null; length: string | null }
> = {
  xs: { chest: null, length: null },
  s: { chest: null, length: null },
  m: { chest: null, length: null },
  l: { chest: null, length: null },
  xl: { chest: null, length: null },
  xxl: { chest: null, length: null },
};

export const GENDERS = ['Male', 'Female'] as const;
export type Gender = (typeof GENDERS)[number];

// Detail captured when a participant buys into a package.
export type PackageDetail = {
  name: string;
  userId: string; // User
  packageId: string; // Package
  code: string;
  shirtSize: ShirtSize;
  gender: Gender;
};
