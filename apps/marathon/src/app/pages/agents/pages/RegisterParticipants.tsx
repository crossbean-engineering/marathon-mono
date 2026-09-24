import { useState } from 'react';
import { useAkMarathonMutation, useAkMarathonQuery, useRenderPrice } from '@ak-marathon/sdk';
import type { BaseParticipant, PaymentNetwork, ValidateCouponResponse } from '@ak-marathon/sdk';
import { ApiDomainError } from '@rabstack/rab-react-sdk';
import { toast } from 'sonner';
import {
  User, CreditCard, Tag, ArrowLeft, CheckCircle,
  Loader2, XCircle, AlertCircle, BadgePercent,
} from 'lucide-react';
import {
  WristbandScanner,
  ScannerFeedbackOverlay,
  useWristbandScanner,
  SCANNER_STYLES,
} from '../../../components/WristbandScanner';
import { RegistrationClosedNotice } from '../../../components/RegistrationClosedNotice';
import { PACKAGE_SALES_OPEN } from '../../../lib/registration-status';
import { GENDERS, SHIRT_SIZES } from '../../../types/packages';
import type { Gender, ShirtSize } from '../../../types/packages';
import { normalizeGhPhone, ghPhoneError, toGhIntlPhone, normalizePaymentStatus } from '../../../utils';

type Step = 'details' | 'payment' | 'wristband' | 'done';

const PAYMENT_NETWORKS: PaymentNetwork[] = ['MTN', 'VODAFONE', 'AIRTELTIGO'];

interface ParticipantForm {
  name: string;
  shirtSize: ShirtSize | '';
  gender: Gender | '';
}

