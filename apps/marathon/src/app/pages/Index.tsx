import { useAkMarathonMutation, useAkMarathonQuery, useRenderPrice } from '@ak-marathon/sdk';
import { useState, useRef, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ApiDomainError } from '@rabstack/rab-react-sdk';
import { useAuth } from '../contexts/AuthContext';
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

const prizeMedal = (position?: number | null) =>
  position === 1 ? '🥇' : position === 2 ? '🥈' : position === 3 ? '🥉' : '🏅';

const confettiDot = (color: string, size: string, top: string, left: string, delay: string) => (
  <div
    key={`${top}-${left}-${color}`}
    className="absolute rounded-full animate-pulse"
    style={{ backgroundColor: color, width: size, height: size, top, left, animationDelay: delay, animationDuration: "2.5s" }}
  />
);

// Running silhouette (Material "directions run")
const runnerIcon = (color: string) => (
  <svg viewBox="0 0 24 24" className="w-full h-full" fill={color}>
    <path d="M13.49 5.48c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm-3.6 13.9l1-4.4 2.1 2v6h2v-7.5l-2.1-2 .6-3c1.3 1.5 3.3 2.5 5.5 2.5v-2c-1.9 0-3.5-1-4.3-2.4l-1-1.6c-.4-.6-1-1-1.7-1-.3 0-.5.1-.8.1l-5.2 2.2v4.7h2v-3.4l1.8-.7-1.6 8.1-4.9-1-.4 2 7 1.4z" />
  </svg>
);

// Section heading used down the flyer
const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <p className="text-amber-300 font-condensed font-bold text-sm uppercase tracking-widest text-center mb-2">{children}</p>
);

