import { Injectable, NotFoundException } from '@rabstack/rab-api';
import { ErrorCode } from '@marathon/core';
import { db } from '@marathon-api/core';

export type DeleteMerchandiseUseCaseParams = {
  id: string;
};

@Injectable()
export class DeleteMerchandiseUseCase {
  async execute(
    params: DeleteMerchandiseUseCaseParams,
  ): Promise<{ success: true }> {
    const existing = await db.merchandise.findUnique({
      where: { id: params.id },
      select: { id: true },
    });

    if (!existing) {
      throw new NotFoundException(
        'Merchandise not found',
        ErrorCode.MERCHANDISE_NOT_FOUND,
      );
    }

    await db.merchandise.delete({ where: { id: params.id } });

    return { success: true };
  }
}
