import { RabApi } from '@rabstack/rab-api';
import { GenerateWristbands } from './api/GenerateWristbands';
import { ListWristbands } from './api/ListWristbands';
import { GetWristband } from './api/GetWristband';
import { UpdateWristband } from './api/UpdateWristband';
import { DeleteWristband } from './api/DeleteWristband';
import { RedeemWristband } from './api/RedeemWristband';

export const wristbandRouter = RabApi.createRouter({
  basePath: '',
  tags: ['Wristband'],
  controllers: [
    GenerateWristbands,
    ListWristbands,
    GetWristband,
    UpdateWristband,
    DeleteWristband,
    RedeemWristband,
  ],
});
