import { Injectable, NotFoundException } from '@rabstack/rab-api';
import { BaseAddOn, ErrorCode, UpdateAddOnBody } from '@marathon/core';
import { db } from '@marathon-api/core';
import { AddOnSelect, mapAddOn } from './lib';

export type UpdateAddOnUseCaseParams = {
  id: string;
  payload: UpdateAddOnBody;
};

// Price changes apply to new bookings only — existing bookings keep the price
// snapshot they were charged.
@Injectable()
export class UpdateAddOnUseCase {
  async execute(params: UpdateAddOnUseCaseParams): Promise<BaseAddOn> {
    const { id, payload } = params;

    const existing = await db.addOn.findUnique({
      where: { id },
      select: { type: true },
    });
    if (!existing) {
      throw new NotFoundException('Add-on not found', ErrorCode.ADD_ON_NOT_FOUND);
    }

    const row = await db.addOn.update({
      where: { id },
      data: {
        name: payload.name,
        provider: payload.provider,
        description: payload.description,
        occupancy:
          existing.type === 'accommodation' ? payload.occupancy : undefined,
        price: payload.price,
        capacity: payload.capacity,
        isActive: payload.isActive,
      },
      select: AddOnSelect,
    });

    return mapAddOn(row);
  }
}
