import { RabApiGet, Get, GetController } from '@rabstack/rab-api';
import { ServerHealth } from '@marathon/core';
import { MarathonApiMeta } from '@marathon-api/core';

type ControllerT = GetController<ServerHealth>;

@Get('/health-check', { isProtected: false })
export class ServerHealthCheck implements RabApiGet<ControllerT> {
  handler: ControllerT['request'] = async () => {
    return {
      appVersion: MarathonApiMeta.appVersion,
      version: '1.0.0',
      message: 'welcome to marathon api',
      environment: MarathonApiMeta.environment,
      commitSha: MarathonApiMeta.commitSha,
    };
  };
}
