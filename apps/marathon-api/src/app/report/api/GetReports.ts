import { Get, RabApiGet } from '@rabstack/rab-api';
import { MarathonApis } from '@marathon/core';
import { ApiSpec, AppAccess } from '@marathon-api/shared';
import { ReportFactory } from '../application';
import { reportQuerySchema } from './lib/schemas';

type ControllerT = ApiSpec<'reports'>;

@Get(MarathonApis.reports, {
  permission: AppAccess.canReadReports,
  querySchema: reportQuerySchema,
})
export class GetReports implements RabApiGet<ControllerT> {
  constructor(private reportFactory: ReportFactory) {}
  handler: ControllerT['request'] = async (request) => {
    const { reportType } = request.query;
    const useCase = this.reportFactory.getReportUseCase(reportType);
    return { reportType, rows: await useCase.execute() };
  };
}
