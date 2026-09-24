// === Config ===

export type MojoPayConfig = {
  appId: string;
  apiKey: string;
  ddAppId?: string;
  ddAppKey?: string;
};

// === Payment Status / Method (generic) ===

export type PaymentStatus = 'pending' | 'completed' | 'failed';
export type PaymentMethod = 'momo' | 'card' | 'cash';
export type MandateStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'cancelled'
  | 'expired';

// === Initiate Payment ===

export interface MojoPayInitiatePaymentRequest {
  app_id: string;
  app_key: string;
  name?: string;
  // Optional: the hosted checkout collects payment details itself, so a card
  // payer need not have given us a phone number. Unverified against MojoPay —
  // see the card contribution flow.
  mobile?: string;
  email?: string;
  feetypecode: string;
  currency: string;
  amount: number;
  order_id: string;
  order_desc: string;
  return_url: string;
}

export interface MojoPayInitiatePaymentResponse {
  status_code: number;
  status_message: string;
  trans_ref_no: number;
  Token: string;
  redirect_url: string;
}

export interface InitiatePaymentResult {
  response: MojoPayInitiatePaymentResponse;
  request: MojoPayInitiatePaymentRequest;
}

// === Invoice Status ===

export interface MojoPayInvoiceStatusRequest {
  app_id: string;
  app_key: string;
  order_id: string;
}

export enum MojoPayStatusMessage {
  PENDING = 'PENDING',
  PAID_BY_CLIENT = 'PAID BY CLIENT',
  FAILED = 'FAILED',
}

export enum MojoPayPaymentMode {
  MTN = 'MTN',
  AIRTELTIGO = 'AIRTELTIGO',
  MASTER = 'MASTER',
  VODAFONE = 'VODAFONE',
}

export interface MojoPayInvoiceStatusResponse {
  status_code: number;
  status_message: MojoPayStatusMessage;
  amount: number;
  payment_mode: MojoPayPaymentMode;
  order_id: string;
  trans_ref_no: string;
  account_no: string;
  status_desc: string;
  systeM_TRANS_ID: number;
  telcO_TRANSACTION_ID: string;
  telcO_TRANSACTION_DATE: string;
  reason: string;
  message?: string | null;
}

// === Collection Init Payment ===

export interface CollectionInitPaymentRequest {
  CustomerName?: string;
  Network: string;
  Mobile: string;
  Email?: string;
  FeeTypeCode?: string;
  Currency: string;
  CountryCode: string;
  Amount: number;
  OrderId: string;
  OrderDesc: string;
}

export interface CollectionInitPaymentResponse {
  statusCode: string;
  statusMessage: string;
  transactionId: number;
}

// === Collection Query Status ===

export interface CollectionStatusResponse {
  statusCode: string;
  statusMessage: string;
  transactionId: number;
  orderId: string;
  paymentMode: string;
  remarks: string;
  orderAmount: number;
  netAmount: number;
  netAmountDetails: {
    baseAmount: number;
    serviceCharge: number;
    taxCharges: number;
    otherCharges: number;
  };
}

// === Collection Callback ===

export interface CollectionCallbackPayload {
  statusCode: string;
  statusMessage: string;
  transactionId: string;
  orderId: string;
  mobile: string;
  remarks: string;
  signature?: string;
  orderAmount: number;
  netAmount: number;
  netAmountDetails: {
    baseAmount: number;
    serviceCharge: number;
    taxCharges: number;
    otherCharges: number;
  };
}

export const CollectionStatusCodes = {
  SUBMITTED: 'CL-00-REQUEST-SUBMITTED',
  PENDING: 'CL-00-TRANSACTION-PENDING',
  SUCCESS: 'CL-01-SUCCESSFULLY-PROCESSED',
  FAILED: 'CL-02-TRANSACTION-FAILED',
  EXPIRED: 'CL-03-TRANSACTION-EXPIRED',
  CANCELLED: 'CL-04-TRANSACTION-CANCELLED-DECLINED',
} as const;

// === Direct Debit Auth ===

export interface DDAuthResponse {
  AccessToken: string;
  TokenType: string;
  ExpiresIn: number;
  IssuedAt: number;
  ExpiresAt: number;
  Status: string;
  Message: string;
}

// === Direct Debit Mandate ===

export interface CreateMandateRequest {
  Mobile: string;
  Network: string;
  Amount: number;
  Currency: string;
  Frequency: string;
  FeeType: string;
  Country: string;
  StartDate: string;
  EndDate: string;
  DayOfDebit?: number;
  PlatformScheduling: boolean;
  Data: {
    MerchantReferenceId: string;
    Description: string;
  };
}

export interface CreateMandateResponse {
  StatusCode: string;
  StatusMessage: string;
  MessageId: string;
}

export interface MandateStatusResponse {
  Status: string;
  MandateId: string;
  Mandate: {
    MerchantReferenceId: string;
    Mobile: string;
    Network: string;
    Frequency: string;
    Narration: string;
    PlatformScheduling: boolean;
  };
  StatusCode: string;
  StatusMessage: string;
}

export interface CancelMandateRequest {
  Mobile: string;
  MandateId: string;
  Reason: string;
}

export interface CancelMandateResponse {
  StatusCode: string;
  StatusMessage: string;
  MessageId: string;
}

// === Direct Debit Payment Status ===

export interface DDPaymentStatusRequest {
  MandateId: string;
  TransactionReferenceId: string;
}

export interface DDPaymentStatusResponse {
  StatusCode: string;
  StatusMessage: string;
  TransactionId: number;
}

// === Direct Debit Callbacks ===

export type DDCallbackOperation =
  | 'MANDATE_REQUEST'
  | 'CANCEL_MANDATE'
  | 'DIRECT_DEBIT_PAYMENT';

export interface DDCallbackPayload {
  Operation: DDCallbackOperation;
  Payload: {
    MandateId?: string;
    SystemId?: string;
    Date: string;
    StatusCode: string;
    StatusMessage: string;
    Status?: string;
    Data: {
      Mobile: string;
      Network?: string;
      Amount: number;
      MerchantReferenceId: string;
    };
  };
}

export const DDStatusCodes = {
  SUCCESSFUL: 'DD_SUCCESSFUL',
  FAILED: 'DD_FAILED',
  PENDING: 'DD_PENDING',
  IN_PROCESS: 'DD_IN_PROCESS',
  ACCEPTED: 'DD_ACCEPTED',
  REQUEST_SUBMITTED: 'DD_REQUEST_SUBMITTED',
  RECORD_FOUND: 'DD_RECORD_FOUND',
  RECORD_NOT_FOUND: 'DD_RECORD_NOT_FOUND',
  CANCELLATION_SUCCESS: 'DD_CANCELLATION_REQUEST_PROCESSED_SUCCESSFULLY',
  CANCELLATION_FAILED: 'DD_CANCELLATION_REQUEST_FAILED',
} as const;
