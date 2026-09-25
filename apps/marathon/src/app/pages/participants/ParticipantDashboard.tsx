import { useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthHeader } from '../../components/AuthHeader';
import { useAkMarathonMutation, useAkMarathonQuery, useRenderPrice } from '@ak-marathon/sdk';
import type { BaseParticipant, BasePackage, PaymentNetwork, ValidateCouponResponse } from '@ak-marathon/sdk';
import { CreditCard, Plus, CheckCircle, Clock, RefreshCcw, ArrowLeft, Check, BadgePercent, Loader2, RotateCcw, AlertTriangle } from 'lucide-react';
import { Button, Input } from '../../components/ui';
import { PackageBenefits } from '../../components/PackageBenefits';
import QRCode from 'react-qr-code';

import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'sonner';
import { ApiDomainError } from '@rabstack/rab-react-sdk';
import { BaseModal } from '../../components/BaseModal';
import { RegistrationClosedNotice } from '../../components/RegistrationClosedNotice';
import { PhoneField } from '../../components/ui/phoneField';
import { GENDERS, SHIRT_SIZES } from '../../types/packages';
import type { Gender, ShirtSize } from '../../types/packages';
import { ghPhoneError, isValidGhPhone, toGhIntlPhone } from '../../utils';
import { useSessionToken } from '../../hooks/useSessionToken';
import { PACKAGE_SALES_OPEN } from '../../lib/registration-status';
import { VestSizeGuideLink } from '../../components/VestSizeGuide';
import { WeekendPackagePicker } from '../../components/WeekendPackagePicker';
import {
  addOnTotal,
  availableBundles,
  describeAddOn,
  RACE_ONLY,
  selectedAddOns,
  selectionError,
} from '../../lib/weekendPackage';
import type { WeekendSelection } from '../../lib/weekendPackage';

const PAYMENT_NETWORKS: PaymentNetwork[] = ['MTN', 'VODAFONE', 'AIRTELTIGO'];

const formatPhone = (phoneLocal: string): string => toGhIntlPhone(phoneLocal);

// Strip 233 prefix back to the local 9-digit form for inputs
const toLocalPhone = (phone?: string): string =>
  (phone ?? '').replace(/\D/g, '').replace(/^233/, '');

