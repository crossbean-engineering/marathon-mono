export type PaymentStatus = 'pending' | 'completed' | 'failed';
export type PaymentNetwork = 'MTN' | 'VODAFONE' | 'AIRTELTIGO';
// How a settlement was satisfied. `waived` covers registrations settled without
// money moving — e.g. a 100%-off coupon.
export type PaymentMethod = 'card' | 'momo' | 'cash' | 'waived';

export type BasePayment = {
  id: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  provider: string;
  gateway: string;
  orderId: string;
  transactionId: string;
  // Channel-specific: set only when paymentMethod is 'momo', null otherwise.
  momoNumber: string | null;
  network: PaymentNetwork | null;
  paymentMethod: PaymentMethod;
  email?: string | null;
  reason?: string | null;
  requiresAttention: boolean;
  performedBy: string;
  confirmedAt?: string | null;
  createdAt: string;
};

export type ListPaymentsQuery = {
  method?: PaymentMethod;
  status?: PaymentStatus;
};

export type VerifyPaymentBody = { transactionId: string };
export type VerifyPaymentResponse = { status: PaymentStatus };

export type CollectionCallbackBody = { orderId: string };
export type CollectionCallbackResponse = { received: true };
