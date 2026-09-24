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

export const SHIRT_SIZES = ['s', 'm', 'l', 'xl'] as const;
export type ShirtSize = (typeof SHIRT_SIZES)[number];

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

// Placeholder data until the packages API is available.
export const SAMPLE_PACKAGES: ParticipationPackage[] = [
  {
    id: 'individual',
    name: 'Individual Runner',
    price: 150,
    items: [
      { id: 'bib', name: 'Race Bib', description: 'Official numbered race bib' },
      { id: 'wristband', name: 'Wristband', description: 'Event wristband for race-day access' },
      { id: 'medal', name: "Finisher's Medal", description: 'Medal awarded at the finish line' },
    ],
    benefits: 'Entry to any race category',
    prizes: [],
  },
  {
    id: 'family',
    name: 'Family & Friends',
    price: 500,
    items: [
      { id: 'bib', name: 'Race Bib', description: '5 official numbered race bibs' },
      { id: 'wristband', name: 'Wristband', description: '5 event wristbands for race-day access' },
      { id: 'medal', name: "Finisher's Medal", description: '5 medals awarded at the finish line' },
    ],
    benefits: 'Up to 5 runners, one hometown crew',
    prizes: [],
  },
  {
    id: 'association',
    name: 'Church · School · Association',
    price: 1500,
    items: [
      { id: 'bib', name: 'Race Bib', description: '20 official numbered race bibs' },
      { id: 'tshirt', name: 'T-Shirt', description: '20 branded event T-shirts' },
      { id: 'banner', name: 'Route Banner', description: 'Your banner displayed along the route' },
    ],
    benefits: '20 runners + your banner on the route',
    prizes: [
      { id: 'fastest-group', name: 'Fastest Group', amount: 1000, position: 1, description: 'Awarded to the fastest church, school or association team' },
    ],
  },
  {
    id: 'business',
    name: 'Local Business',
    price: 2500,
    items: [
      { id: 'bib', name: 'Race Bib', description: '10 official numbered race bibs' },
      { id: 'stand', name: 'Durbar Stand', description: 'A vendor stand at the finish-line durbar grounds' },
    ],
    benefits: '10 runners + a stand at the durbar grounds',
    prizes: [],
  },
];