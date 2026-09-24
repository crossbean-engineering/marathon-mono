export interface SMSProvider {
  sendSMS(destination: string, message: string): Promise<{ messageId: string }>;
}
