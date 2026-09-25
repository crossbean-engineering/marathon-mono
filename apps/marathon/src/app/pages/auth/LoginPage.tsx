import { useAkMarathonMutation } from '@ak-marathon/sdk';
import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ApiDomainError } from '@rabstack/rab-react-sdk';
import { useAuth } from '../../contexts/AuthContext';
import { getDashboardPath, normalizeGhPhone, ghPhoneError, isValidGhPhone, toGhIntlPhone } from '../../utils';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();


  const { login: authLogin , user, isAuthenticated} = useAuth();
  const [step, setStep] = useState<'contact' | 'otp'>('contact');
  const [contact, setContact] = useState('');

  const [otpCode, setOtpCode] = useState('');
  const [otpSessionId, setOtpSessionId] = useState('');
  const [otpError, setOtpError] = useState<string | null>(null);
  
  // Resend OTP timer
  const [resendCountdown, setResendCountdown] = useState(0);


  const from = location.state?.from?.pathname;

  useEffect(()=>{
    if(isAuthenticated && user) {
      navigate(from || getDashboardPath(user.role), { replace: true });
    } 
  }, [isAuthenticated, user, navigate, from])

  // Countdown timer effect
  useEffect(() => {
    if (resendCountdown <= 0) return;
    const timer = setTimeout(() => setResendCountdown(resendCountdown - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCountdown]);

  const sendOtp = useAkMarathonMutation("sendOTP", {
    onSuccess: (response) => {
      console.log("OTP sent", response);
      if (response?.sessionId) {
        setOtpSessionId(response.sessionId);
        setStep('otp');
        setResendCountdown(30); // Start 30 second countdown
        toast.success('OTP sent successfully');
      }
    },
    onError: (error) => {
      console.log("Error sending OTP", error);
      toast.error('Failed to send OTP. Please try again.');
    }
  });

  const login = useAkMarathonMutation("login", {
    onSuccess: (response) => {
      const {accessToken, user} = response
      authLogin(accessToken, user)

      toast.success('Login successful!');

      if(from) {
        navigate(from, {replace: true})
      } else {
        navigate(getDashboardPath(user.role));
      }
    },
    onError: (error: ApiDomainError) => {
      console.log("Login failed", error);
      const message = error?.message || error.getDisplayMessage() || "Login failed. Please try again.";
      setOtpError(message);
      toast.error(message);
    }
  });

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();

    const phoneError = ghPhoneError(contact);
    if (phoneError) {
      toast.error(phoneError);
      return;
    }

    await sendOtp.mutateAsync({
      body: {
        identifier: toGhIntlPhone(contact),
        provider: 'sms'
      }
    });
  };

  const handleResendOTP = async () => {
    if (resendCountdown > 0) return;

    await sendOtp.mutateAsync({
      body: {
        identifier: toGhIntlPhone(contact),
        provider: 'sms'
      }
    });
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!otpCode || otpCode.length < 4) {
      toast.error('Please enter a valid OTP');
      return;
    }

    if (!otpSessionId) {
      toast.error('Session expired. Please request a new OTP');
      setStep('contact');
      return;
    }

    await login.mutateAsync({
      body: {
        phone: toGhIntlPhone(contact),
        otpSessionId: otpSessionId,
        otp: otpCode
      }
    });
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#04150e] p-4 relative overflow-hidden">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fredoka:wght@400;500;600;700&family=Nunito:wght@400;600;700;800;900&display=swap');
        .font-fredoka { font-family: 'Fredoka', sans-serif; }
        * { font-family: 'Nunito', sans-serif; }
        @keyframes shimmer { 0% { background-position: -200% center; } 100% { background-position: 200% center; } }
        .shimmer-text {
          background: linear-gradient(90deg, #FDE047 0%, #FBBF24 25%, #FDE047 50%, #F59E0B 75%, #FDE047 100%);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: shimmer 3s linear infinite;
        }
      `}</style>

      {/* Dawn glow */}
      <div className="absolute top-0 inset-x-0 h-72 pointer-events-none" style={{ background: "radial-gradient(ellipse 90% 60% at 50% -10%, rgba(251,191,36,0.15), transparent 65%)" }} />

      {/* Faint ridge silhouette */}
      <div className="absolute inset-x-0 bottom-0 h-40 pointer-events-none opacity-[0.15]">
        <svg viewBox="0 0 400 120" preserveAspectRatio="none" className="w-full h-full">
          <path d="M0 120 L0 70 L60 30 L110 60 L170 15 L230 50 L290 25 L350 55 L400 35 L400 120 Z" fill="#34d399" />
          <path d="M0 120 L0 90 L70 55 L140 80 L210 45 L280 75 L340 55 L400 78 L400 120 Z" fill="#065f46" />
        </svg>
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Back to Home */}
        <button
          onClick={() => navigate('/')}
          className="mb-6 text-white/60 hover:text-white flex items-center gap-2 transition-colors text-sm font-semibold"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Home
        </button>

        {/* Wordmark */}
        <div className="text-center mb-6">
          <h1 className="font-fredoka font-bold leading-none">
            <span className="block text-xl text-white tracking-tight">WESTERN CITY</span>
            <span className="block text-3xl shimmer-text tracking-tight">RUN</span>
          </h1>
          <p className="text-yellow-300/80 text-[10px] font-bold uppercase tracking-widest mt-1.5">Staff Portal</p>
        </div>

        {/* Login Card */}
        <div className="bg-emerald-900 rounded-2xl shadow-2xl p-8 border border-white/15 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />

          {/* Heading */}
          <div className="mb-8">
            <h2 className="text-2xl font-fredoka font-bold text-white text-center">
              🎫 Staff Login
            </h2>
          </div>

          {/* Step 1: Enter Contact */}
          {step === 'contact' && (
            <form onSubmit={handleSendOTP} className="space-y-6">
              <div>
                <label className="block text-white/80 text-xs font-bold uppercase tracking-wider mb-1.5">
                  Phone Number
                </label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 rounded-l-xl border border-r-0 border-white/10 bg-white/10 text-sm font-semibold text-white/70">
                    🇬🇭 +233
                  </span>
                  <input
                    type="tel"
                    required
                    value={contact}
                    inputMode="numeric"
                    onChange={(e) => setContact(normalizeGhPhone(e.target.value))}
                    className="w-full px-4 py-3 bg-white/8 text-white font-semibold border border-white/10 rounded-r-xl placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-yellow-400/50 transition-all"
                    placeholder="24XXXXXXX"
                    maxLength={10}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={sendOtp.isPending || !isValidGhPhone(contact)}
                className="w-full py-3 rounded-xl font-fredoka font-bold text-base tracking-wide bg-gradient-to-r from-yellow-400 to-amber-500 text-emerald-900 shadow-lg shadow-yellow-500/25 hover:shadow-xl hover:shadow-yellow-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 disabled:opacity-50 disabled:hover:scale-100"
              >
                {sendOtp.isPending ? 'Sending...' : 'Send OTP'}
              </button>
            </form>
          )}

          {/* Step 2: Verify OTP */}
          {step === 'otp' && (
            <form onSubmit={handleVerifyOTP} className="space-y-6">
              <div className="bg-white/8 border border-white/10 rounded-xl p-4 mb-6">
                <p className="text-white/60 text-xs">
                  OTP sent to
                </p>
                <p className="font-semibold text-white text-sm">
                  +{toGhIntlPhone(contact)}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setStep('contact');
                    setOtpCode('');
                    setOtpError(null);
                  }}
                  className="text-yellow-400 text-xs font-bold mt-2 hover:underline underline-offset-2"
                >
                  Change
                </button>
              </div>

              <div>
                <label className="block text-white/80 text-xs font-bold uppercase tracking-wider mb-1.5">
                  Enter OTP
                </label>
                <input
                  type="text"
                  required
                  value={otpCode}
                  onChange={(e) => {
                    setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6));
                    setOtpError(null);
                  }}
                  className={`w-full px-4 py-3 bg-white/8 text-white border rounded-xl text-center text-2xl font-bold tracking-widest placeholder-white/20 focus:outline-none focus:ring-2 transition-all ${
                    otpError
                      ? 'border-red-400 focus:ring-red-400/30'
                      : 'border-white/10 focus:ring-yellow-400/50'
                  }`}
                  placeholder="000000"
                  maxLength={6}
                  autoFocus
                />
                {otpError && (
                  <p className="text-red-300 text-xs font-semibold mt-2 text-center">{otpError}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={login.isPending || !otpCode}
                className="w-full py-3 rounded-xl font-fredoka font-bold text-base tracking-wide bg-gradient-to-r from-yellow-400 to-amber-500 text-emerald-900 shadow-lg shadow-yellow-500/25 hover:shadow-xl hover:shadow-yellow-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 disabled:opacity-50 disabled:hover:scale-100"
              >
                {login.isPending ? 'Verifying...' : 'Verify & Login'}
              </button>

              <button
                type="button"
                onClick={handleResendOTP}
                disabled={resendCountdown > 0 || sendOtp.isPending}
                className="w-full text-xs font-semibold text-white/60 hover:text-white/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {resendCountdown > 0
                  ? `Resend OTP in ${resendCountdown}s`
                  : sendOtp.isPending
                    ? 'Sending...'
                    : "Didn't receive code? Resend"}
              </button>
            </form>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-white/60 mt-6">
          Don't have an account?{' '}
          <button onClick={() => navigate('/')} className="text-yellow-400 hover:text-yellow-300 font-bold">
            Register here
          </button>
        </p>
      </div>
    </div>
  );
}