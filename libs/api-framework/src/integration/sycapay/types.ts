export type SycaPayOperator = 'Mtn' | 'Moov' | 'Orange' | 'Wave';

export type SycaPayConfig = {
  merchantId: string;
  apiKey: string;
};

export interface SycaPayAuthRequest {
  montant: string;
  currency: string;
}

export interface SycaPayAuthResponse {
  code: number;
  token: string;
  desc: string;
  amount?: string;
  custumer_name?: string;
  customer_logo?: string;
}

export interface SycaPayPaymentRequest {
  marchandid: string;
  token: string;
  telephone: string;
  name?: string;
  pname?: string;
  urlnotif?: string;
  montant: string;
  currency: string;
  numcommande: string;
  pays: 'CI';
  operateurs: SycaPayOperator;
}

export interface SycaPayPaymentResponse {
  code: number;
  message: string;
  description?: string;
  url?: string;
  transactionId: string;
  paiementId?: string;
  mobile: string;
  orderId: string;
  amount: string;
}

export interface SycaPayStatusResponse {
  code: number;
  message: string;
  montant?: string;
  amount?: string;
  orderId?: string;
  transactionID?: string;
  paiementId?: string | null;
  mobile?: string;
  date?: string;
  operator?: string;
}

export const SycaPayStatusCodes = {
  SUCCESS: 0,
  PENDING: -200,
  FAILED: -1,
  MERCHANT_NOT_FOUND: -2,
  INSUFFICIENT_BALANCE: -3,
  SERVICE_UNAVAILABLE: -4,
  OTP_FAILED: -5,
  TRANSACTION_COMPLETED: -6,
  INVALID_PARAMS: -7,
  TIMEOUT: -8,
  STATUS_NOT_AVAILABLE: -9,
  TOKEN_UNDEFINED: -11,
  MERCHANT_ID_UNDEFINED: -12,
  OPERATOR_UNDEFINED: -13,
  AUTH_ERROR: -14,
  SESSION_TIMEOUT: -15,
  INVALID_MERCHANT_ID: -16,
  INVALID_REQUEST: -18,
} as const;

export interface SycaPayInitiateInput {
  amount: number;
  currency: string;
  phoneNumber: string;
  operator: SycaPayOperator;
  orderId: string;
  customerName?: string;
  notificationUrl?: string;
}

export interface SycaPayInitiateOutput {
  orderId: string;
  providerTransactionId: string;
  redirectUrl?: string;
  request: SycaPayPaymentRequest;
  response: SycaPayPaymentResponse;
}
