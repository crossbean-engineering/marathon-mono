import { Injectable } from '@rabstack/rab-api';
import {
  GenerateWristbandsBody,
  GenerateWristbandsResponse,
} from '@marathon/core';
import { randomBytes } from 'crypto';
import { db } from '@marathon-api/core';
import { WristbandSelect, mapWristband } from './lib';

const DEFAULT_COUNT = 10;
const MAX_COUNT = 100;

export type GenerateWristbandsUseCaseParams = {
  payload: GenerateWristbandsBody;
};

@Injectable()
export class GenerateWristbandsUseCase {
  async execute(
    params: GenerateWristbandsUseCaseParams,
    retries = 3,
  ): Promise<GenerateWristbandsResponse> {
    const count = Math.min(params.payload.count ?? DEFAULT_COUNT, MAX_COUNT);
    const codes = this.generateUniqueCodes(count);

    try {
      const wristbands = await db.$transaction(
        codes.map((code) =>
          db.wristband.create({
            data: { code, status: 'available', isPrinted: false },
            select: WristbandSelect,
          }),
        ),
      );
      return {
        generated: wristbands.length,
        wristbands: wristbands.map(mapWristband),
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      // P2002: Prisma unique constraint violation — retry with fresh codes
      if (error?.code === 'P2002' && retries > 0) {
        return this.execute(params, retries - 1);
      }
      throw error;
    }
  }

  private generateUniqueCodes(count: number): string[] {
    const codes = new Set<string>();
    while (codes.size < count) {
      codes.add(this.generateCode());
    }
    return Array.from(codes);
  }

  private generateCode(): string {
    // 6 random bytes → 12 hex chars, trimmed to 11 for a 4-4-3 style code
    return randomBytes(6).toString('hex').toUpperCase().slice(0, 11);
  }
}
