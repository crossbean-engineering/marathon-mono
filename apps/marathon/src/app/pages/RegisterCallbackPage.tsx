import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle2, XCircle, Receipt, CreditCard, Clock } from 'lucide-react';
import ThemeLogo from '../components/ThemeLogo';
import { useAkMarathonMutation } from '@ak-marathon/sdk';
import { normalizePaymentStatus } from '../utils';

interface PaymentDetails {
  statusCode: string | null;
  statusMessage: string | null;
  transRefNo: string | null;
  orderId: string | null;
  paymentMode: string | null;
  reason: string | null;
  signature: string | null;
}

export default function RegisterCallbackPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [paymentDetails, setPaymentDetails] = useState<PaymentDetails>({
    statusCode: null,
    statusMessage: null,
    transRefNo: null,
    orderId: null,
    paymentMode: null,
    reason: null,
    signature: null,
  });

  const [verifiedSuccess, setVerifiedSuccess] = useState<boolean | null>(null);
  const [verifying, setVerifying] = useState(false);

  const verifyTxn = useAkMarathonMutation('verifyPayment');

  // Parse URL params once
  useEffect(() => {
    setPaymentDetails({
      statusCode: searchParams.get('status_code'),
      statusMessage: searchParams.get('status_message'),
      transRefNo: searchParams.get('trans_ref_no'),
      orderId: searchParams.get('order_id'),
      paymentMode: searchParams.get('payment_mode'),
      reason: searchParams.get('reason'),
      signature: searchParams.get('signature'),
    });
  }, [searchParams]);

  const handleVerifyPayment = async () => {
    if (!paymentDetails.orderId) return;

    try {
      setVerifying(true);

      const res = await verifyTxn.mutateAsync({
        body: { transactionId: paymentDetails.orderId },
      });

      const success = normalizePaymentStatus(res?.status) === 'success';

      setVerifiedSuccess(success);

      setPaymentDetails(prev => ({
        ...prev,
        statusMessage: success
          ? 'Successful'
          : 'Payment verification failed',
      }));
    } catch (error) {
      console.error(error);
      setVerifiedSuccess(false);
    } finally {
      setVerifying(false);
    }
  };

  const isSuccess = verifiedSuccess === true;
  const isFailure = verifiedSuccess === false;

  return (
    <>
      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <ThemeLogo />
        </div>
      </header>

      {/* Main */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="max-w-2xl mx-auto">
          <div className="bg-card rounded-2xl shadow-xl p-8 md:p-12 border border-border text-center">

            {/* ===== Status Section ===== */}
            {verifiedSuccess === null && (
              <>
                <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-3">
                  Payment Processing
                </h2>
                <p className="text-muted-foreground text-lg mb-8">
                  Click the button below to verify your payment.
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
                <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-3">
                  Payment Successful!
                </h2>
                <p className="text-muted-foreground text-lg mb-8">
                  Your ticket has been purchased successfully.
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
                <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-3">
                  Payment Failed
                </h2>
                <p className="text-muted-foreground text-lg mb-8">
                  Verification failed. Please retry.
                </p>
              </>
            )}

            {/* ===== Transaction Details ===== */}
            <div className="bg-background rounded-xl p-6 mb-8 text-left">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">
                Transaction Details
              </h3>

              <div className="space-y-3">
                {paymentDetails.orderId && (
                  <div className="flex items-start gap-3">
                    <Receipt className="w-5 h-5 text-olive mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">Order ID</p>
                      <p className="font-mono text-sm font-medium text-foreground">
                        {paymentDetails.orderId}
                      </p>
                    </div>
                  </div>
                )}

                {paymentDetails.paymentMode && (
                  <div className="flex items-start gap-3">
                    <CreditCard className="w-5 h-5 text-olive mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">Payment Method</p>
                      <p className="font-medium text-foreground">
                        {paymentDetails.paymentMode}
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-olive mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <p className="font-medium text-foreground">
                      {verifiedSuccess === null
                        ? 'Pending Verification'
                        : isSuccess
                        ? 'Successful'
                        : 'Failed'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* ===== Action Buttons ===== */}
            <div className="flex flex-col sm:flex-row gap-3">

              {verifiedSuccess === null && (
                <button
                  onClick={handleVerifyPayment}
                  disabled={verifying || !paymentDetails.orderId}
                  className="flex-1 py-3 bg-olive text-primary-foreground rounded-lg font-semibold hover:bg-olive/90 transition-colors disabled:opacity-50"
                >
                  {verifying ? 'Verifying Payment...' : 'Verify Payment'}
                </button>
              )}

              {isSuccess && (
                <>
                  <button
                    onClick={() => navigate('/dashboard')}
                    className="flex-1 py-3 bg-olive text-primary-foreground rounded-lg font-semibold hover:bg-olive/90 transition-colors"
                  >
                    Go to Dashboard
                  </button>
                  <button
                    onClick={() => navigate('/')}
                    className="flex-1 py-3 border border-border rounded-lg font-medium hover:bg-muted transition-colors"
                  >
                    Back to Home
                  </button>
                </>
              )}

              {isFailure && (
                <>
                  <button
                    onClick={handleVerifyPayment}
                    disabled={verifying}
                    className="flex-1 py-3 bg-olive text-primary-foreground rounded-lg font-semibold hover:bg-olive/90 transition-colors"
                  >
                    Retry Verification
                  </button>
                  <button
                    onClick={() => navigate('/support')}
                    className="flex-1 py-3 border border-border rounded-lg font-medium hover:bg-muted transition-colors"
                  >
                    Contact Support
                  </button>
                </>
              )}
            </div>

            {isSuccess && (
              <div className="mt-8 pt-8 border-t border-border">
                <p className="text-sm text-muted-foreground">
                  Your ticket code has been sent via SMS. Present it at the gate.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
