import { Injectable } from '@rabstack/rab-api';
import { SMSService as BaseSMSService } from '@api/framework';
import { HubtelIntegration } from './HubtelIntegration';
import { MarathonApiMeta } from '@marathon-api/core';

@Injectable()
export class SMSService extends BaseSMSService {
  constructor(hubtel: HubtelIntegration) {
    super(hubtel);
  }

  override async send(destination: string, message: string) {
    if (MarathonApiMeta.isDevelopment) {
      console.log(`[DEV] SMS to ${destination}: ${message}`);
    }
    return super.send(destination, message);
  }
}