export default function RegisterParticipants() {
  const { renderPrice } = useRenderPrice();

  const [step, setStep] = useState<Step>('details');
  const [form, setForm] = useState<ParticipantForm>({ name: '', shirtSize: '', gender: '' });
  const [packageId, setPackageId] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<ValidateCouponResponse | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [momoPhone, setMomoPhone] = useState('');
  const [network, setNetwork] = useState<PaymentNetwork>('MTN');
  const [otpCode, setOtpCode] = useState('');
  const [otpSessionId, setOtpSessionId] = useState('');
  const [needsOtp, setNeedsOtp] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  const [participant, setParticipant] = useState<BaseParticipant | null>(null);
  const [transactionId, setTransactionId] = useState('');
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  const [wristbandCode, setWristbandCode] = useState('');

  // Packages
  const { data: packagesData } = useAkMarathonQuery('listPackages', {
    refetchOnWindowFocus: false,
  });
  const packages = packagesData ?? [];
  const selectedPackage = packages.find((p) => p.id === packageId);
  // A 100%-off coupon leaves nothing to charge — /participants/claim instead
  // of /participants/buy, no payment/OTP fields, and no verify step after.
  const isFreeClaim = !!appliedCoupon && appliedCoupon.netAmount === 0;

  // Wristband scanner for step 3
  const scanner = useWristbandScanner({
    onScan: (code) => setWristbandCode(code),
  });

  const formatPhone = (phoneLocal: string): string => toGhIntlPhone(phoneLocal);

  // ── Mutations ────────────────────────────────────────────────────────────

  const sendOtp = useAkMarathonMutation('sendOTP', {
    onSuccess: (response) => {
      if (response?.sessionId) {
        setOtpSessionId(response.sessionId);
        toast.success('OTP sent to mobile money number');
      }
    },
    onError: (error: ApiDomainError) => {
      toast.error(error.getDisplayMessage() || 'Failed to send OTP');
    },
  });

  const validateCoupon = useAkMarathonMutation('validateCoupon', {
    onSuccess: (data) => {
      setAppliedCoupon(data);
      setCouponError(null);
      toast.success(`Coupon applied — ${data.percentOff}% off`);
    },
    onError: (error: ApiDomainError) => {
      const msg = error.getAllMessages?.()[0] || 'Invalid coupon code';
      setAppliedCoupon(null);
      setCouponError(msg);
      toast.error(msg);
    },
  });

  const buyPackage = useAkMarathonMutation('buyPackage', {
    onSuccess: (data) => {
      setPaymentError(null);
      setParticipant(data.participant);
      setTransactionId(data.payment.transactionId);
      toast.success('Payment initiated — ask the participant to approve the prompt');
      setStep('payment');
    },
    onError: (error: ApiDomainError) => {
      if (error.errorCode === 'OTP_REQUIRED') {
        setNeedsOtp(true);
        sendOtp.mutate({ body: { identifier: formatPhone(momoPhone), provider: 'sms' } });
        toast.info('OTP verification required for this mobile money number');
        return;
      }
      const msg = error.getAllMessages?.()[0] || 'Registration failed';
      setPaymentError(msg);
      toast.error(msg);
    },
  });

  const claimFreePackage = useAkMarathonMutation('claimFreePackage', {
    onSuccess: (data) => {
      setPaymentError(null);
      setParticipant(data.participant);
      setPaymentConfirmed(true);
      toast.success('Package claimed — no payment needed');
      setStep('wristband');
    },
    onError: (error: ApiDomainError) => {
      const msg = error.getAllMessages?.()[0] || 'Registration failed';
      setPaymentError(msg);
      toast.error(msg);
    },
  });

  const verifyPayment = useAkMarathonMutation('verifyPayment', {
    onSuccess: (data) => {
      const status = normalizePaymentStatus(data?.status);
      if (status === 'success') {
        setPaymentConfirmed(true);
        toast.success('Payment confirmed');
        setStep('wristband');
      } else if (status === 'failed') {
        setPaymentError('Payment failed. Please try again.');
        toast.error('Payment failed');
      } else {
        toast.info('Payment still pending — try again shortly');
      }
    },
    onError: (error: ApiDomainError) => {
      toast.error(error.getDisplayMessage() || 'Failed to verify payment');
    },
  });

  const redeemWristband = useAkMarathonMutation('redeemWristband', {
    onSuccess: () => {
      toast.success('Wristband issued!');
      setStep('done');
    },
    onError: (error: ApiDomainError) => {
      const msg = error.getAllMessages?.()[0] || 'Failed to issue wristband';
      scanner.showFeedback('error', msg);
      toast.error(msg);
    },
  });

  // ── Handlers ─────────────────────────────────────────────────────────────

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

  const handleBuyPackage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPackage) {
      toast.error('Please select a package');
      return;
    }

    if (isFreeClaim && appliedCoupon) {
      claimFreePackage.mutate({
        body: {
          packageId: selectedPackage.id,
          participant: {
            name: form.name.trim(),
            ...(form.shirtSize ? { shirtSize: form.shirtSize } : {}),
            ...(form.gender ? { gender: form.gender.toLowerCase() as 'male' | 'female' } : {}),
          },
          couponCode: appliedCoupon.code,
          idempotencyKey: crypto.randomUUID(),
        },
      });
      return;
    }

    const phoneError = ghPhoneError(momoPhone);
    if (phoneError) {
      toast.error(phoneError);
      return;
    }
    if (needsOtp && !otpCode.trim()) {
      toast.error('Please enter the OTP code');
      return;
    }
    buyPackage.mutate({
      body: {
        packageId: selectedPackage.id,
        participant: {
          name: form.name.trim(),
          ...(form.shirtSize ? { shirtSize: form.shirtSize } : {}),
          ...(form.gender ? { gender: form.gender.toLowerCase() as 'male' | 'female' } : {}),
        },
        payment: {
          momoNumber: formatPhone(momoPhone),
          network,
        },
        ...(needsOtp && otpCode ? { otp: otpCode, otpSessionId } : {}),
        ...(appliedCoupon ? { couponCode: appliedCoupon.code } : {}),
      },
    });
  };

  const handleVerifyPayment = () => {
    if (!transactionId) return;
    verifyPayment.mutate({ body: { transactionId } });
  };

  const handleIssueWristband = () => {
    if (!participant || !wristbandCode) return;
    redeemWristband.mutate({
      body: {
        wristbandCode,
        participantCode: participant.code,
      },
    });
  };

  const handleReset = () => {
    setStep('details');
    setForm({ name: '', shirtSize: '', gender: '' });
    setPackageId('');
    setCouponCode('');
    setAppliedCoupon(null);
    setCouponError(null);
    setMomoPhone('');
    setNetwork('MTN');
    setOtpCode('');
    setOtpSessionId('');
    setNeedsOtp(false);
    setPaymentError(null);
    setParticipant(null);
    setTransactionId('');
    setPaymentConfirmed(false);
    setWristbandCode('');
    scanner.resetScanner();
  };

  if (!PACKAGE_SALES_OPEN) {
    return (
      <div className="max-w-xl mx-auto pt-12">
        <RegistrationClosedNotice />
      </div>
    );
  }

  // ── Step indicator ────────────────────────────────────────────────────────

  const steps: { key: Step; label: string; icon: React.ElementType }[] = [
    { key: 'details', label: 'Details', icon: User },
    { key: 'payment', label: 'Payment', icon: CreditCard },
    { key: 'wristband', label: 'Wristband', icon: Tag },
  ];
  const stepIndex = steps.findIndex(s => s.key === step);

  const selectCls = 'w-full px-4 py-3 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-olive text-sm';

  // ── Done ─────────────────────────────────────────────────────────────────

  if (step === 'done') {
    return (
      <div className="max-w-xl mx-auto pt-12 space-y-6 text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle className="w-12 h-12 text-green-600" />
        </div>
        <div className="space-y-1">
          <h1 className="text-2xl font-bold">Registration Complete!</h1>
          <p className="text-muted-foreground text-sm">
            Wristband{' '}
            <code className="bg-muted px-2 py-0.5 rounded font-mono text-xs">{wristbandCode}</code>{' '}
            issued to <strong>{participant?.name}</strong>.
          </p>
        </div>
        <button
          onClick={handleReset}
          className="px-8 py-3 bg-olive text-white rounded-lg font-semibold hover:bg-olive/90 transition-colors"
        >
          Register Another
        </button>
      </div>
    );
  }

  // ── Main ──────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-xl mx-auto pb-8 space-y-6">

      {/* Header */}
      <div className="pt-8 space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Register Participant</h1>
        <p className="text-muted-foreground text-sm">
          Buy package → confirm payment → issue wristband
        </p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center">
        {steps.map((s, i) => {
          const Icon = s.icon;
          const done = i < stepIndex;
          const active = s.key === step;
          return (
            <div key={s.key} className="flex items-center flex-1">
              <div className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full whitespace-nowrap transition-all ${
                active ? 'bg-olive text-white'
                : done  ? 'bg-olive/15 text-olive'
                        : 'bg-muted text-muted-foreground'
              }`}>
                <Icon className="w-3.5 h-3.5" />
                {s.label}
              </div>
              {i < steps.length - 1 && (
                <div className={`flex-1 h-px mx-2 ${done ? 'bg-olive' : 'bg-border'}`} />
              )}
            </div>
          );
        })}
      </div>

      {/* ── Step 1: Participant Details ─────────────────────────────────── */}
      {step === 'details' && (
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
          <h2 className="font-semibold mb-5">Participant Details</h2>
          <form onSubmit={handleBuyPackage} className="space-y-4">

            {/* Package */}
            <div>
              <label className="block text-sm font-medium mb-1.5">
                Package <span className="text-red-500">*</span>
              </label>
              <div className="space-y-2">
                {packages.map((pkg) => (
                  <button
                    key={pkg.id}
                    type="button"
                    onClick={() => handleSelectPackage(pkg.id)}
                    className={`w-full text-left p-3 rounded-lg border transition-all ${
                      packageId === pkg.id
                        ? 'border-olive bg-olive/5 ring-2 ring-olive/30'
                        : 'border-border hover:border-olive/50'
                    }`}
                  >
                    <div className="flex justify-between items-center gap-3">
                      <div>
                        <p className="font-medium text-sm">{pkg.name}</p>
                        {pkg.benefits && (
                          <p className="text-xs text-muted-foreground">{pkg.benefits}</p>
                        )}
                      </div>
                      <p className="font-bold whitespace-nowrap">{renderPrice(pkg.price)}</p>
                    </div>
                  </button>
                ))}
                {packages.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No packages available
                  </p>
                )}
              </div>
            </div>

            {/* Name */}
            <div>
              <label className="block text-sm font-medium mb-1.5">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                required
                placeholder="John Doe"
                className="w-full px-4 py-3 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-olive text-sm"
              />
            </div>

            {/* Shirt size / gender */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1.5">Shirt Size</label>
                <select
                  value={form.shirtSize}
                  onChange={e => setForm({ ...form, shirtSize: e.target.value as ShirtSize })}
                  className={selectCls}
                >
                  <option value="">Select size</option>
                  {SHIRT_SIZES.map((size) => (
                    <option key={size} value={size}>{size.toUpperCase()}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Gender</label>
                <select
                  value={form.gender}
                  onChange={e => setForm({ ...form, gender: e.target.value as Gender })}
                  className={selectCls}
                >
                  <option value="">Select gender</option>
                  {GENDERS.map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>
            </div>

            {!isFreeClaim && (
              <>
                {/* MoMo number */}
                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    MoMo Number <span className="text-red-500">*</span>
                  </label>
                  <div className="flex">
                    <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-input bg-muted text-sm text-muted-foreground">
                      +233
                    </span>
                    <input
                      type="tel"
                      inputMode="numeric"
                      value={momoPhone}
                      onChange={e => setMomoPhone(normalizeGhPhone(e.target.value))}
                      required
                      maxLength={10}
                      placeholder="24XXXXXXX"
                      className="flex-1 px-4 py-3 bg-background border border-input rounded-r-lg focus:outline-none focus:ring-2 focus:ring-olive text-sm"
                    />
                  </div>
                  {momoPhone && ghPhoneError(momoPhone) && (
                    <p className="text-red-500 text-xs mt-1">{ghPhoneError(momoPhone)}</p>
                  )}
                </div>

                {/* Network */}
                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    Network <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={network}
                    onChange={e => setNetwork(e.target.value as PaymentNetwork)}
                    className={selectCls}
                  >
                    {PAYMENT_NETWORKS.map((n) => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                </div>
              </>
            )}

            {/* Coupon code */}
            <div>
              <label className="block text-sm font-medium mb-1.5">Coupon Code</label>
              {appliedCoupon ? (
                <div className="flex items-center justify-between gap-3 p-3 rounded-lg border border-olive bg-olive/5">
                  <div className="flex items-center gap-2 text-sm">
                    <BadgePercent className="w-4 h-4 text-olive" />
                    <span className="font-mono font-semibold">{appliedCoupon.code}</span>
                    <span className="text-olive font-medium">{appliedCoupon.percentOff}% off</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setAppliedCoupon(null); setCouponCode(''); }}
                    className="text-xs text-red-500 hover:text-red-700 font-medium"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex gap-2">
                    <input
                      value={couponCode}
                      onChange={e => { setCouponCode(e.target.value); setCouponError(null); }}
                      placeholder="Optional discount code"
                      className={`flex-1 px-4 py-3 bg-background border rounded-lg focus:outline-none focus:ring-2 text-sm ${
                        couponError ? 'border-red-400 focus:ring-red-400' : 'border-input focus:ring-olive'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={handleApplyCoupon}
                      disabled={!couponCode.trim() || !packageId || validateCoupon.isPending}
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

            {/* OTP (when required) */}
            {needsOtp && (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg space-y-3">
                <p className="text-sm text-yellow-800">
                  Enter the OTP sent to <strong>+{formatPhone(momoPhone)}</strong>
                </p>
                <input
                  type="text"
                  value={otpCode}
                  onChange={e => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  maxLength={6}
                  className="w-full px-4 py-3 bg-background border border-input rounded-lg text-center text-xl tracking-widest font-mono focus:outline-none focus:ring-2 focus:ring-olive"
                />
                <button
                  type="button"
                  onClick={() => sendOtp.mutate({ body: { identifier: formatPhone(momoPhone), provider: 'sms' } })}
                  disabled={sendOtp.isPending}
                  className="text-xs text-olive font-semibold hover:underline disabled:opacity-50"
                >
                  {sendOtp.isPending ? 'Sending...' : 'Resend OTP'}
                </button>
              </div>
            )}

            {paymentError && (
              <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
                <XCircle className="w-4 h-4 shrink-0 mt-0.5" />
                {paymentError}
              </div>
            )}

            <button
              type="submit"
              disabled={buyPackage.isPending || claimFreePackage.isPending || !packageId}
              className="w-full py-3 bg-olive text-white rounded-lg font-semibold hover:bg-olive/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {buyPackage.isPending || claimFreePackage.isPending
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</>
                : isFreeClaim
                  ? 'Claim Package — Free'
                  : selectedPackage
                    ? appliedCoupon
                      ? <>Buy Package — <span className="line-through opacity-60 mr-1">{renderPrice(appliedCoupon.originalAmount)}</span>{renderPrice(appliedCoupon.netAmount)}</>
                      : `Buy Package — ${renderPrice(selectedPackage.price)}`
                    : 'Buy Package'}
            </button>
          </form>
        </div>
      )}

      {/* ── Step 2: Confirm Payment ─────────────────────────────────────── */}
      {step === 'payment' && participant && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setStep('details')}
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <button
              onClick={handleReset}
              className="text-sm text-red-500 hover:text-red-700 transition-colors"
            >
              Cancel & Register New
            </button>
          </div>

          {/* Participant summary */}
          <div className="bg-olive text-white rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-white/60 mb-0.5">Participant Registered</p>
              <p className="font-semibold">{participant.name}</p>
              <p className="text-xs font-mono text-white/60 mt-0.5">{participant.code}</p>
            </div>
            <span className="text-xs bg-white/20 rounded-full px-3 py-1 capitalize">
              {participant.status}
            </span>
          </div>

          <div className="bg-card border border-border rounded-xl p-6 shadow-sm text-center space-y-4">
            <h2 className="font-semibold">Confirm Payment</h2>
            <p className="text-sm text-muted-foreground">
              A mobile money prompt has been sent to <strong>+{formatPhone(momoPhone)}</strong>.
              Once the participant approves it, verify the payment below.
            </p>
            <p className="text-xs font-mono text-muted-foreground">Ref: {transactionId}</p>

            {paymentError && (
              <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700 text-left">
                <XCircle className="w-4 h-4 shrink-0 mt-0.5" />
                {paymentError}
              </div>
            )}

            <button
              onClick={handleVerifyPayment}
              disabled={verifyPayment.isPending}
              className="w-full py-3 bg-olive text-white rounded-lg font-semibold hover:bg-olive/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {verifyPayment.isPending
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Verifying...</>
                : 'Verify Payment'}
            </button>
          </div>
        </div>
      )}

      {/* ── Step 3: Issue Wristband ─────────────────────────────────────── */}
      {step === 'wristband' && participant && (
        <div className="space-y-4">
          {/* Payment status banner */}
          <div className="flex items-center justify-between gap-3">
            {paymentConfirmed ? (
              <div className="flex items-center gap-2 flex-1 bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-sm text-green-700">
                <CheckCircle className="w-4 h-4 shrink-0" />
                Payment confirmed for <strong>{participant.name}</strong>
              </div>
            ) : (
              <div className="flex items-center gap-2 flex-1 bg-muted border border-border rounded-lg px-4 py-3 text-sm text-muted-foreground">
                <AlertCircle className="w-4 h-4 shrink-0" />
                Issue wristband for <strong className="text-foreground">{participant.name}</strong>
              </div>
            )}
            <button
              onClick={handleReset}
              className="shrink-0 text-sm text-red-500 hover:text-red-700 transition-colors"
            >
              Cancel
            </button>
          </div>

          {/* Scanner */}
          <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 pt-5 pb-3">
              <h2 className="font-semibold">Scan Wristband</h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                Scan the wristband to link it to this participant
              </p>
            </div>
            <WristbandScanner
              scanner={scanner}
              label="Scan wristband to issue"
            />
          </div>

          {/* Confirm once code is captured */}
          {wristbandCode && (
            <div className="bg-card rounded-xl p-4 border border-border">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">Wristband</p>
                  <code className="text-sm font-mono font-medium">{wristbandCode}</code>
                </div>
              </div>

              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => { setWristbandCode(''); scanner.resetScanner(); }}
                  className="flex-1 py-2 border border-border rounded-lg text-sm hover:bg-muted transition-colors"
                >
                  Clear
                </button>
                <button
                  onClick={handleIssueWristband}
                  disabled={redeemWristband.isPending}
                  className="flex-1 py-2 bg-olive text-white rounded-lg text-sm font-semibold hover:bg-olive/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {redeemWristband.isPending
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Issuing...</>
                    : 'Issue Wristband'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <ScannerFeedbackOverlay feedback={scanner.feedback} />
      <style>{SCANNER_STYLES}</style>
    </div>
  );
}
