// Western City Run — static event content for the public pages. Live race
// categories, prices and prizes come from the packages API; everything here is
// copy that does not change per registration.

export const EVENT = {
  name: 'Western City Run',
  tagline: "The Western Region's first community race & wellness festival",
  edition: 'Inaugural Edition',
  year: 2026,
  date: {
    weekday: 'Sat',
    day: '05',
    daySuffix: 'th',
    monthYear: 'DEC 2026',
    long: 'Saturday, December 5, 2026',
  },
  city: 'Takoradi',
  venue: 'The Takoradi Mall (I love Tadi Park)',
  registrationOpens: 'September 2026',
} as const;

// Shown on the landing page when the API has no packages yet (or is down).
export const EVENT_CATEGORIES = [
  '10KM Run',
  '5KM Run',
  '5KM Corporate & Family Walk',
] as const;

export const EVENT_ROUTE =
  "All categories start and finish along Takoradi's coastal route, at The Takoradi Mall (I love Tadi Park). " +
  'The 10K and 5K run along the coastal road; the 5K Walk follows a flatter, easier stretch of the same route.';

export const EVENT_HYDRATION =
  'Water and hydration stations every 2–3km along the 10K and 5K routes, plus a full hydration point at the Wellness Village for all finishers.';

export const REGISTRATION_INCLUDES = [
  'Official race bib',
  'Branded Western City Run vest',
  'Custom finisher medal',
  'Hydration stations throughout the race',
  'Full Wellness Village access',
] as const;

export const WELLNESS_VILLAGE = [
  'Health screening & health education, in partnership with the Western Regional Health Directorate',
  'Recovery & massage zone',
  'Sponsor expo & brand activations',
  'Live entertainment',
  'Awards ceremony',
] as const;

export const CORPORATE_TEAM_NOTE =
  'Discounted Corporate Team Challenge rate available for company groups of 10 or more.';
