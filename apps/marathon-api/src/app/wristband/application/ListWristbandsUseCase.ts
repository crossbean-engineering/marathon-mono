import { Injectable } from '@rabstack/rab-api';
import { BaseWristband, WristbandStatus } from '@marathon/core';
import { db } from '@marathon-api/core';
import { WristbandSelect, mapWristband } from './lib';

export type ListWristbandsUseCaseParams = {
  status?: WristbandStatus;
};

@Injectable()
export class ListWristbandsUseCase {
  async execute(params: ListWristbandsUseCaseParams): Promise<BaseWristband[]> {
    const rows = await db.wristband.findMany({
      where: { status: params.status },
      orderBy: { createdAt: 'desc' },
      select: WristbandSelect,
    });

    return rows.map(mapWristband);
  }
}
