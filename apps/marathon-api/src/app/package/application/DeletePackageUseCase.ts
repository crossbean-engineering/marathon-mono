import { Injectable, NotFoundException } from '@rabstack/rab-api';
import { ErrorCode } from '@marathon/core';
import { db } from '@marathon-api/core';

export type DeletePackageUseCaseParams = {
  id: string;
};

@Injectable()
export class DeletePackageUseCase {
  async execute(
    params: DeletePackageUseCaseParams,
  ): Promise<{ success: true }> {
    const existing = await db.package.findUnique({
      where: { id: params.id },
      select: { id: true },
    });

    if (!existing) {
      throw new NotFoundException(
        'Package not found',
        ErrorCode.PACKAGE_NOT_FOUND,
      );
    }

    await db.package.delete({ where: { id: params.id } });

    return { success: true };
  }
}
