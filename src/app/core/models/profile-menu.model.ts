export interface ProfileMenu {
  id?: number;
  profileId: number;
  menuId: number;
  profile?: { id: number; name: string };
  menu?: { id: number; name: string; icon: string; route: string };
}
