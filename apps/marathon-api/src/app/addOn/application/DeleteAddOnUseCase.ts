import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@rabstack/rab-api';
import { ErrorCode } from '@marathon/core';
import { db } from '@marathon-api/core';

export type DeleteAddOnUseCaseParams = {
  id: string;
};

// Only an add-on nobody has booked can be deleted. Once booked it is part of
// registration and payment history, so it is deactivated instead.
@Injectable()
export class DeleteAddOnUseCase {
  async execute(params: DeleteAddOnUseCaseParams): Promise<{ success: true }> {
    const existing = await db.addOn.findUnique({
      where: { id: params.id },
      select: { id: true, _count: { select: { bookings: true } } },
    });
    if (!existing) {
      throw new NotFoundException('Add-on not found', ErrorCode.ADD_ON_NOT_FOUND);
    }
    if (existing._count.bookings > 0) {
      throw new BadRequestException(
        'This add-on has bookings — deactivate it instead',
        undefined,
        ErrorCode.ADD_ON_IN_USE,
      );
    }

    await db.addOn.delete({ where: { id: params.id } });

    return { success: true };
  }
}
