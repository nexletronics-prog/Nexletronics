export interface Service {
  id: string;

  name: string;

  slug: string;

  category: string;

  shortDescription: string;

  description: string;

  price?: number;

  priceLabel?: string;

  image?: string;

  featured?: boolean;

  active: boolean;

  createdAt?: unknown;

  updatedAt?: unknown;
}