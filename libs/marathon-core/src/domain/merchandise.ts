export type BaseMerchandise = {
  id: string;
  name: string;
  description?: string | null;
  createdAt: string;
};

export type CreateMerchandiseBody = {
  name: string;
  description?: string;
};

export type UpdateMerchandiseBody = Partial<CreateMerchandiseBody>;