const cardCls = "bg-white/10 border border-white/20 rounded-xl p-3.5";

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

  return (
    <div className="min-h-screen bg-[#03131f] flex items-center justify-center md:p-8">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:ital,wght@0,600;0,700;0,800;1,600;1,700;1,800&family=Nunito:wght@400;600;700;800;900&display=swap');
        .font-condensed { font-family: 'Barlow Condensed', sans-serif; }
        * { font-family: 'Nunito', sans-serif; }
        @keyframes slideUp { 0% { transform: translateY(20px); opacity: 0; } 100% { transform: translateY(0); opacity: 1; } }
        @keyframes ticketBounce { 0%, 100% { transform: translateY(0) rotate(0deg); } 25% { transform: translateY(-6px) rotate(-5deg); } 75% { transform: translateY(-3px) rotate(5deg); } }
        @keyframes waveDrift { 0%, 100% { transform: translateX(0); } 50% { transform: translateX(-4%); } }
        @keyframes runAcross { 0% { left: -14%; } 100% { left: 106%; } }
        @keyframes runBob { 0%, 100% { transform: translateY(0) rotate(-2deg); } 50% { transform: translateY(-4px) rotate(4deg); } }
        .slide-up { animation: slideUp 0.5s ease-out both; }
        .ticket-bounce { animation: ticketBounce 2s ease-in-out infinite; }
        .wave-drift { animation: waveDrift 9s ease-in-out infinite; }
        .runner { position: absolute; animation-name: runAcross; animation-timing-function: linear; animation-iteration-count: infinite; }
        .runner-bob { animation: runBob 0.5s ease-in-out infinite; }
        @keyframes shimmer { 0% { background-position: -200% center; } 100% { background-position: 200% center; } }
        .shimmer-text {
          background: linear-gradient(90deg, #FDE047 0%, #FBBF24 25%, #FDE047 50%, #F59E0B 75%, #FDE047 100%);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: shimmer 3s linear infinite;
        }
        .flyer-shadow {
          box-shadow: 0 25px 60px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.05), inset 0 1px 0 rgba(255,255,255,0.1);
        }
      `}</style>

      <div className="relative w-full max-w-lg bg-gradient-to-b from-sky-950 via-cyan-900 to-sky-950 sm:rounded-3xl overflow-hidden flyer-shadow">

        {/* Sunrise over the Gulf of Guinea */}
        <div className="absolute top-0 inset-x-0 h-72 pointer-events-none" style={{ background: "radial-gradient(ellipse 90% 60% at 50% -10%, rgba(251,191,36,0.25), transparent 65%)" }} />

        {/* Watermark swells */}
        <div className="absolute inset-x-0 top-40 h-40 pointer-events-none opacity-[0.10] wave-drift">
          <svg viewBox="0 0 400 80" preserveAspectRatio="none" className="w-[110%] h-full">
            <path d="M0 40 Q50 10 100 40 T200 40 T300 40 T400 40 L400 80 L0 80 Z" fill="#67e8f9" />
          </svg>
        </div>

        {/* Confetti */}
        {confettiDot("#FDE047", "8px", "3%", "15%", "0s")}
        {confettiDot("#FB923C", "6px", "8%", "85%", "0.5s")}
        {confettiDot("#67E8F9", "10px", "18%", "92%", "1s")}
        {confettiDot("#FDE047", "7px", "55%", "4%", "1.5s")}
        {confettiDot("#FB923C", "9px", "65%", "93%", "0.3s")}
        {confettiDot("#22D3EE", "6px", "42%", "3%", "0.8s")}
        {confettiDot("#FDE047", "5px", "80%", "7%", "1.2s")}
        {confettiDot("#FB923C", "7px", "88%", "91%", "0.6s")}
        {confettiDot("#FDE047", "6px", "12%", "6%", "0.2s")}
        {confettiDot("#67E8F9", "7px", "48%", "94%", "0.4s")}

        {/* Runners along the coast road */}
        <div className="absolute bottom-16 inset-x-0 h-10 pointer-events-none z-0">
          <div className="runner w-9 h-9 opacity-50" style={{ animationDuration: "11s", animationDelay: "-2s" }}>
            <div className="runner-bob w-full h-full">{runnerIcon("#FDE047")}</div>
          </div>
          <div className="runner w-6 h-6 opacity-40" style={{ animationDuration: "15s", animationDelay: "-9s", top: "10px" }}>
            <div className="runner-bob w-full h-full" style={{ animationDelay: "0.15s" }}>{runnerIcon("#ffffff")}</div>
          </div>
          <div className="runner w-7 h-7 opacity-45" style={{ animationDuration: "13s", animationDelay: "-6s", top: "4px" }}>
            <div className="runner-bob w-full h-full" style={{ animationDelay: "0.3s" }}>{runnerIcon("#FB923C")}</div>
          </div>
        </div>

        <div className="relative z-10 px-6 pt-8 pb-6">

          {/* ═══════ HEADER ═══════ */}
          <div className="relative text-center mb-4 slide-up">
            <p className="text-white/90 text-[11px] font-extrabold uppercase tracking-[0.35em] mb-1.5">The {EVENT.edition}</p>
            <h1 className="font-condensed italic font-extrabold uppercase leading-[0.88] relative z-10">
              <span className="block text-5xl md:text-6xl text-white" style={{ textShadow: "2px 3px 0 rgba(0,0,0,0.3)" }}>Western City</span>
              <span className="block text-6xl md:text-7xl shimmer-text" style={{ textShadow: "2px 3px 0 rgba(0,0,0,0.2)" }}>Run</span>
            </h1>
            <p className="text-white/80 font-bold text-sm mt-2 tracking-wide relative z-10 max-w-xs mx-auto">
              {EVENT.tagline}
            </p>
          </div>

          {/* ═══════ CATEGORY CHIPS ═══════ */}
          <div className="flex justify-center flex-wrap gap-1.5 mb-5 slide-up" style={{ animationDelay: "0.08s" }}>
            {EVENT_CATEGORIES.map((category) => (
              <span key={category} className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-3 py-1 text-white text-[11px] font-bold uppercase tracking-wider">
                {category}
              </span>
            ))}
          </div>

          {/* ═══════ LOGIN ═══════ */}
          <div className="relative mb-5 slide-up" style={{ animationDelay: "0.14s" }}>
            <div className="relative">
              <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full z-20" style={{ background: "linear-gradient(135deg, #155e75, #0c4a6e)" }} />
              <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full z-20" style={{ background: "linear-gradient(135deg, #155e75, #0c4a6e)" }} />

              <div className="bg-sky-900 border border-white/15 rounded-2xl p-5 md:p-6 relative overflow-hidden shadow-2xl">
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />

                {/* Step 1: Phone */}
                {step === 'phone' && (
                  <>
                    <div className="text-center mb-4">
                      <span className="text-3xl mb-1.5 block ticket-bounce" role="img" aria-label="runner">🏃🏾</span>
                      <h2 className="font-condensed font-bold text-white text-xl">Join the Race</h2>
                      <p className="text-white/70 text-sm mt-0.5">Enter your phone number to register</p>
                    </div>

                    <div className="mb-4">
                      <label className="block text-white/80 text-xs font-bold uppercase tracking-wider mb-1.5">Phone Number</label>
                      <div className={`relative rounded-xl overflow-hidden transition-all duration-300 ${focused ? "ring-2 ring-yellow-400/50 shadow-lg shadow-yellow-400/10" : ""}`}>
                        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5 pointer-events-none">
                          <span className="text-sm" role="img" aria-label="Ghana flag">🇬🇭</span>
                          <span className="text-white/70 text-xs font-semibold">+233</span>
                          <span className="text-white/30 text-base font-light">|</span>
                        </div>
                        <input
                          ref={inputRef}
                          type="tel"
                          inputMode="numeric"
                          value={formatDisplay(phone)}
                          onChange={handlePhoneChange}
                          onFocus={() => setFocused(true)}
                          onBlur={() => setFocused(false)}
                          onKeyDown={(e) => e.key === "Enter" && handleSendOTP()}
                          placeholder="XXX XXX XXX"
                          className="w-full bg-white/8 text-white text-base font-semibold pl-24 pr-4 py-3 outline-none placeholder-white/30 tracking-widest rounded-xl"
                          autoFocus
                        />
                      </div>
                      <div className="flex items-center justify-between mt-1.5 px-0.5">
                        <p className="text-white/50 text-xs">Enter 9 digits without leading 0</p>
                        <span className={`text-xs font-bold transition-colors ${isValidGhPhone(phone) ? "text-green-300" : "text-white/40"}`}>{phone.length}/9</span>
                      </div>
                    </div>

                    <button
                      onClick={handleSendOTP}
                      disabled={sendOtp.isPending || !isValidGhPhone(phone)}
                      className={`w-full py-3 rounded-xl font-condensed font-bold text-base tracking-wide transition-all duration-300 relative overflow-hidden group
                        ${isValidGhPhone(phone)
                          ? "bg-gradient-to-r from-yellow-400 to-amber-500 text-sky-950 shadow-lg shadow-yellow-500/25 hover:shadow-xl hover:shadow-yellow-500/40 hover:scale-[1.02] active:scale-[0.98]"
                          : "bg-white/6 text-white/20 cursor-not-allowed"
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {sendOtp.isPending ? (
                        <span className="flex items-center justify-center gap-2">
                          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                          Sending...
                        </span>
                      ) : (
                        <span className="relative z-10 flex items-center justify-center gap-2">
                          Continue
                          <span className={`transition-transform duration-300 inline-block ${isValidGhPhone(phone) ? "group-hover:translate-x-1" : ""}`}>→</span>
                        </span>
                      )}
                    </button>
                  </>
                )}

                {/* Step 2: OTP */}
                {step === 'otp' && (
                  <>
                    <div className="text-center mb-4">
                      <span className="text-3xl mb-1.5 block" role="img" aria-label="shield">🔐</span>
                      <h2 className="font-condensed font-bold text-white text-xl">Verify Your Number</h2>
                      <p className="text-white/70 text-sm mt-0.5">
                        Code sent to <span className="text-white/90 font-semibold">+{formatPhone(phone)}</span>
                      </p>
                      <button
                        type="button"
                        onClick={() => { setStep('phone'); setOtpCode(['', '', '', '', '', '']); setOtpError(null); }}
                        className="text-yellow-300 text-xs font-bold mt-1 hover:underline underline-offset-2"
                      >
                        Change number
                      </button>
                    </div>

                    <div className="flex gap-2 justify-center mb-4" onPaste={handleOtpPaste}>
                      {otpCode.map((digit, i) => (
                        <input
                          key={i}
                          ref={(el) => { otpRefs.current[i] = el; }}
                          type="text"
                          inputMode="numeric"
                          maxLength={1}
                          value={digit}
                          onChange={(e) => handleOtpInput(i, e.target.value)}
                          onKeyDown={(e) => handleOtpKeyDown(i, e)}
                          autoFocus={i === 0}
                          className={`w-11 h-13 text-center text-xl font-bold rounded-xl border-2 bg-white/8 text-white outline-none transition-all ${
                            otpError
                              ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-400/30'
                              : digit
                                ? 'border-yellow-400/50 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20'
                                : 'border-white/15 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20'
                          }`}
                        />
                      ))}
                    </div>

                    {otpError && (
                      <p className="text-red-300 text-xs text-center mb-3 font-semibold">{otpError}</p>
                    )}

                    <button
                      onClick={handleVerifyOTP}
                      disabled={login.isPending || otpCode.join('').length < 4}
                      className="w-full py-3 rounded-xl font-condensed font-bold text-base tracking-wide transition-all duration-300 bg-gradient-to-r from-yellow-400 to-amber-500 text-sky-950 shadow-lg shadow-yellow-500/25 hover:shadow-xl hover:shadow-yellow-500/40 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                    >
                      {login.isPending ? (
                        <span className="flex items-center justify-center gap-2">
                          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                          Verifying...
                        </span>
                      ) : (
                        <span className="relative z-10 flex items-center justify-center gap-2">
                          Verify & Continue →
                        </span>
                      )}
                    </button>

                    <div className="text-center mt-3">
                      <button
                        type="button"
                        onClick={handleResendOTP}
                        disabled={resendCountdown > 0 || sendOtp.isPending}
                        className="text-white/60 text-xs font-semibold hover:text-white/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {resendCountdown > 0
                          ? `Resend in ${resendCountdown}s`
                          : sendOtp.isPending
                            ? 'Sending...'
                            : "Didn't receive? Resend OTP"}
                      </button>
                    </div>
                  </>
                )}

                {/* Step 3: Signup */}
                {step === 'signup' && (
                  <form onSubmit={handleSignup}>
                    <div className="text-center mb-4">
                      <span className="text-3xl mb-1.5 block" role="img" aria-label="wave">👋</span>
                      <h2 className="font-condensed font-bold text-white text-xl">Complete Your Profile</h2>
                      <p className="text-white/70 text-sm mt-0.5">One more step and you're on the start line</p>
                    </div>

                    <div className="bg-white/8 border border-white/10 rounded-xl px-4 py-2.5 mb-4">
                      <p className="text-white/60 text-xs">Verified number</p>
                      <p className="text-white font-semibold text-sm">+{formatPhone(phone)}</p>
                    </div>

                    <div className="mb-3 grid grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-white/80 text-xs font-bold uppercase tracking-wider mb-1.5">First Name</label>
                        <input
                          type="text"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          placeholder="John"
                          autoFocus
                          className="w-full bg-white/8 text-white text-base font-semibold px-4 py-3 outline-none placeholder-white/30 rounded-xl border border-white/10 focus:ring-2 focus:ring-yellow-400/50 transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-white/80 text-xs font-bold uppercase tracking-wider mb-1.5">Last Name</label>
                        <input
                          type="text"
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          placeholder="Doe"
                          className="w-full bg-white/8 text-white text-base font-semibold px-4 py-3 outline-none placeholder-white/30 rounded-xl border border-white/10 focus:ring-2 focus:ring-yellow-400/50 transition-all"
                        />
                      </div>
                    </div>

                    <div className="mb-3">
                      <label className="block text-white/80 text-xs font-bold uppercase tracking-wider mb-1.5">
                        Email Address <span className="text-white/40 normal-case font-semibold">(optional)</span>
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        className="w-full bg-white/8 text-white text-base font-semibold px-4 py-3 outline-none placeholder-white/30 rounded-xl border border-white/10 focus:ring-2 focus:ring-yellow-400/50 transition-all"
                      />
                    </div>

                    <div className="mb-3">
                      <label className="block text-white/80 text-xs font-bold uppercase tracking-wider mb-1.5">
                        Location <span className="text-white/40 normal-case font-semibold">(optional)</span>
                      </label>
                      <input
                        type="text"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        placeholder="e.g. Takoradi"
                        className="w-full bg-white/8 text-white text-base font-semibold px-4 py-3 outline-none placeholder-white/30 rounded-xl border border-white/10 focus:ring-2 focus:ring-yellow-400/50 transition-all"
                      />
                    </div>

                    <div className="mb-4">
                      <label className="block text-white/80 text-xs font-bold uppercase tracking-wider mb-1.5">Ghana Card Number</label>
                      <input
                        type="text"
                        value={ghanaCard}
                        onChange={handleGhanaCardChange}
                        placeholder="GHA-XXXXXXXXX-X"
                        className="w-full bg-white/8 text-white text-base font-semibold px-4 py-3 outline-none placeholder-white/30 rounded-xl border border-white/10 focus:ring-2 focus:ring-yellow-400/50 transition-all tracking-wider"
                      />
                      <p className="text-white/50 text-xs mt-1.5 px-0.5">Format: GHA-XXXXXXXXX-X</p>
                    </div>

                    <button
                      type="submit"
                      disabled={register.isPending || !firstName.trim() || firstName.length < 2 || !lastName.trim() || lastName.length < 2 || !ghanaCard.trim()}
                      className="w-full py-3 rounded-xl font-condensed font-bold text-base tracking-wide transition-all duration-300 bg-gradient-to-r from-yellow-400 to-amber-500 text-sky-950 shadow-lg shadow-yellow-500/25 hover:shadow-xl hover:shadow-yellow-500/40 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                    >
                      {register.isPending ? (
                        <span className="flex items-center justify-center gap-2">
                          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                          Creating account...
                        </span>
                      ) : (
                        <span className="relative z-10 flex items-center justify-center gap-2">
                          Create Account →
                        </span>
                      )}
                    </button>
                  </form>
                )}
              </div>
            </div>

            {/* Staff Login */}
            <div className="text-center mt-4">
              <button
                onClick={() => navigate('/login')}
                className="text-white/70 text-sm font-bold hover:text-white transition-colors underline underline-offset-4"
              >
                Staff Login →
              </button>
            </div>
          </div>

          {/* ═══════ DATE / VENUE ═══════ */}
          <div className="mb-5 slide-up" style={{ animationDelay: "0.20s" }}>
            <div className="flex justify-center relative z-10 -mb-3">
              <span className="bg-gradient-to-r from-yellow-400 to-amber-500 text-sky-950 font-condensed italic font-bold uppercase tracking-widest text-sm px-5 py-1 rounded-lg shadow-lg">
                Race Day
              </span>
            </div>
            <div className="bg-sky-900 border border-white/15 rounded-xl px-4 pb-2.5 pt-5">
              <div className="flex items-center justify-between gap-3">
                <div className="text-center flex-shrink-0">
                  <p className="text-yellow-300 font-bold text-[10px] uppercase tracking-wider">{EVENT.date.weekday}</p>
                  <p className="font-condensed font-bold text-white leading-none">
                    <span className="text-3xl">{EVENT.date.day}</span><span className="text-base align-top">{EVENT.date.daySuffix}</span>
                  </p>
                  <p className="font-condensed font-bold text-yellow-300 text-sm leading-tight">{EVENT.date.monthYear}</p>
                </div>

                <div className="w-px self-stretch bg-gradient-to-b from-transparent via-yellow-400/40 to-transparent flex-shrink-0" />

                <div className="text-center flex-1">
                  <p className="font-condensed font-bold text-white text-lg uppercase">{EVENT.city}</p>
                  <p className="text-white/70 font-bold text-[11px] uppercase tracking-wider -mt-0.5">Start & Finish · Wellness Village</p>
                  <p className="text-white/60 text-[11px] mt-0.5">{EVENT.venue}</p>
                </div>
              </div>
            </div>
          </div>

          {/* ═══════ REGISTRATION PACKAGES (live) ═══════ */}
          <div className="mb-5 slide-up" style={{ animationDelay: "0.26s" }}>
            <SectionTitle>Registration</SectionTitle>
            {packagesLoading ? (
              <p className="text-white/60 text-xs text-center py-4">Loading categories…</p>
            ) : packages.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {packages.map((pkg) => (
                  <div key={pkg.id} className={`${cardCls} text-center flex flex-col`}>
                    <p className="text-white/70 text-[11px] font-bold uppercase tracking-wider">{pkg.name}</p>
                    <p className="font-condensed font-bold text-white text-2xl mt-1">{renderPrice(pkg.price)}</p>
                    {pkg.merchandise.length > 0 && (
                      <div className="flex flex-wrap justify-center gap-1 mt-2">
                        {pkg.merchandise.map((item) => (
                          <span key={item.id} className="bg-white/10 border border-white/10 text-white/75 text-[10px] font-bold rounded-full px-2 py-0.5">
                            {item.name}
                          </span>
                        ))}
                      </div>
                    )}
                    {pkg.benefits && <p className="text-white/60 text-[11px] mt-2 leading-snug">{pkg.benefits}</p>}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-white/60 text-xs text-center">
                Registration opens {EVENT.registrationOpens}. Categories and prices will appear here.
              </p>
            )}
            <p className="text-white/70 text-xs text-center mt-2.5 leading-relaxed">🏢 {CORPORATE_TEAM_NOTE}</p>
          </div>

          {/* ═══════ WHAT YOU GET ═══════ */}
          <div className="mb-5 slide-up" style={{ animationDelay: "0.30s" }}>
            <SectionTitle>Every Registrant Gets</SectionTitle>
            <ul className={`${cardCls} grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-1.5`}>
              {REGISTRATION_INCLUDES.map((item) => (
                <li key={item} className="text-white/85 text-xs font-semibold flex gap-1.5">
                  <span className="text-yellow-300">✓</span>{item}
                </li>
              ))}
            </ul>
          </div>

          {/* ═══════ REWARDS (from package prizes) ═══════ */}
          <div className="mb-5 slide-up" style={{ animationDelay: "0.34s" }}>
            <SectionTitle>Rewards</SectionTitle>
            <div className={`${cardCls} text-center`}>
              {prizePackages.map((pkg) => (
                <div key={pkg.id} className="mb-2.5">
                  <p className="text-white/70 text-[11px] font-bold uppercase tracking-wider mb-1">{pkg.name}</p>
                  <p className="text-yellow-300 text-sm font-bold">
                    {[...pkg.prizes]
                      .sort((a, b) => (a.position ?? 99) - (b.position ?? 99))
                      .map((prize) => `${prizeMedal(prize.position)} ${prize.amount ? renderPrice(prize.amount) : prize.name}`)
                      .join('  ·  ')}
                  </p>
                  {pkg.prizes.some((prize) => prize.description) && (
                    <p className="text-white/55 text-[11px] mt-0.5">
                      {pkg.prizes.find((prize) => prize.description)?.description}
                    </p>
                  )}
                </div>
              ))}
              <p className="text-white/70 text-xs leading-relaxed">
                Top finishers in each race category are recognized at the awards ceremony, and every finisher takes home a medal.
              </p>
            </div>
          </div>

          {/* ═══════ ROUTE & HYDRATION ═══════ */}
          <div className="mb-5 slide-up" style={{ animationDelay: "0.38s" }}>
            <SectionTitle>Route & Hydration</SectionTitle>
            <div className={`${cardCls} space-y-2`}>
              <p className="text-white/85 text-xs leading-relaxed"><span className="mr-1">🌊</span>{EVENT_ROUTE}</p>
              <p className="text-white/85 text-xs leading-relaxed"><span className="mr-1">💧</span>{EVENT_HYDRATION}</p>
            </div>
          </div>

          {/* ═══════ WELLNESS VILLAGE ═══════ */}
          <div className="mb-5 slide-up" style={{ animationDelay: "0.42s" }}>
            <SectionTitle>Post-Race Wellness Village</SectionTitle>
            <ul className={`${cardCls} space-y-1.5`}>
              {WELLNESS_VILLAGE.map((item) => (
                <li key={item} className="text-white/85 text-xs font-semibold flex gap-1.5">
                  <span className="text-yellow-300">•</span>{item}
                </li>
              ))}
            </ul>
          </div>

          {/* ═══════ WEEKEND PACKAGE (live add-ons) ═══════ */}
          {addOns.length > 0 && (
            <div className="mb-5 slide-up" style={{ animationDelay: "0.44s" }}>
              <SectionTitle>Travelling? Weekend Package</SectionTitle>
              <div className={`${cardCls} space-y-3`}>
                <div className="flex flex-wrap justify-center gap-1.5">
                  {WEEKEND_BUNDLES.filter((b) => b.id !== 'race').map((bundle) => (
                    <span key={bundle.id} className="bg-white/10 border border-white/15 rounded-full px-2.5 py-0.5 text-white/85 text-[10px] font-bold uppercase tracking-wider">
                      {bundle.label}
                    </span>
                  ))}
                </div>
                <ul className="space-y-1.5">
                  {addOns.map((addOn) => (
                    <li key={addOn.id} className="flex items-center justify-between gap-3 text-xs">
                      <span className="text-white/85 font-semibold">
                        {addOn.type === 'accommodation' ? '🏨' : '🚌'} {describeAddOn(addOn)}
                      </span>
                      <span className="text-yellow-300 font-bold whitespace-nowrap">
                        {addOn.remaining === 0 ? 'Fully booked' : `${renderPrice(addOn.price)}/person`}
                      </span>
                    </li>
                  ))}
                </ul>
                <p className="text-white/60 text-[11px] text-center">Add it to your registration when you sign up.</p>
              </div>
            </div>
          )}

          {/* ═══════ VEST SIZE GUIDE ═══════ */}
          <div className="slide-up" style={{ animationDelay: "0.46s" }}>
            <SectionTitle>Race Vest Size Guide</SectionTitle>
            <div className={cardCls}>
              <VestSizeTable tone="dark" />
            </div>
          </div>

        </div>

        {/* Shoreline */}
        <div className="relative h-10 -mt-2 pointer-events-none">
          <svg viewBox="0 0 400 40" preserveAspectRatio="none" className="absolute inset-0 w-full h-full opacity-40">
            <path d="M0 40 L0 22 Q50 8 100 22 T200 22 T300 22 T400 22 L400 40 Z" fill="#155e75" />
            <path d="M0 40 L0 30 Q50 18 100 30 T200 30 T300 30 T400 30 L400 40 Z" fill="#0c4a6e" />
          </svg>
        </div>

        {/* Bottom strip */}
        <div className="h-2 bg-gradient-to-r from-yellow-400 via-cyan-400 to-yellow-400" />
      </div>
    </div>
  );
}
