import { Injectable, NotFoundException } from '@rabstack/rab-api';
import {
  BaseWristband,
  ErrorCode,
  UpdateWristbandBody,
} from '@marathon/core';
import { db } from '@marathon-api/core';
import { WristbandSelect, mapWristband } from './lib';

export type UpdateWristbandUseCaseParams = {
  id: string;
  payload: UpdateWristbandBody;
};

@Injectable()
export class UpdateWristbandUseCase {
  async execute(params: UpdateWristbandUseCaseParams): Promise<BaseWristband> {
    const { id, payload } = params;

    const existing = await db.wristband.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(
        'Wristband not found',
        ErrorCode.WRISTBAND_NOT_FOUND,
      );
    }

    const row = await db.wristband.update({
      where: { id },
      data: { status: payload.status, isPrinted: payload.isPrinted },
      select: WristbandSelect,
    });

    return mapWristband(row);
  }
}
