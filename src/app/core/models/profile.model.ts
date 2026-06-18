export interface ProfileMenuItem {
  id?: number;
  profileId: number;
  menuId: number;
}

export interface Profile {
  id?: number;
  name?: string;        // mantido para compatibilidade
  description: string;  // campo real da API
  active: boolean;
  checked?: boolean;
  createdAt?: string;
  profileMenus?: ProfileMenuItem[];
}
