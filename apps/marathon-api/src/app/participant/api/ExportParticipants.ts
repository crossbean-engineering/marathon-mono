import { Get, RabApiGet } from '@rabstack/rab-api';
import Joi from 'joi';
import { MarathonApis } from '@marathon/core';
import { ApiSpec, AppAccess } from '@marathon-api/shared';
import { ListParticipantsUseCase } from '../application';
import { participantsToXlsx } from './lib/excel';

type ControllerT = ApiSpec<'exportParticipants'>;

// Same filters as listParticipants — one filter set, two renderings.
@Get(MarathonApis.exportParticipants, {
  permission: AppAccess.canReadParticipants,
  querySchema: Joi.object({
    packageId: Joi.string().optional(),
    status: Joi.string().valid('pending', 'active', 'suspended').optional(),
    code: Joi.string().optional(),
    userId: Joi.string().optional(),
    wristbandCode: Joi.string().optional(),
    gender: Joi.string().valid('male', 'female').optional(),
    shirtSize: Joi.string().trim().optional(),
    addOnId: Joi.string().optional(),
  }),
})
export class ExportParticipants implements RabApiGet<ControllerT> {
  constructor(private useCase: ListParticipantsUseCase) {}
  handler: ControllerT['request'] = async (request) => {
    const participants = await this.useCase.execute({
      packageId: request.query.packageId,
      status: request.query.status,
      code: request.query.code,
      userId: request.query.userId,
      wristbandCode: request.query.wristbandCode,
      gender: request.query.gender,
      shirtSize: request.query.shirtSize,
      addOnId: request.query.addOnId,
    });

    const workbook = await participantsToXlsx(participants);
    const filename = `participants_${new Date().toISOString().split('T')[0]}.xlsx`;

    request.res!.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    request.res!.setHeader(
      'Content-Disposition',
      `attachment; filename="${filename}"`,
    );
    request.res!.send(workbook);
    return undefined as any;
  };
}
