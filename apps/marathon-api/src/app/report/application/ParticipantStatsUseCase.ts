import { Injectable } from '@rabstack/rab-api';
import {
  GenderDistribution,
  ParticipantStats,
  ShirtSizeDistribution,
} from '@marathon/core';
import { db } from '@marathon-api/core';

const UNSPECIFIED = 'unspecified';

@Injectable()
export class ParticipantStatsUseCase {
  async execute(): Promise<ParticipantStats> {
    // One grouped query per dimension rather than a count per bucket.
    const [byStatus, byGender, byShirtSize] = await Promise.all([
      db.participant.groupBy({ by: ['status'], _count: { _all: true } }),
      db.participant.groupBy({ by: ['gender'], _count: { _all: true } }),
      db.participant.groupBy({ by: ['shirtSize'], _count: { _all: true } }),
    ]);

    const statusCount = (status: 'pending' | 'active' | 'suspended'): number =>
      byStatus.find((row) => row.status === status)?._count._all ?? 0;

    const genderDistribution: GenderDistribution = {
      male: 0,
      female: 0,
      unspecified: 0,
    };
    for (const row of byGender) {
      const key = row.gender ?? UNSPECIFIED;
      genderDistribution[key] = row._count._all;
    }

    // shirtSize is free text, so the keys are whatever was recorded. Sizes are
    // normalised to upper case so 'l' and 'L' land in the same bucket.
    const shirtSizeDistribution: ShirtSizeDistribution = {};
    for (const row of byShirtSize) {
      const size = row.shirtSize?.trim();
      const key = size ? size.toUpperCase() : UNSPECIFIED;
      shirtSizeDistribution[key] =
        (shirtSizeDistribution[key] ?? 0) + row._count._all;
    }

    const pending = statusCount('pending');
    const active = statusCount('active');
    const suspended = statusCount('suspended');

    return {
      total: pending + active + suspended,
      pending,
      active,
      suspended,
      genderDistribution,
      shirtSizeDistribution,
    };
  }
}
