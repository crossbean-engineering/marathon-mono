import { Injectable, NotFoundException } from '@rabstack/rab-api';
import { BaseMerchandise, ErrorCode } from '@marathon/core';
import { db } from '@marathon-api/core';
import { MerchandiseSelect, mapMerchandise } from './lib';

export type GetMerchandiseUseCaseParams = {
  id: string;
};

@Injectable()
export class GetMerchandiseUseCase {
  async execute(params: GetMerchandiseUseCaseParams): Promise<BaseMerchandise> {
    const row = await db.merchandise.findUnique({
      where: { id: params.id },
      select: MerchandiseSelect,
    });

    if (!row) {
      throw new NotFoundException(
        'Merchandise not found',
        ErrorCode.MERCHANDISE_NOT_FOUND,
      );
    }

    return mapMerchandise(row);
  }
}
