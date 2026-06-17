export interface User {
  id?: number;
  name: string;
  shortName?: string;
  email: string;
  cpf?: string;
  password?: string;
  profileId: number;
  profile?: { id: number; name: string };
  enterpriseId: number;
  enterprise?: { id: number; name: string };
  blocked?: boolean;
  active?: boolean;
  hubConnection?: boolean;
  photo?: string;
  isA2F?: number;
  dataNasc?: string;
  userName?: string;
  seg?: boolean;
  ter?: boolean;
  qua?: boolean;
  qui?: boolean;
  sex?: boolean;
  sab?: boolean;
  dom?: boolean;
  createdAt?: string;
}
