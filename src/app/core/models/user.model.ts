export interface User {
  id?: number;
  name: string;
  email: string;
  password?: string;
  profileId: number;
  enterpriseId: number;
  active: boolean;
  createdAt?: string;
  profile?: { id: number; name: string };
  enterprise?: { id: number; name: string };
}
