import { Injectable } from '@rabstack/rab-api';
import { BaseParticipant, Gender, ParticipantStatus } from '@marathon/core';
import { db } from '@marathon-api/core';
import { mapParticipant, PackageSummarySelect } from './lib';

export type ListParticipantsUseCaseParams = {
  packageId?: string;
  status?: ParticipantStatus;
  code?: string;
  userId?: string;
  wristbandCode?: string;
  gender?: Gender;
  shirtSize?: string;
};

@Injectable()
export class ListParticipantsUseCase {
  async execute(
    params: ListParticipantsUseCaseParams,
  ): Promise<BaseParticipant[]> {
    const rows = await db.participant.findMany({
      where: {
        packageId: params.packageId,
        status: params.status,
        code: params.code,
        userId: params.userId,
        gender: params.gender,
        // shirtSize is free text, so match case-insensitively — 'l' and 'L'
        // are the same size.
        shirtSize: params.shirtSize
          ? { equals: params.shirtSize, mode: 'insensitive' }
          : undefined,
        wristband: params.wristbandCode
          ? { code: params.wristbandCode }
          : undefined,
      },
      include: {
        wristband: { select: { code: true } },
        package: { select: PackageSummarySelect },
      },
      orderBy: { createdAt: 'desc' },
    });

    return rows.map(mapParticipant);
  }
}
