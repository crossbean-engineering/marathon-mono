import { RabApi } from '@rabstack/rab-api';
import { BuyPackage } from './api/BuyPackage';
import { ClaimFreePackage } from './api/ClaimFreePackage';
import { ListParticipants } from './api/ListParticipants';
import { ExportParticipants } from './api/ExportParticipants';
import { GetParticipant } from './api/GetParticipant';
import { CheckInParticipant } from './api/CheckInParticipant';
import { SetCollectedMerchandise } from './api/SetCollectedMerchandise';

export const participantRouter = RabApi.createRouter({
  basePath: '',
  tags: ['Participant'],
  controllers: [
    BuyPackage,
    // Before GetParticipant so /participants/claim and /participants/export
    // are matched ahead of the /participants/:id parameter route.
    ClaimFreePackage,
    ListParticipants,
    ExportParticipants,
    CheckInParticipant,
    SetCollectedMerchandise,
    GetParticipant,
  ],
});
