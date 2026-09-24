import { Injectable, NotFoundException } from '@rabstack/rab-api';
import { ErrorCode } from '@marathon/core';
import { db } from '@marathon-api/core';

export type DeleteWristbandUseCaseParams = {
  id: string;
};

@Injectable()
export class DeleteWristbandUseCase {
  async execute(
    params: DeleteWristbandUseCaseParams,
  ): Promise<{ success: true }> {
    const existing = await db.wristband.findUnique({
      where: { id: params.id },
      select: { id: true },
    });

    if (!existing) {
      throw new NotFoundException(
        'Wristband not found',
        ErrorCode.WRISTBAND_NOT_FOUND,
      );
    }

    await db.wristband.delete({ where: { id: params.id } });

    return { success: true };
  }
}
