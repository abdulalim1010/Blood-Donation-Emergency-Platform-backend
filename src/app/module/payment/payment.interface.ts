export interface CreatePaymentPayload {
  amount: number;
  message?: string;
  isAnonymous?: boolean;
}