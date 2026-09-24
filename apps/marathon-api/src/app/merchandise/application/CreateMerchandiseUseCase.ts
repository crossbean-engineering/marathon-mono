import { Injectable } from '@rabstack/rab-api';
import { BaseMerchandise, CreateMerchandiseBody } from '@marathon/core';
import { db } from '@marathon-api/core';
import { MerchandiseSelect, mapMerchandise } from './lib';

export type CreateMerchandiseUseCaseParams = {
  payload: CreateMerchandiseBody;
};

@Injectable()
export class CreateMerchandiseUseCase {
  async execute(
    params: CreateMerchandiseUseCaseParams,
  ): Promise<BaseMerchandise> {
    const { name, description } = params.payload;

    const row = await db.merchandise.create({
      data: { name, description },
      select: MerchandiseSelect,
    });

    return mapMerchandise(row);
  }
}
