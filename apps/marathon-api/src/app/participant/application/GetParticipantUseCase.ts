import { Injectable, NotFoundException } from '@rabstack/rab-api';
import { BaseParticipant, ErrorCode } from '@marathon/core';
import { db } from '@marathon-api/core';
import {
  mapParticipant,
  PackageSummarySelect,
  CollectedMerchandiseInclude,
} from './lib';
import { ParticipantAddOnInclude } from '@marathon-api/app/addOn';

export type GetParticipantUseCaseParams = {
  id: string;
};

@Injectable()
export class GetParticipantUseCase {
  async execute(params: GetParticipantUseCaseParams): Promise<BaseParticipant> {
    const row = await db.participant.findUnique({
      where: { id: params.id },
      include: {
        wristband: { select: { code: true } },
        package: { select: PackageSummarySelect },
        collectedMerchandise: CollectedMerchandiseInclude,
        addOns: ParticipantAddOnInclude,
      },
    });

    if (!row) {
      throw new NotFoundException(
        'Participant not found',
        ErrorCode.PARTICIPANT_NOT_FOUND,
      );
    }

    return mapParticipant(row);
  }
}
