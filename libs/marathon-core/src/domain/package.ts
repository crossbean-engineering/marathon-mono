import { BaseMerchandise } from './merchandise';
import { BasePrize } from './prize';

export type BasePackage = {
  id: string;
  name: string;
  price: number;
  benefits?: string | null;
  merchandise: BaseMerchandise[];
  prizes: BasePrize[];
  createdAt: string;
};

// Lightweight package info embedded on a participant — scalar fields only,
// without the heavy merchandise/prizes relations.
export type PackageSummary = Pick<
  BasePackage,
  'id' | 'name' | 'price' | 'benefits'
>;

// A prize input used inline on both create and update.
// `id` present => update the existing prize; absent => create a new one.
export type PackagePrizeInput = {
  id?: string;
  name: string;
  amount?: number;
  position?: number;
  description?: string;
};

export type CreatePackageBody = {
  name: string;
  price: number;
  benefits?: string;
  merchandiseIds?: string[];
  prizes?: PackagePrizeInput[];
};

export type UpdatePackageBody = {
  name?: string;
  price?: number;
  benefits?: string;
  merchandiseIds?: string[];
  prizes?: PackagePrizeInput[];
};
