import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@rabstack/rab-api';
import {
  CollectedMerchandise,
  ErrorCode,
  SetCollectedMerchandiseBody,
  SetCollectedMerchandiseResponse,
} from '@marathon/core';
import { db } from '@marathon-api/core';

export type SetCollectedMerchandiseUseCaseParams = {
  id: string;
  payload: SetCollectedMerchandiseBody;
};

// Reconciles the participant's collected merchandise against the ids sent.
// The payload is the desired final state, so the frontend can just send back
// whatever its checkboxes say: ids not yet recorded are added, recorded ids
// left out are removed, and ids already recorded are left alone so their
// original collectedAt survives.
@Injectable()
export class SetCollectedMerchandiseUseCase {
  async execute(
    params: SetCollectedMerchandiseUseCaseParams,
  ): Promise<SetCollectedMerchandiseResponse> {
    const { id } = params;
    // The same id twice is the same single item.
    const desiredIds = [...new Set(params.payload.merchandiseIds)];

    // Resolve + validate everything before the first write.
    const participant = await db.participant.findUnique({
      where: { id },
      select: {
        id: true,
        package: { select: { merchandise: { select: { id: true } } } },
        collectedMerchandise: { select: { merchandiseId: true } },
      },
    });
    if (!participant) {
      throw new NotFoundException(
        'Participant not found',
        ErrorCode.PARTICIPANT_NOT_FOUND,
      );
    }

    const currentIds = new Set(
      participant.collectedMerchandise.map((row) => row.merchandiseId),
    );

    const toAdd = desiredIds.filter((mid) => !currentIds.has(mid));
    const toRemove = [...currentIds].filter((mid) => !desiredIds.includes(mid));
    const unchanged = desiredIds.filter((mid) => currentIds.has(mid));

    // Only newly added items are checked against the package. Anything already
    // recorded is grandfathered, so editing a package later cannot make an
    // existing collection impossible to re-save.
    if (toAdd.length > 0) {
      const packageMerchandiseIds = new Set(
        participant.package.merchandise.map((item) => item.id),
      );
      const notInPackage = toAdd.filter(
        (mid) => !packageMerchandiseIds.has(mid),
      );
      if (notInPackage.length > 0) {
        throw new BadRequestException(
          `Merchandise not included in this participant's package: ${notInPackage.join(', ')}`,
          undefined,
          ErrorCode.MERCHANDISE_NOT_IN_PACKAGE,
        );
      }
    }

    if (toAdd.length > 0 || toRemove.length > 0) {
      await db.$transaction(async (tx) => {
        if (toRemove.length > 0) {
          await tx.participantMerchandise.deleteMany({
            where: { participantId: id, merchandiseId: { in: toRemove } },
          });
        }
        if (toAdd.length > 0) {
          await tx.participantMerchandise.createMany({
            data: toAdd.map((merchandiseId) => ({
              participantId: id,
              merchandiseId,
            })),
          });
        }
      });
    }

    return {
      participantId: id,
      collected: await this.listCollected(id),
      added: toAdd,
      removed: toRemove,
      unchanged,
    };
  }

  private async listCollected(
    participantId: string,
  ): Promise<CollectedMerchandise[]> {
    const rows = await db.participantMerchandise.findMany({
      where: { participantId },
      include: { merchandise: { select: { name: true, description: true } } },
      orderBy: { collectedAt: 'asc' },
    });

    return rows.map((row) => ({
      merchandiseId: row.merchandiseId,
      name: row.merchandise.name,
      description: row.merchandise.description,
      collectedAt: row.collectedAt.toISOString(),
    }));
  }
}
