import { Injectable, NotFoundException } from '@rabstack/rab-api';
import { BaseAddOn, ErrorCode } from '@marathon/core';
import { db } from '@marathon-api/core';
import { AddOnSelect, mapAddOn } from './lib';

export type GetAddOnUseCaseParams = {
  id: string;
};

@Injectable()
export class GetAddOnUseCase {
  async execute(params: GetAddOnUseCaseParams): Promise<BaseAddOn> {
    const row = await db.addOn.findUnique({
      where: { id: params.id },
      select: AddOnSelect,
    });
    if (!row) {
      throw new NotFoundException('Add-on not found', ErrorCode.ADD_ON_NOT_FOUND);
    }
    return mapAddOn(row);
  }
}
