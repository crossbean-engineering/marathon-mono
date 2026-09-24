import { Get, RabApiGet } from '@rabstack/rab-api';
import { MarathonApis } from '@marathon/core';
import { ApiSpec, AppAccess } from '@marathon-api/shared';
import { StatsFactory } from '../application';
import { statsQuerySchema } from './lib/schemas';

type ControllerT = ApiSpec<'stats'>;

@Get(MarathonApis.stats, {
  permission: AppAccess.canReadReports,
  querySchema: statsQuerySchema,
})
export class GetStats implements RabApiGet<ControllerT> {
  constructor(private statsFactory: StatsFactory) {}
  handler: ControllerT['request'] = async (request) => {
    const useCase = this.statsFactory.getStatsUseCase(request.query.type);
    return await useCase.execute();
  };
}
