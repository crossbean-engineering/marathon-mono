import { Injectable, NotFoundException } from '@rabstack/rab-api';
import { ErrorCode } from '@marathon/core';
import { db } from '@marathon-api/core';

export type DeletePrizeUseCaseParams = {
  packageId: string;
  prizeId: string;
};

@Injectable()
export class DeletePrizeUseCase {
  async execute(params: DeletePrizeUseCaseParams): Promise<{ success: true }> {
    const { count } = await db.prize.deleteMany({
      where: { id: params.prizeId, packageId: params.packageId },
    });

    if (count === 0) {
      throw new NotFoundException('Prize not found', ErrorCode.PRIZE_NOT_FOUND);
    }

    return { success: true };
  }
}
