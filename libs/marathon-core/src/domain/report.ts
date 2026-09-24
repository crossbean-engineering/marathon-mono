// Aggregate counters, one shape per type. Requested as
// GET /reports/stats?type=<StatsType>.
export type StatsType =
  | 'user_stats'
  | 'participant_stats'
  | 'wristband_stats'
  | 'financial_stats';

export type StatsQuery = {
  type: StatsType;
};

export type UserStats = {
  totalUsers: number;
};

// Keys are the shirt sizes actually recorded, since shirtSize is free text.
// Participants with no size are counted under `unspecified`.
export type ShirtSizeDistribution = Record<string, number>;

export type GenderDistribution = {
  male: number;
  female: number;
  unspecified: number;
};

export type ParticipantStats = {
  total: number;
  pending: number;
  active: number;
  suspended: number;
  genderDistribution: GenderDistribution;
  shirtSizeDistribution: ShirtSizeDistribution;
};

export type WristbandStats = {
  total: number;
  available: number;
  redeemed: number;
  disabled: number;
  assigned: number; // linked to a participant
};

export type FinancialStats = {
  totalRevenuePesewas: number;
  completedPayments: number;
  pendingPayments: number;
  failedPayments: number;
};

export type StatsResponse =
  | UserStats
  | ParticipantStats
  | WristbandStats
  | FinancialStats;

// Tabular reports, one row shape per type. Requested as
// GET /reports?reportType=<ReportType>.
export type ReportType = 'package_performance';

export type ReportQuery = {
  reportType: ReportType;
};

export type PackagePerformanceRow = {
  packageId: string;
  name: string;
  participants: number;
  revenuePesewas: number;
};

export type ReportsResponse = {
  reportType: ReportType;
  rows: PackagePerformanceRow[];
};