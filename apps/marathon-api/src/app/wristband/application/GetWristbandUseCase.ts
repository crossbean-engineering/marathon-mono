import { Injectable, NotFoundException } from '@rabstack/rab-api';
import { BaseWristband, ErrorCode } from '@marathon/core';
import { db } from '@marathon-api/core';
import { WristbandSelect, mapWristband } from './lib';

export type GetWristbandUseCaseParams = {
  id: string;
};

@Injectable()
export class GetWristbandUseCase {
  async execute(params: GetWristbandUseCaseParams): Promise<BaseWristband> {
    const row = await db.wristband.findUnique({
      where: { id: params.id },
      select: WristbandSelect,
    });

    if (!row) {
      throw new NotFoundException(
        'Wristband not found',
        ErrorCode.WRISTBAND_NOT_FOUND,
      );
    }

    return mapWristband(row);
  }
}
