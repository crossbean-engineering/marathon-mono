import { Injectable } from '@rabstack/rab-api';
import { HubtelIntegration as BaseHubtelIntegration } from '@api/framework';
import { MarathonApiMeta } from '@marathon-api/core';

@Injectable()
export class HubtelIntegration extends BaseHubtelIntegration {
  constructor() {
    super(MarathonApiMeta.hubtel);
  }
}
