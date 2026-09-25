import { Injectable } from '@rabstack/rab-api';
import { BaseAddOn, ListAddOnsQuery } from '@marathon/core';
import { db } from '@marathon-api/core';
import { AddOnSelect, mapAddOn } from './lib';

@Injectable()
export class ListAddOnsUseCase {
  async execute(params: ListAddOnsQuery): Promise<BaseAddOn[]> {
    const rows = await db.addOn.findMany({
      where: {
        type: params.type,
        // Default to bookable add-ons only; admin passes activeOnly=false.
        isActive: params.activeOnly === false ? undefined : true,
      },
      select: AddOnSelect,
      orderBy: [{ type: 'asc' }, { price: 'asc' }],
    });

    return rows.map(mapAddOn);
  }
}
