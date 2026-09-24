import { Injectable } from '@rabstack/rab-api';
import { BasePackage } from '@marathon/core';
import { db } from '@marathon-api/core';
import { PackageInclude, mapPackage } from './lib';

@Injectable()
export class ListPackagesUseCase {
  async execute(): Promise<BasePackage[]> {
    const rows = await db.package.findMany({
      orderBy: { createdAt: 'desc' },
      include: PackageInclude,
    });

    return rows.map(mapPackage);
  }
}
