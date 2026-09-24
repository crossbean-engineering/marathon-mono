import { Injectable, BadRequestException } from '@rabstack/rab-api';
import { BasePackage, CreatePackageBody, ErrorCode } from '@marathon/core';
import { db } from '@marathon-api/core';
import { PackageInclude, mapPackage } from './lib';

export type CreatePackageUseCaseParams = {
  payload: CreatePackageBody;
};

@Injectable()
export class CreatePackageUseCase {
  async execute(params: CreatePackageUseCaseParams): Promise<BasePackage> {
    const { name, price, benefits, merchandiseIds, prizes } = params.payload;

    const taken = await db.package.findUnique({ where: { name } });
    if (taken) {
      throw new BadRequestException(
        'Package name already exists',
        undefined,
        ErrorCode.INVALID_INPUT,
      );
    }

    const row = await db.package.create({
      data: {
        name,
        price,
        benefits,
        merchandise: merchandiseIds?.length
          ? { connect: merchandiseIds.map((id) => ({ id })) }
          : undefined,
        prizes: prizes?.length
          ? {
              create: prizes.map((p) => ({
                name: p.name,
                amount: p.amount,
                position: p.position,
                description: p.description,
              })),
            }
          : undefined,
      },
      include: PackageInclude,
    });

    return mapPackage(row);
  }
}
