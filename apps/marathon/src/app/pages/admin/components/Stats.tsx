import { useAkMarathonQuery, useRenderPrice } from '@ak-marathon/sdk';
import type { UserStats, ParticipantStats, WristbandStats, FinancialStats } from '@ak-marathon/sdk';
import {
  Banknote,
  Receipt,
  Users,
  UserRound,
  Contact,
  IdCard,
  CheckCircle,
  Clock,
  XCircle,
} from 'lucide-react';

function StatValue({ loading, children }: { loading: boolean; children: React.ReactNode }) {
  if (loading) return <span className="inline-block w-16 h-7 bg-muted/60 rounded animate-pulse" />;
  return <>{children}</>;
}

export default function Stats() {
  // /reports/stats now requires a `type` and returns a different shape per
  // type, so the old combined dashboard blob needs 4 parallel calls.
  const { data: userStatsRaw, isLoading: userLoading } = useAkMarathonQuery('stats', {
    query: { type: 'user_stats' },
    refetchOnWindowFocus: false,
  });
  const { data: participantStatsRaw, isLoading: participantLoading } = useAkMarathonQuery('stats', {
    query: { type: 'participant_stats' },
    refetchOnWindowFocus: false,
  });
  const { data: wristbandStatsRaw, isLoading: wristbandLoading } = useAkMarathonQuery('stats', {
    query: { type: 'wristband_stats' },
    refetchOnWindowFocus: false,
  });
  const { data: financialStatsRaw, isLoading: financialLoading } = useAkMarathonQuery('stats', {
    query: { type: 'financial_stats' },
    refetchOnWindowFocus: false,
  });
  // The endpoint returns a discriminated-by-query-value union — cast each
  // call to the shape its own `type` param actually returns.
  const userStats = userStatsRaw as UserStats | undefined;
  const participantStats = participantStatsRaw as ParticipantStats | undefined;
  const wristbandStats = wristbandStatsRaw as WristbandStats | undefined;
  const financialStats = financialStatsRaw as FinancialStats | undefined;
  const isLoading = userLoading || participantLoading || wristbandLoading || financialLoading;
  const { renderPrice } = useRenderPrice();

  return (
    <div className="space-y-4 mb-8">
      {/* ── Financial Stats (Primary) ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Hero card — Total Revenue */}
        <div className="col-span-2 lg:col-span-1 bg-linear-to-br from-olive to-golden-light rounded-xl p-5 text-primary-foreground relative overflow-hidden">
          <div className="absolute -right-3 -top-3 opacity-10">
            <Banknote className="w-24 h-24" strokeWidth={1} />
          </div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center">
              <Banknote className="w-4 h-4" />
            </div>
            <p className="text-primary-foreground/80 text-xs font-medium uppercase tracking-wide">Total Revenue</p>
          </div>
          <p className="text-3xl font-display font-bold">
            <StatValue loading={isLoading}>{renderPrice(financialStats?.totalRevenuePesewas ?? 0)}</StatValue>
          </p>
        </div>

        {/* Completed Payments */}
        <div className="bg-card rounded-xl p-5 border border-border group hover:border-olive/30 transition-colors">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-lg bg-olive/10 flex items-center justify-center">
              <CheckCircle className="w-4 h-4 text-olive" />
            </div>
            <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">Completed</p>
          </div>
          <p className="text-2xl font-display font-bold text-foreground">
            <StatValue loading={isLoading}>{(financialStats?.completedPayments ?? 0).toLocaleString()}</StatValue>
          </p>
        </div>

        {/* Pending Payments */}
        <div className="bg-card rounded-xl p-5 border border-border group hover:border-golden/30 transition-colors">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-lg bg-golden/10 flex items-center justify-center">
              <Clock className="w-4 h-4 text-golden" />
            </div>
            <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">Pending</p>
          </div>
          <p className="text-2xl font-display font-bold text-foreground">
            <StatValue loading={isLoading}>{(financialStats?.pendingPayments ?? 0).toLocaleString()}</StatValue>
          </p>
        </div>

        {/* Failed Payments */}
        <div className="bg-card rounded-xl p-5 border border-border group hover:border-red-300 transition-colors">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-lg bg-red-100 flex items-center justify-center">
              <XCircle className="w-4 h-4 text-red-500" />
            </div>
            <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">Failed</p>
          </div>
          <p className="text-2xl font-display font-bold text-foreground">
            <StatValue loading={isLoading}>{(financialStats?.failedPayments ?? 0).toLocaleString()}</StatValue>
          </p>
        </div>
      </div>

      {/* ── Counts (Secondary) ── */}
      <div className="grid grid-cols-3 lg:grid-cols-5 gap-3">
        {[
          { label: 'Total Users', value: userStats?.totalUsers, icon: Users },
          { label: 'Participants', value: participantStats?.total, icon: UserRound },
          { label: 'Active Runners', value: participantStats?.active, icon: Contact },
          { label: 'Wristbands', value: wristbandStats?.total, icon: IdCard },
          { label: 'Redeemed', value: wristbandStats?.redeemed, icon: Receipt },
        ].map(({ label, value, icon: Icon }) => (
          <div
            key={label}
            className="bg-card/60 rounded-lg px-4 py-3 border border-border/60 flex items-center gap-3"
          >
            <Icon className="w-4 h-4 text-muted-foreground shrink-0" />
            <div className="min-w-0">
              <p className="text-muted-foreground text-[10px] font-medium uppercase tracking-wide truncate">{label}</p>
              <p className="text-lg font-display font-bold text-foreground leading-tight">
                <StatValue loading={isLoading}>{(value ?? 0).toLocaleString()}</StatValue>
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
