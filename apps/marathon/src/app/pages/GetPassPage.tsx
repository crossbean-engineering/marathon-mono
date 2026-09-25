import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAkMarathonMutation, useAkMarathonQuery, useRenderPrice } from '@ak-marathon/sdk';
import type { PaymentNetwork, ValidateCouponResponse, AuthResponse } from '@ak-marathon/sdk';
import { ApiDomainError } from '@rabstack/rab-react-sdk';
import { toast } from 'sonner';
import { ArrowLeft, Check, Loader2, Sparkles, AlertCircle } from 'lucide-react';
import { AuthHeader } from '../components/AuthHeader';
import { VestSizeGuideLink } from '../components/VestSizeGuide';
import { WeekendPackagePicker } from '../components/WeekendPackagePicker';
import { addOnTotal, describeAddOn, RACE_ONLY, selectedAddOns, selectionError } from '../lib/weekendPackage';
import type { WeekendSelection } from '../lib/weekendPackage';
import { RegistrationClosedNotice } from '../components/RegistrationClosedNotice';
import { PACKAGE_SALES_OPEN } from '../lib/registration-status';
import { Button, Input } from '../components/ui';
import { PhoneField } from '../components/ui/phoneField';
import { PackageTicket } from './participants/ParticipantDashboard';
import { useAuth } from '../contexts/AuthContext';
import { GENDERS, SHIRT_SIZES } from '../types/packages';
import type { Gender, ShirtSize } from '../types/packages';
import { ghPhoneError, isValidGhPhone, toGhIntlPhone } from '../utils';

const PAYMENT_NETWORKS: PaymentNetwork[] = ['MTN', 'VODAFONE', 'AIRTELTIGO'];

type Step = 'package' | 'details' | 'verify' | 'payment';

const formatPhone = (phoneLocal: string): string => toGhIntlPhone(phoneLocal);

