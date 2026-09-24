import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@rabstack/rab-api';
import {
  BaseParticipant,
  CheckInParticipantBody,
  ErrorCode,
} from '@marathon/core';
import { db } from '@marathon-api/core';
import { mapParticipant, PackageSummarySelect } from './lib';

export type CheckInParticipantUseCaseParams = {
  id: string;
  payload: CheckInParticipantBody;
};

// Check a participant in at the event: assign their race number and record the
// shirt size actually issued. Admin/agent only.
@Injectable()
export class CheckInParticipantUseCase {
  async execute(
    params: CheckInParticipantUseCaseParams,
  ): Promise<BaseParticipant> {
    const { id, payload } = params;
    const runnerNumber = payload.runnerNumber.trim().toLowerCase();

    // Run every precondition before the write.
    const existing = await db.participant.findUnique({
      where: { id },
      select: { id: true, status: true, runnerNumber: true },
    });
    if (!existing) {
      throw new NotFoundException(
        'Participant not found',
        ErrorCode.PARTICIPANT_NOT_FOUND,
      );
    }
    if (existing.runnerNumber) {
      throw new BadRequestException(
        `Participant already checked in with runner number ${existing.runnerNumber}`,
        undefined,
        ErrorCode.PARTICIPANT_ALREADY_CHECKED_IN,
      );
    }

    const taken = await db.participant.findUnique({
      where: { runnerNumber },
      select: { id: true },
    });
    if (taken) {
      throw new BadRequestException(
        `Runner number ${runnerNumber} is already assigned`,
        undefined,
        ErrorCode.RUNNER_NUMBER_TAKEN,
      );
    }

    const row = await db.participant.update({
      where: { id },
      data: {
        runnerNumber,
        checkinDate: new Date(),
        // Only overwrite the recorded size when a new one was issued.
        shirtSize: payload.shirtSize?.trim(),
      },
      include: {
        wristband: { select: { code: true } },
        package: { select: PackageSummarySelect },
      },
    });

    return mapParticipant(row);
  }
}
