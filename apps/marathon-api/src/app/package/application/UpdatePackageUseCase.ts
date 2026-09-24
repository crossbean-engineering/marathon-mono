import { Injectable, NotFoundException } from '@rabstack/rab-api';
import { BasePackage, ErrorCode, UpdatePackageBody } from '@marathon/core';
import { db } from '@marathon-api/core';
import { PackageInclude, mapPackage } from './lib';

export type UpdatePackageUseCaseParams = {
  id: string;
  payload: UpdatePackageBody;
};

@Injectable()
export class UpdatePackageUseCase {
  async execute(params: UpdatePackageUseCaseParams): Promise<BasePackage> {
    const { id, payload } = params;

    const existing = await db.package.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(
        'Package not found',
        ErrorCode.PACKAGE_NOT_FOUND,
      );
    }

    const updated = await db.$transaction(async (tx) => {
      await tx.package.update({
        where: { id },
        data: {
          name: payload.name,
          price: payload.price,
          benefits: payload.benefits,
          merchandise: payload.merchandiseIds
            ? { set: payload.merchandiseIds.map((mid) => ({ id: mid })) }
            : undefined,
        },
      });

      for (const prize of payload.prizes ?? []) {
        if (prize.id) {
          // update an existing prize; scope by packageId so a foreign prize id can't be hijacked
          await tx.prize.updateMany({
            where: { id: prize.id, packageId: id },
            data: {
              name: prize.name,
              amount: prize.amount,
              position: prize.position,
              description: prize.description,
            },
          });
        } else {
          await tx.prize.create({
            data: {
              packageId: id,
              name: prize.name,
              amount: prize.amount,
              position: prize.position,
              description: prize.description,
            },
          });
        }
      }

      return tx.package.findUnique({ where: { id }, include: PackageInclude });
    });

    return mapPackage(updated!);
  }
}
