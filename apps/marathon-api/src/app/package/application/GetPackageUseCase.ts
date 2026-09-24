import { Injectable, NotFoundException } from '@rabstack/rab-api';
import { BasePackage, ErrorCode } from '@marathon/core';
import { db } from '@marathon-api/core';
import { PackageInclude, mapPackage } from './lib';

export type GetPackageUseCaseParams = {
  id: string;
};

@Injectable()
export class GetPackageUseCase {
  async execute(params: GetPackageUseCaseParams): Promise<BasePackage> {
    const row = await db.package.findUnique({
      where: { id: params.id },
      include: PackageInclude,
    });

    if (!row) {
      throw new NotFoundException(
        'Package not found',
        ErrorCode.PACKAGE_NOT_FOUND,
      );
    }

    return mapPackage(row);
  }
}
