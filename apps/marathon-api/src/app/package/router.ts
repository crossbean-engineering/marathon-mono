import { RabApi } from '@rabstack/rab-api';
import { CreatePackage } from './api/CreatePackage';
import { ListPackages } from './api/ListPackages';
import { GetPackage } from './api/GetPackage';
import { UpdatePackage } from './api/UpdatePackage';
import { DeletePackage } from './api/DeletePackage';
import { DeletePrize } from './api/DeletePrize';

export const packageRouter = RabApi.createRouter({
  basePath: '',
  tags: ['Package'],
  controllers: [
    CreatePackage,
    ListPackages,
    GetPackage,
    UpdatePackage,
    DeletePackage,
    DeletePrize,
  ],
});
