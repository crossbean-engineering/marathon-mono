import { RabApi } from '@rabstack/rab-api';
import { CreateMerchandise } from './api/CreateMerchandise';
import { ListMerchandise } from './api/ListMerchandise';
import { GetMerchandise } from './api/GetMerchandise';
import { UpdateMerchandise } from './api/UpdateMerchandise';
import { DeleteMerchandise } from './api/DeleteMerchandise';

export const merchandiseRouter = RabApi.createRouter({
  basePath: '',
  tags: ['Merchandise'],
  controllers: [
    CreateMerchandise,
    ListMerchandise,
    GetMerchandise,
    UpdateMerchandise,
    DeleteMerchandise,
  ],
});