export default function ParticipantDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Fetch the authenticated user's participants
  const { data: meData, isLoading, refetch } = useAkMarathonQuery("me", {
    refetchOnWindowFocus: false,
    staleTime: 2 * 60 * 1000,
  });

  const participants = useMemo(() => meData?.participants || [], [meData]);

  // Fetch available packages
  const { data: packagesData } = useAkMarathonQuery("listPackages", {
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000,
  });

  const packages = useMemo(() => packagesData || [], [packagesData]);

  // Shared across every Retry Payment modal opened from this dashboard so a
  // session token issued on one retry is still reusable within its 10-minute
  // window on a later retry, without depending on the retry form staying mounted.
  const { sessionToken, isTokenValidFor, storeSessionToken, clearSessionToken } = useSessionToken();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-cream via-background to-cream-dark">
        <AuthHeader />
        <div className="container mx-auto px-4 py-12 text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-olive"></div>
          <p className="text-muted-foreground mt-4">Loading your packages...</p>
        </div>
      </div>
    );
  }

  const buyModal = (trigger: React.ReactNode) => (
    <BaseModal
      trigger={trigger}
      title="Buy Package"
      description="Choose a package and complete payment"
      maxWidth="md"
    >
      {(closeModal) => (
        <BuyPackageForm
          packages={packages}
          userName={user ? `${user.firstName} ${user.lastName}`.trim() : ''}
          userPhone={user?.phone ?? ''}
          onDone={() => {
            closeModal();
            refetch();
          }}
          onCancel={closeModal}
          onPaymentInitiated={(transactionId) => {
            navigate(`/participant/topup-callback?order_id=${transactionId}&payment_mode=momo`);
          }}
          onClaimed={(participantId) => {
            navigate(`/participant/ticket/${participantId}`);
          }}
        />
      )}
    </BaseModal>
  );

  const retryModal = (participant: BaseParticipant, trigger: React.ReactNode) => (
    <BaseModal
      trigger={trigger}
      title="Retry Payment"
      description="Push a fresh payment prompt for this pass"
      maxWidth="md"
    >
      {(closeModal) => (
        <RetryPaymentForm
          participant={participant}
          packages={packages}
          userPhone={user?.phone ?? ''}
          sessionToken={sessionToken}
          isTokenValidFor={isTokenValidFor}
          storeSessionToken={storeSessionToken}
          clearSessionToken={clearSessionToken}
          onDone={() => {
            closeModal();
            refetch();
          }}
          onCancel={closeModal}
          onPaymentInitiated={(transactionId) => {
            navigate(`/participant/topup-callback?order_id=${transactionId}&payment_mode=momo`);
          }}
        />
      )}
    </BaseModal>
  );

  // Empty state
  if (participants.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-cream via-background to-cream-dark">
        <AuthHeader />
        <div className="container mx-auto px-4 py-12 max-w-7xl">
          <div className="bg-card rounded-2xl p-8 sm:p-12 text-center border border-border">
            <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
              <CreditCard className="w-10 h-10 text-muted-foreground" />
            </div>
            <h2 className="text-2xl font-display font-bold mb-2">No Packages Yet</h2>
            <p className="text-muted-foreground mb-6">
              You haven't purchased any packages yet
            </p>
            {PACKAGE_SALES_OPEN ? (
              buyModal(<Button>Get Your Package</Button>)
            ) : (
              <RegistrationClosedNotice compact />
            )}
          </div>
        </div>
      </div>
    );
  }

  // Ticket grid
  return (
    <div className="min-h-screen bg-gradient-to-br from-cream via-background to-cream-dark">
      <AuthHeader />
      <div className="container mx-auto px-4 py-6 sm:py-8 max-w-7xl">
        <div className="mb-6 sm:mb-8">
          <div className='flex justify-between items-center gap-3'>
            <div className="min-w-0">
              <h1 className="text-2xl sm:text-3xl font-display font-bold mb-1">My Packages</h1>
              <p className="text-sm text-muted-foreground">
                Select a package to view details
              </p>
            </div>

            <Button onClick={() => refetch()} variant="outline">
              <span className="hidden md:block mr-2">Refresh</span>
              <RefreshCcw
                className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
              />
            </Button>
          </div>
        </div>

        {/* Tickets Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {participants.map((participant: BaseParticipant) => {
            const isRedeemed = !!participant.wristbandCode;
            const isSuspended = participant.status === 'suspended';

            return (
              <div
                key={participant.id}
                role="button"
                tabIndex={0}
                onClick={() => navigate(`/participant/ticket/${participant.id}`)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') navigate(`/participant/ticket/${participant.id}`);
                }}
                className="relative rounded-2xl border border-white/15 bg-emerald-900 p-5 text-left shadow-xl hover:shadow-2xl hover:scale-[1.02] hover:border-white/30 transition-all group h-full flex flex-col overflow-hidden cursor-pointer"
              >
                {/* Top highlight line, like the event pass */}
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />

                {/* Pass header */}
                <div className="flex items-start justify-between gap-2 mb-4">
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-sky-300 mb-0.5">
                      🎟 Event Pass
                    </p>
                    <p className="font-display font-bold text-white leading-tight truncate">
                      {participant.name}
                    </p>
                  </div>
                  {isRedeemed ? (
                    <span className="shrink-0 text-xs px-2.5 py-1 bg-white/10 text-white rounded-full flex items-center gap-1.5 font-medium">
                      <CheckCircle className="w-3.5 h-3.5 text-yellow-300" />
                      Active
                    </span>
                  ) : (
                    <span className="shrink-0 text-xs px-2.5 py-1 bg-white/10 text-white rounded-full flex items-center gap-1.5 font-medium">
                      <Clock className="w-3.5 h-3.5 text-yellow-300" />
                      {participant.status === 'pending' ? 'Pending' : participant.status === 'active' ? 'Active' : 'Suspended'}
                    </span>
                  )}
                </div>

                {/* Redemption Status - flex-grow to push footer down */}
                <div className="flex-grow">
                  {isRedeemed ? (
                    // Redeemed - Show QR Code
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-white/50 mb-2">
                        Wristband Code
                      </p>
                      <div className="bg-white rounded-xl p-3 mb-3 flex justify-center">
                        <QRCode
                          value={participant.wristbandCode || ''}
                          size={140}
                          level="H"
                          fgColor="#064e3b"
                        />
                      </div>
                      <div className="text-center">
                        <p className="font-mono text-xl font-bold tracking-wider text-yellow-300 mb-1">
                          {participant.wristbandCode}
                        </p>
                        <p className="text-white/60 text-xs font-medium">
                          This is your race-day wristband
                        </p>
                      </div>
                    </div>
                  ) : (
                    // Not Redeemed - Redemption QR Code
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-white/50 mb-2">
                        Redemption Code
                      </p>
                      <div className="bg-white rounded-xl p-3 mb-3 flex justify-center">
                        <QRCode
                          value={participant.code}
                          size={140}
                          level="H"
                          fgColor="#064e3b"
                        />
                      </div>
                      <div className="text-center">
                        <p className="font-mono text-sm font-bold tracking-wider text-yellow-300 mb-1 break-all">
                          {participant.code}
                        </p>
                        <p className="text-white/60 text-xs font-medium">
                          Show this QR code at the redemption counter to get your wristband
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Payment failed — offer a retry before the footer */}
                {isSuspended && (
                  <div className="mt-4 p-3 rounded-xl bg-red-500/10 border border-red-400/30">
                    <p className="text-xs text-red-200 font-medium flex items-center gap-1.5 mb-2">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      Payment didn't go through
                    </p>
                    {PACKAGE_SALES_OPEN ? (
                      retryModal(
                        participant,
                        <button
                          onClick={(e) => e.stopPropagation()}
                          className="w-full flex items-center justify-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg bg-yellow-400 text-emerald-900 hover:bg-yellow-300 transition-colors"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          Retry Payment
                        </button>
                      )
                    ) : (
                      <p className="text-xs text-red-200/70">
                        Payment retries are closed — contact us for help.
                      </p>
                    )}
                  </div>
                )}

                {/* Footer - perforation + view details */}
                <div className="mt-4 pt-3 border-t border-dashed border-white/20">
                  <p className="text-sm text-yellow-300 font-semibold text-center flex items-center justify-center gap-2">
                    View Full Details
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </p>
                </div>
              </div>
            );
          })}

          {/* Add New Ticket Card */}
          {PACKAGE_SALES_OPEN ? (
            buyModal(
              <button className="bg-card border-2 border-dashed border-border rounded-2xl p-6 text-center hover:border-olive hover:bg-olive/5 transition-all group w-full h-full flex flex-col items-center justify-center min-h-[280px] sm:min-h-[400px]">
                <div className="w-16 h-16 bg-muted rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-olive/10 transition-colors">
                  <Plus className="w-8 h-8 text-muted-foreground group-hover:text-olive transition-colors" />
                </div>
                <h3 className="font-display font-bold text-xl mb-2 group-hover:text-olive transition-colors">
                  Buy New Package
                </h3>
                <p className="text-sm text-muted-foreground">Purchase another package</p>
              </button>
            )
          ) : (
            <div className="w-full h-full min-h-[280px] sm:min-h-[400px] flex items-center justify-center">
              <RegistrationClosedNotice />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Package Ticket Card ──────────────────────────────────────────────────────
// Renders a package as an event pass: details on the left, a perforated price
// stub on the right, with included merchandise and prize podium.

export function PackageTicket({
  pkg,
  selected,
  disabled,
  onSelect,
}: {
  pkg: BasePackage;
  selected: boolean;
  disabled?: boolean;
  onSelect: () => void;
}) {
  const { renderPrice } = useRenderPrice();
  const prizes = [...pkg.prizes].sort((a, b) => (a.position ?? 99) - (b.position ?? 99));

  const medal = (position?: number | null) =>
    position === 1 ? '🥇' : position === 2 ? '🥈' : position === 3 ? '🥉' : '🏅';

  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={disabled}
      className={`relative w-full text-left rounded-2xl overflow-hidden border transition-all ${
        selected
          ? 'border-yellow-400/70 ring-2 ring-yellow-400/40 shadow-lg'
          : 'border-white/15 hover:border-white/30 hover:shadow-md'
      }`}
    >
      <div className="flex items-stretch bg-emerald-900 relative">
        {/* Top highlight line, like the login card */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />

        {/* ── Ticket body ── */}
        <div className="flex-1 min-w-0 p-4 relative">
          <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-sky-300 mb-0.5">
            🎟 Event Pass
          </p>
          <p className="font-display font-bold text-base leading-tight text-white">{pkg.name}</p>
          {pkg.benefits && (
            <PackageBenefits benefits={pkg.benefits} className="text-xs text-white/75 mt-1.5" />
          )}

          {/* Includes */}
          {pkg.merchandise.length > 0 && (
            <div className="mt-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-white/50 mb-1">
                Includes
              </p>
              <div className="flex flex-wrap gap-1.5">
                {pkg.merchandise.map((item) => (
                  <span
                    key={item.id}
                    title={item.description ?? undefined}
                    className="px-2 py-0.5 text-[11px] font-medium rounded-full bg-white/8 border border-white/10 text-white/90"
                  >
                    {item.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Prizes */}
          {prizes.length > 0 && (
            <div className="mt-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-white/50 mb-1">
                Win Prizes
              </p>
              <div className="flex flex-wrap gap-x-3 gap-y-1">
                {prizes.map((prize) => (
                  <span key={prize.id} className="text-xs text-white/80 whitespace-nowrap">
                    {medal(prize.position)} {prize.name}
                    {typeof prize.amount === 'number' && prize.amount > 0 && (
                      <span className="font-bold text-yellow-300"> {renderPrice(prize.amount)}</span>
                    )}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Perforation ── */}
        <div className="relative w-0 border-l-2 border-dashed border-white/20 self-stretch">
          <span className="absolute -top-2 -left-2 w-4 h-4 rounded-full bg-card" />
          <span className="absolute -bottom-2 -left-2 w-4 h-4 rounded-full bg-card" />
        </div>

        {/* ── Price stub ── */}
        <div className={`w-24 sm:w-28 shrink-0 flex flex-col items-center justify-center gap-1 p-3 text-center ${
          selected
            ? 'bg-gradient-to-r from-yellow-400 to-amber-500 text-emerald-900'
            : 'bg-white/8 text-white'
        }`}>
          <p className={`text-[9px] font-bold uppercase tracking-widest ${selected ? 'text-emerald-900/60' : 'text-white/50'}`}>
            Admit One
          </p>
          <p className="font-display font-bold text-lg leading-none">{renderPrice(pkg.price)}</p>
          <span className={`mt-1 inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
            selected ? 'bg-emerald-900/15' : 'bg-yellow-400/15 text-yellow-300'
          }`}>
            {selected ? (<><Check className="w-3 h-3" /> Selected</>) : 'Select'}
          </span>
        </div>
      </div>
    </button>
  );
}

// ─── Buy Package Form ─────────────────────────────────────────────────────────
// Stage 1: pick a pass (scrollable ticket list)
// Stage 2: runner details (name defaults to the user's name, gender, vest size)
// Stage 3: Weekend Package add-ons (skipped when none are offered)
// Stage 4: payment phone + network (+ OTP if paying with a different number)

interface BuyPackageFormProps {
  packages: BasePackage[];
  userName: string;
  userPhone: string; // 233XXXXXXXXX
  onDone: () => void;
  onCancel: () => void;
  onPaymentInitiated: (transactionId: string) => void;
  onClaimed: (participantId: string) => void;
}

function BuyPackageForm({
  packages,
  userName,
  userPhone,
  onDone,
  onCancel,
  onPaymentInitiated,
  onClaimed,
}: BuyPackageFormProps) {
  const { renderPrice } = useRenderPrice();

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [packageId, setPackageId] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<ValidateCouponResponse | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [name, setName] = useState(userName);
  const [gender, setGender] = useState<Gender | ''>('');
  const [shirtSize, setShirtSize] = useState<ShirtSize | ''>('');
  const [weekend, setWeekend] = useState<WeekendSelection>(RACE_ONLY);

  const { data: addOnsData } = useAkMarathonQuery('listAddOns', { refetchOnWindowFocus: false });
  const addOns = addOnsData ?? [];
  // Only a real choice when there's something beyond "Race only".
  const offersWeekend = availableBundles(addOns).length > 1;
  const bookedAddOns = selectedAddOns(weekend, addOns);
  const addOnsCost = addOnTotal(bookedAddOns);

  const [momoNumber, setMomoNumber] = useState(toLocalPhone(userPhone));
  const [network, setNetwork] = useState<PaymentNetwork>('MTN');
  const [otpCode, setOtpCode] = useState('');
  const [otpSessionId, setOtpSessionId] = useState('');
  const [needsOtp, setNeedsOtp] = useState(false);

  const selectedPackage = packages.find((p) => p.id === packageId);
  const otpRequired = momoNumber.length >= 9 && formatPhone(momoNumber) !== userPhone;
  // A 100%-off coupon with no paid add-ons leaves nothing to charge — that's a
  // different endpoint (/participants/claim), with no payment/OTP step and no
  // polling after. Coupons cover the race only, so add-ons still get charged.
  const isFreeClaim = !!appliedCoupon && appliedCoupon.netAmount === 0 && addOnsCost === 0;
  const racePrice = appliedCoupon ? appliedCoupon.netAmount : selectedPackage?.price ?? 0;
  const totalDue = racePrice + addOnsCost;

  const selectCls = 'w-full px-3 py-2.5 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring text-sm';

  const sendOtp = useAkMarathonMutation("sendOTP", {
    onSuccess: (response) => {
      if (response?.sessionId) {
        setOtpSessionId(response.sessionId);
        toast.success('OTP sent to mobile money number');
      }
    },
    onError: (error: ApiDomainError) => {
      toast.error(error.getDisplayMessage() || 'Failed to send OTP');
    }
  });

  const validateCoupon = useAkMarathonMutation("validateCoupon", {
    onSuccess: (data) => {
      setAppliedCoupon(data);
      setCouponError(null);
      toast.success(`Coupon applied — ${data.percentOff}% off`);
    },
    onError: (error: ApiDomainError) => {
      const msg = error.getDisplayMessage() || 'Invalid coupon code';
      setAppliedCoupon(null);
      setCouponError(msg);
      toast.error(msg);
    }
  });

  const buyPackage = useAkMarathonMutation("buyPackage", {
    onSuccess: (response) => {
      toast.success('Payment initiated — approve the prompt on your phone');
      onDone();
      onPaymentInitiated(response.payment.transactionId);
    },
    onError: (error: ApiDomainError) => {
      if (error.errorCode === 'OTP_REQUIRED') {
        setNeedsOtp(true);
        sendOtp.mutate({ body: { identifier: formatPhone(momoNumber), provider: 'sms' } });
        toast.info('OTP verification required for this number');
      } else {
        toast.error(error.getDisplayMessage() || 'Failed to buy package');
      }
    }
  });

  const claimFreePackage = useAkMarathonMutation("claimFreePackage", {
    onSuccess: (response) => {
      toast.success('Package claimed — your pass is ready!');
      onDone();
      onClaimed(response.participant.id);
    },
    onError: (error: ApiDomainError) => {
      toast.error(error.getDisplayMessage() || 'Failed to claim package');
    }
  });

  const isProcessing = buyPackage.isPending || claimFreePackage.isPending;

  const handleSelectPackage = (id: string) => {
    setPackageId(id);
    setAppliedCoupon(null);
    setCouponCode('');
    setCouponError(null);
  };

  const handleApplyCoupon = () => {
    if (!selectedPackage || !couponCode.trim()) return;
    validateCoupon.mutate({ body: { code: couponCode.trim().toUpperCase(), packageId: selectedPackage.id } });
  };

  const handleContinuePass = () => {
    if (!selectedPackage) {
      toast.error('Please select a pass');
      return;
    }
    setStep(2);
  };

  const handleContinueRunner = () => {
    if (!name.trim()) {
      toast.error('Please enter the runner\'s name');
      return;
    }
    if (!gender) {
      toast.error('Please select a gender');
      return;
    }
    if (!shirtSize) {
      toast.error('Please select a vest size');
      return;
    }
    setStep(offersWeekend ? 3 : 4);
  };

  const handleContinueWeekend = () => {
    const error = selectionError(weekend, addOns);
    if (error) {
      toast.error(error);
      return;
    }
    setStep(4);
  };

  const handlePay = async () => {
    if (!selectedPackage) return;
    const phoneError = ghPhoneError(momoNumber);
    if (phoneError) {
      toast.error(phoneError);
      return;
    }
    const requiresOtp = otpRequired || needsOtp;
    if (requiresOtp && needsOtp && !otpCode.trim()) {
      toast.error('Please enter the OTP code');
      return;
    }

    await buyPackage.mutateAsync({
      body: {
        packageId: selectedPackage.id,
        participant: {
          name: name.trim(),
          shirtSize,
          gender: gender ? (gender.toLowerCase() as 'male' | 'female') : undefined,
        },
        payment: {
          momoNumber: formatPhone(momoNumber),
          network,
        },
        addOnIds: bookedAddOns.map((a) => a.id),
        ...(needsOtp && otpCode ? { otp: otpCode, otpSessionId } : {}),
        ...(appliedCoupon ? { couponCode: appliedCoupon.code } : {}),
      }
    }).catch(() => { /* handled in onError */ });
  };

  const handleClaim = async () => {
    if (!selectedPackage || !appliedCoupon) return;

    await claimFreePackage.mutateAsync({
      body: {
        packageId: selectedPackage.id,
        participant: {
          name: name.trim(),
          shirtSize,
          gender: gender ? (gender.toLowerCase() as 'male' | 'female') : undefined,
        },
        couponCode: appliedCoupon.code,
        idempotencyKey: crypto.randomUUID(),
      }
    }).catch(() => { /* handled in onError */ });
  };

  return (
    <div className="flex flex-col max-h-[75vh]">
      {/* Step indicator */}
      <div className="flex items-center justify-center gap-2 mb-4 shrink-0">
        {[
          { n: 1, label: 'Pass' },
          { n: 2, label: 'Runner' },
          ...(offersWeekend ? [{ n: 3, label: 'Weekend' }] : []),
          { n: 4, label: 'Payment' },
        ].map(({ n, label }, i) => (
          <div key={n} className="flex items-center gap-2">
            {i > 0 && <div className={`w-4 sm:w-8 h-px ${step > n - 1 ? 'bg-olive' : 'bg-border'}`} />}
            <div className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full whitespace-nowrap ${
              step === n ? 'bg-olive text-primary-foreground'
              : step > n  ? 'bg-olive/15 text-olive'
                          : 'bg-muted text-muted-foreground'
            }`}>
              {step > n ? <Check className="w-3.5 h-3.5" /> : <span>{i + 1}.</span>}
              <span>{label}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto pr-1 -mr-1">
        {step === 1 && (
          <div>
            {/* Package selection — scrollable ticket list */}
            <label className="block text-sm font-semibold mb-2">
              Choose your pass
            </label>
            <div className="space-y-3 pb-1">
              {packages.map((pkg) => (
                <PackageTicket
                  key={pkg.id}
                  pkg={pkg}
                  selected={packageId === pkg.id}
                  disabled={isProcessing}
                  onSelect={() => handleSelectPackage(pkg.id)}
                />
              ))}
              {packages.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No packages available at the moment
                </p>
              )}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            {/* Selected pass summary */}
            <div className="bg-emerald-900 border border-white/15 rounded-xl p-3.5 flex items-center justify-between gap-3 relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-widest text-sky-300">🎟 Event Pass</p>
                <p className="font-semibold text-sm text-white truncate">{selectedPackage?.name}</p>
              </div>
              <p className="font-bold text-yellow-300 whitespace-nowrap">{selectedPackage ? renderPrice(selectedPackage.price) : ''}</p>
            </div>

            <label className="block text-sm font-semibold">Runner details</label>

            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Name</label>
              <Input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Runner's full name"
                disabled={isProcessing}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Gender</label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value as Gender)}
                  disabled={isProcessing}
                  className="w-full px-3 py-2.5 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring text-sm"
                >
                  <option value="">Select gender</option>
                  {GENDERS.map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-medium text-muted-foreground">Vest Size</label>
                  <VestSizeGuideLink />
                </div>
                <select
                  value={shirtSize}
                  onChange={(e) => setShirtSize(e.target.value as ShirtSize)}
                  disabled={isProcessing}
                  className="w-full px-3 py-2.5 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring text-sm"
                >
                  <option value="">Select size</option>
                  {SHIRT_SIZES.map((size) => (
                    <option key={size} value={size}>{size.toUpperCase()}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <WeekendPackagePicker addOns={addOns} value={weekend} onChange={setWeekend} disabled={isProcessing} />
        )}

        {step === 4 && (
          <div className="space-y-4">
            {/* Order summary */}
            <div className="bg-emerald-900 border border-white/15 rounded-xl p-3.5 flex items-center justify-between gap-3 relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-widest text-sky-300">🎟 Event Pass</p>
                <p className="font-semibold text-sm text-white truncate">{selectedPackage?.name}</p>
                <p className="text-xs text-white/60 truncate">{name} · {gender} · {shirtSize.toUpperCase()}</p>
              </div>
              <p className="font-bold text-yellow-300 whitespace-nowrap">
                {appliedCoupon ? (
                  <>
                    <span className="line-through opacity-50 text-xs mr-1.5">{renderPrice(appliedCoupon.originalAmount)}</span>
                    {renderPrice(appliedCoupon.netAmount)}
                  </>
                ) : selectedPackage ? renderPrice(selectedPackage.price) : ''}
              </p>
            </div>

            {bookedAddOns.length > 0 && (
              <div className="rounded-xl border border-border divide-y divide-border text-sm">
                {bookedAddOns.map((addOn) => (
                  <div key={addOn.id} className="flex items-center justify-between gap-3 px-3.5 py-2.5">
                    <span className="truncate">{describeAddOn(addOn)}</span>
                    <span className="font-semibold whitespace-nowrap">{renderPrice(addOn.price)}</span>
                  </div>
                ))}
                <div className="flex items-center justify-between gap-3 px-3.5 py-2.5 font-bold">
                  <span>Total</span>
                  <span>{renderPrice(totalDue)}</span>
                </div>
              </div>
            )}

            {/* Coupon code */}
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Coupon Code</label>
              {appliedCoupon ? (
                <div className="flex items-center justify-between gap-3 p-2.5 rounded-lg border border-olive bg-olive/5">
                  <div className="flex items-center gap-2 text-sm">
                    <BadgePercent className="w-4 h-4 text-olive" />
                    <span className="font-mono font-semibold">{appliedCoupon.code}</span>
                    <span className="text-olive font-medium">{appliedCoupon.percentOff}% off</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setAppliedCoupon(null); setCouponCode(''); setCouponError(null); }}
                    disabled={isProcessing}
                    className="text-xs text-red-500 hover:text-red-700 font-medium disabled:opacity-50"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex gap-2">
                    <Input
                      value={couponCode}
                      onChange={(e) => { setCouponCode(e.target.value); setCouponError(null); }}
                      placeholder="Optional discount code"
                      disabled={isProcessing}
                      className={`flex-1 ${couponError ? 'border-red-400 focus-visible:ring-red-400' : ''}`}
                    />
                    <button
                      type="button"
                      onClick={handleApplyCoupon}
                      disabled={!couponCode.trim() || isProcessing || validateCoupon.isPending}
                      className="px-4 py-2 border border-olive text-olive rounded-lg text-sm font-semibold hover:bg-olive/5 transition-colors disabled:opacity-50 disabled:pointer-events-none whitespace-nowrap"
                    >
                      {validateCoupon.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Apply'}
                    </button>
                  </div>
                  {couponError && (
                    <p className="text-red-500 text-xs mt-1">{couponError}</p>
                  )}
                </>
              )}
            </div>

            {/* 100%-off coupon — nothing to charge, so no payment/OTP step at all */}
            {isFreeClaim ? (
              <div className="p-4 bg-olive/5 border border-olive/30 rounded-xl text-sm text-olive">
                This coupon covers the full price — no payment is needed. Your pass will be active immediately.
              </div>
            ) : (
              <>
                {/* MoMo number */}
                <div>
                  <PhoneField
                    label="Mobile Money Number"
                    type="tel"
                    value={momoNumber}
                    onChange={(value: string) => {
                      setMomoNumber(value);
                      setNeedsOtp(false);
                      setOtpCode('');
                    }}
                    placeholder="24XXXXXXX"
                    disabled={isProcessing}
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {otpRequired
                      ? 'This number differs from your account — OTP verification will be required'
                      : 'The payment prompt will be sent to this number'}
                  </p>
                </div>

                {/* Network */}
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">Network</label>
                  <select
                    value={network}
                    onChange={(e) => setNetwork(e.target.value as PaymentNetwork)}
                    disabled={isProcessing}
                    className="w-full px-3 py-2.5 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring text-sm"
                  >
                    {PAYMENT_NETWORKS.map((n) => (
                      <option key={n} value={n}>
                        {n === 'AIRTELTIGO' ? 'AirtelTigo (AT)' : n === 'VODAFONE' ? 'Telecel (Vodafone)' : 'MTN'}
                      </option>
                    ))}
                  </select>
                </div>

                {/* OTP — only after the API asks for it */}
                {needsOtp && (
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl space-y-3">
                    <p className="text-sm text-yellow-800">
                      Enter the OTP sent to <strong>+{formatPhone(momoNumber)}</strong>
                    </p>
                    <Input
                      type="text"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="000000"
                      maxLength={6}
                      disabled={isProcessing}
                      className="text-center text-2xl tracking-widest font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => sendOtp.mutate({ body: { identifier: formatPhone(momoNumber), provider: 'sms' } })}
                      disabled={sendOtp.isPending || isProcessing}
                      className="text-xs text-olive font-semibold hover:underline disabled:opacity-50"
                    >
                      {sendOtp.isPending ? 'Sending...' : 'Resend OTP'}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4 mt-4 border-t shrink-0">
        {step === 1 && (
          <>
            <Button onClick={onCancel} disabled={isProcessing} variant="outline">
              Cancel
            </Button>
            <Button
              onClick={handleContinuePass}
              disabled={isProcessing || !selectedPackage}
              className="flex-1"
            >
              Continue
            </Button>
          </>
        )}
        {step === 2 && (
          <>
            <Button onClick={() => setStep(1)} disabled={isProcessing} variant="outline">
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back
            </Button>
            <Button
              onClick={handleContinueRunner}
              disabled={isProcessing || !name.trim() || !gender || !shirtSize}
              className="flex-1"
            >
              Continue
            </Button>
          </>
        )}
        {step === 3 && (
          <>
            <Button onClick={() => setStep(2)} disabled={isProcessing} variant="outline">
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back
            </Button>
            <Button onClick={handleContinueWeekend} disabled={isProcessing} className="flex-1">
              Continue
            </Button>
          </>
        )}
        {step === 4 && (
          <>
            <Button onClick={() => setStep(offersWeekend ? 3 : 2)} disabled={isProcessing} variant="outline">
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back
            </Button>
            <Button
              onClick={isFreeClaim ? handleClaim : handlePay}
              disabled={isProcessing || (!isFreeClaim && !isValidGhPhone(momoNumber))}
              className="flex-1"
            >
              {isProcessing ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </span>
              ) : isFreeClaim ? (
                'Claim Package'
              ) : (
                `Pay ${renderPrice(totalDue)}`
              )}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Retry Payment Form ───────────────────────────────────────────────────────
// Reuses an existing participant (POST /participants/buy with participantId
// instead of packageId+participant) and pushes a fresh MoMo charge. Optionally
// lets the user switch to a different package, which re-prices the charge.

interface RetryPaymentFormProps {
  participant: BaseParticipant;
  packages: BasePackage[];
  userPhone: string; // 233XXXXXXXXX
  sessionToken: string | null;
  isTokenValidFor: (momoNumber: string) => boolean;
  storeSessionToken: (token: string, momoNumber: string) => void;
  clearSessionToken: () => void;
  onDone: () => void;
  onCancel: () => void;
  onPaymentInitiated: (transactionId: string) => void;
}

function RetryPaymentForm({
  participant,
  packages,
  userPhone,
  sessionToken,
  isTokenValidFor,
  storeSessionToken,
  clearSessionToken,
  onDone,
  onCancel,
  onPaymentInitiated,
}: RetryPaymentFormProps) {
  const { renderPrice } = useRenderPrice();

  const currentPackage = participant.package ?? packages.find((p) => p.id === participant.packageId);
  const otherPackages = packages.filter((p) => p.id !== participant.packageId);

  const [momoNumber, setMomoNumber] = useState(toLocalPhone(userPhone));
  const [network, setNetwork] = useState<PaymentNetwork>('MTN');
  const [switchPackageId, setSwitchPackageId] = useState(''); // '' = keep current package
  const [otpCode, setOtpCode] = useState('');
  const [otpSessionId, setOtpSessionId] = useState('');
  const [needsOtp, setNeedsOtp] = useState(false);

  // A fresh idempotency key per modal open (i.e. per Retry Payment click) —
  // stays the same across an in-flow OTP round-trip, since that's completing
  // the same logical attempt, not a new one.
  const idempotencyKeyRef = useRef(crypto.randomUUID());

  const switchedPackage = otherPackages.find((p) => p.id === switchPackageId);
  const chargedPackage = switchedPackage ?? currentPackage;

  // A retry keeps the Weekend Package add-ons already booked. The API re-prices
  // them at today's catalog price, so show that (falling back to the booked
  // price if the add-on is no longer listed).
  const { data: catalogData } = useAkMarathonQuery('listAddOns', {
    query: { activeOnly: false },
    refetchOnWindowFocus: false,
  });
  const keptAddOns = (participant.addOns ?? []).map((booked) => ({
    ...booked,
    price: catalogData?.find((a) => a.id === booked.addOnId)?.price ?? booked.price,
  }));
  const totalDue = (chargedPackage?.price ?? 0) + addOnTotal(keptAddOns);

  const sendOtp = useAkMarathonMutation("sendOTP", {
    onSuccess: (response) => {
      if (response?.sessionId) {
        setOtpSessionId(response.sessionId);
        toast.success('OTP sent to mobile money number');
      }
    },
    onError: (error: ApiDomainError) => {
      toast.error(error.getDisplayMessage() || 'Failed to send OTP');
    }
  });

  const retryPayment = useAkMarathonMutation("buyPackage", {
    onSuccess: (response) => {
      if (response.sessionToken) {
        storeSessionToken(response.sessionToken, formatPhone(momoNumber));
      }
      toast.success('Payment initiated — approve the prompt on your phone');
      onDone();
      onPaymentInitiated(response.payment.transactionId);
    },
    onError: (error: ApiDomainError) => {
      switch (error.errorCode) {
        case 'OTP_REQUIRED':
          setNeedsOtp(true);
          sendOtp.mutate({ body: { identifier: formatPhone(momoNumber), provider: 'sms' } });
          toast.info('OTP verification required for this number');
          break;
        case 'SESSION_EXPIRED':
          clearSessionToken();
          setNeedsOtp(true);
          sendOtp.mutate({ body: { identifier: formatPhone(momoNumber), provider: 'sms' } });
          toast.info('Verification expired — enter the new OTP sent to your phone');
          break;
        case 'PARTICIPANT_ALREADY_ACTIVE':
          toast.info('This pass is already paid for');
          onDone();
          break;
        case 'PARTICIPANT_NOT_FOUND':
        case 'FORBIDDEN':
          toast.error('This pass could not be found — refreshing your passes');
          onDone();
          break;
        default:
          toast.error(error.getDisplayMessage() || 'Failed to retry payment');
      }
    }
  });

  const isProcessing = retryPayment.isPending;

  const handleMomoNumberChange = (value: string) => {
    setMomoNumber(value);
    // The stored session token is bound to the number it was issued for —
    // switching numbers means it's dead, so drop it and reset the OTP state.
    // The next Pay attempt will surface OTP_REQUIRED and re-trigger the OTP step.
    clearSessionToken();
    setNeedsOtp(false);
    setOtpCode('');
  };

  const handleRetry = async () => {
    const phoneError = ghPhoneError(momoNumber);
    if (phoneError) {
      toast.error(phoneError);
      return;
    }
    if (needsOtp && !otpCode.trim()) {
      toast.error('Please enter the OTP code');
      return;
    }

    const formattedPhone = formatPhone(momoNumber);
    const tokenValid = isTokenValidFor(formattedPhone);

    await retryPayment.mutateAsync({
      body: {
        participantId: participant.id,
        payment: {
          momoNumber: formattedPhone,
          network,
        },
        ...(switchedPackage ? { packageId: switchedPackage.id } : {}),
        ...(tokenValid && sessionToken ? { sessionToken } : {}),
        ...(needsOtp && otpCode ? { otp: otpCode, otpSessionId } : {}),
        idempotencyKey: idempotencyKeyRef.current,
      }
    }).catch(() => { /* handled in onError */ });
  };

  return (
    <div className="flex flex-col max-h-[75vh]">
      <div className="flex-1 overflow-y-auto pr-1 -mr-1 space-y-4">
        {/* Pass summary */}
        <div className="bg-emerald-900 border border-white/15 rounded-xl p-3.5 flex items-center justify-between gap-3 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-widest text-sky-300">🎟 Event Pass</p>
            <p className="font-semibold text-sm text-white truncate">{participant.name}</p>
            <p className="text-xs text-white/60 truncate">{chargedPackage?.name}</p>
          </div>
          <p className="font-bold text-yellow-300 whitespace-nowrap">
            {chargedPackage ? renderPrice(chargedPackage.price) : ''}
          </p>
        </div>

        {keptAddOns.length > 0 && (
          <div className="rounded-xl border border-border divide-y divide-border text-sm">
            {keptAddOns.map((addOn) => (
              <div key={addOn.addOnId} className="flex items-center justify-between gap-3 px-3.5 py-2.5">
                <span className="truncate">{describeAddOn(addOn)}</span>
                <span className="font-semibold whitespace-nowrap">{renderPrice(addOn.price)}</span>
              </div>
            ))}
          </div>
        )}

        {/* Optional package switch */}
        {otherPackages.length > 0 && (
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Package</label>
            <select
              value={switchPackageId}
              onChange={(e) => setSwitchPackageId(e.target.value)}
              disabled={isProcessing}
              className="w-full px-3 py-2.5 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring text-sm"
            >
              <option value="">Keep current — {currentPackage?.name ?? 'this package'}</option>
              {otherPackages.map((pkg) => (
                <option key={pkg.id} value={pkg.id}>
                  Switch to {pkg.name} — {renderPrice(pkg.price)}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* MoMo number */}
        <div>
          <PhoneField
            label="Mobile Money Number"
            type="tel"
            value={momoNumber}
            onChange={handleMomoNumberChange}
            placeholder="24XXXXXXX"
            disabled={isProcessing}
            className="w-full"
          />
        </div>

        {/* Network */}
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1.5">Network</label>
          <select
            value={network}
            onChange={(e) => setNetwork(e.target.value as PaymentNetwork)}
            disabled={isProcessing}
            className="w-full px-3 py-2.5 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring text-sm"
          >
            {PAYMENT_NETWORKS.map((n) => (
              <option key={n} value={n}>
                {n === 'AIRTELTIGO' ? 'AirtelTigo (AT)' : n === 'VODAFONE' ? 'Telecel (Vodafone)' : 'MTN'}
              </option>
            ))}
          </select>
        </div>

        {/* OTP — only after the API asks for it */}
        {needsOtp && (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl space-y-3">
            <p className="text-sm text-yellow-800">
              Enter the OTP sent to <strong>+{formatPhone(momoNumber)}</strong>
            </p>
            <Input
              type="text"
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="000000"
              maxLength={6}
              disabled={isProcessing}
              className="text-center text-2xl tracking-widest font-mono"
            />
            <button
              type="button"
              onClick={() => sendOtp.mutate({ body: { identifier: formatPhone(momoNumber), provider: 'sms' } })}
              disabled={sendOtp.isPending || isProcessing}
              className="text-xs text-olive font-semibold hover:underline disabled:opacity-50"
            >
              {sendOtp.isPending ? 'Sending...' : 'Resend OTP'}
            </button>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4 mt-4 border-t shrink-0">
        <Button onClick={onCancel} disabled={isProcessing} variant="outline">
          Cancel
        </Button>
        <Button
          onClick={handleRetry}
          disabled={isProcessing || !isValidGhPhone(momoNumber)}
          className="flex-1"
        >
          {isProcessing ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processing...
            </span>
          ) : (
            `Pay ${renderPrice(totalDue)}`
          )}
        </Button>
      </div>
    </div>
  );
}
