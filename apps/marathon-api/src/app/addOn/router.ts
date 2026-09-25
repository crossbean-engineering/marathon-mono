import { RabApi } from '@rabstack/rab-api';
import { CreateAddOn } from './api/CreateAddOn';
import { ListAddOns } from './api/ListAddOns';
import { GetAddOn } from './api/GetAddOn';
import { UpdateAddOn } from './api/UpdateAddOn';
import { DeleteAddOn } from './api/DeleteAddOn';

export const addOnRouter = RabApi.createRouter({
  basePath: '',
  tags: ['Add-ons'],
  controllers: [CreateAddOn, ListAddOns, GetAddOn, UpdateAddOn, DeleteAddOn],
});
