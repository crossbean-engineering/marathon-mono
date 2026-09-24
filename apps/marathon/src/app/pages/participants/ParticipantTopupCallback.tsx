import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle2, XCircle, Receipt, CreditCard, Clock, Loader2 } from 'lucide-react';
import { useAkMarathonMutation } from '@ak-marathon/sdk';
import { toast } from 'sonner';
import { AuthHeader } from '../../components/AuthHeader';
import { normalizePaymentStatus } from '../../utils';

// Keep polling while the momo prompt is unapproved: every 5s, up to ~1 minute.
const POLL_INTERVAL_MS = 5000;
const MAX_AUTO_ATTEMPTS = 12;

type VerifyState = 'verifying' | 'pending' | 'success' | 'failed';

export default function ParticipantTopUpCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const orderId = searchParams.get('order_id');
  const transRefNo = searchParams.get('trans_ref_no');
  const paymentMode = searchParams.get('payment_mode');
  const reason = searchParams.get('reason');

  const [state, setState] = useState<VerifyState>('verifying');
  const isMounted = useRef(true);
  const isRunning = useRef(false);

  const { mutateAsync: verifyTxn } = useAkMarathonMutation('verifyPayment');

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Single awaited poll loop (mirrors gift-registry's usePaymentStatusChecker):
  // the isRunning guard prevents overlapping chains (StrictMode remounts,
  // button clicks), and isMounted stops the loop once the page is gone.
  const runVerification = useCallback(async () => {
    if (!orderId) {
      toast.error('No transaction ID found');
      setState('failed');
      return;
    }
    if (isRunning.current) return;
    isRunning.current = true;

    setState('verifying');
    try {
      for (let i = 0; i < MAX_AUTO_ATTEMPTS; i++) {
        if (!isMounted.current) return;
        try {
          const res = await verifyTxn({
            body: { transactionId: orderId },
          });
          if (!isMounted.current) return;

          const status = normalizePaymentStatus(res?.status);
          if (status === 'success') {
            setState('success');
            toast.success('Payment confirmed — your pass is ready!');
            return;
          }
          if (status === 'failed') {
            setState('failed');
            toast.error('Payment failed');
            return;
          }
          // Still pending — the participant may not have approved the prompt yet
          setState('pending');
        } catch (error) {
          // Transient error — keep waiting
          console.error('Verification error:', error);
          if (isMounted.current) setState('pending');
        }
        if (i < MAX_AUTO_ATTEMPTS - 1) {
          await new Promise<void>((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
        }
      }
    } finally {
      isRunning.current = false;
    }
  }, [orderId, verifyTxn]);

  // Auto-verify on arrival
  useEffect(() => {
    runVerification();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isSuccess = state === 'success';
  const isFailure = state === 'failed';
  const isWaiting = state === 'verifying' || state === 'pending';

  return (
    <div className="min-h-screen bg-gradient-to-br from-cream via-background to-cream-dark">
      <AuthHeader />

      <section className="container mx-auto px-4 py-12 md:py-16">
        <div className="max-w-2xl mx-auto">
          <div className="bg-card rounded-2xl shadow-xl p-8 md:p-12 border border-border text-center">

            {/* Status Section */}
            {isWaiting && (
              <>
                <div className="mb-6 flex justify-center">
                  <div className="w-20 h-20 bg-olive/10 rounded-full flex items-center justify-center">
                    <Loader2 className="w-12 h-12 text-olive animate-spin" />
                  </div>
                </div>
                <h2 className="text-3xl md:text-4xl font-display font-bold mb-3">
                  {state === 'verifying' ? 'Verifying Payment' : 'Waiting for Approval'}
                </h2>
                <p className="text-muted-foreground text-lg mb-8">
                  {state === 'verifying'
                    ? 'Please wait while we confirm your payment…'
                    : 'Approve the mobile money prompt on your phone — we\'ll confirm automatically.'}
                </p>
              </>
            )}

            {isSuccess && (
              <>
                <div className="mb-6 flex justify-center">
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle2 className="w-12 h-12 text-green-600" />
                  </div>
                </div>
                <h2 className="text-3xl md:text-4xl font-display font-bold mb-3">
                  Payment Successful!
                </h2>
                <p className="text-muted-foreground text-lg mb-8">
                  Your pass has been purchased successfully.
                </p>
              </>
            )}

            {isFailure && (
              <>
                <div className="mb-6 flex justify-center">
                  <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
                    <XCircle className="w-12 h-12 text-red-600" />
                  </div>
                </div>
                <h2 className="text-3xl md:text-4xl font-display font-bold mb-3">
                  Payment Failed
                </h2>
                <p className="text-muted-foreground text-lg mb-8">
                  {reason || 'Verification failed. Please try again.'}
                </p>
              </>
            )}

            {/* Transaction Details */}
            <div className="bg-background rounded-xl p-6 mb-8 text-left">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">
                Transaction Details
              </h3>

              <div className="space-y-3">
                {orderId && (
                  <div className="flex items-start gap-3">
                    <Receipt className="w-5 h-5 text-olive mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground">Order ID</p>
                      <p className="font-mono text-sm font-medium text-foreground break-all">
                        {orderId}
                      </p>
                    </div>
                  </div>
                )}

                {transRefNo && (
                  <div className="flex items-start gap-3">
                    <Receipt className="w-5 h-5 text-olive mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground">Transaction Reference</p>
                      <p className="font-mono text-sm font-medium text-foreground">
                        {transRefNo}
                      </p>
                    </div>
                  </div>
                )}

                {paymentMode && (
                  <div className="flex items-start gap-3">
                    <CreditCard className="w-5 h-5 text-olive mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">Payment Method</p>
                      <p className="font-medium text-foreground">
                        {paymentMode}
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-olive mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <p className={`font-medium ${
                      isWaiting ? 'text-yellow-600' : isSuccess ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {state === 'verifying'
                        ? 'Verifying…'
                        : state === 'pending'
                        ? 'Waiting for approval'
                        : isSuccess
                        ? 'Successful'
                        : 'Failed'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              {isWaiting && (
                <button
                  onClick={() => runVerification()}
                  disabled={state === 'verifying'}
                  className="flex-1 py-3 border border-border rounded-lg font-medium hover:bg-muted transition-colors disabled:opacity-50"
                >
                  {state === 'verifying' ? 'Verifying…' : 'Check Now'}
                </button>
              )}

              {isSuccess && (
                <button
                  onClick={() => navigate('/participant')}
                  className="flex-1 py-3 bg-olive text-primary-foreground rounded-lg font-semibold hover:bg-olive/90 transition-colors"
                >
                  View My Passes
                </button>
              )}

              {isFailure && (
                <>
                  <button
                    onClick={() => runVerification()}
                    className="flex-1 py-3 bg-olive text-primary-foreground rounded-lg font-semibold hover:bg-olive/90 transition-colors"
                  >
                    Retry Verification
                  </button>
                  <button
                    onClick={() => navigate('/participant')}
                    className="flex-1 py-3 border border-border rounded-lg font-medium hover:bg-muted transition-colors"
                  >
                    Back to Dashboard
                  </button>
                </>
              )}
            </div>

            {/* Success Footer */}
            {isSuccess && (
              <div className="mt-8 pt-8 border-t border-border">
                <p className="text-sm text-muted-foreground">
                  Your pass is on your dashboard. Show its redemption code at the counter to get your wristband.
                </p>
              </div>
            )}

            {/* Help Text */}
            {isFailure && (
              <div className="mt-8 pt-8 border-t border-border">
                <p className="text-sm text-muted-foreground">
                  If you believe this is an error, please contact support with your transaction reference number.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
