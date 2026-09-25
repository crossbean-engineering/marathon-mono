import { Injectable } from '@rabstack/rab-api';
import { BaseAddOn, CreateAddOnBody } from '@marathon/core';
import { db } from '@marathon-api/core';
import { AddOnSelect, mapAddOn } from './lib';

export type CreateAddOnUseCaseParams = {
  payload: CreateAddOnBody;
};

@Injectable()
export class CreateAddOnUseCase {
  async execute(params: CreateAddOnUseCaseParams): Promise<BaseAddOn> {
    const { payload } = params;

    const row = await db.addOn.create({
      data: {
        type: payload.type,
        name: payload.name,
        provider: payload.provider,
        description: payload.description,
        // Occupancy only means something for a room.
        occupancy: payload.type === 'accommodation' ? payload.occupancy : null,
        price: payload.price,
        capacity: payload.capacity,
        isActive: payload.isActive,
      },
      select: AddOnSelect,
    });

    return mapAddOn(row);
  }
}
