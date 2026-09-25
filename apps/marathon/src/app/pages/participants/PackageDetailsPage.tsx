import { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AuthHeader } from '../../components/AuthHeader';
import { useAkMarathonQuery, useRenderPrice } from '@ak-marathon/sdk';
import type { BaseParticipant } from '@ak-marathon/sdk';
import { ArrowLeft, CheckCircle, Clock, AlertCircle, Gift, Trophy, User, Download, Loader2 } from 'lucide-react';
import { Button } from '../../components/ui';
import { PackageBenefits } from '../../components/PackageBenefits';
import { useGenerateTicketPdf } from '../../hooks/useGenerateTicketPdf';
import QRCode from 'react-qr-code';

export default function PackageDetailsPage() {
  const navigate = useNavigate();
  const { ticketId } = useParams<{ ticketId: string }>();

  const { renderPrice } = useRenderPrice();

  // Fetch the authenticated user's participants
  const { data: meData, isLoading } = useAkMarathonQuery("me", {
    refetchOnWindowFocus: false,
    staleTime: 2 * 60 * 1000,
  });

  const participants = useMemo(() => meData?.participants || [], [meData]);
  const participant = useMemo(
    () => participants.find((p: BaseParticipant) => p.id === ticketId),
    [participants, ticketId]
  );

  const isRedeemed = !!participant?.wristbandCode;

  // Fetch the package this participant belongs to
  const { data: pkg, isLoading: packageLoading } = useAkMarathonQuery("getPackage", {
    params: { id: participant?.packageId ?? '' },
    enabled: !!participant?.packageId,
    refetchOnWindowFocus: false,
  });

  const prizes = useMemo(
    () => [...(pkg?.prizes ?? [])].sort((a, b) => (a.position ?? 99) - (b.position ?? 99)),
    [pkg]
  );

  const medal = (position?: number | null) =>
    position === 1 ? '🥇' : position === 2 ? '🥈' : position === 3 ? '🥉' : '🏅';

  const { generatePDF, loading: isGeneratingPdf } = useGenerateTicketPdf();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-cream via-background to-cream-dark">
        <AuthHeader />
        <div className="container mx-auto px-4 py-12 text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-olive"></div>
          <p className="text-muted-foreground mt-4">Loading your pass...</p>
        </div>
      </div>
    );
  }

  // Pass not found
  if (!participant) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-cream via-background to-cream-dark">
        <AuthHeader />
        <div className="container mx-auto px-4 py-12 max-w-2xl">
          <div className="bg-card rounded-2xl p-12 text-center border border-border">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-10 h-10 text-red-600" />
            </div>
            <h2 className="text-2xl font-display font-bold mb-2">Pass Not Found</h2>
            <p className="text-muted-foreground mb-6">
              The pass you're looking for doesn't exist or has been removed
            </p>
            <Button onClick={() => navigate('/participant')}>
              Back to Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-cream via-background to-cream-dark">
      <AuthHeader />
      <div className="container mx-auto px-4 py-6 sm:py-8 max-w-3xl">
        {/* Back button + PDF download */}
        <div className="mb-5 flex items-center justify-between gap-3">
          <button
            onClick={() => navigate('/participant')}
            className="text-muted-foreground hover:text-foreground flex items-center gap-2 transition-colors text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Back To Passes
          </button>
          <Button
            onClick={() => generatePDF({ participant, pkg })}
            disabled={isGeneratingPdf}
            variant="outline"
            size="sm"
          >
            {isGeneratingPdf ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Download className="w-4 h-4 mr-2" />
            )}
            Download PDF
          </Button>
        </div>

        {/* ═══ Hero: the Event Pass ═══ */}
        <div className="relative rounded-2xl border border-white/15 bg-emerald-900 shadow-xl overflow-hidden mb-6">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />

          <div className="p-5 sm:p-6">
            {/* Header */}
            <div className="flex items-start justify-between gap-3 mb-5">
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-sky-300 mb-0.5">
                  🎟 Event Pass
                </p>
                <p className="font-display font-bold text-xl text-white leading-tight">
                  {participant.name}
                </p>
                {pkg && (
                  <p className="text-sm text-white/60 mt-0.5">{pkg.name}</p>
                )}
              </div>
              <span className="shrink-0 text-xs px-3 py-1.5 bg-white/10 text-white rounded-full flex items-center gap-1.5 font-medium">
                {isRedeemed
                  ? <><CheckCircle className="w-4 h-4 text-yellow-300" /> Active</>
                  : <><Clock className="w-4 h-4 text-yellow-300" /> {participant.status === 'pending' ? 'Pending' : participant.status === 'active' ? 'Active' : 'Suspended'}</>}
              </span>
            </div>

            {/* Code area */}
            {isRedeemed ? (
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-white/50 mb-2 text-center">
                  Wristband Code
                </p>
                <div className="bg-white rounded-xl px-4 py-7 mb-3 flex items-center justify-center max-w-xs mx-auto">
                  <QRCode
                    value={participant.wristbandCode || ''}
                    size={200}
                    level="H"
                    fgColor="#064e3b"
                  />
                </div>
                <p className="font-mono text-2xl font-bold tracking-wider text-yellow-300 text-center mb-1">
                  {participant.wristbandCode}
                </p>
                <p className="text-white/60 text-xs text-center">
                  This is your race-day wristband
                </p>
              </div>
            ) : (
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-white/50 mb-2 text-center">
                  Redemption Code
                </p>
                <div className="bg-white rounded-xl px-4 py-7 mb-3 flex items-center justify-center max-w-xs mx-auto">
                  <QRCode
                    value={participant.code}
                    size={200}
                    level="H"
                    fgColor="#064e3b"
                  />
                </div>
                <p className="font-mono text-lg font-bold tracking-wider text-yellow-300 text-center mb-1 break-all">
                  {participant.code}
                </p>
                <p className="text-white/60 text-xs text-center">
                  Show this QR code at the redemption counter to receive your wristband
                </p>
              </div>
            )}
          </div>

          {/* Perforated price strip */}
          <div className="relative border-t-2 border-dashed border-white/20 px-5 sm:px-6 py-3 flex items-center justify-between">
            <span className="absolute -top-2 -left-2 w-4 h-4 rounded-full bg-cream" style={{ backgroundColor: 'var(--background, #faf7f0)' }} />
            <span className="absolute -top-2 -right-2 w-4 h-4 rounded-full bg-cream" style={{ backgroundColor: 'var(--background, #faf7f0)' }} />
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/50">Admit One</p>
            {pkg && (
              <p className="font-display font-bold text-yellow-300">{renderPrice(pkg.price)}</p>
            )}
          </div>
        </div>

        {/* ═══ Runner details + package benefits + prizes, one simple card ═══ */}
        <div className="bg-card rounded-xl shadow-md border border-border overflow-hidden">
          {/* Runner details */}
          <div className="px-5 py-4 border-b border-border flex items-center gap-2">
            <User className="w-4 h-4 text-olive" />
            <h3 className="font-display font-semibold">Runner Details</h3>
          </div>
          <div className="p-5 grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground text-xs uppercase tracking-wide mb-1">Name</p>
              <p className="font-medium">{participant.name}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs uppercase tracking-wide mb-1">Gender</p>
              <p className="font-medium capitalize">{participant.gender || '—'}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs uppercase tracking-wide mb-1">Vest Size</p>
              <p className="font-medium uppercase">{participant.shirtSize || '—'}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs uppercase tracking-wide mb-1">Registered</p>
              <p className="font-medium">{new Date(participant.createdAt).toLocaleDateString()}</p>
            </div>
          </div>

          {/* Package benefits */}
          <div className="px-5 py-4 border-t border-border">
            <div className="flex items-center gap-2 mb-3">
              <Gift className="w-4 h-4 text-olive" />
              <h3 className="font-display font-semibold">Package Benefits</h3>
            </div>
            {packageLoading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-olive" />
            ) : !pkg || pkg.merchandise.length === 0 ? (
              <p className="text-sm text-muted-foreground">No merchandise included</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {pkg.merchandise.map((item) => (
                  <span
                    key={item.id}
                    title={item.description ?? undefined}
                    className="inline-flex items-center gap-1.5 bg-olive/10 text-olive text-xs font-medium rounded-full px-3 py-1"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    {item.name}
                  </span>
                ))}
              </div>
            )}
            {pkg?.benefits && (
              <PackageBenefits benefits={pkg.benefits} className="text-xs text-muted-foreground mt-2.5" />
            )}
          </div>

          {/* When you win */}
          <div className="px-5 py-4 border-t border-border">
            <div className="flex items-center gap-2 mb-3">
              <Trophy className="w-4 h-4 text-olive" />
              <h3 className="font-display font-semibold">When You Win</h3>
            </div>
            {packageLoading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-olive" />
            ) : prizes.length === 0 ? (
              <p className="text-sm text-muted-foreground">Every finisher takes home a medal 🏅</p>
            ) : (
              <ul className="space-y-2">
                {prizes.map((prize) => (
                  <li key={prize.id} className="flex items-center justify-between gap-3 text-sm">
                    <p className="font-medium min-w-0 truncate">
                      {medal(prize.position)} {prize.name}
                    </p>
                    {typeof prize.amount === 'number' && prize.amount > 0 && (
                      <p className="font-bold text-amber-600 whitespace-nowrap">{renderPrice(prize.amount)}</p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
