import { Injectable, NotFoundException } from '@rabstack/rab-api';
import {
  BaseMerchandise,
  ErrorCode,
  UpdateMerchandiseBody,
} from '@marathon/core';
import { db } from '@marathon-api/core';
import { MerchandiseSelect, mapMerchandise } from './lib';

export type UpdateMerchandiseUseCaseParams = {
  id: string;
  payload: UpdateMerchandiseBody;
};

@Injectable()
export class UpdateMerchandiseUseCase {
  async execute(
    params: UpdateMerchandiseUseCaseParams,
  ): Promise<BaseMerchandise> {
    const { id, payload } = params;

    const existing = await db.merchandise.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(
        'Merchandise not found',
        ErrorCode.MERCHANDISE_NOT_FOUND,
      );
    }

    const row = await db.merchandise.update({
      where: { id },
      data: { name: payload.name, description: payload.description },
      select: MerchandiseSelect,
    });

    return mapMerchandise(row);
  }
}
