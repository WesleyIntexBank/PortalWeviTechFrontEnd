export interface Enterprise {
  id?: number;
  name: string;
  cnpj: string;
  email: string;
  phone: string;
  address?: string;
  city?: string;
  state?: string;
  active: boolean;
  createdAt?: string;
}
