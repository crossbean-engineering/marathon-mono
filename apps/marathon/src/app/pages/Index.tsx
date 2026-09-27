import { useAkMarathonMutation, useAkMarathonQuery, useRenderPrice } from '@ak-marathon/sdk';
import { useState, useRef, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ApiDomainError } from '@rabstack/rab-react-sdk';
import {
  ArrowRight,
  ArrowUpRight,
  BedDouble,
  Bus,
  CalendarDays,
  Check,
  Droplets,
  HeartPulse,
  Loader2,
  MapPin,
  Trophy,
  Waves,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import heroPhoto from '../../assets/runners-hero.jpg';
import closingPhoto from '../../assets/runners-women.jpg';
import { normalizeGhPhone, ghPhoneError, isValidGhPhone, toGhIntlPhone } from '../utils';
import { VestSizeTable } from '../components/VestSizeGuide';
import { describeAddOn, WEEKEND_BUNDLES } from '../lib/weekendPackage';
import {
  EVENT,
  EVENT_CATEGORIES,
  EVENT_ROUTE,
  EVENT_HYDRATION,
  REGISTRATION_INCLUDES,
  WELLNESS_VILLAGE,
  CORPORATE_TEAM_NOTE,
} from '../lib/event';

type Step = 'phone' | 'otp' | 'signup';

const ordinal = (position?: number | null) => {
  if (!position) return '—';
  const suffix = position === 1 ? 'st' : position === 2 ? 'nd' : position === 3 ? 'rd' : 'th';
  return `${position}${suffix}`;
};

// Page palette: warm paper, near-black ink, one coral accent.
const inputCls =
  "w-full h-12 bg-[#f6f5f1] text-[#0e1116] text-[15px] font-medium px-4 rounded-xl border border-[#e6e3dc] outline-none placeholder:text-[#a3a09a] transition focus:bg-white focus:border-[#0e1116] focus:ring-4 focus:ring-[#ff5a2c]/10";
const labelCls = "block text-[13px] font-medium text-[#0e1116] mb-1.5";
const primaryBtnCls =
  "w-full h-12 rounded-full bg-[#0e1116] text-white text-[15px] font-semibold inline-flex items-center justify-center gap-2 transition hover:bg-[#ff5a2c] active:scale-[0.99] disabled:opacity-35 disabled:hover:bg-[#0e1116] disabled:cursor-not-allowed";

const SectionHeading = ({ eyebrow, title, children }: { eyebrow: string; title: string; children?: React.ReactNode }) => (
  <div className="max-w-2xl mb-10">
    <p className="text-[13px] font-semibold uppercase tracking-[0.18em] text-[#ff5a2c] mb-3">{eyebrow}</p>
    <h2 className="wcr-display text-3xl md:text-[2.75rem] leading-[1.05] font-semibold tracking-tight text-[#0e1116]">{title}</h2>
    {children && <p className="text-[#5b6069] text-base md:text-lg mt-4 leading-relaxed">{children}</p>}
  </div>
);

export default function LandingPage() {
  const navigate = useNavigate();
  const { login: authLogin, isAuthenticated, user } = useAuth();

  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [focused, setFocused] = useState(false);
  const [otpCode, setOtpCode] = useState(['', '', '', '', '', '']);
  const [otpSessionId, setOtpSessionId] = useState('');
  const [otpError, setOtpError] = useState<string | null>(null);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [location, setLocation] = useState('');
  const [ghanaCard, setGhanaCard] = useState('');
  const [resendCountdown, setResendCountdown] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (isAuthenticated && user?.role === 'user') {
      navigate('/participant', { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  useEffect(() => {
    if (resendCountdown <= 0) return;
    const timer = setTimeout(() => setResendCountdown(resendCountdown - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCountdown]);

  const formatPhone = (phoneLocal: string): string => toGhIntlPhone(phoneLocal);

  const formatDisplay = (raw: string) => {
    const d = raw.replace(/\D/g, "").slice(0, 9);
    if (d.length <= 3) return d;
    if (d.length <= 6) return `${d.slice(0, 3)} ${d.slice(3)}`;
    return `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhone(normalizeGhPhone(e.target.value));
  };

  const sendOtp = useAkMarathonMutation("sendOTP", {
    onSuccess: (response) => {
      if (response?.sessionId) {
        setOtpSessionId(response.sessionId);
        setStep('otp');
        setResendCountdown(30);
        toast.success('OTP sent to your phone');
      }
    },
    onError: (error: ApiDomainError) => {
      toast.error(error.getDisplayMessage() || 'Failed to send OTP');
    },
  });

  const login = useAkMarathonMutation("login", {
    onSuccess: (response) => {
      const { accessToken, user } = response;
      authLogin(accessToken, user);
      toast.success('Welcome back!');
      navigate('/participant');
    },
    onError: (error: ApiDomainError) => {
      const errorMsg = error.getDisplayMessage() || '';
      if (error.errorCode === 'USER_NOT_FOUND' || error.isNotFound()) {
        setStep('signup');
        toast.info('Please complete your registration');
      } else {
        setOtpError(errorMsg || 'Invalid OTP');
        toast.error(errorMsg || 'Invalid OTP');
      }
    },
  });

  const register = useAkMarathonMutation("signUp", {
    onSuccess: (response) => {
      const { accessToken, user } = response;
      authLogin(accessToken, user);
      toast.success('Account created successfully!');
      navigate('/participant');
    },
    onError: (error: ApiDomainError) => {
      toast.error(error.getDisplayMessage() || 'Registration failed');
    },
  });

  const handleSendOTP = async () => {
    const phoneError = ghPhoneError(phone);
    if (phoneError) {
      toast.error(phoneError);
      inputRef.current?.focus();
      return;
    }
    await sendOtp.mutateAsync({
      body: { identifier: formatPhone(phone), provider: 'sms' }
    });
  };

  const handleResendOTP = async () => {
    if (resendCountdown > 0) return;
    await sendOtp.mutateAsync({
      body: { identifier: formatPhone(phone), provider: 'sms' }
    });
  };

  const handleVerifyOTP = async () => {
    const code = otpCode.join('');
    if (!code || code.length < 4) {
      toast.error('Please enter a valid OTP');
      return;
    }
    if (!otpSessionId) {
      toast.error('Session expired. Please request a new OTP');
      setStep('phone');
      return;
    }
    await login.mutateAsync({
      body: {
        phone: formatPhone(phone),
        otpSessionId,
        otp: code
      }
    });
  };

  const GHANA_CARD_REGEX = /^GHA-\d{9}-\d$/;

  const handleGhanaCardChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, '');
    setGhanaCard(raw.slice(0, 15));
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || firstName.length < 2) {
      toast.error('Please enter your first name (at least 2 characters)');
      return;
    }
    if (!lastName.trim() || lastName.length < 2) {
      toast.error('Please enter your last name (at least 2 characters)');
      return;
    }
    if (email.trim() && !/^\S+@\S+\.\S+$/.test(email.trim())) {
      toast.error('Please enter a valid email address');
      return;
    }
    if (!GHANA_CARD_REGEX.test(ghanaCard.trim())) {
      toast.error('Please enter a valid Ghana Card number (GHA-XXXXXXXXX-X)');
      return;
    }
    const signUpBody = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      phone: formatPhone(phone),
      ...(email.trim() ? { email: email.trim() } : {}),
      ...(location.trim() ? { location: location.trim() } : {}),
      idNumber: ghanaCard.trim(),
      otp: otpCode.join(''),
      otpSessionId
    };
    await register.mutateAsync({ body: signUpBody });
  };

  const handleOtpInput = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otpCode];
    newOtp[index] = value.slice(-1);
    setOtpCode(newOtp);
    setOtpError(null);
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpCode[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
    if (e.key === 'Enter') {
      handleVerifyOTP();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const newOtp = [...otpCode];
    for (let i = 0; i < pasted.length; i++) {
      newOtp[i] = pasted[i];
    }
    setOtpCode(newOtp);
    const focusIndex = Math.min(pasted.length, 5);
    otpRefs.current[focusIndex]?.focus();
  };

  // Public endpoint — live categories, prices and prizes as configured in admin.
  const { data: packagesData, isLoading: packagesLoading } = useAkMarathonQuery('listPackages', {
    refetchOnWindowFocus: false,
  });
  const packages = packagesData ?? [];
  const { renderPrice } = useRenderPrice();
  const prizePackages = packages.filter((pkg) => pkg.prizes.length > 0);
  const { data: addOnsData } = useAkMarathonQuery('listAddOns', { refetchOnWindowFocus: false });
  const addOns = addOnsData ?? [];

  const resetToPhone = () => {
    setStep('phone');
    setOtpCode(['', '', '', '', '', '']);
    setOtpError(null);
  };

  return (
    <div className="wcr min-h-screen bg-[#f6f5f1] text-[#0e1116] antialiased">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter+Tight:wght@500;600;700&family=Inter:wght@400;500;600&display=swap');
        .wcr, .wcr input, .wcr button { font-family: 'Inter', system-ui, sans-serif; }
        .wcr-display { font-family: 'Inter Tight', 'Inter', system-ui, sans-serif; }
        @keyframes wcrRise { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: none; } }
        .wcr-rise { animation: wcrRise 0.6s cubic-bezier(.2,.7,.2,1) both; }
        @keyframes wcrZoom { from { transform: scale(1.08); } to { transform: scale(1); } }
        .wcr-zoom { animation: wcrZoom 2.4s cubic-bezier(.2,.7,.2,1) both; }
        @media (prefers-reduced-motion: reduce) { .wcr-rise, .wcr-zoom { animation: none; } }
      `}</style>

      {/* ═══════ NAV ═══════ */}
      <header className="sticky top-0 z-30 bg-[#0e1116]/85 backdrop-blur-md border-b border-white/10 text-white">
        <div className="max-w-6xl mx-auto px-5 md:px-8 h-16 flex items-center justify-between">
          <a href="#top" className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#ff5a2c]" />
            <span className="wcr-display font-semibold tracking-tight text-[15px]">{EVENT.name}</span>
          </a>
          <nav className="flex items-center gap-1 sm:gap-2 text-sm">
            <a href="#pricing" className="hidden sm:inline-flex px-3 py-2 text-white/65 hover:text-white transition">Pricing</a>
            <a href="#race-day" className="hidden sm:inline-flex px-3 py-2 text-white/65 hover:text-white transition">Race day</a>
            <button
              onClick={() => navigate('/login')}
              className="px-3 py-2 text-white/65 hover:text-white transition"
            >
              Staff login
            </button>
            <a
              href="#register"
              className="ml-1 inline-flex items-center h-9 px-4 rounded-full bg-[#ff5a2c] text-white font-medium hover:bg-white hover:text-[#0e1116] transition"
            >
              Register
            </a>
          </nav>
        </div>
      </header>

      {/* ═══════ HERO + REGISTRATION ═══════ */}
      <section id="top" className="relative overflow-hidden bg-[#0e1116] text-white">
        <img
          src={heroPhoto}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover object-[60%_center] wcr-zoom"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0e1116]/90 via-[#0e1116]/65 to-[#0e1116]/30" />
        <div className="absolute inset-0 bg-[#0e1116]/35 lg:hidden" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#0e1116]/80 to-transparent" />

        <div className="relative max-w-6xl mx-auto px-5 md:px-8 pt-14 pb-16 md:pt-24 md:pb-28 grid lg:grid-cols-[1.15fr_0.85fr] gap-12 lg:gap-16 items-start">
          <div className="wcr-rise lg:pt-6">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 backdrop-blur px-3 py-1 text-[13px] font-medium text-white/85">
              <span className="w-1.5 h-1.5 rounded-full bg-[#ff5a2c]" />
              {EVENT.edition} · {EVENT.year}
            </span>

            <h1 className="wcr-display mt-6 text-[3.5rem] leading-[0.95] sm:text-7xl lg:text-[5.75rem] font-semibold tracking-[-0.035em]">
              Western City<br />Run<span className="text-[#ff5a2c]">.</span>
            </h1>

            <p className="mt-6 max-w-md text-lg text-white/75 leading-relaxed">{EVENT.tagline}.</p>

            <dl className="mt-10 grid sm:grid-cols-2 gap-6 max-w-lg">
              <div className="flex gap-3">
                <CalendarDays className="w-5 h-5 mt-0.5 text-[#ff5a2c] shrink-0" strokeWidth={1.75} />
                <div>
                  <dt className="text-[13px] text-white/55">Race day</dt>
                  <dd className="font-medium">{EVENT.date.long}</dd>
                </div>
              </div>
              <div className="flex gap-3">
                <MapPin className="w-5 h-5 mt-0.5 text-[#ff5a2c] shrink-0" strokeWidth={1.75} />
                <div>
                  <dt className="text-[13px] text-white/55">Start & finish</dt>
                  <dd className="font-medium">{EVENT.city}</dd>
                  <dd className="text-sm text-white/70">{EVENT.venue}</dd>
                </div>
              </div>
            </dl>

            <div className="mt-10 flex flex-wrap gap-2">
              {EVENT_CATEGORIES.map((category) => (
                <span key={category} className="rounded-full border border-white/25 bg-white/5 backdrop-blur px-3.5 py-1.5 text-sm font-medium">
                  {category}
                </span>
              ))}
            </div>
          </div>

          {/* Registration card */}
          <div id="register" className="wcr-rise scroll-mt-24" style={{ animationDelay: "0.1s" }}>
            <div className="bg-white text-[#0e1116] rounded-3xl p-6 sm:p-8 shadow-[0_32px_64px_-24px_rgba(0,0,0,0.55)]">

              {/* Step indicator */}
              <div className="flex gap-1.5 mb-7" aria-hidden="true">
                {(['phone', 'otp', 'signup'] as Step[]).map((s, i) => (
                  <span
                    key={s}
                    className={`h-1 flex-1 rounded-full transition-colors ${
                      ['phone', 'otp', 'signup'].indexOf(step) >= i ? 'bg-[#ff5a2c]' : 'bg-[#eeece6]'
                    }`}
                  />
                ))}
              </div>

              {/* Step 1: Phone */}
              {step === 'phone' && (
                <>
                  <h2 className="wcr-display text-2xl font-semibold tracking-tight">Join the race</h2>
                  <p className="text-[#5b6069] mt-1.5 mb-6">Register or sign in with your phone number.</p>

                  <label htmlFor="wcr-phone" className={labelCls}>Phone number</label>
                  <div className={`flex items-center h-12 rounded-xl border bg-[#f6f5f1] transition ${
                    focused ? 'bg-white border-[#0e1116] ring-4 ring-[#ff5a2c]/10' : 'border-[#e6e3dc]'
                  }`}>
                    <span className="pl-4 pr-3 text-[15px] font-medium text-[#5b6069] border-r border-[#e6e3dc] select-none">
                      +233
                    </span>
                    <input
                      id="wcr-phone"
                      ref={inputRef}
                      type="tel"
                      inputMode="numeric"
                      autoComplete="tel-national"
                      value={formatDisplay(phone)}
                      onChange={handlePhoneChange}
                      onFocus={() => setFocused(true)}
                      onBlur={() => setFocused(false)}
                      onKeyDown={(e) => e.key === "Enter" && handleSendOTP()}
                      placeholder="241 234 567"
                      className="flex-1 min-w-0 h-full bg-transparent px-3 text-[15px] font-medium tracking-wide outline-none placeholder:text-[#a3a09a]"
                    />
                    <span className={`pr-4 text-xs tabular-nums font-medium ${isValidGhPhone(phone) ? 'text-emerald-600' : 'text-[#a3a09a]'}`}>
                      {phone.length}/9
                    </span>
                  </div>
                  <p className="text-[13px] text-[#8a8d93] mt-2">9 digits, without the leading 0.</p>

                  <button
                    onClick={handleSendOTP}
                    disabled={sendOtp.isPending || !isValidGhPhone(phone)}
                    className={`${primaryBtnCls} mt-6 group`}
                  >
                    {sendOtp.isPending ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Sending code…</>
                    ) : (
                      <>Continue <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" /></>
                    )}
                  </button>
                </>
              )}

              {/* Step 2: OTP */}
              {step === 'otp' && (
                <>
                  <h2 className="wcr-display text-2xl font-semibold tracking-tight">Check your phone</h2>
                  <p className="text-[#5b6069] mt-1.5 mb-6">
                    We sent a code to <span className="text-[#0e1116] font-medium">+{formatPhone(phone)}</span>.{' '}
                    <button type="button" onClick={resetToPhone} className="text-[#ff5a2c] font-medium hover:underline underline-offset-2">
                      Change
                    </button>
                  </p>

                  <div className="grid grid-cols-6 gap-2" onPaste={handleOtpPaste}>
                    {otpCode.map((digit, i) => (
                      <input
                        key={i}
                        ref={(el) => { otpRefs.current[i] = el; }}
                        type="text"
                        inputMode="numeric"
                        autoComplete={i === 0 ? 'one-time-code' : 'off'}
                        aria-label={`Digit ${i + 1}`}
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpInput(i, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(i, e)}
                        autoFocus={i === 0}
                        className={`h-14 w-full text-center text-xl font-semibold rounded-xl border bg-[#f6f5f1] outline-none transition focus:bg-white focus:ring-4 ${
                          otpError
                            ? 'border-red-400 focus:border-red-500 focus:ring-red-500/10'
                            : digit
                              ? 'border-[#0e1116]/40 bg-white focus:border-[#0e1116] focus:ring-[#ff5a2c]/10'
                              : 'border-[#e6e3dc] focus:border-[#0e1116] focus:ring-[#ff5a2c]/10'
                        }`}
                      />
                    ))}
                  </div>

                  {otpError && <p className="text-red-600 text-sm mt-3">{otpError}</p>}

                  <button
                    onClick={handleVerifyOTP}
                    disabled={login.isPending || otpCode.join('').length < 4}
                    className={`${primaryBtnCls} mt-6`}
                  >
                    {login.isPending ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Verifying…</>
                    ) : (
                      <>Verify & continue <ArrowRight className="w-4 h-4" /></>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleResendOTP}
                    disabled={resendCountdown > 0 || sendOtp.isPending}
                    className="w-full mt-4 text-sm text-[#5b6069] hover:text-[#0e1116] disabled:opacity-60 disabled:cursor-not-allowed transition"
                  >
                    {resendCountdown > 0
                      ? `Resend code in ${resendCountdown}s`
                      : sendOtp.isPending
                        ? 'Sending…'
                        : "Didn't get it? Resend code"}
                  </button>
                </>
              )}

              {/* Step 3: Signup */}
              {step === 'signup' && (
                <form onSubmit={handleSignup}>
                  <h2 className="wcr-display text-2xl font-semibold tracking-tight">Complete your profile</h2>
                  <p className="text-[#5b6069] mt-1.5 mb-6">
                    One more step for <span className="text-[#0e1116] font-medium">+{formatPhone(phone)}</span>.
                  </p>

                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label htmlFor="wcr-first" className={labelCls}>First name</label>
                        <input id="wcr-first" type="text" autoComplete="given-name" value={firstName} onChange={(e) => setFirstName(e.target.value)} autoFocus className={inputCls} />
                      </div>
                      <div>
                        <label htmlFor="wcr-last" className={labelCls}>Last name</label>
                        <input id="wcr-last" type="text" autoComplete="family-name" value={lastName} onChange={(e) => setLastName(e.target.value)} className={inputCls} />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="wcr-email" className={labelCls}>
                        Email <span className="text-[#8a8d93] font-normal">· optional</span>
                      </label>
                      <input id="wcr-email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className={inputCls} />
                    </div>

                    <div>
                      <label htmlFor="wcr-location" className={labelCls}>
                        Location <span className="text-[#8a8d93] font-normal">· optional</span>
                      </label>
                      <input id="wcr-location" type="text" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Takoradi" className={inputCls} />
                    </div>

                    <div>
                      <label htmlFor="wcr-card" className={labelCls}>Ghana Card number</label>
                      <input id="wcr-card" type="text" value={ghanaCard} onChange={handleGhanaCardChange} placeholder="GHA-XXXXXXXXX-X" className={`${inputCls} tracking-wider`} />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={register.isPending || !firstName.trim() || firstName.length < 2 || !lastName.trim() || lastName.length < 2 || !ghanaCard.trim()}
                    className={`${primaryBtnCls} mt-6`}
                  >
                    {register.isPending ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Creating account…</>
                    ) : (
                      <>Create account <ArrowRight className="w-4 h-4" /></>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════ PRICING (live packages) ═══════ */}
      <section id="pricing" className="scroll-mt-16 border-t border-[#e6e3dc]">
        <div className="max-w-6xl mx-auto px-5 md:px-8 py-20 md:py-28">
          <SectionHeading eyebrow="Registration" title="Pick your distance.">
            {CORPORATE_TEAM_NOTE}
          </SectionHeading>

          {packagesLoading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[0, 1, 2].map((i) => <div key={i} className="h-48 rounded-2xl bg-[#eeece6] animate-pulse" />)}
            </div>
          ) : packages.length > 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {packages.map((pkg) => (
                <article key={pkg.id} className="group flex flex-col rounded-2xl bg-white border border-[#e6e3dc] p-6 md:p-7 transition hover:border-[#0e1116]/30 hover:-translate-y-0.5">
                  <h3 className="font-medium text-[#5b6069]">{pkg.name}</h3>
                  <p className="wcr-display text-4xl font-semibold tracking-tight mt-3">{renderPrice(pkg.price)}</p>
                  {pkg.benefits && <p className="text-sm text-[#5b6069] mt-3 leading-relaxed">{pkg.benefits}</p>}
                  {pkg.merchandise.length > 0 && (
                    <ul className="mt-5 pt-5 border-t border-[#eeece6] space-y-2">
                      {pkg.merchandise.map((item) => (
                        <li key={item.id} className="flex items-center gap-2 text-sm">
                          <Check className="w-4 h-4 text-[#ff5a2c]" strokeWidth={2.25} /> {item.name}
                        </li>
                      ))}
                    </ul>
                  )}
                  <a href="#register" className="mt-auto pt-6 inline-flex items-center gap-1.5 text-sm font-medium text-[#0e1116] group-hover:text-[#ff5a2c] transition">
                    Register <ArrowUpRight className="w-4 h-4" />
                  </a>
                </article>
              ))}
            </div>
          ) : (
            <p className="text-[#5b6069]">
              Registration opens {EVENT.registrationOpens}. Categories and prices will appear here.
            </p>
          )}
        </div>
      </section>

      {/* ═══════ INCLUDED + REWARDS ═══════ */}
      <section className="bg-[#0e1116] text-white">
        <div className="max-w-6xl mx-auto px-5 md:px-8 py-20 md:py-28 grid lg:grid-cols-2 gap-14 lg:gap-20">
          <div>
            <p className="text-[13px] font-semibold uppercase tracking-[0.18em] text-[#ff5a2c] mb-3">Included</p>
            <h2 className="wcr-display text-3xl md:text-[2.75rem] leading-[1.05] font-semibold tracking-tight">Every registrant gets</h2>
            <ul className="mt-10 divide-y divide-white/10 border-y border-white/10">
              {REGISTRATION_INCLUDES.map((item) => (
                <li key={item} className="flex items-center gap-4 py-4 text-[17px]">
                  <span className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5 text-[#ff5a2c]" strokeWidth={2.5} />
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-[13px] font-semibold uppercase tracking-[0.18em] text-[#ff5a2c] mb-3">Rewards</p>
            <h2 className="wcr-display text-3xl md:text-[2.75rem] leading-[1.05] font-semibold tracking-tight">Race for the podium</h2>
            <p className="text-white/60 text-lg mt-4 leading-relaxed">
              Top finishers in each category are recognized at the awards ceremony, and every finisher takes home a medal.
            </p>
            {prizePackages.length > 0 && (
              <div className="mt-10 space-y-4">
                {prizePackages.map((pkg) => (
                  <div key={pkg.id} className="rounded-2xl bg-white/[0.04] border border-white/10 p-5">
                    <div className="flex items-center gap-2 text-white/70 text-sm font-medium mb-2">
                      <Trophy className="w-4 h-4 text-[#ff5a2c]" /> {pkg.name}
                    </div>
                    <ul className="divide-y divide-white/10">
                      {[...pkg.prizes]
                        .sort((a, b) => (a.position ?? 99) - (b.position ?? 99))
                        .map((prize) => (
                          <li key={prize.id ?? `${prize.position}-${prize.name}`} className="flex items-baseline justify-between gap-4 py-2.5">
                            {prize.position ? <span className="text-sm text-white/50 w-10 shrink-0">{ordinal(prize.position)}</span> : <span />}
                            {prize.amount ? (
                              <span className="wcr-display text-lg font-semibold">{renderPrice(prize.amount)}</span>
                            ) : (
                              <span className="text-sm text-white/85 text-right">{prize.name}</span>
                            )}
                          </li>
                        ))}
                    </ul>
                    {pkg.prizes.some((prize) => prize.description) && (
                      <p className="text-white/50 text-sm mt-4">{pkg.prizes.find((prize) => prize.description)?.description}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ═══════ RACE DAY ═══════ */}
      <section id="race-day" className="scroll-mt-16">
        <div className="max-w-6xl mx-auto px-5 md:px-8 py-20 md:py-28">
          <SectionHeading eyebrow="Race day" title="Along the Takoradi coast." />
          <div className="grid md:grid-cols-3 gap-4">
            <div className="rounded-2xl bg-white border border-[#e6e3dc] p-6 md:p-7">
              <Waves className="w-6 h-6 text-[#ff5a2c]" strokeWidth={1.75} />
              <h3 className="wcr-display text-xl font-semibold tracking-tight mt-5">The route</h3>
              <p className="text-[#5b6069] mt-2 leading-relaxed">{EVENT_ROUTE}</p>
            </div>
            <div className="rounded-2xl bg-white border border-[#e6e3dc] p-6 md:p-7">
              <Droplets className="w-6 h-6 text-[#ff5a2c]" strokeWidth={1.75} />
              <h3 className="wcr-display text-xl font-semibold tracking-tight mt-5">Hydration</h3>
              <p className="text-[#5b6069] mt-2 leading-relaxed">{EVENT_HYDRATION}</p>
            </div>
            <div className="rounded-2xl bg-white border border-[#e6e3dc] p-6 md:p-7">
              <HeartPulse className="w-6 h-6 text-[#ff5a2c]" strokeWidth={1.75} />
              <h3 className="wcr-display text-xl font-semibold tracking-tight mt-5">Wellness Village</h3>
              <ul className="mt-2 space-y-2">
                {WELLNESS_VILLAGE.map((item) => (
                  <li key={item} className="flex gap-2 text-[#5b6069] leading-relaxed">
                    <span className="mt-2.5 w-1 h-1 rounded-full bg-[#ff5a2c] shrink-0" />{item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════ WEEKEND PACKAGE (live add-ons) ═══════ */}
      {addOns.length > 0 && (
        <section className="border-t border-[#e6e3dc]">
          <div className="max-w-6xl mx-auto px-5 md:px-8 py-20 md:py-28 grid lg:grid-cols-[0.9fr_1.1fr] gap-10 lg:gap-16">
            <SectionHeading eyebrow="Travelling?" title="Make a weekend of it.">
              Add transport, accommodation, or both when you register.
            </SectionHeading>
            <div>
              <div className="flex flex-wrap gap-2 mb-5">
                {WEEKEND_BUNDLES.filter((b) => b.id !== 'race').map((bundle) => (
                  <span key={bundle.id} className="rounded-full bg-white border border-[#e6e3dc] px-3.5 py-1.5 text-sm font-medium">
                    {bundle.label}
                  </span>
                ))}
              </div>
              <ul className="rounded-2xl bg-white border border-[#e6e3dc] divide-y divide-[#eeece6]">
                {addOns.map((addOn) => {
                  const Icon = addOn.type === 'accommodation' ? BedDouble : Bus;
                  return (
                    <li key={addOn.id} className="flex items-center justify-between gap-4 px-5 py-4">
                      <span className="flex items-center gap-3 min-w-0">
                        <Icon className="w-5 h-5 text-[#8a8d93] shrink-0" strokeWidth={1.75} />
                        <span className="font-medium truncate">{describeAddOn(addOn)}</span>
                      </span>
                      <span className={`text-sm whitespace-nowrap ${addOn.remaining === 0 ? 'text-[#a3a09a]' : 'font-semibold'}`}>
                        {addOn.remaining === 0 ? 'Fully booked' : <>{renderPrice(addOn.price)}<span className="text-[#8a8d93] font-normal"> / person</span></>}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </section>
      )}

      {/* ═══════ VEST SIZE GUIDE ═══════ */}
      <section className="border-t border-[#e6e3dc]">
        <div className="max-w-6xl mx-auto px-5 md:px-8 py-20 md:py-28 grid lg:grid-cols-[0.9fr_1.1fr] gap-10 lg:gap-16">
          <SectionHeading eyebrow="Fit" title="Race vest size guide.">
            Pick your vest size when you register.
          </SectionHeading>
          <div className="rounded-2xl bg-white border border-[#e6e3dc] p-5 md:p-7">
            <VestSizeTable />
          </div>
        </div>
      </section>

      {/* ═══════ CLOSING CTA + FOOTER ═══════ */}
      <footer className="bg-[#0e1116] text-white">
        <div className="relative overflow-hidden">
          <img
            src={closingPhoto}
            alt=""
            aria-hidden="true"
            loading="lazy"
            className="absolute inset-0 w-full h-full object-cover object-[center_35%]"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0e1116]/90 via-[#0e1116]/60 to-[#0e1116]/20" />
          <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#0e1116] to-transparent" />
          <div className="relative max-w-6xl mx-auto px-5 md:px-8 py-28 md:py-40 flex flex-col md:flex-row md:items-end justify-between gap-8">
            <h2 className="wcr-display text-4xl md:text-6xl font-semibold tracking-[-0.03em] leading-[1]">
              See you at the<br />start line<span className="text-[#ff5a2c]">.</span>
            </h2>
            <a
              href="#register"
              className="inline-flex items-center gap-2 h-12 px-6 rounded-full bg-[#ff5a2c] text-white font-semibold hover:bg-white hover:text-[#0e1116] transition self-start md:self-auto"
            >
              Register now <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
        <div className="max-w-6xl mx-auto px-5 md:px-8 pb-10">
          <div className="pt-8 border-t border-white/10 flex flex-col sm:flex-row justify-between gap-3 text-sm text-white/50">
            <p>{EVENT.name} · {EVENT.date.long} · {EVENT.city}<span className="block text-white/30 text-xs mt-1">Photos: Justin Lagat / Unsplash</span></p>
            <button onClick={() => navigate('/login')} className="text-left sm:text-right hover:text-white transition">
              Staff login
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
