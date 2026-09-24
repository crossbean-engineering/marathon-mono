import { Injectable } from '@rabstack/rab-api';
import { BaseMerchandise } from '@marathon/core';
import { db } from '@marathon-api/core';
import { MerchandiseSelect, mapMerchandise } from './lib';

@Injectable()
export class ListMerchandiseUseCase {
  async execute(): Promise<BaseMerchandise[]> {
    const rows = await db.merchandise.findMany({
      orderBy: { createdAt: 'desc' },
      select: MerchandiseSelect,
    });

    return rows.map(mapMerchandise);
  }
}
