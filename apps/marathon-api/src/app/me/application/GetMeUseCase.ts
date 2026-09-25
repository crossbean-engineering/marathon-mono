import { Injectable, NotFoundException } from '@rabstack/rab-api';
import { MeResponse, ErrorCode } from '@marathon/core';
import { db } from '@marathon-api/core';
import { UserSelect, mapUser } from '@marathon-api/app/admin';
import {
  mapParticipant,
  PackageSummarySelect,
} from '@marathon-api/app/participant';
import { ParticipantAddOnInclude } from '@marathon-api/app/addOn';

export type GetMeUseCaseParams = { userId: string };

@Injectable()
export class GetMeUseCase {
  async execute(params: GetMeUseCaseParams): Promise<MeResponse> {
    const user = await db.user.findUnique({
      where: { id: params.userId },
      select: UserSelect,
    });
    if (!user) {
      throw new NotFoundException('User not found', ErrorCode.USER_NOT_FOUND);
    }

    const participants = await db.participant.findMany({
      where: { userId: params.userId },
      include: {
        wristband: { select: { code: true } },
        package: { select: PackageSummarySelect },
        addOns: ParticipantAddOnInclude,
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      user: mapUser(user),
      participants: participants.map(mapParticipant),
    };
  }
}