export default function GetPassPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const couponCode = searchParams.get('coupon')?.trim().toUpperCase() ?? '';
  const { login: authLogin } = useAuth();
  const { renderPrice } = useRenderPrice();

  const [step, setStep] = useState<Step>('package');
  const [packageId, setPackageId] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [gender, setGender] = useState<Gender | ''>('');
  const [shirtSize, setShirtSize] = useState<ShirtSize | ''>('');
  const [phone, setPhone] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpSessionId, setOtpSessionId] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const [appliedCoupon, setAppliedCoupon] = useState<ValidateCouponResponse | null>(null);
  const [couponFailedMessage, setCouponFailedMessage] = useState<string | null>(null);
  const [network, setNetwork] = useState<PaymentNetwork>('MTN');
  const [needsPaymentOtp, setNeedsPaymentOtp] = useState(false);
  const [paymentOtpCode, setPaymentOtpCode] = useState('');
  const [paymentOtpSessionId, setPaymentOtpSessionId] = useState('');

  const { data: packagesData, isLoading: packagesLoading } = useAkMarathonQuery('listPackages', {
    refetchOnWindowFocus: false,
  });
  const packages = packagesData ?? [];
  const selectedPackage = packages.find((p) => p.id === packageId);

  const [weekend, setWeekend] = useState<WeekendSelection>(RACE_ONLY);
  const { data: addOnsData } = useAkMarathonQuery('listAddOns', { refetchOnWindowFocus: false });
  const addOns = addOnsData ?? [];
  const bookedAddOns = selectedAddOns(weekend, addOns);
  const addOnsCost = addOnTotal(bookedAddOns);
  // Coupons discount the race only; add-ons are always charged.
  const racePrice = appliedCoupon ? appliedCoupon.netAmount : selectedPackage?.price ?? 0;
  const totalDue = racePrice + addOnsCost;

  const sendOtp = useAkMarathonMutation('sendOTP', {
    onError: (error: ApiDomainError) => {
      toast.error(error.getDisplayMessage() || 'Failed to send OTP');
    },
  });

  // No onError toasts on login/signUp — the calling code below decides how
  // to react to each error so the login-or-signup fallback stays invisible.
  const login = useAkMarathonMutation('login');
  const signUp = useAkMarathonMutation('signUp');

  const validateCoupon = useAkMarathonMutation('validateCoupon');

  const claimFreePackage = useAkMarathonMutation('claimFreePackage', {
    onSuccess: (response) => {
      toast.success('Your pass is ready — no payment needed!');
      navigate(`/participant/ticket/${response.participant.id}`);
    },
    onError: (error: ApiDomainError) => {
      toast.error(error.getDisplayMessage() || 'Failed to claim your pass');
    },
  });

  const buyPackage = useAkMarathonMutation('buyPackage', {
    onSuccess: (response) => {
      toast.success('Payment initiated — approve the prompt on your phone');
      navigate(`/participant/topup-callback?order_id=${response.payment.transactionId}&payment_mode=momo`);
    },
    onError: (error: ApiDomainError) => {
      if (error.errorCode === 'OTP_REQUIRED') {
        setNeedsPaymentOtp(true);
        sendOtp.mutate({ body: { identifier: formatPhone(phone), provider: 'sms' } }, {
          onSuccess: (res) => {
            if (res?.sessionId) setPaymentOtpSessionId(res.sessionId);
          },
        });
        toast.info('One more code — this time to confirm the payment');
      } else {
        toast.error(error.getDisplayMessage() || 'Payment failed');
      }
    },
  });

  const isBusy = isAuthenticating || validateCoupon.isPending || claimFreePackage.isPending || buyPackage.isPending;

  // ── Step 1: pick a package ────────────────────────────────────────────
  const handleContinuePackage = () => {
    if (!selectedPackage) {
      toast.error('Please select a pass');
      return;
    }
    setStep('details');
  };

  // ── Step 2: runner + contact details, then send one OTP ───────────────
  const handleContinueDetails = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      toast.error('Please enter your first and last name');
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
    const weekendError = selectionError(weekend, addOns);
    if (weekendError) {
      toast.error(weekendError);
      return;
    }
    const phoneError = ghPhoneError(phone);
    if (phoneError) {
      toast.error(phoneError);
      return;
    }
    await sendOtp.mutateAsync({
      body: { identifier: formatPhone(phone), provider: 'sms' },
    }).then((res) => {
      if (res?.sessionId) {
        setOtpSessionId(res.sessionId);
        setStep('verify');
        toast.success('Code sent to your phone');
      }
    }).catch(() => { /* toasted in sendOtp.onError */ });
  };

  // ── Step 3: verify OTP — silently log in, or create the account ───────
  const handleVerifyAndContinue = async () => {
    if (!otpCode.trim()) {
      toast.error('Please enter the code we sent you');
      return;
    }
    if (!selectedPackage) return;

    setIsAuthenticating(true);
    try {
      let auth: AuthResponse;
      try {
        auth = await login.mutateAsync({
          body: { phone: formatPhone(phone), otp: otpCode, otpSessionId },
        });
      } catch (err) {
        const error = err as ApiDomainError;
        if (error.errorCode !== 'USER_NOT_FOUND') {
          toast.error(error.getDisplayMessage() || 'That code didn\'t work — please try again');
          return;
        }
        try {
          auth = await signUp.mutateAsync({
            body: {
              firstName: firstName.trim(),
              lastName: lastName.trim(),
              phone: formatPhone(phone),
              otp: otpCode,
              otpSessionId,
            },
          });
        } catch (signUpErr) {
          const signUpError = signUpErr as ApiDomainError;
          toast.error(signUpError.getDisplayMessage() || 'Could not set up your account — please try again');
          return;
        }
      }

      authLogin(auth.accessToken, auth.user);

      // Now authenticated — price the coupon against the chosen package.
      try {
        const validated = await validateCoupon.mutateAsync({
          body: { code: couponCode, packageId: selectedPackage.id },
        });
        setAppliedCoupon(validated);
        setCouponFailedMessage(null);

        // Free race and nothing else to pay for — settle without a charge.
        if (validated.netAmount === 0 && addOnsCost === 0) {
          await claimFreePackage.mutateAsync({
            body: {
              packageId: selectedPackage.id,
              participant: {
                name: `${firstName.trim()} ${lastName.trim()}`,
                shirtSize,
                gender: gender ? (gender.toLowerCase() as 'male' | 'female') : undefined,
              },
              couponCode: validated.code,
              idempotencyKey: crypto.randomUUID(),
            },
          }).catch(() => { /* toasted in claimFreePackage.onError */ });
          return;
        }
      } catch (err) {
        const error = err as ApiDomainError;
        setAppliedCoupon(null);
        setCouponFailedMessage(error.getDisplayMessage() || 'This promo code could not be applied');
      }

      setStep('payment');
    } finally {
      setIsAuthenticating(false);
    }
  };

  // ── Step 4: pay (only reached if the coupon didn't zero out the price) ─
  const handlePay = async () => {
    if (!selectedPackage) return;
    if (needsPaymentOtp && !paymentOtpCode.trim()) {
      toast.error('Please enter the confirmation code');
      return;
    }
    await buyPackage.mutateAsync({
      body: {
        packageId: selectedPackage.id,
        participant: {
          name: `${firstName.trim()} ${lastName.trim()}`,
          shirtSize,
          gender: gender ? (gender.toLowerCase() as 'male' | 'female') : undefined,
        },
        payment: {
          momoNumber: formatPhone(phone),
          network,
        },
        addOnIds: bookedAddOns.map((a) => a.id),
        ...(needsPaymentOtp && paymentOtpCode ? { otp: paymentOtpCode, otpSessionId: paymentOtpSessionId } : {}),
        ...(appliedCoupon ? { couponCode: appliedCoupon.code } : {}),
      },
    }).catch(() => { /* toasted in buyPackage.onError */ });
  };

  if (!PACKAGE_SALES_OPEN) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-cream via-background to-cream-dark">
        <AuthHeader title="Get Your Pass" />
        <div className="container mx-auto px-4 py-16 max-w-md">
          <RegistrationClosedNotice />
        </div>
      </div>
    );
  }

  if (!couponCode) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-cream via-background to-cream-dark">
        <AuthHeader title="Get Your Pass" />
        <div className="container mx-auto px-4 py-16 max-w-md text-center">
          <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-display font-bold mb-2">Missing Promo Code</h2>
          <p className="text-muted-foreground text-sm">
            This link is missing a promo code. Please use the exact link you were given.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-cream via-background to-cream-dark">
      <AuthHeader title="Get Your Pass" />
      <div className="container mx-auto px-4 py-6 sm:py-8 max-w-2xl">
        {step !== 'package' && (
          <button
            onClick={() => {
              if (step === 'details') setStep('package');
              else if (step === 'verify') setStep('details');
              else if (step === 'payment') setStep('verify');
            }}
            disabled={isBusy}
            className="mb-4 text-muted-foreground hover:text-foreground flex items-center gap-2 transition-colors text-sm disabled:opacity-50"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
        )}

        <div className="mb-5 flex items-center gap-2 bg-olive/10 border border-olive/30 text-olive rounded-xl px-4 py-2.5 text-sm font-medium">
          <Sparkles className="w-4 h-4 shrink-0" />
          Promo code <span className="font-mono font-bold">{couponCode}</span> will be applied
        </div>

        {step === 'package' && (
          <div>
            <h1 className="text-2xl font-display font-bold mb-1">Choose Your Pass</h1>
            <p className="text-sm text-muted-foreground mb-4">Your final price is confirmed once you verify your phone number</p>

            {packagesLoading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-olive"></div>
              </div>
            ) : (
              <div className="space-y-3 mb-6">
                {packages.map((pkg) => (
                  <PackageTicket
                    key={pkg.id}
                    pkg={pkg}
                    selected={packageId === pkg.id}
                    onSelect={() => setPackageId(pkg.id)}
                  />
                ))}
                {packages.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No packages available at the moment
                  </p>
                )}
              </div>
            )}

            <Button onClick={handleContinuePackage} disabled={!selectedPackage} className="w-full">
              Continue
            </Button>
          </div>
        )}

        {step === 'details' && selectedPackage && (
          <div className="space-y-4">
            <h1 className="text-2xl font-display font-bold mb-1">Your Details</h1>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">First Name</label>
                <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Kofi" disabled={isBusy} />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Last Name</label>
                <Input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Mensah" disabled={isBusy} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Gender</label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value as Gender)}
                  disabled={isBusy}
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
                  disabled={isBusy}
                  className="w-full px-3 py-2.5 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring text-sm"
                >
                  <option value="">Select size</option>
                  {SHIRT_SIZES.map((size) => (
                    <option key={size} value={size}>{size.toUpperCase()}</option>
                  ))}
                </select>
              </div>
            </div>

            <WeekendPackagePicker addOns={addOns} value={weekend} onChange={setWeekend} disabled={isBusy} />

            <div>
              <PhoneField
                label="Phone Number"
                type="tel"
                value={phone}
                onChange={(value: string) => setPhone(value)}
                placeholder="24XXXXXXX"
                disabled={isBusy}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground mt-1">
                We'll text you a code, then use this account for your pass — and for payment, if the promo doesn't cover the full price.
              </p>
            </div>

            <Button onClick={handleContinueDetails} disabled={isBusy || sendOtp.isPending} className="w-full">
              {sendOtp.isPending ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" /> Sending code...
                </span>
              ) : 'Continue'}
            </Button>
          </div>
        )}

        {step === 'verify' && (
          <div className="space-y-4">
            <h1 className="text-2xl font-display font-bold mb-1">Verify Your Number</h1>
            <p className="text-sm text-muted-foreground">
              Enter the code sent to <strong>+{formatPhone(phone)}</strong>
            </p>

            <Input
              type="text"
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="000000"
              maxLength={6}
              disabled={isBusy}
              className="text-center text-2xl tracking-widest font-mono"
            />

            <button
              type="button"
              onClick={() => sendOtp.mutate({ body: { identifier: formatPhone(phone), provider: 'sms' } }, {
                onSuccess: (res) => { if (res?.sessionId) setOtpSessionId(res.sessionId); },
              })}
              disabled={sendOtp.isPending || isBusy}
              className="text-xs text-olive font-semibold hover:underline disabled:opacity-50"
            >
              {sendOtp.isPending ? 'Sending...' : 'Resend code'}
            </button>

            <Button onClick={handleVerifyAndContinue} disabled={isBusy || !otpCode.trim()} className="w-full">
              {isBusy ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" /> Setting up your pass...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <Check className="w-4 h-4" /> Verify & Continue
                </span>
              )}
            </Button>
          </div>
        )}

        {step === 'payment' && selectedPackage && (
          <div className="space-y-4">
            <h1 className="text-2xl font-display font-bold mb-1">Confirm Payment</h1>

            <div className="bg-emerald-900 border border-white/15 rounded-xl p-3.5 flex items-center justify-between gap-3 relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-widest text-sky-300">🎟 {selectedPackage.name}</p>
                <p className="text-xs text-white/60 truncate">{firstName} {lastName}</p>
              </div>
              <p className="font-bold text-yellow-300 whitespace-nowrap">
                {appliedCoupon ? (
                  <>
                    <span className="line-through opacity-50 text-xs mr-1.5">{renderPrice(appliedCoupon.originalAmount)}</span>
                    {renderPrice(appliedCoupon.netAmount)}
                  </>
                ) : renderPrice(selectedPackage.price)}
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

            {couponFailedMessage && (
              <p className="text-xs text-red-500">{couponFailedMessage} — showing full price instead.</p>
            )}

            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Network</label>
              <select
                value={network}
                onChange={(e) => setNetwork(e.target.value as PaymentNetwork)}
                disabled={isBusy}
                className="w-full px-3 py-2.5 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring text-sm"
              >
                {PAYMENT_NETWORKS.map((n) => (
                  <option key={n} value={n}>
                    {n === 'AIRTELTIGO' ? 'AirtelTigo (AT)' : n === 'VODAFONE' ? 'Telecel (Vodafone)' : 'MTN'}
                  </option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground mt-1">The payment prompt will be sent to +{formatPhone(phone)}</p>
            </div>

            {needsPaymentOtp && (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl space-y-3">
                <p className="text-sm text-yellow-800">
                  Enter the confirmation code sent to <strong>+{formatPhone(phone)}</strong>
                </p>
                <Input
                  type="text"
                  value={paymentOtpCode}
                  onChange={(e) => setPaymentOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  maxLength={6}
                  disabled={buyPackage.isPending}
                  className="text-center text-2xl tracking-widest font-mono"
                />
              </div>
            )}

            <Button onClick={handlePay} disabled={buyPackage.isPending || !isValidGhPhone(phone)} className="w-full">
              {buyPackage.isPending ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" /> Processing...
                </span>
              ) : (
                `Pay ${renderPrice(totalDue)}`
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
