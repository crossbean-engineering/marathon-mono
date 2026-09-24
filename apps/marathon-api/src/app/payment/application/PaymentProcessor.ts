import { Injectable } from '@rabstack/rab-api';
import crypto from 'crypto';
import type {
  CollectionInitPaymentRequest,
  CollectionInitPaymentResponse,
} from '@api/framework';
import { MojoCollectionIntegration } from '@marathon-api/integration';
import { generateTransactionId } from '@marathon-api/lib';

export type ProcessPaymentInput = {
  amount: number; // pesewas
  currency: string;
  mobile: string;
  network: string;
  email?: string;
  customerName: string;
  orderDescription: string;
};

export type ProcessPaymentOutput = {
  orderId: string;
  transactionId: string;
  request: CollectionInitPaymentRequest;
  response: CollectionInitPaymentResponse;
};

@Injectable()
export class PaymentProcessor {
  constructor(private mojo: MojoCollectionIntegration) {}

  async execute(input: ProcessPaymentInput): Promise<ProcessPaymentOutput> {
    const orderId = generateTransactionId();
    const transactionId = crypto.randomBytes(16).toString('hex');
    const request: CollectionInitPaymentRequest = {
      CustomerName: input.customerName,
      Network: input.network,
      Mobile: input.mobile,
      Email: input.email,
      Currency: input.currency,
      CountryCode: 'GHA',
      Amount: input.amount / 100, // pesewas -> GHS
      OrderId: transactionId, // Mojo OrderId == our 32-char transactionId
      OrderDesc: input.orderDescription,
    };
    const response = await this.mojo.initPaymentWithConfig(request);
    return { orderId, transactionId, request, response };
  }
}
