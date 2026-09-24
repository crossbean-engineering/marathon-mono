import { Injectable, NotFoundException, BadRequestException } from '@rabstack/rab-api';
import { RedeemWristbandBody, RedeemWristbandResponse, ErrorCode } from '@marathon/core';
import { db } from '@marathon-api/core';
import { mapWristband } from './lib';

export type RedeemWristbandUseCaseParams = { payload: RedeemWristbandBody };

@Injectable()
export class RedeemWristbandUseCase {
  async execute(
    params: RedeemWristbandUseCaseParams,
  ): Promise<RedeemWristbandResponse> {
    const { wristbandCode, participantCode } = params.payload;

    const wristband = await db.wristband.findUnique({
      where: { code: wristbandCode },
    });
    if (!wristband) {
      throw new NotFoundException(
        'Wristband not found',
        ErrorCode.WRISTBAND_NOT_FOUND,
      );
    }
    if (wristband.status === 'disabled') {
      throw new BadRequestException(
        'Wristband is disabled',
        undefined,
        ErrorCode.WRISTBAND_DISABLED,
      );
    }
    if (wristband.status === 'redeemed' || wristband.participantId) {
      throw new BadRequestException(
        'Wristband already linked',
        undefined,
        ErrorCode.WRISTBAND_ALREADY_LINKED,
      );
    }

    const participant = await db.participant.findUnique({
      where: { code: participantCode },
      include: { wristband: true },
    });
    if (!participant) {
      throw new NotFoundException(
        'Participant not found',
        ErrorCode.PARTICIPANT_NOT_FOUND,
      );
    }

    const updated = await db.$transaction(async (tx) => {
      if (participant.wristband && participant.wristband.status === 'redeemed') {
        await tx.wristband.update({
          where: { id: participant.wristband.id },
          data: { status: 'disabled', participantId: null },
        });
      }
      return tx.wristband.update({
        where: { id: wristband.id },
        data: { participantId: participant.id, status: 'redeemed' },
      });
    });

    return { wristband: mapWristband(updated) };
  }
}
